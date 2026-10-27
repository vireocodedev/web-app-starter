import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  testIgnore: [
    "documentation.development.spec.ts",
    "storybook-preview.spec.ts",
    "storybook-forms.spec.ts",
    "storybook-feedback.spec.ts",
    "storybook-architecture.spec.ts",
    "storybook-data-collections-localization.spec.ts",
    "storybook-platform-testing.spec.ts",
    "storybook-workflow-recipes.spec.ts",
    "storybook-migrated-guide.spec.ts",
  ],
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
