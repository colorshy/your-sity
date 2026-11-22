/** Provision only the allowlisted, separate MVP 5.1 lab project. */
import { readFileSync } from "node:fs";
import { Client, Storage, TablesDB } from "node-appwrite";
import {
  allowedIsolatedEndpoint,
  definitions,
  isolatedBucketDefinition,
  isolatedDatabase,
  isolatedProject,
  planIsolatedBootstrap,
  seedRows,
  type BootstrapSnapshot,
  verifyIsolatedTable,
} from "../src/lib/migrations/isolated-bootstrap";
import { tables, type TableMetadata } from "../src/lib/appwrite/schema";
import {
  verifyMvp5Bucket,
  type BucketMetadata,
} from "../src/lib/migrations/mvp5";

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const project = process.env.APPWRITE_MIGRATION_PROJECT_ID;
const key = process.env.APPWRITE_MIGRATION_API_KEY;
const endpoint =
  process.env.APPWRITE_MIGRATION_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
const database = process.env.APPWRITE_MIGRATION_DATABASE_ID || isolatedDatabase;
function notFound(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 404
  );
}
async function optional<T>(action: () => Promise<T>): Promise<T | undefined> {
  try {
    return await action();
  } catch (error) {
    if (notFound(error)) return undefined;
    throw error;
  }
}
function targetAllowed() {
  return (
    project === isolatedProject &&
    database === isolatedDatabase &&
    allowedIsolatedEndpoint(endpoint, args.includes("--self-hosted"))
  );
}
async function main() {
  if (!targetAllowed()) throw new Error("Isolated target is not allowlisted");
  if (apply && (!args.includes("--isolated") || !key))
    throw new Error("Apply requires --isolated and migration credentials");
  const snapshotIndex = args.indexOf("--snapshot");
  if (snapshotIndex >= 0) {
    if (apply || !args[snapshotIndex + 1])
      throw new Error("Snapshot is dry-run only");
    const snapshot = JSON.parse(
      readFileSync(args[snapshotIndex + 1], "utf8"),
    ) as BootstrapSnapshot;
    console.log(
      JSON.stringify({
        status: "dry-run",
        project,
        operations: planIsolatedBootstrap(snapshot),
        networkRequests: 0,
      }),
    );
    return;
  }
  if (!key) throw new Error("Read-only metadata credentials required");
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(project!)
    .setKey(key);
  const db = new TablesDB(client),
    storage = new Storage(client);
  async function readSnapshot(): Promise<BootstrapSnapshot> {
    const foundDatabase = await optional(() =>
      db.get({ databaseId: database }),
    );
    const foundTables: TableMetadata[] = [];
    const rows: BootstrapSnapshot["rows"] = {};
    if (foundDatabase)
      for (const table of tables) {
        const meta = await optional(() =>
          db.getTable({ databaseId: database, tableId: table }),
        );
        if (meta) foundTables.push(meta as unknown as TableMetadata);
      }
    for (const seed of seedRows) {
      if (!foundTables.some((t) => t.$id === seed.table)) continue;
      const row = await optional(() =>
        db.getRow({
          databaseId: database,
          tableId: seed.table,
          rowId: seed.id,
        }),
      );
      if (row)
        rows[seed.table + ":" + seed.id] = row as unknown as Record<
          string,
          unknown
        >;
    }
    const bucket = await optional(() =>
      storage.getBucket({ bucketId: isolatedBucketDefinition.bucketId }),
    );
    return {
      database: foundDatabase
        ? { $id: foundDatabase.$id, enabled: foundDatabase.enabled }
        : undefined,
      tables: foundTables,
      bucket: bucket as BucketMetadata | undefined,
      rows,
    };
  }
  const operations = planIsolatedBootstrap(await readSnapshot());
  console.log(
    JSON.stringify({
      status: apply ? "applying-isolated" : "dry-run",
      project,
      operations,
    }),
  );
  if (!apply) return;
  if (operations.includes("create-database:" + database))
    await db.create({
      databaseId: database,
      name: "Your City MVP 5.1 isolated",
      enabled: true,
    });
  for (const table of tables)
    if (operations.includes("create-table:" + table)) {
      const definition = definitions[table];
      await db.createTable({
        databaseId: database,
        tableId: table,
        name: table,
        permissions: ["cities", "communities"].includes(table)
          ? ['read("any")']
          : [],
        rowSecurity: false,
        enabled: true,
        columns: definition.columns,
        indexes: definition.indexes,
      });
    }
  if (operations.includes("create-bucket:" + isolatedBucketDefinition.bucketId))
    await storage.createBucket(isolatedBucketDefinition);
  // Appwrite may finish columns and indexes asynchronously. An incomplete readback
  // fails safely and a later invocation resumes from the last verified resource.
  for (const table of tables) {
    const meta = await db.getTable({ databaseId: database, tableId: table });
    verifyIsolatedTable(table, meta as unknown as TableMetadata);
  }
  verifyMvp5Bucket(
    (await storage.getBucket({
      bucketId: isolatedBucketDefinition.bucketId,
    })) as unknown as BucketMetadata,
  );
  for (const seed of seedRows)
    if (operations.includes("create-row:" + seed.table + ":" + seed.id))
      await db.createRow({
        databaseId: database,
        tableId: seed.table,
        rowId: seed.id,
        data: seed.data,
      });
  const remainder = planIsolatedBootstrap(await readSnapshot());
  if (remainder.length) throw new Error("Bootstrap incomplete");
  console.log(
    JSON.stringify({
      status: "verified-isolated",
      project,
      operationsRemaining: 0,
    }),
  );
}
main().catch(() => {
  console.error(
    JSON.stringify({
      status: "blocked-or-failed",
      reason:
        "Inspect isolated target, provider limits, incomplete metadata or seed drift; no shared project was changed",
    }),
  );
  process.exitCode = 2;
});
