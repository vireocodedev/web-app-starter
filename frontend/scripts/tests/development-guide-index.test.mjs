import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test from "node:test";

import { formatOverview, formatSearch, parseArguments, scanGuide, searchGuide } from "../development-guide-index.mjs";

const roots = [
  "frontend/src/features/development-guide",
  "frontend/src/pages/development-guide",
  "frontend/docs/development-guide",
  "frontend/docs/architecture",
  "frontend/src/app/localization/translations",
];
const articlePath = "frontend/docs/development-guide/en/backend/foundation/example.md";
const source = { project: "starter", revision: "a".repeat(40), path: "backend/Example.java" };
const catalog = {
  categories: [{ id: "backend", titleKey: "handbook.categories.backend", slug: "backend" }],
  topics: [{ id: "foundation", categoryId: "backend", slug: "foundation" }],
  articles: [
    {
      id: "example",
      topicId: "foundation",
      contentPath: "backend/foundation/example",
      titleKey: "handbook.articles.example.title",
      descriptionKey: "handbook.articles.example.description",
      implementation: "reference",
      sources: [source],
      relatedArticleIds: ["other-example"],
    },
  ],
  translations: {
    categories: { backend: "Backend" },
    articles: { example: { title: "Safe writes", description: "Atomic command boundaries" } },
  },
};

async function fixture(t) {
  const root = await mkdtemp(resolve(tmpdir(), "development-guide-index-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const directory of roots) await mkdir(resolve(root, directory), { recursive: true });
  const put = async (path, text) => {
    await mkdir(dirname(resolve(root, path)), { recursive: true });
    await writeFile(resolve(root, path), text);
  };
  return { root, put, scan: () => scanGuide({ root, catalog }) };
}

test("new uncatalogued files are discovered, changed and removed without rebuilding an index", async t => {
  const { root, put, scan } = await fixture(t);
  const path = `${roots[0]}/future-capability/Example.java`;
  const first = await scan();
  await put(path, "class Example {\n  // reversible command result\n}\n");
  const added = await scan();
  assert.notEqual(first.fingerprint, added.fingerprint);
  const result = searchGuide(added, "reversible command");
  assert.equal(result.total, 1);
  assert.equal(result.matches[0].record.path, path);
  assert.equal(result.matches[0].line, 2);
  assert.match(formatOverview(added), /future-capability\/: 1 files/);
  await put(path, "class Example { /* superseded */ }\n");
  const changed = await scan();
  assert.notEqual(added.fingerprint, changed.fingerprint);
  assert.equal(searchGuide(changed, "reversible").total, 0);
  assert.equal(searchGuide(changed, "superseded").total, 1);
  await rm(resolve(root, path));
  assert.equal(searchGuide(await scan(), "superseded").total, 0);
});

test("article bodies are searchable beyond catalog metadata and preserve support and exact source references", async t => {
  const { put, scan } = await fixture(t);
  await put(articlePath, "# Safe writes\n\nCommit acknowledgment requires a durable receipt.\n");
  const result = searchGuide(await scan(), "durable receipt");
  assert.equal(result.total, 1);
  assert.equal(result.matches[0].line, 3);
  const output = formatSearch(result);
  assert.match(output, /example\.md:3/);
  assert.match(output, /\[reference recipe\]/);
  assert.ok(output.includes(`Source: starter@${source.revision}:backend/Example.java`));
  assert.match(output, /Related article IDs: other-example/);
});

test("translation owners are indexed, paired copies are deduplicated and unique Croatian content stays searchable", async t => {
  const { put, scan } = await fixture(t);
  await put(articlePath, "# Safe writes\nShared protocol\n");
  await put(articlePath.replace("/en/", "/hr/"), "# Sigurno\nShared protocol\n");
  await put("frontend/docs/architecture/hr/unique.md", "# Unique\nJedinstveni protokol\n");
  await put(`${roots[4]}/development-guide.en.ts`, 'const label = "gallery description";');
  await put(`${roots[4]}/handbook/nested/future.en.json`, '{"label":"nested label"}');
  await put(`${roots[4]}/translation.en.ts`, 'const unrelated = "outside guide";');
  const index = await scan();
  assert.equal(index.records.length, 5);
  assert.equal(searchGuide(index, "Shared protocol").total, 1);
  assert.equal(searchGuide(index, "Jedinstveni").total, 1);
  assert.equal(searchGuide(index, "gallery description").total, 1);
  assert.equal(searchGuide(index, "nested label").total, 1);
  assert.equal(searchGuide(index, "outside guide").total, 0);
});

test("binary files stay in inventory and search uses deterministic ranking with explicit truncation", async t => {
  const { put, scan } = await fixture(t);
  await put(`${roots[1]}/z.tsx`, "// needle\n");
  await put(`${roots[1]}/a.tsx`, "// needle\n");
  await put(`${roots[0]}/needle.md`, "# Needle\n");
  await put(`${roots[0]}/image.bin`, Buffer.from([0, 1, 2]));
  const index = await scan();
  const again = await scan();
  assert.equal(index.fingerprint, again.fingerprint);
  assert.match(formatOverview(index), /image\.bin: binary/);
  const result = searchGuide(index, "needle", 2);
  assert.equal(result.total, 3);
  assert.equal(result.matches[0].record.path, `${roots[0]}/needle.md`);
  assert.equal(result.matches[1].record.path, `${roots[1]}/a.tsx`);
  assert.match(formatSearch(result), /Matched 3 files; showing 2/);
  assert.match(formatSearch(result), /Results truncated/);
  assert.deepEqual(
    searchGuide(index, "needle").matches.map(match => match.record.path),
    searchGuide(again, "needle").matches.map(match => match.record.path),
  );
});

test("arguments reject invalid options instead of silently losing scope or limits", () => {
  assert.deepEqual(parseArguments([]), { mode: "overview" });
  assert.deepEqual(parseArguments(["search", "session", "csrf", "--limit", "10"]), {
    mode: "search",
    query: "session csrf",
    limit: 10,
  });
  for (const args of [
    ["unknown"],
    ["search"],
    ["search", " "],
    ["search", "x", "--unknown"],
    ["search", "x", "--limit"],
    ["search", "x", "--limit", "0"],
    ["search", "x", "--limit", "1.5"],
    ["search", "x", "--limit", "9007199254740992"],
    ["search", "x", "--limit", "1", "--limit", "2"],
  ])
    assert.throws(() => parseArguments(args));
});
