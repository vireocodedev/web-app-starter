import { act, render, renderHook } from "@testing-library/react";
import { useTheme } from "@mui/material/styles";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { noFixedAppSettings } from "@/app/bootstrap/config/fixedSettings";
import { appLocalStorage, appLocalStorageKeys } from "@/app/data/storage/appLocalStorage";
import { AppThemeProvider } from "@/app/theme/components/AppThemeProvider";
import { useAppAccessibilityPreferences } from "@/app/theme/preferences/useAppAccessibilityPreferences";
import { useResetAppAccessibilityPreferences } from "@/app/theme/preferences/useResetAppAccessibilityPreferences";
import { themeSetup } from "@/app/theme/themeSetup";

function ConfigurableWrapper({ children }: PropsWithChildren) {
  return <AppThemeProvider>{children}</AppThemeProvider>;
}

function FixedWrapper({ children }: PropsWithChildren) {
  return (
    <AppThemeProvider fixedSettings={{ ...noFixedAppSettings, motion: "reduce", linkUnderlines: "always" }}>
      {children}
    </AppThemeProvider>
  );
}

function useAccessibilityUnderTest() {
  return {
    preferences: useAppAccessibilityPreferences(),
    reset: useResetAppAccessibilityPreferences(),
    reducedMotion: useTheme().motion.reducedMotion,
  };
}

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("app accessibility preferences", () => {
  it("uses system motion and page-defined link underlines by default", () => {
    const { result } = renderHook(useAccessibilityUnderTest, { wrapper: ConfigurableWrapper });

    expect(result.current.preferences.motion).toBe(themeSetup.defaultMotion);
    expect(result.current.preferences.linkUnderlines).toBe(themeSetup.defaultLinkUnderlines);
    expect(result.current.reducedMotion).toBe("system");
  });

  it("persists live choices and restores both defaults without changing unrelated preferences", () => {
    appLocalStorage.set(appLocalStorageKeys.fontSize, "normal");
    const first = renderHook(useAccessibilityUnderTest, { wrapper: ConfigurableWrapper });

    act(() => {
      first.result.current.preferences.setMotion("reduce");
      first.result.current.preferences.setLinkUnderlines("always");
    });

    expect(first.result.current.preferences).toMatchObject({ motion: "reduce", linkUnderlines: "always" });
    expect(first.result.current.reducedMotion).toBe("always");
    expect(appLocalStorage.get(appLocalStorageKeys.motion)).toBe("reduce");
    expect(appLocalStorage.get(appLocalStorageKeys.linkUnderlines)).toBe("always");
    first.unmount();

    const reloaded = renderHook(useAccessibilityUnderTest, { wrapper: ConfigurableWrapper });
    expect(reloaded.result.current.preferences).toMatchObject({ motion: "reduce", linkUnderlines: "always" });

    act(() => reloaded.result.current.reset());
    expect(reloaded.result.current.preferences).toMatchObject({
      motion: themeSetup.defaultMotion,
      linkUnderlines: themeSetup.defaultLinkUnderlines,
    });
    expect(reloaded.result.current.reducedMotion).toBe("system");
    expect(appLocalStorage.get(appLocalStorageKeys.motion)).toBe("system");
    expect(appLocalStorage.get(appLocalStorageKeys.linkUnderlines)).toBe("page");
    expect(appLocalStorage.get(appLocalStorageKeys.fontSize)).toBe("normal");
  });

  it("keeps fixed values effective without replacing dormant saved choices", () => {
    appLocalStorage.set(appLocalStorageKeys.motion, "system");
    appLocalStorage.set(appLocalStorageKeys.linkUnderlines, "page");
    const fixed = renderHook(useAccessibilityUnderTest, { wrapper: FixedWrapper });

    expect(fixed.result.current.preferences).toMatchObject({ motion: "reduce", linkUnderlines: "always" });
    expect(fixed.result.current.reducedMotion).toBe("always");

    act(() => {
      fixed.result.current.preferences.setMotion("system");
      fixed.result.current.preferences.setLinkUnderlines("page");
      fixed.result.current.reset();
      window.dispatchEvent(new StorageEvent("storage", { key: null }));
    });

    expect(fixed.result.current.preferences).toMatchObject({ motion: "reduce", linkUnderlines: "always" });
    expect(appLocalStorage.get(appLocalStorageKeys.motion)).toBe("system");
    expect(appLocalStorage.get(appLocalStorageKeys.linkUnderlines)).toBe("page");

    fixed.unmount();
    const configurable = renderHook(useAccessibilityUnderTest, { wrapper: ConfigurableWrapper });
    expect(configurable.result.current.preferences).toMatchObject({ motion: "system", linkUnderlines: "page" });
  });

  it("updates configurable choices from other tabs", () => {
    const { result } = renderHook(useAccessibilityUnderTest, { wrapper: ConfigurableWrapper });

    act(() => {
      appLocalStorage.set(appLocalStorageKeys.motion, "reduce");
      appLocalStorage.set(appLocalStorageKeys.linkUnderlines, "always");
      window.dispatchEvent(new StorageEvent("storage", { key: appLocalStorageKeys.motion }));
      window.dispatchEvent(new StorageEvent("storage", { key: appLocalStorageKeys.linkUnderlines }));
    });

    expect(result.current.preferences).toMatchObject({ motion: "reduce", linkUnderlines: "always" });
    expect(result.current.reducedMotion).toBe("always");
  });

  it("keeps live choices when browser storage rejects writes", () => {
    const { result } = renderHook(useAccessibilityUnderTest, { wrapper: ConfigurableWrapper });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });

    act(() => {
      result.current.preferences.setMotion("reduce");
      result.current.preferences.setLinkUnderlines("always");
    });

    expect(result.current.preferences).toMatchObject({ motion: "reduce", linkUnderlines: "always" });
    expect(result.current.reducedMotion).toBe("always");
  });

  it("applies the always-underline rule to page text links", () => {
    function Control() {
      const { setLinkUnderlines } = useAppAccessibilityPreferences();
      return <button onClick={() => setLinkUnderlines("always")}>Always underline</button>;
    }

    const { getByRole } = render(
      <AppThemeProvider>
        <Control />
        <main>
          <p>
            <a className="MuiLink-root MuiLink-underlineHover" href="#page">
              Page link
            </a>
            <a href="#native">Native prose link</a>
          </p>
          <a href="#action">Action link outside prose</a>
          <nav>
            <a className="MuiLink-root MuiLink-underlineHover" href="#navigation">
              Navigation link
            </a>
          </nav>
        </main>
      </AppThemeProvider>,
    );
    const styleText = () =>
      Array.from(document.querySelectorAll("style"))
        .map(style => style.textContent)
        .join("");

    expect(styleText()).not.toContain(
      "main :is(p, li, blockquote, dd, figcaption) a:not(aside a, button a, [role='button'], .MuiButtonBase-root)",
    );
    act(() => getByRole("button", { name: "Always underline" }).click());
    expect(styleText()).toContain(
      "main :is(p, li, blockquote, dd, figcaption) a:not(aside a, button a, [role='button'], .MuiButtonBase-root)",
    );
    expect(styleText()).toContain("text-decoration:underline!important");
  });
});
