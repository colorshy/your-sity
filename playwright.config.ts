import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3100",
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
  },
  projects: [
    {
      name: "tablet",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 768, height: 1024 },
      },
    },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: "npx tsx scripts/appwrite-fixture.ts",
      url: "http://127.0.0.1:54321/health",
      reuseExistingServer: false,
    },
    {
      command: "npm run dev -- --port 3100",
      env: {
        APPWRITE_ENDPOINT: "http://127.0.0.1:54321/v1",
        APPWRITE_PROJECT_ID: "your-city",
        APPWRITE_DATABASE_ID: "your_city_db",
        APPWRITE_API_KEY: "test-server-key",
        APPWRITE_MODERATOR_IDS: "",
        NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3100",
      },
      url: "http://127.0.0.1:3100",
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});
