import sharp from "sharp";
import { AccessError } from "./policy";
import { maxImageBytes, uploadChunkBytes } from "./media-limits";
export { maxImageBytes, uploadChunkBytes, mediaBucket } from "./media-limits";
export type ImageMime = "image/jpeg" | "image/png" | "image/webp";
export function imageMime(bytes: Uint8Array): ImageMime | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  )
    return "image/jpeg";
  if (
    bytes.length >= 8 &&
    Buffer.from(bytes.subarray(0, 8)).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    )
  )
    return "image/png";
  if (
    bytes.length >= 12 &&
    Buffer.from(bytes.subarray(0, 4)).toString() === "RIFF" &&
    Buffer.from(bytes.subarray(8, 12)).toString() === "WEBP"
  )
    return "image/webp";
  return null;
}
export async function validateImage(bytes: Uint8Array, declared: string) {
  if (bytes.length < 16 || bytes.length > maxImageBytes)
    throw new AccessError("Invalid image size");
  const actual = imageMime(bytes);
  if (!actual || actual !== declared)
    throw new AccessError("Invalid image format");
  try {
    const meta = await sharp(bytes, {
      limitInputPixels: 40_000_000,
      failOn: "error",
    }).metadata();
    if (
      !meta.width ||
      !meta.height ||
      !["jpeg", "png", "webp"].includes(meta.format)
    )
      throw new Error();
  } catch {
    throw new AccessError("Invalid image content");
  }
  return actual;
}
export function validUploadPart(start: number, length: number, total: number) {
  return (
    Number.isSafeInteger(start) &&
    Number.isSafeInteger(length) &&
    Number.isSafeInteger(total) &&
    start >= 0 &&
    length > 0 &&
    length <= uploadChunkBytes &&
    total <= maxImageBytes &&
    total >= 16 &&
    start < total &&
    start + length <= total &&
    (start === 0 || start === uploadChunkBytes)
  );
}
