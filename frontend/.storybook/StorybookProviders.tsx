import { useEffect, useSyncExternalStore, type PropsWithChildren } from "react";
import { useTranslation } from "react-i18next";
import { RgoFeedbackProvider } from "@rgo-web/frontend";

import { noFixedAppSettings, type AppFixedSettings } from "../src/app/bootstrap/config/fixedSettings.js";
import { AppLocalizationProvider } from "../src/app/localization/components/AppLocalizationProvider.js";
import { englishDevelopmentGuideTranslations } from "../docs/storybook/examples/shared/localization/development-guide.en.js";
import { useAppTranslation } from "../src/app/localization/hooks/useAppTranslation.js";
import { AppThemeProvider } from "../src/app/theme/components/AppThemeProvider.js";
import { useStorybookTheme } from "./useStorybookTheme.js";

/** Register the English guide namespace even when Storybook is built statically. */
function GuideResources({ children }: PropsWithChildren) {
  const { i18n } = useTranslation("translation");
  const ready = useSyncExternalStore(
    callback => {
      i18n.store.on("added", callback);
      return () => i18n.store.off("added", callback);
    },
    () =>
      i18n.hasResourceBundle("en", "development-guide") &&
      Boolean(i18n.getResource("en", "translation", "storybook.headerTabs.workspace")),
  );
  useEffect(() => {
    i18n.addResourceBundle("en", "development-guide", englishDevelopmentGuideTranslations);
    i18n.addResourceBundle(
      "en",
      "translation",
      {
        storybook: {
          headerTabs: englishDevelopmentGuideTranslations.headerTabs,
          navigation: englishDevelopmentGuideTranslations.storyNavigation,
        },
      },
      true,
      true,
    );
  }, [i18n]);
  return ready ? children : null;
}

/** Matches application feedback configuration; its key scopes feedback to one story. */
function StorybookFeedbackProvider({ children }: PropsWithChildren) {
  const { t } = useAppTranslation();
  return (
    <RgoFeedbackProvider
      notificationCloseLabel={t("feedback.closeNotification")}
      slotProps={{ confirmationCancelAction: { variant: "text" } }}
    >
      {children}
    </RgoFeedbackProvider>
  );
}

export function StorybookProviders({ children, storyId }: PropsWithChildren<{ storyId: string }>) {
  const { mode } = useStorybookTheme();
  const fixedSettings: AppFixedSettings = {
    ...noFixedAppSettings,
    fontSize: "normal",
    increasedContrast: false,
    linkUnderlines: "always",
    motion: "reduce",
    surfaceBorderRadius: 8,
    theme: mode,
  };
  return (
    <AppLocalizationProvider fixedLocale="en" initialLocale="en">
      <GuideResources>
        <AppThemeProvider fixedSettings={fixedSettings}>
          <StorybookFeedbackProvider key={storyId}>{children}</StorybookFeedbackProvider>
        </AppThemeProvider>
      </GuideResources>
    </AppLocalizationProvider>
  );
}
