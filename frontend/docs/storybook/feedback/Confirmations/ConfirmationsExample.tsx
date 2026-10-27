import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useRgoFeedback } from "@rgo-web/frontend";
import { useEffect, useRef, useState } from "react";

export type ConfirmationsExampleProps = Readonly<{
  scenario: "standard" | "destructive" | "dirty" | "abortable";
  failSave: boolean;
  delayMs: number;
}>;

const initialName = "Alex Morgan";
const notificationId = "story-confirmed-command";

/** Aborting this local timer does not model cancellation of a real server write. */
function waitForCommand(delayMs: number, signal: AbortSignal): Promise<void> {
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

export function ConfirmationsExample(props: ConfirmationsExampleProps) {
  return <ConfirmationSession key={props.scenario} {...props} />;
}

function ConfirmationSession({ scenario, failSave, delayMs }: ConfirmationsExampleProps) {
  const feedback = useRgoFeedback();
  const activeRequest = useRef<AbortController | null>(null);
  const expirationTimer = useRef<number | undefined>(undefined);
  const [phase, setPhase] = useState<"idle" | "confirming" | "executing">("idle");
  const [completedCount, setCompletedCount] = useState(0);
  const [status, setStatus] = useState("No action has been requested.");
  const [deleted, setDeleted] = useState(false);
  const [name, setName] = useState(initialName);
  const [editorOpen, setEditorOpen] = useState(true);
  const dirty = name !== initialName;
  const pending = phase !== "idle";

  useEffect(
    () => () => {
      activeRequest.current?.abort();
      activeRequest.current = null;
      window.clearTimeout(expirationTimer.current);
      feedback.dismiss(notificationId);
    },
    [feedback],
  );

  const requestAction = async () => {
    if (activeRequest.current || deleted) return;
    if (scenario === "dirty" && !dirty) {
      setEditorOpen(false);
      setStatus("Clean editor closed without confirmation.");
      return;
    }

    const controller = new AbortController();
    activeRequest.current = controller;
    setPhase("confirming");
    setStatus("Waiting for a decision…");
    feedback.dismiss(notificationId);
    if (scenario === "abortable") {
      expirationTimer.current = window.setTimeout(() => controller.abort(), 2000);
    }
    try {
      const result = await feedback.confirm({
        ...(scenario === "dirty"
          ? {
              title: "Discard unsaved changes?",
              message: "Your edits to Alex Morgan have not been saved. Discard them and close the editor?",
              confirmLabel: "Discard changes",
              cancelLabel: "Keep editing",
              destructive: true,
            }
          : scenario === "destructive"
            ? {
                title: "Delete Alex Morgan?",
                message: "This removes Alex Morgan from the preview. This action cannot be undone.",
                confirmLabel: "Delete contact",
                cancelLabel: "Keep contact",
                destructive: true,
              }
            : scenario === "abortable"
              ? {
                  title: "Continue this session?",
                  message: "This request expires after two seconds. An expired request must not start the command.",
                  confirmLabel: "Continue session",
                  cancelLabel: "Cancel",
                }
              : {
                  title: "Publish these changes?",
                  message: "Publish the current contact changes in this preview?",
                  confirmLabel: "Publish changes",
                  cancelLabel: "Cancel",
                }),
        signal: controller.signal,
      });
      window.clearTimeout(expirationTimer.current);
      if (activeRequest.current !== controller) return;
      if (controller.signal.aborted) {
        // Only this still-mounted request may report its automatic expiry.
        if (scenario === "abortable") setStatus("Confirmation expired. No command was sent.");
        return;
      }
      if (result.status !== "confirmed") {
        setStatus(scenario === "dirty" ? "Still editing. Your draft is unchanged." : "Cancelled. No command was sent.");
        return;
      }
      if (scenario === "dirty") {
        setEditorOpen(false);
        setStatus("Changes discarded. Editor closed.");
        return;
      }

      setPhase("executing");
      setStatus("Confirmed. Waiting for the simulated command…");
      await waitForCommand(delayMs, controller.signal);
      if (controller.signal.aborted || activeRequest.current !== controller) return;
      if (failSave) throw new Error("Simulated command rejection.");
      setCompletedCount(count => count + 1);
      if (scenario === "destructive") setDeleted(true);
      const message =
        scenario === "destructive"
          ? "Contact deleted."
          : scenario === "abortable"
            ? "Session continued."
            : "Changes published.";
      setStatus(message);
      feedback.notify({ id: notificationId, message, severity: "success" });
    } catch {
      if (controller.signal.aborted || activeRequest.current !== controller) return;
      setStatus("Command failed. The contact is unchanged.");
      feedback.notify({ id: notificationId, message: "The command failed. Try again.", severity: "error" });
    } finally {
      window.clearTimeout(expirationTimer.current);
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        // Provider teardown cancels confirmations, but does not own caller work.
        // Cleanup clears this ref so an obsolete continuation cannot update state.
        setPhase("idle");
      }
    }
  };

  return (
    <Box component="main" sx={{ mx: "auto", maxWidth: "md", p: { xs: 2, sm: 3 } }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography component="h1" variant="h4">
            Confirmations
          </Typography>
          <Typography color="text.secondary">
            Await an explicit decision, then recheck the caller's lifetime before running the command.
          </Typography>
        </Stack>
        <Alert severity="info">
          Storybook simulation: commands wait {delayMs / 1000} seconds and change only this preview. Cancel, Escape and
          backdrop dismissal do not send a command.
        </Alert>
        <Paper sx={{ p: { xs: 2, sm: 3 } }} variant="outlined">
          <Stack spacing={2}>
            <Typography component="h2" variant="h6">
              {scenario === "dirty"
                ? "Guard an unsaved editor"
                : scenario === "destructive"
                  ? "Confirm an exact destructive action"
                  : scenario === "abortable"
                    ? "Cancel an obsolete request"
                    : "Confirm before publishing"}
            </Typography>
            {scenario === "dirty" ? (
              <>
                <Typography>
                  A clean editor closes directly. Edit the name to require a discard decision. This local example is not
                  a router blocker or overlay controller.
                </Typography>
                {editorOpen ? (
                  <TextField
                    label="Contact name"
                    onChange={event => setName(event.target.value)}
                    value={name}
                    disabled={pending}
                  />
                ) : null}
                <Typography>{editorOpen ? `Draft: ${dirty ? "dirty" : "clean"}` : "Editor is closed."}</Typography>
              </>
            ) : scenario === "destructive" ? (
              <Typography>{deleted ? "Contact is deleted." : "Contact is present: Alex Morgan."}</Typography>
            ) : scenario === "abortable" ? (
              <Typography>
                The caller owns a two-second expiry timer and AbortController. Let the dialog expire to see a cancelled
                result with zero commands.
              </Typography>
            ) : (
              <Typography>
                Confirmation is permission to begin. A success notification appears only after the simulated command
                acknowledges completion.
              </Typography>
            )}
            <Button
              color={scenario === "destructive" ? "error" : "primary"}
              // Keep the opener focusable until the dialog releases its focus trap.
              disabled={phase === "executing" || deleted || (scenario === "dirty" && !editorOpen)}
              onClick={() => void requestAction()}
              sx={{ alignSelf: "flex-start" }}
              variant="contained"
            >
              {pending
                ? "Waiting…"
                : scenario === "dirty"
                  ? "Close editor"
                  : scenario === "destructive"
                    ? "Delete contact"
                    : scenario === "abortable"
                      ? "Request expiring confirmation"
                      : "Publish changes"}
            </Button>
            <Stack role="status" aria-live="polite" spacing={1}>
              <Typography>{status}</Typography>
              <Typography>Completed commands: {completedCount}</Typography>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
