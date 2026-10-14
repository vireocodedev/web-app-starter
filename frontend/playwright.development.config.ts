import { defineConfig, devices } from "@playwright/test";

const browserPort = Number(process.env.RGO_BROWSER_DEV_PORT ?? 4174);
if (!Number.isInteger(browserPort) || browserPort < 1 || browserPort > 65535) {
  throw new Error("RGO_BROWSER_DEV_PORT must be a valid TCP port.");
}

export default defineConfig({
  testDir: "./tests/browser",
  forbidOnly: Boolean(process.env.CI),
  projects: [
    {
      name: "documentation",
      testMatch: "documentation.development.spec.ts",
    },
    {
      grep: /Contacts|creates the first contact/,
      name: "contacts",
      testMatch: "application.spec.ts",
    },
  ],
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "list" : "html",
  timeout: 60_000,
  workers: 1,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: `http://127.0.0.1:${browserPort}`,
    channel: "chrome",
    trace: "on-first-retry",
  },
  webServer: {
    command: `VITE_API_BASE_URL=https://api.example.invalid VITE_API_MODE=mock VITE_APP_ENV=development VITE_API_WITH_CREDENTIALS=false npm run dev -- --force --host 127.0.0.1 --port ${browserPort} --strictPort`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: `http://127.0.0.1:${browserPort}`,
  },
});
