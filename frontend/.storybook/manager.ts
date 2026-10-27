import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import { createElement } from "react";
import { addons, types } from "storybook/manager-api";

import { resolveStorybookColorScheme, storybookThemes } from "./theme.js";
import { getStorybookThemeMode, subscribeStorybookTheme } from "./themeSync.js";
import { ThemeSwitcher } from "./ThemeSwitcher.js";

const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
function applyManagerTheme() {
  const scheme = resolveStorybookColorScheme(getStorybookThemeMode(), systemTheme.matches);
  addons.setConfig({ theme: storybookThemes[scheme] });
}

applyManagerTheme();

addons.register("rgo/storybook-theme", () => {
  addons.add("rgo/storybook-theme/tool", {
    title: "Theme",
    type: types.TOOL,
    match: ({ viewMode }) => viewMode === "story" || viewMode === "docs",
    render: () => createElement(ThemeSwitcher),
  });
  let stop: (() => void) | undefined;
  function attach() {
    if (stop) return;
    stop = subscribeStorybookTheme(applyManagerTheme);
    systemTheme.addEventListener("change", applyManagerTheme);
    applyManagerTheme();
  }
  function detach() {
    stop?.();
    stop = undefined;
    systemTheme.removeEventListener("change", applyManagerTheme);
  }
  // The manager is rebuilt as a page, not a Vite HMR module. Restore listeners
  // when the browser restores a cached page as well as on its first visit.
  attach();
  window.addEventListener("pagehide", detach);
  window.addEventListener("pageshow", attach);
});
