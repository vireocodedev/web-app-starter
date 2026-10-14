import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { appLocalStorage, appLocalStorageKeys } from "@/app/data/storage/appLocalStorage";
import { AppLocalizationProvider } from "@/app/localization/components/AppLocalizationProvider";
import { useAppLocalization } from "@/app/localization/hooks/useAppLocalization";
import { useResetAppLocale } from "@/app/localization/hooks/useResetAppLocale";
import { defaultAppLocale } from "@/app/localization/localeConfig";
import { resolveInitialLocale } from "@/app/localization/preferences/localePreference";

const unrelatedStorageKey = "rgo.test.unrelated";

function LocalizationWrapper({ children }: PropsWithChildren) {
  return <AppLocalizationProvider initialLocale={resolveInitialLocale()}>{children}</AppLocalizationProvider>;
}

function useLocaleUnderTest() {
  return {
    localization: useAppLocalization(),
    reset: useResetAppLocale(),
  };
}

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("dir");
  document.documentElement.removeAttribute("lang");
});

describe("useResetAppLocale", () => {
  it("restores the configured default when the browser prefers Croatian", async () => {
    vi.spyOn(navigator, "languages", "get").mockReturnValue(["hr-HR"]);
    localStorage.setItem(unrelatedStorageKey, "preserved");
    appLocalStorage.set(appLocalStorageKeys.drawerMode, "permanent");
    appLocalStorage.set(appLocalStorageKeys.fontSize, "big");
    const { result } = renderHook(useLocaleUnderTest, {
      wrapper: LocalizationWrapper,
    });

    expect(result.current.localization.locale).toBe("hr");

    act(() => result.current.reset());

    await waitFor(() => {
      expect(result.current.localization.locale).toBe(defaultAppLocale);
      expect(document.documentElement).toHaveAttribute("lang", defaultAppLocale);
    });
    expect(appLocalStorage.get(appLocalStorageKeys.locale)).toBe(defaultAppLocale);
    expect(localStorage.getItem(unrelatedStorageKey)).toBe("preserved");
    expect(appLocalStorage.get(appLocalStorageKeys.drawerMode)).toBe("permanent");
    expect(appLocalStorage.get(appLocalStorageKeys.fontSize)).toBe("big");

    act(() => result.current.reset());

    await waitFor(() => {
      expect(result.current.localization.locale).toBe(defaultAppLocale);
    });
  });

  it("keeps the live reset usable without claiming failed persistence", async () => {
    appLocalStorage.set(appLocalStorageKeys.locale, "hr");
    localStorage.setItem(unrelatedStorageKey, "preserved");
    const { result } = renderHook(useLocaleUnderTest, {
      wrapper: LocalizationWrapper,
    });
    const nativeSetItem = Storage.prototype.setItem;

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
      if (key === appLocalStorageKeys.locale) {
        throw new DOMException("Blocked", "SecurityError");
      }
      nativeSetItem.call(this, key, value);
    });

    act(() => result.current.reset());

    await waitFor(() => {
      expect(result.current.localization.locale).toBe(defaultAppLocale);
      expect(document.documentElement).toHaveAttribute("lang", defaultAppLocale);
    });
    expect(appLocalStorage.get(appLocalStorageKeys.locale)).toBe("hr");
    expect(localStorage.getItem(unrelatedStorageKey)).toBe("preserved");
  });
});
