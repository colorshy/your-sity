import { getRepository, apiClient } from "@/lib/appwrite/server";
import { Storage } from "node-appwrite";
import { mediaBucket } from "@/lib/appwrite/media-limits";
import { verifyMvp5Bucket, type BucketMetadata } from "@/lib/migrations/mvp5";
import { deploymentIssues } from "@/lib/operations/config";
import { verifyBackend } from "@/lib/operations/readiness";
import { operationLog } from "@/lib/operations/log";
import { appwriteConfig, isolatedProjectId } from "@/lib/appwrite/config";
import { TablesDB } from "node-appwrite";
import { tables, type TableMetadata } from "@/lib/appwrite/schema";
import { verifyIsolatedTable } from "@/lib/migrations/isolated-bootstrap";
export const dynamic = "force-dynamic";
let snapshot: { at: number; result: Promise<boolean> } | undefined;
async function ready() {
  if (deploymentIssues(process.env).length) return false;
  try {
    await verifyBackend(await getRepository());
    const config = appwriteConfig();
    if (config?.project === isolatedProjectId) {
      const db = new TablesDB(apiClient());
      const database = await db.get({ databaseId: config.database });
      if (database.$id !== config.database || !database.enabled)
        throw new Error("Isolated database unavailable");
      await Promise.all(
        tables.map(async (table) =>
          verifyIsolatedTable(
            table,
            (await db.getTable({
              databaseId: config.database,
              tableId: table,
            })) as unknown as TableMetadata,
          ),
        ),
      );
    }
    verifyMvp5Bucket(
      (await new Storage(apiClient()).getBucket({
        bucketId: mediaBucket,
      })) as unknown as BucketMetadata,
    );
    return true;
  } catch {
    return false;
  }
}
export async function GET() {
  const now = Date.now();
  if (!snapshot || now - snapshot.at > 30000) {
    snapshot = {
      at: now,
      result: ready().then((value) => {
        operationLog("backend_readiness", value ? "success" : "failed");
        return value;
      }),
    };
  }
  const value = await snapshot.result;
  return Response.json(
    { status: value ? "ready" : "not-ready" },
    {
      status: value ? 200 : 503,
      headers: { "Cache-Control": "no-store", "Retry-After": "30" },
    },
  );
}
