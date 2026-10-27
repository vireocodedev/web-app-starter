import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useRgoFeedback } from "@rgo-web/frontend";
import { useEffect, useRef, useState } from "react";

export type NotificationsExampleProps = Readonly<{
  scenario: "save" | "action" | "lifecycle";
  failSave: boolean;
  delayMs: number;
}>;

const saveId = "story-contact-save";
const archiveId = "story-contact-archive";
const maintenanceId = "story-maintenance";
const syncId = "story-sync";

/** A cancellable local simulation, not a server command or rollback protocol. */
function waitForSave(delayMs: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abort = () => {
      window.clearTimeout(timer);
      reject(new DOMException("The preview ended.", "AbortError"));
    };
    const timer = window.setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, delayMs);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
  });
}

export function NotificationsExample(props: NotificationsExampleProps) {
  return <NotificationSession key={props.scenario} {...props} />;
}

function NotificationSession({ scenario, failSave, delayMs }: NotificationsExampleProps) {
  const feedback = useRgoFeedback();
  const activeSave = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const [pending, setPending] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState("No save has completed yet.");
  const [archived, setArchived] = useState(false);
  const [warningVisible, setWarningVisible] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      activeSave.current?.abort();
      for (const id of [saveId, archiveId, maintenanceId, syncId]) feedback.dismiss(id);
    };
  }, [feedback]);

  const saveContact = async () => {
    if (activeSave.current) return;
    const controller = new AbortController();
    activeSave.current = controller;
    setPending(true);
    setSaveStatus("Waiting for the simulated save…");
    feedback.dismiss(saveId);
    try {
      await waitForSave(delayMs, controller.signal);
      if (controller.signal.aborted) return;
      if (failSave) throw new Error("Simulated save rejection.");
      setSavedCount(count => count + 1);
      setSaveStatus("Contact saved.");
      feedback.notify({ id: saveId, message: "Contact saved.", severity: "success" });
    } catch {
      if (controller.signal.aborted) return;
      setSaveStatus("Save failed. The contact is unchanged.");
      feedback.notify({ id: saveId, message: "Could not save the contact. Try again.", severity: "error" });
    } finally {
      if (!controller.signal.aborted && activeSave.current === controller) {
        activeSave.current = null;
        setPending(false);
      }
    }
  };

  const archiveContact = () => {
    setArchived(true);
    feedback.notify({
      id: archiveId,
      message: "Contact archived.",
      severity: "info",
      action: {
        label: "Undo",
        onClick: () => {
          if (!mounted.current) return;
          setArchived(false);
          feedback.notify({ id: archiveId, message: "Contact restored.", severity: "success" });
        },
      },
    });
  };

  return (
    <Box component="main" sx={{ mx: "auto", maxWidth: "md", p: { xs: 2, sm: 3 } }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography component="h1" variant="h4">
            Notifications
          </Typography>
          <Typography color="text.secondary">
            Use the shared feedback capability for acknowledged outcomes, optional actions and notification lifetimes.
          </Typography>
        </Stack>
        <Alert severity="info">
          Storybook simulation: actions change only this preview. No data is sent or stored.
        </Alert>
        <Paper sx={{ p: { xs: 2, sm: 3 } }} variant="outlined">
          {scenario === "save" ? (
            <Stack spacing={2}>
              <Typography component="h2" variant="h6">
                Notify after the save resolves
              </Typography>
              <Typography>
                The simulated command takes {delayMs / 1000} seconds. A rejected command produces an error and no
                success acknowledgement.
              </Typography>
              <Button
                disabled={pending}
                onClick={() => void saveContact()}
                sx={{ alignSelf: "flex-start" }}
                variant="contained"
              >
                {pending ? "Saving…" : "Save contact"}
              </Button>
              <Stack role="status" aria-live="polite" spacing={1}>
                <Typography>{saveStatus}</Typography>
                <Typography>Acknowledged saves: {savedCount}</Typography>
              </Stack>
            </Stack>
          ) : scenario === "action" ? (
            <Stack spacing={2}>
              <Typography component="h2" variant="h6">
                An action belongs to its caller
              </Typography>
              <Typography>
                Archive changes the local contact. The persistent notification's Undo action restores it and replaces
                the same notification ID. A real server-backed undo needs its own command and acknowledgement.
              </Typography>
              <Button disabled={archived} onClick={archiveContact} sx={{ alignSelf: "flex-start" }} variant="contained">
                Archive contact
              </Button>
              <Typography role="status" aria-live="polite">
                {archived ? "Contact is archived." : "Contact is active."}
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <Typography component="h2" variant="h6">
                Own IDs and explicit lifetimes
              </Typography>
              <Typography>
                A null duration keeps the warning until dismissed. Sync uses one ID: completion replaces its pending
                notification. Different IDs enter the shared queue.
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  color="warning"
                  onClick={() => {
                    setWarningVisible(true);
                    feedback.notify({
                      id: maintenanceId,
                      message: "Maintenance starts soon. Save your work.",
                      severity: "warning",
                      durationMs: null,
                    });
                  }}
                  variant="outlined"
                >
                  Show maintenance warning
                </Button>
                <Button
                  onClick={() => {
                    setWarningVisible(false);
                    feedback.dismiss(maintenanceId);
                  }}
                >
                  Dismiss warning
                </Button>
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  disabled={syncing}
                  onClick={() => {
                    setSyncing(true);
                    feedback.notify({ id: syncId, message: "Sync in progress…", severity: "info", durationMs: null });
                  }}
                  variant="contained"
                >
                  Start sync
                </Button>
                <Button
                  disabled={!syncing}
                  onClick={() => {
                    setSyncing(false);
                    feedback.notify({ id: syncId, message: "Sync completed.", severity: "success" });
                  }}
                  variant="outlined"
                >
                  Complete sync
                </Button>
              </Stack>
              <Stack role="status" aria-live="polite" spacing={1}>
                <Typography>
                  {warningVisible ? "Maintenance warning requested." : "No maintenance warning requested."}
                </Typography>
                <Typography>{syncing ? "Sync is running." : "Sync is idle."}</Typography>
              </Stack>
            </Stack>
          )}
        </Paper>
      </Stack>
    </Box>
  );
}
