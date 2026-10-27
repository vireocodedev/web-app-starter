import { Alert, Box, Paper, Stack, TextField, Typography } from "@mui/material";
import { useState, type ReactNode } from "react";

import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatPercentage,
  formatTime,
} from "@/app/localization/formatters";
import { useDevelopmentGuideTranslation } from "../../examples/shared/localization/useDevelopmentGuideTranslation";
import { isAppLocale, type AppLocale } from "@/app/localization/localeConfig";

export type LocalizationAndFormattingExampleProps = Readonly<{
  scenario: "formatting" | "messages" | "time-zones";
}>;

const instant = new Date("2026-01-15T23:30:00.000Z");
const zones = ["Europe/Zagreb", "UTC", "America/New_York"] as const;

function Result({ children, label, name }: Readonly<{ children: ReactNode; label: string; name: string }>) {
  return (
    <>
      <Typography component="dt" color="text.secondary">
        {label}
      </Typography>
      <Typography component="dd" data-testid={name} sx={{ m: 0, overflowWrap: "anywhere" }}>
        {children}
      </Typography>
    </>
  );
}

/** Uses installed formatters; its local controls never change the application's language/preferences. */
export function LocalizationAndFormattingExample({ scenario }: LocalizationAndFormattingExampleProps) {
  const [locale, setLocale] = useState<AppLocale>("en");
  const [currency, setCurrency] = useState("EUR");
  const [timeZone, setTimeZone] = useState<string>("Europe/Zagreb");
  const [name, setName] = useState("Alex");
  const [count, setCount] = useState(1);
  const { t } = useDevelopmentGuideTranslation();

  return (
    <Box component="main" sx={{ mx: "auto", maxWidth: "md", p: { xs: 2, sm: 3 } }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography component="h1" variant="h4">
            Localization and formatting
          </Typography>
          <Typography color="text.secondary">
            Keep stable values in your draft; derive messages and display formats from the owning locale.
          </Typography>
        </Stack>
        <Alert severity="info">
          Controls and messages stay English. Formatting locale changes only this preview's formatted values; it does
          not change Storybook's language or save an application preference.
        </Alert>
        <Paper sx={{ p: { xs: 2, sm: 3 } }} variant="outlined">
          <Stack spacing={2.5}>
            <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
              <TextField
                label="Formatting locale"
                onChange={event => {
                  if (isAppLocale(event.target.value)) setLocale(event.target.value);
                }}
                select
                slotProps={{ select: { native: true } }}
                value={locale}
              >
                <option value="en">English (en)</option>
                <option value="hr">Croatian (hr)</option>
              </TextField>
              <TextField label="Draft name" onChange={event => setName(event.target.value)} value={name} />
              {scenario !== "messages" && (
                <>
                  <TextField
                    label="Currency"
                    onChange={event => setCurrency(event.target.value)}
                    select
                    slotProps={{ select: { native: true } }}
                    value={currency}
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </TextField>
                  <TextField
                    label="Time zone"
                    onChange={event => setTimeZone(event.target.value)}
                    select
                    slotProps={{ select: { native: true } }}
                    value={timeZone}
                  >
                    {zones.map(zone => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </TextField>
                </>
              )}
              {scenario === "messages" && (
                <TextField
                  label="Item count"
                  onChange={event => setCount(Number(event.target.value))}
                  select
                  slotProps={{ select: { native: true } }}
                  value={count}
                >
                  {[0, 1, 2, 5, 21].map(value => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </TextField>
              )}
            </Box>
            <Box component="section" aria-label="Preview results">
              <Typography component="h2" sx={{ mb: 2 }} variant="h6">
                {scenario === "messages"
                  ? "Interpolation and plurals"
                  : scenario === "time-zones"
                    ? "One instant, explicit time zones"
                    : "Formatting results"}
              </Typography>
              <Box
                component="dl"
                sx={{
                  display: "grid",
                  gap: 1.5,
                  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.5fr)",
                  m: 0,
                }}
              >
                {scenario === "messages" ? (
                  <>
                    <Result label="English greeting" name="interpolated-message">
                      {t("localizationExamples.interpolation.named.message", { name })}
                    </Result>
                    <Result label="English selection" name="plural-message">
                      {t("localizationExamples.interpolation.plural.message", { count })}
                    </Result>
                    <Result label="Formatting locale's plural category" name="plural-category">
                      {new Intl.PluralRules(locale).select(count)}
                    </Result>
                  </>
                ) : (
                  <>
                    {scenario === "formatting" && (
                      <>
                        <Result label="Number: 12345.67" name="formatted-number">
                          {formatNumber(locale, 12345.67, { maximumFractionDigits: 2 })}
                        </Result>
                        <Result label="Ratio: 0.725" name="formatted-percentage">
                          {formatPercentage(locale, 0.725, { maximumFractionDigits: 1 })}
                        </Result>
                        <Result label="Amount: 1450.5" name="formatted-currency">
                          {formatCurrency(locale, 1450.5, currency)}
                        </Result>
                      </>
                    )}
                    <Result label="Date" name="formatted-date">
                      {formatDate(locale, instant, timeZone, { dateStyle: "short" })}
                    </Result>
                    <Result label="Time" name="formatted-time">
                      {formatTime(locale, instant, timeZone, { hourCycle: "h23" })}
                    </Result>
                    <Result label="Date and time" name="formatted-date-time">
                      {formatDateTime(locale, instant, timeZone, { dateStyle: "short", hourCycle: "h23" })}
                    </Result>
                    {scenario === "time-zones" && (
                      <Result label="Same instant in UTC" name="formatted-utc">
                        {formatDateTime(locale, instant, "UTC", { dateStyle: "short", hourCycle: "h23" })}
                      </Result>
                    )}
                  </>
                )}
              </Box>
            </Box>
            <Typography color="text.secondary" variant="body2">
              {scenario === "messages"
                ? "English i18next messages use named values and numeric count. The separate category shows why another language may require a few form; it does not switch these English messages."
                : `Raw instant: ${instant.toISOString()}. Currency and time zone are explicit domain inputs, independent of language.`}
            </Typography>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
