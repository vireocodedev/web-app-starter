import { Alert, Box, Button, Chip, Divider, Stack, Typography } from "@mui/material";
import { useRgoFeedback } from "@rgo-web/frontend";
import { useEffect, useRef, useState } from "react";
import { Link, MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router";

import { StorybookAddressBar } from "../../routing/shared/StorybookAddressBar";
import { createCapabilityFixture, type CapabilityScenario } from "./capabilityFixture";

function Preview({ scenario }: Readonly<{ scenario: CapabilityScenario }>) {
  const [api] = useState(() => createCapabilityFixture(scenario));
  const [authority, setAuthority] = useState(api.snapshot);
  const [message, setMessage] = useState("Page eligibility and record actions have different owners.");
  const [revokeNext, setRevokeNext] = useState(scenario === "revocation");
  const owner = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const feedback = useRgoFeedback();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(
    () => () => {
      owner.current?.abort();
      clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    owner.current?.abort();
  }, [location.pathname]);

  const approve = async () => {
    if (owner.current || !api.snapshot().approveAllowed) return;
    const operation = new AbortController();
    owner.current = operation;
    const capturedRevision = api.snapshot().revision;
    try {
      const decision = feedback.confirm({
        title: "Approve request?",
        message: "Approve the workspace equipment request after reviewing its current authority.",
        confirmLabel: "Approve",
        cancelLabel: "Keep pending",
        signal: operation.signal,
      });
      if (revokeNext) {
        setRevokeNext(false);
        timer.current = setTimeout(() => {
          api.revoke();
          setAuthority(api.snapshot());
          setMessage("Approval permission was revoked while the decision was open. Confirming will send no command.");
        }, 350);
      }
      const result = await decision;
      if (result.status !== "confirmed" || operation.signal.aborted) return;
      const live = api.snapshot();
      if (live.revision !== capturedRevision || !live.pageAllowed || !live.approveAllowed) {
        setMessage("Decision expired: authority changed. No command was sent.");
        return;
      }
      try {
        api.approve();
        setMessage("Request approved after backend acknowledgement.");
      } catch {
        setMessage("Backend rejected the command. No success was reported.");
      }
      setAuthority(api.snapshot());
    } finally {
      clearTimeout(timer.current);
      if (owner.current === operation) owner.current = null;
    }
  };

  return (
    <Box sx={{ minWidth: 0, bgcolor: "background.default", color: "text.primary" }}>
      <StorybookAddressBar />
      <Stack spacing={2} sx={{ p: { xs: 2, md: 3 }, minWidth: 0, overflowWrap: "anywhere" }}>
        <Typography variant="h5" component="h1">
          Capability-aware pages and actions
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ flexWrap: "wrap" }}
          component="nav"
          aria-label="Main navigation"
        >
          <Button component={Link} to="/workspace">
            Workspace
          </Button>
          {authority.pageAllowed && (
            <Button component={Link} to="/reviews">
              Reviews
            </Button>
          )}
        </Stack>
        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          sx={{ flexWrap: "wrap" }}
          component="nav"
          aria-label="Command palette destinations"
        >
          <Chip label="Command palette" />
          <Button component={Link} to="/workspace">
            Go to workspace
          </Button>
          {authority.pageAllowed && (
            <Button component={Link} to="/reviews">
              Go to reviews
            </Button>
          )}
        </Stack>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
          <Button variant="outlined" onClick={() => void navigate("/reviews")}>
            Open review URL directly
          </Button>
          <Button onClick={() => void navigate("/workspace")}>Open workspace</Button>
        </Stack>
        <Divider />
        <Routes>
          <Route
            path="/workspace"
            element={
              <Typography component="h2" variant="h6">
                Workspace overview
              </Typography>
            }
          />
          <Route
            path="/reviews"
            element={
              authority.pageAllowed ? (
                <Stack spacing={2}>
                  <Typography component="h2" variant="h6">
                    Workspace equipment request
                  </Typography>
                  <Typography>This authorized record remains readable when approval permission is removed.</Typography>
                  <Button variant="contained" disabled={!authority.approveAllowed} onClick={() => void approve()}>
                    Approve request
                  </Button>
                  {!authority.approveAllowed && (
                    <Alert severity="info">
                      {authority.approved
                        ? "This request is already approved."
                        : "You can read this request, but approval is unavailable."}
                    </Alert>
                  )}
                </Stack>
              ) : (
                <Alert severity="warning">
                  <Typography component="h2" variant="h6">
                    Page access denied
                  </Typography>
                  No review content is loaded or rendered. A valid URL does not grant access.
                </Alert>
              )
            }
          />
        </Routes>
        <Alert severity="info">{message}</Alert>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
          <Button
            disabled={!authority.approveAllowed}
            onClick={() => {
              setRevokeNext(true);
              setMessage("The next approval decision will lose permission while it is open.");
            }}
          >
            Revoke during next confirmation
          </Button>
          <Button
            disabled={!authority.pageAllowed}
            onClick={() => {
              owner.current?.abort();
              api.revokePage();
              setAuthority(api.snapshot());
              setMessage("Page authority revoked. Restricted content and navigation were removed.");
            }}
          >
            Revoke page access
          </Button>
          <Button
            onClick={() => {
              api.revoke();
              try {
                api.approve();
              } catch {
                setMessage("Backend independently rejected a direct unauthorized command.");
              }
              setAuthority(api.snapshot());
            }}
          >
            Check backend rejection
          </Button>
        </Stack>
        <Typography role="status">
          Acknowledged writes: {authority.writes}. Backend rejections: {authority.rejections}.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Private teaching fixture. The backend check is a local stand-in; no app session, role, storage or network
          endpoint is changed.
        </Typography>
      </Stack>
    </Box>
  );
}

export function CapabilityAwarePagesExample({ scenario }: Readonly<{ scenario: CapabilityScenario }>) {
  return (
    <MemoryRouter key={scenario} initialEntries={["/reviews"]}>
      <Preview scenario={scenario} />
    </MemoryRouter>
  );
}
