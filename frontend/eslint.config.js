import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import storybook from "eslint-plugin-storybook";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist", "storybook-static", "playwright-report", "test-results", "public/mockServiceWorker.js"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["docs/storybook/**/*Example.tsx"],
    rules: {
      "react-refresh/only-export-components": ["error", { allowExportNames: ["handlers", "resetProjectsMock"] }],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/features/*/hooks/use*Feature.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              importNames: ["useAppFeature"],
              message: "Access runtime features through the owning use<Feature>Feature wrapper.",
              name: "@/app/bootstrap/runtime/useAppFeature",
            },
          ],
        },
      ],
    },
  },
  ...storybook.configs["flat/recommended"],
]);
