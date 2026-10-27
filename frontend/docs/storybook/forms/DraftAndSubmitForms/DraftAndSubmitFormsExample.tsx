import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { createMemoryRouter, Link, Outlet, RouterProvider, useNavigate } from "react-router";

import { StorybookAddressBar } from "../../routing/shared/StorybookAddressBar";
import { DraftAndSubmitForm } from "./DraftAndSubmitForm";
import { DraftCommandError, draftExampleMessages, type AcceptedDraft, type DraftCommand } from "./draftRequestModel";

export type DraftAndSubmitFormsExampleProps = Readonly<{
  scenario: "overview" | "save-failure" | "server-validation" | "navigation" | "uncertain";
}>;

function wait(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const abort = () => {
      window.clearTimeout(timer);
      reject(new DOMException("The private preview ended.", "AbortError"));
    };
    const timer = window.setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, 650);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
  });
}

function Editor({ scenario }: DraftAndSubmitFormsExampleProps) {
  const navigate = useNavigate();
  const owner = useRef<AbortController | null>(null);
  const attempts = useRef(0);
  const serverVersion = useRef(7);
  const [latestVersion, setLatestVersion] = useState(7);
  const [commands, setCommands] = useState<DraftCommand[]>([]);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [initial] = useState<AcceptedDraft>(() => ({
    version: 7,
    status: "DRAFT",
    values: {
      title: scenario === "navigation" ? "Office equipment" : "",
      category: "equipment",
      quantity: null,
      softwarePurpose: "",
    },
  }));

  useEffect(() => {
    const controller = new AbortController();
    owner.current = controller;
    return () => {
      controller.abort();
      if (owner.current === controller) owner.current = null;
    };
  }, []);

  const execute = async (command: DraftCommand): Promise<AcceptedDraft> => {
    const controller = owner.current;
    if (!controller) throw new Error("The preview has ended.");
    attempts.current += 1;
    setCommands(previous => [...previous, command]);
    await wait(controller.signal);
    if (scenario === "save-failure" && attempts.current === 1) throw new DraftCommandError("rejected");
    if (scenario === "server-validation" && attempts.current === 1) {
      throw new DraftCommandError("validation", [
        { field: "title", code: "notAvailable" },
        { field: "internalRole", code: "notAvailable" },
      ]);
    }
    if (command.expectedVersion !== serverVersion.current) throw new DraftCommandError("conflict");
    const result: AcceptedDraft = {
      version: ++serverVersion.current,
      status: command.intent === "draft" ? "DRAFT" : "SUBMITTED",
      values: command.values,
    };
    setLatestVersion(result.version);
    setAcceptedCount(count => count + 1);
    if (scenario === "uncertain") {
      // The synthetic server committed, but its acknowledgement never reached the editor.
      throw new Error("Synthetic acknowledgement lost after commit.");
    }
    return result;
  };

  return (
    <Stack spacing={2}>
      <DraftAndSubmitForm
        initial={initial}
        latestVersion={latestVersion}
        maximumEquipmentQuantity={20}
        execute={execute}
        onLogout={async () => {
          await navigate("/signed-out");
        }}
        t={key => draftExampleMessages[key]}
      />
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        <Button component={Link} to="/requests/sample?section=notes">
          Change query
        </Button>
        <Button component={Link} to="/requests">
          Leave editor
        </Button>
        <Button onClick={() => setLatestVersion(++serverVersion.current)}>Simulate background refresh</Button>
      </Box>
      <Typography role="status">
        Commands sent: {commands.length} · Accepted commands: {acceptedCount}
      </Typography>
      {commands.length ? (
        <Paper variant="outlined" sx={{ p: 2, minWidth: 0 }}>
          <Typography component="h2" variant="h6">
            Last attempted command
          </Typography>
          <Box
            component="pre"
            data-testid="draft-command"
            sx={{ fontSize: "0.8125rem", overflowWrap: "anywhere", whiteSpace: "pre-wrap", m: 0 }}
          >
            {JSON.stringify(commands.at(-1), null, 2)}
          </Box>
        </Paper>
      ) : null}
    </Stack>
  );
}

function Frame() {
  return (
    <Box sx={{ minWidth: 0 }}>
      <StorybookAddressBar />
      <Stack component="main" spacing={3} sx={{ mx: "auto", maxWidth: "md", p: { xs: 2, sm: 3 } }}>
        <Typography component="h1" variant="h4">
          Draft and submit forms
        </Typography>
        <Alert severity="info">
          Private simulation: commands wait 650 ms. No server, application storage or real logout is used.
        </Alert>
        <Outlet />
      </Stack>
    </Box>
  );
}

function Destination({ signedOut = false }: Readonly<{ signedOut?: boolean }>) {
  return (
    <Stack spacing={2}>
      <Typography>{signedOut ? "Preview logout completed." : "Request collection preview."}</Typography>
      <Button component={Link} to="/requests/sample" sx={{ alignSelf: "flex-start" }}>
        Open a fresh editor
      </Button>
    </Stack>
  );
}

function Session(props: DraftAndSubmitFormsExampleProps) {
  const [router] = useState(() =>
    createMemoryRouter(
      [
        {
          element: <Frame />,
          children: [
            { path: "/requests/sample", element: <Editor {...props} /> },
            { path: "/requests", element: <Destination /> },
            { path: "/signed-out", element: <Destination signedOut /> },
          ],
        },
      ],
      { initialEntries: ["/requests/sample"] },
    ),
  );
  useEffect(() => () => router.dispose(), [router]);
  return <RouterProvider router={router} />;
}

export function DraftAndSubmitFormsExample(props: DraftAndSubmitFormsExampleProps) {
  return <Session key={props.scenario} {...props} />;
}
