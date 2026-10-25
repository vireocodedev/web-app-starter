/** Compile-time helpers for explicit feature-owned fields, never a runtime form renderer. */
export const fieldType = field => field.type ?? "string";
export const choiceFields = c => c.fields.filter(f => ["select", "autocomplete"].includes(fieldType(f)));
export const hasChoices = c => choiceFields(c).length > 0;
export const valueType = f =>
  ({
    integer: "number | null",
    number: "number | null",
    boolean: "boolean",
    select: "string | null",
    autocomplete: "string | null",
  })[fieldType(f)] ?? "string";
export const defaultValue = f =>
  ["integer", "number", "select", "autocomplete"].includes(fieldType(f))
    ? "null"
    : fieldType(f) === "boolean"
      ? "false"
      : '""';
export const sampleValue = (f, text = '"v"') =>
  ({
    integer: "0",
    number: "12.5",
    boolean: "false",
    date: '"2026-01-15"',
    select: '"sample-option"',
    autocomplete: '"sample-option"',
  })[fieldType(f)] ?? text;
export const optionMembers = (c, label = '"Sample option"') =>
  choiceFields(c)
    .map(f => `${f.name}: [{ id: "sample-option", label: ${label} }]`)
    .join(", ");
export const optionTypes = c =>
  !hasChoices(c)
    ? ""
    : `export type ${c.name.pascal}Option = Readonly<{ id: string; label: string }>;
export type ${c.name.pascal}ChoiceOptions = Readonly<{ ${choiceFields(c)
        .map(f => `${f.name}: readonly ${c.name.pascal}Option[]`)
        .join("; ")} }>;
export const empty${c.name.pascal}Options: ${c.name.pascal}ChoiceOptions = { ${choiceFields(c)
        .map(f => `${f.name}: []`)
        .join(", ")} };`;
export const optionsParameter = c =>
  hasChoices(c) ? `, options: ${c.name.pascal}ChoiceOptions = empty${c.name.pascal}Options` : "";
export const optionsProp = c => (hasChoices(c) ? `options?: ${c.name.pascal}ChoiceOptions;` : "");
export const optionImport = c =>
  hasChoices(c) ? `, empty${c.name.pascal}Options, type ${c.name.pascal}ChoiceOptions` : "";
export const schemaField = (f, key) => {
  const t = fieldType(f);
  if (["integer", "number"].includes(t))
    return `z.number()${t === "integer" ? `.int(t("${key}.integer"))` : ""}.nullable()${f.required ? `.refine(value => value !== null, t("${key}.required"))` : ""}`;
  if (t === "boolean") return "z.boolean()";
  if (["select", "autocomplete"].includes(t))
    return `z.string().nullable().refine(value => ${f.required ? "value !== null && " : "value === null || "}options.${f.name}.some(option => option.id === value), t("${key}.${f.required ? "requiredChoice" : "choice"}"))`;
  if (t === "date")
    return `z.string().refine(value => ${f.required ? "" : 'value === "" || '}(/^\\d{4}-\\d{2}-\\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value), t("${key}.date"))`;
  return `z.string().trim()${f.required ? `.min(1, t("${key}.required"))` : ""}.max(${f.maxLength ?? 500}, t("${key}.max", { max: ${f.maxLength ?? 500} }))`;
};
export function control(f, key, { id = "", disabled = "disabled" } = {}) {
  const t = fieldType(f),
    props = `label={t("${key}.fields.${f.name}")} disabled={${disabled}}`;
  const nativeId = id ? `id={${id}} ` : "";
  if (t === "boolean") return `<field.CheckboxField ${props} />`;
  if (["integer", "number"].includes(t))
    return `<field.NumberField ${nativeId}fullWidth ${props}${f.required ? " required" : ""}${t === "integer" ? " slotProps={{ root: { slotProps: { htmlInput: { step: 1 } } } }}" : ' slotProps={{ root: { slotProps: { htmlInput: { step: "any" } } } }}'} />`;
  if (t === "select")
    return `<field.SelectField ${nativeId}fullWidth ${props}${f.required ? " required" : ""} placeholder={t("${key}.noValue")} options={options.${f.name}} getOptionValue={option => option.id} renderOption={option => option.label} />`;
  if (t === "autocomplete")
    return `<field.AutocompleteField ${nativeId}fullWidth ${props}${f.required ? " required" : ""} options={options.${f.name}} getOptionValue={option => option.id} getOptionLabel={option => option.label} clearText={t("${key}.clearChoice")} openText={t("${key}.openChoice")} closeText={t("${key}.closeChoice")} noOptionsText={t("${key}.noOptions")} />`;
  return `<field.TextField ${nativeId}fullWidth ${props}${f.required ? " required" : ""}${t === "multiline" ? " multiline minRows={3}" : ""}${t === "date" ? ' type="date" slotProps={{ root: { slotProps: { inputLabel: { shrink: true } } } }}' : ""} />`;
}
export function displayValue(f, expr, key, choices = "options") {
  const t = fieldType(f);
  if (["integer", "number"].includes(t)) return `(${expr} === null ? t("${key}.noValue") : String(${expr}))`;
  if (t === "boolean") return `(${expr} ? t("${key}.yes") : t("${key}.no"))`;
  if (["select", "autocomplete"].includes(t))
    return `(${choices}.${f.name}.find(option => option.id === ${expr})?.label ?? ${expr} ?? t("${key}.noValue"))`;
  return `(${expr} === null || ${expr} === "" ? t("${key}.noValue") : String(${expr}))`;
}
export const fieldTranslations = {
  en: {
    integer: "Enter a whole number.",
    date: "Enter a valid calendar date.",
    choice: "Choose an available option.",
    requiredChoice: "Choose an available option.",
    clearChoice: "Clear selection",
    openChoice: "Show options",
    closeChoice: "Hide options",
    noOptions: "No options",
    yes: "Yes",
    no: "No",
    noValue: "Not provided",
  },
  hr: {
    integer: "Unesite cijeli broj.",
    date: "Unesite valjani kalendarski datum.",
    choice: "Odaberite dostupnu mogućnost.",
    requiredChoice: "Odaberite dostupnu mogućnost.",
    clearChoice: "Očisti odabir",
    openChoice: "Prikaži mogućnosti",
    closeChoice: "Sakrij mogućnosti",
    noOptions: "Nema mogućnosti",
    yes: "Da",
    no: "Ne",
    noValue: "Nije navedeno",
  },
};

/** Emitted contract checks cover actual scalar semantics, including zero and false. */
export function richAssertions(c, valid = "accepted") {
  return c.fields
    .map(f => {
      const path = `${valid}.${f.name}`,
        set = value => `{ ...${valid}, ${f.name}: ${value} }`;
      const t = fieldType(f);
      if (["number", "integer"].includes(t))
        return `expect(schema.parse(${set("0")}).${f.name}).toBe(0);
    expect(schema.safeParse(${set("null")}).success).toBe(${!f.required});
    expect(schema.safeParse(${set("Number.NaN")}).success).toBe(false);
    ${t === "integer" ? `expect(schema.safeParse(${set("1.5")}).success).toBe(false);` : ""}`;
      if (t === "boolean") return `expect(schema.parse(${set("false")}).${f.name}).toBe(false);`;
      if (t === "date")
        return `expect(schema.safeParse(${set('"2026-02-30"')}).success).toBe(false);
    expect(schema.safeParse(${set('""')}).success).toBe(${!f.required});`;
      if (["select", "autocomplete"].includes(t))
        return `expect(schema.safeParse(${set('"missing-option"')}).success).toBe(false);
    expect(schema.safeParse(${set("null")}).success).toBe(${!f.required});`;
      return `expect(schema.parse(${set('" v "')}).${f.name}).toBe("v");
    expect(schema.safeParse(${set(`"x".repeat(${(f.maxLength ?? 500) + 1})`)}).success).toBe(false);`;
    })
    .join("\n    ");
}
