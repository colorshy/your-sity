/** Read-verify existing Preview before any credentials or mutations reach the app. */
import { spawnSync } from "node:child_process";
import { Vercel } from "@vercel/sdk";
import { configureTransport } from "../src/lib/appwrite/transport";
import { verifyBetaPreview } from "../src/lib/operations/beta-preview";
const required = [
  "BETA_BASE_URL",
  "BETA_COMMIT",
  "VERCEL_TOKEN",
  "BETA_EMAIL_A",
  "BETA_EMAIL_B",
  "BETA_PASSWORD_A",
  "BETA_PASSWORD_B",
  "BETA_EMAIL_MODERATOR",
  "BETA_PASSWORD_MODERATOR",
];
async function main() {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length || process.env.BETA_ALLOW_WRITES !== "1") {
    console.log(
      JSON.stringify({
        status: "blocked",
        missing,
        optIn: process.env.BETA_ALLOW_WRITES === "1",
        networkRequests: 0,
        liveIntegration: "not-tested",
      }),
    );
    process.exitCode = 2;
    return;
  }
  try {
    const origin = process.env.BETA_BASE_URL!,
      url = new URL(origin);
    if (
      url.protocol !== "https:" ||
      !/^[a-z0-9-]+\.vercel\.app$/i.test(url.hostname) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/" ||
      new Set([
        process.env.BETA_EMAIL_A,
        process.env.BETA_EMAIL_B,
        process.env.BETA_EMAIL_MODERATOR,
      ]).size !== 3
    )
      throw new Error();
    configureTransport();
    const api = new Vercel({
      bearerToken: process.env.VERCEL_TOKEN!,
      timeoutMs: 15000,
      retryConfig: { strategy: "none" },
    });
    const metadata = await api.deployments.getDeployment({
      idOrUrl: url.hostname,
      teamId: process.env.VERCEL_TEAM_ID || process.env.VERCEL_ORG_ID,
    });
    const verified = verifyBetaPreview(
      metadata,
      origin,
      process.env.BETA_COMMIT!,
    );
    console.log(
      JSON.stringify({
        status: "preview-verified",
        ...verified,
        productionReleased: false,
        liveIntegration: "not-tested",
      }),
    );
    const readiness = await fetch(new URL("/api/ready", origin), {
      redirect: "error",
      headers: process.env.BETA_PREVIEW_BYPASS
        ? { "x-vercel-protection-bypass": process.env.BETA_PREVIEW_BYPASS }
        : {},
      signal: AbortSignal.timeout(15000),
    });
    if (readiness.status !== 200 || (await readiness.json()).status !== "ready")
      throw new Error();
    // Secrets remain inherited environment variables, never command-line arguments.
    const result = spawnSync(
      "npx",
      ["playwright", "test", "--config=playwright.live.config.ts"],
      {
        encoding: "utf8",
        maxBuffer: 8 * 1024 * 1024,
        timeout: 600000,
        env: {
          ...process.env,
          YOUR_CITY_LIVE_BETA: "1",
          YOUR_CITY_VERIFIED_PREVIEW: verified.deploymentId,
        },
      },
    );
    let output = (result.stdout ?? "") + (result.stderr ?? "");
    for (const key of [...required, "BETA_PREVIEW_BYPASS"].filter(
      (key) =>
        key.includes("PASSWORD") ||
        key.includes("EMAIL") ||
        key === "VERCEL_TOKEN" ||
        key === "BETA_PREVIEW_BYPASS",
    )) {
      const secret = process.env[key];
      if (secret) output = output.split(secret).join("[redacted]");
    }
    process.stdout.write(output);
    process.exitCode = result.status ?? 1;
  } catch {
    console.error(
      JSON.stringify({
        status: "blocked",
        reason: "preview-identity-or-authorization",
        liveIntegration: "not-tested",
        productionReleased: false,
      }),
    );
    process.exitCode = 2;
  }
}
void main();
