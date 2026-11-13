import { getRepository } from "@/lib/appwrite/server";
import { deploymentIssues } from "@/lib/operations/config";
import { verifyBackend } from "@/lib/operations/readiness";
import { operationLog } from "@/lib/operations/log";
export const dynamic = "force-dynamic";
let snapshot: { at: number; result: Promise<boolean> } | undefined;
async function ready() {
  if (deploymentIssues(process.env).length) return false;
  try {
    await verifyBackend(await getRepository());
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
