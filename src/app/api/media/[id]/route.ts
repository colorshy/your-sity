import { Storage } from "node-appwrite";
import { requireResident } from "@/lib/auth";
import { apiClient } from "@/lib/appwrite/server";
import { mediaBucket } from "@/lib/appwrite/media";
import { AccessError } from "@/lib/appwrite/policy";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { service } = await requireResident();
  let media;
  try {
    media = await service.mediaForFile((await params).id);
  } catch (error) {
    if (error instanceof AccessError)
      return new Response(null, { status: 404 });
    throw error;
  }
  const bytes = await new Storage(apiClient()).getFileView({
    bucketId: mediaBucket,
    fileId: media.file_id,
  });
  return new Response(bytes, {
    headers: {
      "Content-Type": media.mime,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
