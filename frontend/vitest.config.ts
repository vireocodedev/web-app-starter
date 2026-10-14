import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

import { rgoFrontendPeerDependencies } from "./config/rgo-frontend-peer-dependencies.js";
import { signalsReactTransform } from "./config/signals-react-transform.js";

export default defineConfig({
  plugins: [react(), signalsReactTransform()],
  resolve: {
    dedupe: [...rgoFrontendPeerDependencies],
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@mocks": fileURLToPath(new URL("./mocks", import.meta.url)),
      "@test": fileURLToPath(new URL("./tests", import.meta.url)),
    },
  },
  test: {
    clearMocks: true,
    environment: "jsdom",
    exclude: [...configDefaults.exclude, "tests/browser/**"],
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    fileParallelism: true,
    maxWorkers: 2,
    mockReset: true,
    pool: "threads",
    restoreMocks: true,
    setupFiles: ["./tests/setup.ts"],
  },
});
