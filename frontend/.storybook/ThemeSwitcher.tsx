/** @jsxRuntime classic */
import React from "react";

import { englishTranslations } from "../src/app/localization/translations/translation.en.js";
import { getApplicationPalette } from "../src/app/theme/themeSetup.js";
import { isStorybookThemeMode } from "./theme.js";
import { setStorybookThemeMode } from "./themeSync.js";
import { useStorybookTheme } from "./useStorybookTheme.js";

const options = [
  ["system", englishTranslations.settings.themeSystem],
  ["light", englishTranslations.settings.themeLight],
  ["dark", englishTranslations.settings.themeDark],
  ["soft-dark", englishTranslations.settings.themeSoftDark],
] as const;

export function ThemeSwitcher() {
  const { mode, scheme } = useStorybookTheme();
  const { rgo } = getApplicationPalette(scheme);
  return (
    <label
      style={{
        alignItems: "center",
        color: rgo.textSecondary,
        display: "flex",
        fontSize: 12,
        gap: 6,
        padding: "0 8px",
      }}
    >
      Theme
      <select
        aria-label="Theme"
        onChange={event => {
          if (isStorybookThemeMode(event.target.value)) setStorybookThemeMode(event.target.value, true);
        }}
        style={{
          background: rgo.shellSurface,
          border: `1px solid ${rgo.borderControl}`,
          borderRadius: 4,
          color: rgo.text,
          colorScheme: scheme === "light" ? "light" : "dark",
          font: "inherit",
          minHeight: 28,
          padding: "2px 6px",
        }}
        value={mode}
      >
        {options.map(([value, title]) => (
          <option key={value} value={value}>
            {title}
          </option>
        ))}
      </select>
    </label>
  );
}
