import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { AppLocalizationContext } from "@/app/localization/contexts/AppLocalizationContext";
import { useAppLocalizationFormatters } from "@/app/localization/hooks/useAppLocalizationFormatters";
import { defaultAppTimeZone, type AppLocale } from "@/app/localization/localeConfig";

function renderFormatters(initialLocale: AppLocale = "en") {
  let locale = initialLocale;
  const view = renderHook(() => useAppLocalizationFormatters(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <AppLocalizationContext.Provider value={{ direction: "ltr", locale, setLocale: () => undefined }}>
        {children}
      </AppLocalizationContext.Provider>
    ),
  });
  return {
    ...view,
    changeLocale(nextLocale: AppLocale) {
      locale = nextLocale;
      view.rerender();
    },
  };
}

const instant = new Date("2026-09-24T14:30:00Z");

describe("useAppLocalizationFormatters", () => {
  it("binds all six methods to the active locale and the application time zone", () => {
    const { result } = renderFormatters();
    expect(defaultAppTimeZone).toBe("Europe/Zagreb");
    expect(result.current.formatCurrency(1234.56, "EUR")).toBe("€1,234.56");
    expect(result.current.formatCurrency(1234.56, "USD")).toBe("$1,234.56");
    expect(result.current.formatNumber(1234.56)).toBe("1,234.56");
    expect(result.current.formatPercentage(0.275, { maximumFractionDigits: 1 })).toBe("27.5%");
    expect(result.current.formatDate(instant)).toBe("September 24, 2026");
    expect(result.current.formatTime(instant)).toBe("4:30 PM");
    expect(result.current.formatDateTime(instant)).toBe("Sep 24, 2026, 4:30 PM");
  });

  it("preserves formatting options and supports per-call time-zone overrides", () => {
    const { result } = renderFormatters();
    expect(
      result.current.formatNumber(1234.56, {
        useGrouping: false,
        maximumFractionDigits: 1,
      }),
    ).toBe("1234.6");
    expect(
      result.current.formatCurrency(1234.56, "EUR", {
        currencyDisplay: "code",
        maximumFractionDigits: 0,
      }),
    ).toMatch(/EUR\s1,235/);
    expect(
      result.current.formatDate(instant, {
        dateStyle: "short",
        timeZone: "UTC",
      }),
    ).toBe("9/24/26");
    expect(
      result.current.formatTime(instant, {
        hourCycle: "h23",
        timeStyle: "medium",
        timeZone: "America/New_York",
      }),
    ).toBe("10:30:00");
    expect(
      result.current.formatDateTime(instant, {
        dateStyle: "short",
        timeStyle: "medium",
        hour12: false,
        timeZone: "UTC",
      }),
    ).toBe("9/24/26, 14:30:00");
    expect(result.current.formatDate(new Date("2026-09-24T22:30:00Z"))).toBe("September 25, 2026");
    expect(
      result.current.formatDate(new Date("2026-09-24T22:30:00Z"), {
        timeZone: "UTC",
      }),
    ).toBe("September 24, 2026");
  });

  it("uses the configured zone across daylight-saving transitions", () => {
    const { result } = renderFormatters();
    expect(
      result.current.formatTime(Date.parse("2026-03-29T00:30:00Z"), {
        hourCycle: "h23",
      }),
    ).toBe("01:30");
    expect(
      result.current.formatTime(Date.parse("2026-03-29T01:30:00Z"), {
        hourCycle: "h23",
      }),
    ).toBe("03:30");
    expect(
      result.current.formatTime(Date.parse("2026-10-25T00:30:00Z"), {
        hourCycle: "h23",
      }),
    ).toBe("02:30");
    expect(
      result.current.formatTime(Date.parse("2026-10-25T01:30:00Z"), {
        hourCycle: "h23",
      }),
    ).toBe("02:30");
  });

  it("keeps each helper stable until the locale changes and then updates every method", () => {
    const view = renderFormatters();
    const english = view.result.current;
    view.rerender();
    expect(view.result.current).toBe(english);
    for (const key of Object.keys(english) as (keyof typeof english)[]) {
      expect(view.result.current[key]).toBe(english[key]);
    }

    view.changeLocale("hr");
    const croatian = view.result.current;
    for (const key of Object.keys(english) as (keyof typeof english)[]) {
      expect(croatian[key]).not.toBe(english[key]);
    }
    expect(croatian.formatNumber(1234.56)).toBe("1.234,56");
    expect(croatian.formatCurrency(1234.56, "EUR")).toContain("1.234,56");
    expect(croatian.formatPercentage(0.275, { maximumFractionDigits: 1 })).toContain("27,5");
    expect(croatian.formatDate(instant)).not.toBe(english.formatDate(instant));
    expect(croatian.formatTime(instant)).toBe("16:30");
    expect(croatian.formatDateTime(instant)).not.toBe(english.formatDateTime(instant));
    view.rerender();
    expect(view.result.current).toBe(croatian);

    view.changeLocale("en");
    const englishAgain = view.result.current;
    expect(englishAgain).not.toBe(croatian);
    expect(englishAgain.formatNumber(1234.56)).toBe("1,234.56");
    expect(englishAgain.formatCurrency(1234.56, "EUR")).toBe("€1,234.56");
    expect(englishAgain.formatTime(instant)).toBe("4:30 PM");
  });
});
