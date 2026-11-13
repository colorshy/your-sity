import "server-only";
import { checkRateLimit } from "@vercel/firewall";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { enforceLimit, type AbuseKind } from "./abuse-policy";
import { trustedDeploymentHost } from "./config";
import { operationLog } from "./log";
export async function checkAbuse(kind: AbuseKind) {
  const production = process.env.NODE_ENV === "production";
  const rule =
    kind === "auth"
      ? process.env.VERCEL_AUTH_RATE_LIMIT_ID
      : process.env.VERCEL_WRITE_RATE_LIMIT_ID;
  const result = await enforceLimit(
    { production, vercel: process.env.VERCEL === "1", rule },
    async (id) => {
      const requestHeaders = new Headers(await headers());
      // The SDK forwards request headers. Never derive the destination host from an incoming Host header.
      const host = trustedDeploymentHost(process.env);
      requestHeaders.set("host", host);
      return checkRateLimit(id, { headers: requestHeaders, timeout: 2000 });
    },
  );
  operationLog("abuse_check", result, kind);
  return result;
}
export async function guardAction(kind: AbuseKind) {
  const result = await checkAbuse(kind);
  if (result === "limited") redirect("/sign-in?error=rate");
  if (result === "unavailable") redirect("/sign-in?error=unavailable");
}
