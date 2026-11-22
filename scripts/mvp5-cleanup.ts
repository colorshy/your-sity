/** Retryable orphan media cleanup. Dry-run by default. */
import { Client, TablesDB, Storage, Query } from "node-appwrite";
import { mediaBucket } from "../src/lib/appwrite/media-limits";
import { cleanupCandidate } from "../src/lib/migrations/media-cleanup";
import {
  allowedIsolatedEndpoint,
  isolatedDatabase,
  isolatedProject,
} from "../src/lib/migrations/isolated-bootstrap";
const project = process.env.APPWRITE_MIGRATION_PROJECT_ID;
const key = process.env.APPWRITE_MIGRATION_API_KEY;
const endpoint =
  process.env.APPWRITE_MIGRATION_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
const databaseId = process.env.APPWRITE_MIGRATION_DATABASE_ID || "your_city_db";
const apply = process.argv.includes("--apply-isolated");
async function main() {
  if (!project || !key)
    throw new Error("Missing migration metadata credentials");
  if (
    project !== isolatedProject ||
    databaseId !== isolatedDatabase ||
    !allowedIsolatedEndpoint(endpoint, process.argv.includes("--self-hosted"))
  )
    throw new Error("Cleanup target is not the allowlisted isolated project");
  if (apply && !process.argv.includes("--isolated"))
    throw new Error(
      "Shared project cleanup requires a separately approved runbook",
    );
  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(project)
    .setKey(key);
  const db = new TablesDB(client),
    storage = new Storage(client);
  const now = Date.now();
  const candidates: string[] = [];
  let offset = 0;
  while (true) {
    const batch = await db.listRows({
      databaseId,
      tableId: "post_media",
      queries: [Query.limit(100), Query.offset(offset)],
    });
    for (const media of batch.rows) {
      const row = media as unknown as {
        $id: string;
        $createdAt: string;
        post_id: string;
        file_id: string;
      };
      let post: { status?: string } | null = null;
      try {
        post = (await db.getRow({
          databaseId,
          tableId: "posts",
          rowId: row.post_id,
        })) as { status?: string };
      } catch (error) {
        if (!(
          typeof error === "object" &&
          error &&
          "code" in error &&
          error.code === 404
        ))
          throw error;
      }
      if (
        cleanupCandidate(post ? (post.status ?? "") : null, row.$createdAt, now)
      )
        candidates.push(row.$id);
    }
    if (batch.rows.length < 100) break;
    offset += batch.rows.length;
  }
  console.log(
    JSON.stringify({
      status: apply ? "applying-isolated" : "dry-run",
      candidateCount: candidates.length,
    }),
  );
  if (!apply) return;
  for (const rowId of candidates) {
    const row = (await db.getRow({
      databaseId,
      tableId: "post_media",
      rowId,
    })) as unknown as { file_id: string; post_id: string; $createdAt: string };
    let post: { status?: string } | undefined;
    try {
      post = (await db.getRow({
        databaseId,
        tableId: "posts",
        rowId: row.post_id,
      })) as { status?: string };
    } catch (error) {
      if (!(
        typeof error === "object" &&
        error &&
        "code" in error &&
        error.code === 404
      ))
        throw error;
    }
    if (
      !cleanupCandidate(
        post ? (post.status ?? "") : null,
        row.$createdAt,
        Date.now(),
      )
    )
      continue;
    try {
      await storage.deleteFile({ bucketId: mediaBucket, fileId: row.file_id });
    } catch (error) {
      if (!(
        typeof error === "object" &&
        error &&
        "code" in error &&
        error.code === 404
      ))
        throw error;
    }
    await db.deleteRow({ databaseId, tableId: "post_media", rowId });
  }
  console.log(
    JSON.stringify({ status: "cleaned-isolated", deleted: candidates.length }),
  );
}
main().catch(() => {
  console.error(
    JSON.stringify({
      status: "blocked-or-failed",
      reason:
        "Check metadata and isolated project authorization; retry is safe after inspection",
    }),
  );
  process.exitCode = 2;
});
