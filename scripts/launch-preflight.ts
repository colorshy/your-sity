/** Optional direct Appwrite audit; not a Vercel deployment prerequisite. Never prints secrets. */
import { Client, TablesDB } from "node-appwrite";
import { appwriteConfig } from "../src/lib/appwrite/config";
import { configureTransport } from "../src/lib/appwrite/transport";
import {
  inspectSchema,
  tables,
  type Schema,
  type TableMetadata,
} from "../src/lib/appwrite/schema";
import { AppwriteRepository } from "../src/lib/appwrite/store";
import { verifyBackend } from "../src/lib/operations/readiness";
async function main() {
  const missing: string[] = [];
  if (!process.env.APPWRITE_API_KEY) missing.push("APPWRITE_API_KEY");
  if (missing.length) {
    console.log(
      JSON.stringify({ status: "blocked", missing, networkRequests: 0 }),
    );
    process.exitCode = 2;
    return;
  }
  configureTransport();
  const config = appwriteConfig();
  if (!config) {
    process.exitCode = 2;
    return;
  }
  try {
    const api = new TablesDB(
      new Client()
        .setEndpoint(config.endpoint)
        .setProject(config.project)
        .setKey(config.key),
    );
    const metadata = await Promise.all(
      tables.map((table) =>
        api.getTable({ databaseId: config.database, tableId: table }),
      ),
    );
    const schemas = {} as Record<(typeof tables)[number], Schema>;
    tables.forEach((table, i) => {
      schemas[table] = inspectSchema(
        table,
        metadata[i] as unknown as TableMetadata,
      );
    });
    await verifyBackend(new AppwriteRepository(api, config.database, schemas));
    let transaction = "not-tested";
    if (process.argv.includes("--verify-transactions")) {
      const tx = await api.createTransaction({ ttl: 30 });
      await api.updateTransaction({ transactionId: tx.$id, rollback: true });
      transaction = "create-rollback-passed";
    }
    console.log(
      JSON.stringify({
        status: "backend-preflight-passed",
        transaction,
        liveAuth: "not-tested",
        deployment: "not-created",
        note: "Not production acceptance or publication",
      }),
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        status: "backend-preflight-failed",
        code:
          typeof error === "object" && error && "code" in error
            ? error.code
            : undefined,
      }),
    );
    process.exitCode = 1;
  }
}
void main();
