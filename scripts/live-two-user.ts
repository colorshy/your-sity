/** Explicit opt-in writes to an authorized beta target; never creates/deploys infrastructure. */
import { spawnSync } from "node:child_process";
const required = [
  "BETA_BASE_URL",
  "BETA_EMAIL_A",
  "BETA_EMAIL_B",
  "BETA_PASSWORD_A",
  "BETA_PASSWORD_B",
];
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
} else {
  const url = new URL(process.env.BETA_BASE_URL!);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    process.env.BETA_EMAIL_A === process.env.BETA_EMAIL_B
  )
    throw new Error("Invalid authorized beta target or account pair");
  const result = spawnSync(
    "npx",
    ["playwright", "test", "--config=playwright.live.config.ts"],
    { stdio: "inherit", env: { ...process.env, YOUR_CITY_LIVE_BETA: "1" } },
  );
  process.exitCode = result.status ?? 1;
}
