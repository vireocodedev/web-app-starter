import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  handbookArticles,
  handbookCategories,
  handbookTopics,
} from "../src/features/development-guide/handbook/catalog/handbookManifest.ts";
import { englishHandbookTranslations } from "../src/app/localization/translations/development-guide-handbook.en.ts";

const workspaceRoot = resolve(import.meta.dirname, "../..");
const featureRoot = "frontend/src/features/development-guide";
const pageRoot = "frontend/src/pages/development-guide";
const translationRoot = "frontend/src/app/localization/translations";
const roots = [featureRoot, pageRoot, "frontend/docs/development-guide", "frontend/docs/architecture", translationRoot];
const metadata = {
  articles: handbookArticles,
  categories: handbookCategories,
  topics: handbookTopics,
  translations: englishHandbookTranslations,
};
const supportLabels = {
  starter: "installed pattern",
  reference: "reference recipe",
  mixed: "installed + reference recipe",
};
const compare = (left, right) => (left < right ? -1 : left > right ? 1 : 0);
const normalize = value =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase();
const label = (translations, key) =>
  key
    .replace(/^handbook\./, "")
    .split(".")
    .reduce((value, segment) => value?.[segment], translations) ?? key;

function includedTranslation(path) {
  const local = path.slice(translationRoot.length + 1);
  return local === "handbook" || local.startsWith("handbook/") || /^(?:development-guide|developmentGuide)/.test(local);
}

function englishCounterpart(path) {
  return path.replace("/hr/", "/en/").replace(/\.hr\./, ".en.");
}

/** Scan current bytes, including uncatalogued files; never follow links or execute guide examples. */
export async function scanGuide({ root = workspaceRoot, catalog = metadata } = {}) {
  const records = [];
  const fingerprint = createHash("sha256");
  async function visit(directory, owner) {
    for (const entry of (await readdir(resolve(root, directory), { withFileTypes: true })).sort((a, b) =>
      compare(a.name, b.name),
    )) {
      const path = `${directory}/${entry.name}`;
      if (owner === translationRoot && !includedTranslation(path)) continue;
      if (entry.isDirectory()) {
        await visit(path, owner);
        continue;
      }
      if (!entry.isFile() && !entry.isSymbolicLink()) continue;
      const bytes = entry.isSymbolicLink() ? null : await readFile(resolve(root, path));
      let text;
      if (bytes && !bytes.includes(0)) {
        try {
          text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        } catch {
          // Binary files remain visible in the inventory without producing misleading search hits.
        }
      }
      const digest = bytes ? createHash("sha256").update(bytes).digest("hex") : "symlink-not-followed";
      fingerprint.update(`${path}\0${digest}\n`);
      const article = catalog.articles.find(item =>
        ["en", "hr"].some(locale => path === `frontend/docs/development-guide/${locale}/${item.contentPath}.md`),
      );
      const lines = text?.split(/\r?\n/) ?? [];
      records.push({
        path,
        owner,
        lines,
        text,
        article,
        title: article
          ? label(catalog.translations, article.titleKey)
          : (lines.find(line => /^#\s+/.test(line))?.replace(/^#\s+/, "") ?? basename(path)),
        description: article ? label(catalog.translations, article.descriptionKey) : "",
        unavailable: entry.isSymbolicLink() ? "symlink not followed" : text === undefined ? "binary" : undefined,
      });
    }
  }
  for (const owner of roots) await visit(owner, owner);
  records.sort((a, b) => compare(a.path, b.path));
  const paths = new Set(records.map(record => record.path));
  for (const record of records) {
    const counterpart = englishCounterpart(record.path);
    record.pairedTranslation = counterpart !== record.path && paths.has(counterpart);
  }
  return { records, catalog, fingerprint: fingerprint.digest("hex") };
}

export function searchGuide(index, query, limit = 20) {
  const tokens = normalize(query).trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) throw new Error("Search requires at least one nonblank term.");
  if (!Number.isSafeInteger(limit) || limit < 1) throw new Error("--limit requires a positive safe integer.");
  const matches = index.records
    .filter(record => record.text !== undefined && !record.pairedTranslation)
    .flatMap(record => {
      const title = normalize(record.title);
      const path = normalize(record.path);
      const details = normalize(
        [
          record.description,
          record.article?.implementation,
          ...(record.article?.sources ?? []).map(source => `${source.project} ${source.revision} ${source.path}`),
        ].join(" "),
      );
      const body = normalize(record.text);
      if (!tokens.every(token => [title, path, details, body].some(field => field.includes(token)))) return [];
      const score = tokens.reduce(
        (sum, token) =>
          sum + (title.includes(token) ? 10 : 0) + (path.includes(token) ? 6 : 0) + (details.includes(token) ? 2 : 0),
        0,
      );
      let line = 0;
      let best = -1;
      for (let number = 0; number < record.lines.length; number += 1) {
        const count = tokens.filter(token => normalize(record.lines[number]).includes(token)).length;
        if (count > best && record.lines[number].trim()) {
          best = count;
          line = number;
        }
      }
      const content = record.lines[line] ?? "";
      const firstMatch = tokens.map(token => normalize(content).indexOf(token)).filter(position => position >= 0);
      const start = Math.max(0, (firstMatch.length ? Math.min(...firstMatch) : 0) - 70);
      const snippet = `${start ? "…" : ""}${content.slice(start, start + 220)}${content.length > start + 220 ? "…" : ""}`;
      return [{ record, score, line: line + 1, snippet }];
    })
    .sort((a, b) => b.score - a.score || compare(a.record.path, b.record.path));
  return { matches: matches.slice(0, limit), total: matches.length, limit, query };
}

export function formatSearch(result) {
  const lines = [
    `Search: ${result.query}`,
    `Matched ${result.total} files; showing ${result.matches.length} (limit ${result.limit}).`,
    "Scope: English and unique translations; paired Croatian copies are inventoried, not duplicated in search.",
  ];
  if (result.total > result.matches.length) lines.push("Results truncated: increase --limit or narrow the terms.");
  for (const { record, line, snippet } of result.matches) {
    lines.push(
      "",
      `${record.path}:${line} — ${record.title}${record.article ? ` [${supportLabels[record.article.implementation]}]` : " [source; inspect its owner]"}`,
      `  ${snippet.trim()}`,
    );
    if (record.description) lines.push(`  ${record.description}`);
    for (const source of record.article?.sources ?? []) {
      lines.push(`  Source: ${source.project}@${source.revision}:${source.path}`);
    }
    if (record.article?.relatedArticleIds?.length)
      lines.push(`  Related article IDs: ${record.article.relatedArticleIds.join(", ")}`);
  }
  if (!result.total)
    lines.push("No matches: broaden the terms and inspect the overview before concluding a pattern is missing.");
  return lines.join("\n");
}

export function formatOverview(index) {
  const searchable = index.records.filter(record => record.text !== undefined && !record.pairedTranslation).length;
  const lines = [
    "Live development guide index",
    `${index.records.length} files inventoried; ${searchable} searchable English/unique-translation files.`,
    `Corpus SHA-256: ${index.fingerprint}`,
    "Every invocation reads current files; no generated index or cache.",
    "Paired Croatian copies, binaries and symlinks remain inventoried; search omits duplicates and non-text files.",
    "",
    "Handbook categories and topics (metadata from the existing catalogs):",
  ];
  for (const category of index.catalog.categories) {
    const topics = index.catalog.topics.filter(topic => topic.categoryId === category.id);
    const ids = new Set(topics.map(topic => topic.id));
    const count = index.catalog.articles.filter(article => ids.has(article.topicId)).length;
    lines.push(
      `- ${label(index.catalog.translations, category.titleKey)}: ${count} articles; ${topics.map(topic => topic.slug).join(", ")}`,
    );
  }
  lines.push("", "Current filesystem owners (includes files absent from the catalogs):");
  const groups = new Map();
  for (const record of index.records) {
    const local = record.path.slice(record.owner.length + 1).split("/");
    const depth = record.owner === featureRoot || record.owner === pageRoot ? (local[0] === "patterns" ? 2 : 1) : 0;
    const group = depth && local.length > depth ? `${record.owner}/${local.slice(0, depth).join("/")}` : record.owner;
    groups.set(group, (groups.get(group) ?? 0) + 1);
  }
  for (const [group, count] of [...groups].sort(([a], [b]) => compare(a, b))) lines.push(`- ${group}/: ${count} files`);
  for (const record of index.records.filter(record => record.unavailable))
    lines.push(`- ${record.path}: ${record.unavailable}`);
  lines.push(
    "",
    "Search current text and paths: node frontend/scripts/development-guide-index.mjs search <terms...> [--limit N]",
    "Read matching documents/examples in full and inspect their current code owners before implementing.",
  );
  return lines.join("\n");
}

export function parseArguments(args) {
  if (!args.length) return { mode: "overview" };
  if (args.length === 1 && args[0] === "--help") return { mode: "help" };
  if (args[0] !== "search") throw new Error("Expected no arguments, --help, or search <terms...> [--limit N].");
  const terms = [];
  let limit = 20;
  let hasLimit = false;
  for (let position = 1; position < args.length; position += 1) {
    const argument = args[position];
    if (argument === "--limit") {
      const value = args[++position];
      if (hasLimit || !/^\d+$/.test(value ?? "") || !Number.isSafeInteger(Number(value)) || Number(value) < 1) {
        throw new Error("--limit requires one positive safe integer.");
      }
      hasLimit = true;
      limit = Number(value);
    } else if (argument.startsWith("-")) {
      throw new Error(`Unknown option: ${argument}`);
    } else {
      terms.push(argument);
    }
  }
  const query = terms.join(" ").trim();
  if (!query) throw new Error("Search requires at least one nonblank term.");
  return { mode: "search", query, limit };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.mode === "help") {
      console.log("Usage: node frontend/scripts/development-guide-index.mjs [search <terms...> [--limit N]]");
    } else {
      const index = await scanGuide();
      console.log(
        options.mode === "overview"
          ? formatOverview(index)
          : formatSearch(searchGuide(index, options.query, options.limit)),
      );
    }
  } catch (error) {
    console.error(`Development guide index: ${error.message}`);
    process.exitCode = 1;
  }
}
