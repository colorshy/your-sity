/** Read-only checks on an actual supplied HTTPS deployment. No fixture/server is started. */
import { canonicalOrigin } from "../src/lib/operations/config";
async function main() {
  let base: string;
  try {
    base = canonicalOrigin(process.env.LIVE_BASE_URL, true);
  } catch {
    console.error(
      JSON.stringify({
        status: "blocked",
        missing: "LIVE_BASE_URL (verified HTTPS deployment origin)",
      }),
    );
    process.exitCode = 2;
    return;
  }
  const checks: Record<string, boolean> = {};
  try {
    const health = await fetch(base + "/api/health", {
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
    });
    checks.health =
      health.status === 200 && (await health.json()).status === "ok";
    checks.headers =
      health.headers.get("x-content-type-options") === "nosniff" &&
      health.headers.get("x-frame-options") === "DENY";
    const ready = await fetch(base + "/api/ready", {
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
    });
    checks.backendReadiness =
      ready.status === 200 && (await ready.json()).status === "ready";
    const guard = await fetch(base + "/profile", {
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
    });
    const location = guard.headers.get("location");
    checks.anonymousGuard =
      [303, 307, 308].includes(guard.status) &&
      !!location &&
      new URL(location, base).origin === base &&
      new URL(location, base).pathname === "/sign-in";
    console.log(
      JSON.stringify({
        status: Object.values(checks).every(Boolean)
          ? "read-only-smoke-passed"
          : "failed",
        checks,
        authenticatedAcceptance: "not-tested",
      }),
    );
    if (!Object.values(checks).every(Boolean)) process.exitCode = 1;
  } catch {
    console.error(
      JSON.stringify({
        status: "network-or-deployment-check-failed",
        checks,
        authenticatedAcceptance: "not-tested",
      }),
    );
    process.exitCode = 1;
  }
}
void main();
