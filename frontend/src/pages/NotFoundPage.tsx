import { Alert } from "@mui/material";

import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";

export function NotFoundPage() {
  const { t } = useAppTranslation();

  return <Alert severity="warning">{t("navigation.notFound")}</Alert>;
}
