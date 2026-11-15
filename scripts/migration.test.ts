import { test } from "node:test";
import assert from "node:assert/strict";
import { fields, uniqueFields } from "../src/lib/appwrite/schema";
import {
  additions,
  migrationTarget,
  newTables,
  planMvp3Migration,
  type MigrationSnapshot,
} from "../src/lib/migrations/mvp3";
function baseline(): MigrationSnapshot {
  return {
    ...migrationTarget,
    tables: Object.entries(fields)
      .filter(
        ([table]) => !newTables.includes(table as (typeof newTables)[number]),
      )
      .map(([table, columns]) => ({
        $id: table,
        enabled: true,
        rowSecurity: false,
        $permissions: ["cities", "communities"].includes(table)
          ? ['read("any")']
          : [],
        columns: Object.keys(columns)
          .filter(
            (key) =>
              !(additions[table as keyof typeof additions] ?? []).some(
                (c) => c.key === key,
              ),
          )
          .map((key) => ({
            key,
            type: key === "onboarded" ? "boolean" : "string",
            size: 10000,
            required: true,
            status: "available",
            array: false,
          })),
        indexes: uniqueFields[table as keyof typeof fields]
          ? [
              {
                key: "existing_unique",
                type: "unique",
                columns: uniqueFields[table as keyof typeof fields]!,
                status: "available",
              },
            ]
          : [],
      })),
  };
}
function simulate(snapshot: MigrationSnapshot) {
  const copy = structuredClone(snapshot);
  for (const op of planMvp3Migration(snapshot).operations) {
    if (op.operation === "create-table")
      copy.tables.push({
        $id: op.table,
        enabled: op.enabled,
        rowSecurity: op.rowSecurity,
        $permissions: op.permissions,
        columns: [],
        indexes: [],
      });
    else {
      const t = copy.tables.find((t) => t.$id === op.table)!;
      if (op.operation === "create-column")
        t.columns.push({ ...op.column, status: "available" });
      else (t.indexes ??= []).push({ ...op, status: "available" });
    }
  }
  return copy;
}
test("additive migration plans exact missing resources and converges to an empty second plan", () => {
  const snapshot = baseline(),
    before = JSON.stringify(snapshot);
  const plan = planMvp3Migration(snapshot);
  assert.equal(
    plan.operations.filter((o) => o.operation === "create-table").length,
    4,
  );
  assert.equal(
    plan.operations.filter((o) => o.operation === "create-column").length,
    16,
  );
  assert.deepEqual(planMvp3Migration(simulate(snapshot)).operations, []);
  assert.equal(JSON.stringify(snapshot), before);
  assert.equal(plan.cloudExecuted, false);
  assert.ok(plan.operations.every((o) => o.operation.startsWith("create-")));
});
test("partial completion and equivalent indexes are reused without changing existing grants or data", () => {
  const complete = simulate(baseline());
  complete.tables
    .find((t) => t.$id === "post_likes")!
    .indexes!.forEach((i) => (i.key = "operator_" + i.key));
  assert.deepEqual(planMvp3Migration(complete).operations, []);
  const partial = structuredClone(complete);
  partial.tables.find((t) => t.$id === "profiles")!.columns = partial.tables
    .find((t) => t.$id === "profiles")!
    .columns.filter((c) => c.key !== "social_version");
  assert.equal(planMvp3Migration(partial).operations.length, 1);
});
test("unsafe permissions, wrong defaults, required nullable columns, pending resources and absent core tables block", () => {
  for (const mutate of [
    (s: MigrationSnapshot) => {
      s.tables[0].$permissions = ['write("any")'];
    },
    (s: MigrationSnapshot) => {
      s.tables
        .find((t) => t.$id === "comments")!
        .columns.find((c) => c.key === "parent_id")!.default = "fabricated";
    },
    (s: MigrationSnapshot) => {
      s.tables
        .find((t) => t.$id === "profiles")!
        .columns.find((c) => c.key === "social_version")!.required = true;
    },
    (s: MigrationSnapshot) => {
      s.tables.find((t) => t.$id === "bookmarks")!.columns[0].status =
        "processing";
    },
    (s: MigrationSnapshot) => {
      s.tables.find((t) => t.$id === "connections")!.indexes![0].status =
        "processing";
    },
    (s: MigrationSnapshot) => {
      s.tables = s.tables.filter((t) => t.$id !== "posts");
    },
    (s: MigrationSnapshot) => {
      s.tables.find((t) => t.$id === "post_likes")!.columns[0].required = false;
    },
  ]) {
    const snapshot = simulate(baseline());
    mutate(snapshot);
    assert.throws(() => planMvp3Migration(snapshot));
  }
  assert.throws(() =>
    planMvp3Migration({
      ...baseline(),
      database: "other",
    } as unknown as MigrationSnapshot),
  );
});
test("physical aliases on existing comment tables are used for additive indexes", () => {
  const snapshot = baseline(),
    comments = snapshot.tables.find((t) => t.$id === "comments")!;
  comments.columns = comments.columns.map((c) => ({
    ...c,
    key:
      (
        {
          author_id: "userId",
          post_id: "postId",
          status: "moderationStatus",
        } as Record<string, string>
      )[c.key] ?? c.key,
  }));
  const indexes = planMvp3Migration(snapshot).operations.filter(
    (o) => o.operation === "create-index" && o.table === "comments",
  );
  assert.ok(
    indexes.some(
      (o) =>
        o.operation === "create-index" &&
        o.columns.join(",") === "userId,moderationStatus",
    ),
  );
  assert.deepEqual(planMvp3Migration(simulate(snapshot)).operations, []);
});

test("offline CLI emits a reviewable plan and redacts malformed snapshot contents", async () => {
  const { mkdtempSync, writeFileSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { spawnSync } = await import("node:child_process");
  const dir = mkdtempSync(join(tmpdir(), "your-city-plan-")),
    file = join(dir, "metadata.json");
  try {
    writeFileSync(file, JSON.stringify(baseline()));
    const first = spawnSync(
      process.execPath,
      ["--import", "tsx", "scripts/migration-plan.ts", "--snapshot", file],
      { encoding: "utf8" },
    );
    assert.equal(first.status, 0);
    assert.equal(JSON.parse(first.stdout).cloudExecuted, false);
    writeFileSync(file, JSON.stringify(simulate(baseline())));
    const second = spawnSync(
      process.execPath,
      ["--import", "tsx", "scripts/migration-plan.ts", "--snapshot", file],
      { encoding: "utf8" },
    );
    assert.equal(second.status, 0);
    assert.deepEqual(JSON.parse(second.stdout).operations, []);
    writeFileSync(file, "invalid-private-snapshot-marker");
    const invalid = spawnSync(
      process.execPath,
      ["--import", "tsx", "scripts/migration-plan.ts", "--snapshot", file],
      { encoding: "utf8" },
    );
    assert.equal(invalid.status, 2);
    assert.ok(!invalid.stderr.includes("invalid-private-snapshot-marker"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("operator-reported legacy catalog columns and all 11 post-migration tables validate with no operations", async () => {
  const { postMigrationSchema } =
    await import("./test-support/post-migration-schema");
  const { inspectSchema } = await import("../src/lib/appwrite/schema");
  const snapshot = postMigrationSchema(),
    before = JSON.stringify(snapshot);
  assert.equal(snapshot.tables.length, 11);
  for (const t of snapshot.tables) {
    const schema = inspectSchema(t.$id as keyof typeof fields, t);
    for (const legacy of t.$id === "cities"
      ? ["name", "slug", "country_code", "enabled"]
      : t.$id === "communities"
        ? ["name", "slug", "category"]
        : [])
      assert.ok(
        !Object.values(schema.keys).includes(legacy),
        "Legacy fields must not become application write mappings",
      );
  }
  assert.deepEqual(planMvp3Migration(snapshot).operations, []);
  assert.equal(JSON.stringify(snapshot), before);
});

test("legacy compatibility remains table-scoped and rejects incompatible definitions and unknown required columns", async () => {
  const { postMigrationSchema } =
    await import("./test-support/post-migration-schema");
  const legacy = {
    cities: ["name", "slug", "country_code", "enabled"],
    communities: ["name", "slug", "category"],
  };
  for (const [table, keys] of Object.entries(legacy))
    for (const key of keys)
      for (const patch of [
        { type: "integer" },
        { array: true },
        { status: "processing" },
        { default: 42 },
        ...(key === "enabled"
          ? [{ type: "string", size: 16 }]
          : [{ type: "boolean" }, { size: 0 }]),
      ]) {
        const snapshot = postMigrationSchema(),
          t = snapshot.tables.find((t) => t.$id === table)!;
        Object.assign(
          t.columns.find((c) => c.key === key)!,
          patch,
        );
        assert.throws(
          () => planMvp3Migration(snapshot),
          /Incompatible legacy column/,
        );
      }
  for (const table of ["cities", "communities", "profiles"]) {
    const snapshot = postMigrationSchema();
    snapshot.tables
      .find((t) => t.$id === table)!
      .columns.push({
        key: table === "profiles" ? "slug" : "unapproved_legacy",
        type: "string",
        size: 128,
        required: true,
        array: false,
        status: "available",
        default: null,
      });
    assert.throws(
      () => planMvp3Migration(snapshot),
      /Unmapped required column/,
    );
  }
});

test("complete legacy-compatible metadata still rejects unsafe policies, missing constraints and invalid mapped columns", async () => {
  const { postMigrationSchema } =
    await import("./test-support/post-migration-schema");
  for (const mutate of [
    (s: ReturnType<typeof postMigrationSchema>) => {
      s.tables.find((t) => t.$id === "cities")!.$permissions = ['write("any")'];
    },
    (s: ReturnType<typeof postMigrationSchema>) => {
      s.tables.find((t) => t.$id === "connections")!.rowSecurity = true;
    },
    (s: ReturnType<typeof postMigrationSchema>) => {
      s.tables.find((t) => t.$id === "profiles")!.indexes = [];
    },
    (s: ReturnType<typeof postMigrationSchema>) => {
      s.tables
        .find((t) => t.$id === "post_likes")!
        .indexes!.find((i) => i.type === "unique")!.status = "processing";
    },
    (s: ReturnType<typeof postMigrationSchema>) => {
      s.tables.find((t) => t.$id === "cities")!.columns = s.tables
        .find((t) => t.$id === "cities")!
        .columns.filter((c) => c.key !== "name_ru");
    },
    (s: ReturnType<typeof postMigrationSchema>) => {
      s.tables
        .find((t) => t.$id === "comments")!
        .columns.find((c) => c.key === "parent_id")!.required = true;
    },
  ]) {
    const snapshot = postMigrationSchema();
    mutate(snapshot);
    assert.throws(() => planMvp3Migration(snapshot));
  }
});

test("prototype property names do not expand the legacy allowlist", async () => {
  const { postMigrationSchema } =
    await import("./test-support/post-migration-schema");
  for (const key of ["toString", "constructor", "hasOwnProperty"]) {
    const snapshot = postMigrationSchema();
    snapshot.tables
      .find((t) => t.$id === "cities")!
      .columns.push({
        key,
        type: "boolean",
        required: true,
        status: "available",
        array: false,
        default: null,
      });
    assert.throws(
      () => planMvp3Migration(snapshot),
      /Unmapped required column/,
    );
  }
});
