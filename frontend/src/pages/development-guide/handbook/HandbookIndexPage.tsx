import type { SvgIconComponent } from "@mui/icons-material";
import type { ParseKeys } from "i18next";

import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { AppCategoryList } from "@/app/shell/components/AppCategoryList";

export type HandbookIndexEntry = Readonly<{
  id: string;
  Icon: SvgIconComponent;
  titleKey: ParseKeys<"development-guide">;
  descriptionKey: ParseKeys<"development-guide">;
  to: string;
}>;

export function HandbookIndexPage({
  titleKey,
  descriptionKey,
  items,
}: Readonly<{
  titleKey: ParseKeys<"development-guide">;
  descriptionKey: ParseKeys<"development-guide">;
  items: readonly HandbookIndexEntry[];
}>) {
  const { t } = useDevelopmentGuideTranslation();
  return (
    <AppCategoryList
      title={t(titleKey)}
      description={t(descriptionKey)}
      navigationLabel={t("handbook.navigation.index", { category: t(titleKey) })}
      items={items.map(item => ({
        id: item.id,
        Icon: item.Icon,
        label: t(item.titleKey),
        description: t(item.descriptionKey),
        to: item.to,
      }))}
    />
  );
}
