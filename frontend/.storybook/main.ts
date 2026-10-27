import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";

import { patternExampleSource } from "../config/pattern-example-source.js";
import { signalsReactTransform } from "../config/signals-react-transform.js";
import { rgoFrontendPeerDependencies } from "../config/rgo-frontend-peer-dependencies.js";

const config = {
  stories: ["../docs/storybook/**/*.mdx", "../docs/storybook/**/*.stories.@(ts|tsx)"],
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
      plugins: [
        // Storybook's preview loader needs MSW even in a static build. Only the
        // production application removes the worker copied from public/.
        ...(existing.plugins ?? []).filter(
          plugin =>
            !plugin || !("name" in plugin) || plugin.name !== "exclude-mock-service-worker-from-production-build",
        ),
        signalsReactTransform(),
        patternExampleSource(),
      ],
    };
  },
} satisfies StorybookConfig;

export default config;
