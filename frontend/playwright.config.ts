import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  testIgnore: ["documentation.development.spec.ts"],
  grepInvert: /Contacts|creates the first contact/,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "list" : "html",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:4173",
    channel: "chrome",
    trace: "on-first-retry",
  },
  webServer: {
    command:
      "VITE_API_BASE_URL=https://api.example.invalid VITE_API_MODE=http VITE_APP_ENV=test VITE_API_WITH_CREDENTIALS=false npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: "http://127.0.0.1:4173",
  },
});
