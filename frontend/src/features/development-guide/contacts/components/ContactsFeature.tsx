import { Paper, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { RgoOverlayProvider, useRgoFeedback } from "@rgo-web/frontend";
import { useCallback } from "react";

import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import {
  tableWorkspaceOverlaySlotProps,
  tableWorkspaceOverlaySx,
  tableWorkspacePaperSx,
} from "@/app/theme/styles/tableWorkspaceStyles";

import { ContactsTable } from "./ContactsTable";
import { useContactsWorkspace } from "../hooks/useContactsWorkspace";

function ContactsWorkspace() {
  const workspace = useContactsWorkspace();
  return <ContactsTable {...workspace} />;
}

/** Public Contacts surface, including its page-local overlay boundary. */
export function ContactsFeature() {
  const feedback = useRgoFeedback();
  const { t } = useDevelopmentGuideTranslation();
  const theme = useTheme();
  const bottomDrawer = useMediaQuery(theme.breakpoints.down("md"));
  const reportOverlayError = useCallback(
    () =>
      feedback.notify({
        id: "contacts-overlay-error",
        message: t("contacts.overlay.error"),
        severity: "error",
      }),
    [feedback, t],
  );

  return (
    <RgoOverlayProvider
      bottomDrawer={bottomDrawer}
      closeLabel={t("contacts.overlay.close")}
      onError={reportOverlayError}
      pageKey="contacts"
      resizeLabel={t("contacts.overlay.resize")}
      slotProps={tableWorkspaceOverlaySlotProps}
      sx={tableWorkspaceOverlaySx}
    >
      <Paper data-rgo-page-surface="contacts" sx={tableWorkspacePaperSx}>
        <ContactsWorkspace />
      </Paper>
    </RgoOverlayProvider>
  );
}
