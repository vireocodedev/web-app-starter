import type { Preview } from "@storybook/react-vite";
import { setupWorker } from "msw/browser";
import { mswLoader } from "msw-storybook-addon/csf3";

import { parseAppConfig } from "../src/app/bootstrap/config/appConfig.js";

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
