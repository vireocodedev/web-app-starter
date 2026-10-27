import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test from "node:test";

import { formatOverview, formatSearch, parseArguments, scanGuide, searchGuide } from "../development-guide-index.mjs";

const roots = [
  "frontend/docs/storybook/handbook/Handbook",
  "frontend/docs/storybook/architecture/ArchitectureReference",
  "frontend/docs/development-guide",
  "frontend/docs/architecture",
  "frontend/docs/storybook/handbook/Handbook/localization",
  "frontend/docs/storybook",
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
  for (const directory of [...roots, "frontend/src"]) await mkdir(resolve(root, directory), { recursive: true });
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
  assert.match(formatOverview(added), /handbook\/: 1 files/);
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
  assert.equal(index.records.length, 6);
  assert.equal(searchGuide(index, "Shared protocol").total, 1);
  assert.equal(searchGuide(index, "Jedinstveni").total, 1);
  assert.equal(searchGuide(index, "gallery description").total, 1);
  assert.equal(searchGuide(index, "nested label").total, 1);
  assert.equal(searchGuide(index, "outside guide").total, 1);
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

test("Storybook tutorials and fixtures are discoverable outside the existing guide roots without executing code", async t => {
  const { put, scan } = await fixture(t);
  const files = [
    "frontend/src/app/router/stories/HeaderTabs.mdx",
    "frontend/src/app/router/stories/HeaderTabs.stories.tsx",
    "frontend/src/app/router/stories/headerTabsRoutes.ts",
    "frontend/src/app/router/stories/HeaderTabsPreview.tsx",
    "frontend/src/app/router/stories/fixtures/notes.md",
    "frontend/src/features/widgets/Widget.mdx",
    "frontend/src/features/widgets/Widget.stories.ts",
  ];
  for (const path of files) await put(path, 'throw new Error("Reading a header tab recipe must not execute it");');
  await put("frontend/.storybook/main.ts", 'throw new Error("The index must not execute Storybook configuration");');
  await put("frontend/src/features/widgets/Widget.tsx", "// ordinary production widget");
  await put("frontend/src/features/widgets/Widget.stories.js", "// unsupported loose story");
  const index = await scan();
  assert.deepEqual(
    index.records.map(record => record.path),
    files.sort(),
  );
  assert.equal(searchGuide(index, "header tab recipe").total, files.length);
  assert.match(formatOverview(index), /frontend\/src\/app\/router\/stories\/: 5 files/);
  assert.equal(searchGuide(index, "ordinary production").total, 0);
  assert.equal(searchGuide(index, "unsupported loose").total, 0);
});

test("all Storybook documentation and support files are inventoried through nested topics and shared helpers by section without evaluating modules", async t => {
  const { put, scan } = await fixture(t);
  const files = [
    "frontend/docs/storybook/README.md",
    "frontend/docs/storybook/routing/HeaderTabs/HeaderTabs.mdx",
    "frontend/docs/storybook/routing/HeaderTabs/HeaderTabs.stories.tsx",
    "frontend/docs/storybook/routing/shared/StorybookBrowserFrame.tsx",
    "frontend/docs/storybook/routing/HeaderTabs/fixtures/notes.md",
    "frontend/docs/storybook/forms/EntityForms/EntityForms.stories.ts",
    "frontend/docs/storybook/forms/EntityForms/helpers/submit.js",
    "frontend/docs/storybook/forms/EntityForms/assets/field.svg",
    "frontend/docs/storybook/feedback/README.md",
    "frontend/docs/storybook/architecture/shared/walkthrough.json",
  ];
  for (const path of files) await put(path, 'throw new Error("Inert tutorial evidence must never execute");');
  await put("frontend/.storybook/main.ts", 'throw new Error("Do not execute configuration");');
  const index = await scan();
  assert.deepEqual(
    index.records.map(record => record.path),
    files.sort(),
  );
  assert.equal(searchGuide(index, "Inert tutorial evidence").total, files.length);
  assert.ok(index.records.every(record => record.owner === "frontend/docs/storybook"));
  const overview = formatOverview(index);
  for (const [section, count] of [
    ["routing", 4],
    ["forms", 3],
    ["feedback", 1],
    ["architecture", 1],
  ]) {
    assert.ok(overview.includes(`frontend/docs/storybook/${section}/: ${count} files`));
  }
  assert.ok(overview.includes("frontend/docs/storybook/: 1 files"));
});

test("story additions, edits and removals are live while unrelated production files leave the fingerprint unchanged", async t => {
  const { root, put, scan } = await fixture(t);
  const path = "frontend/docs/storybook/forms/EntityForms/nested/recipe.ts";
  const before = await scan();
  await put(path, "// first implementation");
  const added = await scan();
  assert.notEqual(added.fingerprint, before.fingerprint);
  assert.equal(searchGuide(added, "first implementation").matches[0].record.path, path);
  await put("frontend/src/features/widgets/production.ts", "// unrelated production change");
  const again = await scan();
  assert.equal(again.fingerprint, added.fingerprint);
  assert.deepEqual(searchGuide(again, "implementation"), searchGuide(added, "implementation"));
  await put(path, "// updated implementation");
  const changed = await scan();
  assert.notEqual(changed.fingerprint, added.fingerprint);
  assert.equal(searchGuide(changed, "first implementation").total, 0);
  assert.equal(searchGuide(changed, "updated implementation").total, 1);
  await rm(resolve(root, path));
  assert.equal((await scan()).fingerprint, before.fingerprint);
});

test("overlapping story and guide discovery retains one record and the existing owner", async t => {
  const { put, scan } = await fixture(t);
  const path = `${roots[0]}/patterns/routing/stories/Nested.mdx`;
  await put(path, "# Nested routes\nOne discoverable tutorial");
  const index = await scan();
  assert.equal(index.records.length, 1);
  assert.equal(index.records[0].owner, "frontend/docs/storybook");
  assert.equal(searchGuide(index, "One discoverable tutorial").total, 1);
  assert.equal((await scan()).fingerprint, index.fingerprint);
});

test("story assets retain binary, translation deduplication and unfollowed symlink boundaries", async t => {
  const { root, put, scan } = await fixture(t);
  const directory = "frontend/docs/storybook/routing/HeaderTabs";
  await put(`${directory}/Example.en.mdx`, "# Shared tutorial\nShared protocol");
  await put(`${directory}/Example.hr.mdx`, "# Shared tutorial\nShared protocol");
  await put(`${directory}/unique.hr.mdx`, "# Unique tutorial\nJedinstveni protokol");
  await put(`${directory}/image.bin`, Buffer.from([0, 1, 2]));
  await put("outside/private.ts", "// secret outside discovery");
  await symlink(resolve(root, "outside/private.ts"), resolve(root, `${directory}/linked.ts`));
  await symlink(resolve(root, "outside"), resolve(root, `${directory}/linked-directory`), "dir");
  const index = await scan();
  assert.equal(index.records.length, 6);
  assert.equal(searchGuide(index, "Shared protocol").total, 1);
  assert.equal(searchGuide(index, "Jedinstveni protokol").total, 1);
  assert.equal(searchGuide(index, "secret outside").total, 0);
  assert.equal(index.records.find(record => record.path.endsWith("image.bin")).unavailable, "binary");
  assert.equal(index.records.find(record => record.path.endsWith("linked.ts")).unavailable, "symlink not followed");
  assert.equal(
    index.records.find(record => record.path.endsWith("linked-directory")).unavailable,
    "symlink not followed",
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
