import { useColorScheme as useMuiColorScheme } from "@mui/material/styles";
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { appLocalStorage, appLocalStorageKeys } from "@/app/data/storage/appLocalStorage";
import { AppThemeProvider } from "@/app/theme/components/AppThemeProvider";
import { noFixedAppSettings } from "@/app/bootstrap/config/fixedSettings";
import { useAppColorScheme } from "@/app/theme/preferences/useAppColorScheme";
import { useAppDisplayPreferences } from "@/app/theme/preferences/useAppDisplayPreferences";
import { useResetAppThemePreferences } from "@/app/theme/preferences/useResetAppThemePreferences";
import { themeSetup } from "@/app/theme/themeSetup";

const unrelatedStorageKey = "rgo.test.unrelated";

function ThemePreferencesWrapper({ children }: PropsWithChildren) {
  return <AppThemeProvider>{children}</AppThemeProvider>;
}

function FixedThemePreferencesWrapper({ children }: PropsWithChildren) {
  return (
    <AppThemeProvider
      fixedSettings={{
        ...noFixedAppSettings,
        desktopTableSize: "medium",
        editorPresentation: "overlay-panel",
        fontSize: "big",
        increasedContrast: true,
        surfaceBorderRadius: 18,
        theme: "system",
      }}
    >
      {children}
    </AppThemeProvider>
  );
}

function useThemePreferencesUnderTest() {
  return {
    colorScheme: useAppColorScheme(),
    preferences: useAppDisplayPreferences(),
    reset: useResetAppThemePreferences(),
  };
}

function RawMuiColorSchemeControls() {
  const { mode, setMode } = useMuiColorScheme();

  return (
    <>
      <output data-testid="raw-mui-mode">{mode}</output>
      <button type="button" onClick={() => setMode("light")}>
        Raw light mode
      </button>
      <button type="button" onClick={() => setMode("dark")}>
        Raw dark mode
      </button>
    </>
  );
}

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-dark");
  document.documentElement.removeAttribute("data-soft-dark");
  document.documentElement.removeAttribute("data-light");
  vi.unstubAllGlobals();
});

function stubSystemColorScheme(initialScheme: "light" | "dark") {
  let scheme = initialScheme;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const media = "(prefers-color-scheme: dark)";
  const mediaQueryList = {
    addEventListener(_type: string, listener: (event: MediaQueryListEvent) => void) {
      listeners.add(listener);
    },
    addListener(listener: (event: MediaQueryListEvent) => void) {
      listeners.add(listener);
    },
    dispatchEvent: () => true,
    get matches() {
      return scheme === "dark";
    },
    media,
    onchange: null,
    removeEventListener(_type: string, listener: (event: MediaQueryListEvent) => void) {
      listeners.delete(listener);
    },
    removeListener(listener: (event: MediaQueryListEvent) => void) {
      listeners.delete(listener);
    },
  };
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => mediaQueryList),
  );

  return (nextScheme: "light" | "dark") => {
    scheme = nextScheme;
    const event = { matches: scheme === "dark", media } as MediaQueryListEvent;

    act(() => {
      for (const listener of listeners) listener(event);
    });
  };
}

describe("useResetAppThemePreferences", () => {
  it("uses Small for fresh and reset table density while preserving saved Medium", () => {
    const fresh = renderHook(useThemePreferencesUnderTest, { wrapper: ThemePreferencesWrapper });
    expect(fresh.result.current.preferences.desktopTableSize).toBe("small");
    act(() => fresh.result.current.preferences.setDesktopTableSize("medium"));
    fresh.unmount();

    const saved = renderHook(useThemePreferencesUnderTest, { wrapper: ThemePreferencesWrapper });
    expect(saved.result.current.preferences.desktopTableSize).toBe("medium");
    act(() => saved.result.current.reset());
    expect(saved.result.current.preferences.desktopTableSize).toBe("small");
    expect(appLocalStorage.get(appLocalStorageKeys.desktopTableSize)).toBe("small");
  });

  it("preserves the old 112.5% Big choice as Medium while allowing the new Big value", () => {
    appLocalStorage.set(appLocalStorageKeys.fontSize, "big");
    const first = renderHook(useThemePreferencesUnderTest, { wrapper: ThemePreferencesWrapper });

    expect(first.result.current.preferences.fontSize).toBe("medium");
    expect(appLocalStorage.get(appLocalStorageKeys.fontSize)).toBe("medium");
    expect(appLocalStorage.get(appLocalStorageKeys.fontSizeScaleVersion)).toBe(2);

    act(() => first.result.current.preferences.setFontSize("big"));
    expect(appLocalStorage.get(appLocalStorageKeys.fontSize)).toBe("big");
    first.unmount();

    const reloaded = renderHook(useThemePreferencesUnderTest, { wrapper: ThemePreferencesWrapper });
    expect(reloaded.result.current.preferences.fontSize).toBe("big");
  });

  it("restores a fixed dark mode after a raw MUI setter attempt", async () => {
    render(
      <AppThemeProvider fixedSettings={{ ...noFixedAppSettings, theme: "dark" }}>
        <RawMuiColorSchemeControls />
      </AppThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("raw-mui-mode")).toHaveTextContent("dark");
      expect(document.documentElement).toHaveAttribute("data-dark");
      expect(document.documentElement).not.toHaveAttribute("data-light");
    });

    fireEvent.click(screen.getByRole("button", { name: "Raw light mode" }));

    await waitFor(() => {
      expect(screen.getByTestId("raw-mui-mode")).toHaveTextContent("dark");
      expect(document.documentElement).toHaveAttribute("data-dark");
      expect(document.documentElement).not.toHaveAttribute("data-light");
    });
  });

  it("persists Soft dark, applies its scheme, and resets to System", async () => {
    const { result } = renderHook(useThemePreferencesUnderTest, { wrapper: ThemePreferencesWrapper });

    act(() => result.current.colorScheme.setMode("soft-dark"));
    await waitFor(() => {
      expect(result.current.colorScheme.mode).toBe("soft-dark");
      expect(document.documentElement).toHaveAttribute("data-soft-dark");
    });
    expect(appLocalStorage.get(appLocalStorageKeys.colorMode)).toBe("dark");
    expect(appLocalStorage.get(appLocalStorageKeys.darkColorScheme)).toBe("soft-dark");

    act(() => result.current.reset());
    await waitFor(() => {
      expect(result.current.colorScheme.mode).toBe("system");
      expect(appLocalStorage.get(appLocalStorageKeys.darkColorScheme)).toBeNull();
      expect(appLocalStorage.get(appLocalStorageKeys.colorMode)).toBeNull();
    });
  });

  it("restores a fixed Soft dark mode and scheme after raw MUI setter attempts", async () => {
    render(
      <AppThemeProvider fixedSettings={{ ...noFixedAppSettings, theme: "soft-dark" }}>
        <RawMuiColorSchemeControls />
      </AppThemeProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("raw-mui-mode")).toHaveTextContent("dark");
      expect(document.documentElement).toHaveAttribute("data-soft-dark");
    });

    fireEvent.click(screen.getByRole("button", { name: "Raw light mode" }));
    await waitFor(() => {
      expect(screen.getByTestId("raw-mui-mode")).toHaveTextContent("dark");
      expect(document.documentElement).toHaveAttribute("data-soft-dark");
    });
  });

  it("restores fixed system mode after a raw MUI setter attempt", async () => {
    const setSystemColorScheme = stubSystemColorScheme("dark");

    render(
      <AppThemeProvider fixedSettings={{ ...noFixedAppSettings, theme: "system" }}>
        <RawMuiColorSchemeControls />
      </AppThemeProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("raw-mui-mode")).toHaveTextContent("system");
      expect(document.documentElement).toHaveAttribute("data-dark");
      expect(document.documentElement).not.toHaveAttribute("data-light");
    });

    fireEvent.click(screen.getByRole("button", { name: "Raw dark mode" }));

    await waitFor(() => {
      expect(screen.getByTestId("raw-mui-mode")).toHaveTextContent("system");
      expect(document.documentElement).toHaveAttribute("data-dark");
      expect(document.documentElement).not.toHaveAttribute("data-light");
    });

    fireEvent.click(screen.getByRole("button", { name: "Raw light mode" }));

    await waitFor(() => {
      expect(screen.getByTestId("raw-mui-mode")).toHaveTextContent("system");
      expect(document.documentElement).toHaveAttribute("data-dark");
      expect(document.documentElement).not.toHaveAttribute("data-light");
    });

    setSystemColorScheme("light");

    await waitFor(() => {
      expect(screen.getByTestId("raw-mui-mode")).toHaveTextContent("system");
      expect(document.documentElement).toHaveAttribute("data-light");
      expect(document.documentElement).not.toHaveAttribute("data-dark");
    });
  });

  it("keeps fixed display and color-mode values without replacing storage", () => {
    appLocalStorage.set(appLocalStorageKeys.desktopTableSize, "small");
    appLocalStorage.set(appLocalStorageKeys.editorPresentation, "dialog");
    appLocalStorage.set(appLocalStorageKeys.fontSize, "normal");
    appLocalStorage.set(appLocalStorageKeys.increasedContrast, false);
    appLocalStorage.set(appLocalStorageKeys.surfaceBorderRadius, 6);
    appLocalStorage.set(appLocalStorageKeys.colorMode, "dark");
    const fixed = renderHook(useThemePreferencesUnderTest, {
      wrapper: FixedThemePreferencesWrapper,
    });

    expect(fixed.result.current.preferences).toMatchObject({
      desktopTableSize: "medium",
      editorPresentation: "overlay-panel",
      fontSize: "big",
      increasedContrast: true,
      surfaceBorderRadius: 18,
    });
    expect(fixed.result.current.colorScheme.mode).toBe("system");

    act(() => {
      fixed.result.current.preferences.setDesktopTableSize("small");
      fixed.result.current.preferences.setEditorPresentation("dialog");
      fixed.result.current.preferences.setFontSize("normal");
      fixed.result.current.preferences.setIncreasedContrast(false);
      fixed.result.current.preferences.setSurfaceBorderRadius(6);
      fixed.result.current.colorScheme.setMode("light");
      fixed.result.current.reset();
    });

    expect(fixed.result.current.preferences).toMatchObject({
      desktopTableSize: "medium",
      editorPresentation: "overlay-panel",
      fontSize: "big",
      increasedContrast: true,
      surfaceBorderRadius: 18,
    });
    expect(fixed.result.current.colorScheme.mode).toBe("system");
    expect(appLocalStorage.get(appLocalStorageKeys.desktopTableSize)).toBe("small");
    expect(appLocalStorage.get(appLocalStorageKeys.editorPresentation)).toBe("dialog");
    expect(appLocalStorage.get(appLocalStorageKeys.fontSize)).toBe("normal");
    expect(appLocalStorage.get(appLocalStorageKeys.increasedContrast)).toBe(false);
    expect(appLocalStorage.get(appLocalStorageKeys.surfaceBorderRadius)).toBe(6);
    expect(appLocalStorage.get(appLocalStorageKeys.colorMode)).toBe("dark");

    fixed.unmount();
    const configurable = renderHook(useThemePreferencesUnderTest, {
      wrapper: ThemePreferencesWrapper,
    });
    expect(configurable.result.current.preferences).toMatchObject({
      desktopTableSize: "small",
      editorPresentation: "dialog",
      fontSize: "normal",
      increasedContrast: false,
      surfaceBorderRadius: 6,
    });
    expect(configurable.result.current.colorScheme.mode).toBe("dark");
  });

  it("loads and persists Increased contrast independently of the color mode", () => {
    expect(themeSetup.defaultIncreasedContrast).toBe(false);
    const first = renderHook(useThemePreferencesUnderTest, { wrapper: ThemePreferencesWrapper });
    expect(first.result.current.preferences.increasedContrast).toBe(false);

    act(() => first.result.current.preferences.setIncreasedContrast(true));
    expect(first.result.current.preferences.increasedContrast).toBe(true);
    expect(appLocalStorage.get(appLocalStorageKeys.increasedContrast)).toBe(true);
    first.unmount();

    const reloaded = renderHook(useThemePreferencesUnderTest, { wrapper: ThemePreferencesWrapper });
    expect(reloaded.result.current.preferences.increasedContrast).toBe(true);
    act(() => reloaded.result.current.reset());
    expect(reloaded.result.current.preferences.increasedContrast).toBe(false);
    expect(appLocalStorage.get(appLocalStorageKeys.increasedContrast)).toBe(false);
  });

  it("restores display and color-mode defaults beneath the MUI provider", () => {
    localStorage.setItem(unrelatedStorageKey, "preserved");
    appLocalStorage.set(appLocalStorageKeys.drawerMode, "permanent");
    appLocalStorage.set(appLocalStorageKeys.locale, "hr");
    const { result } = renderHook(useThemePreferencesUnderTest, {
      wrapper: ThemePreferencesWrapper,
    });

    act(() => {
      result.current.preferences.setDesktopTableSize("medium");
      result.current.preferences.setEditorPresentation("dialog");
      result.current.preferences.setFontSize("big");
      result.current.preferences.setIncreasedContrast(true);
      result.current.preferences.setSurfaceBorderRadius(16);
      result.current.colorScheme.setMode("dark");
      result.current.reset();
    });

    expect(result.current.preferences).toMatchObject({
      desktopTableSize: themeSetup.defaultDesktopTableSize,
      editorPresentation: themeSetup.defaultEditorPresentation,
      fontSize: themeSetup.defaultFontSize,
      increasedContrast: themeSetup.defaultIncreasedContrast,
      surfaceBorderRadius: themeSetup.shape.surfaceBorderRadius,
    });
    expect(result.current.colorScheme.mode).toBe(themeSetup.defaultMode);
    expect(appLocalStorage.get(appLocalStorageKeys.desktopTableSize)).toBe(themeSetup.defaultDesktopTableSize);
    expect(appLocalStorage.get(appLocalStorageKeys.editorPresentation)).toBe(themeSetup.defaultEditorPresentation);
    expect(appLocalStorage.get(appLocalStorageKeys.fontSize)).toBe(themeSetup.defaultFontSize);
    expect(appLocalStorage.get(appLocalStorageKeys.increasedContrast)).toBe(false);
    expect(appLocalStorage.get(appLocalStorageKeys.surfaceBorderRadius)).toBe(themeSetup.shape.surfaceBorderRadius);
    expect(localStorage.getItem(appLocalStorageKeys.colorMode)).toBe("null");
    expect(localStorage.getItem(unrelatedStorageKey)).toBe("preserved");
    expect(appLocalStorage.get(appLocalStorageKeys.drawerMode)).toBe("permanent");
    expect(appLocalStorage.get(appLocalStorageKeys.locale)).toBe("hr");

    act(() => result.current.reset());

    expect(result.current.colorScheme.mode).toBe(themeSetup.defaultMode);
  });

  it("continues after an early display-preference write fails", () => {
    const { result } = renderHook(useThemePreferencesUnderTest, {
      wrapper: ThemePreferencesWrapper,
    });
    const nativeSetItem = Storage.prototype.setItem;

    act(() => {
      result.current.preferences.setDesktopTableSize("medium");
      result.current.preferences.setEditorPresentation("dialog");
      result.current.preferences.setFontSize("big");
      result.current.preferences.setSurfaceBorderRadius(16);
      result.current.colorScheme.setMode("dark");
    });

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (key === appLocalStorageKeys.desktopTableSize) {
        throw new DOMException("Blocked", "SecurityError");
      }
      nativeSetItem.call(this, key, value);
    });

    act(() => result.current.reset());

    expect(result.current.preferences).toMatchObject({
      desktopTableSize: themeSetup.defaultDesktopTableSize,
      editorPresentation: themeSetup.defaultEditorPresentation,
      fontSize: themeSetup.defaultFontSize,
      surfaceBorderRadius: themeSetup.shape.surfaceBorderRadius,
    });
    expect(appLocalStorage.get(appLocalStorageKeys.desktopTableSize)).toBe("medium");
    expect(appLocalStorage.get(appLocalStorageKeys.editorPresentation)).toBe(themeSetup.defaultEditorPresentation);
    expect(appLocalStorage.get(appLocalStorageKeys.fontSize)).toBe(themeSetup.defaultFontSize);
    expect(appLocalStorage.get(appLocalStorageKeys.surfaceBorderRadius)).toBe(themeSetup.shape.surfaceBorderRadius);
    expect(localStorage.getItem(appLocalStorageKeys.colorMode)).toBe("null");
  });
});
