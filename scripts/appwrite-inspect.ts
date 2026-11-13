/** Read-only inspection for the coordinated backend operator; never creates or changes resources. */
import { Client, TablesDB, Query } from "node-appwrite";
import {
  fields,
  tables,
  inspectSchema,
  type TableMetadata,
} from "../src/lib/appwrite/schema";
import { appwriteConfig } from "../src/lib/appwrite/config";
async function main() {
  const { configureTransport } = await import("../src/lib/appwrite/transport");
  configureTransport();
  const config = appwriteConfig();
  if (!config) {
    console.error(
      "Missing APPWRITE_API_KEY in the process environment. No remote changes made.",
    );
    process.exit(2);
  }
  const db = new TablesDB(
    new Client()
      .setEndpoint(config.endpoint)
      .setProject(config.project)
      .setKey(config.key),
  );
  try {
    const metadata: TableMetadata[] = [];
    for (const table of tables) {
      const result = await db.getTable({
        databaseId: config.database,
        tableId: table,
      });
      metadata.push(result as unknown as TableMetadata);
    }
    console.log(
      JSON.stringify(
        metadata.map((m) => ({
          table: m.$id,
          enabled: m.enabled,
          rowSecurity: m.rowSecurity,
          permissions: m.$permissions,
          columns: m.columns,
          indexes: m.indexes,
        })),
        null,
        2,
      ),
    );
    // Validate the application contract. Schema/permission changes are handled by the separate backend integration.
    for (const m of metadata)
      inspectSchema(m.$id as keyof typeof fields, m, false);
    for (const table of ["cities", "communities"] as const) {
      const schema = inspectSchema(
        table,
        metadata.find((m) => m.$id === table)!,
        false,
      );
      const rows = await db.listRows({
        databaseId: config.database,
        tableId: table,
        queries: [
          Query.limit(100),
          Query.select(["$id", ...Object.values(schema.keys)]),
        ],
      });
      console.log(JSON.stringify({ table, existingPublicRows: rows.rows }));
    }
    console.log(
      "Read-only inspection finished. No resources or permissions modified. See BACKEND_REQUIREMENTS.md for the coordinated backend work.",
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        message:
          "Appwrite inspection/permission verification failed; do not enable application writes.",
        code:
          typeof error === "object" && error && "code" in error
            ? error.code
            : undefined,
        localReason:
          error instanceof Error &&
          /Incompatible|Unsafe|Unmapped|Unsupported|Unexpected|Content/.test(
            error.message,
          )
            ? error.message
            : undefined,
      }),
    );
    process.exitCode = 1;
  }
}
void main();
