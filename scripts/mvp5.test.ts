import { test } from "node:test";
import assert from "node:assert/strict";
import {
  planMvp5,
  verifyMvp5Bucket,
  mvp5Columns,
  mvp5Indexes,
} from "../src/lib/migrations/mvp5";
import {
  validateImage,
  validUploadPart,
  maxImageBytes,
} from "../src/lib/appwrite/media";
import type { TableMetadata } from "../src/lib/appwrite/schema";
const table = (id: "post_reposts" | "post_media"): TableMetadata => ({
  $id: id,
  enabled: true,
  rowSecurity: false,
  $permissions: [],
  columns: mvp5Columns[id].map((c) => ({ ...c, status: "available" })),
  indexes: mvp5Indexes[id].map((i) => ({
    key: i.key,
    type: i.type,
    columns: i.attributes,
    status: "available",
  })),
});
const bucket = {
  $id: "your-city-post-media",
  enabled: true,
  fileSecurity: true,
  $permissions: [],
  maximumFileSize: maxImageBytes,
  allowedFileExtensions: ["jpg", "png", "webp"],
  antivirus: true,
  stripMetadata: true,
};
test("MVP 5 dry-run is additive and rejects unsafe drift", () => {
  assert.deepEqual(planMvp5([], undefined), [
    "create-table:post_reposts",
    "create-table:post_media",
    "create-bucket:your-city-post-media",
  ]);
  assert.deepEqual(
    planMvp5([table("post_reposts"), table("post_media")], bucket),
    [],
  );
  assert.throws(() =>
    planMvp5(
      [
        { ...table("post_reposts"), $permissions: ['read("any")'] },
        table("post_media"),
      ],
      bucket,
    ),
  );
  assert.throws(() =>
    planMvp5(
      [{ ...table("post_reposts"), indexes: [] }, table("post_media")],
      bucket,
    ),
  );
  assert.throws(() =>
    verifyMvp5Bucket({ ...bucket, $permissions: ['read("any")'] }),
  );
});
test("upload limits and actual decoding reject oversized or mislabeled content", async () => {
  assert.equal(validUploadPart(0, 4 * 1024 * 1024, maxImageBytes), true);
  assert.equal(
    validUploadPart(4 * 1024 * 1024, 1024 * 1024, maxImageBytes),
    true,
  );
  assert.equal(validUploadPart(0, maxImageBytes, maxImageBytes), false);
  assert.equal(validUploadPart(0, 1, maxImageBytes + 1), false);
  await assert.rejects(
    validateImage(
      new Uint8Array([0xff, 0xd8, 0xff, ...new Array(20).fill(0)]),
      "image/jpeg",
    ),
  );
  await assert.rejects(validateImage(new Uint8Array(20), "image/png"));
});
