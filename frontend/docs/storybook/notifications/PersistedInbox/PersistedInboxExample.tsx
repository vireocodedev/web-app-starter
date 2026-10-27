import { Alert, Box, Button, Chip, List, ListItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";
import { useRgoFeedback } from "@rgo-web/frontend";
import { useEffect, useId, useRef, useState } from "react";
import { Link, MemoryRouter, Route, Routes, useParams } from "react-router";

import { createAppQueryClient } from "@/app/data/query/createAppQueryClient";
import { useAppLocalizationFormatters } from "@/app/localization/hooks/useAppLocalizationFormatters";
import { StorybookAddressBar } from "../../routing/shared/StorybookAddressBar";
import {
  createInboxOptions,
  createInboxServer,
  InboxHiddenError,
  type InboxScenario,
  type InboxViewer,
} from "./inboxFixture";

type Server = ReturnType<typeof createInboxServer>;
export type PersistedInboxExampleProps = Readonly<{ scenario: InboxScenario }>;

export function PersistedInboxExample(props: PersistedInboxExampleProps) {
  return <InboxSession key={props.scenario} {...props} />;
}

function InboxSession({ scenario }: PersistedInboxExampleProps) {
  const [server] = useState(() => createInboxServer(scenario));
  const [viewer, setViewer] = useState<InboxViewer>("alex");
  const [epoch, setEpoch] = useState(0);
  return (
    <MemoryRouter initialEntries={["/inbox"]}>
      <StorybookAddressBar />
      <Box
        component="main"
        sx={{ mx: "auto", maxWidth: "md", minWidth: 0, overflowWrap: "anywhere", p: { xs: 2, sm: 3 } }}
      >
        <Stack spacing={3}>
          <Typography component="h1" variant="h4">
            Persisted inboxes versus feedback
          </Typography>
          <Alert severity="info">
            A private in-memory server retains records while you reload this preview client. A full browser reload
            resets the fixture. Database durability belongs to the real backend.
          </Alert>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              fullWidth
              label="Preview account"
              select
              slotProps={{ select: { native: true } }}
              value={viewer}
              onChange={event => {
                const next = event.target.value;
                if (next === "alex" || next === "sam") setViewer(next);
              }}
            >
              <option value="alex">Alex</option>
              <option value="sam">Sam</option>
            </TextField>
            <Button onClick={() => setEpoch(current => current + 1)} variant="outlined">
              Reload inbox client
            </Button>
          </Stack>
          <InboxClient
            key={`${viewer}:${epoch}`}
            server={server}
            viewer={viewer}
            ownership={scenario === "ownership"}
          />
        </Stack>
      </Box>
    </MemoryRouter>
  );
}

function InboxClient({
  server,
  viewer,
  ownership,
}: Readonly<{ server: Server; viewer: InboxViewer; ownership: boolean }>) {
  const [client] = useState(() => createAppQueryClient({ retry: () => false }));
  const [options] = useState(() => createInboxOptions(server.forActor(viewer), client, viewer));
  useEffect(
    () => () => {
      void client.cancelQueries();
      client.clear();
    },
    [client],
  );
  return (
    <QueryClientProvider client={client}>
      <Routes>
        <Route
          path="/inbox"
          element={<InboxView server={server} viewer={viewer} ownership={ownership} options={options} />}
        />
        <Route path="/requests/:id" element={<RelatedRequest />} />
      </Routes>
    </QueryClientProvider>
  );
}

function RelatedRequest() {
  const { id } = useParams();
  return (
    <Paper sx={{ p: 2 }} variant="outlined">
      <Stack spacing={2}>
        <Typography component="h2" variant="h6">
          Related request
        </Typography>
        <Typography>
          Addressed request: {id}. This link target is a navigation sketch; a real request page performs its own
          authorized read.
        </Typography>
        <Button component={Link} to="/inbox">
          Back to inbox
        </Button>
      </Stack>
    </Paper>
  );
}

function InboxView({
  server,
  viewer,
  ownership,
  options,
}: Readonly<{
  server: Server;
  viewer: InboxViewer;
  ownership: boolean;
  options: ReturnType<typeof createInboxOptions>;
}>) {
  const messages = useQuery(options.list());
  const unread = useQuery(options.unread());
  const mark = useMutation(options.markRead());
  const feedback = useRgoFeedback();
  const notificationId = useId();
  const { formatDateTime } = useAppLocalizationFormatters();
  const [search, setSearch] = useState("");
  const [failure, setFailure] = useState<string | null>(null);
  const [counts, setCounts] = useState(server.counts());
  const generation = useRef(0);
  const busy = useRef(false);
  useEffect(
    () => () => {
      generation.current += 1;
      feedback.dismiss(notificationId);
    },
    [feedback, notificationId],
  );
  const markRead = async (id: string) => {
    if (busy.current) return;
    busy.current = true;
    const owner = generation.current;
    setFailure(null);
    try {
      await mark.mutateAsync(id);
      if (owner !== generation.current) return;
      feedback.notify({ id: notificationId, message: "Notification marked as read.", severity: "success" });
    } catch (error) {
      if (owner === generation.current)
        setFailure(
          error instanceof InboxHiddenError
            ? "This notification is unavailable to the current account."
            : "The read marker could not be confirmed. Refresh or retry this idempotent action.",
        );
    } finally {
      if (owner === generation.current) {
        busy.current = false;
        setCounts(server.counts());
      }
    }
  };
  const rows = messages.data?.filter(row => row.message.toLowerCase().includes(search.toLowerCase())) ?? [];
  return (
    <Stack spacing={2}>
      <Typography component="h2" variant="h6">
        Inbox for {viewer === "alex" ? "Alex" : "Sam"}
      </Typography>
      <Typography role="status">Unread messages: {unread.data ?? "loading"}</Typography>
      <TextField fullWidth label="Search messages" value={search} onChange={event => setSearch(event.target.value)} />
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
        <Button
          onClick={() =>
            feedback.notify({
              id: "inbox-reference-feedback",
              durationMs: null,
              message: "This toast does not change inbox records.",
              severity: "info",
            })
          }
        >
          Show persistent toast
        </Button>
        <Button onClick={() => feedback.dismiss("inbox-reference-feedback")}>Dismiss example toast</Button>
        {ownership ? (
          <Button disabled={mark.isPending} onClick={() => void markRead(viewer === "alex" ? "sam-1" : "alex-1")}>
            Attempt another account’s read marker
          </Button>
        ) : null}
      </Stack>
      {failure ? <Alert severity="error">{failure}</Alert> : null}
      {messages.isPending ? <Typography role="status">Loading inbox…</Typography> : null}
      {messages.isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => void messages.refetch()}>
              Retry inbox read
            </Button>
          }
        >
          Inbox messages could not be loaded.
        </Alert>
      ) : null}
      {messages.isSuccess ? (
        <Paper variant="outlined">
          {rows.length ? (
            <List aria-label="Persisted inbox messages">
              {rows.map(row => (
                <ListItem key={row.id} divider sx={{ alignItems: "stretch", flexDirection: "column", gap: 1.5 }}>
                  <Stack direction="row" sx={{ alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                    <Typography component="h3" variant="subtitle1">
                      {row.message}
                    </Typography>
                    <Chip label={row.readAt === null ? "Unread" : "Read"} variant="outlined" size="small" />
                  </Stack>
                  <Typography color="text.secondary" variant="body2">
                    {formatDateTime(new Date(row.createdAt))}
                  </Typography>
                  <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
                    <Button component={Link} to={`/requests/${encodeURIComponent(row.requestId)}`}>
                      Open related request
                    </Button>
                    <Button
                      aria-label={`Mark ${row.message} as read`}
                      disabled={mark.isPending || row.readAt !== null}
                      onClick={() => void markRead(row.id)}
                    >
                      Mark as read
                    </Button>
                  </Stack>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography sx={{ p: 2 }}>No messages match this view.</Typography>
          )}
        </Paper>
      ) : null}
      <Typography data-testid="inbox-server-counts">
        Changed read markers: {counts.writes}; hidden-item rejections: {counts.rejected}.
      </Typography>
      <Typography color="text.secondary">
        Reload creates a fresh cache against the same private server. Account changes unmount the previous client. Toast
        lifetime and saved read state are independent.
      </Typography>
    </Stack>
  );
}
