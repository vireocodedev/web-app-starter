import type { SvgIconComponent } from "@mui/icons-material";
import type { ParseKeys } from "i18next";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { AppCategoryList, type AppCategoryListEntry } from "@/app/shell/components/AppCategoryList";

type PatternCategory = Readonly<{
  id: string;
  Icon: SvgIconComponent;
  labelKey: ParseKeys<"development-guide">;
  to: string;
}>;

export function PatternsIndexPage({ categories }: Readonly<{ categories: readonly PatternCategory[] }>) {
  const { t } = useDevelopmentGuideTranslation();
  const items = categories.map(category => ({
    id: category.id,
    Icon: category.Icon,
    label: t(category.labelKey),
    to: category.to,
  }));
  const stateCategoryIds = new Set(["applicationState", "serverData", "routingAndUrlState"]);
  const stateItems = items.filter(item => stateCategoryIds.has(item.id));
  const entries = items.flatMap<AppCategoryListEntry>(item => {
    if (!stateCategoryIds.has(item.id)) return [item];
    return item === stateItems[0]
      ? [{ id: "application-state", label: t("navigation.stateCategory"), items: stateItems }]
      : [];
  });

  return (
    <AppCategoryList
      title={t("navigation.examples")}
      description={t("patternCategories.description")}
      navigationLabel={t("patternCategories.navigationLabel")}
      items={entries}
    />
  );
}
