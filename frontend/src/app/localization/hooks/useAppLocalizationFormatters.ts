import { useMemo } from "react";

import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercentage,
  formatTime,
  type AppDateFormatOptions,
  type AppDateTimeFormatOptions,
  type AppTimeFormatOptions,
} from "../formatters";
import { defaultAppTimeZone } from "../localeConfig";
import { useAppLocalization } from "./useAppLocalization";

type WithTimeZone<Options> = Options & Readonly<{ timeZone?: string }>;

/** Binds formatting to the active locale and the application's default time zone. */
export function useAppLocalizationFormatters() {
  const { locale } = useAppLocalization();

  return useMemo(
    () => ({
      formatCurrency: (value: number, currency: string, options: Intl.NumberFormatOptions = {}) =>
        formatCurrency(locale, value, currency, options),
      formatNumber: (value: number, options: Intl.NumberFormatOptions = {}) => formatNumber(locale, value, options),
      formatPercentage: (value: number, options: Intl.NumberFormatOptions = {}) =>
        formatPercentage(locale, value, options),
      formatDate: (
        value: Date | number,
        { timeZone = defaultAppTimeZone, ...options }: WithTimeZone<AppDateFormatOptions> = {},
      ) => formatDate(locale, value, timeZone, options),
      formatTime: (
        value: Date | number,
        { timeZone = defaultAppTimeZone, ...options }: WithTimeZone<AppTimeFormatOptions> = {},
      ) => formatTime(locale, value, timeZone, options),
      formatDateTime: (
        value: Date | number,
        { timeZone = defaultAppTimeZone, ...options }: WithTimeZone<AppDateTimeFormatOptions> = {},
      ) => formatDateTime(locale, value, timeZone, options),
    }),
    [locale],
  );
}
