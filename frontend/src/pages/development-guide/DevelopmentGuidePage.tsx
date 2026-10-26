import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { Button, Stack, Typography } from "@mui/material";
import { Link } from "react-router";
import type { SvgIconComponent } from "@mui/icons-material";
import type { ParseKeys } from "i18next";

import { AppCategoryList } from "@/app/shell/components/AppCategoryList";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

/** Category entry point for the development-only guide. */
export function DevelopmentGuidePage({
  categories,
  finder,
}: Readonly<{
  finder?: Readonly<{ to: string; articleCount: number }> | undefined;
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
      headerAction={
        finder ? (
          <Stack spacing={0.75} sx={{ alignItems: "flex-start" }}>
            <Button
              component={Link}
              startIcon={<SearchOutlinedIcon />}
              to={finder.to}
              variant="outlined"
              sx={{ whiteSpace: "normal" }}
            >
              {t("handbook.finder.action")}
            </Button>
            <Typography color="text.secondary" variant="caption">
              {t("handbook.finder.actionCount", { count: finder.articleCount })}
            </Typography>
          </Stack>
        ) : undefined
      }
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
