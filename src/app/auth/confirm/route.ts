import { NextResponse, type NextRequest } from "next/server";
import { anonymousAccount } from "@/lib/appwrite/server";
export async function GET(request: NextRequest) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
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
