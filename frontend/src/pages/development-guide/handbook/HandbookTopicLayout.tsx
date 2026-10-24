import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import type { ParseKeys } from "i18next";
import { Outlet } from "react-router";

import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { DocumentationPageLayout, DocumentationPageNavigation } from "@/app/shell/documentation";

export type HandbookPageLink = Readonly<{
  labelKey: ParseKeys<"development-guide">;
  to: string;
}>;

export function HandbookTopicLayout({
  topicId,
  titleKey,
  links,
}: Readonly<{
  topicId: string;
  titleKey: ParseKeys<"development-guide">;
  links: readonly HandbookPageLink[];
}>) {
  const { t } = useDevelopmentGuideTranslation();
  return (
    <DocumentationPageLayout
      links={links.map(link => ({ Icon: ArticleOutlinedIcon, label: t(link.labelKey), to: link.to }))}
      labels={{
        navigation: t(titleKey),
        pages: t(titleKey),
        choosePage: page => t("handbook.navigation.choosePage", { page }),
        close: t("handbook.navigation.closePages"),
      }}
      pagination={
        <DocumentationPageNavigation
          groups={[{ id: topicId, labelKey: titleKey, defaultExpanded: true, items: links }]}
          labels={{
            labelKey: "handbook.navigation.pageNavigation",
            nextKey: "exampleGallery.pageNavigation.next",
            previousKey: "exampleGallery.pageNavigation.previous",
          }}
        />
      }
    >
      <Outlet />
    </DocumentationPageLayout>
  );
}
