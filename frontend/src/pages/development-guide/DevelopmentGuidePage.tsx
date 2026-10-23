import StorageOutlinedIcon from "@mui/icons-material/StorageOutlined";
import WebOutlinedIcon from "@mui/icons-material/WebOutlined";

import { AppCategoryList } from "@/app/shell/components/AppCategoryList";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

/** Category entry point for the development-only guide. */
export function DevelopmentGuidePage() {
  const { t } = useDevelopmentGuideTranslation();
  const categories = [
    {
      Icon: WebOutlinedIcon,
      description: t("categories.frontendDescription"),
      id: "frontend",
      label: t("navigation.frontend"),
      to: "/dev-guide/frontend",
    },
    {
      Icon: StorageOutlinedIcon,
      description: t("categories.backendDescription"),
      id: "backend",
      label: t("navigation.backend"),
      to: "/dev-guide/backend",
    },
  ];

  return (
    <AppCategoryList
      title={t("categories.title")}
      description={t("categories.description")}
      navigationLabel={t("categories.navigationLabel")}
      items={categories}
    />
  );
}
