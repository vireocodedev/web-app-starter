import {
  control,
  defaultValue,
  displayValue,
  fieldTranslations,
  fieldType,
  hasChoices,
  optionImport,
  optionMembers,
  optionTypes,
  optionsParameter,
  optionsProp,
  richAssertions,
  sampleValue,
  schemaField,
  valueType,
} from "./frontend-fields.mjs";
/** Pure workflow recipes; callers retain transport, persistence and result authority. */
const file = (path, content) => ({ path, content: `${content.trim()}\n` });
const role = (name, suffix) => (name.endsWith(suffix) ? name : `${name}${suffix}`);
function paths(c) {
  return {
    owner: `frontend/src/features/${c.feature.kebab}`,
    entry: `@/features/${c.feature.kebab}`,
    key: `generated.${c.translationId}`,
    locale: `frontend/src/app/localization/translations/generated/${c.translationId}`,
    example: kind =>
      `frontend/src/pages/development-guide/generated/${kind}/${c.feature.kebab}--${c.name.kebab}.example.tsx`,
  };
}
function locales(c) {
  const { locale } = paths(c);
  const en = {
    ...fieldTranslations.en,
    title: c.name.title,
    search: "Search all fields",
    filter: `Filter ${c.fields[0].label}`,
    create: "Create record",
    edit: "Edit record",
    details: "Record details",
    actions: "Actions",
    view: "View",
    save: "Save changes",
    required: "This field is required.",
    max: "Use no more than {{max}} characters.",
    failed: "Changes could not be saved. Try again.",
    saved: "Changes saved.",
    empty: "No matching records.",
    loading: "Loading records…",
    error: "Records could not be loaded.",
    retry: "Try again",
    rowsPerPage: "Rows per page",
    displayed: "{{from}}–{{to}} / {{count}}",
    first: "First page",
    last: "Last page",
    next: "Next page",
    previous: "Previous page",
    close: "Close workspace panel",
    resize: "Resize workspace panel",
    discardTitle: "Discard changes?",
    discardMessage: "Your unsaved changes will be lost.",
    discard: "Discard changes",
    keepEditing: "Keep editing",
    start: "Period start (inclusive)",
    end: "Period end (inclusive)",
    apply: "Apply report filters",
    prerequisite: "Choose a valid start and end date, then apply the filters.",
    period: "Applied period: {{start}} – {{end}} (calendar dates)",
    recordedOn: "Recorded on",
    total: "Matching records",
    visible: "Records on this page",
    scope: "Export scope",
    currentPage: "Current page",
    allMatches: "All matching records",
    export: "Download CSV",
    exporting: "Preparing download…",
    exportFailed: "The export failed. Try again.",
    exportDone: "Download prepared: {{count}} records · {{scope}} · {{start}} – {{end}}",
    fields: Object.fromEntries(c.fields.map(f => [f.name, f.label])),
  };
  const hr = {
    ...fieldTranslations.hr,
    title: c.name.title,
    search: "Pretraži sva polja",
    filter: `Filtriraj: ${c.fields[0].labelHr ?? c.fields[0].label}`,
    create: "Stvori zapis",
    edit: "Uredi zapis",
    details: "Detalji zapisa",
    actions: "Radnje",
    view: "Prikaži",
    save: "Spremi promjene",
    required: "Ovo je polje obavezno.",
    max: "Unesite najviše {{max}} znakova.",
    failed: "Promjene nije moguće spremiti. Pokušajte ponovno.",
    saved: "Promjene su spremljene.",
    empty: "Nema odgovarajućih zapisa.",
    loading: "Učitavanje zapisa…",
    error: "Zapise nije moguće učitati.",
    retry: "Pokušaj ponovno",
    rowsPerPage: "Redaka po stranici",
    displayed: "{{from}}–{{to}} / {{count}}",
    first: "Prva stranica",
    last: "Posljednja stranica",
    next: "Sljedeća stranica",
    previous: "Prethodna stranica",
    close: "Zatvori panel radnog prostora",
    resize: "Promijeni veličinu panela",
    discardTitle: "Odbaciti promjene?",
    discardMessage: "Nespremljene promjene bit će izgubljene.",
    discard: "Odbaci promjene",
    keepEditing: "Nastavi uređivati",
    start: "Početak razdoblja (uključivo)",
    end: "Kraj razdoblja (uključivo)",
    apply: "Primijeni filtre izvještaja",
    prerequisite: "Odaberite valjani početni i završni datum pa primijenite filtre.",
    period: "Primijenjeno razdoblje: {{start}} – {{end}} (kalendarski datumi)",
    recordedOn: "Datum zapisa",
    total: "Odgovarajući zapisi",
    visible: "Zapisi na ovoj stranici",
    scope: "Opseg izvoza",
    currentPage: "Trenutačna stranica",
    allMatches: "Svi odgovarajući zapisi",
    export: "Preuzmi CSV",
    exporting: "Priprema preuzimanja…",
    exportFailed: "Izvoz nije uspio. Pokušajte ponovno.",
    exportDone: "Preuzimanje je pripremljeno: {{count}} zapisa · {{scope}} · {{start}} – {{end}}",
    fields: Object.fromEntries(
      c.fields.map(f => [
        f.name,
        f.labelHr ??
          {
            name: "Naziv",
            title: "Naslov",
            description: "Opis",
            notes: "Bilješke",
            quantity: "Količina",
            budget: "Proračun",
            active: "Aktivno",
            dueOn: "Rok",
            status: "Status",
            owner: "Odgovorna osoba",
            email: "E-pošta",
          }[f.name] ??
          f.label,
      ]),
    ),
  };
  return [
    file(`${locale}.en.ts`, `export const translations = ${JSON.stringify(en, null, 2)} as const;`),
    file(
      `${locale}.hr.ts`,
      `import type { StringLeaves } from "../../types/TranslationShape";\nimport type { translations as english } from "./${c.translationId}.en";\nexport const translations = ${JSON.stringify(hr, null, 2)} as const satisfies StringLeaves<typeof english>;`,
    ),
  ];
}
function model(c, report) {
  const { owner, key } = paths(c),
    n = c.name.pascal;
  return file(
    `${owner}/models/${n}.ts`,
    `import type { RgoDesktopTableState } from "@rgo-web/frontend";
import type { TFunction } from "i18next";
import { z } from "zod";
${optionTypes(c)}
export type ${n}Values = Readonly<{ ${c.fields.map(f => `${f.name}: ${valueType(f)}`).join("; ")} }>;
export type ${n}Row = Readonly<{ id: string; values: ${n}Values;${report ? " recordedOn: string;" : ""} }>;
export type ${n}Request = Readonly<{ search: string; filter: string; table: RgoDesktopTableState;${report ? " start: string; end: string;" : ""} }>;
export function buildDefault${n}Values(): ${n}Values { return { ${c.fields.map(f => `${f.name}: ${defaultValue(f)}`).join(", ")} }; }
export function buildDefault${n}Request(): ${n}Request { return { search: "", filter: "", table: { page: 0, rowsPerPage: 5, sort: null }${report ? ', start: "", end: ""' : ""} }; }
export function create${n}Schema(t: TFunction<"translation">${optionsParameter(c)}) { void t; return z.object({
${c.fields.map(f => `  ${f.name}: ${schemaField(f, key)},`).join("\n")}
}); }
/** Filter/size/sort changes reset page; paging alone keeps its requested page. */
export function change${n}Table(request: ${n}Request, table: RgoDesktopTableState): ${n}Request {
  const reset = request.table.rowsPerPage !== table.rowsPerPage || request.table.sort?.columnId !== table.sort?.columnId || request.table.sort?.direction !== table.sort?.direction;
  return { ...request, table: { ...table, page: reset ? 0 : table.page } };
}
/** Bounded fixture/client adapter only. Production callers supply a server-resolved page. */
export function select${n}Matches(rows: readonly ${n}Row[], request: ${n}Request): ${n}Row[] {
  const search = request.search.trim().toLocaleLowerCase();
  const filter = request.filter.trim().toLocaleLowerCase();
  const matches = rows.filter(row => ${report ? "row.recordedOn >= request.start && row.recordedOn <= request.end && " : ""}Object.values(row.values).some(value => String(value ?? "").toLocaleLowerCase().includes(search)) && String(row.values.${c.fields[0].name} ?? "").toLocaleLowerCase().includes(filter));
  const sort = request.table.sort;
  if (sort) matches.sort((left, right) => {
    const field = sort.columnId.replace(/^values\\./, "") as keyof ${n}Values;
    const comparison = ${report ? 'sort.columnId === "recordedOn" ? left.recordedOn.localeCompare(right.recordedOn) : ' : ""}(typeof left.values[field] === "number" && typeof right.values[field] === "number" ? Number(left.values[field]) - Number(right.values[field]) : typeof left.values[field] === "boolean" && typeof right.values[field] === "boolean" ? Number(left.values[field]) - Number(right.values[field]) : String(left.values[field] ?? "").localeCompare(String(right.values[field] ?? "")));
    return (sort.direction === "asc" ? comparison : -comparison) || left.id.localeCompare(right.id);
  });
  return matches;
}
${
  report
    ? `export type ${n}ExportScope = "current-page" | "all-matches";
export type ${n}ExportRequest = Readonly<{ scope: ${n}ExportScope; request: ${n}Request }>;
/** ISO calendar dates with inclusive endpoints; the API owner chooses time-zone conversion. */
export function is${n}PeriodValid(start: string, end: string): boolean {
  const valid = (value: string) => /^\\d{4}-\\d{2}-\\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
  return valid(start) && valid(end) && start <= end;
}
/** Quote every CSV cell and neutralize spreadsheet formula prefixes. */
export function encode${n}CsvCell(value: string): string {
  const safe = /^[\\s]*[=+@-]/.test(value) || /^[\\t\\r\\n]/.test(value) ? "'" + value : value;
  return '"' + safe.replaceAll('"', '""') + '"';
}`
    : `export type ${n}SaveCommand = Readonly<{ mode: "create"; values: ${n}Values }> | Readonly<{ mode: "edit"; expected: ${n}Row; values: ${n}Values }>;
export type ${n}View = Readonly<{ mode: "create" }> | Readonly<{ mode: "details" | "edit"; row: ${n}Row }>;`
}`,
  );
}
function table(c, report) {
  const { owner, key } = paths(c),
    n = c.name.pascal,
    component = role(n, "Table");
  return file(
    `${owner}/components/${component}.tsx`,
    `
${report ? "" : `import { Button, Stack } from "@mui/material";`}
import { RgoDesktopTable, type TableColumnDef } from "@rgo-web/frontend";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { useAppDisplayPreferences } from "@/app/theme/preferences/useAppDisplayPreferences";
import { change${n}Table, type ${n}Request, type ${n}Row${optionImport(c)} } from "../models/${n}";
export type ${component}Props = Readonly<{ rows: readonly ${n}Row[]; totalCount: number; ${optionsProp(c)} request: ${n}Request; onRequestChange: (request: ${n}Request) => void; loading: boolean;${report ? "" : ` onDetails: (row: ${n}Row) => void; onEdit: (row: ${n}Row) => void;`} }>;
export function ${component}(props: ${component}Props) {
  const { t } = useAppTranslation();
  const { desktopTableSize } = useAppDisplayPreferences();
  ${hasChoices(c) ? `const options = props.options ?? empty${n}Options;` : ""}
  const columns: readonly TableColumnDef<${n}Row>[] = [
${report ? `    { id: "recordedOn", header: t("${key}.recordedOn"), renderCell: ({ row }) => row.recordedOn, sort: { serverField: "recordedOn" } },` : ""}
${c.fields.map((f, i) => `    { id: "values.${f.name}", header: t("${key}.fields.${f.name}"), renderCell: ({ row }) => ${displayValue(f, `row.values.${f.name}`, key)}, ${i === 0 ? "rowHeader: true, " : ""}sort: { serverField: "${f.name}" } },`).join("\n")}
${report ? "" : `    { id: "__actions", header: t("${key}.actions"), renderCell: ({ row }) => <Stack direction="row" spacing={1}><Button onClick={() => props.onDetails(row)} aria-label={t("${key}.view") + ": " + row.values.${c.fields[0].name}}>{t("${key}.view")}</Button><Button onClick={() => props.onEdit(row)} aria-label={t("${key}.edit") + ": " + row.values.${c.fields[0].name}}>{t("${key}.edit")}</Button></Stack> },`}
  ];
  return <RgoDesktopTable mode="server" rows={props.rows} columns={columns} totalCount={props.totalCount}
    state={props.request.table} onStateChange={next => props.onRequestChange(change${n}Table(props.request, next))}
    getRowKey={row => row.id} tableLabel={t("${key}.title")} emptyContent={t("${key}.empty")}
    size={desktopTableSize} loading={props.loading} loadingLabel={t("${key}.loading")} loadingContent={t("${key}.loading")}
    pagination={{ rowsPerPageOptions: [5, 10, 25], labelRowsPerPage: t("${key}.rowsPerPage"),
      labelDisplayedRows: ({ from, to, count }) => t("${key}.displayed", { from, to, count }),
      getItemAriaLabel: type => t(({ first: "${key}.first", last: "${key}.last", next: "${key}.next", previous: "${key}.previous" } as const)[type]), }}
    sx={{ minWidth: 0, "& .MuiTablePagination-toolbar": { flexWrap: "wrap", gap: 1, px: 1 }, "& .MuiTablePagination-spacer": { display: "none" }, "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { m: 0 } }} />;
}`,
  );
}
function workspace(c) {
  const { owner, key } = paths(c),
    n = c.name.pascal,
    component = role(n, "Workspace"),
    panel = role(n, "Panel"),
    form = role(n, "Form"),
    tab = role(n, "Table");
  return [
    file(
      `${owner}/components/${form}.tsx`,
      `import { Alert } from "@mui/material";
import { RgoContainerGrid, RgoFormGroup, useRgoForm } from "@rgo-web/frontend";
import { useStore } from "@tanstack/react-form";
import { useFormStateReporter } from "@/app/forms/hooks/useFormStateReporter";
import type { AppEntityFormProps } from "@/app/forms/types/AppEntityForm";
import { buildAppEntityFormOptions } from "@/app/forms/utils/buildAppEntityFormOptions";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { buildDefault${n}Values, create${n}Schema, type ${n}Values${optionImport(c)} } from "../models/${n}";
export function ${form}(props: AppEntityFormProps<${n}Values> & Readonly<{ ${optionsProp(c)} }>) {
  const { t } = useAppTranslation();
  ${hasChoices(c) ? `const options = props.options ?? empty${n}Options;` : ""}
  const form = useRgoForm({ defaultValues: props.group === RgoFormGroup.CREATE ? buildDefault${n}Values() : props.initialValue, ...buildAppEntityFormOptions(create${n}Schema(t${hasChoices(c) ? ", options" : ""}), props) });
  useFormStateReporter(form.store, props.onStateChange);
  const submitting = useStore(form.store, state => state.isSubmitting);
  return <form.AppForm><form.Form><RgoContainerGrid container columns={{ xs: 1, sm: 2 }} spacing={2}>
    {props.saveFailed ? <RgoContainerGrid size={{ xs: 1, sm: 2 }}><Alert severity="error">{t("${key}.failed")}</Alert></RgoContainerGrid> : null}
${c.fields.map(f => `    <RgoContainerGrid size={1}><form.AppField name="${f.name}">{field => ${control(f, key, { disabled: "submitting" })}}</form.AppField></RgoContainerGrid>`).join("\n")}
    <RgoContainerGrid size={{ xs: 1, sm: 2 }}><form.SubmitButton disabled={submitting} variant="contained">{t(props.group === RgoFormGroup.CREATE ? "${key}.create" : "${key}.save")}</form.SubmitButton></RgoContainerGrid>
  </RgoContainerGrid></form.Form></form.AppForm>;
}`,
    ),
    file(
      `${owner}/components/${panel}.tsx`,
      `import { Box, Button, Stack, Typography } from "@mui/material";
import { RgoFormGroup, RgoOverlayFrame, type RgoOverlayBeforeClose, type RgoOverlayContentProps } from "@rgo-web/frontend";
import { useCallback, useState } from "react";
import type { AppFormState } from "@/app/forms/types/AppEntityForm";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import type { AppOverlayViewSession } from "@/app/overlays/hooks/useAppMultiViewOverlay";
import  { ${hasChoices(c) ? `empty${n}Options, type ${n}ChoiceOptions, ` : ""}type ${n}Row, type ${n}SaveCommand, type ${n}View } from "../models/${n}";
import { ${form} } from "./${form}";
export type ${panel}Props = RgoOverlayContentProps<void> & Readonly<{
  ${optionsProp(c)} session: AppOverlayViewSession<${n}View>; editorState: AppFormState; beforeClose: RgoOverlayBeforeClose;
  onSave: (command: ${n}SaveCommand) => Promise<void>; onEdit: (row: ${n}Row) => void;
  onStateChange: (sessionId: number, state: AppFormState) => void; onSaved: (sessionId: number) => boolean;
}>;
function Editor({ session, onSave, onStateChange, onSaved, overlay${hasChoices(c) ? ", options" : ""} }: ${panel}Props) {
  const [failed, setFailed] = useState(false);
  const view = session.view;
  const reportState = useCallback((state: AppFormState) => onStateChange(session.sessionId, state), [onStateChange, session.sessionId]);
  if (view.mode === "details") return null;
  const shared = { ${hasChoices(c) ? "options, " : ""}onSaved: async () => { if (onSaved(session.sessionId)) await overlay.complete(undefined); },
    onStateChange: reportState, saveFailed: failed,
    onSubmit: async (values: Parameters<typeof onSave>[0]["values"]) => {
      setFailed(false);
      try { await onSave(view.mode === "create" ? { mode: "create", values } : { mode: "edit", expected: view.row, values }); }
      catch (error) { setFailed(true); throw error; }
    } };
  return view.mode === "create" ? <${form} group={RgoFormGroup.CREATE} {...shared} /> : <${form} group={RgoFormGroup.UPDATE} initialValue={view.row.values} {...shared} />;
}
export function ${panel}(props: ${panel}Props) {
  const { t } = useAppTranslation();
  const view = props.session.view;
  ${hasChoices(c) ? `const options = props.options ?? empty${n}Options;` : ""}
  return <RgoOverlayFrame beforeClose={props.beforeClose} busy={props.editorState.submitting} title={t(view.mode === "create" ? "${key}.create" : view.mode === "edit" ? "${key}.edit" : "${key}.details")}>
    {view.mode === "details" ? <Stack spacing={2}><Box component="dl" sx={{ m: 0 }}>
${c.fields.map(f => `      <Box sx={{ mb: 2 }}><Typography component="dt" color="text.secondary">{t("${key}.fields.${f.name}")}</Typography><Typography component="dd" sx={{ m: 0, overflowWrap: "anywhere" }}>{${displayValue(f, `view.row.values.${f.name}`, key)}}</Typography></Box>`).join("\n")}
      </Box><Button variant="contained" onClick={() => props.onEdit(view.row)}>{t("${key}.edit")}</Button></Stack>
      : <Editor key={props.session.sessionId} {...props} />}
  </RgoOverlayFrame>;
}`,
    ),
    file(
      `${owner}/components/${component}.tsx`,
      `import { Alert, Button, Paper, Stack, TextField, Typography, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { RgoOverlayProvider, useRgoFeedback, useRgoOverlays } from "@rgo-web/frontend";
import { useEffect, useRef } from "react";
import type { AppFormState } from "@/app/forms/types/AppEntityForm";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { useAppMultiViewOverlay } from "@/app/overlays/hooks/useAppMultiViewOverlay";
import type { ${n}Request, ${n}Row, ${n}SaveCommand, ${n}View${hasChoices(c) ? `, ${n}ChoiceOptions` : ""} } from "../models/${n}";
import { ${panel}, type ${panel}Props } from "./${panel}";
import { ${tab} } from "./${tab}";
export type ${component}Props = Readonly<{ rows: readonly ${n}Row[]; totalCount: number; ${optionsProp(c)} request: ${n}Request;
  onRequestChange: (request: ${n}Request) => void; state: "ready" | "loading" | "error"; onRetry: () => void;
  /** Resolve only after authoritative acknowledgement. Observer/refresh failure must not reject a committed save. */
  onSave: (command: ${n}SaveCommand) => Promise<void>;
}>;
type Patch = Pick<${panel}Props, "editorState" | "onSave"${hasChoices(c) ? ` | "options"` : ""}>;
function WorkspaceBody(props: ${component}Props) {
  const { t } = useAppTranslation();
  const feedback = useRgoFeedback();
  const overlays = useRgoOverlays();
  const editor = useRef<AppFormState>({ dirty: false, submitting: false });
  const controller = useAppMultiViewOverlay<${n}View, Patch>({
    sameView: (a, b) => a.mode === b.mode && (a.mode === "create" || (b.mode !== "create" && a.row.id === b.row.id)),
    canLeave: async ({ view }, signal) => {
      if (view.mode === "details") return true;
      if (editor.current.submitting) return false;
      if (!editor.current.dirty) return true;
      const result = await feedback.confirm({ title: t("${key}.discardTitle"), message: t("${key}.discardMessage"), confirmLabel: t("${key}.discard"), cancelLabel: t("${key}.keepEditing"), destructive: true, signal });
      return result.status === "confirmed" && !editor.current.submitting;
    },
    mount: (session, controls) => {
      editor.current = { dirty: false, submitting: false };
      const handle = overlays.open(${panel}, { session, ${hasChoices(c) ? "options: props.options, " : ""}editorState: editor.current, beforeClose: controls.beforeClose, onSave: props.onSave,
        onEdit: row => void controls.show({ mode: "edit", row }),
        onStateChange: (sessionId, state) => { if (!controls.isCurrent(sessionId)) return; if (editor.current.dirty === state.dirty && editor.current.submitting === state.submitting) return; editor.current = state; controls.updateProps({ editorState: state }); },
        onSaved: sessionId => { if (!controls.isCurrent(sessionId)) return false; editor.current = { dirty: false, submitting: false }; return true; },
      }, { presentation: "modal-panel", side: "right", width: 480, minWidth: 320, maxWidth: 720, resizable: true });
      return { result: handle.result, updateProps: patch => handle.updateProps(patch), updateView: next => { editor.current = { dirty: false, submitting: false }; handle.updateProps({ session: next, editorState: editor.current }); } };
    },
  });
  const { updateProps } = controller;
  useEffect(() => { updateProps({ onSave: props.onSave${hasChoices(c) ? ", options: props.options" : ""} }); }, [props.onSave${hasChoices(c) ? ", props.options" : ""}, updateProps]);
  const changeFilter = (patch: Partial<Pick<${n}Request, "search" | "filter">>) => props.onRequestChange({ ...props.request, ...patch, table: { ...props.request.table, page: 0 } });
  return <Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 3 }, minWidth: 0, overflow: "hidden" }}><Stack spacing={2}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}><Typography component="h2" variant="h5">{t("${key}.title")}</Typography><Button variant="contained" onClick={() => void controller.show({ mode: "create" })}>{t("${key}.create")}</Button></Stack>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}><TextField label={t("${key}.search")} value={props.request.search} onChange={e => changeFilter({ search: e.target.value })} fullWidth /><TextField label={t("${key}.filter")} value={props.request.filter} onChange={e => changeFilter({ filter: e.target.value })} fullWidth /></Stack>
    {props.state === "error" ? <Alert severity="error" action={<Button color="inherit" onClick={props.onRetry}>{t("${key}.retry")}</Button>}>{t("${key}.error")}</Alert>
    : <${tab} {...props} rows={props.state === "loading" ? [] : props.rows} loading={props.state === "loading"} onDetails={row => void controller.show({ mode: "details", row })} onEdit={row => void controller.show({ mode: "edit", row })} />}
  </Stack></Paper>;
}
/** Mount with a stable owner key when switching viewer/workspace; this owns only UI sessions. */
export function ${component}(props: ${component}Props) {
  const { t } = useAppTranslation();
  const feedback = useRgoFeedback();
  const bottomDrawer = useMediaQuery(useTheme().breakpoints.down("md"));
  return <RgoOverlayProvider pageKey="${c.translationId}" bottomDrawer={bottomDrawer} closeLabel={t("${key}.close")} resizeLabel={t("${key}.resize")} onError={() => feedback.notify({ id: "${c.translationId}-overlay-error", severity: "error", message: t("${key}.error") })}><WorkspaceBody {...props} /></RgoOverlayProvider>;
}`,
    ),
  ];
}
function report(c) {
  const { owner, key } = paths(c),
    n = c.name.pascal,
    component = role(n, "Report"),
    tab = role(n, "Table");
  return file(
    `${owner}/components/${component}.tsx`,
    `import { Alert, Box, Button, MenuItem, Paper, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { buildDefault${n}Request, is${n}PeriodValid, type ${n}ExportRequest, type ${n}ExportScope, type ${n}Request, type ${n}Row } from "../models/${n}";
import { ${tab} } from "./${tab}";
export type ${component}Props = Readonly<{
  request: ${n}Request | null; onRequestChange: (request: ${n}Request) => void;
  rows: readonly ${n}Row[]; totalCount: number; state: "ready" | "loading" | "error"; onRetry: () => void;
  /** The owner fetches the captured scope and resolves only once the download is prepared. */
  onExport: (request: ${n}ExportRequest) => Promise<Readonly<{ count: number }>>;
}>;
export function ${component}(props: ${component}Props) {
  const { t } = useAppTranslation();
  const [draft, setDraft] = useState(() => props.request ?? buildDefault${n}Request());
  const [scope, setScope] = useState<${n}ExportScope>("current-page");
  const [exportState, setExportState] = useState<"idle" | "pending" | "error">("idle");
  const [receipt, setReceipt] = useState<Readonly<{ count: number; captured: ${n}ExportRequest }> | null>(null);
  const pending = useRef(false);
  const generation = useRef(0);
  useEffect(() => () => { generation.current += 1; }, []);
  const valid = is${n}PeriodValid(draft.start, draft.end);
  const scopeLabel = (value: ${n}ExportScope) => t(value === "current-page" ? "${key}.currentPage" : "${key}.allMatches");
  const runExport = async () => {
    if (pending.current || !props.request || props.state !== "ready" || props.totalCount === 0 || (scope === "current-page" && props.rows.length === 0)) return;
    const captured: ${n}ExportRequest = { scope, request: { ...props.request, table: { ...props.request.table, sort: props.request.table.sort ? { ...props.request.table.sort } : null } } };
    const operation = generation.current;
    pending.current = true; setReceipt(null); setExportState("pending");
    try {
      const result = await props.onExport(captured);
      if (generation.current !== operation) return;
      setReceipt({ count: result.count, captured }); setExportState("idle");
    } catch {
      if (generation.current === operation) setExportState("error");
    } finally { if (generation.current === operation) pending.current = false; }
  };
  return <Stack spacing={3} sx={{ minWidth: 0, width: "100%" }}>
    <Typography component="h2" variant="h4">{t("${key}.title")}</Typography>
    <Paper component="form" variant="outlined" onSubmit={event => { event.preventDefault(); if (valid) props.onRequestChange({ ...draft, table: { ...(props.request?.table ?? draft.table), page: 0 } }); }} sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2}>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" } }}>
          <TextField type="date" label={t("${key}.start")} value={draft.start} onChange={e => setDraft({ ...draft, start: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} required fullWidth />
          <TextField type="date" label={t("${key}.end")} value={draft.end} onChange={e => setDraft({ ...draft, end: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} required fullWidth />
          <TextField label={t("${key}.search")} value={draft.search} onChange={e => setDraft({ ...draft, search: e.target.value })} fullWidth />
          <TextField label={t("${key}.filter")} value={draft.filter} onChange={e => setDraft({ ...draft, filter: e.target.value })} fullWidth />
        </Box>
        <Button type="submit" variant="contained" disabled={!valid} sx={{ alignSelf: "flex-start" }}>{t("${key}.apply")}</Button>
      </Stack>
    </Paper>
    {!props.request ? <Alert severity="info">{t("${key}.prerequisite")}</Alert> : <>
      <Typography color="text.secondary">{t("${key}.period", { start: props.request.start, end: props.request.end })}</Typography>
      {props.state === "error" ? <Alert severity="error" action={<Button color="inherit" onClick={props.onRetry}>{t("${key}.retry")}</Button>}>{t("${key}.error")}</Alert> : <>
        {props.state === "ready" ? <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: "wrap" }}>
          <Paper variant="outlined" sx={{ p: 2, minWidth: 160 }}><Typography color="text.secondary">{t("${key}.total")}</Typography><Typography variant="h4">{props.totalCount}</Typography></Paper>
          <Paper variant="outlined" sx={{ p: 2, minWidth: 160 }}><Typography color="text.secondary">{t("${key}.visible")}</Typography><Typography variant="h4">{props.rows.length}</Typography></Paper>
        </Stack> : null}
        <Paper variant="outlined" sx={{ minWidth: 0, overflow: "hidden" }}><${tab} rows={props.state === "loading" ? [] : props.rows} totalCount={props.totalCount} request={props.request} onRequestChange={props.onRequestChange} loading={props.state === "loading"} /></Paper>
      </>}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
        <TextField select label={t("${key}.scope")} value={scope} onChange={event => setScope(event.target.value as ${n}ExportScope)} disabled={exportState === "pending"} sx={{ minWidth: { sm: 240 } }}>
          <MenuItem value="current-page">{t("${key}.currentPage")}</MenuItem><MenuItem value="all-matches">{t("${key}.allMatches")}</MenuItem>
        </TextField>
        <Button variant="contained" onClick={() => void runExport()} disabled={exportState === "pending" || props.state !== "ready" || props.totalCount === 0 || (scope === "current-page" && props.rows.length === 0)}>{t(exportState === "pending" ? "${key}.exporting" : "${key}.export")}</Button>
      </Stack>
    </>}
    {exportState === "pending" ? <Typography role="status">{t("${key}.exporting")}</Typography> : null}
    {exportState === "error" ? <Alert severity="error">{t("${key}.exportFailed")}</Alert> : null}
    {receipt ? <Alert severity="success">{t("${key}.exportDone", { count: receipt.count, scope: scopeLabel(receipt.captured.scope), start: receipt.captured.request.start, end: receipt.captured.request.end })}</Alert> : null}
  </Stack>;
}`,
  );
}
function example(c, isReport) {
  const { key, entry, example } = paths(c),
    n = c.name.pascal,
    component = role(n, isReport ? "Report" : "Workspace");
  return file(
    example(isReport ? "page" : "feature"),
    `import { Alert, FormControlLabel, MenuItem, Stack, Switch, TextField } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { ${component}, ${isReport ? "" : `buildDefault${n}Request, `}select${n}Matches, ${isReport ? `encode${n}CsvCell, type ${n}ExportRequest` : `type ${n}SaveCommand`}, type ${n}Request, type ${n}Row } from "${entry}";
export function Component() {
  const { t } = useAppTranslation();
  const { t: guideT } = useDevelopmentGuideTranslation();
  const initialRows = useMemo<readonly ${n}Row[]>(() => Array.from({ length: 14 }, (_, index) => ({ id: "sample-" + String(index + 1).padStart(2, "0"), values: {
${c.fields.map(f => `    ${f.name}: ${sampleValue(f, `(guideT("generatedExamples.sampleRecord") + " " + String(index + 1).padStart(2, "0") + " · " + t("${key}.fields.${f.name}")).slice(0, ${f.maxLength ?? 500})`)},`).join("\n")}
  }${isReport ? ', recordedOn: "2026-01-" + String(index + 1).padStart(2, "0")' : ""} })), [${c.fields.some(f => ["string", "multiline"].includes(fieldType(f))) ? "t, guideT" : ""}]);
  ${isReport ? "const rows = initialRows;" : "const [rows, setRows] = useState(initialRows);"}
  const [request, setRequest] = useState<${n}Request${isReport ? " | null" : ""}>(() => ${isReport ? "null" : `buildDefault${n}Request()`});
  const [state, setState] = useState<"ready" | "loading" | "empty" | "error">("ready");
  const [failNext, setFailNext] = useState(false);
  ${isReport ? "" : "const [saved, setSaved] = useState(false);\n  const nextId = useRef(15);"}
  const lifetime = useRef(0);
  useEffect(() => () => { lifetime.current += 1; }, []);
  const matches = useMemo(() => request ? select${n}Matches(rows, request) : [], [rows, request]);
  const page = request ? matches.slice(request.table.page * request.table.rowsPerPage, (request.table.page + 1) * request.table.rowsPerPage) : [];
  ${
    isReport
      ? `const onExport = async (captured: ${n}ExportRequest) => {
    const operation = lifetime.current;
    const matching = select${n}Matches(rows, captured.request);
    const selected = captured.scope === "all-matches" ? matching : matching.slice(captured.request.table.page * captured.request.table.rowsPerPage, (captured.request.table.page + 1) * captured.request.table.rowsPerPage);
    await new Promise(resolve => window.setTimeout(resolve, 350));
    if (lifetime.current !== operation) throw new Error("Preview owner ended");
    if (failNext) { setFailNext(false); throw new Error("Simulated export failure"); }
    const lines = [[t("${key}.recordedOn"), ${c.fields.map(f => `t("${key}.fields.${f.name}")`).join(", ")}], ...selected.map(row => [row.recordedOn, ${c.fields.map(f => `row.values.${f.name}`).join(", ")}])];
    const text = lines.map(line => line.map(encode${n}CsvCell).join(",")).join("\\r\\n");
    const url = URL.createObjectURL(new Blob(["\\uFEFF", text], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "${c.name.kebab}-" + captured.scope + ".csv";
    document.body.append(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { count: selected.length };
  };`
      : `const onSave = async (command: ${n}SaveCommand) => {
    const operation = lifetime.current;
    await new Promise(resolve => window.setTimeout(resolve, 350));
    if (lifetime.current !== operation) throw new Error("Preview owner ended");
    if (failNext) { setFailNext(false); throw new Error("Simulated save failure"); }
    setRows(current => command.mode === "create" ? [...current, { id: "sample-" + nextId.current++, values: command.values }] : current.map(row => row.id === command.expected.id ? { ...row, values: command.values } : row));
    setSaved(true);
  };`
  }
  return <Stack spacing={3} sx={{ minWidth: 0 }}>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
      <TextField select label={guideT("generatedExamples.previewState")} value={state} onChange={event => setState(event.target.value as typeof state)} sx={{ minWidth: { sm: 240 } }}>
        <MenuItem value="ready">{guideT("generatedExamples.ready")}</MenuItem><MenuItem value="loading">{t("${key}.loading")}</MenuItem><MenuItem value="empty">{t("${key}.empty")}</MenuItem><MenuItem value="error">{t("${key}.error")}</MenuItem>
      </TextField>
      <FormControlLabel control={<Switch checked={failNext} onChange={event => setFailNext(event.target.checked)} />} label={guideT("generatedExamples.failNext")} />
    </Stack>
    ${isReport ? `<Alert severity="info">{guideT("generatedExamples.reportSampleHint")}</Alert>` : `{saved ? <Alert severity="success" onClose={() => setSaved(false)}>{t("${key}.saved")}</Alert> : null}`}
    <${component} ${hasChoices(c) ? `options={{ ${optionMembers(c, `guideT("generatedExamples.sampleRecord")`)} }} ` : ""}request={request} onRequestChange={next => { setRequest(next); setState("ready"); }} rows={state === "empty" ? [] : page} totalCount={state === "empty" ? 0 : matches.length} state={state === "empty" ? "ready" : state} onRetry={() => setState("ready")} ${isReport ? "onExport={onExport}" : "onSave={onSave}"} />
  </Stack>;
}`,
  );
}
function tests(c, isReport) {
  const { entry } = paths(c),
    n = c.name.pascal,
    first = c.fields[0],
    component = role(n, isReport ? "Report" : "Workspace");
  const firstKind = fieldType(first);
  const firstA = ["integer", "number"].includes(firstKind) ? "1" : firstKind === "boolean" ? "false" : '\"Alpha\"';
  const firstB = ["integer", "number"].includes(firstKind) ? "2" : firstKind === "boolean" ? "true" : '\"Beta\"';
  const matchingFilter = ["integer", "number"].includes(firstKind) ? "2" : firstKind === "boolean" ? "tru" : "bet";
  const values = c.fields
    .filter(f => f.name !== first.name)
    .map(f => `${f.name}: ${sampleValue(f, '"record"')}`)
    .join(", ");
  return [
    file(
      `frontend/tests/features/${c.feature.kebab}/models/${n}.test.ts`,
      `import { describe, expect, it } from "vitest";
import { buildDefault${n}Request, change${n}Table, select${n}Matches, ${isReport ? `is${n}PeriodValid, encode${n}CsvCell, ` : `create${n}Schema, `}type ${n}Row } from "${entry}";
${isReport ? "" : `import { createAppI18n } from "@/app/localization/createAppI18n";`}
describe("${n} collection ownership", () => {
  it("resets pagination after sorting or changing page size, but preserves paging", () => {
    const request = buildDefault${n}Request();
    expect(change${n}Table(request, { ...request.table, page: 2 }).table.page).toBe(2);
    expect(change${n}Table(request, { ...request.table, page: 2, rowsPerPage: 10 }).table.page).toBe(0);
    expect(change${n}Table(request, { ...request.table, page: 2, sort: { columnId: "values.${first.name}", direction: "desc" } }).table.page).toBe(0);
  });
  it("filters and orders the complete fixture before the caller selects a page", () => {
    const rows: readonly ${n}Row[] = [{ id: "b", values: { ${values ? values + ", " : ""}${first.name}: ${firstB} }${isReport ? ', recordedOn: "2026-01-02"' : ""} }, { id: "a", values: { ${values ? values + ", " : ""}${first.name}: ${firstA} }${isReport ? ', recordedOn: "2026-01-03"' : ""} }];
    const request = { ...buildDefault${n}Request(), ${isReport ? 'start: "2026-01-01", end: "2026-01-31", ' : ""}table: { page: 0, rowsPerPage: 1, sort: { columnId: "values.${first.name}", direction: "asc" as const } } };
    expect(select${n}Matches(rows, request).map(row => row.id)).toEqual(["a", "b"]);
    expect(select${n}Matches(rows, { ...request, filter: "${matchingFilter}" }).map(row => row.id)).toEqual(["b"]);
    expect(rows.map(row => row.id)).toEqual(["b", "a"]);
  });
${
  isReport
    ? `  it("uses valid inclusive calendar boundaries and rejects reversed or impossible periods", () => {
    expect(is${n}PeriodValid("2026-01-01", "2026-01-31")).toBe(true);
    expect(is${n}PeriodValid("2026-02-30", "2026-03-01")).toBe(false);
    expect(is${n}PeriodValid("2026-01-31", "2026-01-01")).toBe(false);
    expect(is${n}PeriodValid("", "")).toBe(false);
  });
  it("quotes commas, quotes and line breaks and neutralizes spreadsheet expressions", () => {
    expect(encode${n}CsvCell('A,"B"')).toBe('"A,""B"""');
    expect(encode${n}CsvCell("=1+1")).toBe('"\\'=1+1"');
    expect(encode${n}CsvCell("safe\\ntext")).toBe('"safe\\ntext"');
  });`
    : `  it("validates each declared field without conflating empty values, zero or false", () => {
    const schema = create${n}Schema(createAppI18n("en").getFixedT(null, "translation")${hasChoices(c) ? `, { ${optionMembers(c)} }` : ""});
    const accepted = { ${c.fields.map(f => `${f.name}: ${sampleValue(f, '" v "')}`).join(", ")} };
    ${richAssertions(c)}
  });`
}
});`,
    ),
    ...(isReport
      ? [
          file(
            `frontend/tests/features/${c.feature.kebab}/components/${component}.test.tsx`,
            `import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ${component}, buildDefault${n}Request, type ${component}Props } from "${entry}";
vi.mock("@/app/localization/hooks/useAppTranslation", () => ({ useAppTranslation: () => ({ t: (key: string) => key.split(".").at(-1) }) }));
vi.mock("@/app/theme/preferences/useAppDisplayPreferences", () => ({ useAppDisplayPreferences: () => ({ desktopTableSize: "small" }) }));
describe("${component} applied request", () => {
  it("requires a period and sends normalized filters only when applied", async () => {
    const change = vi.fn();
    render(<${component} request={null} onRequestChange={change} rows={[]} totalCount={0} state="ready" onRetry={vi.fn()} onExport={vi.fn()} />);
    expect(screen.getByRole("alert")).toHaveTextContent("prerequisite");
    expect(screen.getByRole("button", { name: "apply" })).toBeDisabled();
    await userEvent.setup().type(screen.getByLabelText("search"), "Draft search");
    expect(change).not.toHaveBeenCalled();
  });
  it("keeps the latest table sort and page size when applying edited filters", async () => {
    const change = vi.fn();
    const request = { ...buildDefault${n}Request(), start: "2026-01-01", end: "2026-01-31" };
    const props = { request, rows: [], totalCount: 30, state: "ready" as const, onRetry: vi.fn(), onRequestChange: change, onExport: vi.fn() };
    const { rerender } = render(<${component} {...props} />);
    const table = { page: 2, rowsPerPage: 10, sort: { columnId: "values.${first.name}", direction: "desc" as const } };
    rerender(<${component} {...props} request={{ ...request, table }} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("search"), "updated");
    await user.click(screen.getByRole("button", { name: "apply" }));
    expect(change).toHaveBeenCalledExactlyOnceWith({ ...request, search: "updated", table: { ...table, page: 0 } });
  });
  it("captures the applied request for one export while filters change", async () => {
    let finish!: (value: { count: number }) => void;
    const onExport = vi.fn<${component}Props["onExport"]>(() => new Promise<{ count: number }>(resolve => { finish = resolve; }));
    const request = { ...buildDefault${n}Request(), start: "2026-01-01", end: "2026-01-31" };
    const row = { id: "a", recordedOn: "2026-01-03", values: { ${c.fields.map(f => `${f.name}: ${sampleValue(f, '"record"')}`).join(", ")} } };
    const props = { request, rows: [row], totalCount: 1, state: "ready" as const, onRetry: vi.fn(), onRequestChange: vi.fn(), onExport };
    const { rerender } = render(<${component} {...props} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "export" }));
    expect(onExport).toHaveBeenCalledExactlyOnceWith({ scope: "current-page", request });
    expect(screen.getByRole("button", { name: "exporting" })).toBeDisabled();
    rerender(<${component} {...props} request={{ ...request, end: "2026-02-28" }} />);
    await act(async () => { finish({ count: 1 }); });
    expect(screen.getByRole("alert")).toHaveTextContent("exportDone");
    expect(onExport.mock.calls[0]?.[0]).toEqual({ scope: "current-page", request });
  });
  it("shows a read failure and retries the current request without exporting stale rows", async () => {
    const retry = vi.fn(); const onExport = vi.fn();
    const request = { ...buildDefault${n}Request(), start: "2026-01-01", end: "2026-01-31" };
    render(<${component} request={request} onRequestChange={vi.fn()} rows={[]} totalCount={5} state="error" onRetry={retry} onExport={onExport} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "retry" }));
    expect(retry).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "export" })).toBeDisabled();
    expect(onExport).not.toHaveBeenCalled();
  });
});`,
          ),
        ]
      : []),
  ];
}
/** Unmatched variants leave existing renderers and public contracts untouched. */
export function renderWorkflowWorkspaces(kind, context) {
  const isReport = kind === "page" && context.variant === "report";
  if (!isReport && !(kind === "feature" && context.variant === "workspace")) return undefined;
  const { owner, entry } = paths(context),
    n = context.name.pascal,
    component = role(n, isReport ? "Report" : "Workspace");
  const files = [
    ...locales(context),
    model(context, isReport),
    table(context, isReport),
    ...(isReport ? [report(context)] : workspace(context)),
    example(context, isReport),
    ...tests(context, isReport),
  ];
  files.push(
    file(
      `${owner}/index.ts`,
      `export { ${component} } from "./components/${component}";\nexport type { ${component}Props } from "./components/${component}";\nexport { buildDefault${n}Request, change${n}Table, select${n}Matches, ${isReport ? `is${n}PeriodValid, encode${n}CsvCell` : `buildDefault${n}Values, create${n}Schema`} } from "./models/${n}";\nexport type { ${n}Values, ${n}Row, ${n}Request, ${hasChoices(context) ? `${n}Option, ${n}ChoiceOptions, ` : ""}${isReport ? `${n}ExportScope, ${n}ExportRequest` : `${n}SaveCommand`} } from "./models/${n}";`,
    ),
  );
  if (isReport) {
    const page = role(n, "Page");
    files.push(
      file(
        `frontend/src/pages/${context.feature.kebab}/${page}.tsx`,
        `import { ${component}, type ${component}Props } from "${entry}";\nexport function ${page}(props: ${component}Props) { return <${component} {...props} />; }`,
      ),
    );
  }
  if (!isReport) {
    const panel = role(n, "Panel"),
      form = role(n, "Form");
    files.push(
      file(
        `frontend/tests/features/${context.feature.kebab}/components/${panel}.test.tsx`,
        `import { render } from "@testing-library/react";
import { useEffect, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import type { AppFormState } from "@/app/forms/types/AppEntityForm";
import { ${panel}, type ${panel}Props } from "${entry}/components/${panel}";
vi.mock("@/app/localization/hooks/useAppTranslation", () => ({ useAppTranslation: () => ({ t: (key: string) => key }) }));
vi.mock("@rgo-web/frontend", async importOriginal => ({
  ...(await importOriginal<typeof import("@rgo-web/frontend")>()),
  RgoOverlayFrame: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));
vi.mock("${entry}/components/${form}", () => ({ ${form}: ({ onStateChange }: { onStateChange: (state: AppFormState) => void }) => {
  useEffect(() => { onStateChange({ dirty: false, submitting: false }); }, [onStateChange]);
  return <div>Editor</div>;
} }));
describe("${panel} editor lifecycle", () => {
  it("keeps the form reporter stable when the parent publishes editor state", () => {
    const report = vi.fn();
    const props: ${panel}Props = {
      session: { sessionId: 1, view: { mode: "create" } }, editorState: { dirty: false, submitting: false },
      beforeClose: vi.fn(() => true), onSave: vi.fn(), onEdit: vi.fn(), onStateChange: report, onSaved: vi.fn(() => true),
      overlay: { close: vi.fn(async () => true), complete: vi.fn(async () => true) },
    };
    const { rerender } = render(<${panel} {...props} />);
    expect(report).toHaveBeenCalledExactlyOnceWith(1, { dirty: false, submitting: false });
    rerender(<${panel} {...props} editorState={{ dirty: false, submitting: false }} />);
    expect(report).toHaveBeenCalledOnce();
  });
});`,
      ),
    );
  }
  return files;
}
