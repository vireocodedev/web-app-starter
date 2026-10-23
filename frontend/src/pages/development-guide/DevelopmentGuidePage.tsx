import type { SvgIconComponent } from "@mui/icons-material";
import type { ParseKeys } from "i18next";

import { AppCategoryList } from "@/app/shell/components/AppCategoryList";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

/** Category entry point for the development-only guide. */
export function DevelopmentGuidePage({
  categories,
}: Readonly<{
  categories: readonly Readonly<{
    id: string;
    Icon: SvgIconComponent;
    titleKey: ParseKeys<"development-guide">;
    descriptionKey: ParseKeys<"development-guide">;
    to: string;
  }>[];
}>) {
  const { t } = useDevelopmentGuideTranslation();

  return (
    <AppCategoryList
      title={t("categories.title")}
      description={t("categories.description")}
      navigationLabel={t("categories.navigationLabel")}
      items={categories.map(category => ({
        id: category.id,
        Icon: category.Icon,
        label: t(category.titleKey),
        description: t(category.descriptionKey),
        to: category.to,
      }))}
    />
  );
}
