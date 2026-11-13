import type { Table } from "./types";
import { safeTablePolicy } from "./policy";
export const fields: Record<Table, Record<string, string[]>> = {
  cities: {
    name_kk: ["name_kk", "nameKk", "name_kz"],
    name_ru: ["name_ru", "nameRu"],
  },
  profiles: {
    user_id: ["user_id", "userId"],
    display_name: ["display_name", "displayName", "name"],
    city_id: ["city_id", "cityId"],
    locale: ["locale", "language"],
    onboarded: ["onboarded", "onboarding_complete"],
  },
  communities: {
    city_id: ["city_id", "cityId"],
    name_kk: ["name_kk", "nameKk", "name_kz"],
    name_ru: ["name_ru", "nameRu"],
  },
  community_memberships: {
    user_id: ["user_id", "userId"],
    community_id: ["community_id", "communityId"],
  },
  posts: {
    author_id: ["author_id", "authorId", "user_id", "userId"],
    community_id: ["community_id", "communityId"],
    body: ["body", "content", "text"],
    status: ["status", "moderation_status", "moderationStatus"],
  },
  comments: {
    author_id: ["author_id", "authorId", "user_id", "userId"],
    post_id: ["post_id", "postId"],
    body: ["body", "content", "text"],
    status: ["status", "moderation_status", "moderationStatus"],
  },
  reports: {
    reporter_id: ["reporter_id", "reporterId", "user_id", "userId"],
    post_id: ["post_id", "postId"],
    reason: ["reason"],
    status: ["status"],
  },
};
export const tables = Object.keys(fields) as Table[];
export type Column = {
  key: string;
  type: string;
  status: string;
  required: boolean;
  size?: number;
  elements?: string[];
  default?: unknown;
  array?: boolean;
};
export type TableMetadata = {
  $id: string;
  enabled: boolean;
  rowSecurity: boolean;
  $permissions: string[];
  columns: Column[];
  indexes?: {
    $id?: string;
    key: string;
    type: string;
    columns: string[];
    status: string;
  }[];
};
export type Schema = { keys: Record<string, string>; columns: Column[] };
export function inspectSchema(
  table: Table,
  metadata: TableMetadata,
  checkPermissions = true,
): Schema {
  if (metadata.$id !== table) throw new Error("Unexpected table identity");
  if (
    checkPermissions &&
    !safeTablePolicy(
      table,
      metadata.$permissions,
      metadata.rowSecurity,
      metadata.enabled,
    )
  )
    throw new Error("Unsafe table policy: " + table);
  const keys: Record<string, string> = {};
  for (const [field, aliases] of Object.entries(fields[table])) {
    const c = metadata.columns.find((c) => aliases.includes(c.key));
    if (
      !c ||
      c.status !== "available" ||
      c.array ||
      (field === "onboarded"
        ? c.type !== "boolean"
        : ![
            "string",
            "varchar",
            "text",
            "mediumtext",
            "longtext",
            ...(["status", "locale"].includes(field) ? ["enum"] : []),
          ].includes(c.type))
    )
      throw new Error("Incompatible column: " + table + "." + field);
    const capacity =
      c.size ??
      (
        { text: 65535, mediumtext: 16777215, longtext: 2147483647 } as Record<
          string,
          number
        >
      )[c.type] ??
      0;
    const minimum =
      field === "body"
        ? table === "posts"
          ? 5000
          : 2000
        : field === "display_name"
          ? 80
          : field === "reason"
            ? 1000
            : field.endsWith("_id")
              ? 36
              : 0;
    if (minimum && capacity < minimum)
      throw new Error("Content column too short: " + table + "." + field);
    if (field === "status" && c.elements) {
      for (const v of table === "reports"
        ? ["open", "resolved", "dismissed"]
        : ["published", "hidden", "deleted"])
        if (!c.elements.includes(v))
          throw new Error("Unsupported moderation enum");
    }
    keys[field] = c.key;
  }
  if (table === "communities") {
    for (const f of ["description_kk", "description_ru"])
      if (metadata.columns.some((c) => c.key === f)) keys[f] = f;
  }
  for (const c of metadata.columns) {
    if (c.required && c.default == null && !Object.values(keys).includes(c.key))
      throw new Error("Unmapped required column: " + table + "." + c.key);
  }

  const unique =
    table === "profiles"
      ? ["user_id"]
      : table === "community_memberships"
        ? ["user_id", "community_id"]
        : [];
  if (
    unique.length &&
    !metadata.indexes?.some(
      (i) =>
        i.status === "available" &&
        i.type === "unique" &&
        i.columns.length === unique.length &&
        unique.every((f) => i.columns.includes(keys[f])),
    )
  )
    throw new Error("Required unique index missing: " + table);
  return { keys, columns: metadata.columns };
}
