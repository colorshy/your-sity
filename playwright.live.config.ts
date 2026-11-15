import { defineConfig, devices } from "@playwright/test";
if (
  process.env.YOUR_CITY_LIVE_BETA !== "1" ||
  !process.env.YOUR_CITY_VERIFIED_PREVIEW
)
  throw new Error("Use npm run test:live with authorized beta configuration");
export default defineConfig({
  testDir: ".",
  testMatch: [
    "**/tests/multiuser.spec.ts",
    "**/live-tests/permissions.spec.ts",
  ],
  projects: [
    { name: "accounts", testMatch: "**/tests/multiuser.spec.ts" },
    {
      name: "permissions",
      testMatch: "**/live-tests/permissions.spec.ts",
      dependencies: ["accounts"],
    },
  ],
  workers: 1,
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: process.env.BETA_BASE_URL,
    trace: "off",
    screenshot: "off",
    video: "off",
    ...devices["Desktop Chrome"],
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
  },
});
