import { Alert, Box, Button, List, ListItem, ListItemText, Paper, Stack, TextField, Typography } from "@mui/material";
import { QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState, useSyncExternalStore } from "react";

import { createAppQueryClient } from "@/app/data/query/createAppQueryClient";
import { createContactMutation } from "../../examples/Contacts/api/contact.mutation";
import { createContactQuery } from "../../examples/Contacts/api/contact.query";

import { createFeatureDataFixture, type FeatureDataScenario } from "./featureDataFixture";

function createPreview(scenario: FeatureDataScenario) {
  const fixture = createFeatureDataFixture(scenario);
  const queryClient = createAppQueryClient({ retry: () => false });
  return {
    fixture,
    queryClient,
    ContactQuery: createContactQuery(fixture.api),
    ContactMutation: createContactMutation(fixture.api, queryClient),
  };
}

type Preview = ReturnType<typeof createPreview>;
export type FeatureDataExampleProps = Readonly<{ scenario: FeatureDataScenario }>;

export function FeatureDataExample({ scenario }: FeatureDataExampleProps) {
  return <FeatureDataSession key={scenario} scenario={scenario} />;
}

function FeatureDataSession({ scenario }: FeatureDataExampleProps) {
  const [preview] = useState(() => createPreview(scenario));
  useEffect(
    () => () => {
      void preview.queryClient.cancelQueries();
      preview.fixture.cancelPending();
      preview.queryClient.clear();
    },
    [preview],
  );

  return (
    <QueryClientProvider client={preview.queryClient}>
      <FeatureDataWorkspace preview={preview} scenario={scenario} />
    </QueryClientProvider>
  );
}

function FeatureDataWorkspace({ preview, scenario }: Readonly<{ preview: Preview; scenario: FeatureDataScenario }>) {
  const [name, setName] = useState("Taylor Quinn");
  const [showCollection, setShowCollection] = useState(true);
  const mutation = useMutation(preview.ContactMutation.create());
  const events = useSyncExternalStore(preview.fixture.subscribe, preview.fixture.getEvents);

  const save = () => {
    mutation.mutate({
      name,
      email: "taylor@example.com",
      organization: "Example Studio",
      role: "Engineer",
      status: "ACTIVE",
    });
  };

  return (
    <Box component="main" sx={{ mx: "auto", maxWidth: "md", p: { xs: 2, sm: 3 } }}>
      <Stack spacing={3}>
        <Typography component="h1" variant="h4">
          Loading and saving feature data
        </Typography>
        <Alert severity="info">
          The real Contacts Query factories use a private in-memory API here. Nothing is stored or sent to a server.
          {scenario === "readFailure" ? " The first completed read fails; retry it." : ""}
          {scenario === "saveFailure" ? " The first save is rejected before any change; retry the same draft." : ""}
          {scenario === "cancellation" ? " Hide the collection during loading to cancel its obsolete read." : ""}
        </Alert>
        <Paper component="section" aria-label="Create a contact" sx={{ p: 2 }} variant="outlined">
          <Stack spacing={2}>
            <Typography component="h2" variant="h6">
              Save and refresh
            </Typography>
            <Typography>
              Edit the name, then save. Email, organization, role and status use fixed valid sample values. This small
              data-flow control is separate from the complete Entity forms tutorial.
            </Typography>
            <TextField
              disabled={mutation.isPending}
              label="Contact name"
              onChange={event => setName(event.target.value)}
              value={name}
            />
            <Button
              disabled={mutation.isPending || !name.trim() || name.trim().length > 100}
              onClick={save}
              sx={{ alignSelf: "flex-start" }}
              variant="contained"
            >
              {mutation.isPending ? "Saving contact…" : "Save contact"}
            </Button>
            {mutation.isPending ? <Typography role="status">Saving and refreshing the collection…</Typography> : null}
            {mutation.isError ? (
              <Alert severity="error">
                The simulated write was rejected before committing. Your draft is unchanged; retry Save contact.
              </Alert>
            ) : null}
            {mutation.isSuccess ? (
              <Alert severity="success">Saved contact: {mutation.data.name}. The collection was invalidated.</Alert>
            ) : null}
          </Stack>
        </Paper>
        <Paper component="section" aria-labelledby="contact-collection-title" sx={{ p: 2 }} variant="outlined">
          <Stack spacing={2}>
            <Typography component="h2" id="contact-collection-title" variant="h6">
              Contact collection
            </Typography>
            <Button
              onClick={() => setShowCollection(value => !value)}
              sx={{ alignSelf: "flex-start" }}
              variant="outlined"
            >
              {showCollection ? "Hide collection" : "Show collection"}
            </Button>
            {showCollection ? (
              <ContactCollection preview={preview} />
            ) : (
              <Typography role="status">Collection observer unmounted. Any unfinished read is obsolete.</Typography>
            )}
          </Stack>
        </Paper>
        <Paper component="section" aria-labelledby="data-activity-title" sx={{ p: 2 }} variant="outlined">
          <Typography component="h2" id="data-activity-title" variant="h6">
            Data activity
          </Typography>
          <Box component="ol" aria-live="polite" sx={{ mb: 0, pl: 3 }}>
            {events.map((event, index) => (
              <li key={`${index}-${event}`}>{event}</li>
            ))}
          </Box>
        </Paper>
      </Stack>
    </Box>
  );
}

function ContactCollection({ preview }: Readonly<{ preview: Preview }>) {
  const query = useQuery(preview.ContactQuery.findAll());
  if (query.isPending) return <Typography role="status">Loading contacts…</Typography>;
  if (query.isError && !query.data) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" onClick={() => void query.refetch()}>
            Retry loading
          </Button>
        }
      >
        Contacts could not be loaded.
      </Alert>
    );
  }
  return (
    <Stack spacing={1}>
      {query.isError ? (
        <Alert severity="warning">The latest refresh failed. Previously loaded contacts are still shown.</Alert>
      ) : null}
      <Typography role="status">
        {query.isFetching ? "Refreshing contacts…" : `${query.data?.length ?? 0} contacts loaded.`}
      </Typography>
      {query.data?.length ? (
        <List aria-label="Loaded contacts" disablePadding>
          {query.data.map(contact => (
            <ListItem disableGutters key={contact.id}>
              <ListItemText primary={contact.name} secondary={`${contact.email} · ${contact.organization}`} />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography>No contacts yet. Save a contact to populate this collection.</Typography>
      )}
      <Button disabled={query.isFetching} onClick={() => void query.refetch()} sx={{ alignSelf: "flex-start" }}>
        Refresh collection
      </Button>
    </Stack>
  );
}
