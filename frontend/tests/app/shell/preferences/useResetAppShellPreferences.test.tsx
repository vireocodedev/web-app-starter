import { act, renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { noFixedAppSettings } from "@/app/bootstrap/config/fixedSettings";
import { appLocalStorage, appLocalStorageKeys } from "@/app/data/storage/appLocalStorage";
import { appShellConfig } from "@/app/shell/appShellConfig";
import { AppShellPreferencesProvider } from "@/app/shell/preferences/AppShellPreferencesProvider";
import { useAppShellPreferences } from "@/app/shell/preferences/useAppShellPreferences";
import { useResetAppShellPreferences } from "@/app/shell/preferences/useResetAppShellPreferences";

function ShellPreferencesWrapper({ children }: PropsWithChildren) {
  return <AppShellPreferencesProvider>{children}</AppShellPreferencesProvider>;
}

function FixedShellPreferencesWrapper({ children }: PropsWithChildren) {
  return (
    <AppShellPreferencesProvider
      fixedSettings={{ ...noFixedAppSettings, drawerMode: "temporary", headerStickiness: "first-row" }}
    >
      {children}
    </AppShellPreferencesProvider>
  );
}

function useShellPreferencesUnderTest() {
  return { preferences: useAppShellPreferences(), reset: useResetAppShellPreferences() };
}

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("shell preferences", () => {
  it("keeps fixed values live without overwriting saved choices", () => {
    appLocalStorage.set(appLocalStorageKeys.drawerMode, "permanent");
    appLocalStorage.set(appLocalStorageKeys.headerStickiness, "both-rows");
    const fixed = renderHook(useShellPreferencesUnderTest, { wrapper: FixedShellPreferencesWrapper });

    expect(fixed.result.current.preferences).toMatchObject({
      drawerMode: "temporary",
      headerStickiness: "first-row",
    });

    act(() => {
      fixed.result.current.preferences.setDrawerMode("permanent");
      fixed.result.current.preferences.setHeaderStickiness("none");
      fixed.result.current.reset();
    });

    expect(fixed.result.current.preferences).toMatchObject({
      drawerMode: "temporary",
      headerStickiness: "first-row",
    });
    expect(appLocalStorage.get(appLocalStorageKeys.drawerMode)).toBe("permanent");
    expect(appLocalStorage.get(appLocalStorageKeys.headerStickiness)).toBe("both-rows");

    fixed.unmount();
    const configurable = renderHook(useShellPreferencesUnderTest, { wrapper: ShellPreferencesWrapper });
    expect(configurable.result.current.preferences).toMatchObject({
      drawerMode: "permanent",
      headerStickiness: "both-rows",
    });
  });

  it("persists permanent drawer visibility and collapse independently of the mode", () => {
    const first = renderHook(useShellPreferencesUnderTest, { wrapper: ShellPreferencesWrapper });
    act(() => {
      first.result.current.preferences.setPermanentDrawerOpen(false);
      first.result.current.preferences.setPermanentDrawerCollapsed(true);
    });
    expect(appLocalStorage.get(appLocalStorageKeys.permanentDrawerOpen)).toBe(false);
    expect(appLocalStorage.get(appLocalStorageKeys.permanentDrawerCollapsed)).toBe(true);
    first.unmount();

    const next = renderHook(useShellPreferencesUnderTest, { wrapper: ShellPreferencesWrapper });
    expect(next.result.current.preferences.permanentDrawerOpen).toBe(false);
    expect(next.result.current.preferences.permanentDrawerCollapsed).toBe(true);
  });

  it("restores shell defaults, removes obsolete keys, and preserves other preferences", () => {
    localStorage.setItem("rgo.app.navigation-placement", JSON.stringify("left-panel"));
    localStorage.setItem("rgo.app.left-panel-state", JSON.stringify({ expandedSize: 300, mode: "expanded" }));
    localStorage.setItem("rgo.test.unrelated", "preserved");
    appLocalStorage.set(appLocalStorageKeys.locale, "hr");
    const { result } = renderHook(useShellPreferencesUnderTest, { wrapper: ShellPreferencesWrapper });
    expect(localStorage.getItem("rgo.app.navigation-placement")).toBeNull();
    expect(localStorage.getItem("rgo.app.left-panel-state")).toBeNull();

    act(() => {
      result.current.preferences.setDrawerMode("permanent");
      result.current.preferences.setHeaderStickiness("both-rows");
      result.current.preferences.setPermanentDrawerOpen(false);
      result.current.preferences.setPermanentDrawerCollapsed(true);
      result.current.reset();
    });

    expect(result.current.preferences).toMatchObject({
      drawerMode: appShellConfig.drawerMode,
      headerStickiness: appShellConfig.headerStickiness,
      permanentDrawerOpen: appShellConfig.permanentDrawerOpen,
      permanentDrawerCollapsed: appShellConfig.permanentDrawerCollapsed,
    });
    expect(appLocalStorage.get(appLocalStorageKeys.drawerMode)).toBe(appShellConfig.drawerMode);
    expect(appLocalStorage.get(appLocalStorageKeys.headerStickiness)).toBe(appShellConfig.headerStickiness);
    expect(appLocalStorage.get(appLocalStorageKeys.permanentDrawerOpen)).toBe(appShellConfig.permanentDrawerOpen);
    expect(appLocalStorage.get(appLocalStorageKeys.permanentDrawerCollapsed)).toBe(
      appShellConfig.permanentDrawerCollapsed,
    );
    expect(localStorage.getItem("rgo.test.unrelated")).toBe("preserved");
    expect(appLocalStorage.get(appLocalStorageKeys.locale)).toBe("hr");
  });

  it("continues resetting live values when one storage write fails", () => {
    const { result } = renderHook(useShellPreferencesUnderTest, { wrapper: ShellPreferencesWrapper });
    const nativeSetItem = Storage.prototype.setItem;

    act(() => {
      result.current.preferences.setDrawerMode("permanent");
      result.current.preferences.setHeaderStickiness("both-rows");
      result.current.preferences.setPermanentDrawerOpen(false);
      result.current.preferences.setPermanentDrawerCollapsed(true);
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (key === appLocalStorageKeys.drawerMode) throw new DOMException("Blocked", "SecurityError");
      nativeSetItem.call(this, key, value);
    });

    act(() => result.current.reset());

    expect(result.current.preferences).toMatchObject({
      drawerMode: appShellConfig.drawerMode,
      headerStickiness: appShellConfig.headerStickiness,
      permanentDrawerOpen: appShellConfig.permanentDrawerOpen,
      permanentDrawerCollapsed: appShellConfig.permanentDrawerCollapsed,
    });
    expect(appLocalStorage.get(appLocalStorageKeys.drawerMode)).toBe("permanent");
    expect(appLocalStorage.get(appLocalStorageKeys.headerStickiness)).toBe(appShellConfig.headerStickiness);
    expect(appLocalStorage.get(appLocalStorageKeys.permanentDrawerOpen)).toBe(appShellConfig.permanentDrawerOpen);
    expect(appLocalStorage.get(appLocalStorageKeys.permanentDrawerCollapsed)).toBe(
      appShellConfig.permanentDrawerCollapsed,
    );
  });
});
