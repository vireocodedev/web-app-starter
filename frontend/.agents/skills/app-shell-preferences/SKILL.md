---
name: app-shell-preferences
description: Change RGO generated-app shell appearance or interface preferences, including defaults, persistence, fixed overrides, Settings controls, reset, and localization. Use for drawer, header, density, shape, color-mode, or locale preference work; use app-shell-navigation for navigation placement.
---

# App shell appearance and preferences

## Start

When invoked only as `$app-shell-preferences`, or named without a concrete task, ask one question: “What would you like to do with shell preferences: (1) explain current settings and precedence, (2) change a default or control, (3) add or retire a preference, or (4) describe another task?” Wait for the answer before inspecting or changing the app. When a concrete task is supplied, proceed directly. Treat explanation-only requests as read-only.

Accept a plain-language goal and identify the owning domain before editing. This skill assumes the current generated-app shell; if an expected provider or Settings seam is missing, explain the mismatch and propose an upgrade or separate migration. Broad theme-system redesign needs its own design and the repository's theme guidance.

## Workflow

Read [localization, theme, and preferences](../../../docs/architecture/en/localization-theme-and-preferences.md) and the [testing guide](../../../docs/architecture/en/tests-mocks-stories-and-architecture-checks.md). Shell drawer mode, permanent-drawer state, and header stickiness belong to [`src/app/shell`](../../../src/app/shell); font size, table density, editor presentation, corner roundness, and color mode belong to [`src/app/theme`](../../../src/app/theme); locale belongs to [`src/app/localization`](../../../src/app/localization). [`SettingsPage.tsx`](../../../src/pages/settings/SettingsPage.tsx) and [`src/features/settings`](../../../src/features/settings) present owner values and controls.

### Preference lifecycle

1. Find the owner’s default (`appShellConfig`, `themeSetup`, or locale config), provider/context/hook, storage key and validation, and reset hook. Trace the effective value through optional app-fixed policy in [`fixedSettings.ts`](../../../src/app/bootstrap/config/fixedSettings.ts), its environment contract, and the Settings row. Keep the value and setter in its owner rather than Settings.
2. For an added or changed preference, make initial resolution, live setter, persistence, fixed override if the app needs it, reset, and Settings visibility agree. Preserve the owner’s existing cross-tab or storage-event behavior where it is supported. Update the typed environment contract when fixed configuration is supported. When removing a setting, remove obsolete controls/contracts and handle legacy stored keys deliberately without disturbing unrelated preferences.
3. Update labels/help text in both [`translation.en.ts`](../../../src/app/localization/translations/translation.en.ts) and [`translation.hr.ts`](../../../src/app/localization/translations/translation.hr.ts). If a header quick action exposes the preference, make it use the same owner hook and fixed-setting policy. Check both light and dark surfaces and mobile Settings spacing when presentation changes.
4. Load [app-shell-navigation](../app-shell-navigation/SKILL.md) when the change affects navigation placement or header composition, and [app-route-pages](../app-route-pages/SKILL.md) if it adds or moves a Settings route. Complete the combined request as one task.

### Worked preference recipe

For “change the fresh-app drawer default,” edit [`appShellConfig.ts`](../../../src/app/shell/appShellConfig.ts), then inspect [`AppShellPreferencesProvider.tsx`](../../../src/app/shell/preferences/AppShellPreferencesProvider.tsx) and [`useResetAppShellPreferences.ts`](../../../src/app/shell/preferences/useResetAppShellPreferences.ts) to confirm precedence and reset behavior. A saved user choice or fixed app setting should still take precedence. For a new option, also wire a control through [`useInterfaceSettingsSection.tsx`](../../../src/features/settings/sections/interface/hooks/useInterfaceSettingsSection.tsx) and its owner reset hook.

Run focused owner/provider and Settings tests in [`tests/app`](../../../tests/app) and [`tests/features/settings`](../../../tests/features/settings); use visual/browser checks when a shell surface changes.

## Finish

Report effective defaults and override precedence, changed files, check results, and any app configuration the author must set.
