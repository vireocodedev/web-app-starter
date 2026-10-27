import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { AppInvalidCredentialsError } from "@/app/auth/api/appAuth.api";
import { AppAuthProvider } from "@/app/auth/components/AppAuthProvider";
import { useAppAuth } from "@/app/auth/hooks/useAppAuth";
import { appHttpErrorMessageKey, decodeAppHttpError } from "@/app/data/http/appHttpError";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";

import {
  createAuthenticationFixture,
  exampleCredentials,
  privateSampleKey,
  type AuthenticationScenario,
} from "./authenticationFixture";

type Preview = ReturnType<typeof createAuthenticationFixture>;
export type AuthenticationAndHttpExampleProps = Readonly<{ scenario: AuthenticationScenario }>;

export function AuthenticationAndHttpExample({ scenario }: AuthenticationAndHttpExampleProps) {
  return <AuthenticationSession key={scenario} scenario={scenario} />;
}

function AuthenticationSession({ scenario }: AuthenticationAndHttpExampleProps) {
  const [preview] = useState(() => createAuthenticationFixture(scenario));
  const [username, setUsername] = useState<string>(exampleCredentials.username);
  const [password, setPassword] = useState<string>(
    scenario === "invalidCredentials" ? "wrong-example" : exampleCredentials.password,
  );
  const events = useSyncExternalStore(preview.subscribe, preview.getEvents);
  const counts = preview.getCounts();
  useEffect(() => () => preview.dispose(), [preview]);
  return (
    <QueryClientProvider client={preview.queryClient}>
      <Box component="main" sx={{ mx: "auto", maxWidth: "md", p: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          <Typography component="h1" variant="h4">
            Authentication and HTTP integration
          </Typography>
          <Alert severity="info">
            The installed session client, runtime and provider use a private simulated Axios transport. No network,
            cookie, credentials store or application session is touched. All credentials below are synthetic examples.
          </Alert>
          <Paper component="section" aria-label="Synthetic credentials" variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Typography component="h2" variant="h6">
                Synthetic credentials
              </Typography>
              <TextField
                label="Example username"
                value={username}
                onChange={event => setUsername(event.target.value)}
              />
              <TextField
                label="Example password"
                type="password"
                autoComplete="off"
                value={password}
                onChange={event => setPassword(event.target.value)}
              />
              <Typography>
                The accepted example is alex / storybook-example. These controls explain transport behavior; the
                application LoginForm uses useRgoForm and its credentials schema.
              </Typography>
              <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap" }} spacing={1}>
                <Button
                  onClick={() => {
                    setUsername(exampleCredentials.username);
                    setPassword(exampleCredentials.password);
                  }}
                >
                  Use valid example credentials
                </Button>
                {scenario === "unavailable" || scenario === "csrfFailure" ? (
                  <Button onClick={preview.repair}>Repair simulated server</Button>
                ) : null}
              </Stack>
            </Stack>
          </Paper>
          <AppAuthProvider runtime={preview.auth}>
            <AuthenticationControls preview={preview} username={username} password={password} />
          </AppAuthProvider>
          <Paper component="section" aria-label="HTTP activity" variant="outlined" sx={{ p: 2 }}>
            <Typography component="h2" variant="h6">
              HTTP activity
            </Typography>
            <Typography data-testid="auth-request-counts">
              Login POSTs: {counts.loginPosts}. Protected writes: {counts.protectedWrites}.
            </Typography>
            <Box component="ol" aria-label="Request sequence" sx={{ pl: 3, mb: 0, overflowWrap: "anywhere" }}>
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

function AuthenticationControls({
  preview,
  username,
  password,
}: Readonly<{ preview: Preview; username: string; password: string }>) {
  const auth = useAppAuth();
  const { t } = useAppTranslation();
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<{ severity: "success" | "error"; message: string } | null>(null);
  const commandGeneration = useRef(0);
  useEffect(
    () => () => {
      commandGeneration.current += 1;
    },
    [],
  );
  const sample = useQuery({ queryKey: privateSampleKey, queryFn: () => "Private sample for Alex", enabled: false });
  const execute = async (command: () => Promise<unknown>, success: string) => {
    const generation = ++commandGeneration.current;
    setPending(true);
    setFeedback(null);
    try {
      await command();
      if (generation === commandGeneration.current) setFeedback({ severity: "success", message: success });
    } catch (error) {
      const key =
        error instanceof AppInvalidCredentialsError
          ? "authentication.invalidCredentials"
          : appHttpErrorMessageKey(decodeAppHttpError(error));
      if (generation === commandGeneration.current)
        setFeedback({ severity: "error", message: t(key ?? "authentication.signInFailed") });
    } finally {
      if (generation === commandGeneration.current) setPending(false);
    }
  };
  return (
    <Paper component="section" aria-label="Session controls" variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Typography component="h2" variant="h6">
          Session controls
        </Typography>
        <Typography role="status">
          Session: {auth.status}
          {auth.user ? ` · ${auth.user.displayName}` : ""}
        </Typography>
        <Typography data-testid="private-cache-state">Private sample: {sample.data ?? "cleared"}.</Typography>
        <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap" }} spacing={1}>
          {auth.status === "anonymous" ? (
            <Button
              variant="contained"
              disabled={pending || !username.trim() || !password}
              onClick={() => void execute(() => auth.login({ username, password }), "Login accepted.")}
            >
              Sign in example
            </Button>
          ) : null}
          {auth.status === "authenticated" ? (
            <>
              <Button
                disabled={pending}
                onClick={() => preview.queryClient.setQueryData(privateSampleKey, "Private sample for Alex")}
              >
                Cache private sample
              </Button>
              <Button
                disabled={pending}
                onClick={() =>
                  void execute(() => preview.http.post("/tutorial/change"), "Protected change acknowledged.")
                }
              >
                Save protected change
              </Button>
              <Button
                disabled={pending}
                onClick={() => void execute(() => preview.http.get("/tutorial/protected"), "Protected read completed.")}
              >
                Read protected resource
              </Button>
              <Button
                disabled={pending || auth.isLoggingOut}
                onClick={() => void execute(auth.logout, "Logout acknowledged.")}
              >
                Sign out example
              </Button>
            </>
          ) : null}
        </Stack>
        {pending ? <Typography role="status">Request in progress…</Typography> : null}
        {feedback ? <Alert severity={feedback.severity}>{feedback.message}</Alert> : null}
        <Typography>
          On identity change the real provider remounts this section and clears private Query data. Credential controls
          and the activity log live above that boundary.
        </Typography>
      </Stack>
    </Paper>
  );
}
