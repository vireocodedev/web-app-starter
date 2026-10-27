import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useId, useRef, useState } from "react";

import { observeContactBoundary, type BoundaryObservation, type TestingScenario } from "./testingFixture";

export type TestingAFeatureExampleProps = Readonly<{ initialScenario: TestingScenario }>;

const scenarios = [
  { value: "schema", label: "Schema normalization and rejection" },
  { value: "accepted-write", label: "Accepted write and scoped invalidation" },
  { value: "rejected-write", label: "Rejected write and forbidden effects" },
] as const;

export function TestingAFeatureExample(props: TestingAFeatureExampleProps) {
  return <TestingSession key={props.initialScenario} {...props} />;
}

function TestingSession({ initialScenario }: TestingAFeatureExampleProps) {
  const [scenario, setScenario] = useState(initialScenario);
  const [observations, setObservations] = useState<readonly BoundaryObservation[]>([]);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [runs, setRuns] = useState(0);
  const active = useRef(false);
  const selectorId = useId();
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const run = async () => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    setObservations([]);
    try {
      const next = await observeContactBoundary(scenario);
      if (active.current) {
        setObservations(next);
        setRuns(count => count + 1);
      }
    } catch {
      if (active.current) setFailed(true);
    } finally {
      if (active.current) setBusy(false);
    }
  };
  return (
    <Box
      component="main"
      sx={{ mx: "auto", maxWidth: "md", minWidth: 0, overflowWrap: "anywhere", p: { xs: 2, sm: 3 } }}
    >
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Typography component="h1" variant="h4">
            Testing a feature
          </Typography>
          <Typography>
            Choose a contract, exercise the real boundary, and inspect intended and forbidden outcomes.
          </Typography>
        </Stack>
        <Alert severity="info">
          This preview runs the real Contact schema and mutation factory with a fresh private cache and synthetic port.
          It displays observations; it does not run Vitest, browser tests or repository verification. Open Docs for the
          executable test recipes.
        </Alert>
        <TextField
          disabled={busy}
          fullWidth
          id={selectorId}
          label="Testing scenario"
          onChange={event => {
            const next = scenarios.find(item => item.value === event.target.value);
            if (next) setScenario(next.value);
            setObservations([]);
            setFailed(false);
          }}
          select
          slotProps={{ select: { native: true } }}
          value={scenario}
        >
          {scenarios.map(item => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </TextField>
        <Button disabled={busy} onClick={() => void run()} sx={{ alignSelf: "flex-start" }} variant="contained">
          {busy ? "Observing boundary…" : "Run boundary example"}
        </Button>
        {failed ? (
          <Alert severity="error">The boundary example could not complete. No successful result is claimed.</Alert>
        ) : null}
        <Paper component="section" aria-label="Boundary observations" sx={{ p: 2 }} variant="outlined">
          <Stack spacing={2}>
            <Typography component="h2" variant="h6">
              Observed outcomes
            </Typography>
            <Typography role="status">Completed examples: {runs}</Typography>
            {observations.length ? (
              <Box component="ul" sx={{ m: 0, pl: 3 }}>
                {observations.map(item => (
                  <Box component="li" key={item.label} sx={{ mb: 1 }}>
                    <Typography>
                      {item.satisfied ? "Satisfied" : "Mismatch"}: {item.label}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      Observed: {item.observed}
                    </Typography>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography color="text.secondary">Run an example to inspect its outcomes.</Typography>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
