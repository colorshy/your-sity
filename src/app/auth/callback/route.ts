import { NextResponse, type NextRequest } from "next/server";
import { serverClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/validation";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    try {
      const { error } = await (
        await serverClient()
      ).auth.exchangeCodeForSession(code);
      if (!error)
        return NextResponse.redirect(
          new URL(
            safeNext(request.nextUrl.searchParams.get("next")),
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
