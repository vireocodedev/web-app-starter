import ContactsOutlinedIcon from "@mui/icons-material/ContactsOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";

import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { AppCategoryList } from "@/app/shell/components/AppCategoryList";

export function ExamplePagesIndexPage() {
  const { t } = useDevelopmentGuideTranslation();

  return (
    <AppCategoryList
      title={t("navigation.examplePages")}
      description={t("examplePages.description")}
      navigationLabel={t("examplePages.navigationLabel")}
      items={[
        {
          id: "contacts-dashboard",
          Icon: DashboardOutlinedIcon,
          label: t("navigation.contactsDashboard"),
          description: t("examplePages.dashboardDescription"),
          to: "/dev-guide/frontend/example-pages/contacts-dashboard",
        },
        {
          id: "contacts-crud",
          Icon: ContactsOutlinedIcon,
          label: t("navigation.contactsCrud"),
          description: t("examplePages.contactsDescription"),
          to: "/dev-guide/frontend/example-pages/contacts-crud",
        },
      ]}
    />
  );
}
