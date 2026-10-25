const reserved = new Set(
  `abstract arguments as assert async await boolean break byte case catch char class const constructor continue debugger default delete do double else enum eval export extends false final finally float for from function goto if implements import in instanceof int interface let long native new null of package private protected public record return short static strictfp super switch synchronized this throw throws transient true try typeof var void volatile while with yield id prototype __proto__ toString hashCode getClass clone finalize wait notify notifyAll`.split(
    /\s+/,
  ),
);

export function identifier(value, label = "identifier") {
  if (typeof value !== "string" || !/^[a-z][a-zA-Z0-9]*$/.test(value) || reserved.has(value)) {
    throw new Error(`Invalid ${label}: ${value}. Use a non-reserved lowerCamelCase identifier (id is server-owned).`);
  }
  return value;
}

export function naming(value) {
  if (typeof value !== "string" || value.length > 80 || !/^[A-Za-z][A-Za-z0-9]*(?:[-_ ][A-Za-z0-9]+)*$/.test(value)) {
    throw new Error(`Invalid name: ${value}. Use letters, digits, and single word separators; paths are not names.`);
  }
  const words = value
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[-_ ]/)
    .map(word => word.toLowerCase());
  const pascal = words.map(word => word[0].toUpperCase() + word.slice(1)).join("");
  const camel = pascal[0].toLowerCase() + pascal.slice(1);
  identifier(camel, "name");
  identifier(words.join(""), "normalized package segment");
  if ([words.join("-"), words.join("")].some(value => /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(value)))
    throw new Error(`Name is a reserved Windows device: ${value}`);
  const symbols = new Set(
    "String Integer Boolean UUID Object Class Record Entity Table Column Id Repository Service RestController HttpStatus ResponseStatusException Button Paper Stack Typography Box Alert Component ReactNode FormControlLabel Switch TextField MenuItem RgoFormGroup RgoContainerGrid RgoDesktopTable TableColumnDef TFunction Promise Error Map Set Date Math Number Array JSON".split(
      " ",
    ),
  );
  if (symbols.has(pascal)) throw new Error(`Name collides with a generated runtime/import symbol: ${pascal}`);
  return {
    pascal,
    camel,
    kebab: words.join("-"),
    java: words.join(""),
    title: words.map(word => word[0].toUpperCase() + word.slice(1)).join(" "),
  };
}

export function parseFields(value = "name", { rich = false } = {}) {
  const types = rich
    ? ["string", "integer", "boolean", "number", "multiline", "date", "select", "autocomplete"]
    : ["string", "integer", "boolean"];
  const fields = value.split(",").map(item => {
    const match = /^([a-z][a-zA-Z0-9]*)(?::([a-z]+))?(\?)?$/.exec(item);
    if (!match || !types.includes(match[2] ?? "string"))
      throw new Error(`Invalid field: ${item}. Expected name[:${types.join("|")}][?].`);
    const [, name, type = "string", optional] = match;
    identifier(name, "field");
    return {
      name,
      type,
      required: !optional,
      maxLength: type === "multiline" ? 4000 : 120,
      label: naming(name).title,
    };
  });
  if (!fields.length || fields.length > 20 || new Set(fields.map(field => field.name)).size !== fields.length) {
    throw new Error("Supply 1–20 distinct fields.");
  }
  const columns = fields.map(field =>
    field.name
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      .replace(/([A-Z])([A-Z][a-z])/g, "$1_$2")
      .toLowerCase(),
  );
  const sqlKeywords = new Set(
    "all analyse analyze and any array asc asymmetric authorization binary both check collate collation column concurrently constraint create cross current_catalog current_date current_role current_schema current_time current_timestamp current_user deferrable desc distinct except fetch foreign freeze grant group having ilike initially inner intersect into is isnull join lateral leading left like limit localtime localtimestamp natural not notnull nulls offset on only or order outer overlaps placing primary references right select session_user similar some symmetric system_user table tablesample then to trailing union unique user using variadic verbose when where window".split(
      " ",
    ),
  );
  if (columns.some(column => column.length > 63 || sqlKeywords.has(column)) || new Set(columns).size !== columns.length)
    throw new Error("Fields must map to distinct non-reserved PostgreSQL identifiers of at most 63 characters.");
  return fields;
}
