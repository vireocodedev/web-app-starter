import type { AppLocale } from "./localeConfig";

const formatterCacheCapacity = 64;

const numberOptionNames = new Set([
  "compactDisplay",
  "currency",
  "currencyDisplay",
  "currencySign",
  "localeMatcher",
  "maximumFractionDigits",
  "maximumSignificantDigits",
  "minimumFractionDigits",
  "minimumIntegerDigits",
  "minimumSignificantDigits",
  "notation",
  "numberingSystem",
  "roundingIncrement",
  "roundingMode",
  "roundingPriority",
  "signDisplay",
  "style",
  "trailingZeroDisplay",
  "unit",
  "unitDisplay",
  "useGrouping",
]);

const dateTimeOptionNames = new Set([
  "calendar",
  "dateStyle",
  "day",
  "dayPeriod",
  "era",
  "formatMatcher",
  "fractionalSecondDigits",
  "hour",
  "hour12",
  "hourCycle",
  "localeMatcher",
  "minute",
  "month",
  "numberingSystem",
  "second",
  "timeStyle",
  "timeZone",
  "timeZoneName",
  "weekday",
  "year",
]);

const numberFormatters = new Map<string, Intl.NumberFormat>();
const dateTimeFormatters = new Map<string, Intl.DateTimeFormat>();

function serializeOptionValue(value: unknown): string | undefined {
  if (value === null) return "null";

  switch (typeof value) {
    case "boolean":
      return value ? "boolean:true" : "boolean:false";
    case "number":
      if (Number.isNaN(value)) return "number:NaN";
      if (Object.is(value, -0)) return "number:-0";
      return `number:${String(value)}`;
    case "string":
      return `string:${JSON.stringify(value)}`;
    default:
      return undefined;
  }
}

function hasPollutedIntlPrototype(optionNames: ReadonlySet<string>): boolean {
  for (const optionName of optionNames) {
    if (Object.getOwnPropertyDescriptor(Object.prototype, optionName)) {
      return true;
    }
  }
  return false;
}

function createOptionsKey(locale: AppLocale, options: object, optionNames: ReadonlySet<string>): string | undefined {
  try {
    if (hasPollutedIntlPrototype(optionNames)) return undefined;

    const keys = Reflect.ownKeys(options);
    if (keys.some(key => typeof key === "symbol")) return undefined;

    const entries: string[] = [];
    for (const name of (keys as string[]).sort()) {
      const descriptor = Object.getOwnPropertyDescriptor(options, name);
      if (descriptor === undefined || !("value" in descriptor)) return undefined;
      if (descriptor.value === undefined) continue;

      const serializedValue = serializeOptionValue(descriptor.value);
      if (serializedValue === undefined) return undefined;
      entries.push(`${JSON.stringify(name)}=${serializedValue}`);
    }

    return JSON.stringify([locale, entries]);
  } catch {
    return undefined;
  }
}

function getCachedFormatter<Formatter>(cache: Map<string, Formatter>, key: string): Formatter | undefined {
  const formatter = cache.get(key);
  if (formatter === undefined) return undefined;

  cache.delete(key);
  cache.set(key, formatter);
  return formatter;
}

function insertFormatter<Formatter>(cache: Map<string, Formatter>, key: string, formatter: Formatter): Formatter {
  cache.set(key, formatter);
  if (cache.size > formatterCacheCapacity) {
    const leastRecentlyUsedKey = cache.keys().next().value;
    if (leastRecentlyUsedKey !== undefined) cache.delete(leastRecentlyUsedKey);
  }
  return formatter;
}

function getNumberFormatter(locale: AppLocale, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  const key = createOptionsKey(locale, options, numberOptionNames);
  if (key === undefined) return new Intl.NumberFormat(locale, options);

  const cachedFormatter = getCachedFormatter(numberFormatters, key);
  if (cachedFormatter !== undefined) return cachedFormatter;

  const formatter = new Intl.NumberFormat(locale, options);
  return insertFormatter(numberFormatters, key, formatter);
}

function getDateTimeFormatter(locale: AppLocale, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = createOptionsKey(locale, options, dateTimeOptionNames);
  if (key === undefined) return new Intl.DateTimeFormat(locale, options);

  const cachedFormatter = getCachedFormatter(dateTimeFormatters, key);
  if (cachedFormatter !== undefined) return cachedFormatter;

  const formatter = new Intl.DateTimeFormat(locale, options);
  return insertFormatter(dateTimeFormatters, key, formatter);
}

export type AppDateFormatOptions = Pick<
  Intl.DateTimeFormatOptions,
  "calendar" | "dateStyle" | "localeMatcher" | "numberingSystem"
>;

export type AppTimeFormatOptions = Pick<
  Intl.DateTimeFormatOptions,
  "hour12" | "hourCycle" | "localeMatcher" | "numberingSystem" | "timeStyle"
>;

export type AppDateTimeFormatOptions = AppDateFormatOptions & AppTimeFormatOptions;

/** Formats a calendar date in an explicit time zone. */
export function formatDate(
  locale: AppLocale,
  value: Date | number,
  timeZone: string,
  options: AppDateFormatOptions = {},
): string {
  const effectiveOptions: Intl.DateTimeFormatOptions = {
    ...options,
    dateStyle: options.dateStyle ?? "long",
    timeZone,
  };
  return getDateTimeFormatter(locale, effectiveOptions).format(value);
}

/** Formats a clock time in an explicit time zone. */
export function formatTime(
  locale: AppLocale,
  value: Date | number,
  timeZone: string,
  options: AppTimeFormatOptions = {},
): string {
  const effectiveOptions: Intl.DateTimeFormatOptions = {
    ...options,
    timeStyle: options.timeStyle ?? "short",
    timeZone,
  };
  return getDateTimeFormatter(locale, effectiveOptions).format(value);
}

/** Formats a date and time in an explicit time zone. */
export function formatDateTime(
  locale: AppLocale,
  value: Date | number,
  timeZone: string,
  options: AppDateTimeFormatOptions = {},
): string {
  const effectiveOptions: Intl.DateTimeFormatOptions = {
    ...options,
    dateStyle: options.dateStyle ?? "medium",
    timeStyle: options.timeStyle ?? "short",
    timeZone,
  };
  return getDateTimeFormatter(locale, effectiveOptions).format(value);
}

export function formatNumber(locale: AppLocale, value: number, options: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatPercentage(locale: AppLocale, value: number, options: Intl.NumberFormatOptions = {}): string {
  const effectiveOptions: Intl.NumberFormatOptions = {
    ...options,
    style: "percent",
  };
  return getNumberFormatter(locale, effectiveOptions).format(value);
}

export function formatCurrency(
  locale: AppLocale,
  value: number,
  currency: string,
  options: Intl.NumberFormatOptions = {},
): string {
  const effectiveOptions: Intl.NumberFormatOptions = {
    ...options,
    currency,
    style: "currency",
  };
  return getNumberFormatter(locale, effectiveOptions).format(value);
}
