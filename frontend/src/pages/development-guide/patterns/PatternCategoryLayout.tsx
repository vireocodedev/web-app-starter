import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import { Box } from "@mui/material";
import { useMemo, useState } from "react";
import { Outlet } from "react-router";

import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { AppPageNavigation } from "@/app/shell/components/AppPageNavigation";
import {
  DocumentationPageNavigation,
  DocumentationRailProvider,
  type DocumentationNavigationGroup,
} from "@/app/shell/documentation";

/** Keeps each category's examples beside the shared Settings-style page navigation. */
export function PatternCategoryLayout({ group }: Readonly<{ group?: DocumentationNavigationGroup | undefined }>) {
  const { t } = useDevelopmentGuideTranslation();
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [contentsTarget, setContentsTarget] = useState<HTMLElement | null>(null);
  const rail = useMemo(() => ({ contentsTarget }), [contentsTarget]);
  const groups = group ? [group] : [];
  const label = group ? t(group.labelKey) : t("navigation.examples");

  return (
    <Box ref={setContainer} sx={{ boxSizing: "border-box", containerType: "inline-size", minWidth: 0, width: "100%" }}>
      <Box
        sx={{
          display: "grid",
          gap: 3,
          minWidth: 0,
          "@container (min-width: 900px)": {
            alignItems: "start",
            gap: 4,
            gridTemplateColumns: "240px minmax(0, 1fr)",
          },
        }}
      >
        <AppPageNavigation
          container={container}
          footer={
            <Box
              ref={setContentsTarget}
              sx={{ borderTop: "1px solid", borderColor: "divider", mt: 3, pl: 2.25, pt: 3 }}
            />
          }
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
        />
        <DocumentationRailProvider value={rail}>
          <Box sx={{ minWidth: 0, width: "100%" }}>
            <Outlet />
            <DocumentationPageNavigation
              groups={groups}
              labels={{
                labelKey: "exampleGallery.pageNavigation.label",
                nextKey: "exampleGallery.pageNavigation.next",
                previousKey: "exampleGallery.pageNavigation.previous",
              }}
            />
          </Box>
        </DocumentationRailProvider>
      </Box>
    </Box>
  );
}
