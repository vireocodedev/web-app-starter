import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useRgoFeedback } from "@rgo-web/frontend";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

import {
  createWorkflowFixture,
  WorkflowConflictError,
  type WorkflowRecord,
  type WorkflowScenario,
} from "./workflowFixture";

export function WorkflowCommandsExample({ scenario }: Readonly<{ scenario: WorkflowScenario }>) {
  return <WorkflowSession key={scenario} scenario={scenario} />;
}

function WorkflowSession({ scenario }: Readonly<{ scenario: WorkflowScenario }>) {
  const [preview] = useState(() => createWorkflowFixture(scenario));
  const feedback = useRgoFeedback();
  const notificationId = useId();
  const [basis, setBasis] = useState<WorkflowRecord>(preview.initial);
  const [comment, setComment] = useState("Reviewed against the current request.");
  const [status, setStatus] = useState("Review the pinned request, then approve its exact version.");
  const [phase, setPhase] = useState<"idle" | "confirming" | "writing" | "reading">("idle");
  const [recovery, setRecovery] = useState<"none" | "conflict" | "refresh" | "uncertain">("none");
  const [authorized, setAuthorized] = useState(true);
  const owner = useRef({ generation: 0, authorized: true });
  const active = useRef<AbortController | null>(null);
  const refreshContext = useRef<"approval" | "reload" | "reconcile" | null>(null);
  const feedbackFailed = useRef(false);
  const events = useSyncExternalStore(preview.subscribe, preview.getEvents);
  useEffect(
    () => () => {
      owner.current.generation += 1;
      owner.current.authorized = false;
      active.current?.abort();
      active.current = null;
      preview.dispose();
      feedback.dismiss(notificationId);
    },
    [preview, feedback, notificationId],
  );

  const run = async (kind: "approve" | "reload" | "refresh" | "reconcile") => {
    if (active.current || !owner.current.authorized) return;
    if (kind === "approve" && (recovery !== "none" || basis.status !== "PENDING")) return;
    if (kind === "reload" && recovery !== "conflict") return;
    if (kind === "reconcile" && recovery !== "uncertain") return;
    if (kind === "refresh" && (recovery !== "refresh" || refreshContext.current === null)) return;
    const controller = new AbortController();
    active.current = controller;
    const generation = owner.current.generation;
    const isCurrent = () =>
      active.current === controller &&
      owner.current.generation === generation &&
      owner.current.authorized &&
      !controller.signal.aborted;
    // Capture both concurrency basis and editable command values before opening a decision.
    const command = Object.freeze({ id: basis.id, expectedVersion: basis.version, comment: comment.trim() });
    try {
      if (kind === "approve" || kind === "reload") {
        setPhase("confirming");
        const result = await feedback.confirm({
          title:
            kind === "approve"
              ? `Approve ${basis.title} at version ${command.expectedVersion}?`
              : "Discard the local decision draft?",
          message:
            kind === "approve"
              ? `Send the captured comment: "${command.comment}". The server will recheck permission and version.`
              : "Reload replaces the visible basis and clears the proposed comment. Cancel keeps both unchanged.",
          confirmLabel: kind === "approve" ? "Confirm approval" : "Discard and reload",
          cancelLabel: "Keep reviewing",
          destructive: kind === "reload",
          signal: controller.signal,
        });
        if (!isCurrent()) return;
        if (result.status !== "confirmed") {
          setStatus("Cancelled. No command was sent; the draft is retained.");
          return;
        }
      }
      if (kind === "approve") {
        setPhase("writing");
        let accepted: WorkflowRecord;
        try {
          accepted = await preview.approve(command);
        } catch (error) {
          if (!isCurrent()) return;
          setRecovery(error instanceof WorkflowConflictError ? "conflict" : "uncertain");
          setStatus(
            error instanceof WorkflowConflictError
              ? "Conflict. The original version and proposed comment are retained. Reload explicitly before another decision."
              : "Outcome uncertain. Do not resubmit; reconcile the authoritative outcome first.",
          );
          return;
        }
        if (!isCurrent()) return;
        refreshContext.current = "approval";
        feedbackFailed.current = false;
        setBasis(accepted);
        setStatus("Approval completed. Refreshing affected read models…");
        try {
          feedback.notify({ id: notificationId, message: "Approval completed.", severity: "success" });
        } catch {
          // Feedback delivery is an observer of an already acknowledged write.
          feedbackFailed.current = true;
        }
      } else if (kind === "reload" || kind === "reconcile") {
        setPhase("reading");
        const fresh = await preview.readFresh();
        if (!isCurrent()) return;
        if (kind === "reconcile" && fresh.status !== "APPROVED") {
          setStatus(
            "The authoritative request is still pending. The original approval may still be running; uncertainty remains and no approval can be resubmitted.",
          );
          return;
        }
        setBasis(fresh);
        if (kind === "reload") setComment("");
        refreshContext.current = kind;
        feedbackFailed.current = false;
      }
      if (!isCurrent()) return;
      const context = refreshContext.current;
      if (context === null) return;
      setPhase("reading");
      try {
        await preview.refresh();
        if (!isCurrent()) return;
        setRecovery("none");
        refreshContext.current = null;
        const completed =
          context === "reload"
            ? "Fresh basis accepted with a cleared draft. Review it before a new decision."
            : context === "reconcile"
              ? "Authoritative outcome reconciled. No second approval was sent."
              : "Approval completed. All affected reads refreshed; unrelated scopes are unchanged.";
        setStatus(
          feedbackFailed.current
            ? `${completed} The feedback notification failed; approval remains completed.`
            : completed,
        );
      } catch {
        if (!isCurrent()) return;
        setRecovery("refresh");
        setStatus(
          context === "approval"
            ? "Approval completed; refreshing affected reads failed. Retry refresh sends no approval command."
            : context === "reload"
              ? "Fresh basis accepted; refreshing affected reads failed. Retry refresh sends no approval command."
              : "Authoritative outcome reconciled; refreshing affected reads failed. Retry refresh sends no approval command.",
        );
      }
    } catch {
      if (isCurrent()) setStatus("The recovery read failed. Keep the current basis and retry recovery.");
    } finally {
      if (isCurrent()) {
        active.current = null;
        setPhase("idle");
      }
    }
  };
  const revoke = () => {
    owner.current = { generation: owner.current.generation + 1, authorized: false };
    active.current?.abort();
    active.current = null;
    setAuthorized(false);
    setComment("");
    setPhase("idle");
    setStatus(
      "Authority revoked. Restricted draft and pending decision cleared. No obsolete continuation may update this editor.",
    );
    feedback.dismiss(notificationId);
    void preview.queryClient.cancelQueries();
    preview.queryClient.clear();
  };
  const pending = phase !== "idle";
  return (
    <Box component="main" sx={{ mx: "auto", maxWidth: "md", p: { xs: 2, sm: 3 } }}>
      <Stack spacing={3}>
        <Typography component="h1" variant="h4">
          Workflow commands, conflicts and coordinated refresh
        </Typography>
        <Alert severity="info">
          Private feature-owned workflow simulation with the installed feedback provider and a real QueryClient. It
          demonstrates consumer contracts, not a deployed approval API or durable server transaction.
        </Alert>
        <Paper component="section" aria-label="Approval decision" variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Typography component="h2" variant="h6">
              Review one exact decision
            </Typography>
            {authorized ? (
              <>
                <Typography data-testid="workflow-basis">
                  {basis.title}. Pinned version: {basis.version}. Status: {basis.status}.
                </Typography>
                <TextField
                  label="Approval comment"
                  value={comment}
                  disabled={pending || basis.status !== "PENDING"}
                  onChange={event => setComment(event.target.value)}
                  multiline
                  minRows={2}
                />
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                  <Button
                    variant="contained"
                    disabled={
                      phase === "writing" ||
                      phase === "reading" ||
                      recovery !== "none" ||
                      basis.status !== "PENDING" ||
                      !comment.trim()
                    }
                    onClick={() => void run("approve")}
                  >
                    Approve request
                  </Button>
                  {recovery === "conflict" ? (
                    <Button onClick={() => void run("reload")} disabled={phase === "reading"}>
                      Reload latest request
                    </Button>
                  ) : null}
                  {recovery === "refresh" ? (
                    <Button disabled={pending} onClick={() => void run("refresh")}>
                      Retry refresh
                    </Button>
                  ) : null}
                  {recovery === "uncertain" ? (
                    <Button disabled={pending} onClick={() => void run("reconcile")}>
                      Reconcile outcome
                    </Button>
                  ) : null}
                  <Button disabled={pending} onClick={preview.failNextRefresh}>
                    Fail next read-model refresh
                  </Button>
                  <Button onClick={revoke}>Revoke preview authority</Button>
                </Stack>
              </>
            ) : null}
            <Typography role="status">{status}</Typography>
            <Typography data-testid="workflow-counts">
              Approval attempts: {preview.getCounts().attempts}. Committed approvals: {preview.getCounts().accepted}.
            </Typography>
          </Stack>
        </Paper>
        {authorized ? (
          <Paper component="section" aria-label="Affected read models" variant="outlined" sx={{ p: 2 }}>
            <Typography component="h2" variant="h6">
              Affected read models
            </Typography>
            <Box component="ul" aria-label="Read model projections" sx={{ pl: 3 }}>
              {preview.getProjections().map(projection => (
                <li key={projection.label}>
                  {projection.label}: version {projection.version}, refreshes {projection.refreshes},{" "}
                  {projection.stale ? "stale" : "fresh"}.
                </li>
              ))}
            </Box>
            <Typography data-testid="workflow-sentinels">{preview.getSentinels()}</Typography>
          </Paper>
        ) : null}
        {authorized ? (
          <Paper component="section" aria-label="Workflow activity" variant="outlined" sx={{ p: 2 }}>
            <Typography component="h2" variant="h6">
              Workflow activity
            </Typography>
            <Box component="ol" aria-label="Workflow event sequence" sx={{ pl: 3, overflowWrap: "anywhere" }}>
              {events.map((event, index) => (
                <li key={`${index}-${event}`}>{event}</li>
              ))}
            </Box>
          </Paper>
        ) : null}
      </Stack>
    </Box>
  );
}
