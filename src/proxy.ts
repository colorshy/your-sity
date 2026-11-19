import { NextResponse, type NextRequest } from "next/server";
export function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: [
    "/",
    "/discover",
    "/feed/:path*",
    "/saved",
    "/notifications",
    "/people/:path*",
    "/moderation/:path*",
    "/communities/:path*",
    "/profile/:path*",
    "/onboarding",
    "/create",
    "/posts/:path*",
    "/sign-in",
    "/sign-up",
    "/auth/:path*",
  ],
};
