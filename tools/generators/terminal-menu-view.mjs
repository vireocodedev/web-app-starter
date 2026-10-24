import { stripVTControlCharacters, styleText } from "node:util";

const labels = {
  component: "Component",
  form: "Form",
  shell: "Shell",
  table: "Table",
  page: "Page",
  feature: "Feature",
  api: "API client",
  navigation: "Deep navigation",
  dto: "DTO",
  domain: "Domain",
  repository: "Repository",
  service: "Service",
  controller: "Controller",
};
const order = {
  frontend: ["component", "form", "shell", "navigation", "table", "page", "feature", "api"],
  backend: ["dto", "domain", "repository", "service", "controller", "feature"],
};
const groups = {
  frontend: {
    label: "Frontend",
    description: "Build React components, forms, layouts, pages and API clients.",
  },
  backend: {
    label: "Backend",
    description: "Build Spring DTOs, domains, repositories, services and read-only features.",
  },
};

export function generatorLabel(generator) {
  if (generator.recipeLabel) return generator.recipeLabel;
  const kind = generator.kind ?? generator.id.split("/")[1];
  return labels[kind] ?? kind;
}

export function menuItems(generators, group) {
  const target = generator => generator.target ?? generator.id.split("/")[0];
  if (!group)
    return Object.entries(groups).flatMap(([value, details]) => {
      const count = generators
        .filter(generator => target(generator) === value)
        .reduce((total, generator) => total + (generator.variants?.length ?? 1), 0);
      return count ? [{ value, ...details, badge: `${count} recipes` }] : [];
    });
  return generators
    .filter(generator => target(generator) === group)
    .sort((a, b) => {
      const rank = generator => {
        const index = order[group].indexOf(generator.kind ?? generator.id.split("/")[1]);
        return index < 0 ? order[group].length : index;
      };
      return rank(a) - rank(b);
    })
    .flatMap(generator =>
      (generator.variants ?? [null]).map(variant => {
        const value = variant
          ? { ...generator, variant: variant.value, recipeLabel: variant.label, acceptsFields: variant.acceptsFields }
          : generator;
        return {
          value,
          label: generatorLabel(value),
          description: variant?.purpose ?? generator.purpose,
          badge: generator.visual ? "UI" : "Code",
        };
      }),
    );
}

export function menuViewport({ columns, rows }) {
  const dimension = (value, fallback) => (Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback);
  return { columns: dimension(columns, 80), rows: dimension(rows, 24) };
}

/** Measured layout simplifies the chrome before sacrificing the selected choice. */
export function menuPresentation(generators, state, viewport, { measure, color = false }) {
  const { columns, rows } = menuViewport(viewport);
  const width = Math.max(1, Math.min(columns - 1, 88));
  const height = Math.max(1, rows - 1);
  const items = menuItems(generators, state.group);
  const active = Math.max(0, Math.min(state.active, items.length - 1));
  const selected = items[active];
  const accent = state.group === "backend" || (!state.group && selected?.value === "backend") ? "magenta" : "cyan";
  const paint = (format, text) => (color ? styleText(format, text, { validateStream: false }) : text);
  const clean = text => stripVTControlCharacters(String(text)).replace(/\s+/g, " ").trim();
  const segments = new Intl.Segmenter("en", { granularity: "grapheme" });
  function clip(text, available) {
    text = stripVTControlCharacters(String(text));
    if (measure(text) <= available) return text;
    const tail = available > 1 ? "…" : "";
    let result = "";
    for (const { segment } of segments.segment(text)) {
      if (measure(result + segment + tail) > available) break;
      result += segment;
    }
    return result + tail;
  }
  const pad = (text, available) => {
    const clipped = clip(text, available);
    return clipped + " ".repeat(Math.max(0, available - measure(clipped)));
  };
  const pair = (left, right, available) => {
    right = clip(right, Math.max(0, Math.floor(available / 2)));
    return pad(left, Math.max(0, available - measure(right) - 1)) + " " + right;
  };
  const full = width >= 40 && height >= 13;
  const compact = !full && width >= 18 && height >= 6;
  const pageSize = full || compact ? Math.max(1, Math.min(5, items.length, height - (full ? 11 : 4))) : 1;
  const start = Math.min(Math.max(0, active - Math.floor(pageSize / 2)), Math.max(0, items.length - pageSize));
  const visible = items.slice(start, start + pageSize);
  const range = `${start + 1}–${start + visible.length} of ${items.length}`;
  const trail = state.group ? `${groups[state.group].label} / Select generator` : "Choose your workspace";
  const help = `↑↓ move  ↵/Space select  Esc ${state.group ? "back" : "cancel"}`;
  const selectedStyle = [accent === "cyan" ? "bgCyan" : "bgMagenta", "black", "bold"];
  let lines;
  if (full) {
    const inside = width - 4;
    const margin = " ".repeat(Math.max(0, Math.floor((columns - 1 - width) / 2)));
    const border = (left, right) => margin + paint(accent, left + "─".repeat(width - 2) + right);
    const row = (text, format) =>
      margin + paint(accent, "│") + " " + paint(format, pad(text, inside)) + " " + paint(accent, "│");
    const detail = [""];
    for (const word of clean(selected.description).split(" ")) {
      const index = detail.length - 1;
      const next = detail[index] ? `${detail[index]} ${word}` : word;
      if (measure(next) <= inside || !detail[index]) detail[index] = next;
      else if (detail.length < 2) detail.push(word);
      else detail[1] += ` ${word}`;
    }
    while (detail.length < 2) detail.push("");
    lines = [
      border("╭", "╮"),
      row(pair("VIREO", "GENERATOR WORKSHOP", inside), "bold"),
      row(trail, accent),
      border("├", "┤"),
      ...visible.map((item, index) =>
        row(
          pair(`${start + index === active ? "❯" : " "} ${item.label}`, item.badge, inside),
          start + index === active ? selectedStyle : "white",
        ),
      ),
      border("├", "┤"),
      row(selected.label, "bold"),
      ...detail.map(line => row(line, "dim")),
      row(
        pair(range, items.length > pageSize ? "PgUp/PgDn" : state.group ? "02 / GENERATOR" : "01 / WORKSPACE", inside),
        accent,
      ),
      row(help, "dim"),
      border("╰", "╯"),
    ];
  } else if (compact) {
    lines = [
      paint([accent, "bold"], clip("VIREO / GENERATORS", width)),
      paint("dim", clip(trail, width)),
      ...visible.map((item, index) =>
        paint(
          start + index === active ? selectedStyle : "white",
          pad(`${start + index === active ? "❯" : " "} ${item.label}`, width),
        ),
      ),
      paint(accent, clip(`${range}${items.length > pageSize ? " · PgUp/PgDn" : ""}`, width)),
      paint("dim", clip(help, width)),
    ];
  } else {
    const choice = paint(selectedStyle, pad(`❯ ${selected.label}`, width));
    const position = paint(accent, clip(`${active + 1}/${items.length} ↑↓ ↵`, width));
    lines =
      height >= 3
        ? [paint("bold", clip(state.group ? groups[state.group].label : "VIREO", width)), choice, position]
        : height === 2
          ? [choice, position]
          : [choice];
  }
  return { text: lines.join("\n"), lines, pageSize, items, active, start };
}
