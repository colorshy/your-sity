import { NextResponse, type NextRequest } from "next/server";
import { serverClient } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const token_hash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  if (token_hash && type === "email") {
    try {
      const { error } = await (
        await serverClient()
      ).auth.verifyOtp({ token_hash, type: "email" });
      if (!error)
        return NextResponse.redirect(
          new URL(
            "/onboarding",
            process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
          ),
        );
    } catch {}
  }
  return NextResponse.redirect(
    new URL(
      "/sign-in?error=verification",
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    ),
  );
}
