/** Shared server-domain tests; in-memory repository, NOT hosted Appwrite evidence. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { Memory, setup } from "./test-support/memory";
import { CityService } from "../src/lib/appwrite/service";
import {
  fields,
  uniqueFields,
  inspectSchema,
  type TableMetadata,
} from "../src/lib/appwrite/schema";
import type { Rows, Table, Base } from "../src/lib/appwrite/types";

test("shared likes and private bookmarks persist across independently constructed services", async () => {
  const { repo, alice, bob } = await setup();
  const p = await alice.createPost("events", "Shared post");
  await bob.interact(p.id, "like", true);
  await bob.interact(p.id, "like", true);
  await bob.interact(p.id, "bookmark", true);
  assert.ok((await repo.get("profiles", "alice"))?.social_version);
  assert.ok((await repo.get("profiles", "bob"))?.social_version);
  const bobReloaded = new CityService(repo, { id: "bob", name: "Bob" });
  assert.deepEqual(await bobReloaded.postInteractions(p.id), {
    count: 1,
    liked: true,
    bookmarked: true,
  });
  assert.deepEqual(await alice.postInteractions(p.id), {
    count: 1,
    liked: false,
    bookmarked: false,
  });
  assert.equal((await bobReloaded.savedPosts())[0].id, p.id);
  assert.deepEqual(await alice.savedPosts(), []);
  assert.equal((await alice.notifications()).length, 1);
  await bob.interact(p.id, "like", false);
  await bob.interact(p.id, "like", true);
  assert.equal(
    (await alice.notifications()).length,
    1,
    "toggle cannot spam repeated notifications",
  );
  await bob.interact(p.id, "like", false);
  await bob.interact(p.id, "bookmark", false);
  assert.equal((await alice.postInteractions(p.id)).count, 0);
  assert.deepEqual(await bob.savedPosts(), []);
});
test("threaded replies validate post/parent/ownership and notify real recipients", async () => {
  const { alice, bob, repo } = await setup();
  await bob.membership("events", true);
  const p = await alice.createPost("events", "Post");
  const other = await alice.createPost("events", "Other");
  const c = await bob.createComment(p.id, "Comment");
  const reply = await alice.createComment(p.id, "Reply", c.id);
  assert.equal(reply.parent_id, c.id);
  assert.equal((await bob.notifications())[0].kind, "reply");
  await assert.rejects(bob.createComment(other.id, "Wrong post", c.id));
  await assert.rejects(bob.editComment(reply.id, "Forged ownership"));
  await bob.deleteComment(c.id);
  const thread = await alice.comments(p.id);
  assert.equal(thread.find((r) => r.id === c.id)?.body, "[deleted]");
  assert.ok(thread.some((r) => r.id === reply.id));
  await assert.rejects(alice.createComment(p.id, "Reply to deleted", c.id));
  assert.equal((await repo.get("comments", reply.id))?.parent_id, c.id);
});
test("follow state and notifications are idempotent and recipient-owned", async () => {
  const { alice, bob, repo } = await setup();
  await bob.connection("alice", "follow", true);
  await bob.connection("alice", "follow", true);
  const events = await alice.notifications();
  assert.equal(events.length, 1);
  assert.equal(events[0].kind, "follow");
  await assert.rejects(bob.readNotification(events[0].id));
  await alice.readNotification(events[0].id);
  assert.equal((await alice.notifications())[0].is_read, true);
  assert.equal((await bob.connections()).length, 1);
  await bob.connection("alice", "follow", false);
  assert.equal((await bob.connections()).length, 0);
  assert.equal((await repo.list("notifications"))[0].recipient_id, "alice");
  await assert.rejects(bob.connection("bob", "follow", true));
  await assert.rejects(bob.connection("../alice", "block", true));
});
test("mute and bilateral block apply to feeds, detail, comments, bookmarks and notifications", async () => {
  const { alice, bob, repo } = await setup();
  await bob.membership("events", true);
  const p = await alice.createPost("events", "Alice post");
  const q = await bob.createPost("events", "Bob post");
  await bob.createComment(p.id, "Bob comment");
  await alice.createComment(q.id, "Alice comment");
  await bob.interact(p.id, "bookmark", true);
  await bob.connection("alice", "follow", true);
  await alice.connection("bob", "follow", true);
  await bob.connection("alice", "mute", true);
  assert.ok((await bob.posts("city")).every((r) => r.author_id !== "alice"));
  await assert.rejects(bob.post(p.id));
  assert.deepEqual(await bob.savedPosts(), []);
  assert.deepEqual(await bob.notifications(), []);
  assert.equal((await bob.comments(q.id)).length, 0);
  await bob.connection("alice", "mute", false);
  await bob.connection("alice", "block", true);
  await assert.rejects(alice.post(q.id));
  await assert.rejects(bob.post(p.id));
  await assert.rejects(alice.interact(q.id, "like", true));
  await assert.rejects(alice.connection("bob", "follow", true));
  assert.equal(
    (await repo.list("connections")).filter((r) => r.kind === "follow").length,
    0,
  );
  await bob.connection("alice", "block", false);
  assert.equal((await bob.post(p.id)).id, p.id);
  assert.equal((await alice.post(q.id)).id, q.id);
});
test("a failure writing notifications rolls back the associated shared action", async () => {
  class Broken extends Memory {
    override async create<K extends Table>(
      table: K,
      id: string,
      data: Omit<Rows[K], keyof Base>,
    ) {
      if (table === "notifications") throw new Error("Backend unavailable");
      return super.create(table, id, data);
    }
  }
  const { alice, bob, repo } = await setup(new Broken());
  const p = await alice.createPost("events", "Post");
  await bob.membership("events", true);
  await assert.rejects(bob.interact(p.id, "like", true));
  assert.deepEqual(await repo.list("post_likes"), []);
  await assert.rejects(bob.connection("alice", "follow", true));
  assert.deepEqual(await repo.list("connections"), []);
  await assert.rejects(bob.createComment(p.id, "Comment"));
  assert.deepEqual(await repo.list("comments"), []);
});
test("server For You uses real follows and interactions without changing city/community order", async () => {
  const { alice, bob, repo } = await setup();
  const fresh = await alice.createPost("events", "Fresh");
  const older = await alice.createPost("events", "Older");
  const before = await bob.posts("city");
  await bob.interact(older.id, "like", true);
  await bob.interact(older.id, "bookmark", true);
  const now = Date.now();
  assert.equal((await bob.posts("for-you", 1, undefined, now))[0].id, older.id);
  assert.deepEqual(
    await bob.posts("for-you", 1, undefined, now),
    await bob.posts("for-you", 1, undefined, now),
  );
  assert.deepEqual(await bob.posts("city"), before);
  assert.deepEqual(await bob.posts("mine"), []);
  await bob.membership("events", true);
  assert.equal((await bob.posts("mine")).length, 2);
  await repo.update("posts", fresh.id, { status: "hidden" });
  assert.ok((await bob.posts("for-you")).every((r) => r.id !== fresh.id));
});
test("cross-city targets and forged interaction kinds fail without side effects", async () => {
  const { alice, bob, repo } = await setup();
  const outsider = new CityService(repo, { id: "outsider", name: "Outside" });
  await assert.rejects(outsider.onboard("Outside", "other", ["foreign"], "ru"));
  assert.equal(await outsider.profile(), null);
  await outsider.ensureProfile();
  await repo.update("profiles", "outsider", {
    onboarded: true,
    city_id: "other",
  });
  await assert.rejects(bob.connection("outsider", "follow", true));
  await assert.rejects(bob.connection("alice", "admin" as "follow", true));
  const p = await alice.createPost("events", "Post");
  await assert.rejects(bob.interact(p.id, "admin" as "like", true));
  await assert.rejects(outsider.interact(p.id, "like", true));
  assert.deepEqual(await repo.list("post_likes"), []);
});
test("comment reports moderate only the reported comment and redact notifications", async () => {
  const { repo, alice, bob } = await setup();
  await bob.membership("events", true);
  const p = await alice.createPost("events", "Post");
  const c = await bob.createComment(p.id, "Reported comment");
  await alice.report(p.id, "Abusive comment", c.id);
  const mod = new CityService(repo, { id: "mod", name: "Moderator" }, ["mod"]);
  const report = (await mod.reports())[0];
  await mod.resolveReport(report.id, "hide");
  assert.equal((await repo.get("comments", c.id))?.status, "hidden");
  assert.equal((await bob.post(p.id)).status, "published");
  assert.deepEqual(await alice.comments(p.id), []);
  assert.deepEqual(await alice.notifications(), []);
  await assert.rejects(bob.editComment(c.id, "Restore"));
  await assert.rejects(alice.report(p.id, "Wrong comment", "missing"));
});
test("privacy lists are fully paginated and dataset limits fail closed", async () => {
  const { repo, alice, bob } = await setup();
  const p = await alice.createPost("events", "Post");
  for (let i = 0; i < 105; i++)
    await repo.create("connections", "mute" + i, {
      user_id: "bob",
      target_id: "u" + i,
      kind: "mute",
    });
  await repo.create("connections", "last-block", {
    user_id: "alice",
    target_id: "bob",
    kind: "block",
  });
  await assert.rejects(bob.post(p.id));
  assert.equal((await bob.connections()).length, 105);
  const limited = new CityService(
    {
      ...repo,
      list: async () => Array.from({ length: 100 }, () => ({})),
    } as never,
    { id: "bob", name: "Bob" },
  );
  await assert.rejects(limited.allRows("connections"));
});
test("new table schema gates enforce nullable columns, unique pairs and private grants", () => {
  for (const table of [
    "post_likes",
    "bookmarks",
    "connections",
    "notifications",
    "comments",
    "reports",
  ] as const) {
    const metadata: TableMetadata = {
      $id: table,
      enabled: true,
      rowSecurity: false,
      $permissions: [],
      columns: Object.keys(fields[table]).map((key) => ({
        key,
        type: key === "is_read" ? "boolean" : "string",
        size: 10000,
        status: "available",
        required: !(
          (table === "comments" && key === "parent_id") ||
          (table === "reports" && key === "comment_id") ||
          (table === "notifications" && ["post_id", "comment_id"].includes(key))
        ),
      })),
      indexes:
        uniqueFields[table]
          ?.map((_, i, cols) => ({
            key: "unique" + i,
            type: "unique",
            columns: cols,
            status: "available",
          }))
          .slice(0, 1) ?? [],
    };
    assert.ok(inspectSchema(table, metadata));
    assert.throws(() =>
      inspectSchema(table, { ...metadata, $permissions: ['read("users")'] }),
    );
    if (uniqueFields[table])
      assert.throws(() => inspectSchema(table, { ...metadata, indexes: [] }));
    const nullable = metadata.columns.find((c) => !c.required);
    if (nullable)
      assert.throws(() =>
        inspectSchema(table, {
          ...metadata,
          columns: metadata.columns.map((c) => ({ ...c, required: true })),
        }),
      );
  }
});

test("concurrent block and like conflicts fail closed without a partial notification", async () => {
  const { repo, alice, bob } = await setup();
  const p = await alice.createPost("events", "Concurrent privacy");
  const results = await Promise.allSettled([
    bob.interact(p.id, "like", true),
    alice.connection("bob", "block", true),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(results.filter((r) => r.status === "rejected").length, 1);
  if (results[1].status === "fulfilled") {
    assert.deepEqual(await repo.list("post_likes"), []);
    assert.deepEqual(await repo.list("notifications"), []);
    await assert.rejects(bob.interact(p.id, "like", true));
  } else {
    await alice.connection("bob", "block", true);
    assert.deepEqual(await alice.notifications(), []);
    await assert.rejects(bob.post(p.id));
  }
});
