import type { Preview } from "@storybook/react-vite";
import { createElement } from "react";
import { setupWorker } from "msw/browser";
import { mswLoader } from "msw-storybook-addon/csf3";

import { parseAppConfig } from "../src/app/bootstrap/config/appConfig.js";
import { StorybookProviders } from "./StorybookProviders.js";
import { StorybookDocsContainer } from "./StorybookDocsContainer.js";
import { StorybookSource } from "./StorybookSource.js";

const fixtureApiBaseUrl = "https://api.example.invalid";
const storybookConfig = parseAppConfig({
  VITE_API_BASE_URL: fixtureApiBaseUrl,
});
const applicationApiBaseUrl = new URL(storybookConfig.VITE_API_BASE_URL, window.location.origin);
const serviceWorkerUrl = new URL("mockServiceWorker.js", window.location.href).pathname;

function isProtectedApiRequest(requestUrl: string) {
  const url = new URL(requestUrl);
  const normalizedBasePath = applicationApiBaseUrl.pathname.replace(/\/$/, "");

  return (
    url.origin === new URL(fixtureApiBaseUrl).origin ||
    (url.origin === applicationApiBaseUrl.origin &&
      (normalizedBasePath === "" ||
        url.pathname === normalizedBasePath ||
        url.pathname.startsWith(`${normalizedBasePath}/`)))
  );
}

const preview = {
  decorators: [(Story, context) => createElement(StorybookProviders, { storyId: context.id }, createElement(Story))],
  loaders: [
    mswLoader(async () => {
      const worker = setupWorker();
      await worker.start({
        onUnhandledRequest(request, print) {
          if (isProtectedApiRequest(request.url)) {
            print.error();
          }
        },
        serviceWorker: { url: serviceWorkerUrl },
      });
      return worker;
    }),
  ],
  parameters: {
    docs: { container: StorybookDocsContainer, components: { Source: StorybookSource } },
    backgrounds: { disable: true },
    a11y: { test: "error" },
    controls: { disable: true },
    options: {
      storySort: {
        method: "alphabetical",
        order: ["Features", ["Projects", ["Query and form mutation"]]],
      },
    },
  },
} satisfies Preview;

export default preview;
