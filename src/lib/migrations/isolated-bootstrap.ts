import { inspectSchema, tables, type TableMetadata } from "../appwrite/schema";
import { safeTablePolicy } from "../appwrite/policy";
import type { Table } from "../appwrite/types";
import { mediaBucket, maxImageBytes } from "../appwrite/media-limits";
import { isolatedProjectId } from "../appwrite/config";
import {
  mvp5Columns,
  mvp5Indexes,
  verifyMvp5Bucket,
  type BucketMetadata,
} from "./mvp5";

export type Definition = {
  columns: { key: string; type: string; size?: number; required: boolean }[];
  indexes: { key: string; type: "key" | "unique"; attributes: string[] }[];
};
const string = (key: string, size = 36, required = true) => ({
  key,
  type: "string",
  size,
  required,
});
const boolean = (key: string, required = true) => ({
  key,
  type: "boolean",
  required,
});
const index = (
  key: string,
  attributes: string[],
  type: "key" | "unique" = "key",
) => ({ key, type, attributes });
export const isolatedProject = isolatedProjectId;
export const isolatedDatabase = "your_city_db";
export function allowedIsolatedEndpoint(endpoint: string, selfHosted: boolean) {
  if (endpoint === "https://fra.cloud.appwrite.io/v1") return true;
  try {
    const url = new URL(endpoint);
    return (
      selfHosted &&
      url.protocol === "http:" &&
      url.hostname === "127.0.0.1" &&
      url.pathname === "/v1" &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}
export const baseTables = [
  "cities",
  "communities",
  "profiles",
  "community_memberships",
  "posts",
  "comments",
  "reports",
  "post_likes",
  "bookmarks",
  "connections",
  "notifications",
] as const;
export const definitions: Record<Table, Definition> = {
  cities: {
    columns: [string("name_kk", 128), string("name_ru", 128)],
    indexes: [],
  },
  communities: {
    columns: [
      string("city_id"),
      string("name_kk", 128),
      string("name_ru", 128),
      string("description_kk", 1000, false),
      string("description_ru", 1000, false),
    ],
    indexes: [index("yc_communities_city", ["city_id"])],
  },
  profiles: {
    columns: [
      string("user_id"),
      string("display_name", 80),
      string("city_id"),
      string("locale", 8),
      boolean("onboarded"),
      string("social_version", 36, false),
    ],
    indexes: [index("yc_profiles_user", ["user_id"], "unique")],
  },
  community_memberships: {
    columns: [string("user_id"), string("community_id")],
    indexes: [
      index("yc_membership_pair", ["user_id", "community_id"], "unique"),
    ],
  },
  posts: {
    columns: [
      string("author_id"),
      string("community_id"),
      string("body", 5000),
      string("status", 16),
    ],
    indexes: [
      index("yc_posts_city_feed", [
        "community_id",
        "status",
        "$createdAt",
        "$id",
      ]),
      index("yc_posts_author", ["author_id", "status"]),
    ],
  },
  comments: {
    columns: [
      string("author_id"),
      string("post_id"),
      string("body", 2000),
      string("status", 16),
      string("parent_id", 36, false),
    ],
    indexes: [
      index("yc_comments_post", ["post_id", "status", "$createdAt", "$id"]),
      index("yc_comments_author", ["author_id", "status"]),
    ],
  },
  reports: {
    columns: [
      string("reporter_id"),
      string("post_id"),
      string("reason", 1000),
      string("status", 16),
      string("comment_id", 36, false),
    ],
    indexes: [index("yc_reports_queue", ["status", "$createdAt", "$id"])],
  },
  post_likes: {
    columns: [string("user_id"), string("post_id")],
    indexes: [
      index("yc_like_pair", ["user_id", "post_id"], "unique"),
      index("yc_likes_post", ["post_id"]),
      index("yc_likes_user", ["user_id"]),
    ],
  },
  bookmarks: {
    columns: [string("user_id"), string("post_id")],
    indexes: [
      index("yc_bookmark_pair", ["user_id", "post_id"], "unique"),
      index("yc_bookmarks_user", ["user_id"]),
    ],
  },
  connections: {
    columns: [string("user_id"), string("target_id"), string("kind", 16)],
    indexes: [
      index("yc_connection_pair", ["user_id", "target_id", "kind"], "unique"),
      index("yc_connections_user", ["user_id"]),
      index("yc_connections_target", ["target_id", "kind"]),
    ],
  },
  notifications: {
    columns: [
      string("recipient_id"),
      string("actor_id"),
      string("kind", 16),
      string("post_id", 36, false),
      string("comment_id", 36, false),
      boolean("is_read"),
    ],
    indexes: [index("yc_notifications_recipient", ["recipient_id"])],
  },
  post_reposts: {
    columns: mvp5Columns.post_reposts,
    indexes: mvp5Indexes.post_reposts.map((i) => ({
      ...i,
      type: i.type as "key" | "unique",
    })),
  },
  post_media: {
    columns: mvp5Columns.post_media,
    indexes: mvp5Indexes.post_media.map((i) => ({
      ...i,
      type: i.type as "key" | "unique",
    })),
  },
};
export const seedRows = [
  {
    table: "cities",
    id: "shymkent",
    data: { name_kk: "Шымкент", name_ru: "Шымкент" },
  },
  ...(
    [
      ["drivers", "Көлік жүргізушілері", "Автолюбители"],
      ["discounts", "Жеңілдіктер", "Скидки"],
      ["city-news", "Қала өмірі", "Новости города"],
      ["students", "Студенттер", "Студенты"],
      ["neighborhoods", "Көршілер", "Соседи"],
      ["events", "Іс-шаралар", "События"],
      ["marketplace", "Маркет", "Маркет"],
    ] as const
  ).map(([id, name_kk, name_ru]) => ({
    table: "communities",
    id,
    data: { city_id: "shymkent", name_kk, name_ru },
  })),
] as const;
export function verifyIsolatedTable(table: Table, meta: TableMetadata) {
  inspectSchema(table, meta);
  const definition = definitions[table];
  for (const expected of definition.columns) {
    const actual = meta.columns.find((c) => c.key === expected.key);
    if (
      !actual ||
      actual.status !== "available" ||
      actual.required !== expected.required ||
      actual.array ||
      (expected.type === "string"
        ? !["string", "varchar"].includes(actual.type) ||
          (actual.size ?? 0) < (expected.size ?? 0)
        : actual.type !== expected.type)
    )
      throw new Error("Isolated column drift: " + table + "." + expected.key);
  }
  for (const expected of definition.indexes)
    if (
      !meta.indexes?.some(
        (i) =>
          i.status === "available" &&
          i.type === expected.type &&
          i.columns.join("|") === expected.attributes.join("|"),
      )
    )
      throw new Error("Isolated index missing: " + table + "." + expected.key);
  if (
    !safeTablePolicy(table, meta.$permissions, meta.rowSecurity, meta.enabled)
  )
    throw new Error("Isolated table policy drift: " + table);
}
export type BootstrapSnapshot = {
  database?: { $id: string; enabled: boolean };
  tables: TableMetadata[];
  bucket?: BucketMetadata;
  rows: Record<string, Record<string, unknown> | undefined>;
};
export function planIsolatedBootstrap(snapshot: BootstrapSnapshot) {
  if (
    snapshot.database &&
    (snapshot.database.$id !== isolatedDatabase || !snapshot.database.enabled)
  )
    throw new Error("Isolated database drift");
  const present = new Map(snapshot.tables.map((t) => [t.$id, t]));
  if (
    present.size !== snapshot.tables.length ||
    snapshot.tables.some((t) => !tables.includes(t.$id as Table))
  )
    throw new Error("Unexpected isolated table metadata");
  for (const key of Object.keys(snapshot.rows))
    if (
      !seedRows.some(
        (seed) => key === seed.table + ":" + seed.id && present.has(seed.table),
      )
    )
      throw new Error("Unexpected isolated seed metadata");
  const operations: string[] = [];
  if (!snapshot.database) {
    if (
      snapshot.tables.length ||
      snapshot.bucket ||
      Object.keys(snapshot.rows).length
    )
      throw new Error("Orphan resources without isolated database");
    operations.push("create-database:" + isolatedDatabase);
  }
  for (const table of tables) {
    const meta = present.get(table);
    if (meta) verifyIsolatedTable(table, meta);
    else operations.push("create-table:" + table);
  }
  if (snapshot.bucket) verifyMvp5Bucket(snapshot.bucket);
  else operations.push("create-bucket:" + mediaBucket);
  for (const seed of seedRows) {
    const row = snapshot.rows[seed.table + ":" + seed.id];
    if (row) {
      for (const [key, value] of Object.entries(seed.data))
        if (row[key] !== value) throw new Error("Isolated seed drift");
    } else operations.push("create-row:" + seed.table + ":" + seed.id);
  }
  return operations;
}
export const isolatedBucketDefinition = {
  bucketId: mediaBucket,
  name: "Your City post media",
  permissions: [],
  fileSecurity: true,
  enabled: true,
  maximumFileSize: maxImageBytes,
  allowedFileExtensions: ["jpg", "png", "webp"],
  antivirus: true,
  stripMetadata: true,
};
