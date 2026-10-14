import { Alert, Button, Typography } from "@mui/material";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

export function LookupStatus({
  loading,
  failed,
  count,
  retry,
}: {
  loading: boolean;
  failed: boolean;
  count: number;
  retry: () => void;
}) {
  const { t } = useDevelopmentGuideTranslation();
  if (failed)
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" onClick={retry}>
            {t("formsExamples.asyncLookups.retry")}
          </Button>
        }
      >
        {t("formsExamples.asyncLookups.failed")}
      </Alert>
    );
  return (
    <Typography role="status" variant="body2" color="text.secondary">
      {loading
        ? t("formsExamples.asyncLookups.loading")
        : count === 0
          ? t("formsExamples.asyncLookups.empty")
          : t("formsExamples.asyncLookups.results", { count })}
    </Typography>
  );
}
