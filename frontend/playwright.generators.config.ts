import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.RGO_BROWSER_DEV_PORT ?? 4181);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid generator rehearsal browser port.");

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "generators.development.spec.ts",
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 60_000,
  use: { ...devices["Desktop Chrome"], channel: "chrome", baseURL: `http://127.0.0.1:${port}` },
  webServer: {
    command: `VITE_API_BASE_URL=https://api.example.invalid VITE_API_MODE=mock VITE_APP_ENV=development VITE_API_WITH_CREDENTIALS=false npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
