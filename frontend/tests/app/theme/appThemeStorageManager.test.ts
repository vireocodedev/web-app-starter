import { afterEach, describe, expect, it, vi } from "vitest";

import { appLocalStorage, appLocalStorageKeys } from "@/app/data/storage/appLocalStorage";

import {
  appThemeColorSchemeStorageKey,
  appThemeStorageManager,
  createAppThemeStorageManager,
} from "@/app/theme/appThemeStorageManager";

function createModeStorageManager() {
  return appThemeStorageManager({
    key: appLocalStorageKeys.colorMode,
    storageWindow: window,
  });
}

afterEach(() => {
  localStorage.clear();
});

describe("appThemeStorageManager", () => {
  it("uses the passed system default when no explicit mode is stored", () => {
    const manager = createModeStorageManager();

    expect(manager.get("system")).toBe("system");
    expect(appLocalStorage.get(appLocalStorageKeys.colorMode)).toBeNull();
  });

  it("persists explicit light/dark choices and lets them win over system", () => {
    const manager = createModeStorageManager();

    manager.set("dark");

    expect(appLocalStorage.get(appLocalStorageKeys.colorMode)).toBe("dark");
    expect(manager.get("system")).toBe("dark");

    manager.set("light");

    expect(appLocalStorage.get(appLocalStorageKeys.colorMode)).toBe("light");
    expect(manager.get("system")).toBe("light");
  });

  it("clears the explicit override when MUI returns to system mode", () => {
    const manager = createModeStorageManager();
    manager.set("dark");

    manager.set("system");

    expect(appLocalStorage.get(appLocalStorageKeys.colorMode)).toBeNull();
    expect(manager.get("system")).toBe("system");
  });

  it("falls back to the passed default when the persisted value is invalid", () => {
    localStorage.setItem(appLocalStorageKeys.colorMode, '"system"');

    expect(createModeStorageManager().get("dark")).toBe("dark");
    expect(appLocalStorage.get(appLocalStorageKeys.colorMode)).toBeNull();
  });

  it("falls back to the passed default when browser storage cannot be read", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });

    expect(createModeStorageManager().get("dark")).toBe("dark");
  });

  it("leaves MUI color-scheme slots stateless", () => {
    const manager = appThemeStorageManager({
      key: "rgo.app.theme-color-scheme-light",
      storageWindow: window,
    });

    expect(manager.get("light")).toBe("light");

    manager.set("dark");

    expect(appLocalStorage.get(appLocalStorageKeys.colorMode)).toBeNull();
  });

  it("keeps mode changes usable when storage writes are blocked", () => {
    const manager = createModeStorageManager();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });

    expect(() => manager.set("dark")).not.toThrow();
  });

  it("notifies a tab when another tab changes or clears the explicit mode", () => {
    const manager = createModeStorageManager();
    const handler = vi.fn();
    const unsubscribe = manager.subscribe(handler);

    appLocalStorage.set(appLocalStorageKeys.colorMode, "dark");
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: appLocalStorageKeys.colorMode,
      }),
    );

    expect(handler).toHaveBeenLastCalledWith("dark");

    localStorage.clear();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));

    expect(handler).toHaveBeenLastCalledWith(null);
    expect(manager.get("system")).toBe("system");

    unsubscribe();
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: appLocalStorageKeys.colorMode,
      }),
    );

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("stores Soft dark in the named dark-scheme slot without changing the legacy mode key", () => {
    const mode = createModeStorageManager();
    const darkScheme = appThemeStorageManager({
      key: `${appThemeColorSchemeStorageKey}-dark`,
      storageWindow: window,
    });

    darkScheme.set("soft-dark");
    mode.set("dark");
    expect(appLocalStorage.get(appLocalStorageKeys.colorMode)).toBe("dark");
    expect(appLocalStorage.get(appLocalStorageKeys.darkColorScheme)).toBe("soft-dark");
    expect(darkScheme.get("dark")).toBe("soft-dark");

    darkScheme.set("dark");
    expect(appLocalStorage.get(appLocalStorageKeys.darkColorScheme)).toBeNull();
    expect(darkScheme.get("dark")).toBe("dark");
  });

  it("notifies other tabs when the named dark scheme changes or clears", () => {
    const darkScheme = appThemeStorageManager({
      key: `${appThemeColorSchemeStorageKey}-dark`,
      storageWindow: window,
    });
    const handler = vi.fn();
    const unsubscribe = darkScheme.subscribe(handler);

    appLocalStorage.set(appLocalStorageKeys.darkColorScheme, "soft-dark");
    window.dispatchEvent(new StorageEvent("storage", { key: appLocalStorageKeys.darkColorScheme }));
    expect(handler).toHaveBeenLastCalledWith("soft-dark");

    localStorage.clear();
    window.dispatchEvent(new StorageEvent("storage", { key: null }));
    expect(handler).toHaveBeenLastCalledWith(null);
    unsubscribe();
  });

  it("keeps a fixed Soft dark mode and scheme over stored values and writes", () => {
    appLocalStorage.set(appLocalStorageKeys.colorMode, "light");
    const manager = createAppThemeStorageManager("soft-dark");
    const mode = manager({ key: appLocalStorageKeys.colorMode, storageWindow: window });
    const darkScheme = manager({ key: `${appThemeColorSchemeStorageKey}-dark`, storageWindow: window });

    expect(mode.get("system")).toBe("dark");
    expect(darkScheme.get("dark")).toBe("soft-dark");
    mode.set("light");
    darkScheme.set("dark");
    expect(appLocalStorage.get(appLocalStorageKeys.colorMode)).toBe("light");
    expect(appLocalStorage.get(appLocalStorageKeys.darkColorScheme)).toBeNull();
  });

  it("keeps a fixed mode over stored values, writes, and storage events", () => {
    appLocalStorage.set(appLocalStorageKeys.colorMode, "dark");
    const manager = createAppThemeStorageManager("system")({
      key: appLocalStorageKeys.colorMode,
      storageWindow: window,
    });
    const handler = vi.fn();
    const unsubscribe = manager.subscribe(handler);

    expect(manager.get("light")).toBe("system");
    manager.set("light");
    expect(appLocalStorage.get(appLocalStorageKeys.colorMode)).toBe("dark");

    appLocalStorage.set(appLocalStorageKeys.colorMode, "light");
    window.dispatchEvent(new StorageEvent("storage", { key: appLocalStorageKeys.colorMode }));

    expect(handler).toHaveBeenLastCalledWith("system");
    expect(manager.get("dark")).toBe("system");
    expect(appLocalStorage.get(appLocalStorageKeys.colorMode)).toBe("light");
    unsubscribe();
  });
});
