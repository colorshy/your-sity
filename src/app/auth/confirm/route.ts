import { NextResponse, type NextRequest } from "next/server";
import { checkAbuse } from "@/lib/operations/abuse";
import { applicationOrigin } from "@/lib/operations/config";
import { anonymousAccount } from "@/lib/appwrite/server";
export async function GET(request: NextRequest) {
  const abuse = await checkAbuse("auth");
  if (abuse === "limited" || abuse === "unavailable")
    return Response.json(
      { status: "unavailable" },
      {
        status: abuse === "limited" ? 429 : 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  let base: string;
  try {
    base = applicationOrigin(process.env);
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
  const userId = request.nextUrl.searchParams.get("userId"),
    secret = request.nextUrl.searchParams.get("secret");
  if (userId && secret) {
    try {
      await anonymousAccount().updateVerification({ userId, secret });
      return NextResponse.redirect(new URL("/profile?message=verified", base));
    } catch {}
  }
  return NextResponse.redirect(new URL("/sign-in?error=verification", base));
}
