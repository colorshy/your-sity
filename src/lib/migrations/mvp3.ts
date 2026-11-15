/** Offline additive plan only. No SDK, credentials, row access or execution capability. */
import {
  inspectSchema,
  type Column,
  type TableMetadata,
} from "../appwrite/schema";
import type { Table } from "../appwrite/types";
export const migrationTarget = {
  endpoint: "https://fra.cloud.appwrite.io/v1",
  project: "your-city",
  database: "your_city_db",
} as const;
const stringColumn = (key: string, size = 36, required = true): Column => ({
  key,
  type: "string",
  size,
  required,
  status: "available",
  array: false,
  default: null,
});
export const additions = {
  profiles: [stringColumn("social_version", 36, false)],
  comments: [stringColumn("parent_id", 36, false)],
  reports: [stringColumn("comment_id", 36, false)],
  post_likes: [stringColumn("user_id"), stringColumn("post_id")],
  bookmarks: [stringColumn("user_id"), stringColumn("post_id")],
  connections: [
    stringColumn("user_id"),
    stringColumn("target_id"),
    stringColumn("kind", 16),
  ],
  notifications: [
    stringColumn("recipient_id"),
    stringColumn("actor_id"),
    stringColumn("kind", 16),
    stringColumn("post_id", 36, false),
    stringColumn("comment_id", 36, false),
    {
      key: "is_read",
      type: "boolean",
      required: true,
      status: "available",
      array: false,
      default: null,
    },
  ],
} satisfies Partial<Record<Table, Column[]>>;
export const newTables = [
  "post_likes",
  "bookmarks",
  "connections",
  "notifications",
] as const;
export type MigrationSnapshot = typeof migrationTarget & {
  tables: TableMetadata[];
};
export type MigrationOperation =
  | {
      operation: "create-table";
      table: Table;
      enabled: true;
      rowSecurity: false;
      permissions: [];
    }
  | { operation: "create-column"; table: Table; column: Omit<Column, "status"> }
  | {
      operation: "create-index";
      table: Table;
      key: string;
      type: "key" | "unique";
      columns: string[];
    };
const indexSpecs: {
  table: Table;
  key: string;
  type: "key" | "unique";
  columns: string[];
}[] = [
  {
    table: "post_likes",
    key: "yc_like_pair",
    type: "unique",
    columns: ["user_id", "post_id"],
  },
  {
    table: "post_likes",
    key: "yc_likes_post",
    type: "key",
    columns: ["post_id"],
  },
  {
    table: "bookmarks",
    key: "yc_bookmark_pair",
    type: "unique",
    columns: ["user_id", "post_id"],
  },
  {
    table: "bookmarks",
    key: "yc_bookmarks_user",
    type: "key",
    columns: ["user_id"],
  },
  {
    table: "connections",
    key: "yc_connection_pair",
    type: "unique",
    columns: ["user_id", "target_id", "kind"],
  },
  {
    table: "connections",
    key: "yc_connections_user",
    type: "key",
    columns: ["user_id"],
  },
  {
    table: "connections",
    key: "yc_connections_target",
    type: "key",
    columns: ["target_id", "kind"],
  },
  {
    table: "notifications",
    key: "yc_notifications_recipient",
    type: "key",
    columns: ["recipient_id"],
  },
  {
    table: "comments",
    key: "yc_comments_author",
    type: "key",
    columns: ["author_id", "status"],
  },
  {
    table: "comments",
    key: "yc_comments_post",
    type: "key",
    columns: ["post_id", "status"],
  },
];
export function planMvp3Migration(input: MigrationSnapshot) {
  if (
    Object.entries(migrationTarget).some(
      ([k, v]) => input[k as keyof typeof migrationTarget] !== v,
    ) ||
    !Array.isArray(input.tables)
  )
    throw new Error("Migration target mismatch");
  const original = new Map(input.tables.map((t) => [t.$id, t]));
  if (original.size !== input.tables.length)
    throw new Error("Duplicate table metadata");
  const working = structuredClone(input.tables);
  const operations: MigrationOperation[] = [];
  for (const table of [
    "cities",
    "profiles",
    "communities",
    "community_memberships",
    "posts",
    "comments",
    "reports",
  ] as const)
    if (!original.has(table)) throw new Error("Core table missing: " + table);
  for (const table of newTables)
    if (!original.has(table)) {
      operations.push({
        operation: "create-table",
        table,
        enabled: true,
        rowSecurity: false,
        permissions: [],
      });
      working.push({
        $id: table,
        enabled: true,
        rowSecurity: false,
        $permissions: [],
        columns: [],
        indexes: [],
      });
    }
  for (const [table, columns] of Object.entries(additions) as [
    keyof typeof additions,
    Column[],
  ][]) {
    const metadata = working.find((t) => t.$id === table)!;
    for (const column of columns) {
      const found = metadata.columns.find((c) => c.key === column.key);
      if (found) {
        if (found.status !== "available")
          throw new Error("Wait for column: " + table + "." + column.key);
        continue;
      }
      const { status: readiness, ...definition } = column;
      void readiness;
      operations.push({
        operation: "create-column",
        table,
        column: definition,
      });
      metadata.columns.push(column);
    }
  }
  // Resolve physical aliases before proposing indexes on existing core tables.
  for (const spec of indexSpecs) {
    const metadata = working.find((t) => t.$id === spec.table)!;
    const columns = spec.columns.map((f) => {
      if (spec.table !== "comments") return f;
      const aliases: Record<string, string[]> = {
        author_id: ["author_id", "authorId", "user_id", "userId"],
        post_id: ["post_id", "postId"],
        status: ["status", "moderation_status", "moderationStatus"],
      };
      return (
        metadata.columns.find((c) => aliases[f]?.includes(c.key))?.key ?? f
      );
    });
    const equivalent = metadata.indexes?.find((i) =>
      spec.type === "unique"
        ? i.type === "unique" &&
          i.columns.length === columns.length &&
          columns.every((c) => i.columns.includes(c))
        : ["key", "unique"].includes(i.type) &&
          columns.every((c, n) => i.columns[n] === c),
    );
    if (equivalent) {
      if (equivalent.status !== "available")
        throw new Error("Wait for index: " + spec.table + "." + equivalent.key);
      continue;
    }
    if (metadata.indexes?.some((i) => i.key === spec.key))
      throw new Error("Index name conflict: " + spec.table + "." + spec.key);
    operations.push({ operation: "create-index", ...spec, columns });
    (metadata.indexes ??= []).push({
      key: spec.key,
      type: spec.type,
      columns,
      status: "available",
    });
  }
  // Validate simulated completion; never repair permissions, incompatible columns or core indexes.
  for (const metadata of working)
    if (
      [
        "cities",
        "profiles",
        "communities",
        "community_memberships",
        "posts",
        "comments",
        "reports",
        ...newTables,
      ].includes(metadata.$id)
    )
      inspectSchema(metadata.$id as Table, metadata);
  return {
    target: migrationTarget,
    operations,
    cloudExecuted: false,
    order:
      "tables, columns (wait available), indexes (wait available), re-inspect and query preflight",
    builtInOrdering:
      "Verify actual $createdAt DESC/$id DESC queries; system-index support is provider-specific",
  };
}
