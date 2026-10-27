import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: [
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
  reporter: "list",
  workers: 1,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: process.env.RGO_STORYBOOK_URL ?? "http://127.0.0.1:6006",
    channel: "chrome",
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    viewport: { width: 1600, height: 1100 },
  },
});
