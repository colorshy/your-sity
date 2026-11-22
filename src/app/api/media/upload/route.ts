import { Storage } from "node-appwrite";
import { requireResident } from "@/lib/auth";
import { appwriteConfig } from "@/lib/appwrite/config";
import { apiClient } from "@/lib/appwrite/server";
import {
  mediaBucket,
  uploadChunkBytes,
  validUploadPart,
  validateImage,
} from "@/lib/appwrite/media";
import { validId } from "@/lib/appwrite/policy";
import { checkAbuse } from "@/lib/operations/abuse";
import { applicationOrigin } from "@/lib/operations/config";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  if (request.headers.get("origin") !== applicationOrigin(process.env))
    return new Response(null, { status: 403 });
  const abuse = await checkAbuse("write");
  if (abuse !== "allowed" && abuse !== "development")
    return new Response(null, { status: abuse === "limited" ? 429 : 503 });
  const { service, user } = await requireResident();
  const draft = request.headers.get("x-city-draft") ?? "";
  const fileId = request.headers.get("x-city-file") ?? "";
  const mime = request.headers.get("x-city-mime") ?? "";
  const total = Number(request.headers.get("x-city-total"));
  const start = Number(request.headers.get("x-city-start"));
  const position = Number(request.headers.get("x-city-position"));
  const data = new Uint8Array(await request.arrayBuffer());
  if (
    !validId(draft) ||
    !validId(fileId) ||
    !["image/jpeg", "image/png", "image/webp"].includes(mime) ||
    !Number.isInteger(position) ||
    position < 0 ||
    position > 3 ||
    !validUploadPart(start, data.length, total) ||
    (start !== 0 && start + data.length !== total) ||
    (start === 0 && data.length !== Math.min(uploadChunkBytes, total))
  )
    return new Response(null, { status: 400 });
  const repo = service.repo;
  const existing = await repo.get("post_media", fileId);
  if (start === 0) {
    if (existing || (await repo.get("posts", draft)))
      return new Response(null, { status: 409 });
    const pending = await repo.list(
      "post_media",
      [{ field: "post_id", value: draft }],
      { limit: 5 },
    );
    if (
      pending.length >= 4 ||
      pending.some((m) => m.owner_id !== user.id || m.position === position)
    )
      return new Response(null, { status: 409 });
    await repo.create("post_media", fileId, {
      post_id: draft,
      file_id: fileId,
      owner_id: user.id,
      position,
      mime,
      bytes: total,
      ready: false,
    });
  } else if (
    !existing ||
    existing.owner_id !== user.id ||
    existing.post_id !== draft ||
    existing.position !== position ||
    existing.bytes !== total ||
    existing.mime !== mime ||
    existing.ready
  ) {
    return new Response(null, { status: 403 });
  }
  const cfg = appwriteConfig();
  if (!cfg) return new Response(null, { status: 503 });
  const storage = new Storage(apiClient());
  let stage = "storage-request";
  try {
    const body = new FormData();
    body.set("fileId", fileId);
    body.set(
      "file",
      new File(
        [data],
        fileId +
          (
            {
              "image/jpeg": ".jpg",
              "image/png": ".png",
              "image/webp": ".webp",
            } as Record<string, string>
          )[mime],
        { type: mime },
      ),
    );
    const response = await fetch(
      `${cfg.endpoint}/storage/buckets/${mediaBucket}/files`,
      {
        method: "POST",
        headers: {
          "X-Appwrite-Project": cfg.project,
          "X-Appwrite-Key": cfg.key,
          "Content-Range": `bytes ${start}-${start + data.length - 1}/${total}`,
          ...(start ? { "X-Appwrite-ID": fileId } : {}),
        },
        body,
        cache: "no-store",
      },
    );
    if (!response.ok) throw new Error("Storage upload failed");
    if (start + data.length === total) {
      stage = "storage-readback";
      const full = new Uint8Array(
        await storage.getFileView({ bucketId: mediaBucket, fileId }),
      );
      try {
        stage = "image-validation";
        await validateImage(full, mime);
      } catch {
        await storage.deleteFile({ bucketId: mediaBucket, fileId });
        await repo.delete("post_media", fileId);
        return new Response(null, { status: 415 });
      }
      await repo.update("post_media", fileId, { ready: true });
    }
    return Response.json(
      { complete: start + data.length === total },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    if (process.env.NODE_ENV !== "production")
      console.error("Media upload failed at", stage);
    if (start === 0) {
      try {
        await repo.delete("post_media", fileId);
      } catch {}
    }
    return new Response(null, { status: 503 });
  }
}
