import { QueryClientProvider } from "@tanstack/react-query";
import { RgoFeedbackProvider } from "@rgo-web/frontend";
import { useMemo, type PropsWithChildren } from "react";

import { AppAuthProvider } from "@/app/auth/components/AppAuthProvider";
import { AppFixedSettingsProvider } from "@/app/bootstrap/config/AppFixedSettingsProvider";
import { useAppFixedSettings } from "@/app/bootstrap/config/useAppFixedSettings";
import { muiLocaleOptions } from "@/app/localization/localeSetup";
import { AppLocalizationProvider } from "@/app/localization/components/AppLocalizationProvider";
import { useAppLocalization } from "@/app/localization/hooks/useAppLocalization";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { resolveInitialLocale } from "@/app/localization/preferences/localePreference";
import { AppThemeProvider } from "@/app/theme/components/AppThemeProvider";

import { AppRuntimeProvider } from "./AppRuntimeProvider";
import type { AppRuntime } from "./createAppRuntime";

function LocalizedThemeProvider({ children }: PropsWithChildren) {
  const { direction, locale } = useAppLocalization();
  const fixedSettings = useAppFixedSettings();
  const localeOptions = useMemo(() => muiLocaleOptions[locale], [locale]);

  return (
    <AppThemeProvider direction={direction} fixedSettings={fixedSettings} localeOptions={localeOptions}>
      {children}
    </AppThemeProvider>
  );
}

function ConfiguredAppProviders({ children, runtime }: PropsWithChildren<{ runtime: AppRuntime }>) {
  const fixedSettings = useAppFixedSettings();

  return (
    <AppLocalizationProvider fixedLocale={fixedSettings.locale} initialLocale={resolveInitialLocale()}>
      <LocalizedThemeProvider>
        <LocalizedFeedbackProvider>
          <AppRuntimeProvider runtime={runtime}>
            <QueryClientProvider client={runtime.queryClient}>
              <AppAuthProvider runtime={runtime.auth}>{children}</AppAuthProvider>
            </QueryClientProvider>
          </AppRuntimeProvider>
        </LocalizedFeedbackProvider>
      </LocalizedThemeProvider>
    </AppLocalizationProvider>
  );
}

function LocalizedFeedbackProvider({ children }: PropsWithChildren) {
  const { t } = useAppTranslation();

  return (
    <RgoFeedbackProvider
      notificationCloseLabel={t("feedback.closeNotification")}
      slotProps={{
        confirmationCancelAction: {
          variant: "text",
        },
      }}
    >
      {children}
    </RgoFeedbackProvider>
  );
}

/** Installs the one ordered application-wide provider tree. */
export function AppProviders({ children, runtime }: PropsWithChildren<{ runtime: AppRuntime }>) {
  return (
    <AppFixedSettingsProvider fixedSettings={runtime.fixedSettings}>
      <ConfiguredAppProviders runtime={runtime}>{children}</ConfiguredAppProviders>
    </AppFixedSettingsProvider>
  );
}
