import { NextResponse } from "next/server";
import { applicationOrigin } from "@/lib/operations/config";
export function GET() {
  try {
    return NextResponse.redirect(
      new URL("/sign-in?error=verification", applicationOrigin(process.env)),
    );
  } catch {
    return Response.json({ status: "unavailable" }, { status: 503 });
  }
}
