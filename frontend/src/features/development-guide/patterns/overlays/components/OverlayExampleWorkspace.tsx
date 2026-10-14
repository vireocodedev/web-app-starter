import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { RgoOverlayProvider, useRgoFeedback } from "@rgo-web/frontend";
import { useCallback, type PropsWithChildren } from "react";

import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";

/** Provides one bounded, localized overlay workspace for an interactive example. */
export function OverlayExampleWorkspace({ children, pageKey }: PropsWithChildren<Readonly<{ pageKey: string }>>) {
  const feedback = useRgoFeedback();
  const { t } = useDevelopmentGuideTranslation();
  const theme = useTheme();
  const bottomDrawer = useMediaQuery(theme.breakpoints.down("md"));
  const reportError = useCallback(
    () =>
      feedback.notify({
        id: `${pageKey}-error`,
        message: t("overlayExamples.error"),
        severity: "error",
      }),
    [feedback, pageKey, t],
  );

  return (
    <RgoOverlayProvider
      bottomDrawer={bottomDrawer}
      closeLabel={t("overlayExamples.close")}
      onError={reportError}
      pageKey={pageKey}
      resizeLabel={t("overlayExamples.resize")}
      slotProps={{
        workspace: {
          sx: {
            alignItems: "center",
            display: "flex",
            justifyContent: "center",
            p: 2,
            textAlign: "center",
          },
        },
      }}
      sx={{ height: 260, width: "100%" }}
    >
      {children}
    </RgoOverlayProvider>
  );
}
