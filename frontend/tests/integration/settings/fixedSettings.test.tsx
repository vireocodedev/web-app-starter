import { render, renderHook, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PropsWithChildren } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it } from "vitest";

import { AppFixedSettingsProvider } from "@/app/bootstrap/config/AppFixedSettingsProvider";
import { noFixedAppSettings, type AppFixedSettings } from "@/app/bootstrap/config/fixedSettings";
import { appLocalStorage, appLocalStorageKeys } from "@/app/data/storage/appLocalStorage";
import { AppLocalizationProvider } from "@/app/localization/components/AppLocalizationProvider";
import { AppShellPreferencesProvider } from "@/app/shell/preferences/AppShellPreferencesProvider";
import { AppThemeProvider } from "@/app/theme/components/AppThemeProvider";
import { useAppDisplayPreferences } from "@/app/theme/preferences/useAppDisplayPreferences";
import { useAccessibilitySettingsSection, useInterfaceSettingsSection } from "@/features/settings";
import {
  SettingsAccessibilityPage,
  SettingsAppearancePage,
  SettingsLayoutPage,
  SettingsNavigationPage,
} from "@/pages/settings/SettingsPage";

const appearancePath = "/settings/appearance";
const navigationPath = "/settings/navigation";
const accessibilityPath = "/settings/accessibility";

function createSettingsWrapper(fixedSettings: AppFixedSettings, initialPath = appearancePath) {
  return function SettingsWrapper({ children }: PropsWithChildren) {
    return (
      <MemoryRouter initialEntries={[initialPath]}>
        <AppFixedSettingsProvider fixedSettings={fixedSettings}>
          <AppLocalizationProvider fixedLocale={fixedSettings.locale} initialLocale="en">
            <AppThemeProvider fixedSettings={fixedSettings}>
              <AppShellPreferencesProvider fixedSettings={fixedSettings}>{children}</AppShellPreferencesProvider>
            </AppThemeProvider>
          </AppLocalizationProvider>
        </AppFixedSettingsProvider>
      </MemoryRouter>
    );
  };
}

const testAccount = {
  avatar: <span aria-hidden="true">RD</span>,
  displayName: "RGO Demo User",
  email: "demo@rgo.hr",
};

const allFixedSettings: AppFixedSettings = {
  desktopTableSize: "medium",
  editorPresentation: "overlay-panel",
  fontSize: "big",
  increasedContrast: true,
  locale: "en",
  drawerMode: "permanent",
  headerStickiness: "both-rows",
  surfaceBorderRadius: 16,
  theme: "dark",
  motion: "reduce",
  linkUnderlines: "always",
};

function SettingsRoutes() {
  return (
    <Routes>
      <Route element={<SettingsLayoutPage account={testAccount} />} path="/settings">
        <Route element={<SettingsAppearancePage />} path="appearance" />
        <Route element={<SettingsNavigationPage />} path="navigation" />
        <Route element={<SettingsAccessibilityPage />} path="accessibility" />
      </Route>
    </Routes>
  );
}

async function selectSettingsPage(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole("button", { name: /^Choose Settings page:/ }));
  await user.click(within(screen.getByRole("dialog", { name: "Settings pages" })).getByRole("link", { name }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  await screen.findByRole("heading", { level: 1, name });
}

function PreferenceOutput() {
  const { editorPresentation, fontSize } = useAppDisplayPreferences();

  return (
    <output data-testid="preferences">
      {fontSize}:{editorPresentation}
    </output>
  );
}

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("fixed application settings", () => {
  it("composes all nine editable rows when no setting is fixed", () => {
    const { result } = renderHook(useInterfaceSettingsSection, {
      wrapper: createSettingsWrapper(noFixedAppSettings),
    });

    expect(result.current.rows.map(row => row.id)).toEqual([
      "language",
      "drawer-mode",
      "header-stickiness",
      "font-size",
      "desktop-table-size",
      "theme",
      "increased-contrast",
      "editor-presentation",
      "corner-roundness",
    ]);
  });

  it("filters only the fixed rows", () => {
    const { result } = renderHook(useInterfaceSettingsSection, {
      wrapper: createSettingsWrapper({
        ...noFixedAppSettings,
        drawerMode: "temporary",
        editorPresentation: "overlay-panel",
      }),
    });

    expect(result.current.rows.map(row => row.id)).not.toContain("drawer-mode");
    expect(result.current.rows.map(row => row.id)).not.toContain("editor-presentation");
    expect(result.current.rows).toHaveLength(7);
  });

  it("shows the shared account and switches between Appearance, Navigation, and Accessibility", async () => {
    const user = userEvent.setup();
    render(<SettingsRoutes />, { wrapper: createSettingsWrapper(noFixedAppSettings) });

    expect(screen.getByText("RGO Demo User")).toBeInTheDocument();
    expect(screen.getByText("demo@rgo.hr")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose Settings page: Appearance" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Appearance" })).toBeInTheDocument();
    expect(document.querySelector('[data-rgo-settings-row="theme"]')).toBeInTheDocument();
    expect(document.querySelector('[data-rgo-settings-row="increased-contrast"]')).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Contrast" })).toBeInTheDocument();
    expect(document.querySelector('[data-rgo-settings-row="drawer-mode"]')).toBeNull();

    await selectSettingsPage(user, "Navigation");

    expect(screen.getByRole("button", { name: "Choose Settings page: Navigation" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Navigation" })).toBeInTheDocument();
    expect(document.querySelector('[data-rgo-settings-row="drawer-mode"]')).toBeInTheDocument();
    expect(document.querySelector('[data-rgo-settings-row="header-stickiness"]')).toBeInTheDocument();
    expect(document.querySelector('[data-rgo-settings-row="theme"]')).toBeNull();

    await selectSettingsPage(user, "Accessibility");
    expect(screen.getByRole("button", { name: "Choose Settings page: Accessibility" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Accessibility" })).toBeInTheDocument();
    expect(document.querySelector('[data-rgo-settings-row="motion"]')).toBeInTheDocument();
    expect(document.querySelector('[data-rgo-settings-row="link-underlines"]')).toBeInTheDocument();
    expect(document.querySelector('[data-rgo-settings-row="drawer-mode"]')).toBeNull();
    expect(screen.getByRole("link", { name: "Open Appearance settings" })).toHaveAttribute("href", appearancePath);
    await user.click(screen.getByRole("button", { name: "Reduce motion" }));
    await user.click(screen.getByRole("button", { name: "Always" }));
    expect(appLocalStorage.get(appLocalStorageKeys.motion)).toBe("reduce");
    expect(appLocalStorage.get(appLocalStorageKeys.linkUnderlines)).toBe("always");
  });

  it("saves the Increased contrast choice and shows the selected state", async () => {
    const user = userEvent.setup();
    render(<SettingsRoutes />, { wrapper: createSettingsWrapper(noFixedAppSettings) });

    const contrastControl = screen.getByRole("group", { name: "Increased contrast" });
    expect(within(contrastControl).getByRole("button", { name: "No" })).toHaveAttribute("aria-pressed", "true");
    await user.click(within(contrastControl).getByRole("button", { name: "Yes" }));

    expect(within(contrastControl).getByRole("button", { name: "Yes" })).toHaveAttribute("aria-pressed", "true");
    expect(appLocalStorage.get(appLocalStorageKeys.increasedContrast)).toBe(true);
  });

  it("hides Increased contrast when that preference is fixed while leaving other Appearance rows", () => {
    render(<SettingsRoutes />, {
      wrapper: createSettingsWrapper({ ...noFixedAppSettings, increasedContrast: true }),
    });

    expect(document.querySelector('[data-rgo-settings-row="increased-contrast"]')).toBeNull();
    expect(screen.queryByRole("heading", { name: "Contrast" })).toBeNull();
    expect(document.querySelector('[data-rgo-settings-row="theme"]')).toBeInTheDocument();
  });

  it.each([
    [appearancePath, "Appearance"],
    [navigationPath, "Navigation"],
    [accessibilityPath, "Accessibility"],
  ])("shows a section-specific managed state at %s when all settings are fixed", (path, activeSection) => {
    render(<SettingsRoutes />, { wrapper: createSettingsWrapper(allFixedSettings, path) });

    expect(screen.getByRole("heading", { level: 1, name: activeSection })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("No configurable options available");
    expect(screen.getByRole("button", { name: `Choose Settings page: ${activeSection}` })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Restore defaults" })).toBeNull();
  });

  it("shows a managed Appearance state without hiding editable Navigation controls", async () => {
    const user = userEvent.setup();
    render(<SettingsRoutes />, {
      wrapper: createSettingsWrapper({
        ...noFixedAppSettings,
        desktopTableSize: "medium",
        editorPresentation: "overlay-panel",
        fontSize: "big",
        increasedContrast: true,
        locale: "en",
        surfaceBorderRadius: 16,
        theme: "dark",
      }),
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Appearance preferences are managed");
    await selectSettingsPage(user, "Navigation");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(document.querySelector('[data-rgo-settings-row="drawer-mode"]')).toBeInTheDocument();
    expect(document.querySelector('[data-rgo-settings-row="header-stickiness"]')).toBeInTheDocument();
  });

  it("shows the Croatian Appearance managed-state translation", () => {
    render(<SettingsRoutes />, {
      wrapper: createSettingsWrapper({ ...allFixedSettings, locale: "hr" }),
    });

    expect(screen.getByRole("alert")).toHaveTextContent("Nema dostupnih postavki za prilagodbu");
  });

  it("filters only fixed Accessibility rows and keeps the other choice editable", () => {
    const { result } = renderHook(useAccessibilitySettingsSection, {
      wrapper: createSettingsWrapper({ ...noFixedAppSettings, motion: "reduce" }, accessibilityPath),
    });

    expect(result.current.rows.map(row => row.id)).toEqual(["link-underlines"]);
  });

  it("resets only Accessibility values while preserving fixed motion and other section storage", async () => {
    appLocalStorage.set(appLocalStorageKeys.motion, "reduce");
    appLocalStorage.set(appLocalStorageKeys.linkUnderlines, "always");
    appLocalStorage.set(appLocalStorageKeys.headerStickiness, "none");
    appLocalStorage.set(appLocalStorageKeys.editorPresentation, "dialog");
    const user = userEvent.setup();

    render(<SettingsRoutes />, {
      wrapper: createSettingsWrapper({ ...noFixedAppSettings, motion: "reduce" }, accessibilityPath),
    });

    expect(document.querySelector('[data-rgo-settings-row="motion"]')).toBeNull();
    expect(document.querySelector('[data-rgo-settings-row="link-underlines"]')).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Restore defaults" }));

    expect(appLocalStorage.get(appLocalStorageKeys.motion)).toBe("reduce");
    expect(appLocalStorage.get(appLocalStorageKeys.linkUnderlines)).toBe("page");
    expect(appLocalStorage.get(appLocalStorageKeys.headerStickiness)).toBe("none");
    expect(appLocalStorage.get(appLocalStorageKeys.editorPresentation)).toBe("dialog");
  });

  it("resets only Appearance values while preserving a fixed value and Navigation storage", async () => {
    appLocalStorage.set(appLocalStorageKeys.fontSize, "normal");
    appLocalStorage.set(appLocalStorageKeys.editorPresentation, "dialog");
    appLocalStorage.set(appLocalStorageKeys.increasedContrast, true);
    appLocalStorage.set(appLocalStorageKeys.headerStickiness, "none");
    const user = userEvent.setup();

    render(
      <>
        <SettingsRoutes />
        <PreferenceOutput />
      </>,
      {
        wrapper: createSettingsWrapper({
          ...noFixedAppSettings,
          fontSize: "big",
        }),
      },
    );

    expect(screen.getByTestId("preferences")).toHaveTextContent("big:dialog");
    await user.click(screen.getByRole("button", { name: "Restore defaults" }));

    expect(screen.getByTestId("preferences")).toHaveTextContent("big:docked-panel");
    expect(appLocalStorage.get(appLocalStorageKeys.fontSize)).toBe("normal");
    expect(appLocalStorage.get(appLocalStorageKeys.editorPresentation)).toBe("docked-panel");
    expect(appLocalStorage.get(appLocalStorageKeys.increasedContrast)).toBe(false);
    expect(appLocalStorage.get(appLocalStorageKeys.headerStickiness)).toBe("none");
  });

  it("resets only Navigation values while preserving a fixed value and Appearance storage", async () => {
    appLocalStorage.set(appLocalStorageKeys.drawerMode, "temporary");
    appLocalStorage.set(appLocalStorageKeys.headerStickiness, "none");
    appLocalStorage.set(appLocalStorageKeys.editorPresentation, "dialog");
    const user = userEvent.setup();

    render(<SettingsRoutes />, {
      wrapper: createSettingsWrapper(
        {
          ...noFixedAppSettings,
          drawerMode: "permanent",
        },
        navigationPath,
      ),
    });

    await user.click(screen.getByRole("button", { name: "Restore defaults" }));

    expect(appLocalStorage.get(appLocalStorageKeys.drawerMode)).toBe("temporary");
    expect(appLocalStorage.get(appLocalStorageKeys.headerStickiness)).toBe("first-row");
    expect(appLocalStorage.get(appLocalStorageKeys.editorPresentation)).toBe("dialog");
  });
});
