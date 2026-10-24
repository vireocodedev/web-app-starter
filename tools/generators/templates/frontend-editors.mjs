/** Pure workflow-form recipes. The CLI validates identifiers and bounded text fields. */
const file = (path, content) => ({ path, content: `${content.trim()}\n` });
const role = (name, suffix) => (name.endsWith(suffix) ? name : `${name}${suffix}`);

function resources(context) {
  const en = {
    title: context.name.title,
    fields: Object.fromEntries(context.fields.map(field => [field.name, field.label])),
    aggregateTitle: "Collection title",
    details: "Details",
    additional: "Additional details",
    review: "Review",
    next: "Next",
    previous: "Previous",
    create: "Create",
    update: "Save changes",
    required: "This field is required.",
    max: "Use no more than {{max}} characters.",
    failed: "Changes could not be saved. Your draft is retained.",
    errors: "Review these fields before saving.",
    reviewHint: "Review your draft. Moving between sections does not save or validate it.",
    noValue: "Not provided",
    items: "Items",
    empty: "No items yet. Add an item to continue.",
    add: "Add item",
    edit: "Edit item {{number}}",
    remove: "Remove item {{number}}",
    editHeading: "Edit item",
    addHeading: "New item",
    apply: "Apply item",
    cancel: "Cancel item edit",
    itemRequired: "Add at least one item.",
    itemMax: "Use no more than 50 items.",
    duplicate: "Each item must have a unique local identity.",
    stagedHint: "Apply changes to the local collection or cancel this edit before saving the collection.",
    localHint: "Item changes stay in this draft until you save the complete collection.",
  };
  const known = { title: "Naslov", name: "Naziv", notes: "Bilješke", description: "Opis", email: "E-pošta" };
  const hr = {
    title: context.name.title,
    fields: Object.fromEntries(
      context.fields.map(field => [field.name, field.labelHr ?? known[field.name] ?? field.label]),
    ),
    aggregateTitle: "Naslov zbirke",
    details: "Pojedinosti",
    additional: "Dodatne pojedinosti",
    review: "Pregled",
    next: "Dalje",
    previous: "Prethodno",
    create: "Stvori",
    update: "Spremi promjene",
    required: "Ovo je polje obavezno.",
    max: "Unesite najviše {{max}} znakova.",
    failed: "Promjene nije moguće spremiti. Nacrt je sačuvan.",
    errors: "Pregledajte ova polja prije spremanja.",
    reviewHint: "Pregledajte nacrt. Promjena odjeljka ne sprema ni ne provjerava podatke.",
    noValue: "Nije navedeno",
    items: "Stavke",
    empty: "Još nema stavki. Dodajte stavku za nastavak.",
    add: "Dodaj stavku",
    edit: "Uredi stavku {{number}}",
    remove: "Ukloni stavku {{number}}",
    editHeading: "Uredi stavku",
    addHeading: "Nova stavka",
    apply: "Primijeni stavku",
    cancel: "Odustani od uređivanja stavke",
    itemRequired: "Dodajte barem jednu stavku.",
    itemMax: "Unesite najviše 50 stavki.",
    duplicate: "Svaka stavka mora imati jedinstveni lokalni identifikator.",
    stagedHint: "Primijenite promjene na lokalnu zbirku ili odustanite od uređivanja prije spremanja zbirke.",
    localHint: "Promjene stavki ostaju u nacrtu dok ne spremite cijelu zbirku.",
  };
  const base = `frontend/src/app/localization/translations/generated/${context.translationId}`;
  return [
    file(`${base}.en.ts`, `export const translations = ${JSON.stringify(en, null, 2)} as const;`),
    file(
      `${base}.hr.ts`,
      `import type { StringLeaves } from "../../types/TranslationShape";
import type { translations as english } from "./${context.translationId}.en";
export const translations = ${JSON.stringify(hr, null, 2)} as const satisfies StringLeaves<typeof english>;`,
    ),
  ];
}

function schemaMembers(context) {
  const key = `generated.${context.translationId}`;
  return context.fields
    .map(
      field =>
        `${field.name}: z.string().trim()${field.required ? `.min(1, t("${key}.required"))` : ""}.max(${field.maxLength}, t("${key}.max", { max: ${field.maxLength} }))`,
    )
    .join(",\n");
}

function model(context, collection) {
  const name = context.name.pascal;
  const key = `generated.${context.translationId}`;
  const members = context.fields.map(field => `${field.name}: string;`).join("\n");
  const defaults = context.fields.map(field => `${field.name}: ""`).join(", ");
  return file(
    `frontend/src/features/${context.feature.kebab}/models/${name}.ts`,
    `import type { TFunction } from "i18next";
import { z } from "zod";

${
  collection
    ? `export type ${name}Item = Readonly<{ localId: string; serverId: string | null; ${members} }>;
export type ${name}FormValue = Readonly<{ title: string; items: ${name}Item[] }>;
export function buildDefault${name}Item(localId: string): ${name}Item {
  return { localId, serverId: null, ${defaults} };
}
export function create${name}ItemValidationSchema(t: TFunction<"translation">) {
  return z.object({ localId: z.string().min(1, t("${key}.required")), serverId: z.string().nullable(), ${schemaMembers(context)} });
}`
    : `export type ${name}FormValue = Readonly<{ ${members} }>;`
}

export function buildDefault${name}Input(): ${name}FormValue {
  return { ${collection ? 'title: "", items: []' : defaults} };
}
export function create${name}ValidationSchema(t: TFunction<"translation">) {
  return z.object({ ${
    collection
      ? `title: z.string().trim().min(1, t("${key}.required")).max(160, t("${key}.max", { max: 160 })),
    items: z.array(create${name}ItemValidationSchema(t)).min(1, t("${key}.itemRequired")).max(50, t("${key}.itemMax")).superRefine((items, ctx) => {
      const seen = new Set<string>();
      items.forEach((item, index) => {
        if (seen.has(item.localId)) ctx.addIssue({ code: "custom", path: [index, "localId"], message: t("${key}.duplicate") });
        seen.add(item.localId);
      });
    })`
      : schemaMembers(context)
  } });
}`,
  );
}

function wizard(context) {
  const name = context.name.pascal;
  const component = role(name, "Form");
  const key = `generated.${context.translationId}`;
  const split = Math.ceil(context.fields.length / 2);
  const groups = [context.fields.slice(0, split), context.fields.slice(split)].filter(fields => fields.length > 0);
  return file(
    `frontend/src/features/${context.feature.kebab}/components/${component}.tsx`,
    `import { Alert, Box, Button, Paper, Stack, Step, StepButton, Stepper, Typography } from "@mui/material";
import { RgoFormGroup, useRgoForm } from "@rgo-web/frontend";
import { useStore } from "@tanstack/react-form";
import { useEffect, useId, useRef, useState } from "react";
import { useFormStateReporter } from "@/app/forms/hooks/useFormStateReporter";
import type { AppEntityFormProps } from "@/app/forms/types/AppEntityForm";
import { buildAppEntityFormOptions } from "@/app/forms/utils/buildAppEntityFormOptions";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { buildDefault${name}Input, create${name}ValidationSchema, type ${name}FormValue } from "../models/${name}";

export type ${component}Props = AppEntityFormProps<${name}FormValue> & Readonly<{ disabled?: boolean }>;

/** One complete draft. Section navigation neither validates nor persists values. */
export function ${component}(props: ${component}Props) {
  const { t } = useAppTranslation();
  const id = useId();
  const root = useRef<HTMLFormElement>(null);
  const [topic, setTopic] = useState(0);
  const focusTarget = useRef<string | null>(null);
  const [focusRevision, setFocusRevision] = useState(0);
  const schema = create${name}ValidationSchema(t);
  const form = useRgoForm({
    defaultValues: props.group === RgoFormGroup.CREATE ? buildDefault${name}Input() : props.initialValue,
    ...buildAppEntityFormOptions(schema, props),
  });
  useFormStateReporter(form.store, props.onStateChange);
  const values = useStore(form.store, state => state.values);
  const submitting = useStore(form.store, state => state.isSubmitting);
  const attempts = useStore(form.store, state => state.submissionAttempts);
  const disabled = Boolean(props.disabled || submitting);
  const labels = [t("${key}.details"), ${groups.length > 1 ? `t("${key}.additional"),` : ""} t("${key}.review")];
  const fields = [${context.fields.map((field, index) => `{ name: "${field.name}", label: t("${key}.fields.${field.name}"), topic: ${index < split ? 0 : 1} }`).join(",\n")}];
  const result = attempts > 0 ? schema.safeParse(values) : null;
  const errors = result && !result.success ? result.error.issues.flatMap(issue => {
    const target = fields.find(field => field.name === issue.path[0]);
    return target ? [{ ...target, message: issue.message }] : [];
  }) : [];
  useEffect(() => {
    if (focusTarget.current === null) return;
    const target = root.current?.querySelector<HTMLElement>("[id=" + JSON.stringify(focusTarget.current) + "]");
    target?.focus();
    focusTarget.current = null;
  }, [focusRevision, topic]);
  const selectTopic = (next: number) => {
    if (disabled) return;
    setTopic(next);
    focusTarget.current = id + "-heading-" + next;
    setFocusRevision(revision => revision + 1);
  };

  return <form.AppForm>
    <form.Form ref={root} noValidate focusInvalidFieldOnSubmit={false} slotProps={{ root: { onSubmit: event => { if (disabled || topic !== labels.length - 1) event.preventDefault(); } } }}>
      <Stack spacing={3} sx={{ minWidth: 0 }}>
        <Stepper nonLinear activeStep={topic} sx={{ flexWrap: "wrap", gap: 1 }}>
          {labels.map((label, index) => <Step key={index} sx={{ minWidth: 0 }}><StepButton type="button" sx={{ boxSizing: "border-box", m: 0, p: { xs: 1, sm: 1.5 }, width: "100%" }} disabled={disabled} aria-current={topic === index ? "step" : undefined} onClick={() => selectTopic(index)}>{label}</StepButton></Step>)}
        </Stepper>
        {props.saveFailed ? <Alert severity="error">{t("${key}.failed")}</Alert> : null}
        {errors.length > 0 ? <Alert severity="error"><Typography>{t("${key}.errors")}</Typography><Box component="ul" sx={{ m: 0, pl: 2 }}>
          {errors.map((error, index) => <li key={error.name + index}><Button type="button" disabled={disabled} sx={{ textAlign: "left", whiteSpace: "normal" }} onClick={() => { setTopic(error.topic); focusTarget.current = id + "-" + error.name; setFocusRevision(revision => revision + 1); }}>{error.label}: {error.message}</Button></li>)}
        </Box></Alert> : null}
${groups
  .map(
    (
      fields,
      index,
    ) => `        <Box component="section" hidden={topic !== ${index}} aria-labelledby={id + "-heading-${index}"}>
          <Stack spacing={2}>
            <Typography id={id + "-heading-${index}"} tabIndex={-1} component="h3" variant="h6">{labels[${index}]}</Typography>
${fields.map(field => `            <form.AppField name="${field.name}">{field => <field.TextField id={id + "-${field.name}"} fullWidth label={t("${key}.fields.${field.name}")} ${field.required ? "required " : ""}disabled={disabled} />}</form.AppField>`).join("\n")}
          </Stack>
        </Box>`,
  )
  .join("\n")}
        <Box component="section" hidden={topic !== labels.length - 1} aria-labelledby={id + "-heading-" + (labels.length - 1)}>
          <Stack spacing={2}>
            <Typography id={id + "-heading-" + (labels.length - 1)} tabIndex={-1} component="h3" variant="h6">{t("${key}.review")}</Typography>
            <Typography color="text.secondary">{t("${key}.reviewHint")}</Typography>
            <Paper variant="outlined" sx={{ p: 2 }}><Box component="dl" sx={{ m: 0, overflowWrap: "anywhere" }}>
${context.fields.map(field => `              <Typography component="dt" variant="subtitle2">{t("${key}.fields.${field.name}")}</Typography><Typography component="dd" sx={{ ml: 0, mb: 2 }}>{values.${field.name} || t("${key}.noValue")}</Typography>`).join("\n")}
            </Box></Paper>
          </Stack>
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button type="button" disabled={disabled || topic === 0} onClick={() => selectTopic(topic - 1)}>{t("${key}.previous")}</Button>
          {topic < labels.length - 1 ? <Button type="button" variant="contained" disabled={disabled} onClick={() => selectTopic(topic + 1)}>{t("${key}.next")}</Button> : <form.SubmitButton variant="contained" disabled={disabled}>{t(props.group === RgoFormGroup.CREATE ? "${key}.create" : "${key}.update")}</form.SubmitButton>}
        </Stack>
      </Stack>
    </form.Form>
  </form.AppForm>;
}`,
  );
}

function collection(context) {
  const name = context.name.pascal;
  const component = role(name, "Form");
  const key = `generated.${context.translationId}`;
  const first = context.fields[0].name;
  return file(
    `frontend/src/features/${context.feature.kebab}/components/${component}.tsx`,
    `import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { RgoFormGroup, useRgoForm } from "@rgo-web/frontend";
import { revalidateLogic, useStore } from "@tanstack/react-form";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useFormStateReporter } from "@/app/forms/hooks/useFormStateReporter";
import type { AppEntityFormProps, AppFormState } from "@/app/forms/types/AppEntityForm";
import { buildAppEntityFormOptions } from "@/app/forms/utils/buildAppEntityFormOptions";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { buildDefault${name}Input, buildDefault${name}Item, create${name}ValidationSchema, create${name}ItemValidationSchema, type ${name}FormValue, type ${name}Item } from "../models/${name}";

export type ${component}Props = AppEntityFormProps<${name}FormValue> & Readonly<{ disabled?: boolean }>;

/** Apply changes only the local aggregate. The caller acknowledges one complete parent command. */
export function ${component}(props: ${component}Props) {
  const { t } = useAppTranslation();
  const id = useId();
  const [draft, setDraft] = useState<${name}Item | null>(null);
  const [childState, setChildState] = useState<AppFormState>({ dirty: false, submitting: false });
  const returnFocus = useRef<string | null>(null);
  const addButton = useRef<HTMLButtonElement | null>(null);
  const editButtons = useRef(new Map<string, HTMLButtonElement>());
  const restoreFocus = useRef(false);
  const schema = create${name}ValidationSchema(t);
  const form = useRgoForm({
    defaultValues: props.group === RgoFormGroup.CREATE ? buildDefault${name}Input() : props.initialValue,
    ...buildAppEntityFormOptions(schema, props),
  });
  const onStateChange = props.onStateChange;
  const reportState = useCallback((state: AppFormState) => onStateChange({ dirty: state.dirty || childState.dirty, submitting: state.submitting }), [childState.dirty, onStateChange]);
  useFormStateReporter(form.store, reportState);
  const values = useStore(form.store, state => state.values);
  const submitting = useStore(form.store, state => state.isSubmitting);
  const attempts = useStore(form.store, state => state.submissionAttempts);
  const disabled = Boolean(props.disabled || submitting);
  const result = attempts > 0 ? schema.safeParse(values) : null;
  const issues = result && !result.success ? result.error.issues : [];
  useEffect(() => {
    if (draft === null && restoreFocus.current) {
      restoreFocus.current = false;
      const target = returnFocus.current === null ? null : editButtons.current.get(returnFocus.current);
      (target ?? addButton.current)?.focus();
    }
  }, [draft]);
  const closeEditor = () => {
    restoreFocus.current = true;
    setDraft(null); setChildState({ dirty: false, submitting: false });
  };
  return <Stack spacing={2} sx={{ minWidth: 0 }}>
    <form.AppForm>
      <form.Form noValidate slotProps={{ root: { onSubmit: event => { if (disabled || draft !== null) event.preventDefault(); } } }}>
        <Stack spacing={2}>
          {props.saveFailed ? <Alert severity="error">{t("${key}.failed")}</Alert> : null}
          <form.AppField name="title">{field => <field.TextField fullWidth label={t("${key}.aggregateTitle")} required disabled={disabled || draft !== null} />}</form.AppField>
          <Typography component="h3" variant="h6">{t("${key}.items")}</Typography>
          <Typography color="text.secondary">{t("${key}.localHint")}</Typography>
          {values.items.length === 0 ? <Alert severity="info">{t("${key}.empty")}</Alert> : null}
          <Box component="ul" sx={{ p: 0, m: 0, listStyle: "none", display: "grid", gap: 1 }}>
            {values.items.map((item, index) => <Paper component="li" variant="outlined" key={item.localId} sx={{ p: 2, minWidth: 0, overflowWrap: "anywhere" }}>
              <Stack spacing={1}>
${context.fields.map(field => `                <Typography><Box component="span" sx={{ fontWeight: 600 }}>{t("${key}.fields.${field.name}")}: </Box>{item.${field.name} || t("${key}.noValue")}</Typography>`).join("\n")}
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                  <Button ref={button => { if (button) editButtons.current.set(item.localId, button); else editButtons.current.delete(item.localId); }} type="button" disabled={disabled || draft !== null} onClick={() => { returnFocus.current = item.localId; setDraft({ ...item }); }}>{t("${key}.edit", { number: index + 1 })}</Button>
                  <Button type="button" color="error" disabled={disabled || draft !== null} onClick={() => form.setFieldValue("items", current => current.filter(row => row.localId !== item.localId))}>{t("${key}.remove", { number: index + 1 })}</Button>
                </Stack>
              </Stack>
            </Paper>)}
          </Box>
          <Button ref={addButton} type="button" variant="outlined" disabled={disabled || draft !== null || values.items.length >= 50} onClick={() => { returnFocus.current = null; setDraft(buildDefault${name}Item(crypto.randomUUID())); }}>{t("${key}.add")}</Button>
          {issues.length > 0 ? <Alert severity="error"><Typography>{t("${key}.errors")}</Typography><Box component="ul" sx={{ m: 0, pl: 2 }}>{issues.map((issue, index) => <li key={index}>{typeof issue.path[1] === "number" && values.items[issue.path[1]] ? <Button type="button" disabled={disabled || draft !== null} onClick={() => { const item = values.items[Number(issue.path[1])]; if (item) { returnFocus.current = item.localId; setDraft({ ...item }); } }}>{t("${key}.edit", { number: Number(issue.path[1]) + 1 })}: {issue.message}</Button> : issue.message}</li>)}</Box></Alert> : null}
          <form.SubmitButton variant="contained" disabled={disabled || draft !== null}>{t(props.group === RgoFormGroup.CREATE ? "${key}.create" : "${key}.update")}</form.SubmitButton>
        </Stack>
      </form.Form>
    </form.AppForm>
    {draft !== null ? <ItemEditor key={draft.localId} id={id} value={draft} disabled={disabled} onStateChange={setChildState} onCancel={closeEditor} onApply={item => {
      returnFocus.current = item.localId;
      form.setFieldValue("items", current => current.some(row => row.localId === item.localId) ? current.map(row => row.localId === item.localId ? item : row) : [...current, item]);
      closeEditor();
    }} existing={values.items.some(item => item.localId === draft.localId)} /> : null}
  </Stack>;
}

/** A separate form context outside the parent's HTML form prevents accidental aggregate submission. */
function ItemEditor({ id, value, disabled, existing, onStateChange, onApply, onCancel }: Readonly<{
  id: string; value: ${name}Item; disabled: boolean; existing: boolean;
  onStateChange: (state: AppFormState) => void; onApply: (value: ${name}Item) => void; onCancel: () => void;
}>) {
  const { t } = useAppTranslation();
  const schema = create${name}ItemValidationSchema(t);
  const form = useRgoForm({
    defaultValues: value,
    validationLogic: revalidateLogic({ mode: "submit", modeAfterSubmission: "change" }),
    validators: { onDynamic: schema },
    onSubmit: ({ value }) => { onApply(schema.parse(value)); },
  });
  useFormStateReporter(form.store, onStateChange);
  const submitting = useStore(form.store, state => state.isSubmitting);
  const locked = disabled || submitting;
  const apply = () => { if (!locked) void form.handleSubmit().catch(() => {}); };
  return <form.AppForm>
    <form.Form noValidate slotProps={{ root: { onSubmit: event => { if (locked) event.preventDefault(); } } }}>
    <Paper component="section" variant="outlined" aria-labelledby={id + "-editor"} sx={{ p: { xs: 2, sm: 3 } }} onKeyDown={event => { if (event.key === "Enter" && event.target instanceof HTMLInputElement && !event.nativeEvent.isComposing) { event.preventDefault(); apply(); } }}>
      <Stack spacing={2}>
        <Typography id={id + "-editor"} component="h3" variant="h6">{t(existing ? "${key}.editHeading" : "${key}.addHeading")}</Typography>
        <Alert severity="info">{t("${key}.stagedHint")}</Alert>
${context.fields.map(field => `        <form.AppField name="${field.name}">{field => <field.TextField ${field.name === first ? "autoFocus " : ""}fullWidth label={t("${key}.fields.${field.name}")} ${field.required ? "required " : ""}disabled={locked} />}</form.AppField>`).join("\n")}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button type="button" variant="contained" disabled={locked} onClick={apply}>{t("${key}.apply")}</Button>
          <Button type="button" disabled={locked} onClick={onCancel}>{t("${key}.cancel")}</Button>
        </Stack>
      </Stack>
    </Paper>
    </form.Form>
  </form.AppForm>;
}`,
  );
}

function example(context, collection) {
  const name = context.name.pascal;
  const component = role(name, "Form");
  const sample = `{ ${context.fields.map(field => `${field.name}: ${JSON.stringify(`${field.label} sample`.slice(0, field.maxLength))}`).join(", ")} }`;
  const value = collection
    ? `{ title: "Sample collection", items: [{ localId: "sample-item-1", serverId: "retained-item-1", ...${sample} }] }`
    : sample;
  return file(
    `frontend/src/pages/development-guide/generated/form/${context.feature.kebab}--${context.name.kebab}.example.tsx`,
    `import { Alert, Button, FormControlLabel, Stack, Switch } from "@mui/material";
import { RgoFormGroup } from "@rgo-web/frontend";
import { useEffect, useRef, useState } from "react";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { ${component}, type ${name}FormValue } from "@/features/${context.feature.kebab}";

export function Component() {
  const { t } = useDevelopmentGuideTranslation();
  const [populated, setPopulated] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);
  const [state, setState] = useState({ dirty: false, submitting: false });
  const [accepted, setAccepted] = useState<${name}FormValue | null>(null);
  const complete = useRef<(() => void) | null>(null);
  useEffect(() => () => { complete.current?.(); }, []);
  const reset = (next: boolean) => { setPopulated(next); setEpoch(value => value + 1); setSaved(false); setFailed(false); setAccepted(null); };
  return <Stack spacing={2}>
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
      <Button disabled={state.submitting} onClick={() => reset(false)}>{t("generatedExamples.default")}</Button>
      <Button disabled={state.submitting} onClick={() => reset(true)}>{t("generatedExamples.populated")}</Button>
      <FormControlLabel control={<Switch checked={disabled} onChange={(_, checked) => setDisabled(checked)} />} label={t("generatedExamples.disabled")} />
      <FormControlLabel control={<Switch checked={simulateFailure} disabled={state.submitting} onChange={(_, checked) => setSimulateFailure(checked)} />} label={t("generatedExamples.simulateFailure")} />
    </Stack>
    {state.submitting ? <Alert severity="info" action={<Button onClick={() => complete.current?.()}>{t("generatedExamples.complete")}</Button>}>{t("generatedExamples.pending")}</Alert> : null}
    {saved ? <Alert severity="success">{t("generatedExamples.saved")}</Alert> : null}
    <${component} key={epoch} {...(populated ? { group: RgoFormGroup.UPDATE, initialValue: ${value} } : { group: RgoFormGroup.CREATE })}
      disabled={disabled} saveFailed={failed} onStateChange={setState} onSaved={() => setSaved(true)}
      onSubmit={async value => {
        setSaved(false); setFailed(false);
        await new Promise<void>(resolve => { complete.current = resolve; });
        complete.current = null;
        if (simulateFailure) { setFailed(true); throw new Error("Simulated submission failure"); }
        setAccepted(value);
      }} />
    {accepted ? <BoxedResult value={accepted} /> : null}
  </Stack>;
}
function BoxedResult({ value }: Readonly<{ value: ${name}FormValue }>) {
  return <pre style={{ margin: 0, padding: 16, maxWidth: "100%", overflowX: "auto", border: "1px solid currentColor", borderRadius: 4 }}>{JSON.stringify(value, null, 2)}</pre>;
}`,
  );
}

function tests(context, collection) {
  const name = context.name.pascal;
  const component = role(name, "Form");
  const key = `generated.${context.translationId}`;
  const first = context.fields[0];
  const required = context.fields.find(field => field.required);
  const sample = `{ ${context.fields.map(field => `${field.name}: "v"`).join(", ")} }`;
  const value = collection
    ? `{ title: "Collection", items: [{ localId: "local-1", serverId: "server-1", ...${sample} }] }`
    : sample;
  const modelTest = file(
    `frontend/tests/features/${context.feature.kebab}/models/${name}.test.ts`,
    `import { describe, expect, it } from "vitest";
import { createAppI18n } from "@/app/localization/createAppI18n";
import { buildDefault${name}Input, create${name}ValidationSchema } from "@/features/${context.feature.kebab}/models/${name}";
describe("${name} complete input", () => {
  const schema = create${name}ValidationSchema(createAppI18n("en").getFixedT(null, "translation"));
  it("validates complete input and trims text before the owner receives it", () => {
    const value = ${value};
    ${collection ? `value.items[0]!.${first.name} = " v ";` : `value.${first.name} = " v ";`}
    const result = schema.parse(value);
    expect(${collection ? `result.items[0]!.${first.name}` : `result.${first.name}`}).toBe("v");
  });
  it("rejects values exceeding text bounds", () => {
    const value = ${value};
    ${collection ? `value.items[0]!.${first.name}` : `value.${first.name}`} = "x".repeat(${first.maxLength + 1});
    expect(schema.safeParse(value).success).toBe(false);
  });
${
  collection
    ? `  it("rejects an empty aggregate and duplicate local identities", () => {
    expect(schema.safeParse(buildDefault${name}Input()).success).toBe(false);
    const value = ${value};
    value.items.push({ ...value.items[0]! });
    expect(schema.safeParse(value).success).toBe(false);
  });`
    : `  it("keeps defaults as an explicit draft", () => {
    expect(buildDefault${name}Input()).toEqual({ ${context.fields.map(field => `${field.name}: ""`).join(", ")} });
  });`
}
});`,
  );
  const componentTest = file(
    `frontend/tests/features/${context.feature.kebab}/components/${component}.test.tsx`,
    `import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RgoFormGroup } from "@rgo-web/frontend";
import { describe, expect, it, vi } from "vitest";
import { createAppI18n } from "@/app/localization/createAppI18n";
import { ${component} } from "@/features/${context.feature.kebab}";
vi.mock("@/app/localization/hooks/useAppTranslation", () => ({ useAppTranslation: () => ({ t: createAppI18n("en").getFixedT(null, "translation") }) }));
const t = createAppI18n("en").getFixedT(null, "translation");
describe("${component} draft ownership", () => {
${
  collection
    ? `  it("returns focus to the persistent row action after correcting a summary-linked item", async () => {
    const initialValue = ${value};
    initialValue.items[0]!.${first.name} = "x".repeat(${first.maxLength + 1});
    const onSubmit = vi.fn(async () => {});
    render(<${component} group={RgoFormGroup.UPDATE} initialValue={initialValue} saveFailed={false} onSaved={vi.fn()} onStateChange={vi.fn()} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: t("${key}.update") }));
    const summaryLabel = t("${key}.edit", { number: 1 }) + ": " + t("${key}.max", { max: ${first.maxLength} });
    fireEvent.click(await screen.findByRole("button", { name: summaryLabel }));
    fireEvent.change(screen.getByRole("textbox", { name: t("${key}.fields.${first.name}") }), { target: { value: "v" } });
    fireEvent.click(screen.getByRole("button", { name: t("${key}.apply") }));
    await waitFor(() => expect(screen.queryByRole("button", { name: summaryLabel })).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole("button", { name: t("${key}.edit", { number: 1 }) })).toHaveFocus());
    expect(onSubmit).not.toHaveBeenCalled();
  });`
    : ""
}
${
  !collection && required
    ? `  it("reveals a hidden invalid section and focuses the actual input from its error link", async () => {
    const onSubmit = vi.fn(async () => {});
    render(<${component} group={RgoFormGroup.CREATE} saveFailed={false} onSaved={vi.fn()} onStateChange={vi.fn()} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("tab", { name: t("${key}.review") }));
    fireEvent.click(screen.getByRole("button", { name: t("${key}.create") }));
    const link = await screen.findByRole("button", { name: t("${key}.fields.${required.name}") + ": " + t("${key}.required") });
    fireEvent.click(link);
    await waitFor(() => expect(screen.getByRole("textbox", { name: t("${key}.fields.${required.name}") })).toHaveFocus());
    expect(onSubmit).not.toHaveBeenCalled();
  });`
    : ""
}
${
  collection
    ? `  it("discards a canceled child draft and applies local changes without submitting the aggregate", async () => {
    const onSubmit = vi.fn(async () => {});
    render(<${component} group={RgoFormGroup.UPDATE} initialValue={${value}} saveFailed={false} onSaved={vi.fn()} onStateChange={vi.fn()} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: t("${key}.edit", { number: 1 }) }));
    fireEvent.change(screen.getByRole("textbox", { name: t("${key}.fields.${first.name}") }), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: t("${key}.cancel") }));
    fireEvent.click(screen.getByRole("button", { name: t("${key}.edit", { number: 1 }) }));
    expect(screen.getByRole("textbox", { name: t("${key}.fields.${first.name}") })).toHaveValue("v");
    fireEvent.change(screen.getByRole("textbox", { name: t("${key}.fields.${first.name}") }), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: t("${key}.apply") }));
    await waitFor(() => expect(screen.queryByRole("button", { name: t("${key}.apply") })).not.toBeInTheDocument());
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: t("${key}.update") }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ items: [expect.objectContaining({ localId: "local-1", serverId: "server-1", ${first.name}: "x" })] }));
  });`
    : `  it("retains field values across navigation without submitting", () => {
    const onSubmit = vi.fn(async () => {});
    render(<${component} group={RgoFormGroup.CREATE} saveFailed={false} onSaved={vi.fn()} onStateChange={vi.fn()} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByRole("textbox", { name: t("${key}.fields.${first.name}") }), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: t("${key}.next") }));
    fireEvent.click(screen.getByRole("button", { name: t("${key}.previous") }));
    expect(screen.getByRole("textbox", { name: t("${key}.fields.${first.name}") })).toHaveValue("x");
    expect(onSubmit).not.toHaveBeenCalled();
  });`
}
  it("awaits the complete command and preserves a rejected draft", async () => {
    let reject: ((error: Error) => void) | undefined;
    const onSaved = vi.fn();
    const onSubmit = vi.fn(() => new Promise<void>((_, rejectPromise) => { reject = rejectPromise; }));
    render(<${component} group={RgoFormGroup.UPDATE} initialValue={${value}} saveFailed={false} onSaved={onSaved} onStateChange={vi.fn()} onSubmit={onSubmit} />);
${collection ? "" : `    fireEvent.click(screen.getByRole("tab", { name: t("${key}.review") }));`}
    fireEvent.click(screen.getByRole("button", { name: t("${key}.update") }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSaved).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: t("${key}.update") })).toBeDisabled();
    reject?.(new Error("Rejected"));
    await waitFor(() => expect(screen.getByRole("button", { name: t("${key}.update") })).toBeEnabled());
    expect(onSaved).not.toHaveBeenCalled();
${
  collection
    ? `    expect(screen.getByRole("textbox", { name: t("${key}.aggregateTitle") })).toHaveValue("Collection");`
    : `    fireEvent.click(screen.getByRole("tab", { name: t("${key}.details") }));
    expect(screen.getByRole("textbox", { name: t("${key}.fields.${first.name}") })).toHaveValue("v");`
}
  });
});`,
  );
  return [modelTest, componentTest];
}

export function renderWorkflowEditors(kind, context) {
  if (kind !== "form" || !["wizard", "collection"].includes(context.variant)) return undefined;
  const collectionVariant = context.variant === "collection";
  const name = context.name.pascal;
  const component = role(name, "Form");
  return [
    model(context, collectionVariant),
    collectionVariant ? collection(context) : wizard(context),
    file(
      `frontend/src/features/${context.feature.kebab}/index.ts`,
      `export { ${component} } from "./components/${component}";
export type { ${component}Props } from "./components/${component}";
export type { ${name}FormValue${collectionVariant ? `, ${name}Item` : ""} } from "./models/${name}";`,
    ),
    ...resources(context),
    example(context, collectionVariant),
    ...tests(context, collectionVariant),
  ];
}
