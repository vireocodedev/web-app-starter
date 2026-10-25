/** Application-owned selection recipes. Rendering is pure; callers own transport and parent drafts. */
const file = (path, content) => ({ path, content: `${content.trim()}\n` });

function resources(c) {
  const en = {
    title: c.name.title,
    label: "Related record",
    loading: "Loading options…",
    empty: "No matching records.",
    failed: "Options could not be loaded. Your selection is retained.",
    retry: "Try again",
    clear: "Clear",
    open: "Open options",
    close: "Close options",
    create: "Create related record",
    name: "Name",
    required: "This field is required.",
    max: "Use no more than 160 characters.",
    save: "Create record",
    choose: "Use this record",
    cancel: "Cancel",
    created: "Record created. Choose it to update the parent draft.",
    createFailed: "Creation failed. Your draft is retained.",
    resolveFailed: "The record was created, but could not be loaded. Retry loading without creating it again.",
    discardTitle: "Discard this draft?",
    discardMessage: "The unsaved related-record draft will be discarded.",
    discard: "Discard",
    keep: "Keep editing",
    department: "Department",
    assignee: "Assignee",
    chooseDepartment: "Choose a department",
    chooseAssignee: "Choose an assignee",
    needsReason: "An exception needs explanation",
    reason: "Reason",
    relation: "Choose an assignee belonging to the selected department.",
    invalidDepartment: "Choose an available department.",
    reasonRequired: "Explain the exception.",
    dependencyHint: "Changing department keeps a compatible assignee and clears an incompatible choice.",
    reasonHint: "Turning the exception off clears its explanation.",
  };
  const hr = {
    title: c.name.title,
    label: "Povezani zapis",
    loading: "Učitavanje mogućnosti…",
    empty: "Nema odgovarajućih zapisa.",
    failed: "Mogućnosti nije moguće učitati. Odabir je sačuvan.",
    retry: "Pokušaj ponovno",
    clear: "Očisti",
    open: "Otvori mogućnosti",
    close: "Zatvori mogućnosti",
    create: "Stvori povezani zapis",
    name: "Naziv",
    required: "Ovo je polje obavezno.",
    max: "Unesite najviše 160 znakova.",
    save: "Stvori zapis",
    choose: "Koristi ovaj zapis",
    cancel: "Odustani",
    created: "Zapis je stvoren. Odaberite ga za ažuriranje nadređenog nacrta.",
    createFailed: "Stvaranje nije uspjelo. Nacrt je sačuvan.",
    resolveFailed: "Zapis je stvoren, ali ga nije moguće učitati. Ponovite učitavanje bez ponovnog stvaranja.",
    discardTitle: "Odbaciti ovaj nacrt?",
    discardMessage: "Nespremljeni nacrt povezanog zapisa bit će odbačen.",
    discard: "Odbaci",
    keep: "Nastavi uređivanje",
    department: "Odjel",
    assignee: "Zadužena osoba",
    chooseDepartment: "Odaberite odjel",
    chooseAssignee: "Odaberite zaduženu osobu",
    needsReason: "Iznimku je potrebno objasniti",
    reason: "Razlog",
    relation: "Odaberite osobu koja pripada odabranom odjelu.",
    invalidDepartment: "Odaberite dostupan odjel.",
    reasonRequired: "Objasnite iznimku.",
    dependencyHint: "Promjena odjela zadržava dopuštenu osobu i briše nedopušten odabir.",
    reasonHint: "Isključivanje iznimke briše njezino objašnjenje.",
  };
  const base = `frontend/src/app/localization/translations/generated/${c.translationId}`;
  return [
    file(`${base}.en.ts`, `export const translations = ${JSON.stringify(en, null, 2)} as const;`),
    file(
      `${base}.hr.ts`,
      `import type { StringLeaves } from "../../types/TranslationShape";
import type { translations as english } from "./${c.translationId}.en";
export const translations = ${JSON.stringify(hr, null, 2)} as const satisfies StringLeaves<typeof english>;`,
    ),
  ];
}

function picker(c, internal = false) {
  const name = c.name.pascal;
  const component = internal ? `${name}Lookup` : name;
  const k = `generated.${c.translationId}`;
  return file(
    `frontend/src/features/${c.feature.kebab}/components/${component}.tsx`,
    `import { Alert as _Alert, Autocomplete as _Autocomplete, Button as _Button, Stack as _Stack, TextField as _TextField, Typography as _Typography } from "@mui/material";
import { useLayoutEffect, useRef, useState } from "react";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";

export type ${name}Option = Readonly<{ id: string; label: string; description?: string; disabled?: boolean }>;
export type ${component}Props = Readonly<{
  value: ${name}Option | null;
  onChange: (option: ${name}Option | null) => void;
  search: (query: string, signal: AbortSignal) => Promise<readonly ${name}Option[]>;
  resolveOption: (id: string, signal: AbortSignal) => Promise<${name}Option>;
  /** Include viewer/workspace identity. Remount the parent draft when changing authority. */
  scopeKey: string;
  /** Optional persisted ID to hydrate once per mounted scope/ID; hydration never overwrites a later user choice. */
  initialId?: string | null;
  label?: string; disabled?: boolean; error?: string; required?: boolean;
}>;

/** Controlled selection; replaceable reads never own or mutate a shared cache. Keep reader callbacks stable. */
export function ${component}(props: ${component}Props) {
  return <${component}SelectionControl key={JSON.stringify([props.scopeKey, props.initialId])} {...props} />;
}
function ${component}SelectionControl({ value, onChange, search, resolveOption, scopeKey, initialId, label, disabled, error, required }: ${component}Props) {
  const { t } = useAppTranslation();
  const [query, setQuery] = useState("");
  const selectionBasis = JSON.stringify([scopeKey, value?.id, value?.label]);
  const [inputDraft, setInputDraft] = useState<Readonly<{ basis: string; text: string }> | null>(null);
  const input = inputDraft?.basis === selectionBasis ? inputDraft.text : value?.label ?? "";
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<Readonly<{ query: string; scopeKey: string; search: ${component}Props["search"]; retry: number; disabled: boolean | undefined; options: readonly ${name}Option[]; failed: boolean }> | null>(null);
  const current = result?.query === query && result.scopeKey === scopeKey && result.search === search && result.retry === retry && result.disabled === disabled ? result : null;
  const matches = current?.options ?? [];
  const status = disabled ? "ready" : current === null ? "loading" : current.failed ? "error" : "ready";
  const [hydrationWanted] = useState(() => Boolean(initialId && value === null));
  const [hydrationRetry, setHydrationRetry] = useState(0);
  const [hydrationResult, setHydrationResult] = useState<Readonly<{ status: "done" | "error"; resolveOption: ${component}Props["resolveOption"]; retry: number }> | null>(null);
  const hydrationFailed = hydrationResult?.status === "error" && hydrationResult.resolveOption === resolveOption && hydrationResult.retry === hydrationRetry;
  const hydrating = hydrationWanted && value === null && !disabled && hydrationResult?.status !== "done" && !hydrationFailed;
  const choiceRevision = useRef(0);
  const consumedHydration = useRef(false);
  const selected = useRef(value);
  const change = useRef(onChange);
  const request = useRef<AbortController | null>(null);
  useLayoutEffect(() => {
    if (selected.current?.id !== value?.id) choiceRevision.current += 1;
    selected.current = value; change.current = onChange;
  });
  useLayoutEffect(() => {
    const controller = new AbortController();
    request.current = controller;
    if (disabled) return () => controller.abort();
    const identity = { query, scopeKey, search, retry, disabled };
    const timer = setTimeout(() => {
      void Promise.resolve().then(() => search(query, controller.signal)).then(options => {
        if (!controller.signal.aborted) setResult({ ...identity, options, failed: false });
      }, () => { if (!controller.signal.aborted) setResult({ ...identity, options: [], failed: true }); });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, scopeKey, search, retry, disabled]);
  useLayoutEffect(() => {
    if (!initialId || !hydrationWanted || consumedHydration.current || disabled) return;
    const controller = new AbortController();
    const revision = choiceRevision.current;
    void Promise.resolve().then(() => resolveOption(initialId, controller.signal)).then(option => {
      if (controller.signal.aborted) return;
      if (option.id !== initialId) throw new Error("Resolver returned an unexpected identity");
      consumedHydration.current = true;
      setHydrationResult({ status: "done", resolveOption, retry: hydrationRetry });
      if (choiceRevision.current === revision && selected.current === null) change.current(option);
    }).catch(() => { if (!controller.signal.aborted && !consumedHydration.current) setHydrationResult({ status: "error", resolveOption, retry: hydrationRetry }); });
    return () => controller.abort();
  }, [initialId, hydrationWanted, resolveOption, hydrationRetry, disabled]);
  const options = value && !matches.some(option => option.id === value.id) ? [value, ...matches] : [...matches];
  return <_Stack spacing={1} sx={{ minWidth: 0 }}>
    <_Autocomplete options={options} value={value} inputValue={input} fullWidth disabled={disabled}
      getOptionLabel={option => option.label} getOptionDisabled={option => Boolean(option.disabled)}
      isOptionEqualToValue={(option, selection) => option.id === selection.id}
      filterOptions={() => [...matches]} loading={status === "loading" || hydrating}
      loadingText={t("${k}.loading")} noOptionsText={t("${k}.empty")}
      clearText={t("${k}.clear")} openText={t("${k}.open")} closeText={t("${k}.close")}
      onInputChange={(_, text, reason) => {
        setInputDraft({ basis: selectionBasis, text });
        if ((reason === "input" || reason === "clear") && text !== query) { request.current?.abort(); setQuery(text); }
      }}
      onChange={(_, option) => { choiceRevision.current += 1; consumedHydration.current = true; setHydrationResult({ status: "done", resolveOption, retry: hydrationRetry }); onChange(option); }}
      renderOption={(props, option) => { const { key, ...rest } = props; return <li key={key} {...rest}><_Stack><_Typography>{option.label}</_Typography>{option.description ? <_Typography variant="caption" color="text.secondary">{option.description}</_Typography> : null}</_Stack></li>; }}
      renderInput={params => <_TextField {...params} label={label ?? t("${k}.label")} required={required} error={Boolean(error)} helperText={error} />} />
    <_Typography role="status" variant="caption">{status === "loading" || hydrating ? t("${k}.loading") : status === "ready" && matches.length === 0 ? t("${k}.empty") : null}</_Typography>
    {status === "error" || hydrationFailed ? <_Alert severity="error" action={<_Button disabled={disabled} onClick={() => { setRetry(n => n + 1); setHydrationRetry(n => n + 1); }}>{t("${k}.retry")}</_Button>}>{t("${k}.failed")}</_Alert> : null}
  </_Stack>;
}`,
  );
}

function quickCreate(c) {
  const n = c.name.pascal;
  const k = `generated.${c.translationId}`;
  return file(
    `frontend/src/features/${c.feature.kebab}/components/${n}.tsx`,
    `import { Alert as _Alert, Button as _Button, Stack as _Stack, TextField as _TextField, Typography as _Typography } from "@mui/material";
import { RgoOverlayFrame as _RgoOverlayFrame, useRgoFeedback, useRgoOverlays, type RgoOverlayContentProps as _RgoOverlayContentProps } from "@rgo-web/frontend";
import { useLayoutEffect, useRef, useState } from "react";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { ${n}Lookup, type ${n}LookupProps, type ${n}Option } from "./${n}Lookup";

export type ${n}Props = ${n}LookupProps & Readonly<{
  /** Resolve only after the server acknowledges creation. A lost acknowledgement needs caller-owned receipt/retry recovery. */
  onCreate: (label: string) => Promise<string>;
}>;

/** Mount inside the same page-local RGO overlay provider as the parent draft. */
export function ${n}(props: ${n}Props) {
  const { t } = useAppTranslation();
  const overlays = useRgoOverlays();
  const [opening, setOpening] = useState(false);
  const [openFailed, setOpenFailed] = useState(false);
  const pending = useRef(false);
  const owner = useRef<object>({});
  const mounted = useRef(false);
  useLayoutEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useLayoutEffect(() => { const token = {}; owner.current = token; return () => { if (owner.current === token) owner.current = {}; }; }, [props.scopeKey, props.disabled]);
  const open = async () => {
    if (pending.current || props.disabled) return;
    pending.current = true; setOpening(true); setOpenFailed(false);
    const token = owner.current;
    try {
      const result = await overlays.open(${n}CreateEditor, { onCreate: props.onCreate, resolveOption: props.resolveOption, isCurrent: () => owner.current === token }, { presentation: "dialog", maxWidth: "sm" }).result;
      if (owner.current === token && result.status === "completed") props.onChange(result.value);
    } catch { if (mounted.current) setOpenFailed(true); }
    finally { pending.current = false; if (mounted.current) setOpening(false); }
  };
  return <_Stack spacing={1}>
    <${n}Lookup {...props} disabled={props.disabled || opening} />
    {openFailed ? <_Alert severity="error">{t("${k}.createFailed")}</_Alert> : null}
    <_Button type="button" variant="outlined" disabled={props.disabled || opening} onClick={() => void open()}>{t("${k}.create")}</_Button>
  </_Stack>;
}

type ${n}CreateEditorProps = Readonly<{ isCurrent: () => boolean; onCreate: (label: string) => Promise<string>; resolveOption: ${n}LookupProps["resolveOption"] }> & _RgoOverlayContentProps<${n}Option>;
function ${n}CreateEditor({ overlay, onCreate, resolveOption, isCurrent }: ${n}CreateEditorProps) {
  const { t } = useAppTranslation();
  const feedback = useRgoFeedback();
  const [label, setLabel] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const acknowledged = useRef<string | null>(null);
  const [option, setOption] = useState<${n}Option | null>(null);
  const alive = useRef(false);
  const locked = useRef(false);
  const read = useRef<AbortController | null>(null);
  const draft = useRef(label);
  useLayoutEffect(() => { draft.current = label; }, [label]);
  useLayoutEffect(() => { alive.current = true; return () => { alive.current = false; read.current?.abort(); }; }, []);
  const invalid = !label.trim() ? t("${k}.required") : label.trim().length > 160 ? t("${k}.max") : undefined;
  const save = async () => {
    if (locked.current || option !== null || !isCurrent()) return;
    setAttempted(true);
    if (invalid && acknowledged.current === null) return;
    locked.current = true; setBusy(true); setFailed(false);
    try {
      let id = acknowledged.current;
      if (id === null) {
        id = await onCreate(label.trim());
        acknowledged.current = id;
        if (!alive.current || !isCurrent()) return;
        setCreatedId(id);
      }
      const controller = new AbortController(); read.current = controller;
      const resolved = await resolveOption(id, controller.signal);
      if (!alive.current || !isCurrent() || controller.signal.aborted) return;
      if (resolved.id !== id) throw new Error("Resolver returned an unexpected identity");
      setOption(resolved);
    } catch { if (alive.current) setFailed(true); }
    finally { locked.current = false; if (alive.current) setBusy(false); }
  };
  return <_RgoOverlayFrame title={t("${k}.create")} busy={busy} beforeClose={async ({ signal }) => {
    if (locked.current) return false;
    if (!draft.current.trim() || acknowledged.current !== null) return true;
    const result = await feedback.confirm({ title: t("${k}.discardTitle"), message: t("${k}.discardMessage"), confirmLabel: t("${k}.discard"), cancelLabel: t("${k}.keep"), signal });
    return result.status === "confirmed" && !signal.aborted && alive.current && !locked.current;
  }} footer={<_Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
    {option ? <_Button type="button" variant="contained" disabled={busy || option.disabled} onClick={async () => {
      if (locked.current || !isCurrent()) return;
      locked.current = true; setBusy(true);
      try { await overlay.complete(option); } finally { locked.current = false; if (alive.current) setBusy(false); }
    }}>{t("${k}.choose")}</_Button> : <_Button type="button" variant="contained" disabled={busy} onClick={() => void save()}>{t(createdId ? "${k}.retry" : "${k}.save")}</_Button>}
    <_Button type="button" disabled={busy} onClick={() => void overlay.close()}>{t("${k}.cancel")}</_Button>
  </_Stack>}>
    <_Stack spacing={2}>
      <_TextField autoFocus fullWidth label={t("${k}.name")} value={label} required disabled={busy || createdId !== null} onChange={event => setLabel(event.target.value)} error={attempted && Boolean(invalid)} helperText={attempted ? invalid : undefined} />
      {failed ? <_Alert severity="error">{t(createdId ? "${k}.resolveFailed" : "${k}.createFailed")}</_Alert> : null}
      {option ? <><_Alert severity="success">{t("${k}.created")}</_Alert><_Typography>{option.label}</_Typography></> : null}
    </_Stack>
  </_RgoOverlayFrame>;
}`,
  );
}

function dependentModel(c) {
  const n = c.name.pascal;
  const k = `generated.${c.translationId}`;
  return file(
    `frontend/src/features/${c.feature.kebab}/models/${n}.ts`,
    `import type { TFunction } from "i18next";
import { z } from "zod";
export type ${n}Value = Readonly<{ departmentId: string | null; assigneeId: string | null; needsReason: boolean; reason: string }>;
export type ${n}Department = Readonly<{ id: string; label: string }>;
export type ${n}Assignee = Readonly<{ id: string; label: string; departmentIds: readonly string[] }>;
export function buildDefault${n}Value(): ${n}Value { return { departmentId: null, assigneeId: null, needsReason: false, reason: "" }; }
/** Use this complete schema in the parent command schema. UI clearing is only draft assistance. */
export function create${n}ValidationSchema(t: TFunction<"translation">, departments: readonly ${n}Department[], assignees: readonly ${n}Assignee[]) {
  return z.object({ departmentId: z.string().nullable(), assigneeId: z.string().nullable(), needsReason: z.boolean(), reason: z.string().trim().max(160, t("${k}.max")) }).superRefine((value, ctx) => {
    if (!departments.some(department => department.id === value.departmentId)) ctx.addIssue({ code: "custom", path: ["departmentId"], message: t("${k}.invalidDepartment") });
    if (!assignees.some(assignee => assignee.id === value.assigneeId && assignee.departmentIds.some(id => id === value.departmentId))) ctx.addIssue({ code: "custom", path: ["assigneeId"], message: t("${k}.relation") });
    if (value.needsReason && !value.reason.trim()) ctx.addIssue({ code: "custom", path: ["reason"], message: t("${k}.reasonRequired") });
    if (!value.needsReason && value.reason !== "") ctx.addIssue({ code: "custom", path: ["reason"], message: t("${k}.reasonHint") });
  });
}
export function change${n}Department(value: ${n}Value, departmentId: string | null, assignees: readonly ${n}Assignee[]): ${n}Value {
  const keep = assignees.some(assignee => assignee.id === value.assigneeId && assignee.departmentIds.some(id => id === departmentId));
  return { ...value, departmentId, assigneeId: keep ? value.assigneeId : null };
}`,
  );
}

function dependent(c) {
  const n = c.name.pascal;
  const k = `generated.${c.translationId}`;
  return file(
    `frontend/src/features/${c.feature.kebab}/components/${n}.tsx`,
    `import { Autocomplete as _Autocomplete, Checkbox as _Checkbox, FormControlLabel as _FormControlLabel, Stack as _Stack, TextField as _TextField, Typography as _Typography } from "@mui/material";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { change${n}Department, type ${n}Value, type ${n}Department, type ${n}Assignee } from "../models/${n}";
export type ${n}Props = Readonly<{
  value: ${n}Value; onChange: (value: ${n}Value) => void;
  departments: readonly ${n}Department[]; assignees: readonly ${n}Assignee[];
  errors?: Partial<Record<keyof ${n}Value, string>>; disabled?: boolean;
}>;
/** A controlled section in the parent's single form; it neither submits nor owns a hidden draft. */
export function ${n}({ value, onChange, departments, assignees, errors, disabled }: ${n}Props) {
  const { t } = useAppTranslation();
  const available = assignees.filter(option => option.departmentIds.some(id => id === value.departmentId));
  return <_Stack spacing={2} sx={{ minWidth: 0 }}>
    <_Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
      <_Autocomplete fullWidth disabled={disabled} options={[...departments]} value={departments.find(option => option.id === value.departmentId) ?? null}
        getOptionLabel={option => option.label} isOptionEqualToValue={(a, b) => a.id === b.id}
        clearText={t("${k}.clear")} openText={t("${k}.open")} closeText={t("${k}.close")} noOptionsText={t("${k}.empty")}
        onChange={(_, department) => onChange(change${n}Department(value, department?.id ?? null, assignees))}
        renderInput={params => <_TextField {...params} required label={t("${k}.department")} placeholder={t("${k}.chooseDepartment")} error={Boolean(errors?.departmentId)} helperText={errors?.departmentId} />} />
      <_Autocomplete fullWidth disabled={disabled || available.length === 0} options={available} value={available.find(option => option.id === value.assigneeId) ?? null}
        getOptionLabel={option => option.label} isOptionEqualToValue={(a, b) => a.id === b.id}
        clearText={t("${k}.clear")} openText={t("${k}.open")} closeText={t("${k}.close")} noOptionsText={t("${k}.empty")}
        onChange={(_, assignee) => onChange({ ...value, assigneeId: assignee?.id ?? null })}
        renderInput={params => <_TextField {...params} required label={t("${k}.assignee")} placeholder={t("${k}.chooseAssignee")} error={Boolean(errors?.assigneeId)} helperText={errors?.assigneeId ?? t("${k}.dependencyHint")} />} />
    </_Stack>
    <_FormControlLabel control={<_Checkbox checked={value.needsReason} disabled={disabled} onChange={(_, checked) => onChange({ ...value, needsReason: checked, reason: checked ? value.reason : "" })} />} label={t("${k}.needsReason")} />
    {value.needsReason ? <_TextField fullWidth multiline minRows={3} required disabled={disabled} label={t("${k}.reason")} value={value.reason} onChange={event => onChange({ ...value, reason: event.target.value })} error={Boolean(errors?.reason)} helperText={errors?.reason} /> : null}
    <_Typography variant="caption" color="text.secondary">{t("${k}.reasonHint")}</_Typography>
  </_Stack>;
}`,
  );
}

function selectorExample(c, quick) {
  const n = c.name.pascal;
  const k = `generated.${c.translationId}`;
  return file(
    `frontend/src/pages/development-guide/generated/component/${c.feature.kebab}--${c.name.kebab}.example.tsx`,
    `import { Alert as _Alert, Button as _Button, FormControlLabel as _FormControlLabel, Stack as _Stack, Switch as _Switch, Typography as _Typography } from "@mui/material";
import { ${quick ? "RgoOverlayProvider as _RgoOverlayProvider, useRgoFeedback, " : ""}useRgoForm } from "@rgo-web/frontend";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
${quick ? 'import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";' : ""}
import { ${n} as _Recipe, type ${n}Option } from "@/features/${c.feature.kebab}";

/** Fixture adapter has real asynchronous boundaries and abort-aware reads; replace it with the feature API. */
function delay(signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) { reject(new DOMException("Aborted", "AbortError")); return; }
    const abort = () => { clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")); };
    const timer = setTimeout(() => { signal?.removeEventListener("abort", abort); resolve(); }, 500);
    signal?.addEventListener("abort", abort, { once: true });
  });
}
export function Component() {
  const { t } = useDevelopmentGuideTranslation();
  ${
    quick
      ? `const { t: appT } = useAppTranslation();
  const feedback = useRgoFeedback();
  const reportOverlayError = useCallback(() => { feedback.notify({ id: "${c.translationId}-overlay-error", message: t("overlayExamples.error"), severity: "error" }); }, [feedback, t]);`
      : ""
  }
  const [epoch, setEpoch] = useState(0);
  const [populated, setPopulated] = useState(true);
  const [disabled, setDisabled] = useState(false);
  const [fail, setFail] = useState(false);
  return <_Stack spacing={2}>
    <_Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
      <_Button onClick={() => { setPopulated(false); setEpoch(n => n + 1); }}>{t("generatedExamples.default")}</_Button>
      <_Button onClick={() => { setPopulated(true); setEpoch(n => n + 1); }}>{t("generatedExamples.populated")}</_Button>
      <_FormControlLabel control={<_Switch checked={disabled} onChange={(_, checked) => setDisabled(checked)} />} label={t("generatedExamples.disabled")} />
      <_FormControlLabel control={<_Switch checked={fail} onChange={(_, checked) => setFail(checked)} />} label={t("generatedExamples.simulateFailure")} />
    </_Stack>
    <_Typography variant="body2">{t("formsExamples.asyncLookups.search.description")}</_Typography>
    ${quick ? `<_RgoOverlayProvider pageKey={"${c.feature.kebab}-preview-" + epoch} closeLabel={appT("${k}.close")} resizeLabel={t("overlayExamples.resize")} onError={reportOverlayError}><${n}Demo key={epoch} populated={populated} disabled={disabled} fail={fail} /></_RgoOverlayProvider>` : `<${n}Demo key={epoch} populated={populated} disabled={disabled} fail={fail} />`}
  </_Stack>;
}
function ${n}Demo({ populated, disabled, fail }: Readonly<{ populated: boolean; disabled: boolean; fail: boolean }>) {
  const { t } = useDevelopmentGuideTranslation();
  const [saved, setSaved] = useState(false);
  const records = useRef<${n}Option[]>([{ id: "person-1", label: "Ana Novak" }, { id: "person-2", label: "Marko Horvat" }, { id: "person-3", label: "Sara Babić" }]);
  const failure = useRef(fail);
  useLayoutEffect(() => { failure.current = fail; }, [fail]);
  const search = useCallback(async (query: string, signal: AbortSignal) => {
    await delay(signal);
    if (failure.current) throw new Error("Simulated lookup failure");
    return records.current.filter(option => option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  }, []);
  const resolveOption = useCallback(async (id: string, signal: AbortSignal) => {
    await delay(signal);
    if (failure.current) throw new Error("Simulated resolution failure");
    const option = records.current.find(option => option.id === id);
    if (!option) throw new Error("Missing fixture");
    return option;
  }, []);
  ${
    quick
      ? `const onCreate = useCallback(async (label: string) => {
    await delay();
    if (failure.current) throw new Error("Simulated creation failure");
    const option = { id: crypto.randomUUID(), label };
    records.current = [...records.current, option];
    return option.id;
  }, []);`
      : ""
  }
  const form = useRgoForm({ defaultValues: { title: "", related: null as ${n}Option | null }, onSubmit: () => { setSaved(true); } });
  return <form.AppForm><form.Form noValidate><_Stack spacing={2}>
    <form.AppField name="title">{field => <field.TextField fullWidth label={t("generatedExamples.sampleRecord")} disabled={disabled} />}</form.AppField>
    <form.AppField name="related">{field => <_Recipe value={field.state.value} onChange={option => { field.handleChange(option); setSaved(false); }} scopeKey="preview" initialId={populated ? "person-1" : null} search={search} resolveOption={resolveOption} disabled={disabled} ${quick ? "onCreate={onCreate}" : ""} />}</form.AppField>
    <form.Subscribe selector={state => state.values.related}>{selected => <_Typography>{t("formsExamples.asyncLookups.selection", { name: selected?.label ?? t("formsExamples.asyncLookups.none") })}</_Typography>}</form.Subscribe>
    <form.SubmitButton disabled={disabled} variant="contained">{t("formsExamples.asyncLookups.submit")}</form.SubmitButton>
    {saved ? <_Alert severity="success">{t("generatedExamples.saved")}</_Alert> : null}
  </_Stack></form.Form></form.AppForm>;
}`,
  );
}

function dependentExample(c) {
  const n = c.name.pascal;
  return file(
    `frontend/src/pages/development-guide/generated/component/${c.feature.kebab}--${c.name.kebab}.example.tsx`,
    `import { Alert as _Alert, Button as _Button, FormControlLabel as _FormControlLabel, Stack as _Stack, Switch as _Switch, Typography as _Typography } from "@mui/material";
import { useRgoForm } from "@rgo-web/frontend";
import { revalidateLogic, useStore } from "@tanstack/react-form";
import { useMemo, useState } from "react";
import { z } from "zod";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { ${n} as _Recipe, buildDefault${n}Value, create${n}ValidationSchema, type ${n}Assignee, type ${n}Department } from "@/features/${c.feature.kebab}";
export function Component() {
  const { t } = useDevelopmentGuideTranslation();
  const [epoch, setEpoch] = useState(0);
  const [populated, setPopulated] = useState(false);
  const [disabled, setDisabled] = useState(false);
  return <_Stack spacing={2}>
    <_Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}><_Button onClick={() => { setPopulated(false); setEpoch(n => n + 1); }}>{t("generatedExamples.default")}</_Button><_Button onClick={() => { setPopulated(true); setEpoch(n => n + 1); }}>{t("generatedExamples.populated")}</_Button><_FormControlLabel control={<_Switch checked={disabled} onChange={(_, checked) => setDisabled(checked)} />} label={t("generatedExamples.disabled")} /></_Stack>
    <${n}Demo key={epoch} populated={populated} disabled={disabled} />
  </_Stack>;
}
function ${n}Demo({ populated, disabled }: Readonly<{ populated: boolean; disabled: boolean }>) {
  const { t } = useDevelopmentGuideTranslation();
  const { t: appT } = useAppTranslation();
  const [saved, setSaved] = useState(false);
  const departments = useMemo<readonly ${n}Department[]>(() => [{ id: "engineering", label: t("formsExamples.dependent.departments.engineering") }, { id: "operations", label: t("formsExamples.dependent.departments.operations") }], [t]);
  const assignees: readonly ${n}Assignee[] = [{ id: "ana", label: "Ana Novak", departmentIds: ["engineering"] }, { id: "marko", label: "Marko Horvat", departmentIds: ["operations"] }, { id: "sara", label: "Sara Babić", departmentIds: ["engineering", "operations"] }];
  const detailsSchema = create${n}ValidationSchema(appT, departments, assignees);
  const schema = z.object({ title: z.string(), details: detailsSchema });
  const form = useRgoForm({
    defaultValues: { title: "", details: populated ? { departmentId: "engineering", assigneeId: "sara", needsReason: true, reason: "Sample explanation" } : buildDefault${n}Value() },
    validationLogic: revalidateLogic({ mode: "submit", modeAfterSubmission: "change" }),
    validators: { onDynamic: schema },
    onSubmit: ({ value }) => { schema.parse(value); setSaved(true); },
  });
  const values = useStore(form.store, state => state.values);
  const attempts = useStore(form.store, state => state.submissionAttempts);
  const result = attempts > 0 ? detailsSchema.safeParse(values.details) : null;
  const errors = result && !result.success ? Object.fromEntries(result.error.issues.map(issue => [issue.path[0], issue.message])) : {};
  return <form.AppForm><form.Form noValidate><_Stack spacing={2}>
    <_Typography variant="body2">{t("formsExamples.dependent.department.description")}</_Typography>
    <form.AppField name="title">{field => <field.TextField fullWidth label={t("generatedExamples.sampleRecord")} disabled={disabled} />}</form.AppField>
    <form.AppField name="details">{field => <_Recipe value={field.state.value} onChange={value => { field.handleChange(value); setSaved(false); }} departments={departments} assignees={assignees} errors={errors} disabled={disabled} />}</form.AppField>
    <form.SubmitButton variant="contained" disabled={disabled}>{t("formsExamples.dependent.summary.submit")}</form.SubmitButton>
    {saved ? <_Alert severity="success">{t("formsExamples.dependent.summary.submitted")}</_Alert> : null}
  </_Stack></form.Form></form.AppForm>;
}`,
  );
}

function dependentTests(c) {
  const n = c.name.pascal;
  return file(
    `frontend/tests/features/${c.feature.kebab}/models/${n}.test.ts`,
    `import { describe, expect, it } from "vitest";
import { createAppI18n } from "@/app/localization/createAppI18n";
import { buildDefault${n}Value, change${n}Department, create${n}ValidationSchema } from "@/features/${c.feature.kebab}";
const departments = [{ id: "a", label: "A" }, { id: "b", label: "B" }];
const assignees = [{ id: "shared", label: "Shared", departmentIds: ["a", "b"] }, { id: "only-a", label: "Only A", departmentIds: ["a"] }];
const schema = create${n}ValidationSchema(createAppI18n("en").getFixedT(null, "translation"), departments, assignees);
describe("${n} relationship contract", () => {
  it("retains compatible choices and clears only incompatible relationships", () => {
    const initial = { ...buildDefault${n}Value(), departmentId: "a", assigneeId: "shared" };
    expect(change${n}Department(initial, "b", assignees).assigneeId).toBe("shared");
    expect(change${n}Department({ ...initial, assigneeId: "only-a" }, "b", assignees).assigneeId).toBeNull();
  });
  it("rejects bypassed UI relationships and obsolete hidden reasons at the correcting field", () => {
    const invalid = schema.safeParse({ departmentId: "b", assigneeId: "only-a", needsReason: true, reason: "" });
    expect(invalid.success).toBe(false);
    if (!invalid.success) expect(invalid.error.issues.map(issue => issue.path[0])).toEqual(expect.arrayContaining(["assigneeId", "reason"]));
    expect(schema.safeParse({ departmentId: "b", assigneeId: "shared", needsReason: false, reason: "hidden" }).success).toBe(false);
    expect(schema.parse({ departmentId: "b", assigneeId: "shared", needsReason: true, reason: " explanation " }).reason).toBe("explanation");
  });
});`,
  );
}

function pickerTests(c, quick) {
  const n = c.name.pascal;
  const component = quick ? `${n}Lookup` : n;
  return file(
    `frontend/tests/features/${c.feature.kebab}/components/${component}.test.tsx`,
    `import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppI18n } from "@/app/localization/createAppI18n";
import { ${component} as _Recipe, type ${n}Option } from "@/features/${c.feature.kebab}/components/${component}";
vi.mock("@/app/localization/hooks/useAppTranslation", () => ({ useAppTranslation: () => ({ t: createAppI18n("en").getFixedT(null, "translation") }) }));
afterEach(() => vi.useRealTimers());
describe("${component} remote ownership", () => {
  it("ignores a superseded response even when transport ignores abort", async () => {
    let resolveOld: ((options: readonly ${n}Option[]) => void) | undefined;
    let oldSignal: AbortSignal | undefined;
    const search = vi.fn((query: string, signal: AbortSignal) => query === "old" ? new Promise<readonly ${n}Option[]>(resolve => { resolveOld = resolve; oldSignal = signal; }) : Promise.resolve(query === "new" ? [{ id: "new", label: "Current result" }] : []));
    const resolveOption = vi.fn(async () => ({ id: "selected", label: "Retained" }));
    render(<_Recipe scopeKey="scope" value={null} onChange={vi.fn()} search={search} resolveOption={resolveOption} />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "old" } });
    await waitFor(() => expect(resolveOld).toBeDefined());
    fireEvent.change(input, { target: { value: "new" } });
    await waitFor(() => expect(search).toHaveBeenCalledWith("new", expect.any(AbortSignal)));
    expect(oldSignal?.aborted).toBe(true);
    await act(async () => { resolveOld?.([{ id: "old", label: "Obsolete result" }]); });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(await screen.findByRole("option", { name: "Current result" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Obsolete result" })).not.toBeInTheDocument();
  });
  it("hydrates an initial identity while preserving its label outside the search page", async () => {
    const search = vi.fn(async () => []);
    const resolveOption = vi.fn(async () => ({ id: "saved", label: "Saved record" }));
    function Parent() {
      const [value, setValue] = useState<${n}Option | null>(null);
      return <_Recipe scopeKey="scope" initialId="saved" value={value} onChange={setValue} search={search} resolveOption={resolveOption} />;
    }
    render(<Parent />);
    await waitFor(() => expect(screen.getByRole("combobox")).toHaveValue("Saved record"));
    expect(resolveOption).toHaveBeenCalledWith("saved", expect.any(AbortSignal));
    await waitFor(() => expect(search).toHaveBeenCalled());
    expect(screen.getByRole("combobox")).toHaveValue("Saved record");
  });
});`,
  );
}

function quickTests(c) {
  const n = c.name.pascal;
  const k = `generated.${c.translationId}`;
  return file(
    `frontend/tests/features/${c.feature.kebab}/components/${n}.test.tsx`,
    `import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RgoFeedbackProvider as _RgoFeedbackProvider, RgoOverlayProvider as _RgoOverlayProvider } from "@rgo-web/frontend";
import { describe, expect, it, vi } from "vitest";
import { createAppI18n } from "@/app/localization/createAppI18n";
import { ${n} as _Recipe } from "@/features/${c.feature.kebab}";
vi.mock("@/app/localization/hooks/useAppTranslation", () => ({ useAppTranslation: () => ({ t: createAppI18n("en").getFixedT(null, "translation") }) }));
const t = createAppI18n("en").getFixedT(null, "translation");
describe("${n} acknowledged relationship selection", () => {
  it("retries resolution without recreating and selects only after an explicit choice", async () => {
    const onChange = vi.fn();
    const onCreate = vi.fn(async () => "new-id");
    const resolveOption = vi.fn().mockRejectedValueOnce(new Error("Lookup unavailable")).mockResolvedValue({ id: "new-id", label: "New relationship" });
    render(<_RgoFeedbackProvider notificationCloseLabel="Close notification"><_RgoOverlayProvider pageKey="test" closeLabel="Close editor" resizeLabel="Resize editor" onError={vi.fn()}>
      <_Recipe scopeKey="owner" value={null} onChange={onChange} search={async () => []} resolveOption={resolveOption} onCreate={onCreate} />
    </_RgoOverlayProvider></_RgoFeedbackProvider>);
    fireEvent.click(screen.getByRole("button", { name: t("${k}.create") }));
    fireEvent.change(await screen.findByRole("textbox", { name: /Name/ }), { target: { value: "New relationship" } });
    fireEvent.click(screen.getByRole("button", { name: t("${k}.save") }));
    expect(await screen.findByText(t("${k}.resolveFailed"))).toBeInTheDocument();
    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: t("${k}.retry") }));
    const choose = await screen.findByRole("button", { name: t("${k}.choose") });
    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(choose);
    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ id: "new-id", label: "New relationship" }));
  });
  it("does not select an acknowledged record when the user cancels", async () => {
    const onChange = vi.fn();
    render(<_RgoFeedbackProvider notificationCloseLabel="Close notification"><_RgoOverlayProvider pageKey="cancel-test" closeLabel="Close editor" resizeLabel="Resize editor" onError={vi.fn()}>
      <_Recipe scopeKey="owner" value={null} onChange={onChange} search={async () => []} resolveOption={async id => ({ id, label: "New relationship" })} onCreate={async () => "new-id"} />
    </_RgoOverlayProvider></_RgoFeedbackProvider>);
    fireEvent.click(screen.getByRole("button", { name: t("${k}.create") }));
    fireEvent.change(await screen.findByRole("textbox", { name: /Name/ }), { target: { value: "New relationship" } });
    fireEvent.click(screen.getByRole("button", { name: t("${k}.save") }));
    await screen.findByRole("button", { name: t("${k}.choose") });
    fireEvent.click(screen.getByRole("button", { name: t("${k}.cancel") }));
    await waitFor(() => expect(screen.queryByRole("button", { name: t("${k}.choose") })).not.toBeInTheDocument());
    expect(onChange).not.toHaveBeenCalled();
  });
});`,
  );
}

export function renderSelectionRecipes(kind, context) {
  if (kind !== "component" || !["entity-picker", "quick-create", "dependent-fields"].includes(context.variant))
    return undefined;
  const n = context.name.pascal;
  const owner = `frontend/src/features/${context.feature.kebab}`;
  const isDependent = context.variant === "dependent-fields";
  const quick = context.variant === "quick-create";
  const exports = isDependent
    ? `export { buildDefault${n}Value, change${n}Department, create${n}ValidationSchema } from "./models/${n}";
export type { ${n}Value, ${n}Department, ${n}Assignee } from "./models/${n}";`
    : `export type { ${n}Option } from "./components/${quick ? `${n}Lookup` : n}";`;
  return [
    ...(isDependent
      ? [dependentModel(context), dependent(context)]
      : [picker(context, quick), ...(quick ? [quickCreate(context)] : [])]),
    file(
      `${owner}/index.ts`,
      `export { ${n} } from "./components/${n}";
export type { ${n}Props } from "./components/${n}";
${exports}`,
    ),
    ...resources(context),
    isDependent ? dependentExample(context) : selectorExample(context, quick),
    isDependent ? dependentTests(context) : pickerTests(context, quick),
    ...(quick ? [quickTests(context)] : []),
  ];
}
