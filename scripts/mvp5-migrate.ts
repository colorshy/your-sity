/** Additive MVP 5 migration. Dry-run by default; apply is isolated-project only. */
import { readFileSync } from "node:fs";
import { Client, TablesDB, Storage } from "node-appwrite";
import {
  mvp5Tables,
  mvp5Columns,
  mvp5Indexes,
  planMvp5,
  type BucketMetadata,
  verifyMvp5Bucket,
  verifyMvp5Table,
} from "../src/lib/migrations/mvp5";
import { mediaBucket, maxImageBytes } from "../src/lib/appwrite/media-limits";
import type { TableMetadata } from "../src/lib/appwrite/schema";
const snapshot = process.argv.indexOf("--snapshot");
const apply = process.argv.includes("--apply");
const project = process.env.APPWRITE_MIGRATION_PROJECT_ID;
const key = process.env.APPWRITE_MIGRATION_API_KEY;
const endpoint =
  process.env.APPWRITE_MIGRATION_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
const databaseId = process.env.APPWRITE_MIGRATION_DATABASE_ID || "your_city_db";
function missing(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 404
  );
}
async function main() {
  if (
    apply &&
    (!process.argv.includes("--isolated") ||
      !project ||
      project === "your-city" ||
      !key ||
      !endpoint.startsWith("https://"))
  )
    throw new Error(
      "Apply requires an isolated project, migration key and explicit --isolated flag",
    );
  if (snapshot >= 0) {
    if (apply) throw new Error("Snapshot mode is dry-run only");
    const data = JSON.parse(readFileSync(process.argv[snapshot + 1], "utf8"));
    console.log(
      JSON.stringify({
        status: "dry-run",
        operations: planMvp5(data.tables, data.bucket),
        networkRequests: 0,
      }),
    );
    return;
  }
  if (!project || !key)
    throw new Error("Migration metadata credentials required");
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(project)
    .setKey(key);
  const db = new TablesDB(client),
    storage = new Storage(client);
  const found: TableMetadata[] = [];
  for (const table of mvp5Tables)
    try {
      found.push(
        (await db.getTable({
          databaseId,
          tableId: table,
        })) as unknown as TableMetadata,
      );
    } catch (e) {
      if (!missing(e)) throw e;
    }
  let bucket: BucketMetadata | undefined;
  try {
    bucket = (await storage.getBucket({
      bucketId: mediaBucket,
    })) as unknown as BucketMetadata;
  } catch (e) {
    if (!missing(e)) throw e;
  }
  const operations = planMvp5(found, bucket);
  console.log(
    JSON.stringify({
      status: apply ? "applying-isolated" : "dry-run",
      project,
      operations,
    }),
  );
  if (!apply) return;
  for (const table of mvp5Tables)
    if (operations.includes("create-table:" + table)) {
      await db.createTable({
        databaseId,
        tableId: table,
        name: table,
        permissions: [],
        rowSecurity: false,
        enabled: true,
        columns: mvp5Columns[table],
        indexes: mvp5Indexes[table],
      });
    }
  if (operations.includes("create-bucket:" + mediaBucket))
    await storage.createBucket({
      bucketId: mediaBucket,
      name: "Your City post media",
      permissions: [],
      fileSecurity: true,
      enabled: true,
      maximumFileSize: maxImageBytes,
      allowedFileExtensions: ["jpg", "png", "webp"],
      antivirus: true,
      stripMetadata: true,
    });
  for (const table of mvp5Tables)
    verifyMvp5Table(
      table,
      (await db.getTable({
        databaseId,
        tableId: table,
      })) as unknown as TableMetadata,
    );
  verifyMvp5Bucket(
    (await storage.getBucket({
      bucketId: mediaBucket,
    })) as unknown as BucketMetadata,
  );
  console.log(JSON.stringify({ status: "verified-isolated", project }));
}
main().catch(() => {
  console.error(
    JSON.stringify({
      status: "blocked-or-failed",
      reason:
        "Check isolated project authorization, existing metadata and provider operation status",
    }),
  );
  process.exitCode = 2;
});
