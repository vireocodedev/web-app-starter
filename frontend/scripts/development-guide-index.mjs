import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  handbookArticles,
  handbookCategories,
  handbookTopics,
} from "../docs/storybook/handbook/Handbook/catalog/handbookManifest.ts";
import { englishHandbookTranslations } from "../docs/storybook/handbook/Handbook/localization/development-guide-handbook.en.ts";
import { supplementalRoutes } from "./development-guide-routes.mjs";

const workspaceRoot = resolve(import.meta.dirname, "../..");
const sourceRoot = "frontend/src";
const storybookRoot = "frontend/docs/storybook";
const roots = ["frontend/docs/development-guide", "frontend/docs/architecture", storybookRoot];
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

function englishCounterpart(path) {
  return path.replace("/hr/", "/en/").replace(/\.hr\./, ".en.");
}

/** Scan current bytes, including uncatalogued files; never follow links or execute guide examples. */
export async function scanGuide({ root = workspaceRoot, catalog = metadata } = {}) {
  const records = [];
  const seen = new Set();
  const fingerprint = createHash("sha256");
  async function addFile(path, entry, owner) {
    if (seen.has(path) || (!entry.isFile() && !entry.isSymbolicLink())) return;
    seen.add(path);
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
  async function visit(directory, owner) {
    for (const entry of (await readdir(resolve(root, directory), { withFileTypes: true })).sort((a, b) =>
      compare(a.name, b.name),
    )) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) {
        await visit(path, owner);
        continue;
      }
      await addFile(path, entry, owner);
    }
  }
  async function visitStories(directory, owner) {
    for (const entry of (await readdir(resolve(root, directory), { withFileTypes: true })).sort((a, b) =>
      compare(a.name, b.name),
    )) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) {
        await visitStories(path, owner ?? (entry.name === "stories" ? path : undefined));
      } else if (owner || /\.(?:mdx|stories\.tsx?)$/.test(entry.name)) {
        await addFile(path, entry, owner ?? directory);
      }
    }
  }
  for (const owner of roots) await visit(owner, owner);
  // Retain legacy source discovery so misplaced MDX/CSF and stories/ fixtures remain visible.
  // Read bytes only; loading Storybook configuration could execute project code.
  await visitStories(sourceRoot);
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
    const depth = record.owner === storybookRoot ? 1 : 0;
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

const routeScope = category =>
  ({
    "frontend-workflows": "frontend",
    delivery: "release",
    "agent-workflow": "agent",
    "developer-workflow": "setup",
  })[category] ?? category;
const baselineFor = scope =>
  ({
    frontend: "frontend-baseline",
    backend: "backend-baseline",
    ci: "ci",
    release: "release",
    agent: "agent",
  })[scope] ?? "workspace";
const routeRecovery =
  "Use route --list [scope] and full-text search with broader terms; inspect current owners. A routing miss is not evidence of absent guidance. If a pattern is missing, conflicts with code, or requires a departure, stop affected implementation and request Bruno's explicit approval.";

/** Supplemental concerns compose the same catalog used by the Handbook, never a second article index. */
export function createRoutes({ catalog = metadata, supplemental = supplementalRoutes } = {}) {
  const articles = catalog.articles.map(article => {
    const scope = routeScope(catalog.topics.find(topic => topic.id === article.topicId)?.categoryId);
    return {
      key: article.id,
      aliases: [],
      scope,
      kind: "contract",
      status: supportLabels[article.implementation],
      path: `frontend/docs/development-guide/en/${article.contentPath}.md`,
      counterpart: `frontend/docs/development-guide/hr/${article.contentPath}.md`,
      title: label(catalog.translations, article.titleKey),
      trigger: label(catalog.translations, article.descriptionKey),
      requires: [baselineFor(scope)],
      owners: [`topic:${article.topicId}`],
      checks: ["README.md"],
      provenance: article.sources,
      related: article.relatedArticleIds ?? [],
    };
  });
  const topics = catalog.topics.map(topic => ({
    key: `topic:${topic.id}`,
    scope: routeScope(topic.categoryId),
    kind: "group",
    trigger: `All ${topic.slug} contracts; prefer individual keys when scope is known`,
    requires: catalog.articles.filter(article => article.topicId === topic.id).map(article => article.id),
  }));
  const categories = catalog.categories.map(category => ({
    key: `category:${category.id}`,
    scope: routeScope(category.id),
    kind: "group",
    trigger: `Entire ${category.slug} category; explicit broad discovery`,
    requires: catalog.topics.filter(topic => topic.categoryId === category.id).map(topic => `topic:${topic.id}`),
  }));
  return [...supplemental, ...articles, ...topics, ...categories];
}

function routeCandidates(routes, key) {
  return routes.filter(route => route.key === key || route.aliases?.includes(key));
}

/** Explicit keys only: free text remains the existing search command's responsibility. */
export function routeGuide(keys, routes = createRoutes()) {
  if (!keys.length) throw new Error(`Route requires at least one explicit concern key. ${routeRecovery}`);
  const selected = new Map();
  const visiting = new Set();
  const reasons = new Map();
  const visit = (key, reason) => {
    const matches = routeCandidates(routes, key);
    if (matches.length !== 1) {
      throw new Error(
        `${matches.length ? "Ambiguous" : "Unknown"} route key: ${key}${matches.length ? `; choose ${matches.map(route => route.key).join(", ")}` : ""}. ${routeRecovery}`,
      );
    }
    const route = matches[0];
    if (!reasons.has(route.key)) reasons.set(route.key, new Set());
    reasons.get(route.key).add(reason);
    if (visiting.has(route.key)) throw new Error(`Route dependency cycle at ${route.key}. ${routeRecovery}`);
    if (selected.has(route.key)) return;
    visiting.add(route.key);
    for (const dependency of route.requires ?? []) visit(dependency, `prerequisite of ${route.key}`);
    visiting.delete(route.key);
    selected.set(route.key, route);
  };
  for (const key of keys) visit(key, "requested");
  return { keys, routes: [...selected.values()], reasons };
}

export function listRoutes(scope, routes = createRoutes()) {
  const selected = scope
    ? routes.filter(route => route.scope === scope || route.key === scope || route.key.startsWith(`${scope}:`))
    : routes;
  if (!selected.length) throw new Error(`Unknown or empty route scope: ${scope}. ${routeRecovery}`);
  return [
    `Explicit concern keys${scope ? ` (${scope})` : ""}: ${selected.length}; complete list, no truncation.`,
    "Combine keys: route <key...>. Scopes: frontend, backend, ci, release, agent, setup, quality.",
    ...selected.map(
      route =>
        `${route.key}${route.aliases?.length ? ` (${route.aliases.join(", ")})` : ""} — ${route.trigger}${route.path ? ` → ${route.path}` : ""}`,
    ),
  ].join("\n");
}

export function formatRoute(result) {
  const documents = result.routes.filter(route => route.path);
  const lines = [
    `Route: ${result.keys.join(" + ")} — ${documents.length} documents; complete prerequisite union, no truncation.`,
    "Read the selected full contracts and relevant exact examples before planning affected work. One language is sufficient.",
    "Examples are inspection pointers, not automatic broad source ingestion. Checks are guidance pointers; read-only work does not require executing suites.",
  ];
  for (const route of documents) {
    lines.push("", `${route.key}: ${route.path} [${route.kind}; ${route.status}]`, `  Trigger: ${route.trigger}`);
    if (result.reasons.get(route.key).has("requested")) lines.push("  Selected: requested");
    if (route.owners?.length) lines.push(`  Owners: ${route.owners.join(", ")}`);
    if (route.examples?.length) lines.push(`  Inspect when relevant: ${route.examples.join(", ")}`);
    if (route.checks?.length) lines.push(`  Check guidance: ${route.checks.join(", ")}`);
    if (route.requires?.length) lines.push(`  Requires: ${route.requires.join(", ")}`);
  }
  lines.push(
    "",
    "Reroute before touching newly affected owners/concerns. Explicit keys cannot classify every task or prove that all relevant guidance was selected.",
    routeRecovery,
  );
  return lines.join("\n");
}

/** Integrity proves metadata reachability/consistency, not the agent's task classification. */
export async function validateRoutes({ root = workspaceRoot, routes = createRoutes(), catalog = metadata } = {}) {
  const problems = [];
  const keys = new Map();
  const paths = new Map();
  const validKey = /^[a-z0-9]+(?:[-:][a-z0-9]+)*$/;
  const scopes = new Set(["frontend", "backend", "ci", "release", "agent", "setup", "quality"]);
  const kinds = new Set(["contract", "procedure", "baseline", "tutorial", "skill", "group"]);
  const statuses = new Set([
    "installed pattern",
    "reference recipe",
    "installed + reference recipe",
    "procedure",
    "contract",
  ]);
  const checkPath = async (path, key) => {
    if (typeof path !== "string" || path.startsWith("/") || path.includes("\\") || path.split("/").includes("..")) {
      problems.push(`${key}: nonportable path ${path}`);
      return;
    }
    try {
      await stat(resolve(root, path));
    } catch {
      problems.push(`${key}: missing path ${path}`);
    }
  };
  for (const route of routes) {
    if (new Set(route.requires ?? []).size !== (route.requires ?? []).length)
      problems.push(`${route.key}: duplicate prerequisite`);
    for (const key of [route.key, ...(route.aliases ?? [])]) {
      if (!validKey.test(key)) problems.push(`Invalid route key: ${key}`);
      if (keys.has(key)) problems.push(`Route key/alias collision: ${key}`);
      keys.set(key, route);
    }
    if (!route.scope || !route.trigger) problems.push(`${route.key}: missing scope/trigger`);
    if (!scopes.has(route.scope)) problems.push(`${route.key}: invalid scope ${route.scope}`);
    if (!kinds.has(route.kind)) problems.push(`${route.key}: invalid kind ${route.kind}`);
    if (route.kind !== "group" && !statuses.has(route.status))
      problems.push(`${route.key}: invalid status ${route.status}`);
    if (route.kind !== "group" && (!route.path || !route.status))
      problems.push(`${route.key}: missing canonical path/status`);
    if (route.path) {
      if (paths.has(route.path)) problems.push(`Duplicate canonical owner: ${route.path}`);
      paths.set(route.path, route.key);
      await checkPath(route.path, route.key);
    }
    for (const path of [route.counterpart, ...(route.examples ?? []), ...(route.checks ?? [])].filter(Boolean))
      await checkPath(path, route.key);
    for (const owner of route.owners ?? []) {
      if (!owner.startsWith("topic:")) await checkPath(owner, route.key);
      else if (!catalog.topics.some(topic => owner === `topic:${topic.id}`))
        problems.push(`${route.key}: unknown topic owner ${owner}`);
    }
  }
  for (const route of routes) {
    for (const dependency of route.requires ?? []) {
      if (!keys.has(dependency)) problems.push(`${route.key}: unknown prerequisite ${dependency}`);
      else if (keys.get(dependency).key !== dependency)
        problems.push(`${route.key}: prerequisite must use canonical key ${dependency}`);
    }
    for (const related of route.related ?? [])
      if (!keys.has(related)) problems.push(`${route.key}: unknown related key ${related}`);
    try {
      routeGuide([route.key], routes);
    } catch (error) {
      problems.push(error.message);
    }
  }
  for (const article of catalog.articles) {
    const route = routes.find(candidate => candidate.key === article.id);
    if (
      route?.path !== `frontend/docs/development-guide/en/${article.contentPath}.md` ||
      route?.counterpart !== `frontend/docs/development-guide/hr/${article.contentPath}.md` ||
      route?.status !== supportLabels[article.implementation] ||
      route?.provenance !== article.sources
    )
      problems.push(`Handbook metadata drift: ${article.id}`);
  }
  for (const topic of catalog.topics) {
    const actual = routes.find(route => route.key === `topic:${topic.id}`)?.requires ?? [];
    const expected = catalog.articles.filter(article => article.topicId === topic.id).map(article => article.id);
    if (JSON.stringify(actual) !== JSON.stringify(expected)) problems.push(`Topic routing coverage drift: ${topic.id}`);
  }
  for (const category of catalog.categories) {
    const actual = routes.find(route => route.key === `category:${category.id}`)?.requires ?? [];
    const expected = catalog.topics.filter(topic => topic.categoryId === category.id).map(topic => `topic:${topic.id}`);
    if (JSON.stringify(actual) !== JSON.stringify(expected))
      problems.push(`Category routing coverage drift: ${category.id}`);
  }
  // The architecture reader's module uses Vite APIs: inspect canonical filenames,
  // never import/execute reader code just to validate the routing inventory.
  for (const entry of await readdir(resolve(root, "frontend/docs/architecture/en"), { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".md") && !paths.has(`frontend/docs/architecture/en/${entry.name}`))
      problems.push(`Unrouted architecture contract: ${entry.name}`);
  }
  async function visit(directory) {
    for (const entry of await readdir(resolve(root, directory), { withFileTypes: true })) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) await visit(path);
      else if (entry.name.endsWith(".mdx") && !paths.has(path)) problems.push(`Unrouted Storybook tutorial: ${path}`);
    }
  }
  await visit(storybookRoot);
  for (const entry of await readdir(resolve(root, "frontend/.agents/skills"), { withFileTypes: true })) {
    if (entry.isDirectory() && !paths.has(`frontend/.agents/skills/${entry.name}/SKILL.md`))
      problems.push(`Unrouted frontend skill: ${entry.name}`);
  }
  return [...new Set(problems)];
}

export function parseArguments(args) {
  if (!args.length) return { mode: "overview" };
  if (args.length === 1 && args[0] === "--help") return { mode: "help" };
  if (args[0] === "route") {
    if (
      args[1] === "--list" &&
      args.length <= 3 &&
      (args[2] === undefined || (args[2].trim() && !args[2].startsWith("-")))
    )
      return { mode: "routes", scope: args[2] };
    const keys = args.slice(1);
    if (!keys.length || keys.some(key => !key.trim() || key.startsWith("-")))
      throw new Error(`Expected route <keys...> or route --list [scope]. ${routeRecovery}`);
    return { mode: "route", keys };
  }
  if (args[0] !== "search")
    throw new Error(
      "Expected no arguments, --help, search <terms...> [--limit N], or route <keys...> / route --list [scope].",
    );
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
      console.log(
        "Usage: node frontend/scripts/development-guide-index.mjs [search <terms...> [--limit N] | route <keys...> | route --list [scope]]",
      );
    } else if (options.mode === "routes") {
      console.log(listRoutes(options.scope));
    } else if (options.mode === "route") {
      console.log(formatRoute(routeGuide(options.keys)));
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
