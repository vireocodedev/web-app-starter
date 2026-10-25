/** Collection recipes keep remote requests, writes and selected identities with their caller. */
const file = (path, content) => ({ path, content: `${content.trim()}\n` });
const role = (name, suffix) => (name.endsWith(suffix) ? name : `${name}${suffix}`);
function paths(c) {
  return {
    owner: `frontend/src/features/${c.feature.kebab}`,
    entry: `@/features/${c.feature.kebab}`,
    key: `generated.${c.translationId}`,
    locale: `frontend/src/app/localization/translations/generated/${c.translationId}`,
    example: `frontend/src/pages/development-guide/generated/component/${c.feature.kebab}--${c.name.kebab}.example.tsx`,
    test: `frontend/tests/features/${c.feature.kebab}`,
  };
}
function locales(c) {
  const { locale } = paths(c);
  const en = {
    title: c.name.title,
    search: "Search records",
    status: "Status",
    all: "All statuses",
    active: "Active",
    archived: "Archived",
    filters: "Filters",
    apply: "Apply filters",
    cancel: "Cancel",
    clear: "Clear all filters",
    activeFilters: "Active filters: {{total}}",
    removeSearch: "Remove search filter",
    removeStatus: "Remove status filter",
    next: "Next page",
    previous: "Previous page",
    first: "First page",
    last: "Last page",
    rowsPerPage: "Rows per page",
    displayed: "{{from}}–{{to}} / {{count}}",
    empty: "No matching records.",
    loading: "Loading records…",
    error: "Records could not be loaded.",
    retry: "Try again",
    total: "Related records: {{total}}",
    add: "Create related record",
    link: "Link existing record",
    view: "View",
    edit: "Edit",
    actions: "Actions",
    name: "Record name",
    selected: "Selected records: {{total}}",
    selectPage: "Select page",
    clearSelection: "Clear selection",
    run: "Run action",
    confirmTitle: "Apply action to selected records?",
    confirmMessage:
      "This action affects exactly {{total}} selected records, including selected records on other pages.",
    confirm: "Confirm action",
    pending: "Action in progress…",
    failed: "The action failed. Your selection has been retained.",
    success: "Action completed for {{total}} records.",
    observerFailed:
      "The action completed, but selection could not refresh. Reload the collection before another action.",
  };
  const hr = {
    title: c.name.title,
    search: "Pretraži zapise",
    status: "Status",
    all: "Svi statusi",
    active: "Aktivno",
    archived: "Arhivirano",
    filters: "Filtri",
    apply: "Primijeni filtre",
    cancel: "Odustani",
    clear: "Ukloni sve filtre",
    activeFilters: "Aktivni filtri: {{total}}",
    removeSearch: "Ukloni pretragu",
    removeStatus: "Ukloni filtar statusa",
    next: "Sljedeća stranica",
    previous: "Prethodna stranica",
    first: "Prva stranica",
    last: "Posljednja stranica",
    rowsPerPage: "Redaka po stranici",
    displayed: "{{from}}–{{to}} / {{count}}",
    empty: "Nema odgovarajućih zapisa.",
    loading: "Učitavanje zapisa…",
    error: "Zapise nije moguće učitati.",
    retry: "Pokušaj ponovno",
    total: "Povezani zapisi: {{total}}",
    add: "Stvori povezani zapis",
    link: "Poveži postojeći zapis",
    view: "Prikaži",
    edit: "Uredi",
    actions: "Radnje",
    name: "Naziv zapisa",
    selected: "Odabrani zapisi: {{total}}",
    selectPage: "Odaberi stranicu",
    clearSelection: "Poništi odabir",
    run: "Pokreni radnju",
    confirmTitle: "Primijeniti radnju na odabrane zapise?",
    confirmMessage:
      "Radnja obuhvaća točno {{total}} odabranih zapisa, uključujući odabrane zapise na drugim stranicama.",
    confirm: "Potvrdi radnju",
    pending: "Radnja je u tijeku…",
    failed: "Radnja nije uspjela. Odabir je zadržan.",
    success: "Radnja je dovršena za {{total}} zapisa.",
    observerFailed: "Radnja je dovršena, ali odabir nije osvježen. Ponovno učitajte zbirku prije nove radnje.",
  };
  return [
    file(`${locale}.en.ts`, `export const translations = ${JSON.stringify(en, null, 2)} as const;`),
    file(
      `${locale}.hr.ts`,
      `import type { StringLeaves } from "../../types/TranslationShape";\nimport type { translations as english } from "./${c.translationId}.en";\nexport const translations = ${JSON.stringify(hr, null, 2)} as const satisfies StringLeaves<typeof english>;`,
    ),
  ];
}
function pagination(key) {
  return `pagination={{ rowsPerPageOptions: [5, 10, 25], labelRowsPerPage: t("${key}.rowsPerPage"), labelDisplayedRows: ({ from, to, count }) => t("${key}.displayed", { from, to, count }), getItemAriaLabel: type => t(({ first: "${key}.first", last: "${key}.last", next: "${key}.next", previous: "${key}.previous" } as const)[type]) }}`;
}
function filters(c) {
  const { owner, entry, key, example, test } = paths(c),
    n = c.name.pascal,
    component = role(n, "FilterBar");
  const q = `${c.name.camel}Search`,
    status = `${c.name.camel}Status`,
    page = `${c.name.camel}Page`;
  return [
    file(
      `${owner}/models/${n}.ts`,
      `import { z } from "zod";
export type ${n}Filters = Readonly<{ search: string; status: "all" | "active" | "archived" }>;
export function default${n}Filters(): ${n}Filters { return { search: "", status: "all" }; }
export function normalize${n}Filters(value: ${n}Filters): ${n}Filters { return { search: value.search.trim(), status: value.status }; }
export function count${n}Filters(value: ${n}Filters): number { return Number(value.search.trim() !== "") + Number(value.status !== "all"); }
const pageCodec = z.codec(z.string().regex(/^\\d+$/), z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER), { decode: Number, encode: String });
/** Namespaced fields coexist with parent-route query parameters. Page is zero-based. */
export const ${c.name.camel}QuerySchema = z.object({ ${q}: z.string().default(""), ${status}: z.enum(["all", "active", "archived"]).default("all"), ${page}: pageCodec.default(0) });`,
    ),
    file(
      `${owner}/hooks/use${n}UrlFilters.ts`,
      `import { useAppQueryParams } from "@/app/router/hooks/useAppQueryParams";
import { ${c.name.camel}QuerySchema, normalize${n}Filters, type ${n}Filters } from "../models/${n}";
/** URL is the applied-state owner. Browser Back/Forward restores filters and pagination. */
export function use${n}UrlFilters() {
  const { values, setValues } = useAppQueryParams(${c.name.camel}QuerySchema);
  return { value: { search: values.${q}, status: values.${status} } satisfies ${n}Filters, page: values.${page},
    apply: (draft: ${n}Filters) => { const value = normalize${n}Filters(draft); setValues({ ${q}: value.search, ${status}: value.status, ${page}: 0 }); },
    setPage: (page: number) => setValues({ ${page}: page }),
  };
}`,
    ),
    file(
      `${owner}/components/${component}.tsx`,
      `import { Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useId, useState } from "react";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { count${n}Filters, default${n}Filters, normalize${n}Filters, type ${n}Filters } from "../models/${n}";
export type ${component}Props = Readonly<{ value: ${n}Filters; onApply: (value: ${n}Filters) => void; disabled?: boolean }>;
export function ${component}(props: ${component}Props) {
  return <FilterDraftSession key={JSON.stringify([props.value.search, props.value.status])} {...props} />;
}
/** A distinct applied value owns a fresh editor session; same-value renders retain its staged draft. */
function FilterDraftSession({ value, onApply, disabled = false }: ${component}Props) {
  const { t } = useAppTranslation(); const id = useId();
  const theme = useTheme(); const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [open, setOpen] = useState(false); const [draft, setDraft] = useState(value);
  const cancel = () => { setDraft(value); setOpen(false); };
  return <Stack spacing={2} sx={{ minWidth: 0 }}>
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", alignItems: "center" }}>
      <Button variant="outlined" disabled={disabled} onClick={() => { setDraft(value); setOpen(true); }}>{t("${key}.filters")}</Button>
      <Typography role="status">{t("${key}.activeFilters", { total: count${n}Filters(value) })}</Typography>
      <Button disabled={disabled || count${n}Filters(value) === 0} onClick={() => onApply(default${n}Filters())}>{t("${key}.clear")}</Button>
    </Stack>
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
      {value.search ? <Chip label={value.search} disabled={disabled} onDelete={() => onApply({ ...value, search: "" })} aria-label={t("${key}.removeSearch")} /> : null}
      {value.status !== "all" ? <Chip label={t(value.status === "active" ? "${key}.active" : "${key}.archived")} disabled={disabled} onDelete={() => onApply({ ...value, status: "all" })} aria-label={t("${key}.removeStatus")} /> : null}
    </Stack>
    <Dialog open={open} onClose={cancel} fullScreen={fullScreen} fullWidth maxWidth="sm" aria-labelledby={id + "-filters-title"}>
      <form onSubmit={event => { event.preventDefault(); if (!disabled) { onApply(normalize${n}Filters(draft)); setOpen(false); } }}>
        <DialogTitle id={id + "-filters-title"}>{t("${key}.filters")}</DialogTitle>
        <DialogContent><Stack spacing={3} sx={{ pt: 1 }}>
          <TextField autoFocus fullWidth label={t("${key}.search")} value={draft.search} disabled={disabled} onChange={event => setDraft({ ...draft, search: event.target.value })} />
          <TextField fullWidth select label={t("${key}.status")} value={draft.status} disabled={disabled} onChange={event => setDraft({ ...draft, status: event.target.value as ${n}Filters["status"] })}>
            <MenuItem value="all">{t("${key}.all")}</MenuItem><MenuItem value="active">{t("${key}.active")}</MenuItem><MenuItem value="archived">{t("${key}.archived")}</MenuItem>
          </TextField>
        </Stack></DialogContent>
        <DialogActions><Button onClick={cancel}>{t("${key}.cancel")}</Button><Button type="submit" variant="contained" disabled={disabled}>{t("${key}.apply")}</Button></DialogActions>
      </form>
    </Dialog>
  </Stack>;
}`,
    ),
    file(
      example,
      `import { Alert, Button, List, ListItem, Stack, Typography } from "@mui/material";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { ${component}, use${n}UrlFilters } from "${entry}";
export function Component() {
  const { t } = useAppTranslation(); const { t: guideT } = useDevelopmentGuideTranslation(); const { value, page, apply, setPage } = use${n}UrlFilters();
  const rows = Array.from({ length: 18 }, (_, index) => ({ id: index + 1, title: guideT("generatedExamples.collectionRecipes.sample", { number: index + 1 }), status: index % 2 ? "archived" : "active" })).filter(row => row.title.toLocaleLowerCase().includes(value.search.toLocaleLowerCase()) && (value.status === "all" || row.status === value.status));
  const visible = rows.slice(page * 5, (page + 1) * 5);
  return <Stack spacing={3}><Alert severity="info">{guideT("generatedExamples.collectionRecipes.urlHint")}</Alert><${component} value={value} onApply={apply} />
    <List aria-label={t("${key}.title")}>{visible.map(row => <ListItem key={row.id}>{row.title} · {t(row.status === "active" ? "${key}.active" : "${key}.archived")}</ListItem>)}</List>
    {visible.length === 0 ? <Typography>{t("${key}.empty")}</Typography> : null}
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}><Button disabled={page === 0} onClick={() => setPage(page - 1)}>{t("${key}.previous")}</Button><Typography>{guideT("generatedExamples.collectionRecipes.page", { page: page + 1 })}</Typography><Button disabled={(page + 1) * 5 >= rows.length} onClick={() => setPage(page + 1)}>{t("${key}.next")}</Button></Stack>
  </Stack>;
}`,
    ),
    file(
      `${owner}/index.ts`,
      `export { ${component} } from "./components/${component}";\nexport type { ${component}Props } from "./components/${component}";\nexport { use${n}UrlFilters } from "./hooks/use${n}UrlFilters";\nexport { ${c.name.camel}QuerySchema, default${n}Filters, normalize${n}Filters, count${n}Filters } from "./models/${n}";\nexport type { ${n}Filters } from "./models/${n}";`,
    ),
    file(
      `${test}/components/${component}.test.tsx`,
      `import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ${component} } from "${entry}";
vi.mock("@/app/localization/hooks/useAppTranslation", () => ({ useAppTranslation: () => ({ t: (key: string) => key.split(".").at(-1) }) }));
describe("${component} staged filters", () => {
  it("does not change applied filters on typing or cancel, and applies only the accepted draft", async () => {
    const onApply = vi.fn(); const user = userEvent.setup();
    render(<${component} value={{ search: "retained", status: "all" }} onApply={onApply} />);
    await user.click(screen.getByRole("button", { name: "filters" })); await user.type(screen.getByLabelText("search"), " draft");
    expect(onApply).not.toHaveBeenCalled(); await user.click(screen.getByRole("button", { name: "cancel" }));
    await user.click(await screen.findByRole("button", { name: "filters" })); expect(screen.getByLabelText("search")).toHaveValue("retained");
    await user.clear(screen.getByLabelText("search")); await user.type(screen.getByLabelText("search"), " accepted "); await user.click(screen.getByRole("button", { name: "apply" }));
    expect(onApply).toHaveBeenCalledExactlyOnceWith({ search: "accepted", status: "all" });
  });
  it("preserves a same-value draft but starts a new session when applied URL values change", async () => {
    const onApply = vi.fn(); const user = userEvent.setup();
    const { rerender } = render(<${component} value={{ search: "initial", status: "all" }} onApply={onApply} />);
    await user.click(screen.getByRole("button", { name: "filters" }));
    await user.type(screen.getByLabelText("search"), " unsaved");
    rerender(<${component} value={{ search: "initial", status: "all" }} onApply={onApply} />);
    expect(screen.getByLabelText("search")).toHaveValue("initial unsaved");
    rerender(<${component} value={{ search: "restored", status: "active" }} onApply={onApply} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "filters" }));
    expect(screen.getByLabelText("search")).toHaveValue("restored");
    expect(onApply).not.toHaveBeenCalled();
  });
});`,
    ),
    file(
      `${test}/models/${n}.test.ts`,
      `import { describe, expect, it } from "vitest";
import { parseQueryParams, updateQueryParams } from "@/app/router/queryParams";
import { ${c.name.camel}QuerySchema } from "${entry}";
describe("${n} URL contract", () => {
  it("atomically resets page while preserving unrelated parameters, and restores prior URL values", () => {
    const previous = "unrelated=keep&${q}=before&${page}=3";
    const next = updateQueryParams(${c.name.camel}QuerySchema, previous, { ${q}: "after", ${status}: "active", ${page}: 0 });
    expect(next.get("unrelated")).toBe("keep"); expect(next.has("${page}")).toBe(false);
    expect(parseQueryParams(${c.name.camel}QuerySchema, next)).toEqual({ ${q}: "after", ${status}: "active", ${page}: 0 });
    expect(parseQueryParams(${c.name.camel}QuerySchema, previous)).toEqual({ ${q}: "before", ${status}: "all", ${page}: 3 });
    expect(parseQueryParams(${c.name.camel}QuerySchema, "${page}=-2&${status}=invalid")).toEqual({ ${q}: "", ${status}: "all", ${page}: 0 });
  });
});`,
    ),
  ];
}
function related(c) {
  const { owner, entry, key, example, test } = paths(c),
    n = c.name.pascal,
    component = role(n, "RelatedRecords");
  return [
    file(
      `${owner}/models/${n}.ts`,
      `import type { RgoDesktopTableState } from "@rgo-web/frontend";
export type ${n}Row = Readonly<{ id: string; title: string; status: "active" | "archived" }>;
export type ${n}Request = Readonly<{ search: string; table: RgoDesktopTableState }>;
export function default${n}Request(): ${n}Request { return { search: "", table: { page: 0, rowsPerPage: 5, sort: null } }; }
export function change${n}Table(request: ${n}Request, table: RgoDesktopTableState): ${n}Request {
  const reset = request.table.rowsPerPage !== table.rowsPerPage || request.table.sort?.columnId !== table.sort?.columnId || request.table.sort?.direction !== table.sort?.direction;
  return { ...request, table: { ...table, page: reset ? 0 : table.page } };
}
/** Include actual actor/tenant scope supplied by the owning API; never use scope as authorization. */
export function ${c.name.camel}QueryKey(scope: string, parentId: string, request: ${n}Request) { return ["${c.feature.kebab}", scope, parentId, "related", request] as const; }
`,
    ),
    file(
      `${owner}/components/${component}.tsx`,
      `import { Alert, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { RgoDesktopTable, type TableColumnDef } from "@rgo-web/frontend";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { useAppDisplayPreferences } from "@/app/theme/preferences/useAppDisplayPreferences";
import { change${n}Table, type ${n}Request, type ${n}Row } from "../models/${n}";
export type ${component}Props = Readonly<{
  parentId: string; resolvedParentId: string; request: ${n}Request; rows: readonly ${n}Row[]; totalCount: number; state: "ready" | "loading" | "error";
  onRequestChange: (parentId: string, request: ${n}Request) => void; onRetry: (parentId: string) => void;
  onAdd?: (parentId: string) => void; onLink?: (parentId: string) => void; onView: (parentId: string, row: ${n}Row) => void; onEdit: (parentId: string, row: ${n}Row) => void;
}>;
/** Render only the supplied page. Sorting and paging are requests to the child resource owner. */
export function ${component}(props: ${component}Props) {
  const { t } = useAppTranslation(); const { desktopTableSize } = useAppDisplayPreferences();
  const resolved = props.parentId === props.resolvedParentId; const loading = props.state === "loading" || !resolved;
  const columns: readonly TableColumnDef<${n}Row>[] = [
    { id: "title", header: t("${key}.name"), rowHeader: true, renderCell: ({ row }) => row.title, sort: { serverField: "title" } },
    { id: "status", header: t("${key}.status"), renderCell: ({ row }) => t(row.status === "active" ? "${key}.active" : "${key}.archived"), sort: { serverField: "status" } },
    { id: "__actions", header: t("${key}.actions"), renderCell: ({ row }) => <Stack direction="row" spacing={1}><Button onClick={() => props.onView(props.parentId, row)} aria-label={t("${key}.view") + ": " + row.title}>{t("${key}.view")}</Button><Button onClick={() => props.onEdit(props.parentId, row)} aria-label={t("${key}.edit") + ": " + row.title}>{t("${key}.edit")}</Button></Stack> },
  ];
  return <Stack spacing={2} sx={{ minWidth: 0 }}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
      <Typography variant="h6">{t("${key}.title")}</Typography><Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>{props.onAdd ? <Button variant="contained" onClick={() => props.onAdd?.(props.parentId)}>{t("${key}.add")}</Button> : null}{props.onLink ? <Button variant="outlined" onClick={() => props.onLink?.(props.parentId)}>{t("${key}.link")}</Button> : null}</Stack>
    </Stack>
    <TextField fullWidth label={t("${key}.search")} value={props.request.search} onChange={event => props.onRequestChange(props.parentId, { ...props.request, search: event.target.value, table: { ...props.request.table, page: 0 } })} />
    {resolved && props.state === "error" ? <Alert severity="error" action={<Button color="inherit" onClick={() => props.onRetry(props.parentId)}>{t("${key}.retry")}</Button>}>{t("${key}.error")}</Alert> : <>
      {!loading ? <Typography role="status">{t("${key}.total", { total: props.totalCount })}</Typography> : null}
      <Paper variant="outlined" sx={{ minWidth: 0, overflow: "hidden" }}><RgoDesktopTable mode="server" rows={loading ? [] : props.rows} columns={columns} totalCount={loading ? 0 : props.totalCount} state={props.request.table} onStateChange={table => props.onRequestChange(props.parentId, change${n}Table(props.request, table))} getRowKey={row => row.id} tableLabel={t("${key}.title")} emptyContent={t("${key}.empty")} loading={loading} loadingLabel={t("${key}.loading")} loadingContent={t("${key}.loading")} size={desktopTableSize} ${pagination(key)} sx={{ "& .MuiTablePagination-toolbar": { flexWrap: "wrap", gap: 1, px: 1 }, "& .MuiTablePagination-spacer": { display: "none" } }} /></Paper>
    </>}
  </Stack>;
}`,
    ),
    file(
      example,
      `import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from "@mui/material";
import { useRef, useState } from "react";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { ${component}, default${n}Request, type ${n}Request, type ${n}Row } from "${entry}";
/** Complete bounded fixture only. Production adapters return a parent-scoped server page. */
function select${n}Fixture(rows: readonly ${n}Row[], request: ${n}Request): ${n}Row[] {
  const matches = rows.filter(row => row.title.toLocaleLowerCase().includes(request.search.trim().toLocaleLowerCase()));
  const sort = request.table.sort;
  if (sort) matches.sort((left, right) => { const comparison = sort.columnId === "status" ? left.status.localeCompare(right.status) : left.title.localeCompare(right.title); return (sort.direction === "asc" ? comparison : -comparison) || left.id.localeCompare(right.id); });
  return matches;
}
export function Component() {
  const { t } = useAppTranslation(); const { t: guideT } = useDevelopmentGuideTranslation(); const nextId = useRef(30);
  const [parentId, setParentId] = useState("alpha"); const [request, setRequest] = useState(default${n}Request); const [state, setState] = useState<"ready" | "loading" | "error" | "empty">("ready");
  const [rows, setRows] = useState<Record<string, ${n}Row[]>>(() => Object.fromEntries(["alpha", "beta"].map(parent => [parent, Array.from({ length: parent === "alpha" ? 12 : 7 }, (_, index) => ({ id: parent + "-" + index, title: parent + " " + String(index + 1).padStart(2, "0"), status: index % 2 ? "archived" as const : "active" as const }))])));
  const [selected, setSelected] = useState<${n}Row | null>(null);
  const [editor, setEditor] = useState<{ parentId: string; id: string | null; title: string } | null>(null);
  const matches = select${n}Fixture(rows[parentId] ?? [], request); const page = matches.slice(request.table.page * request.table.rowsPerPage, (request.table.page + 1) * request.table.rowsPerPage);
  return <Stack spacing={3}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
      <TextField select label={guideT("generatedExamples.collectionRecipes.parent")} value={parentId} onChange={event => { setParentId(event.target.value); setRequest(default${n}Request()); setSelected(null); setEditor(null); setState("ready"); }}><MenuItem value="alpha">{guideT("generatedExamples.collectionRecipes.parentA")}</MenuItem><MenuItem value="beta">{guideT("generatedExamples.collectionRecipes.parentB")}</MenuItem></TextField>
      <TextField select label={guideT("generatedExamples.collectionRecipes.previewState")} value={state} onChange={event => setState(event.target.value as typeof state)}>{(["ready", "loading", "empty", "error"] as const).map(value => <MenuItem key={value} value={value}>{guideT(({ ready: "generatedExamples.ready", loading: "generatedExamples.loading", empty: "generatedExamples.empty", error: "generatedExamples.error" } as const)[value])}</MenuItem>)}</TextField>
    </Stack>
    <${component} parentId={parentId} resolvedParentId={parentId} request={request} rows={state === "empty" ? [] : page} totalCount={state === "empty" ? 0 : matches.length} state={state === "empty" ? "ready" : state} onRequestChange={(owner, next) => { if (owner === parentId) { setRequest(next); setSelected(null); } }} onRetry={() => setState("ready")}
      onAdd={owner => setEditor({ parentId: owner, id: null, title: "" })}
      onLink={owner => { const row: ${n}Row = { id: owner + "-linked-" + nextId.current++, title: guideT("generatedExamples.collectionRecipes.linked"), status: "active" }; setRows(current => ({ ...current, [owner]: [...(current[owner] ?? []), row] })); setRequest(default${n}Request()); }}
      onView={(_owner, row) => setSelected(row)} onEdit={(owner, row) => setEditor({ parentId: owner, id: row.id, title: row.title })} />
    {selected ? <Alert severity="info" onClose={() => setSelected(null)}>{guideT("generatedExamples.collectionRecipes.details", { name: selected.title })}</Alert> : null}
    <Dialog open={editor !== null} onClose={() => setEditor(null)} fullWidth maxWidth="sm" aria-labelledby="${c.translationId}-editor-title"><form onSubmit={event => { event.preventDefault(); if (!editor?.title.trim()) return; const captured = editor; setRows(current => ({ ...current, [captured.parentId]: captured.id ? (current[captured.parentId] ?? []).map(row => row.id === captured.id ? { ...row, title: captured.title.trim() } : row) : [...(current[captured.parentId] ?? []), { id: captured.parentId + "-" + nextId.current++, title: captured.title.trim(), status: "active" }] })); setSelected(null); setRequest(default${n}Request()); setEditor(null); }}>
      <DialogTitle id="${c.translationId}-editor-title">{t(editor?.id ? "${key}.edit" : "${key}.add")}</DialogTitle><DialogContent><TextField autoFocus required fullWidth label={t("${key}.name")} value={editor?.title ?? ""} onChange={event => setEditor(current => current ? { ...current, title: event.target.value } : null)} sx={{ mt: 1 }} /></DialogContent><DialogActions><Button onClick={() => setEditor(null)}>{t("${key}.cancel")}</Button><Button type="submit" disabled={!editor?.title.trim()}>{guideT("generatedExamples.collectionRecipes.save")}</Button></DialogActions>
    </form></Dialog>
  </Stack>;
}`,
    ),
    file(
      `${owner}/index.ts`,
      `export { ${component} } from "./components/${component}";\nexport type { ${component}Props } from "./components/${component}";\nexport { default${n}Request, change${n}Table, ${c.name.camel}QueryKey } from "./models/${n}";\nexport type { ${n}Request, ${n}Row } from "./models/${n}";`,
    ),
    file(
      `${test}/models/${n}.test.ts`,
      `import { describe, expect, it } from "vitest";
import { default${n}Request, change${n}Table, ${c.name.camel}QueryKey } from "${entry}";
describe("${n} child resource ownership", () => {
  it("partitions parent/actor resources and resets only result-defining table changes", () => {
    const request = default${n}Request();
    expect(${c.name.camel}QueryKey("actor-a", "parent-a", request)).not.toEqual(${c.name.camel}QueryKey("actor-a", "parent-b", request));
    expect(${c.name.camel}QueryKey("actor-a", "parent-a", request)).not.toEqual(${c.name.camel}QueryKey("actor-b", "parent-a", request));
    expect(change${n}Table(request, { ...request.table, page: 2 }).table.page).toBe(2);
    expect(change${n}Table(request, { ...request.table, page: 2, sort: { columnId: "title", direction: "desc" } }).table.page).toBe(0);
  });

});`,
    ),
    file(
      `${test}/components/${component}.test.tsx`,
      `import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ${component}, default${n}Request } from "${entry}";
vi.mock("@/app/localization/hooks/useAppTranslation", () => ({ useAppTranslation: () => ({ t: (key: string) => key.split(".").at(-1) }) }));
vi.mock("@/app/theme/preferences/useAppDisplayPreferences", () => ({ useAppDisplayPreferences: () => ({ desktopTableSize: "small" }) }));
describe("${component} parent scope", () => {
  it("never shows an old parent's rows under the new parent", () => {
    render(<${component} parentId="new" resolvedParentId="old" request={default${n}Request()} rows={[{ id: "old-row", title: "Private old title", status: "active" }]} totalCount={1} state="ready" onRequestChange={vi.fn()} onRetry={vi.fn()} onView={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.queryByText("Private old title")).not.toBeInTheDocument();
  });
  it("renders exactly the server-supplied page order and emits paging without mutating it", async () => {
    const change = vi.fn(); const request = default${n}Request(); const user = userEvent.setup();
    const rows = [{ id: "a", title: "Alpha", status: "active" as const }, { id: "z", title: "Zulu", status: "archived" as const }];
    const props = { parentId: "current", resolvedParentId: "current", request, rows, totalCount: 40, state: "ready" as const, onRequestChange: change, onRetry: vi.fn(), onView: vi.fn(), onEdit: vi.fn() };
    const { rerender } = render(<${component} {...props} />);
    expect(screen.getAllByRole("rowheader").map(cell => cell.textContent)).toEqual(["Alpha", "Zulu"]);
    await user.click(screen.getByRole("button", { name: "next" }));
    expect(change).toHaveBeenCalledExactlyOnceWith("current", { ...request, table: { ...request.table, page: 1 } });
    rerender(<${component} {...props} request={{ ...request, table: { ...request.table, page: 1, sort: { columnId: "title", direction: "desc" } } }} />);
    expect(screen.getAllByRole("rowheader").map(cell => cell.textContent)).toEqual(["Alpha", "Zulu"]);
    expect(rows.map(row => row.id)).toEqual(["a", "z"]);
    expect(change).toHaveBeenCalledOnce();
  });
  it("routes retry to the current child resource and resets page when searching", async () => {
    const retry = vi.fn(); const change = vi.fn(); const request = default${n}Request(); const user = userEvent.setup();
    render(<${component} parentId="current" resolvedParentId="current" request={{ ...request, table: { ...request.table, page: 2 } }} rows={[]} totalCount={0} state="error" onRequestChange={change} onRetry={retry} onView={vi.fn()} onEdit={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "retry" })); expect(retry).toHaveBeenCalledExactlyOnceWith("current");
    await user.type(screen.getByLabelText("search"), "a"); expect(change).toHaveBeenLastCalledWith("current", { ...request, search: "a" });
  });
});`,
    ),
  ];
}
function bulk(c) {
  const { owner, entry, key, example, test } = paths(c),
    n = c.name.pascal,
    component = role(n, "BulkActions");
  return [
    file(
      `${owner}/models/${n}.ts`,
      `/** Selection is always explicit IDs, never an implicit all-matches operation. */
export function unique${n}Ids(ids: readonly string[]): string[] { return [...new Set(ids)]; }
export function select${n}Page(selectedIds: readonly string[], currentPageIds: readonly string[]): string[] { return unique${n}Ids([...selectedIds, ...currentPageIds]); }
export function remove${n}Completed(selectedIds: readonly string[], capturedIds: readonly string[]): string[] { const completed = new Set(capturedIds); return unique${n}Ids(selectedIds).filter(id => !completed.has(id)); }`,
    ),
    file(
      `${owner}/components/${component}.tsx`,
      `import { Alert, Button, Stack, Typography } from "@mui/material";
import { useRgoFeedback } from "@rgo-web/frontend";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { unique${n}Ids, select${n}Page, remove${n}Completed } from "../models/${n}";
export type ${component}Props = Readonly<{
  selectedIds: readonly string[]; currentPageIds: readonly string[];
  onSelectionChange: (ids: readonly string[]) => void;
  /** Resolves only after the command acknowledges all captured IDs; reject on failure. */
  onExecute: (ids: readonly string[]) => Promise<void>;
  /** Caller locks its row checkboxes and other selection controls throughout confirmation and execution. */
  onBusyChange?: (busy: boolean) => void;
}>;
export function ${component}(props: ${component}Props) {
  const { t } = useAppTranslation(); const feedback = useRgoFeedback();
  const [phase, setPhase] = useState<"idle" | "confirming" | "pending" | "failed" | "success" | "observer-failed">("idle"); const [completedCount, setCompletedCount] = useState(0);
  const latest = useRef(props);
  useLayoutEffect(() => { latest.current = props; }, [props]);
  const lock = useRef(false); const mounted = useRef(true); const confirmation = useRef<AbortController | null>(null);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; confirmation.current?.abort(); }; }, []);
  const busy = phase === "confirming" || phase === "pending" || phase === "observer-failed"; const ids = unique${n}Ids(props.selectedIds);
  const run = async () => {
    if (lock.current || phase === "observer-failed" || ids.length === 0) return;
    // Capture command identity before the first await, including confirmation.
    const capturedIds = [...ids]; const execute = props.onExecute; const reportBusy = props.onBusyChange;
    lock.current = true; setPhase("confirming"); reportBusy?.(true);
    const controller = new AbortController(); confirmation.current = controller;
    try {
      const result = await feedback.confirm({ title: t("${key}.confirmTitle"), message: t("${key}.confirmMessage", { total: capturedIds.length }), confirmLabel: t("${key}.confirm"), cancelLabel: t("${key}.cancel"), signal: controller.signal });
      if (result.status !== "confirmed" || !mounted.current || controller.signal.aborted) { if (mounted.current) setPhase("idle"); return; }
      setPhase("pending"); await execute(capturedIds);
      if (!mounted.current) return;
      setCompletedCount(capturedIds.length); setPhase("success");
      // A failed observer after acknowledgement must never invite a duplicate command.
      try { latest.current.onSelectionChange(remove${n}Completed(latest.current.selectedIds, capturedIds)); } catch { setPhase("observer-failed"); }
    } catch { if (mounted.current) setPhase("failed"); }
    finally { lock.current = false; if (confirmation.current === controller) confirmation.current = null; if (mounted.current) reportBusy?.(false); }
  };
  return <Stack spacing={2}>
    <Stack role="toolbar" aria-label={t("${key}.title")} direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ p: 2, bgcolor: "action.selected", borderRadius: 1, alignItems: { sm: "center" } }}>
      <Typography sx={{ flex: 1 }} aria-live="polite">{t("${key}.selected", { total: ids.length })}</Typography>
      <Button disabled={busy || props.currentPageIds.length === 0 || props.currentPageIds.every(id => ids.includes(id))} onClick={() => props.onSelectionChange(select${n}Page(ids, props.currentPageIds))}>{t("${key}.selectPage")}</Button>
      <Button disabled={busy || ids.length === 0} onClick={() => props.onSelectionChange([])}>{t("${key}.clearSelection")}</Button>
      <Button variant="contained" disabled={busy || ids.length === 0} onClick={() => void run()}>{t(phase === "pending" ? "${key}.pending" : "${key}.run")}</Button>
    </Stack>
    {phase === "pending" ? <Typography role="status">{t("${key}.pending")}</Typography> : null}
    {phase === "failed" ? <Alert severity="error">{t("${key}.failed")}</Alert> : null}
    {phase === "success" || phase === "observer-failed" ? <Alert severity="success">{t("${key}.success", { total: completedCount })}</Alert> : null}
    {phase === "observer-failed" ? <Alert severity="warning">{t("${key}.observerFailed")}</Alert> : null}
  </Stack>;
}`,
    ),
    file(
      example,
      `import { Alert, Button, Checkbox, FormControlLabel, Stack, Switch } from "@mui/material";
import { RgoDesktopTable, type RgoDesktopTableState, type TableColumnDef } from "@rgo-web/frontend";
import { useEffect, useRef, useState } from "react";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { ${component} } from "${entry}";
type Row = Readonly<{ id: string; title: string }>;
export function Component() {
  const { t } = useAppTranslation(); const { t: guideT } = useDevelopmentGuideTranslation(); const [selectedIds, setSelectedIds] = useState<readonly string[]>([]); const [busy, setBusy] = useState(false);
  const [failNext, setFailNext] = useState(false); const [hold, setHold] = useState(false); const [waiting, setWaiting] = useState(false);
  const [rows, setRows] = useState<readonly Row[]>(() => Array.from({ length: 13 }, (_, index) => ({ id: "sample-" + (index + 1), title: String(index + 1).padStart(2, "0") })));
  const [table, setTable] = useState<RgoDesktopTableState>({ page: 0, rowsPerPage: 5, sort: null });
  const release = useRef<(() => void) | null>(null); const generation = useRef(0);
  useEffect(() => () => { generation.current += 1; release.current?.(); }, []);
  const currentPageIds = rows.slice(table.page * table.rowsPerPage, (table.page + 1) * table.rowsPerPage).map(row => row.id);
  const columns: readonly TableColumnDef<Row>[] = [
    { id: "__selection", header: t("${key}.selected", { total: selectedIds.length }), width: 100, renderCell: ({ row }) => <Checkbox checked={selectedIds.includes(row.id)} disabled={busy} onChange={event => setSelectedIds(current => event.target.checked ? [...current, row.id] : current.filter(id => id !== row.id))} slotProps={{ input: { "aria-label": guideT("generatedExamples.collectionRecipes.selectRow", { name: row.title }) } }} /> },
    { id: "title", header: t("${key}.name"), rowHeader: true, renderCell: ({ row }) => guideT("generatedExamples.collectionRecipes.sample", { number: row.title }) },
  ];
  const execute = async (capturedIds: readonly string[]) => {
    const owner = generation.current; const shouldFail = failNext; const shouldHold = hold;
    setFailNext(false);
    if (shouldHold) { setWaiting(true); await new Promise<void>(resolve => { release.current = resolve; }); release.current = null; }
    else await new Promise(resolve => window.setTimeout(resolve, 450));
    if (owner !== generation.current) throw new Error("Preview owner ended");
    setWaiting(false); if (shouldFail) throw new Error("Simulated command failure");
    // Preview action archives/removes exactly the captured fixture IDs.
    const removed = new Set(capturedIds); setRows(current => current.filter(row => !removed.has(row.id))); setTable(current => ({ ...current, page: 0 }));
  };
  return <Stack spacing={3} sx={{ minWidth: 0 }}>
    <Alert severity="info">{guideT("generatedExamples.collectionRecipes.scope")}</Alert>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}><FormControlLabel control={<Switch checked={failNext} disabled={busy} onChange={event => setFailNext(event.target.checked)} />} label={guideT("generatedExamples.collectionRecipes.failNext")} /><FormControlLabel control={<Switch checked={hold} disabled={busy} onChange={event => setHold(event.target.checked)} />} label={guideT("generatedExamples.collectionRecipes.hold")} />{waiting ? <Button variant="outlined" onClick={() => release.current?.()}>{guideT("generatedExamples.collectionRecipes.release")}</Button> : null}</Stack>
    <${component} selectedIds={selectedIds} currentPageIds={currentPageIds} onSelectionChange={setSelectedIds} onExecute={execute} onBusyChange={setBusy} />
    <RgoDesktopTable rows={rows} columns={columns} getRowKey={row => row.id} tableLabel={t("${key}.title")} emptyContent={t("${key}.empty")} state={table} onStateChange={setTable} ${pagination(key)} sx={{ "& .MuiTablePagination-toolbar": { flexWrap: "wrap", gap: 1, px: 1 }, "& .MuiTablePagination-spacer": { display: "none" } }} />
  </Stack>;
}`,
    ),
    file(
      `${owner}/index.ts`,
      `export { ${component} } from "./components/${component}";\nexport type { ${component}Props } from "./components/${component}";\nexport { unique${n}Ids, select${n}Page, remove${n}Completed } from "./models/${n}";`,
    ),
    file(
      `${test}/components/${component}.test.tsx`,
      `import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ${component} } from "${entry}";
const feedback = vi.hoisted(() => ({ confirm: vi.fn() }));
vi.mock("@rgo-web/frontend", () => ({ useRgoFeedback: () => feedback }));
vi.mock("@/app/localization/hooks/useAppTranslation", () => ({ useAppTranslation: () => ({ t: (key: string) => key.split(".").at(-1) }) }));
describe("${component} explicit command selection", () => {
  it("captures IDs before confirmation and locks controls; failed execution preserves selection", async () => {
    let confirm!: (value: { status: "confirmed" }) => void; let reject!: (reason: Error) => void;
    feedback.confirm.mockImplementationOnce(() => new Promise(resolve => { confirm = resolve; }));
    const execute = vi.fn(() => new Promise<void>((_resolve, fail) => { reject = fail; })); const selection = vi.fn(); const busy = vi.fn();
    const props = { selectedIds: ["first", "other-page"], currentPageIds: ["first", "second"], onSelectionChange: selection, onExecute: execute, onBusyChange: busy };
    const { rerender } = render(<${component} {...props} />); const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "run" })); expect(execute).not.toHaveBeenCalled(); expect(screen.getByRole("button", { name: "clearSelection" })).toBeDisabled(); expect(busy).toHaveBeenLastCalledWith(true);
    rerender(<${component} {...props} selectedIds={["newer-selection"]} />);
    await act(async () => { confirm({ status: "confirmed" }); }); expect(execute).toHaveBeenCalledExactlyOnceWith(["first", "other-page"]);
    await act(async () => { reject(new Error("rejected")); }); expect(screen.getByRole("alert")).toHaveTextContent("failed"); expect(selection).not.toHaveBeenCalled(); expect(busy).toHaveBeenLastCalledWith(false);
  });
  it("cancellation performs no write and successful action removes only captured IDs", async () => {
    const execute = vi.fn(async () => {}); const selection = vi.fn(); const user = userEvent.setup();
    feedback.confirm.mockResolvedValueOnce({ status: "cancelled" });
    const props = { selectedIds: ["a", "a"], currentPageIds: ["a", "b"], onSelectionChange: selection, onExecute: execute };
    const { rerender } = render(<${component} {...props} />);
    await user.click(screen.getByRole("button", { name: "run" })); await waitFor(() => expect(screen.getByRole("button", { name: "run" })).toBeEnabled()); expect(execute).not.toHaveBeenCalled(); expect(selection).not.toHaveBeenCalled();
    let confirm!: (value: { status: "confirmed" }) => void; feedback.confirm.mockImplementationOnce(() => new Promise(resolve => { confirm = resolve; }));
    await user.click(screen.getByRole("button", { name: "run" })); rerender(<${component} {...props} selectedIds={["a", "later"]} />);
    await act(async () => { confirm({ status: "confirmed" }); }); expect(execute).toHaveBeenCalledExactlyOnceWith(["a"]); expect(selection).toHaveBeenCalledExactlyOnceWith(["later"]);
  });
});`,
    ),
    file(
      `${test}/models/${n}.test.ts`,
      `import { describe, expect, it } from "vitest";
import { select${n}Page, remove${n}Completed } from "${entry}";
describe("${n} explicit IDs", () => { it("adds only current-page IDs and preserves other-page selection", () => { expect(select${n}Page(["other", "a"], ["a", "b"])).toEqual(["other", "a", "b"]); expect(remove${n}Completed(["a", "later", "a"], ["a"])).toEqual(["later"]); }); });`,
    ),
  ];
}
/** The existing component renderer owns all unmatched variants. */
export function renderCollectionRecipes(kind, context) {
  if (kind !== "component") return undefined;
  const renderer = {
    "filter-bar": filters,
    "related-records": related,
    "bulk-actions": bulk,
  }[context.variant];
  return renderer ? [...locales(context), ...renderer(context)] : undefined;
}
