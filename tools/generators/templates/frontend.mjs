/**
 * Application-owned presentation templates. Inputs have already been validated
 * by the CLI; this module renders files without reading or writing the workspace.
 */
import { renderAdvancedFrontend } from "./frontend-advanced.mjs";

const quote = value => JSON.stringify(value);
const role = (name, suffix) => (name.endsWith(suffix) ? name : `${name}${suffix}`);
const file = (path, content) => ({ path, content: `${content.trim()}\n` });

function paths(context) {
  return {
    owner: `frontend/src/features/${context.feature.kebab}`,
    publicImport: `@/features/${context.feature.kebab}`,
    example: kind =>
      `frontend/src/pages/development-guide/generated/${kind}/${context.feature.kebab}--${context.name.kebab}.example.tsx`,
    locale: `frontend/src/app/localization/translations/generated/${context.translationId}`,
    key: `generated.${context.translationId}`,
  };
}

function localeFiles(kind, context) {
  const { locale } = paths(context);
  const form = kind === "form" || kind === "feature";
  const table = kind === "table" || kind === "feature";
  const en = { title: context.name.title };
  const hr = { title: context.name.title };
  if (["component", "page"].includes(kind)) {
    en.action = "Continue";
    hr.action = "Nastavi";
  }
  if (form || table) {
    en.fields = Object.fromEntries(context.fields.map(field => [field.name, field.label]));
    const knownLabels = { name: "Naziv", title: "Naslov", description: "Opis", email: "E-pošta" };
    hr.fields = Object.fromEntries(
      context.fields.map(field => [field.name, field.labelHr ?? knownLabels[field.name] ?? field.label]),
    );
  }
  if (form) {
    Object.assign(en, {
      create: "Create",
      update: "Save changes",
      required: "This field is required.",
      max: "Use no more than {{max}} characters.",
      failed: "Changes could not be saved. Try again.",
      saved: "Changes saved.",
    });
    Object.assign(hr, {
      create: "Stvori",
      update: "Spremi promjene",
      required: "Ovo je polje obavezno.",
      max: "Unesite najviše {{max}} znakova.",
      failed: "Promjene nije moguće spremiti. Pokušajte ponovno.",
      saved: "Promjene su spremljene.",
    });
  }
  if (table) {
    Object.assign(en, {
      empty: "No records found.",
      loading: "Loading records…",
      error: "Records could not be loaded.",
      retry: "Try again",
      rowsPerPage: "Rows per page",
      displayed: "{{from}}–{{to}} / {{count}}",
      first: "First page",
      last: "Last page",
      next: "Next page",
      previous: "Previous page",
    });
    Object.assign(hr, {
      empty: "Nema pronađenih zapisa.",
      loading: "Učitavanje zapisa…",
      error: "Zapise nije moguće učitati.",
      retry: "Pokušaj ponovno",
      rowsPerPage: "Redaka po stranici",
      displayed: "{{from}}–{{to}} / {{count}}",
      first: "Prva stranica",
      last: "Posljednja stranica",
      next: "Sljedeća stranica",
      previous: "Prethodna stranica",
    });
  }
  return [
    file(`${locale}.en.ts`, `export const translations = ${JSON.stringify(en, null, 2)} as const;`),
    file(
      `${locale}.hr.ts`,
      `import type { StringLeaves } from "../../types/TranslationShape";
import type { translations as english } from "./${context.translationId}.en";

export const translations = ${JSON.stringify(hr, null, 2)} as const satisfies StringLeaves<typeof english>;`,
    ),
  ];
}

function modelFile(context, { form, table }) {
  const { owner, key } = paths(context);
  const name = context.name.pascal;
  const members = context.fields.map(field => `  ${field.name}: string;`).join("\n");
  const declarations = [];
  if (form) {
    declarations.push(`export type ${name}FormValue = Readonly<{\n${members}\n}>;`);
    declarations.push(`export function buildDefault${name}Input(): ${name}FormValue {
  return { ${context.fields.map(field => `${field.name}: ""`).join(", ")} };
}`);
    declarations.push(`export function create${name}ValidationSchema(t: TFunction<"translation">) {
  return z.object({
${context.fields
  .map(
    field =>
      `    ${field.name}: z.string().trim()${field.required ? `.min(1, t("${key}.required"))` : ""}.max(${field.maxLength}, t("${key}.max", { max: ${field.maxLength} })),`,
  )
  .join("\n")}
  });
}`);
  }
  if (table) {
    declarations.push(
      `export type ${name}Row = ${form ? `${name}FormValue & Readonly<{ id: string }>` : `Readonly<{\n  id: string;\n${members}\n}>`};`,
    );
  }
  return file(
    `${owner}/models/${name}.ts`,
    `${form ? 'import type { TFunction } from "i18next";\nimport { z } from "zod";\n\n' : ""}${declarations.join("\n\n")}`,
  );
}

function formFiles(context) {
  const { owner, key } = paths(context);
  const name = context.name.pascal;
  const component = role(name, "Form");
  return [
    file(
      `${owner}/components/${component}.tsx`,
      `import { Alert } from "@mui/material";
import { RgoContainerGrid, RgoFormGroup, useRgoForm } from "@rgo-web/frontend";
import { useStore } from "@tanstack/react-form";

import { useFormStateReporter } from "@/app/forms/hooks/useFormStateReporter";
import type { AppEntityFormProps } from "@/app/forms/types/AppEntityForm";
import { buildAppEntityFormOptions } from "@/app/forms/utils/buildAppEntityFormOptions";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";

import { buildDefault${name}Input, create${name}ValidationSchema, type ${name}FormValue } from "../models/${name}";

export type ${component}Props = AppEntityFormProps<${name}FormValue> & Readonly<{ disabled?: boolean }>;

/** The caller owns persistence, acknowledged success and editor lifetime. */
export function ${component}(props: ${component}Props) {
  const { t } = useAppTranslation();
  const schema = create${name}ValidationSchema(t);
  const form = useRgoForm({
    defaultValues: props.group === RgoFormGroup.CREATE ? buildDefault${name}Input() : props.initialValue,
    ...buildAppEntityFormOptions(schema, props),
  });
  useFormStateReporter(form.store, props.onStateChange);
  const submitting = useStore(form.store, state => state.isSubmitting);
  const disabled = Boolean(props.disabled || submitting);

  return (
    <form.AppForm>
      <form.Form slotProps={{ root: { onSubmit: event => { if (disabled) event.preventDefault(); } } }}>
        <RgoContainerGrid container columns={{ xs: 1, sm: 2 }} spacing={2}>
          {props.saveFailed ? <RgoContainerGrid size={{ xs: 1, sm: 2 }}><Alert severity="error">{t("${key}.failed")}</Alert></RgoContainerGrid> : null}
${context.fields
  .map(
    field => `          <RgoContainerGrid size={{ xs: 1, sm: 1 }}>
            <form.AppField name="${field.name}">
              {field => <field.TextField fullWidth label={t("${key}.fields.${field.name}")} ${field.required ? "required " : ""}disabled={disabled} />}
            </form.AppField>
          </RgoContainerGrid>`,
  )
  .join("\n")}
          <RgoContainerGrid size={{ xs: 1, sm: 2 }}>
            <form.SubmitButton disabled={disabled} variant="contained">{t(props.group === RgoFormGroup.CREATE ? "${key}.create" : "${key}.update")}</form.SubmitButton>
          </RgoContainerGrid>
        </RgoContainerGrid>
      </form.Form>
    </form.AppForm>
  );
}`,
    ),
  ];
}

function schemaTest(context) {
  const name = context.name.pascal;
  const first = context.fields[0];
  return file(
    `frontend/tests/features/${context.feature.kebab}/models/${name}.test.ts`,
    `import { describe, expect, it } from "vitest";
import { createAppI18n } from "@/app/localization/createAppI18n";
import { create${name}ValidationSchema } from "@/features/${context.feature.kebab}/models/${name}";

describe("${name} input validation", () => {
  it("validates and trims accepted values before the owner receives them", () => {
    const schema = create${name}ValidationSchema(createAppI18n("en").getFixedT(null, "translation"));
    const result = schema.parse({ ${context.fields.map(field => `${field.name}: "  ${"v".repeat(Math.min(field.maxLength, 5))}  "`).join(", ")} });
    expect(result.${first.name}).toBe(${quote("v".repeat(Math.min(first.maxLength, 5)))});
  });
  it("rejects input beyond the declared field bound", () => {
    const schema = create${name}ValidationSchema(createAppI18n("en").getFixedT(null, "translation"));
    expect(schema.safeParse({ ${context.fields.map(field => `${field.name}: ${field === first ? `"x".repeat(${first.maxLength + 1})` : '"v"'}`).join(", ")} }).success).toBe(false);
  });
${
  context.fields.some(field => field.required)
    ? `  it("rejects a missing required value", () => {
    const schema = create${name}ValidationSchema(createAppI18n("en").getFixedT(null, "translation"));
    expect(schema.safeParse({ ${context.fields.map(field => `${field.name}: ""`).join(", ")} }).success).toBe(false);
  });`
    : ""
}
});`,
  );
}

function tableFiles(context) {
  const { owner, key } = paths(context);
  const name = context.name.pascal;
  const component = role(name, "Table");
  return [
    file(
      `${owner}/components/${component}.tsx`,
      `import { Alert, Button } from "@mui/material";
import { RgoDesktopTable, type TableColumnDef } from "@rgo-web/frontend";

import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { useAppDisplayPreferences } from "@/app/theme/preferences/useAppDisplayPreferences";
import type { ${name}Row } from "../models/${name}";

export type ${component}Props = Readonly<{
  rows: readonly ${name}Row[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}>;

/** Local processing requires the complete bounded collection from the caller. */
export function ${component}({ rows, loading = false, error = false, onRetry }: ${component}Props) {
  const { t, i18n } = useAppTranslation();
  const { desktopTableSize } = useAppDisplayPreferences();
  const columns: readonly TableColumnDef<${name}Row>[] = [
${context.fields
  .map(
    (field, index) => `    {
      id: "${field.name}", header: t("${key}.fields.${field.name}"),
      renderCell: ({ row }) => row.${field.name},${index === 0 ? " rowHeader: true," : ""}
      sort: { compare: (left, right) => left.${field.name}.localeCompare(right.${field.name}, i18n.resolvedLanguage) },
    },`,
  )
  .join("\n")}
  ];
  if (error) return <Alert severity="error" action={onRetry ? <Button color="inherit" onClick={onRetry}>{t("${key}.retry")}</Button> : undefined}>{t("${key}.error")}</Alert>;
  return (
    <RgoDesktopTable
      rows={rows} columns={columns} getRowKey={row => row.id}
      tableLabel={t("${key}.title")} emptyContent={t("${key}.empty")}
      loadingContent={t("${key}.loading")} size={desktopTableSize}
      defaultState={{ rowsPerPage: 5 }}
      pagination={{
        rowsPerPageOptions: [5, 10, 25], labelRowsPerPage: t("${key}.rowsPerPage"),
        labelDisplayedRows: ({ count, from, to }) => t("${key}.displayed", { count, from, to }),
        getItemAriaLabel: type => ({ first: t("${key}.first"), last: t("${key}.last"), next: t("${key}.next"), previous: t("${key}.previous") })[type],
      }}
      {...(loading ? { loading: true, loadingLabel: t("${key}.loading") } : { loading: false })}
    />
  );
}`,
    ),
  ];
}

function cardFiles(context, contentName) {
  const { owner, key } = paths(context);
  return [
    file(
      `${owner}/components/${contentName}.tsx`,
      `import { Button, Paper, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";

export type ${contentName}Props = Readonly<{
  children?: ReactNode;
  onAction?: () => void;
  actionLabel?: string;
  disabled?: boolean;
}>;

export function ${contentName}({ children, onAction, actionLabel, disabled = false }: ${contentName}Props) {
  const { t } = useAppTranslation();
  return <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, minWidth: 0 }}>
    <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
      <Typography component="h2" variant="h6">{t("${key}.title")}</Typography>
      {children}
      {onAction ? <Button variant="contained" disabled={disabled} onClick={onAction}>{actionLabel ?? t("${key}.action")}</Button> : null}
    </Stack>
  </Paper>;
}`,
    ),
  ];
}

function shellFiles(context) {
  const { owner, key } = paths(context);
  const component = role(context.name.pascal, "Shell");
  return [
    file(
      `${owner}/components/${component}.tsx`,
      `import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";

export type ${component}Props = Readonly<{ children: ReactNode; header?: ReactNode; sidebar?: ReactNode }>;

/** Feature layout slots; application navigation and preferences remain in AppShell. */
export function ${component}({ children, header, sidebar }: ${component}Props) {
  const { t } = useAppTranslation();
  return <Stack spacing={2} sx={{ minWidth: 0 }}>
    <Box><Typography component="h2" variant="h5">{t("${key}.title")}</Typography>{header}</Box>
    <Box sx={{ display: "grid", gap: 2, minWidth: 0, gridTemplateColumns: sidebar ? { xs: "minmax(0, 1fr)", md: "15rem minmax(0, 1fr)" } : "minmax(0, 1fr)" }}>
      {sidebar ? <Box component="aside" sx={{ minWidth: 0 }}>{sidebar}</Box> : null}
      <Box sx={{ minWidth: 0 }}>{children}</Box>
    </Box>
  </Stack>;
}`,
    ),
  ];
}

function featureFiles(context) {
  const { owner, key } = paths(context);
  const name = context.name.pascal;
  const form = role(name, "Form");
  const table = role(name, "Table");
  const component = role(name, "Feature");
  return [
    file(
      `${owner}/components/${component}.tsx`,
      `import { Alert, Stack, Typography } from "@mui/material";
import { RgoFormGroup } from "@rgo-web/frontend";
import { useState } from "react";
import { useAppTranslation } from "@/app/localization/hooks/useAppTranslation";
import { ${form} } from "./${form}";
import { ${table}, type ${table}Props } from "./${table}";
import type { ${name}FormValue } from "../models/${name}";

export type ${component}Props = ${table}Props & Readonly<{
  onSubmit: (value: ${name}FormValue) => Promise<void>;
  disabled?: boolean;
}>;

/** Composes presentation and awaited callbacks without selecting a transport or persistence policy. */
export function ${component}({ onSubmit, disabled, ...tableProps }: ${component}Props) {
  const { t } = useAppTranslation();
  const [saved, setSaved] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  return <Stack spacing={3}>
    <Typography component="h2" variant="h5">{t("${key}.title")}</Typography>
    {saved ? <Alert severity="success">{t("${key}.saved")}</Alert> : null}
    <${form}
      group={RgoFormGroup.CREATE} disabled={disabled} saveFailed={saveFailed}
      onStateChange={() => {}} onSaved={() => setSaved(true)}
      onSubmit={async value => {
        setSaved(false); setSaveFailed(false);
        try { await onSubmit(value); } catch (error) { setSaveFailed(true); throw error; }
      }}
    />
    <${table} {...tableProps} />
  </Stack>;
}`,
    ),
  ];
}

function sampleValue(context, index = 1) {
  return `{ ${context.fields.map(field => `${field.name}: ${quote(`${field.label} ${index}`.slice(0, field.maxLength))}`).join(", ")} }`;
}

function formExample(context) {
  const { publicImport, example } = paths(context);
  const name = context.name.pascal;
  const component = role(name, "Form");
  return file(
    example("form"),
    `import { Alert, Button, FormControlLabel, Stack, Switch } from "@mui/material";
import { RgoFormGroup } from "@rgo-web/frontend";
import { useEffect, useRef, useState } from "react";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { ${component} } from "${publicImport}";

export function Component() {
  const { t } = useDevelopmentGuideTranslation();
  const [populated, setPopulated] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);
  const [state, setState] = useState({ dirty: false, submitting: false });
  const complete = useRef<(() => void) | null>(null);
  useEffect(() => () => { complete.current?.(); }, []);
  const reset = (nextPopulated: boolean) => {
    setPopulated(nextPopulated); setSaved(false); setFailed(false); setEpoch(value => value + 1);
  };
  return <Stack spacing={2}>
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
      <Button disabled={state.submitting} onClick={() => reset(false)}>{t("generatedExamples.default")}</Button>
      <Button disabled={state.submitting} onClick={() => reset(true)}>{t("generatedExamples.populated")}</Button>
      <FormControlLabel control={<Switch checked={disabled} onChange={(_, checked) => setDisabled(checked)} />} label={t("generatedExamples.disabled")} />
      <FormControlLabel control={<Switch disabled={state.submitting} checked={simulateFailure} onChange={(_, checked) => setSimulateFailure(checked)} />} label={t("generatedExamples.simulateFailure")} />
    </Stack>
    {state.submitting ? <Alert severity="info" action={<Button onClick={() => complete.current?.()}>{t("generatedExamples.complete")}</Button>}>{t("generatedExamples.pending")}</Alert> : null}
    {saved ? <Alert severity="success">{t("generatedExamples.saved")}</Alert> : null}
    <${component}
      key={epoch} {...(populated ? { group: RgoFormGroup.UPDATE, initialValue: ${sampleValue(context)} } : { group: RgoFormGroup.CREATE })}
      disabled={disabled} saveFailed={failed} onStateChange={setState} onSaved={() => setSaved(true)}
      onSubmit={async () => {
        setSaved(false); setFailed(false);
        await new Promise<void>(resolve => { complete.current = resolve; });
        complete.current = null;
        if (simulateFailure) { setFailed(true); throw new Error("Simulated submission failure"); }
      }}
    />
  </Stack>;
}`,
  );
}

function tableExample(context) {
  const { publicImport, example } = paths(context);
  const component = role(context.name.pascal, "Table");
  return file(
    example("table"),
    `import { Button, MenuItem, Stack, TextField } from "@mui/material";
import { useState } from "react";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { ${component} } from "${publicImport}";

const rows = [${Array.from({ length: 12 }, (_, index) => `{ id: "sample-${index + 1}", ...${sampleValue(context, index + 1)} }`).join(",\n")}];

export function Component() {
  const { t } = useDevelopmentGuideTranslation();
  const [state, setState] = useState("populated");
  const [filter, setFilter] = useState("");
  const filtered = rows.filter(row => Object.values(row).some(value => value.toLocaleLowerCase().includes(filter.toLocaleLowerCase())));
  return <Stack spacing={2}>
    <TextField select label={t("generatedExamples.state")} value={state} onChange={event => setState(event.target.value)}>
      {(["populated", "empty", "loading", "error"] as const).map(value => <MenuItem key={value} value={value}>{t(("generatedExamples." + value) as "generatedExamples.populated" | "generatedExamples.empty" | "generatedExamples.loading" | "generatedExamples.error")}</MenuItem>)}
    </TextField>
    <TextField label={t("generatedExamples.filter")} value={filter} onChange={event => setFilter(event.target.value)} />
    <Button onClick={() => { setFilter(""); setState("populated"); }}>{t("generatedExamples.reset")}</Button>
    <${component} rows={state === "empty" ? [] : filtered} loading={state === "loading"} error={state === "error"} onRetry={() => setState("populated")} />
  </Stack>;
}`,
  );
}

function cardExample(kind, context, component) {
  const { publicImport, example } = paths(context);
  return file(
    example(kind),
    `import { Stack, Typography } from "@mui/material";
import { useState } from "react";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { ${component} } from "${publicImport}";

export function Component() {
  const { t } = useDevelopmentGuideTranslation();
  const [count, setCount] = useState(0);
  return <Stack spacing={2}>
    <${component} onAction={() => setCount(value => value + 1)}>
      <Typography>{t("generatedExamples.content")}</Typography>
    </${component}>
    <Typography role="status">{t("generatedExamples.count", { count })}</Typography>
  </Stack>;
}`,
  );
}

function shellExample(context) {
  const { publicImport, example } = paths(context);
  const component = role(context.name.pascal, "Shell");
  return file(
    example("shell"),
    `import { Button, Paper, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { ${component} } from "${publicImport}";

export function Component() {
  const { t } = useDevelopmentGuideTranslation();
  const [expanded, setExpanded] = useState(true);
  return <Stack spacing={2}>
    <Button aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{t("generatedExamples.sidebar")}</Button>
    <${component}
      header={<Typography>{t("generatedExamples.header")}</Typography>}
      sidebar={expanded ? <Paper variant="outlined" sx={{ p: 2 }}><Typography>{t("generatedExamples.sidebar")}</Typography></Paper> : null}
    >
      <Paper variant="outlined" sx={{ p: 2 }}><Typography>{t("generatedExamples.content")}</Typography></Paper>
    </${component}>
  </Stack>;
}`,
  );
}

function featureExample(context) {
  const { publicImport, example } = paths(context);
  const name = context.name.pascal;
  const component = role(name, "Feature");
  return file(
    example("feature"),
    `import { Button, FormControlLabel, Stack, Switch } from "@mui/material";
import { useRef, useState } from "react";
import { useDevelopmentGuideTranslation } from "@/app/localization/hooks/useDevelopmentGuideTranslation";
import { ${component}, type ${name}Row } from "${publicImport}";

export function Component() {
  const { t } = useDevelopmentGuideTranslation();
  const [rows, setRows] = useState<${name}Row[]>([{ id: "sample-1", ...${sampleValue(context)} }]);
  const sequence = useRef(1);
  const [disabled, setDisabled] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  return <Stack spacing={2}>
    <FormControlLabel control={<Switch checked={disabled} onChange={(_, checked) => setDisabled(checked)} />} label={t("generatedExamples.disabled")} />
    <FormControlLabel control={<Switch checked={simulateFailure} onChange={(_, checked) => setSimulateFailure(checked)} />} label={t("generatedExamples.simulateFailure")} />
    <Button onClick={() => setRows([])}>{t("generatedExamples.empty")}</Button>
    <${component} rows={rows} disabled={disabled} onSubmit={async value => {
      if (simulateFailure) throw new Error("Simulated submission failure");
      sequence.current += 1;
      const row = { id: "sample-" + sequence.current, ...value };
      setRows(current => [...current, row]);
    }} />
  </Stack>;
}`,
  );
}

/** Render a complete plan; callers own collision checks, formatting and writes. */
export function renderFrontend(kind, context) {
  const advanced = renderAdvancedFrontend(kind, context);
  if (advanced) return advanced;
  const { owner } = paths(context);
  const name = context.name.pascal;
  const files = [...localeFiles(kind, context)];
  const exports = [];
  if (kind === "component" || kind === "page") {
    const component = kind === "page" ? role(name, "Content") : name;
    files.push(...cardFiles(context, component));
    exports.push(`export { ${component} } from "./components/${component}";`);
    exports.push(`export type { ${component}Props } from "./components/${component}";`);
    if (kind === "page") {
      const page = role(name, "Page");
      files.push(
        file(
          `frontend/src/pages/${context.feature.kebab}/${page}.tsx`,
          `import { ${component}, type ${component}Props } from "@/features/${context.feature.kebab}";

export function ${page}(props: ${component}Props) {
  return <${component} {...props} />;
}`,
        ),
      );
      files.push(cardExample(kind, context, component));
    } else files.push(cardExample(kind, context, component));
  } else if (kind === "shell") {
    const component = role(name, "Shell");
    files.push(...shellFiles(context), shellExample(context));
    exports.push(`export { ${component} } from "./components/${component}";`);
    exports.push(`export type { ${component}Props } from "./components/${component}";`);
  } else if (kind === "form" || kind === "table" || kind === "feature") {
    const form = kind !== "table";
    const table = kind !== "form";
    files.push(modelFile(context, { form, table }));
    if (form) {
      const component = role(name, "Form");
      files.push(...formFiles(context), schemaTest(context));
      exports.push(`export { ${component} } from "./components/${component}";`);
      exports.push(`export type { ${component}Props } from "./components/${component}";`);
      exports.push(`export type { ${name}FormValue } from "./models/${name}";`);
    }
    if (table) {
      const component = role(name, "Table");
      files.push(...tableFiles(context));
      exports.push(`export { ${component} } from "./components/${component}";`);
      exports.push(`export type { ${component}Props } from "./components/${component}";`);
      exports.push(`export type { ${name}Row } from "./models/${name}";`);
    }
    if (kind === "feature") {
      const component = role(name, "Feature");
      files.push(...featureFiles(context), featureExample(context));
      exports.push(`export { ${component} } from "./components/${component}";`);
      exports.push(`export type { ${component}Props } from "./components/${component}";`);
    } else files.push(kind === "form" ? formExample(context) : tableExample(context));
  } else throw new Error(`Unsupported frontend generator: ${kind}`);
  files.push(file(`${owner}/index.ts`, exports.join("\n")));
  return files;
}
