/** Pure, application-owned layout and route-composition templates. */
const file = (path, content) => ({ path, content: `${content.trim()}\n` });
const role = (name, suffix) => (name.endsWith(suffix) ? name : `${name}${suffix}`);

function locations(context) {
  return {
    owner: `frontend/src/features/${context.feature.kebab}`,
    publicImport: `@/features/${context.feature.kebab}`,
    pageOwner: `frontend/src/pages/${context.feature.kebab}`,
    pageImport: `@/pages/${context.feature.kebab}`,
    key: `generated.${context.translationId}`,
    locale: `frontend/src/app/localization/translations/generated/${context.translationId}`,
    example: kind =>
      `frontend/src/pages/development-guide/generated/${kind}/${context.feature.kebab}--${context.name.kebab}.example.tsx`,
  };
}

function locales(context) {
  const { locale } = locations(context);
  const english = {
    title: context.name.title,
    navigation: "Workspace navigation",
    pages: "Workspace pages",
    choosePage: "Choose page: {{page}}",
    close: "Close navigation",
    loading: "Loading workspace…",
    empty: "Nothing to show yet.",
    error: "This workspace could not be loaded.",
    retry: "Try again",
    overview: "Overview",
    workspace: "Workspace",
    settings: "Settings",
    records: "Records",
    activity: "Activity",
    details: "Details",
    summary: "A focused place to review progress, coordinate work and follow the details.",
    metricProgress: "In progress",
    metricCompleted: "Completed",
    metricAttention: "Needs attention",
    activityTitle: "Recent activity",
    secondaryTitle: "Next steps",
    sampleActivity: "Workspace reviewed",
    sampleActivityDetail: "The latest updates are ready for review.",
    sampleTime: "Today",
    sampleNext: "Review open records and coordinate the next delivery.",
    metadataOwner: "Owner",
    metadataOwnerValue: "Delivery team",
    metadataUpdated: "Updated",
    status: "Active",
    detailSummary: "The detail view keeps the primary record beside supporting context.",
    mainTitle: "Record summary",
    mainContent: "Use this area for the record's main information, an editor or a related collection.",
    asideTitle: "Supporting context",
    asideContent: "Ownership, related records and next steps stay close to the work.",
    overviewContent:
      "Track the current work across this space. Open Workspace to explore its left navigation and deeper records.",
    recordsContent:
      "This index and the Details child share a Records parent. The sidebar and Workspace header tab stay active on the deeper page.",
    activityContent:
      "Recent changes and acknowledged outcomes belong here. Connect the application's own read model when adopting this template.",
    settingsContent:
      "Place workspace-specific controls here. Application appearance and language remain in the existing Settings area.",
    openDetails: "Open record details",
    backToRecords: "Back to records",
    action: "Review workspace",
    actionDone: "Workspace reviewed.",
  };
  const croatian = {
    title: context.name.title,
    navigation: "Navigacija radnog prostora",
    pages: "Stranice radnog prostora",
    choosePage: "Odaberi stranicu: {{page}}",
    close: "Zatvori navigaciju",
    loading: "Učitavanje radnog prostora…",
    empty: "Još nema sadržaja.",
    error: "Radni prostor nije moguće učitati.",
    retry: "Pokušaj ponovno",
    overview: "Pregled",
    workspace: "Radni prostor",
    settings: "Postavke",
    records: "Zapisi",
    activity: "Aktivnosti",
    details: "Detalji",
    summary: "Jedno mjesto za pregled napretka, usklađivanje rada i praćenje detalja.",
    metricProgress: "U tijeku",
    metricCompleted: "Dovršeno",
    metricAttention: "Zahtijeva pažnju",
    activityTitle: "Nedavne aktivnosti",
    secondaryTitle: "Sljedeći koraci",
    sampleActivity: "Radni prostor je pregledan",
    sampleActivityDetail: "Najnovija ažuriranja spremna su za pregled.",
    sampleTime: "Danas",
    sampleNext: "Pregledajte otvorene zapise i uskladite sljedeću isporuku.",
    metadataOwner: "Vlasnik",
    metadataOwnerValue: "Tim za isporuku",
    metadataUpdated: "Ažurirano",
    status: "Aktivno",
    detailSummary: "Detaljni prikaz povezuje glavni zapis s dodatnim kontekstom.",
    mainTitle: "Sažetak zapisa",
    mainContent: "Ovdje prikažite glavne podatke zapisa, uređivač ili povezanu zbirku.",
    asideTitle: "Dodatni kontekst",
    asideContent: "Vlasništvo, povezani zapisi i sljedeći koraci ostaju uz glavni sadržaj.",
    overviewContent: "Pratite rad u ovom prostoru. Otvorite Radni prostor za bočnu navigaciju i detaljnije zapise.",
    recordsContent:
      "Ovaj pregled i podstranica Detalji dijele nadređenu rutu Zapisi. Bočna navigacija i kartica Radni prostor ostaju aktivne na dubljoj stranici.",
    activityContent:
      "Ovdje pripadaju nedavne promjene i potvrđeni ishodi. Pri prilagodbi povežite vlastiti model čitanja aplikacije.",
    settingsContent:
      "Ovdje smjestite postavke radnog prostora. Izgled i jezik aplikacije ostaju u postojećim Postavkama.",
    openDetails: "Otvori detalje zapisa",
    backToRecords: "Natrag na zapise",
    action: "Pregledaj radni prostor",
    actionDone: "Radni prostor je pregledan.",
  };
  return [
    file(`${locale}.en.ts`, `export const translations = ${JSON.stringify(english, null, 2)} as const;`),
    file(
      `${locale}.hr.ts`,
      `import type { StringLeaves } from "../../types/TranslationShape";
import type { translations as english } from "./${context.translationId}.en";
export const translations = ${JSON.stringify(croatian, null, 2)} as const satisfies StringLeaves<typeof english>;`,
    ),
  ];
}

function workspaceComponent(context, component) {
  const { owner, key } = locations(context);
  return file(
    `${owner}/components/${component}.tsx`,
    `import { Box, Stack, Typography } from "@mui/material";
import { useState, type ReactNode } from "react";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { AppPageNavigation, type AppPageNavigationLink } from "@/app/shell/components/AppPageNavigation";

export type ${component}Props = Readonly<{
  title?: ReactNode;
  summary?: ReactNode;
  actions?: ReactNode;
  links: readonly AppPageNavigationLink[];
  children: ReactNode;
  footer?: ReactNode;
}>;

/** Feature-local navigation; AppShell retains the application header and section tabs. */
export function ${component}({ title, summary, actions, links, children, footer }: ${component}Props) {
  const { t } = useAppTranslation();
  const [container, setContainer] = useState<HTMLElement | null>(null);
  return <Stack spacing={3} ref={setContainer} sx={{ containerType: "inline-size", width: "100%", minWidth: 0 }}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { sm: "flex-start" } }}>
      <Box sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
        <Typography component="h2" variant="h5">{title ?? t("${key}.title")}</Typography>
        {summary ? <Typography color="text.secondary" sx={{ mt: 1 }}>{summary}</Typography> : null}
      </Box>
      {actions ? <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", flexShrink: 0 }}>{actions}</Stack> : null}
    </Stack>
    <Box sx={{ display: "grid", gap: 3, minWidth: 0, "@container (min-width: 900px)": { gridTemplateColumns: "248px minmax(0, 1fr)", alignItems: "start" } }}>
      <AppPageNavigation container={container} links={links} footer={footer} labels={{
        navigation: t("${key}.navigation"), pages: t("${key}.pages"),
        choosePage: page => t("${key}.choosePage", { page }), close: t("${key}.close"),
      }} />
      <Box sx={{ minWidth: 0, overflowWrap: "anywhere" }}>{children}</Box>
    </Box>
  </Stack>;
}`,
  );
}

function workspaceExample(context, component) {
  const { publicImport, example, key } = locations(context);
  return file(
    example("shell"),
    `import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import { Alert, Button, Paper, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { useLocation } from "react-router";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { ${component} } from "${publicImport}";

export function Component() {
  const { t } = useAppTranslation();
  const { pathname } = useLocation();
  const [reviewed, setReviewed] = useState(false);
  return <${component} summary={t("${key}.summary")}
    links={[{ Icon: DashboardOutlinedIcon, label: t("${key}.overview"), to: pathname }]}
    actions={<Button variant="contained" onClick={() => setReviewed(true)}>{t("${key}.action")}</Button>}
    footer={<Typography color="text.secondary" variant="body2" sx={{ mt: 3, px: 2 }}>{t("${key}.sampleNext")}</Typography>}
  >
    <Stack spacing={2}>
      {reviewed ? <Alert severity="success" onClose={() => setReviewed(false)}>{t("${key}.actionDone")}</Alert> : null}
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}><Typography component="h3" variant="h6">{t("${key}.mainTitle")}</Typography><Typography sx={{ mt: 1 }}>{t("${key}.mainContent")}</Typography></Paper>
      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}><Typography component="h3" variant="h6">{t("${key}.asideTitle")}</Typography><Typography sx={{ mt: 1 }}>{t("${key}.asideContent")}</Typography></Paper>
    </Stack>
  </${component}>;
}`,
  );
}

function contentComponent(context, component, variant) {
  const { owner, key } = locations(context);
  const dashboard = variant === "dashboard";
  return file(
    `${owner}/components/${component}.tsx`,
    `import { Alert, Box, Button, ${dashboard ? "Divider" : "Chip"}, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";

${
  dashboard
    ? `export type ${component}Metric = Readonly<{ id: string; label: string; value: ReactNode; description?: string }>;
export type ${component}Activity = Readonly<{ id: string; title: string; description?: string; time?: string }>;`
    : `export type ${component}Metadata = Readonly<{ id: string; label: string; value: ReactNode }>;`
}
export type ${component}Props = Readonly<{
  title?: ReactNode;
  summary?: ReactNode;
  actions?: ReactNode;
  state?: "ready" | "loading" | "empty" | "error";
  onRetry?: () => void;
  children?: ReactNode;
  ${
    dashboard
      ? `metrics: readonly ${component}Metric[];
  activity: readonly ${component}Activity[];
  secondary?: ReactNode;`
      : `metadata: readonly ${component}Metadata[];
  status?: string;
  aside?: ReactNode;`
  }
}>;

/** The caller owns data, formatting, actions and recovery; this component owns presentation. */
export function ${component}({ title, summary, actions, state = "ready", onRetry, children, ${dashboard ? "metrics, activity, secondary" : "metadata, status, aside"} }: ${component}Props) {
  const { t } = useAppTranslation();
  return <Stack spacing={3} sx={{ minWidth: 0, width: "100%", containerType: "inline-size" }}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { sm: "flex-start" } }}>
      <Box sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
        <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <Typography component="h2" variant="h4">{title ?? t("${key}.title")}</Typography>
          ${dashboard ? "" : `{status ? <Chip label={status} color="success" size="small" /> : null}`}
        </Stack>
        {summary ? <Typography color="text.secondary" sx={{ mt: 1, maxWidth: "70ch" }}>{summary}</Typography> : null}
      </Box>
      {actions ? <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", flexShrink: 0 }}>{actions}</Stack> : null}
    </Stack>
    {state === "loading" ? <Stack role="status" spacing={2}><LinearProgress aria-label={t("${key}.loading")} /><Typography>{t("${key}.loading")}</Typography></Stack> : null}
    {state === "empty" ? <Alert severity="info">{t("${key}.empty")}</Alert> : null}
    {state === "error" ? <Alert severity="error" action={onRetry ? <Button color="inherit" onClick={onRetry}>{t("${key}.retry")}</Button> : undefined}>{t("${key}.error")}</Alert> : null}
    {state === "ready" ? <>
      ${
        dashboard
          ? `<Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "minmax(0, 1fr)", "@container (min-width: 500px)": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }, "@container (min-width: 900px)": { gridTemplateColumns: "repeat(3, minmax(0, 1fr))" } }}>
        {metrics.map(metric => <Paper key={metric.id} variant="outlined" sx={{ p: 2.5, minWidth: 0, overflowWrap: "anywhere" }}>
          <Typography variant="body2" color="text.secondary">{metric.label}</Typography>
          <Typography component="div" variant="h3" sx={{ mt: 1 }}>{metric.value}</Typography>
          {metric.description ? <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{metric.description}</Typography> : null}
        </Paper>)}
      </Box>
      <Box sx={{ display: "grid", gap: 3, minWidth: 0, "@container (min-width: 900px)": { gridTemplateColumns: secondary ? "minmax(0, 2fr) minmax(0, 1fr)" : "minmax(0, 1fr)" } }}>
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, minWidth: 0 }}>
          <Typography component="h3" variant="h6">{t("${key}.activityTitle")}</Typography>
          {activity.length === 0 ? <Typography color="text.secondary" sx={{ mt: 2 }}>{t("${key}.empty")}</Typography> : <Stack component="ul" divider={<Divider component="li" aria-hidden="true" />} sx={{ p: 0, m: 0, listStyle: "none" }}>
            {activity.map(item => <Box component="li" key={item.id} sx={{ py: 2, overflowWrap: "anywhere" }}><Typography sx={{ fontWeight: 600 }}>{item.title}</Typography>{item.description ? <Typography color="text.secondary" variant="body2">{item.description}</Typography> : null}{item.time ? <Typography color="text.secondary" variant="caption">{item.time}</Typography> : null}</Box>)}
          </Stack>}
          {children}
        </Paper>
        {secondary ? <Box component="aside" sx={{ minWidth: 0 }}>{secondary}</Box> : null}
      </Box>`
          : `<Paper component="dl" variant="outlined" sx={{ display: "grid", gap: 2, p: { xs: 2, sm: 3 }, m: 0, gridTemplateColumns: "minmax(0, 1fr)", "@container (min-width: 500px)": { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" } }}>
        {metadata.map(item => <Box key={item.id} sx={{ minWidth: 0, overflowWrap: "anywhere" }}><Typography component="dt" variant="body2" color="text.secondary">{item.label}</Typography><Typography component="dd" sx={{ m: 0, mt: 0.5 }}>{item.value}</Typography></Box>)}
      </Paper>
      <Box sx={{ display: "grid", gap: 3, minWidth: 0, "@container (min-width: 900px)": { gridTemplateColumns: aside ? "minmax(0, 2fr) minmax(0, 1fr)" : "minmax(0, 1fr)" } }}>
        <Box sx={{ minWidth: 0 }}>{children}</Box>
        {aside ? <Box component="aside" sx={{ minWidth: 0 }}>{aside}</Box> : null}
      </Box>`
      }
    </> : null}
  </Stack>;
}`,
  );
}

function contentExample(context, component, variant) {
  const { key, example, publicImport } = locations(context);
  const dashboard = variant === "dashboard";
  return file(
    example("page"),
    `import { Alert, Button, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { ${component}, type ${component}Props } from "${publicImport}";

export function Component() {
  const { t } = useAppTranslation();
  const { t: guide } = useDevelopmentGuideTranslation();
  const [state, setState] = useState<NonNullable<${component}Props["state"]>>("ready");
  const [reviewed, setReviewed] = useState(false);
  return <Stack spacing={3}>
    <TextField select label={guide("generatedExamples.state")} value={state} onChange={event => setState(event.target.value as NonNullable<${component}Props["state"]>)} sx={{ maxWidth: 320 }}>
      <MenuItem value="ready">{guide("generatedExamples.populated")}</MenuItem>
      <MenuItem value="loading">{guide("generatedExamples.loading")}</MenuItem>
      <MenuItem value="empty">{guide("generatedExamples.empty")}</MenuItem>
      <MenuItem value="error">{guide("generatedExamples.error")}</MenuItem>
    </TextField>
    {reviewed ? <Alert severity="success" onClose={() => setReviewed(false)}>{t("${key}.actionDone")}</Alert> : null}
    <${component} state={state} onRetry={() => setState("ready")} summary={t("${key}.${dashboard ? "summary" : "detailSummary"}")}
      actions={<Button variant="contained" onClick={() => setReviewed(true)}>{t("${key}.action")}</Button>}
      ${
        dashboard
          ? `metrics={[
        { id: "progress", label: t("${key}.metricProgress"), value: "24" },
        { id: "completed", label: t("${key}.metricCompleted"), value: "128" },
        { id: "attention", label: t("${key}.metricAttention"), value: "3" },
      ]}
      activity={[{ id: "review", title: t("${key}.sampleActivity"), description: t("${key}.sampleActivityDetail"), time: t("${key}.sampleTime") }]}
      secondary={<Paper variant="outlined" sx={{ p: 3 }}><Typography component="h3" variant="h6">{t("${key}.secondaryTitle")}</Typography><Typography sx={{ mt: 1 }}>{t("${key}.sampleNext")}</Typography></Paper>}`
          : `status={t("${key}.status")}
      metadata={[
        { id: "owner", label: t("${key}.metadataOwner"), value: t("${key}.metadataOwnerValue") },
        { id: "updated", label: t("${key}.metadataUpdated"), value: t("${key}.sampleTime") },
      ]}
      aside={<Paper variant="outlined" sx={{ p: 3 }}><Typography component="h3" variant="h6">{t("${key}.asideTitle")}</Typography><Typography sx={{ mt: 1 }}>{t("${key}.asideContent")}</Typography></Paper>}`
      }
    >${dashboard ? "" : `<Paper variant="outlined" sx={{ p: 3 }}><Typography component="h3" variant="h6">{t("${key}.mainTitle")}</Typography><Typography sx={{ mt: 1 }}>{t("${key}.mainContent")}</Typography></Paper>`}</${component}>
  </Stack>;
}`,
  );
}

function contentTests(context, component, variant) {
  const { publicImport } = locations(context);
  const supplied =
    variant === "dashboard"
      ? 'metrics={[{ id: "metric", label: "Active work", value: "42" }]} activity={[]}'
      : 'metadata={[{ id: "owner", label: "Owner", value: "Example team" }]}';
  const content = variant === "dashboard" ? "42" : "Example team";
  return file(
    `frontend/tests/features/${context.feature.kebab}/components/${component}.test.tsx`,
    `import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ${component} } from "${publicImport}";

vi.mock("@/app/localization/hooks/useAppTranslation", () => ({ useAppTranslation: () => ({ t: (key: string) => key.split(".").at(-1) }) }));

describe("${component} state and recovery", () => {
  it("shows caller content only after data is ready", () => {
    const { rerender } = render(<${component} ${supplied} state="loading"><p>Primary content</p></${component}>);
    expect(screen.getByRole("status")).toHaveTextContent("loading");
    expect(screen.queryByText("Primary content")).not.toBeInTheDocument();
    expect(screen.queryByText("${content}")).not.toBeInTheDocument();
    rerender(<${component} ${supplied} state="ready"><p>Primary content</p></${component}>);
    expect(screen.getByText("${content}")).toBeVisible();
    expect(screen.getByText("Primary content")).toBeVisible();
    rerender(<${component} ${supplied} state="empty"><p>Primary content</p></${component}>);
    expect(screen.getByRole("alert")).toHaveTextContent("empty");
    expect(screen.queryByText("Primary content")).not.toBeInTheDocument();
  });
  it("delegates a retry to its owner and hides stale content while failed", async () => {
    const retry = vi.fn();
    render(<${component} ${supplied} state="error" onRetry={retry}><p>Stale content</p></${component}>);
    expect(screen.getByRole("alert")).toHaveTextContent("error");
    expect(screen.queryByText("Stale content")).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "retry" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});`,
  );
}

function publicIndex(context, names) {
  const { owner } = locations(context);
  return file(
    `${owner}/index.ts`,
    names
      .map(
        ({ name, types = [`${name}Props`] }) =>
          `export { ${name} } from "./components/${name}";\nexport type { ${types.join(", ")} } from "./components/${name}";`,
      )
      .join("\n"),
  );
}

function navigationFiles(context) {
  const { owner, key, pageOwner, pageImport, publicImport } = locations(context);
  const shell = role(context.name.pascal, "Workspace");
  const section = role(context.name.pascal, "Section");
  const layout = role(context.name.pascal, "LayoutPage");
  const page = role(context.name.pascal, "SectionPage");
  const files = [workspaceComponent(context, shell)];
  files.push(
    file(
      `${owner}/components/${section}.tsx`,
      `import { Paper, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
export type ${section}Props = Readonly<{ title: string; description: string; children?: ReactNode }>;
export function ${section}({ title, description, children }: ${section}Props) {
  return <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, minWidth: 0, overflowWrap: "anywhere" }}>
    <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
      <Typography component="h2" variant="h5">{title}</Typography>
      <Typography color="text.secondary" sx={{ maxWidth: "70ch" }}>{description}</Typography>
      {children}
    </Stack>
  </Paper>;
}`,
    ),
  );
  files.push(
    file(
      `${pageOwner}/${layout}.tsx`,
      `import { ${shell}, type ${shell}Props } from "${publicImport}";
export function ${layout}(props: ${shell}Props) { return <${shell} {...props} />; }`,
    ),
  );
  files.push(
    file(
      `${pageOwner}/${page}.tsx`,
      `import { ${section}, type ${section}Props } from "${publicImport}";
export function ${page}(props: ${section}Props) { return <${section} {...props} />; }`,
    ),
  );
  files.push(publicIndex(context, [{ name: shell }, { name: section }]));
  files.push(
    file(
      `frontend/src/app/router/generated/${context.feature.kebab}--${context.name.kebab}.routes.tsx`,
      `import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { Button } from "@mui/material";
import { Link, Outlet } from "react-router";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import type { AppRouteDefinition } from "@/app/router/types/AppRoute";
import { ${layout} } from "${pageImport}/${layout}";
import { ${page} } from "${pageImport}/${page}";

/** Mount explicitly in the application registry for production; guide discovery only mounts in DEV. */
export function createRoutes(mount: Readonly<{ idPrefix: string; path: string; parentId?: string; developmentOnly?: boolean }>): Record<string, AppRouteDefinition> {
  const root = mount.idPrefix;
  const id = (suffix: string) => root + ":" + suffix;
  const base = mount.path.replace(/\\/+$/, "");
  const paths = {
    root: base,
    overview: base + "/overview",
    workspace: base + "/workspace",
    records: base + "/workspace/records",
    details: base + "/workspace/records/details",
    activity: base + "/workspace/activity",
    settings: base + "/settings",
  };
  const href = (path: string) => "/" + path.replace(/^\\/+/, "");
  const policy = { access: "authenticated" as const };
  function WorkspaceLayout() {
    const { t } = useAppTranslation();
    return <${layout} title={t("${key}.workspace")} summary={t("${key}.summary")} links={[
      { Icon: FolderOutlinedIcon, label: t("${key}.records"), to: href(paths.records) },
      { Icon: HistoryOutlinedIcon, label: t("${key}.activity"), to: href(paths.activity) },
    ]}><Outlet /></${layout}>;
  }
  function Overview() {
    const { t } = useAppTranslation();
    return <${page} title={t("${key}.overview")} description={t("${key}.overviewContent")} />;
  }
  function Records() {
    const { t } = useAppTranslation();
    return <${page} title={t("${key}.records")} description={t("${key}.recordsContent")}>
      <Button component={Link} to={href(paths.details)} variant="contained">{t("${key}.openDetails")}</Button>
    </${page}>;
  }
  function Details() {
    const { t } = useAppTranslation();
    return <${page} title={t("${key}.details")} description={t("${key}.detailSummary")}>
      <Button component={Link} to={href(paths.records)}>{t("${key}.backToRecords")}</Button>
    </${page}>;
  }
  function Activity() {
    const { t } = useAppTranslation();
    return <${page} title={t("${key}.activity")} description={t("${key}.activityContent")} />;
  }
  function Settings() {
    const { t } = useAppTranslation();
    return <${page} title={t("${key}.settings")} description={t("${key}.settingsContent")} />;
  }
  return {
    [root]: {
      ...policy, Component: Outlet, path: paths.root,
      ...(mount.parentId ? { parentId: mount.parentId } : {}),
      ...(mount.developmentOnly === undefined ? {} : { developmentOnly: mount.developmentOnly }),
      headerNavigation: true, defaultChildId: id("overview"), title: t => t("${key}.title"),
    },
    [id("overview")]: {
      ...policy, Component: Overview, path: paths.overview, parentId: root,
      commandPalette: true, title: t => t("${key}.overview"),
      navigation: { Icon: DashboardOutlinedIcon, labelKey: "${key}.overview", to: href(paths.overview) },
    },
    [id("workspace")]: {
      ...policy, Component: WorkspaceLayout, path: paths.workspace, parentId: root,
      defaultChildId: id("records"), title: t => t("${key}.workspace"),
      navigation: { Icon: FolderOutlinedIcon, labelKey: "${key}.workspace", to: href(paths.workspace), activePath: href(paths.workspace) + "/*" },
    },
    [id("records")]: { ...policy, Component: Outlet, path: paths.records, parentId: id("workspace"), title: t => t("${key}.records") },
    [id("recordsIndex")]: { ...policy, Component: Records, index: true, parentId: id("records"), commandPalette: true, title: t => t("${key}.records") },
    [id("details")]: { ...policy, Component: Details, path: paths.details, parentId: id("records"), commandPalette: true, title: t => t("${key}.details") },
    [id("activity")]: { ...policy, Component: Activity, path: paths.activity, parentId: id("workspace"), commandPalette: true, title: t => t("${key}.activity") },
    [id("settings")]: {
      ...policy, Component: Settings, path: paths.settings, parentId: root, commandPalette: true,
      title: t => t("${key}.settings"), navigation: { Icon: SettingsOutlinedIcon, labelKey: "${key}.settings", to: href(paths.settings) },
    },
  };
}`,
    ),
  );
  return files;
}

/** Unsupported/default variants fall through to the original, compatible templates. */
export function renderAdvancedFrontend(kind, context) {
  const variant = context.variant;
  if (
    kind !== "navigation" &&
    !(kind === "shell" && variant === "workspace") &&
    !(kind === "page" && ["dashboard", "detail"].includes(variant))
  )
    return null;
  const files = locales(context);
  if (kind === "navigation") return [...files, ...navigationFiles(context)];
  if (kind === "shell") {
    const component = role(context.name.pascal, "Shell");
    return [
      ...files,
      workspaceComponent(context, component),
      workspaceExample(context, component),
      publicIndex(context, [{ name: component }]),
    ];
  }
  const { pageOwner, publicImport } = locations(context);
  const component = role(context.name.pascal, variant === "dashboard" ? "Dashboard" : "Detail");
  const page = role(context.name.pascal, "Page");
  files.push(
    contentComponent(context, component, variant),
    contentExample(context, component, variant),
    contentTests(context, component, variant),
  );
  files.push(
    publicIndex(context, [
      {
        name: component,
        types: [
          `${component}Props`,
          ...(variant === "dashboard" ? [`${component}Metric`, `${component}Activity`] : [`${component}Metadata`]),
        ],
      },
    ]),
  );
  files.push(
    file(
      `${pageOwner}/${page}.tsx`,
      `import { ${component}, type ${component}Props } from "${publicImport}";
export function ${page}(props: ${component}Props) { return <${component} {...props} />; }`,
    ),
  );
  return files;
}
