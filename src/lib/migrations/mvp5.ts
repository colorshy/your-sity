import { inspectSchema, type TableMetadata } from "../appwrite/schema";
import { maxImageBytes, mediaBucket } from "../appwrite/media-limits";
export type BucketMetadata = {
  $id: string;
  enabled: boolean;
  fileSecurity: boolean;
  $permissions: string[];
  maximumFileSize: number;
  allowedFileExtensions: string[];
  antivirus: boolean;
  stripMetadata: boolean;
};
export const mvp5Tables = ["post_reposts", "post_media"] as const;
export const mvp5Columns = {
  post_reposts: ["user_id", "post_id"].map((key) => ({
    key,
    type: "string",
    size: 36,
    required: true,
  })),
  post_media: [
    ...["post_id", "file_id", "owner_id"].map((key) => ({
      key,
      type: "string",
      size: 36,
      required: true,
    })),
    { key: "position", type: "integer", required: true },
    { key: "mime", type: "string", size: 32, required: true },
    { key: "bytes", type: "integer", required: true },
    { key: "ready", type: "boolean", required: true },
  ],
};
export const mvp5Indexes = {
  post_reposts: [
    {
      key: "unique_user_post",
      type: "unique",
      attributes: ["user_id", "post_id"],
    },
    { key: "by_user", type: "key", attributes: ["user_id"] },
    { key: "by_post", type: "key", attributes: ["post_id"] },
  ],
  post_media: [
    { key: "unique_file", type: "unique", attributes: ["file_id"] },
    {
      key: "unique_post_position",
      type: "unique",
      attributes: ["post_id", "position"],
    },
    { key: "by_post", type: "key", attributes: ["post_id"] },
  ],
};
export function verifyMvp5Table(
  table: (typeof mvp5Tables)[number],
  meta: TableMetadata,
) {
  inspectSchema(table, meta);
  for (const index of mvp5Indexes[table]) {
    if (
      !meta.indexes?.some(
        (i) =>
          i.status === "available" &&
          i.type === index.type &&
          i.columns.join("|") === index.attributes.join("|"),
      )
    )
      throw new Error(`MVP 5 index missing: ${table}.${index.key}`);
  }
  if (
    meta.columns.some(
      (c) =>
        !Object.keys(
          mvp5Columns[table].reduce<Record<string, true>>(
            (o, column) => ((o[column.key] = true), o),
            {},
          ),
        ).includes(c.key),
    )
  )
    throw new Error("Unexpected MVP 5 column");
}
export function verifyMvp5Bucket(bucket: BucketMetadata) {
  if (
    bucket.$id !== mediaBucket ||
    !bucket.enabled ||
    !bucket.fileSecurity ||
    bucket.$permissions.length ||
    bucket.maximumFileSize !== maxImageBytes ||
    !bucket.antivirus ||
    !bucket.stripMetadata ||
    bucket.allowedFileExtensions.slice().sort().join(",") !==
      ["jpg", "png", "webp"].sort().join(",")
  )
    throw new Error("Unsafe MVP 5 bucket configuration");
}
export function planMvp5(tables: TableMetadata[], bucket?: BucketMetadata) {
  const operations: string[] = [];
  for (const table of mvp5Tables) {
    const existing = tables.find((t) => t.$id === table);
    if (existing) verifyMvp5Table(table, existing);
    else operations.push("create-table:" + table);
  }
  if (bucket) verifyMvp5Bucket(bucket);
  else operations.push("create-bucket:" + mediaBucket);
  return operations;
}
