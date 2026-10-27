import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { createSignalPersistenceFixture } from "./signalPersistenceFixture";

export type SignalsAndPersistenceExampleProps = Readonly<{ scenario: "overview" | "failure" | "disposed" }>;

function SignalScenario({ scenario }: SignalsAndPersistenceExampleProps) {
  const [model] = useState(() => createSignalPersistenceFixture(scenario));
  useEffect(() => {
    model.initialize();
    return model.dispose;
  }, [model]);

  return (
    <Box component="main" sx={{ mx: "auto", maxWidth: "md", minWidth: 0, p: { xs: 2, sm: 3 } }}>
      <Stack spacing={3}>
        <Typography component="h1" variant="h4">
          Signals and persistence in practice
        </Typography>
        <Alert severity="info">
          This private preview starts from 4 saved hours at a rate of 90. It does not read or write application storage.
        </Alert>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Estimate hours"
                type="number"
                value={model.hours.value}
                onChange={event => model.setHours(Number(event.target.value))}
              />
              <TextField
                label="Hourly rate"
                type="number"
                value={model.hourlyRate.value}
                onChange={event => model.setHourlyRate(Number(event.target.value))}
              />
            </Stack>
            <Typography data-testid="signal-total">Computed total: {model.total.value}</Typography>
            <Typography data-testid="signal-status">
              Persistence: {model.status.value}; effect: {model.active.value ? "active" : "disposed"}; successful
              writes: {model.writes.value}
            </Typography>
            <Typography
              component="pre"
              data-testid="signal-stored"
              sx={{ m: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}
            >
              Stored source: {model.stored.value}
            </Typography>
            {model.status.value === "unavailable" && (
              <Alert severity="warning">
                The live estimate remains usable. Changes are not retained until a source update succeeds; restart
                restores the last saved value.
              </Alert>
            )}
            {!model.active.value && (
              <Alert severity="warning">
                Persistence is disposed. Editing changes the live total without changing saved source values.
              </Alert>
            )}
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
              <Button onClick={model.applyBatch}>Apply batched estimate</Button>
              <Button onClick={() => model.setHours(-5)}>Normalize negative hours</Button>
              <Button onClick={model.dispose}>Dispose persistence</Button>
              <Button onClick={model.restart}>Restart from saved state</Button>
              <Button onClick={model.corruptAndRestart}>Load invalid stored data</Button>
              {model.unavailable.value && <Button onClick={model.recoverStorage}>Restore storage and restart</Button>}
            </Stack>
          </Stack>
        </Paper>
        <Box component="section" aria-label="Signal lifecycle activity">
          <Typography component="h2" variant="h6">
            Lifecycle activity
          </Typography>
          <Box component="ol" sx={{ pl: 3, overflowWrap: "anywhere" }}>
            {model.events.value.map((message, index) => (
              <li key={`${index}-${message}`}>{message}</li>
            ))}
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}

export function SignalsAndPersistenceExample(props: SignalsAndPersistenceExampleProps) {
  return <SignalScenario key={props.scenario} {...props} />;
}
