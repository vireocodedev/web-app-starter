import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { AppPageNavigation, type AppPageNavigationLink } from "@/app/shell/components/AppPageNavigation";

/** Settings supplies its own labels while sharing the page-navigation lifecycle. */
export function SettingsPageNavigation({
  container,
  links,
}: Readonly<{ container: HTMLElement | null; links: readonly AppPageNavigationLink[] }>) {
  const { t } = useAppTranslation();

  return (
    <AppPageNavigation
      container={container}
      dataScope="settings"
      labels={{
        navigation: t("navigation.settings"),
        pages: t("settings.pages"),
        choosePage: page => t("settings.choosePage", { page }),
        close: t("settings.closePages"),
      }}
      links={links}
    />
  );
}
