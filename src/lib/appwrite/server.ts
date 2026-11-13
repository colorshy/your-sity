import "server-only";
import { configureTransport } from "./transport";
configureTransport();
import { Account, Client, TablesDB } from "node-appwrite";
import { cookies } from "next/headers";
import { cache } from "react";
import { appwriteConfig, sessionCookie } from "./config";
import {
  inspectSchema,
  tables,
  type Schema,
  type TableMetadata,
} from "./schema";
import { AppwriteRepository } from "./store";
export function apiClient() {
  const config = appwriteConfig();
  if (!config) throw new Error("Appwrite not configured");
  return new Client()
    .setEndpoint(config.endpoint)
    .setProject(config.project)
    .setKey(config.key);
}
export function anonymousAccount() {
  const config = appwriteConfig();
  if (!config) throw new Error("Appwrite not configured");
  return new Account(
    new Client().setEndpoint(config.endpoint).setProject(config.project),
  );
}
export async function sessionAccount() {
  const config = appwriteConfig();
  if (!config) throw new Error("Appwrite not configured");
  const secret = (await cookies()).get(sessionCookie())?.value;
  if (!secret) return null;
  return new Account(
    new Client()
      .setEndpoint(config.endpoint)
      .setProject(config.project)
      .setSession(secret),
  );
}
export const getRepository = cache(async () => {
  const config = appwriteConfig();
  if (!config) throw new Error("Appwrite not configured");
  const db = new TablesDB(apiClient());
  const schemas = {} as Record<(typeof tables)[number], Schema>;
  const metadata = await Promise.all(
    tables.map((table) =>
      db.getTable({ databaseId: config.database, tableId: table }),
    ),
  );
  tables.forEach((table, i) => {
    schemas[table] = inspectSchema(
      table,
      metadata[i] as unknown as TableMetadata,
    );
  });
  return new AppwriteRepository(db, config.database, schemas);
});
