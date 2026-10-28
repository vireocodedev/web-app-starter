import { readFile, readdir, stat } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";

import {
  handbookArticles,
  handbookCategories,
  handbookTopics,
} from "../docs/storybook/handbook/Handbook/catalog/handbookManifest.ts";
import { englishHandbookTranslations } from "../docs/storybook/handbook/Handbook/localization/development-guide-handbook.en.ts";
import { croatianHandbookTranslations } from "../docs/storybook/handbook/Handbook/localization/development-guide-handbook.hr.ts";
import { markdownHeadingId, markdownHeadings } from "../docs/storybook/shared/documentation/markdownHeadings.ts";
import { validateRoutes } from "./development-guide-index.mjs";

const frontendRoot = resolve(import.meta.dirname, "..");
const contentRoot = resolve(frontendRoot, "docs/development-guide");
const parser = unified().use(remarkParse).use(remarkGfm);
const problems = [];
const sources = new Map();
const indexLinks = new Set();
walk(parser.parse(await readFile(resolve(contentRoot, "CATALOG.md"), "utf8")), node => {
  if (node.type === "link" || node.type === "definition") indexLinks.add(node.url);
});

function requireCondition(condition, message) {
  if (!condition) problems.push(message);
}

function unique(items, owner) {
  const seen = new Set();
  for (const item of items) {
    requireCondition(!seen.has(item.id), `${owner}: duplicated ID ${item.id}`);
    seen.add(item.id);
  }
  return seen;
}

function label(resources, key) {
  return key
    .replace(/^handbook\./, "")
    .split(".")
    .reduce((value, segment) => value?.[segment], resources);
}

function walk(node, visit) {
  visit(node);
  for (const child of node.children ?? []) walk(child, visit);
}

async function markdownFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await markdownFiles(path)));
    else if (entry.name.endsWith(".md")) files.push(path);
  }
  return files;
}

const categoryIds = unique(handbookCategories, "Categories");
const topicIds = unique(handbookTopics, "Topics");
const articleIds = unique(handbookArticles, "Articles");
unique(
  handbookCategories.map(category => ({ id: category.slug })),
  "Category paths",
);
unique(
  handbookTopics.map(topic => ({ id: `${topic.categoryId}/${topic.slug}` })),
  "Topic paths",
);
unique(
  handbookArticles.map(article => ({ id: article.contentPath })),
  "Article paths",
);
for (const category of handbookCategories) {
  requireCondition(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category.slug), `Invalid category slug: ${category.slug}`);
  requireCondition(
    handbookTopics.some(topic => topic.categoryId === category.id),
    `Empty category: ${category.id}`,
  );
}
for (const topic of handbookTopics) {
  requireCondition(categoryIds.has(topic.categoryId), `Unknown category on topic ${topic.id}`);
  requireCondition(
    handbookArticles.some(article => article.topicId === topic.id),
    `Empty topic: ${topic.id}`,
  );
}

for (const entry of [...handbookCategories, ...handbookTopics, ...handbookArticles]) {
  requireCondition(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug), `Invalid guide slug: ${entry.slug}`);
  for (const [locale, resources] of [
    ["en", englishHandbookTranslations],
    ["hr", croatianHandbookTranslations],
  ]) {
    for (const key of [entry.titleKey, entry.descriptionKey]) {
      requireCondition(
        typeof label(resources, key) === "string" && label(resources, key).trim().length > 0,
        `${locale}: missing label ${key}`,
      );
    }
  }
}

for (const article of handbookArticles) {
  requireCondition(topicIds.has(article.topicId), `Unknown topic on article ${article.id}`);
  const topic = handbookTopics.find(candidate => candidate.id === article.topicId);
  const category = handbookCategories.find(candidate => candidate.id === topic?.categoryId);
  requireCondition(
    article.contentPath === `${category?.slug}/${topic?.slug}/${article.slug}`,
    `Content path disagrees with hierarchy: ${article.id}`,
  );
  requireCondition(article.sources.length > 0, `Missing provenance: ${article.id}`);
  for (const source of article.sources) {
    requireCondition(/^[a-f0-9]{40}$/.test(source.revision), `Unpinned source revision: ${article.id}`);
    requireCondition(
      source.path &&
        !source.path.startsWith("/") &&
        !source.path.split("/").includes("..") &&
        !source.path.includes("\\"),
      `Nonportable source path: ${article.id}`,
    );
  }
  for (const relatedId of article.relatedArticleIds ?? []) {
    requireCondition(articleIds.has(relatedId), `Unknown related article ${relatedId} on ${article.id}`);
    requireCondition(relatedId !== article.id, `Self-related article: ${article.id}`);
  }
  requireCondition(
    new Set(article.relatedArticleIds ?? []).size === (article.relatedArticleIds?.length ?? 0),
    `Duplicated related article on ${article.id}`,
  );
  for (const locale of ["en", "hr"]) {
    requireCondition(
      indexLinks.has(`${locale}/${article.contentPath}.md`),
      `${locale}/${article.contentPath}: missing from the filesystem guide index`,
    );
    const path = resolve(contentRoot, locale, `${article.contentPath}.md`);
    try {
      const markdown = await readFile(path, "utf8");
      const tree = parser.parse(markdown);
      const headings = [];
      const links = [];
      walk(tree, node => {
        if (node.type === "heading" && node.depth === 1) headings.push(node);
        if (node.type === "link" || node.type === "definition") links.push(node.url);
      });
      requireCondition(headings.length === 1, `${locale}/${article.contentPath}: expected one article title`);
      requireCondition(markdownHeadings(markdown).length > 0, `${locale}/${article.contentPath}: no article sections`);
      requireCondition(
        !markdown.includes("/home/") && !markdown.includes("/Users/"),
        `${locale}/${article.contentPath}: workstation-specific path`,
      );
      for (const source of article.sources) {
        requireCondition(
          markdown.includes(`${source.project}@${source.revision}:${source.path}`),
          `${locale}/${article.contentPath}: source metadata missing from readable article: ${source.path}`,
        );
      }
      sources.set(path, { markdown, links, headings: markdownHeadings(markdown) });
    } catch (error) {
      problems.push(`${locale}/${article.contentPath}: ${error.message}`);
    }
  }
}

for (const locale of ["en", "hr"]) {
  for (const path of await markdownFiles(resolve(contentRoot, locale))) {
    requireCondition(sources.has(path), `Unregistered article: ${relative(contentRoot, path)}`);
  }
}

for (const [path, source] of sources) {
  for (const href of source.links) {
    if (/^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("/")) continue;
    const url = new URL(href, `https://development-guide.invalid${path.split(sep).join("/")}`);
    if (!href.startsWith("#") && !url.pathname.endsWith(".md")) continue;
    const destination = decodeURIComponent(url.pathname);
    let target = sources.get(destination);
    if (!target && destination.includes("/docs/architecture/")) {
      try {
        const markdown = await readFile(destination, "utf8");
        target = { headings: markdownHeadings(markdown) };
      } catch {
        /* The missing-target diagnostic below is enough. */
      }
    }
    if (destination === resolve(contentRoot, "README.md") && !url.hash) continue;
    requireCondition(Boolean(target), `${relative(contentRoot, path)}: link has no routed article: ${href}`);
    if (target && url.hash) {
      const id = decodeURIComponent(url.hash.slice(1));
      requireCondition(
        target.headings.some(heading => heading.id === id),
        `${relative(contentRoot, path)}: unknown section ${href}`,
      );
    }
  }
}

// The compact routers must keep the moved contracts reachable. Check their direct
// links, not a recursively loaded documentation graph or production source tree.
const workspaceRoot = resolve(frontendRoot, "..");
const routingDocuments = [
  "AGENTS.md",
  "frontend/AGENTS.md",
  "backend/AGENTS.md",
  "docs/agents/engineering-workflow.md",
  "docs/agents/context-loading-audit.md",
  "frontend/docs/development-guide/README.md",
  "frontend/docs/development-guide/CATALOG.md",
  "frontend/docs/storybook/README.md",
  "frontend/docs/storybook/CONTRIBUTING.md",
  "frontend/docs/architecture/en/source-map-and-ownership.md",
  "frontend/docs/architecture/hr/source-map-and-ownership.md",
];
for (const document of routingDocuments) {
  const path = resolve(workspaceRoot, document);
  try {
    const links = [];
    walk(parser.parse(await readFile(path, "utf8")), node => {
      if (node.type === "link" || node.type === "definition") links.push(node.url);
    });
    for (const href of links) {
      if (/^[a-z][a-z0-9+.-]*:/i.test(href)) continue;
      const url = new URL(href, `https://development-guide.invalid${path.split(sep).join("/")}`);
      const destination = decodeURIComponent(url.pathname);
      try {
        const target = await stat(destination);
        if (url.hash && target.isFile() && /\.(md|mdx)$/.test(destination)) {
          const markdown = await readFile(destination, "utf8");
          const ids = markdownHeadings(markdown).map(heading => heading.id);
          for (const heading of markdown.matchAll(/^#\s+(.+)$/gm)) ids.push(markdownHeadingId(heading[1]));
          requireCondition(ids.includes(decodeURIComponent(url.hash.slice(1))), `${document}: unknown section ${href}`);
        }
      } catch (error) {
        problems.push(`${document}: unavailable local link ${href}: ${error.message}`);
      }
    }
  } catch (error) {
    problems.push(`${document}: ${error.message}`);
  }
}

problems.push(...(await validateRoutes()));

if (problems.length) {
  for (const problem of problems) process.stderr.write(`${problem}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Verified ${handbookArticles.length} paired handbook articles, ${handbookTopics.length} topics, labels, provenance, local Markdown links, and route metadata integrity/coverage.\n`,
  );
}
