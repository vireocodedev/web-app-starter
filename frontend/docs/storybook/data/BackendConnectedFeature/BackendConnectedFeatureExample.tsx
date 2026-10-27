import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { decodeAppHttpError } from "@/app/data/http/appHttpError";

import {
  createBackendFeatureFixture,
  ResponseContractError,
  type BackendScenario,
  type RequestRecord,
} from "./backendFeatureFixture";

export function BackendConnectedFeatureExample({ scenario }: Readonly<{ scenario: BackendScenario }>) {
  return <BackendSession key={scenario} scenario={scenario} />;
}

type Preview = ReturnType<typeof createBackendFeatureFixture>;
function BackendSession({ scenario }: Readonly<{ scenario: BackendScenario }>) {
  const [preview] = useState(() => createBackendFeatureFixture(scenario));
  const events = useSyncExternalStore(preview.subscribe, preview.getEvents);
  useEffect(() => () => preview.dispose(), [preview]);
  return (
    <QueryClientProvider client={preview.queryClient}>
      <Box component="main" sx={{ mx: "auto", maxWidth: "md", p: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          <Typography component="h1" variant="h4">
            Building a backend-connected feature
          </Typography>
          <Alert severity="info">
            The real Axios factory, session interceptors and Query run against a private transport. These endpoints are
            a consumer recipe; no network, application cookie or storage is accessed.
          </Alert>
          <BackendContent preview={preview} />
          <Paper component="section" aria-label="Backend request activity" variant="outlined" sx={{ p: 2 }}>
            <Typography component="h2" variant="h6">
              Request activity
            </Typography>
            <Typography data-testid="backend-write-count">Write attempts: {preview.getWrites()}.</Typography>
            <Box component="ol" aria-label="Backend request sequence" sx={{ pl: 3, overflowWrap: "anywhere" }}>
              {events.map((event, index) => (
                <li key={`${index}-${event}`}>{event}</li>
              ))}
            </Box>
          </Paper>
        </Stack>
      </Box>
    </QueryClientProvider>
  );
}

function BackendContent({ preview }: Readonly<{ preview: Preview }>) {
  const page = useQuery(preview.query.page(0));
  const detail = useQuery(preview.query.detail());
  return (
    <Stack spacing={2}>
      <Typography>
        Collection total: {page.data?.total ?? "loading"}. Latest listed title:{" "}
        {page.data?.items[0]?.title ?? "loading"}.
      </Typography>
      {detail.isPending ? <Typography role="status">Loading request…</Typography> : null}
      {detail.isError ? (
        <Alert severity="error">
          {axios.isAxiosError(detail.error) && detail.error.response?.status === 404
            ? "Request not found. This is not an empty collection."
            : "The request could not be loaded."}
          <Button
            onClick={() => {
              preview.repair();
              void detail.refetch();
            }}
          >
            Repair and retry read
          </Button>
        </Alert>
      ) : null}
      {detail.data ? <BackendEditor preview={preview} initialRecord={detail.data} /> : null}
    </Stack>
  );
}

function BackendEditor({ preview, initialRecord }: Readonly<{ preview: Preview; initialRecord: RequestRecord }>) {
  const mutation = useMutation(preview.mutation);
  const [basis, setBasis] = useState(initialRecord);
  const [title, setTitle] = useState(initialRecord.title);
  const [message, setMessage] = useState("The editable title and version belong to one accepted basis.");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [uncertain, setUncertain] = useState(false);
  const [conflicted, setConflicted] = useState(false);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const uncertainExpectedVersion = useRef<number | null>(null);
  const owner = useRef(true);
  useEffect(() => {
    owner.current = true;
    return () => {
      owner.current = false;
    };
  }, []);
  const save = async () => {
    if (busy.current || uncertain || conflicted || refreshFailed || !title.trim()) return;
    busy.current = true;
    setPending(true);
    setFieldError(undefined);
    const input = { title, expectedVersion: basis.version };
    try {
      const accepted = await mutation.mutateAsync(input);
      if (!owner.current) return;
      setBasis(accepted);
      setTitle(accepted.title);
      setMessage("Change acknowledged. Refreshing affected reads…");
      try {
        await preview.refresh();
        if (owner.current) setMessage("Change acknowledged and affected reads refreshed.");
      } catch {
        if (owner.current) {
          setRefreshFailed(true);
          setMessage("Change acknowledged; refreshing reads failed. Retry refresh, not the write.");
        }
      }
    } catch (error) {
      if (!owner.current) return;
      const decoded = decodeAppHttpError(error, ["title"]);
      if (decoded?.code === "VALIDATION_FAILED") {
        setFieldError(
          decoded.fieldErrors.find(field => field.field === "title")?.code === "TOO_LONG"
            ? "The server rejected the title length."
            : "Check the title.",
        );
        setMessage("Validation rejected before commit. Your draft is retained.");
      } else if (decoded?.code === "FORBIDDEN")
        setMessage("Permission denied. No write was committed by this simulated endpoint.");
      else if (axios.isAxiosError(error) && error.response?.status === 409 && decoded?.code === "REQUEST_REJECTED") {
        setConflicted(true);
        setMessage("The expected version is stale. Reconcile before another decision.");
      } else {
        uncertainExpectedVersion.current = input.expectedVersion;
        setUncertain(true);
        setMessage(
          error instanceof ResponseContractError
            ? "The write returned a malformed success. Its outcome is uncertain; reconcile before another write."
            : "The write outcome is uncertain. Reconcile before another write.",
        );
      }
    } finally {
      busy.current = false;
      if (owner.current) setPending(false);
    }
  };
  const reconcile = async () => {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    preview.repair();
    try {
      const fresh = await preview.queryClient.fetchQuery({ ...preview.query.detail(), staleTime: 0 });
      if (!owner.current) return;
      if (
        uncertain &&
        (uncertainExpectedVersion.current === null || fresh.version <= uncertainExpectedVersion.current)
      ) {
        setMessage(
          "The authoritative version has not advanced beyond the attempted write. The original request may still be running; uncertainty remains and saving stays blocked.",
        );
        return;
      }
      await preview.refresh();
      if (owner.current) {
        setBasis(fresh);
        setTitle(fresh.title);
        setUncertain(false);
        uncertainExpectedVersion.current = null;
        setConflicted(false);
        setRefreshFailed(false);
        setMessage("Authoritative record reloaded; no additional write was sent.");
      }
    } catch {
      if (owner.current) setMessage("Reconciliation failed. Keep the write blocked and retry the read.");
    } finally {
      busy.current = false;
      if (owner.current) setPending(false);
    }
  };
  return (
    <Paper component="section" aria-label="Request editor" variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography component="h2" variant="h6">
          Request request-17
        </Typography>
        <Typography data-testid="backend-basis">Accepted basis version: {basis.version}.</Typography>
        <TextField
          label="Request title"
          value={title}
          onChange={event => setTitle(event.target.value)}
          disabled={pending || uncertain || conflicted}
          error={Boolean(fieldError)}
          helperText={fieldError}
        />
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
          <Button
            variant="contained"
            disabled={pending || uncertain || conflicted || refreshFailed || !title.trim()}
            onClick={() => void save()}
          >
            {pending ? "Waiting for request…" : "Save request"}
          </Button>
          <Button disabled={pending} onClick={preview.repair}>
            Repair simulated endpoint
          </Button>
          {uncertain ? (
            <Button disabled={pending} onClick={() => void reconcile()}>
              Reconcile uncertain result
            </Button>
          ) : null}
          {conflicted ? (
            <Button disabled={pending} onClick={() => void reconcile()}>
              Reload request basis
            </Button>
          ) : null}
          {refreshFailed ? (
            <Button disabled={pending} onClick={() => void reconcile()}>
              Retry refresh
            </Button>
          ) : null}
        </Stack>
        <Typography role="status">{message}</Typography>
      </Stack>
    </Paper>
  );
}
