import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";

import { signalsReactTransform } from "../config/signals-react-transform.js";
import { rgoFrontendPeerDependencies } from "../config/rgo-frontend-peer-dependencies.js";

const config = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(ts|tsx)"],
  staticDirs: ["../public"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "msw-storybook-addon"],
  framework: { name: "@storybook/react-vite", options: {} },
  async viteFinal(existing) {
    return {
      ...existing,
      resolve: {
        ...existing.resolve,
        dedupe: [...new Set([...(existing.resolve?.dedupe ?? []), ...rgoFrontendPeerDependencies])],
        alias: {
          "@": fileURLToPath(new URL("../src", import.meta.url)),
        },
      },
      plugins: [...(existing.plugins ?? []), signalsReactTransform()],
    };
  },
} satisfies StorybookConfig;

export default config;
