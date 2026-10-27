import { Alert, Box, Button, Chip, Paper, Stack, TextField, Typography } from "@mui/material";
import { MemoryRouter, useNavigate } from "react-router";

import { useAppQueryParams } from "@/app/router/hooks/useAppQueryParams";
import { searchParametersSchema } from "../../patterns/RoutingAndUrlState/models/SearchParameters";
import { StorybookAddressBar } from "../shared/StorybookAddressBar";

export type UrlBackedStateExampleProps = Readonly<{ scenario: "overview" | "invalid" | "history" }>;

function UrlControls() {
  const { values, set, setValues } = useAppQueryParams(searchParametersSchema);
  const navigate = useNavigate();

  return (
    <Box sx={{ minWidth: 0 }}>
      <StorybookAddressBar />
      <Stack component="main" spacing={3} sx={{ mx: "auto", maxWidth: "md", p: { xs: 2, sm: 3 } }}>
        <Typography component="h1" variant="h4">
          URL-backed state
        </Typography>
        <Alert severity="info">
          Search and status replace this history entry and reset the page atomically. Page buttons push a new entry. The
          unrelated campaign parameter survives every update.
        </Alert>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Search projects"
              value={values.q}
              onChange={event => setValues({ q: event.target.value, page: 1 }, { replace: true })}
            />
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
              {(["all", "active", "archived"] as const).map(status => (
                <Chip
                  key={status}
                  label={
                    status === "all" ? "All projects" : status === "active" ? "Active projects" : "Archived projects"
                  }
                  onClick={() => setValues({ status, page: 1 }, { replace: true })}
                  variant={values.status === status ? "filled" : "outlined"}
                  color={values.status === status ? "primary" : "default"}
                />
              ))}
            </Stack>
            <Typography data-testid="url-state">
              Search: {values.q || "(empty)"}; status: {values.status}; page: {values.page}
            </Typography>
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
              {[1, 2, 3].map(page => (
                <Button
                  key={page}
                  variant={values.page === page ? "contained" : "outlined"}
                  onClick={() => set("page", page)}
                >
                  Page {page}
                </Button>
              ))}
            </Stack>
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
              <Button
                onClick={() => {
                  void navigate(-1);
                }}
              >
                Back
              </Button>
              <Button
                onClick={() => {
                  void navigate(1);
                }}
              >
                Forward
              </Button>
              <Button onClick={() => setValues({ q: "", status: "all", page: 1 }, { replace: true })}>
                Reset URL fields
              </Button>
            </Stack>
          </Stack>
        </Paper>
        <Typography color="text.secondary">
          This preview renders the decoded route state, not a remote collection. Invalid fields use their own defaults;
          the initial URL is preserved until an explicit update canonicalizes owned fields.
        </Typography>
      </Stack>
    </Box>
  );
}

function UrlScenario({ scenario }: UrlBackedStateExampleProps) {
  const initialEntries =
    scenario === "history"
      ? ["/projects?campaign=guide", "/projects?campaign=guide&page=2", "/projects?campaign=guide&page=3"]
      : [
          scenario === "invalid"
            ? "/projects?q=Atlas&status=broken&page=-4&campaign=guide"
            : "/projects?status=active&page=3&campaign=guide",
        ];
  return (
    <MemoryRouter initialEntries={initialEntries} initialIndex={scenario === "history" ? 2 : 0}>
      <UrlControls />
    </MemoryRouter>
  );
}

export function UrlBackedStateExample(props: UrlBackedStateExampleProps) {
  return <UrlScenario key={props.scenario} {...props} />;
}
