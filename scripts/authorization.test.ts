import { test } from "node:test";
import assert from "node:assert/strict";
import { CityService, membershipId } from "../src/lib/appwrite/service";
import { safeTablePolicy } from "../src/lib/appwrite/policy";
import {
  fields,
  inspectSchema,
  type Column,
  type TableMetadata,
} from "../src/lib/appwrite/schema";
import { AppwriteRepository } from "../src/lib/appwrite/store";
import type {
  Repository,
  Rows,
  Table,
  Base,
  Filter,
  Page,
} from "../src/lib/appwrite/types";
import type { TablesDB } from "node-appwrite";
class Memory implements Repository {
  rows = new Map<string, Base & Record<string, unknown>>();
  async get<K extends Table>(table: K, id: string) {
    return (this.rows.get(table + ":" + id) as Rows[K]) ?? null;
  }
  async list<K extends Table>(
    table: K,
    filters: Filter[] = [],
    page: Page = {},
  ) {
    let rows = [...this.rows.entries()]
      .filter(([key]) => key.startsWith(table + ":"))
      .map(([, value]) => value)
      .filter((r) =>
        filters.every((f) =>
          Array.isArray(f.value)
            ? f.value.includes(String(r[f.field]))
            : r[f.field] === f.value,
        ),
      );
    if (page.desc) rows = rows.reverse();
    return rows.slice(
      page.offset ?? 0,
      (page.offset ?? 0) + (page.limit ?? 100),
    ) as Rows[K][];
  }
  async create<K extends Table>(
    table: K,
    id: string,
    data: Omit<Rows[K], keyof Base>,
  ) {
    if (this.rows.has(table + ":" + id)) throw new Error("Conflict");
    const row = { ...data, id, created_at: new Date().toISOString() };
    this.rows.set(table + ":" + id, row);
    return row as Rows[K];
  }
  async update<K extends Table>(
    table: K,
    id: string,
    data: Partial<Omit<Rows[K], keyof Base>>,
  ) {
    const row = await this.get(table, id);
    if (!row) throw new Error("Missing row");
    const updated = { ...row, ...data };
    this.rows.set(table + ":" + id, updated);
    return updated;
  }
  async delete(table: Table, id: string) {
    this.rows.delete(table + ":" + id);
  }
  async transaction<T>(work: (repo: Repository) => Promise<T>): Promise<T> {
    const snapshot = structuredClone(this.rows);
    try {
      return await work(this);
    } catch (error) {
      this.rows = snapshot;
      throw error;
    }
  }
}
async function setup() {
  const repo = new Memory();
  await repo.create("cities", "shymkent", {
    name_kk: "Шымкент",
    name_ru: "Шымкент",
  });
  await repo.create("cities", "other", { name_kk: "Other", name_ru: "Other" });
  await repo.create("communities", "events", {
    city_id: "shymkent",
    name_kk: "Іс-шаралар",
    name_ru: "События",
    description_kk: "",
    description_ru: "",
  });
  await repo.create("communities", "foreign", {
    city_id: "other",
    name_kk: "Other",
    name_ru: "Other",
    description_kk: "",
    description_ru: "",
  });
  const alice = new CityService(repo, { id: "alice", name: "Alice" }),
    bob = new CityService(repo, { id: "bob", name: "Bob" });
  await alice.onboard("Alice", "shymkent", ["events"], "kk");
  await bob.onboard("Bob", "shymkent", [], "ru");
  return { repo, alice, bob };
}
test("anonymous/invalid identity cannot construct a service", () => {
  assert.throws(() => new CityService(new Memory(), { id: "", name: "Guest" }));
});
test("profile is private, identity-derived and stable across repeated initialization", async () => {
  const { repo, alice, bob } = await setup();
  assert.equal((await alice.ensureProfile()).user_id, "alice");
  assert.equal((await bob.profile())?.user_id, "bob");
  await repo.update("profiles", "alice", { user_id: "bob" });
  await assert.rejects(alice.profile());
});
test("onboarding persists city, language, name and selected memberships", async () => {
  const { alice } = await setup();
  assert.equal((await alice.profile())?.city_id, "shymkent");
  assert.equal((await alice.profile())?.locale, "kk");
  assert.equal((await alice.memberships()).length, 1);
});
test("cross-city onboarding rejection rolls back profile and membership writes", async () => {
  const { alice } = await setup();
  await assert.rejects(alice.onboard("Changed", "shymkent", ["foreign"], "ru"));
  assert.equal((await alice.profile())?.display_name, "Alice");
  assert.equal((await alice.memberships())[0].community_id, "events");
});
test("city cannot be changed after onboarding; input sizes are validated", async () => {
  const { alice } = await setup();
  await assert.rejects(alice.onboard("Valid name", "other", [], "kk"));
  await assert.rejects(alice.onboard("x", "shymkent", [], "kk"));
  await assert.rejects(alice.updateProfile("Alice", "admin"));
});
test("membership deterministic ID prevents duplicate joins", async () => {
  const { bob } = await setup();
  await bob.membership("events", true);
  await bob.membership("events", true);
  assert.equal((await bob.memberships()).length, 1);
  assert.equal((await bob.memberships())[0].id, membershipId("bob", "events"));
});
test("member cannot join another city or delete another user membership", async () => {
  const { alice, bob } = await setup();
  await assert.rejects(bob.membership("foreign", true));
  await bob.membership("events", false);
  assert.equal((await alice.memberships()).length, 1);
});
test("nonmember cannot publish; server derives author and status", async () => {
  const { alice, bob } = await setup();
  await assert.rejects(bob.createPost("events", "Hello"));
  const p = await alice.createPost("events", "Hello");
  assert.equal(p.author_id, "alice");
  assert.equal(p.status, "published");
  await assert.rejects(alice.createPost("events", " "));
  await assert.rejects(alice.createPost("events", "x".repeat(5001)));
});
test("post editing and soft deletion enforce ownership", async () => {
  const { alice, bob, repo } = await setup();
  const p = await alice.createPost("events", "Hello");
  await bob.membership("events", true);
  await assert.rejects(bob.editPost(p.id, "Attack"));
  await assert.rejects(bob.deletePost(p.id));
  await alice.editPost(p.id, "Edited");
  assert.equal((await repo.get("posts", p.id))?.body, "Edited");
  await alice.deletePost(p.id);
  assert.equal((await repo.get("posts", p.id))?.status, "deleted");
  assert.equal((await alice.posts("explore")).length, 0);
});
test("hidden posts inaccessible to other users and cannot be restored by author", async () => {
  const { alice, bob, repo } = await setup();
  const p = await alice.createPost("events", "Hello");
  await repo.update("posts", p.id, { status: "hidden" });
  await assert.rejects(bob.post(p.id));
  await assert.rejects(alice.editPost(p.id, "Restore"));
});
test("comment writes require membership, parent visibility and author ownership", async () => {
  const { alice, bob, repo } = await setup();
  const p = await alice.createPost("events", "Hello");
  await assert.rejects(bob.createComment(p.id, "Hi"));
  await bob.membership("events", true);
  const c = await bob.createComment(p.id, "Hi");
  assert.equal(c.author_id, "bob");
  await assert.rejects(alice.editComment(c.id, "Attack"));
  await assert.rejects(alice.deleteComment(c.id));
  await bob.editComment(c.id, "Edited");
  assert.equal((await repo.get("comments", c.id))?.body, "Edited");
  await bob.deleteComment(c.id);
  assert.equal((await bob.comments(p.id)).length, 0);
});
test("deleted parent blocks comment creation and edits", async () => {
  const { alice } = await setup();
  const p = await alice.createPost("events", "Hello");
  const c = await alice.createComment(p.id, "Hi");
  await alice.deletePost(p.id);
  await assert.rejects(alice.createComment(p.id, "No"));
  await assert.rejects(alice.editComment(c.id, "No"));
});
test("feed modes filter joined communities; pagination excludes hidden content", async () => {
  const { alice, bob } = await setup();
  for (let i = 0; i < 23; i++) await alice.createPost("events", "Post " + i);
  assert.equal((await bob.posts("mine")).length, 0);
  assert.equal((await bob.posts("explore")).length, 21);
  assert.equal((await bob.posts("explore", 2)).length, 3);
});
test("reports are identity-derived, unique and not readable via a public service operation", async () => {
  const { alice, bob, repo } = await setup();
  const p = await alice.createPost("events", "Hello");
  await bob.report(p.id, "Inappropriate post");
  await assert.rejects(bob.report(p.id, "Duplicate report"));
  const row = (await repo.list("reports"))[0];
  assert.equal(row.reporter_id, "bob");
  assert.equal(row.status, "open");
  await assert.rejects(bob.reports());
});
test("moderator identity is server-provisioned; normal users cannot resolve reports", async () => {
  const { alice, bob, repo } = await setup();
  const p = await alice.createPost("events", "Hello");
  await bob.report(p.id, "Inappropriate post");
  const rid = membershipId("bob", p.id);
  await assert.rejects(bob.resolveReport(rid, "hide"));
  const mod = new CityService(repo, { id: "moderator", name: "Moderator" }, [
    "moderator",
  ]);
  assert.equal((await mod.reports()).length, 1);
  await mod.resolveReport(rid, "hide");
  assert.equal((await repo.get("posts", p.id))?.status, "hidden");
  assert.equal((await repo.get("reports", rid))?.status, "resolved");
  await assert.rejects(mod.resolveReport(rid, "hide"));
});
test("public author projections never expose private profile city/language", async () => {
  const { alice } = await setup();
  assert.deepEqual(await alice.authors([{ author_id: "alice" }]), [
    { id: "alice", display_name: "Alice" },
  ]);
});
test("malformed resource IDs are rejected before database access", async () => {
  const { alice } = await setup();
  await assert.rejects(alice.editComment("../profiles/alice", "Attack"));
  await assert.rejects(alice.deleteComment("../profiles/alice"));
  await assert.rejects(alice.post("../profiles/alice"));
});
test("table policy denies all direct user writes and private row access", () => {
  for (const table of [
    "profiles",
    "community_memberships",
    "posts",
    "comments",
    "reports",
  ]) {
    assert.equal(safeTablePolicy(table, [], false, true), true);
    assert.equal(
      safeTablePolicy(table, ['create("users")'], false, true),
      false,
    );
    assert.equal(safeTablePolicy(table, [], true, true), false);
    assert.equal(safeTablePolicy(table, ['read("any")'], false, true), false);
  }
  assert.equal(safeTablePolicy("cities", ['read("any")'], false, true), true);
});
test("schema inspection fails closed for missing columns, pending columns and unsafe permissions", () => {
  const columns: Column[] = Object.keys(fields.profiles).map((key) => ({
    key,
    type: key === "onboarded" ? "boolean" : "string",
    status: "available",
    required: true,
    size: 100,
  }));
  const m: TableMetadata = {
    $id: "profiles",
    enabled: true,
    rowSecurity: false,
    $permissions: [],
    indexes: [
      {
        key: "user",
        type: "unique",
        columns: ["user_id"],
        status: "available",
      },
    ],
    columns,
  };
  assert.ok(inspectSchema("profiles", m));
  assert.throws(() =>
    inspectSchema("profiles", { ...m, columns: columns.slice(1) }),
  );
  assert.throws(() => inspectSchema("profiles", { ...m, rowSecurity: true }));
  assert.throws(() =>
    inspectSchema("profiles", {
      ...m,
      columns: [
        ...columns,
        { key: "unknown", type: "string", status: "available", required: true },
      ],
    }),
  );
});
test("SDK adapter commits successful transactions and rolls back failed operations", async () => {
  const calls: string[] = [];
  const fake = {
    createTransaction: async () => ({ $id: "tx" }),
    updateTransaction: async (p: { commit?: boolean; rollback?: boolean }) => {
      calls.push(p.commit ? "commit" : "rollback");
    },
  } as unknown as TablesDB;
  const repo = new AppwriteRepository(fake, "your_city_db", {} as never);
  assert.equal(await repo.transaction(async () => 42), 42);
  await assert.rejects(
    repo.transaction(async () => {
      throw new Error("Conflict");
    }),
  );
  assert.deepEqual(calls, ["commit", "rollback"]);
});
test("existing profile/membership row IDs are reused without duplicate records", async () => {
  const { repo, alice } = await setup();
  const profile = await repo.get("profiles", "alice");
  assert.ok(profile);
  await repo.delete("profiles", "alice");
  await repo.create("profiles", "legacy-profile", {
    user_id: "alice",
    display_name: "Legacy Alice",
    city_id: "shymkent",
    locale: "ru",
    onboarded: true,
  });
  assert.equal((await alice.ensureProfile()).id, "legacy-profile");
  await alice.updateProfile("Updated Alice", "kk");
  assert.equal(
    (await repo.get("profiles", "legacy-profile"))?.display_name,
    "Updated Alice",
  );
  await repo.delete("community_memberships", membershipId("alice", "events"));
  await repo.create("community_memberships", "legacy-membership", {
    user_id: "alice",
    community_id: "events",
  });
  await alice.membership("events", true);
  assert.equal((await alice.memberships()).length, 1);
  assert.equal((await alice.memberships())[0].id, "legacy-membership");
});
test("schema supports Appwrite varchar/text columns without weakening content bounds", () => {
  const columns: Column[] = Object.keys(fields.posts).map((key) => ({
    key,
    type: key === "body" ? "text" : "varchar",
    status: "available",
    required: true,
    size: key === "body" ? undefined : 100,
  }));
  const metadata: TableMetadata = {
    $id: "posts",
    enabled: true,
    rowSecurity: false,
    $permissions: [],
    columns,
  };
  assert.ok(inspectSchema("posts", metadata));
  assert.throws(() =>
    inspectSchema("posts", {
      ...metadata,
      columns: columns.map((c) =>
        c.key === "body" ? { ...c, type: "varchar", size: 100 } : c,
      ),
    }),
  );
});
