import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  allowedIsolatedEndpoint,
  definitions,
  isolatedDatabase,
  isolatedProject,
  planIsolatedBootstrap,
  seedRows,
  type BootstrapSnapshot,
} from "../src/lib/migrations/isolated-bootstrap";
import { fields, tables, type TableMetadata } from "../src/lib/appwrite/schema";
import { mediaBucket, maxImageBytes } from "../src/lib/appwrite/media-limits";
function tableMeta(table: (typeof tables)[number]): TableMetadata {
  const definition = definitions[table];
  return {
    $id: table,
    enabled: true,
    rowSecurity: false,
    $permissions: ["cities", "communities"].includes(table)
      ? ['read("any")']
      : [],
    columns: definition.columns.map((c) => ({
      ...c,
      status: "available",
      array: false,
      default: null,
    })),
    indexes: definition.indexes.map((i) => ({
      key: i.key,
      type: i.type,
      columns: i.attributes,
      status: "available",
    })),
  };
}
function complete(): BootstrapSnapshot {
  return {
    database: { $id: isolatedDatabase, enabled: true },
    tables: tables.map(tableMeta),
    bucket: {
      $id: mediaBucket,
      enabled: true,
      fileSecurity: true,
      $permissions: [],
      maximumFileSize: maxImageBytes,
      allowedFileExtensions: ["jpg", "png", "webp"],
      antivirus: true,
      stripMetadata: true,
    },
    rows: Object.fromEntries(
      seedRows.map((seed) => [seed.table + ":" + seed.id, { ...seed.data }]),
    ),
  };
}
test("empty isolated project plans database, 13 tables, bucket and deterministic seeds", () => {
  const operations = planIsolatedBootstrap({ tables: [], rows: {} });
  assert.equal(
    operations.filter((x) => x.startsWith("create-table:")).length,
    13,
  );
  assert.equal(operations.filter((x) => x.startsWith("create-row:")).length, 8);
  assert.ok(operations.includes("create-database:" + isolatedDatabase));
  assert.ok(operations.includes("create-bucket:" + mediaBucket));
  assert.deepEqual(planIsolatedBootstrap(complete()), []);
  assert.equal(Object.keys(fields).length, 13);
  assert.equal(isolatedProject, "your-city-mvp51-lab");
});
test("partial bootstrap resumes and never rewrites existing rows", () => {
  const snapshot = complete();
  snapshot.tables.pop();
  delete snapshot.rows["communities:events"];
  const operations = planIsolatedBootstrap(snapshot);
  assert.deepEqual(operations, [
    "create-table:post_media",
    "create-row:communities:events",
  ]);
});
test("bootstrap rejects unsafe policy, drift, incomplete index and bad seed", () => {
  const snapshot = complete();
  const cities = snapshot.tables.find((t) => t.$id === "cities")!;
  cities.$permissions = [];
  assert.throws(() => planIsolatedBootstrap(snapshot));
  cities.$permissions = ['read("any")'];
  const posts = snapshot.tables.find((t) => t.$id === "posts")!;
  posts.indexes = [];
  assert.throws(() => planIsolatedBootstrap(snapshot));
  posts.indexes = tableMeta("posts").indexes;
  snapshot.rows["cities:shymkent"]!.name_ru = "Unexpected";
  assert.throws(() => planIsolatedBootstrap(snapshot));
});
test("only pinned cloud or explicit loopback self-hosted endpoint is allowed", () => {
  assert.equal(
    allowedIsolatedEndpoint("https://fra.cloud.appwrite.io/v1", false),
    true,
  );
  assert.equal(
    allowedIsolatedEndpoint("http://127.0.0.1:54321/v1", true),
    true,
  );
  for (const endpoint of [
    "https://other.example/v1",
    "http://127.0.0.1:54321/v1",
    "http://localhost:54321/v1",
    "http://127.0.0.1:54321/v1?token=x",
  ])
    assert.equal(allowedIsolatedEndpoint(endpoint, false), false);
});
test("bootstrap CLI refuses shared project before any provider request", () => {
  const run = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "scripts/isolated-bootstrap.ts",
      "--apply",
      "--isolated",
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        APPWRITE_MIGRATION_PROJECT_ID: "your-city",
        APPWRITE_MIGRATION_API_KEY: "synthetic-only",
      },
    },
  );
  assert.equal(run.status, 2);
  assert.match(run.stderr, /blocked-or-failed/);
  assert.doesNotMatch(run.stderr, /synthetic-only/);
});
