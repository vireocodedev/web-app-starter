import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

import { signalsReactTransform } from "./config/signals-react-transform.js";
import { rgoFrontendPeerDependencies } from "./config/rgo-frontend-peer-dependencies.js";
import { patternExampleSource } from "./config/pattern-example-source.js";

/** Retains normal public assets while removing the development-only MSW worker. */
function excludeMockServiceWorkerFromProductionBuild(): Plugin {
  let outputDirectory = "";

  return {
    apply: "build",
    configResolved(config) {
      outputDirectory = config.build.outDir;
    },
    name: "exclude-mock-service-worker-from-production-build",
    async closeBundle() {
      await rm(resolve(outputDirectory, "mockServiceWorker.js"), {
        force: true,
      });
    },
  };
}

export default defineConfig(({ command }) => ({
  // Normal public assets belong in the production build. The development-only
  // MSW worker is removed after Vite copies public files to the output.
  publicDir: "public",
  plugins: [
    react(),
    signalsReactTransform(),
    patternExampleSource(),
    ...(command === "build" ? [excludeMockServiceWorkerFromProductionBuild()] : []),
  ],
  resolve: {
    dedupe: [...rgoFrontendPeerDependencies],
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@mocks": fileURLToPath(new URL("./mocks", import.meta.url)),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: true,
      },
    },
  },
}));
