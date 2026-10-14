import { afterEach, describe, expect, it, vi } from "vitest";

import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercentage,
  formatTime,
} from "@/app/localization/formatters";

const instant = new Date("2026-09-24T14:30:00Z");

async function loadFreshFormatters() {
  vi.resetModules();
  return import("@/app/localization/formatters");
}

function createNumberConfigurations() {
  return Array.from({ length: 85 }, (_, index) => ({
    minimumFractionDigits: Math.floor(index / 21),
    maximumFractionDigits: index % 21,
  }))
    .filter(({ minimumFractionDigits, maximumFractionDigits }) => minimumFractionDigits <= maximumFractionDigits)
    .slice(0, 65);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("application localization formatters", () => {
  it("formats dates and times with an explicit locale and time zone", () => {
    expect(formatDate("en", instant, "Europe/Zagreb")).toBe("September 24, 2026");
    expect(formatTime("en", instant, "Europe/Zagreb")).toBe("4:30 PM");
    expect(formatDateTime("en", instant, "UTC")).toBe("Sep 24, 2026, 2:30 PM");
    expect(formatDateTime("en", instant, "Europe/Zagreb")).toBe("Sep 24, 2026, 4:30 PM");
    expect(formatDate("en", instant, "UTC", { dateStyle: "short" })).toBe("9/24/26");
  });

  it("uses the active locale conventions for decimal and percentage values", () => {
    expect(formatNumber("en", 1_234_567.89)).toBe("1,234,567.89");
    expect(formatNumber("hr", 1_234_567.89)).toBe("1.234.567,89");
    expect(formatPercentage("en", 0.275, { maximumFractionDigits: 1 })).toBe("27.5%");
    expect(formatPercentage("hr", 0.275, { maximumFractionDigits: 1 })).toContain("27,5");
  });

  it("requires the currency code instead of inferring one from the locale", () => {
    expect(formatCurrency("en", 1_234.56, "EUR")).toBe("€1,234.56");
    expect(formatCurrency("en", 1_234.56, "USD")).toBe("$1,234.56");
  });

  it("reuses equivalent percentage and date-time configurations", async () => {
    const numberConstructor = vi.spyOn(Intl, "NumberFormat");
    const dateTimeConstructor = vi.spyOn(Intl, "DateTimeFormat");
    const formatters = await loadFreshFormatters();

    expect(
      formatters.formatPercentage("en", 0.1234, {
        maximumFractionDigits: 1,
        useGrouping: false,
      }),
    ).toBe("12.3%");
    expect(
      formatters.formatPercentage("en", 0.9876, {
        useGrouping: false,
        maximumFractionDigits: 1,
      }),
    ).toBe("98.8%");
    expect(numberConstructor).toHaveBeenCalledTimes(1);

    expect(
      formatters.formatDateTime("en", instant, "UTC", {
        dateStyle: "short",
        timeStyle: "medium",
      }),
    ).toBe("9/24/26, 2:30:00 PM");
    expect(
      formatters.formatDateTime("en", instant.getTime() + 60_000, "UTC", {
        timeStyle: "medium",
        dateStyle: "short",
      }),
    ).toBe("9/24/26, 2:31:00 PM");
    expect(dateTimeConstructor).toHaveBeenCalledTimes(1);
  });

  it("treats omitted and undefined options as equivalent", async () => {
    const numberConstructor = vi.spyOn(Intl, "NumberFormat");
    const dateTimeConstructor = vi.spyOn(Intl, "DateTimeFormat");
    const formatters = await loadFreshFormatters();

    formatters.formatPercentage("en", 0.1);
    formatters.formatPercentage("en", 0.2, {
      maximumFractionDigits: undefined,
    });
    expect(numberConstructor).toHaveBeenCalledTimes(1);

    formatters.formatDate("en", instant, "UTC");
    formatters.formatDate("en", instant, "UTC", { calendar: undefined });
    expect(dateTimeConstructor).toHaveBeenCalledTimes(1);
  });

  it("constructs a fresh native formatter for every formatNumber call", async () => {
    const numberConstructor = vi.spyOn(Intl, "NumberFormat");
    const formatters = await loadFreshFormatters();

    expect(
      formatters.formatNumber("en", 1234.56, {
        maximumFractionDigits: 1,
        useGrouping: false,
      }),
    ).toBe("1234.6");
    expect(
      formatters.formatNumber("en", 9876.54, {
        useGrouping: false,
        maximumFractionDigits: 1,
      }),
    ).toBe("9876.5");
    expect(numberConstructor).toHaveBeenCalledTimes(2);
  });

  it("keys overridden arguments, locales, and time zones by their effective values", async () => {
    const numberConstructor = vi.spyOn(Intl, "NumberFormat");
    const dateTimeConstructor = vi.spyOn(Intl, "DateTimeFormat");
    const formatters = await loadFreshFormatters();
    const ignoredCurrencyOptions: Intl.NumberFormatOptions = {
      currency: "JPY",
      maximumFractionDigits: 0,
      style: "decimal",
    };

    expect(formatters.formatCurrency("en", 1234.56, "EUR", ignoredCurrencyOptions)).toBe("€1,235");
    expect(formatters.formatCurrency("en", 1234.56, "USD", ignoredCurrencyOptions)).toBe("$1,235");
    formatters.formatCurrency("en", 999.4, "EUR", {
      currency: "CAD",
      maximumFractionDigits: 0,
      style: "percent",
    });
    formatters.formatCurrency("hr", 1234.56, "EUR", ignoredCurrencyOptions);
    expect(numberConstructor).toHaveBeenCalledTimes(3);

    expect(formatters.formatTime("en", instant, "UTC")).toBe("2:30 PM");
    expect(formatters.formatTime("en", instant, "Europe/Zagreb")).toBe("4:30 PM");
    formatters.formatTime("hr", instant, "UTC");
    expect(dateTimeConstructor).toHaveBeenCalledTimes(3);
  });

  it("recomputes keys when an options object is mutated", async () => {
    const numberConstructor = vi.spyOn(Intl, "NumberFormat");
    const dateTimeConstructor = vi.spyOn(Intl, "DateTimeFormat");
    const formatters = await loadFreshFormatters();
    const numberOptions: Intl.NumberFormatOptions = {
      maximumFractionDigits: 1,
    };
    const dateOptions: { dateStyle: "short" | "long" } = {
      dateStyle: "short",
    };

    expect(formatters.formatPercentage("en", 0.0126, numberOptions)).toBe("1.3%");
    numberOptions.maximumFractionDigits = 2;
    expect(formatters.formatPercentage("en", 0.0126, numberOptions)).toBe("1.26%");
    expect(
      formatters.formatPercentage("en", 0.0234, {
        maximumFractionDigits: 2,
      }),
    ).toBe("2.34%");
    expect(numberConstructor).toHaveBeenCalledTimes(2);

    expect(formatters.formatDate("en", instant, "UTC", dateOptions)).toBe("9/24/26");
    dateOptions.dateStyle = "long";
    expect(formatters.formatDate("en", instant, "UTC", dateOptions)).toBe("September 24, 2026");
    expect(dateTimeConstructor).toHaveBeenCalledTimes(2);
  });

  it.each(["en", "hr"] as const)("matches fresh native formatters for the %s locale", locale => {
    const numberCases = [
      {
        actual: formatNumber(locale, 12_345.678, {
          maximumFractionDigits: 2,
          numberingSystem: "latn",
          useGrouping: true,
        }),
        expected: new Intl.NumberFormat(locale, {
          maximumFractionDigits: 2,
          numberingSystem: "latn",
          useGrouping: true,
        }).format(12_345.678),
      },
      {
        actual: formatPercentage(locale, 0.1234, {
          maximumFractionDigits: 2,
        }),
        expected: new Intl.NumberFormat(locale, {
          maximumFractionDigits: 2,
          style: "percent",
        }).format(0.1234),
      },
      ...(["EUR", "USD"] as const).map(currency => ({
        actual: formatCurrency(locale, 1234.56, currency, {
          currencyDisplay: "code" as const,
        }),
        expected: new Intl.NumberFormat(locale, {
          currency,
          currencyDisplay: "code",
          style: "currency",
        }).format(1234.56),
      })),
    ];

    const dateCases = ["UTC", "Europe/Zagreb"].flatMap(timeZone => [
      {
        actual: formatDate(locale, instant, timeZone, { dateStyle: "full" }),
        expected: new Intl.DateTimeFormat(locale, {
          dateStyle: "full",
          timeZone,
        }).format(instant),
      },
      {
        actual: formatTime(locale, instant, timeZone, {
          hourCycle: "h23",
          timeStyle: "medium",
        }),
        expected: new Intl.DateTimeFormat(locale, {
          hourCycle: "h23",
          timeStyle: "medium",
          timeZone,
        }).format(instant),
      },
      {
        actual: formatDateTime(locale, instant, timeZone, {
          dateStyle: "short",
          timeStyle: "long",
        }),
        expected: new Intl.DateTimeFormat(locale, {
          dateStyle: "short",
          timeStyle: "long",
          timeZone,
        }).format(instant),
      },
    ]);

    for (const { actual, expected } of [...numberCases, ...dateCases]) {
      expect(actual).toBe(expected);
    }
  });

  it("preserves native failures without caching failed construction", async () => {
    const numberConstructor = vi.spyOn(Intl, "NumberFormat");
    const dateTimeConstructor = vi.spyOn(Intl, "DateTimeFormat");
    const formatters = await loadFreshFormatters();
    const invalidNumberOptions = {
      maximumFractionDigits: 2,
      minimumFractionDigits: 3,
    };

    expect(() => formatters.formatNumber("en", 1, invalidNumberOptions)).toThrow(RangeError);
    expect(() => formatters.formatNumber("en", 2, invalidNumberOptions)).toThrow(RangeError);
    expect(numberConstructor).toHaveBeenCalledTimes(2);

    expect(() => formatters.formatCurrency("en", 1, "NOT-A-CURRENCY")).toThrow(RangeError);
    expect(() => formatters.formatCurrency("en", 2, "NOT-A-CURRENCY")).toThrow(RangeError);
    expect(numberConstructor).toHaveBeenCalledTimes(4);

    expect(() => formatters.formatDate("en", instant, "Not/A_Time_Zone")).toThrow(RangeError);
    expect(() => formatters.formatDate("en", instant, "Not/A_Time_Zone")).toThrow(RangeError);
    expect(dateTimeConstructor).toHaveBeenCalledTimes(2);

    const invalidDate = new Date(Number.NaN);
    expect(() => formatters.formatDate("en", invalidDate, "UTC")).toThrow(RangeError);
    expect(() => formatters.formatDate("en", invalidDate, "UTC")).toThrow(RangeError);
    expect(dateTimeConstructor).toHaveBeenCalledTimes(3);

    expect(formatters.formatNumber("en", 1.25, { maximumFractionDigits: 1 })).toBe("1.3");
    expect(formatters.formatDate("en", instant, "UTC")).toBe("September 24, 2026");
  });

  it("preserves accessor and inherited option semantics", async () => {
    const numberConstructor = vi.spyOn(Intl, "NumberFormat");
    const dateTimeConstructor = vi.spyOn(Intl, "DateTimeFormat");
    const formatters = await loadFreshFormatters();
    let numberReads = 0;
    let dateReads = 0;
    const accessorNumberOptions = Object.defineProperty({}, "useGrouping", {
      enumerable: true,
      get() {
        numberReads += 1;
        return false;
      },
    }) as Intl.NumberFormatOptions;
    const accessorDateOptions = Object.defineProperty({}, "dateStyle", {
      enumerable: true,
      get() {
        dateReads += 1;
        return "short";
      },
    }) as { dateStyle: "short" };

    expect(formatters.formatNumber("en", 1234, accessorNumberOptions)).toBe("1234");
    expect(formatters.formatNumber("en", 5678, accessorNumberOptions)).toBe("5678");
    expect(numberReads).toBe(2);
    expect(numberConstructor).toHaveBeenCalledTimes(2);

    expect(formatters.formatDate("en", instant, "UTC", accessorDateOptions)).toBe("9/24/26");
    expect(formatters.formatDate("en", instant, "UTC", accessorDateOptions)).toBe("9/24/26");
    expect(dateReads).toBe(4);
    expect(dateTimeConstructor).toHaveBeenCalledTimes(1);

    const inheritedOptions = Object.create({
      maximumFractionDigits: 1,
    }) as Intl.NumberFormatOptions;
    expect(formatters.formatNumber("en", 1.26, inheritedOptions)).toBe("1.3");
    expect(formatters.formatNumber("en", 1.26, inheritedOptions)).toBe("1.3");
    expect(numberConstructor).toHaveBeenCalledTimes(4);
  });

  it("uses the uncached path for symbol and non-primitive option values", async () => {
    const numberConstructor = vi.spyOn(Intl, "NumberFormat");
    const formatters = await loadFreshFormatters();
    const marker = Symbol("ignored option");
    const symbolOptions = {
      maximumFractionDigits: 1,
      [marker]: "ignored",
    } as Intl.NumberFormatOptions;
    let coercions = 0;
    const nonPrimitiveOptions = {
      maximumFractionDigits: {
        valueOf() {
          coercions += 1;
          return 1;
        },
      },
    } as unknown as Intl.NumberFormatOptions;

    expect(formatters.formatPercentage("en", 0.0126, symbolOptions)).toBe("1.3%");
    expect(formatters.formatPercentage("en", 0.0234, symbolOptions)).toBe("2.3%");
    expect(numberConstructor).toHaveBeenCalledTimes(2);

    expect(formatters.formatPercentage("en", 0.0126, nonPrimitiveOptions)).toBe("1.3%");
    expect(formatters.formatPercentage("en", 0.0234, nonPrimitiveOptions)).toBe("2.3%");
    expect(coercions).toBe(2);
    expect(numberConstructor).toHaveBeenCalledTimes(4);
  });

  it("disables both caches when Object.prototype owns an Intl option", async () => {
    const numberConstructor = vi.spyOn(Intl, "NumberFormat");
    const dateTimeConstructor = vi.spyOn(Intl, "DateTimeFormat");
    const formatters = await loadFreshFormatters();
    const originalDescriptor = Object.getOwnPropertyDescriptor(Object.prototype, "numberingSystem");

    Object.defineProperty(Object.prototype, "numberingSystem", {
      configurable: true,
      value: "latn",
    });
    try {
      formatters.formatPercentage("en", 0.123);
      formatters.formatPercentage("en", 0.456);
      formatters.formatDate("en", instant, "UTC");
      formatters.formatDate("en", instant, "UTC");
      expect(numberConstructor).toHaveBeenCalledTimes(2);
      expect(dateTimeConstructor).toHaveBeenCalledTimes(2);
    } finally {
      if (originalDescriptor === undefined) {
        Reflect.deleteProperty(Object.prototype, "numberingSystem");
      } else {
        Object.defineProperty(Object.prototype, "numberingSystem", originalDescriptor);
      }
    }
  });

  it("preserves changing Proxy Get semantics in formatNumber", async () => {
    const numberConstructor = vi.spyOn(Intl, "NumberFormat");
    const formatters = await loadFreshFormatters();
    let maximumFractionDigits = 1;
    let optionReads = 0;
    const options = new Proxy(
      { maximumFractionDigits },
      {
        get(target, property, receiver) {
          if (property === "maximumFractionDigits") {
            optionReads += 1;
            return maximumFractionDigits;
          }
          return Reflect.get(target, property, receiver);
        },
      },
    );

    expect(formatters.formatNumber("en", 1.26, options)).toBe("1.3");
    maximumFractionDigits = 2;
    expect(formatters.formatNumber("en", 1.26, options)).toBe("1.26");
    expect(optionReads).toBe(2);
    expect(numberConstructor).toHaveBeenCalledTimes(2);
  });

  it("does not invoke Proxy meta-traps before native formatNumber", async () => {
    const NativeNumberFormat = Intl.NumberFormat;
    const metaTrapCalls = {
      getOwnPropertyDescriptor: 0,
      getPrototypeOf: 0,
      ownKeys: 0,
    };
    const options = [
      new Proxy(
        { maximumFractionDigits: 1 },
        {
          getPrototypeOf() {
            metaTrapCalls.getPrototypeOf += 1;
            throw new Error("getPrototypeOf should not affect Intl");
          },
        },
      ),
      new Proxy(
        { maximumFractionDigits: 1 },
        {
          ownKeys() {
            metaTrapCalls.ownKeys += 1;
            throw new Error("ownKeys should not affect Intl");
          },
        },
      ),
      new Proxy(
        { maximumFractionDigits: 1 },
        {
          getOwnPropertyDescriptor() {
            metaTrapCalls.getOwnPropertyDescriptor += 1;
            throw new Error("getOwnPropertyDescriptor should not affect Intl");
          },
        },
      ),
    ];
    const expected = options.map(value => new NativeNumberFormat("en", value).format(1.26));
    const numberConstructor = vi.spyOn(Intl, "NumberFormat");
    const formatters = await loadFreshFormatters();

    for (const [index, value] of options.entries()) {
      expect(formatters.formatNumber("en", 1.26, value)).toBe(expected[index]);
      expect(formatters.formatNumber("en", 1.26, value)).toBe(expected[index]);
    }
    expect(metaTrapCalls).toEqual({
      getOwnPropertyDescriptor: 0,
      getPrototypeOf: 0,
      ownKeys: 0,
    });
    expect(numberConstructor).toHaveBeenCalledTimes(6);

    const nativeReadError = new Error("native option read failed");
    const nativeErrorOptions = new Proxy(
      {},
      {
        get() {
          throw nativeReadError;
        },
      },
    );
    expect(() => formatters.formatNumber("en", 1.26, nativeErrorOptions)).toThrow(nativeReadError);
    expect(numberConstructor).toHaveBeenCalledTimes(7);
  });

  it("does not evict live entries when construction fails at capacity", async () => {
    const numberConstructor = vi.spyOn(Intl, "NumberFormat");
    const dateTimeConstructor = vi.spyOn(Intl, "DateTimeFormat");
    const formatters = await loadFreshFormatters();
    const numberConfigurations = createNumberConfigurations();
    const timeZones = Intl.supportedValuesOf("timeZone").slice(0, 64);
    let firstNumberOutput = "";
    let firstDateOutput = "";

    for (const [index, options] of numberConfigurations.slice(0, 64).entries()) {
      const output = formatters.formatCurrency("en", 1.2345, "EUR", options);
      if (index === 0) firstNumberOutput = output;
    }
    expect(numberConstructor).toHaveBeenCalledTimes(64);
    expect(() => formatters.formatCurrency("en", 1, "NOT-A-CURRENCY")).toThrow(RangeError);
    expect(numberConstructor).toHaveBeenCalledTimes(65);
    expect(formatters.formatCurrency("en", 1.2345, "EUR", numberConfigurations[0])).toBe(firstNumberOutput);
    expect(numberConstructor).toHaveBeenCalledTimes(65);

    for (const [index, timeZone] of timeZones.entries()) {
      const output = formatters.formatDate("en", instant, timeZone);
      if (index === 0) firstDateOutput = output;
    }
    expect(dateTimeConstructor).toHaveBeenCalledTimes(64);
    expect(() => formatters.formatDate("en", instant, "Not/A_Time_Zone")).toThrow(RangeError);
    expect(dateTimeConstructor).toHaveBeenCalledTimes(65);
    expect(formatters.formatDate("en", instant, timeZones[0])).toBe(firstDateOutput);
    expect(dateTimeConstructor).toHaveBeenCalledTimes(65);
  });

  it("bounds the independent formatter caches with least-recently-used eviction", async () => {
    const numberConstructor = vi.spyOn(Intl, "NumberFormat");
    const dateTimeConstructor = vi.spyOn(Intl, "DateTimeFormat");
    const formatters = await loadFreshFormatters();
    const numberConfigurations = createNumberConfigurations();
    const timeZones = Intl.supportedValuesOf("timeZone").slice(0, 65);
    const numberOutputs: string[] = [];
    const dateOutputs: string[] = [];

    expect(numberConfigurations).toHaveLength(65);
    expect(timeZones).toHaveLength(65);

    for (const options of numberConfigurations.slice(0, 64)) {
      numberOutputs.push(formatters.formatCurrency("en", 1.2345, "EUR", options));
    }
    expect(numberConstructor).toHaveBeenCalledTimes(64);

    formatters.formatCurrency("en", 2.3456, "EUR", numberConfigurations[0]);
    formatters.formatCurrency("en", 3.4567, "EUR", numberConfigurations[64]);
    expect(numberConstructor).toHaveBeenCalledTimes(65);
    formatters.formatCurrency("en", 4.5678, "EUR", numberConfigurations[0]);
    expect(numberConstructor).toHaveBeenCalledTimes(65);
    expect(formatters.formatCurrency("en", 1.2345, "EUR", numberConfigurations[1])).toBe(numberOutputs[1]);
    expect(numberConstructor).toHaveBeenCalledTimes(66);

    dateOutputs.push(formatters.formatDate("en", instant, timeZones[0]));
    expect(dateTimeConstructor).toHaveBeenCalledTimes(1);
    formatters.formatCurrency("en", 6.789, "EUR", numberConfigurations[64]);
    expect(numberConstructor).toHaveBeenCalledTimes(66);

    for (const timeZone of timeZones.slice(1, 64)) {
      dateOutputs.push(formatters.formatDate("en", instant, timeZone));
    }
    expect(dateTimeConstructor).toHaveBeenCalledTimes(64);
    formatters.formatDate("en", instant, timeZones[0]);
    formatters.formatDate("en", instant, timeZones[64]);
    expect(dateTimeConstructor).toHaveBeenCalledTimes(65);
    formatters.formatDate("en", instant, timeZones[0]);
    expect(dateTimeConstructor).toHaveBeenCalledTimes(65);
    expect(formatters.formatDate("en", instant, timeZones[1])).toBe(dateOutputs[1]);
    expect(dateTimeConstructor).toHaveBeenCalledTimes(66);
  });
});
