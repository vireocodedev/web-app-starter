import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import { Outlet } from "react-router";

import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import {
  DocumentationPageLayout,
  DocumentationPageNavigation,
  type DocumentationNavigationGroup,
} from "@/app/shell/documentation";

/** Keeps each category's examples beside the shared Settings-style page navigation. */
export function PatternCategoryLayout({ group }: Readonly<{ group?: DocumentationNavigationGroup | undefined }>) {
  const { t } = useDevelopmentGuideTranslation();
  const groups = group ? [group] : [];
  const label = group ? t(group.labelKey) : t("navigation.examples");

  return (
    <DocumentationPageLayout
      links={(group?.items ?? []).map(item => ({
        ...(item.activePath ? { activePath: item.activePath } : {}),
        Icon: item.Icon ?? ArticleOutlinedIcon,
        label: t(item.labelKey),
        to: item.to,
      }))}
      labels={{
        navigation: label,
        pages: label,
        choosePage: page => t("patternCategories.choosePage", { page }),
        close: t("patternCategories.closePages"),
      }}
      pagination={
        <DocumentationPageNavigation
          groups={groups}
          labels={{
            labelKey: "exampleGallery.pageNavigation.label",
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
