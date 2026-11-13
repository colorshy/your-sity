import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const db = new PGlite();
const alice = "11111111-1111-4111-8111-111111111111",
  bob = "22222222-2222-4222-8222-222222222222";
let city, community, otherCity, otherCommunity, post, hiddenPost;
async function as(role, id = "") {
  await db.exec(`reset role; set role ${role};`);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
}
async function onboard(id, ids = []) {
  await as("authenticated", id);
  return db.query("select public.complete_onboarding($1,$2,$3::uuid[])", [
    "Resident",
    city,
    ids,
  ]);
}
before(async () => {
  await db.exec(
    "create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key,raw_user_meta_data jsonb not null default '{}'); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema public,auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;",
  );
  await db.exec(
    await readFile("supabase/migrations/202611130001_foundation.sql", "utf8"),
  );
  await db.query(
    "insert into auth.users(id,raw_user_meta_data) values($1,$3),($2,$3)",
    [alice, bob, JSON.stringify({ display_name: "Test Resident" })],
  );
  city = (await db.query("select id from cities")).rows[0].id;
  community = (
    await db.query("select id from communities order by slug limit 1")
  ).rows[0].id;
  otherCity = (
    await db.query(
      "insert into cities(slug,name_kk,name_ru) values('test-other','Test','Test') returning id",
    )
  ).rows[0].id;
  otherCommunity = (
    await db.query(
      "insert into communities(city_id,slug,name_kk,name_ru) values($1,'other','Test','Test') returning id",
      [otherCity],
    )
  ).rows[0].id;
  await onboard(alice, [community]);
  await onboard(bob, []);
  await as("authenticated", alice);
  post = (
    await db.query(
      "insert into posts(community_id,author_id,body) values($1,$2,$3) returning id",
      [community, alice, "Real test post"],
    )
  ).rows[0].id;
  await as("postgres");
  hiddenPost = (
    await db.query(
      "insert into posts(community_id,author_id,body,hidden) values($1,$2,$3,true) returning id",
      [community, alice, "Hidden test post"],
    )
  ).rows[0].id;
});
after(() => db.close());
test("migration enables RLS on all seven public tables", async () => {
  await as("postgres");
  const r = await db.query(
    "select count(*)::int n from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relrowsecurity",
  );
  assert.equal(r.rows[0].n, 7);
});
test("anonymous reads city metadata but cannot read profiles or write posts", async () => {
  await as("anon");
  assert.equal((await db.query("select * from communities")).rows.length, 8);
  await assert.rejects(db.query("select * from profiles"));
  await assert.rejects(
    db.query(
      "insert into posts(community_id,author_id,body) values($1,$2,$3)",
      [community, alice, "Attack"],
    ),
  );
});
test("new auth users receive safe profiles automatically", async () => {
  await as("authenticated", alice);
  assert.equal(
    (await db.query("select display_name from profiles where id=$1", [alice]))
      .rows[0].display_name,
    "Resident",
  );
});
test("cross-user profile modification affects zero rows", async () => {
  await as("authenticated", bob);
  assert.equal(
    (
      await db.query(
        "update profiles set display_name='Attack' where id=$1 returning id",
        [alice],
      )
    ).rows.length,
    0,
  );
});
test("own display name update succeeds but role/city fields cannot be self-assigned", async () => {
  await as("authenticated", alice);
  assert.equal(
    (
      await db.query(
        "update profiles set display_name='Alice' where id=$1 returning id",
        [alice],
      )
    ).rows.length,
    1,
  );
  await assert.rejects(
    db.query("update profiles set city_id=$1 where id=$2", [otherCity, alice]),
  );
  await assert.rejects(
    db.query("insert into your_city_private.moderators(user_id) values($1)", [
      alice,
    ]),
  );
});
test("onboarding rejects cross-city selection atomically", async () => {
  await as("authenticated", alice);
  await assert.rejects(
    db.query("select complete_onboarding($1,$2,$3::uuid[])", [
      "Valid name",
      city,
      [otherCommunity],
    ]),
  );
  assert.equal(
    (
      await db.query("select * from community_memberships where user_id=$1", [
        alice,
      ])
    ).rows.length,
    1,
  );
});
test("onboarding rejects anonymous callers and invalid names", async () => {
  await as("anon");
  await assert.rejects(
    db.query("select complete_onboarding($1,$2,$3::uuid[])", [
      "Valid name",
      city,
      [],
    ]),
  );
  await as("authenticated", alice);
  await assert.rejects(
    db.query("select complete_onboarding($1,$2,$3::uuid[])", ["x", city, []]),
  );
});
test("city cannot be switched after selection through RPC", async () => {
  await as("authenticated", alice);
  await assert.rejects(
    db.query("select complete_onboarding($1,$2,$3::uuid[])", [
      "Valid name",
      otherCity,
      [otherCommunity],
    ]),
  );
});
test("membership blocks cross-user and cross-city insertion", async () => {
  await as("authenticated", bob);
  await assert.rejects(
    db.query("insert into community_memberships values($1,$2)", [
      alice,
      otherCommunity,
    ]),
  );
  await assert.rejects(
    db.query("insert into community_memberships values($1,$2)", [
      bob,
      otherCommunity,
    ]),
  );
});
test("membership privacy and cross-user deletion", async () => {
  await as("authenticated", bob);
  assert.equal(
    (await db.query("select * from community_memberships")).rows.length,
    0,
  );
  assert.equal(
    (
      await db.query(
        "delete from community_memberships where user_id=$1 returning *",
        [alice],
      )
    ).rows.length,
    0,
  );
});
test("nonmember cannot publish; membership permits own post", async () => {
  await as("authenticated", bob);
  await assert.rejects(
    db.query(
      "insert into posts(community_id,author_id,body) values($1,$2,$3)",
      [community, bob, "Nonmember"],
    ),
  );
  await db.query(
    "insert into community_memberships(user_id,community_id) values($1,$2)",
    [bob, community],
  );
  assert.equal(
    (
      await db.query(
        "insert into posts(community_id,author_id,body) values($1,$2,$3) returning id",
        [community, bob, "Member"],
      )
    ).rows.length,
    1,
  );
});
test("forged author and moderation flags rejected", async () => {
  await as("authenticated", bob);
  await assert.rejects(
    db.query(
      "insert into posts(community_id,author_id,body) values($1,$2,$3)",
      [community, alice, "Forged"],
    ),
  );
  await assert.rejects(
    db.query("update posts set hidden=false where id=$1", [hiddenPost]),
  );
});
test("cross-user post update/delete denied", async () => {
  await as("authenticated", bob);
  await assert.rejects(
    db.query("update posts set body='Attack' where id=$1", [post]),
  );
  assert.equal(
    (await db.query("delete from posts where id=$1 returning id", [post])).rows
      .length,
    0,
  );
});
test("hidden posts inaccessible to normal user and cannot be commented on", async () => {
  await as("authenticated", alice);
  assert.equal(
    (await db.query("select * from posts where id=$1", [hiddenPost])).rows
      .length,
    0,
  );
  await assert.rejects(
    db.query("insert into comments(post_id,author_id,body) values($1,$2,$3)", [
      hiddenPost,
      alice,
      "Hidden comment",
    ]),
  );
});
test("member can comment; cannot forge comment author", async () => {
  await as("authenticated", bob);
  await db.query(
    "insert into comments(post_id,author_id,body) values($1,$2,$3)",
    [post, bob, "Hello"],
  );
  await assert.rejects(
    db.query("insert into comments(post_id,author_id,body) values($1,$2,$3)", [
      post,
      alice,
      "Forged",
    ]),
  );
});
test("report privacy, uniqueness and resolution protection", async () => {
  await as("authenticated", bob);
  await db.query(
    "insert into reports(post_id,reporter_id,reason) values($1,$2,$3)",
    [post, bob, "Test report reason"],
  );
  await assert.rejects(
    db.query(
      "insert into reports(post_id,reporter_id,reason) values($1,$2,$3)",
      [post, bob, "Duplicate report"],
    ),
  );
  await assert.rejects(db.query("update reports set status='resolved'"));
  await as("authenticated", alice);
  assert.equal((await db.query("select * from reports")).rows.length, 0);
});
test("trusted moderator can read reports and hidden posts", async () => {
  await as("postgres");
  await db.query("insert into your_city_private.moderators values($1)", [
    alice,
  ]);
  await as("authenticated", alice);
  assert.equal((await db.query("select * from reports")).rows.length, 1);
  assert.equal(
    (await db.query("select * from posts where id=$1", [hiddenPost])).rows
      .length,
    1,
  );
});
test("owner can delete own post", async () => {
  await as("authenticated", bob);
  const own = (await db.query("select id from posts where author_id=$1", [bob]))
    .rows[0].id;
  assert.equal(
    (await db.query("delete from posts where id=$1 returning id", [own])).rows
      .length,
    1,
  );
});
test("migration collision fails without dropping existing data", async () => {
  await as("postgres");
  const before = (await db.query("select count(*)::int n from profiles"))
    .rows[0].n;
  await assert.rejects(
    db.exec(
      await readFile("supabase/migrations/202611130001_foundation.sql", "utf8"),
    ),
  );
  await db.exec("rollback");
  assert.equal(
    (await db.query("select count(*)::int n from profiles")).rows[0].n,
    before,
  );
});
