import { Alert, Box, Button, Link, MenuItem, Paper, Stack, TextField, Typography, useMediaQuery } from "@mui/material";
import { RgoDesktopTable, type TableColumnDef } from "@rgo-web/frontend";
import { useState } from "react";

import { useAppAccessibilityPreferences } from "@/app/theme/preferences/useAppAccessibilityPreferences";
import { useAppColorScheme } from "@/app/theme/preferences/useAppColorScheme";
import { useAppDisplayPreferences } from "@/app/theme/preferences/useAppDisplayPreferences";
import type { AppDesktopTableSize, AppEditorPresentation } from "@/app/theme/themeSetup";

type WorkItem = Readonly<{ id: string; name: string }>;
const rows: readonly WorkItem[] = [
  { id: "atlas", name: "Atlas migration" },
  { id: "beacon", name: "Beacon rollout" },
];
const columns: readonly TableColumnDef<WorkItem>[] = [
  { id: "name", header: "Project", rowHeader: true, renderCell: ({ row }) => row.name },
];

export type SettingsAwareComponentsExampleProps = Readonly<{
  scenario: "overview" | "display" | "fixed";
}>;

/** Reads the installed global providers; all comparison controls are local presentation inputs. */
export function SettingsAwareComponentsExample({ scenario }: SettingsAwareComponentsExampleProps) {
  const display = useAppDisplayPreferences();
  const accessibility = useAppAccessibilityPreferences();
  const { mode } = useAppColorScheme();
  const osReducesMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const reduceCustomMotion = accessibility.motion === "reduce" || osReducesMotion;
  const [densityOverride, setDensityOverride] = useState<AppDesktopTableSize | "application">("application");
  const [editorOverride, setEditorOverride] = useState<AppEditorPresentation | "application">("application");
  const [draft, setDraft] = useState("Keep my draft");
  const [attempted, setAttempted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const density = densityOverride === "application" ? display.desktopTableSize : densityOverride;
  const presentation = editorOverride === "application" ? display.editorPresentation : editorOverride;

  return (
    <Box component="main" sx={{ mx: "auto", maxWidth: 1000, minWidth: 0, p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2}>
        <Typography component="h1" variant="h4">
          Components that respect application settings
        </Typography>
        <Typography color="text.secondary">
          The effective settings below come from the real application hooks. The global Theme toolbar changes these
          surfaces and preserves the draft. Local comparison controls change only this preview.
        </Typography>
        <Paper component="section" aria-label="Effective application settings" sx={{ p: 2 }} variant="outlined">
          <Typography component="h2" variant="h6">
            Effective application settings
          </Typography>
          <Box
            component="dl"
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 1,
              m: 0,
              "& dd": { m: 0, overflowWrap: "anywhere" },
            }}
          >
            <Typography component="dt">Theme</Typography>
            <Typography component="dd" data-testid="effective-theme">
              {mode ?? "resolving"}
            </Typography>
            <Typography component="dt">Table density</Typography>
            <Typography component="dd">{display.desktopTableSize}</Typography>
            <Typography component="dt">Editor presentation</Typography>
            <Typography component="dd">{display.editorPresentation}</Typography>
            <Typography component="dt">Font size</Typography>
            <Typography component="dd">{display.fontSize}</Typography>
            <Typography component="dt">Increased contrast</Typography>
            <Typography component="dd" data-testid="effective-contrast">
              {String(display.increasedContrast)}
            </Typography>
            <Typography component="dt">Surface radius</Typography>
            <Typography component="dd">{display.surfaceBorderRadius}px</Typography>
            <Typography component="dt">Motion preference</Typography>
            <Typography component="dd">{accessibility.motion}</Typography>
            <Typography component="dt">Content link underlines</Typography>
            <Typography component="dd">{accessibility.linkUnderlines}</Typography>
          </Box>
        </Paper>
        {scenario !== "fixed" ? (
          <>
            <Typography component="h2" variant="h6">
              Local presentation comparison
            </Typography>
            <Alert severity="info">
              These selectors supply local props. They do not change Settings, save preferences or replace the global
              theme. Editor panels below are inline layout sketches; real Contacts opens an owned RGO overlay session.
            </Alert>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                label="Local table density"
                select
                value={densityOverride}
                onChange={event => setDensityOverride(event.target.value as AppDesktopTableSize | "application")}
              >
                <MenuItem value="application">Follow application</MenuItem>
                <MenuItem value="small">Small</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="Local editor layout"
                select
                value={editorOverride}
                onChange={event => setEditorOverride(event.target.value as AppEditorPresentation | "application")}
              >
                <MenuItem value="application">Follow application</MenuItem>
                <MenuItem value="dialog">Dialog</MenuItem>
                <MenuItem value="docked-panel">Docked panel</MenuItem>
                <MenuItem value="overlay-panel">Overlay panel</MenuItem>
              </TextField>
            </Stack>
            <Paper sx={{ minWidth: 0 }} variant="outlined">
              <RgoDesktopTable<WorkItem>
                columns={columns}
                emptyContent="No projects in this collection."
                getRowKey={row => row.id}
                mode="local"
                rows={rows}
                size={density}
                tableLabel="Settings-aware projects"
              />
            </Paper>
            <Box
              sx={{ display: "flex", justifyContent: presentation === "dialog" ? "center" : "flex-end", minWidth: 0 }}
            >
              <Paper
                component="section"
                aria-label="Local editor layout sketch"
                sx={{
                  width: "100%",
                  maxWidth: presentation === "dialog" ? "36rem" : "26rem",
                  p: 2,
                  bgcolor: presentation === "overlay-panel" ? "rgo.surfaceRaised" : "background.paper",
                }}
                variant="outlined"
              >
                <Stack spacing={2}>
                  <Typography component="h3" variant="h6">
                    Inline {presentation} sketch
                  </Typography>
                  <TextField
                    fullWidth
                    label="Draft title"
                    value={draft}
                    onChange={event => setDraft(event.target.value)}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Changing presentation inputs preserves the same controlled draft.
                  </Typography>
                </Stack>
              </Paper>
            </Box>
            <Paper
              component="section"
              aria-label="Semantic surface"
              sx={{ p: 2, borderColor: "divider", bgcolor: "rgo.surfaceSubtle", color: "text.primary" }}
              variant="outlined"
            >
              <Stack spacing={2}>
                <Typography component="h2" variant="h6">
                  Semantic surface and custom motion
                </Typography>
                <Typography>
                  Custom motion: {reduceCustomMotion ? "reduced" : "allowed"}. Status stays visible in either mode.
                </Typography>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <Box
                    aria-hidden
                    sx={{
                      width: "1rem",
                      height: "1rem",
                      borderRadius: "50%",
                      bgcolor: completed ? "success.main" : "action.disabled",
                      transform: completed ? "scale(1.15)" : "none",
                      transition: reduceCustomMotion ? "none" : "transform 150ms ease",
                    }}
                  />
                  <Typography role="status">{completed ? "Review complete" : "Review pending"}</Typography>
                </Box>
                <Button
                  sx={{ alignSelf: "flex-start" }}
                  variant="outlined"
                  onClick={() => setCompleted(current => !current)}
                >
                  Toggle review status
                </Button>
                <Typography variant="body2">
                  <Link href="#settings-component-notes">Read the component notes</Link>
                </Typography>
                <Typography id="settings-component-notes" variant="body2" color="text.secondary">
                  Text, borders, focus, links and status use semantic application tokens.
                </Typography>
              </Stack>
            </Paper>
          </>
        ) : (
          <Paper component="section" aria-label="Fixed settings contract" sx={{ p: 2 }} variant="outlined">
            <Stack spacing={2}>
              <Typography component="h2" variant="h6">
                Fixed false is still fixed
              </Typography>
              <Typography>
                Storybook fixes increased contrast to false. This calls the actual owning setter with true; its policy
                guard rejects the change before writing storage.
              </Typography>
              <Button
                onClick={() => {
                  display.setIncreasedContrast(true);
                  setAttempted(true);
                }}
                sx={{ alignSelf: "flex-start" }}
                variant="outlined"
              >
                Attempt fixed contrast change
              </Button>
              <Typography role="status">
                {attempted
                  ? `Setter attempted. Effective contrast remains ${String(display.increasedContrast)}.`
                  : "No setter attempt yet."}
              </Typography>
              <Alert severity="info">
                Settings hides fixed controls; the owning setter independently enforces policy. The global Theme toolbar
                remains the Storybook theme owner.
              </Alert>
            </Stack>
          </Paper>
        )}
      </Stack>
    </Box>
  );
}
