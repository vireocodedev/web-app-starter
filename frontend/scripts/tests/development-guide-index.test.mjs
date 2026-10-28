import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test from "node:test";

import {
  createRoutes,
  formatOverview,
  formatRoute,
  formatSearch,
  listRoutes,
  parseArguments,
  routeGuide,
  scanGuide,
  searchGuide,
  validateRoutes,
} from "../development-guide-index.mjs";

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

test("route arguments preserve explicit concern unions and reject unsupported limits or guesses", () => {
  assert.deepEqual(parseArguments(["route", "forms", "notifications"]), {
    mode: "route",
    keys: ["forms", "notifications"],
  });
  assert.deepEqual(parseArguments(["route", "--list"]), { mode: "routes", scope: undefined });
  assert.deepEqual(parseArguments(["route", "--list", "frontend"]), { mode: "routes", scope: "frontend" });
  for (const args of [
    ["route"],
    ["route", " "],
    ["route", "forms", "--limit", "1"],
    ["route", "--list", "frontend", "extra"],
    ["route", "--list", "--unknown"],
  ])
    assert.throws(() => parseArguments(args));
  assert.throws(
    () => routeGuide(["change a form validation rule"]),
    /Unknown route key.*broader terms.*explicit approval/,
  );
});

test("explicit routing selects minimal styling and forms without unrelated architecture or page bundles", () => {
  const style = routeGuide(["styling"]);
  assert.deepEqual(
    style.routes.map(route => route.key),
    ["frontend-baseline"],
  );
  assert.match(formatRoute(style), /exact component/);
  const forms = routeGuide(["forms"]);
  assert.ok(forms.routes.some(route => route.key === "frontend-forms-cross-field-constraints-and-reset"));
  assert.ok(
    !forms.routes.some(
      route => route.key.startsWith("architecture:") || route.key === "header-tabs" || route.key === "left-navigation",
    ),
  );
  assert.ok(forms.routes.every(route => !route.path?.includes("/hr/")));
  assert.ok(forms.routes.filter(route => route.counterpart).every(route => route.counterpart.includes("/hr/")));
  assert.ok(!formatRoute(forms).includes("/hr/"));
});

test("routine verification selection preserves minimal styling and forms routes", () => {
  const verification = "architecture:tests-mocks-stories-and-architecture-checks";
  for (const concern of ["styling", "forms"]) {
    const keys = routeGuide([concern, "verification"]).routes.map(route => route.key);
    assert.deepEqual(
      keys.filter(key => key.startsWith("architecture:")),
      [verification],
    );
    for (const unrelated of [
      "source-ownership-tutorial",
      "dependency-tutorial",
      "public-api",
      "runtime",
      "testing",
      "header-tabs",
      "left-navigation",
      "standalone",
      "navigation-chooser",
    ])
      assert.ok(!keys.includes(unrelated), `${concern}: unexpected ${unrelated}`);
    assert.equal(keys.length, concern === "styling" ? 2 : 6);
  }
});

test("draft forms include every prerequisite declared by the tutorial", () => {
  const keys = routeGuide(["draft-forms"]).routes.map(route => route.key);
  for (const required of [
    "source-ownership-tutorial",
    "dependency-tutorial",
    "public-api",
    "runtime",
    "forms",
    "confirmations",
    "authentication",
    "testing",
    "frontend-forms-entity-modes-and-validation-policy",
    "frontend-forms-cross-field-constraints-and-reset",
    "frontend-editing-pinned-values-and-revisions",
    "frontend-editing-complete-navigation-guards",
    "frontend-async-commands-committed-writes-and-observer-failures",
  ])
    assert.ok(keys.includes(required), `Missing draft-form prerequisite: ${required}`);
});

test("each page layout selects matching tutorial and skills without selecting every layout", () => {
  const layouts = ["header-tabs", "left-navigation", "standalone", "navigation-chooser"];
  for (const selected of layouts) {
    const keys = routeGuide([selected]).routes.map(route => route.key);
    assert.ok(keys.includes("route-pages"));
    for (const other of layouts.filter(key => key !== selected)) assert.ok(!keys.includes(other));
  }
  assert.ok(routeGuide(["header-tabs"]).routes.some(route => route.key === "shell-navigation"));
  const url = routeGuide(["url-state"]).routes.map(route => route.key);
  assert.ok(url.includes("architecture:state-ownership-and-signal-lifecycle"));
});

test("multi-owner CRUD concerns union recursive dependencies once with full paths/status/provenance", () => {
  const route = routeGuide(["header-tabs", "forms", "notifications", "backend-feature", "migration", "localization"]);
  const keys = route.routes.map(entry => entry.key);
  assert.equal(new Set(keys).size, keys.length);
  for (const key of [
    "route-pages",
    "shell-navigation",
    "backend",
    "endpoint",
    "backend-data-flyway-and-schema-ownership",
    "forms",
    "localization",
    "authentication",
    "runtime",
    "public-api",
    "testing",
  ])
    assert.ok(keys.includes(key), key);
  const output = formatRoute(route);
  assert.match(output, /complete prerequisite union, no truncation/);
  assert.match(output, /reference recipe/);
  assert.ok(route.routes.some(entry => entry.provenance?.length));
  assert.match(output, /frontend\/\.agents\/skills\/app-route-pages\/SKILL.md \[skill; procedure\]/);
  assert.match(output, /Reroute before touching newly affected owners/);
});

test("session routing preserves cross-cutting security and runtime/public API includes full contracts", () => {
  const session = routeGuide(["session"]).routes.map(route => route.key);
  for (const key of [
    "authentication",
    "backend",
    "backend-security-session-and-csrf-lifecycle",
    "quality-backend-real-postgres-and-http-contracts",
  ])
    assert.ok(session.includes(key));
  const runtime = routeGuide(["runtime", "public-api"]).routes.map(route => route.key);
  for (const key of [
    "architecture:dependency-boundaries-and-imports",
    "architecture:feature-anatomy-filenames-and-public-interfaces",
    "architecture:runtime-providers-and-lifetimes",
    "architecture:state-ownership-and-signal-lifecycle",
  ])
    assert.ok(runtime.includes(key));
});

test("Storybook/operations routes load their owners and preserve isolation and recovery triggers", () => {
  const storybook = formatRoute(routeGuide(["storybook"]));
  assert.match(storybook, /frontend\/docs\/storybook\/CONTRIBUTING.md/);
  assert.match(storybook, /guide-maintenance/);
  const ci = routeGuide(["ci"]);
  assert.ok(!ci.routes.some(route => route.key.startsWith("architecture:")));
  assert.match(formatRoute(ci), /shared-pool.*independent review and fresh-host validation/);
  const backup = formatRoute(routeGuide(["backup"]));
  assert.match(backup, /exact frontend\/backend artifact pair/);
  assert.match(backup, /isolated-restore-rehearsal/);
});

test("read-only routing emits check guidance without requiring suite execution; expansion unions prior concerns", () => {
  const explanation = routeGuide(["header-tabs"]);
  assert.ok(!explanation.routes.some(route => route.key === "testing" || route.key === "backend"));
  assert.match(formatRoute(explanation), /read-only work does not require executing suites/);
  const expanded = routeGuide(["header-tabs", "session"]);
  for (const route of explanation.routes) assert.ok(expanded.routes.some(candidate => candidate.key === route.key));
});

test("unknown/ambiguous keys and empty scopes fail with broaden/search/approval guidance", () => {
  assert.throws(() => routeGuide([]), /explicit concern key/);
  assert.throws(() => routeGuide(["nonexistent-concern"]), /routing miss is not evidence.*explicit approval/);
  let partialResult;
  assert.throws(() => {
    partialResult = routeGuide(["forms", "nonexistent-concern"]);
  }, /Unknown route key: nonexistent-concern.*explicit approval/);
  assert.equal(partialResult, undefined);
  assert.throws(() => listRoutes("unrecognized-scope"), /Unknown or empty route scope/);
  const ambiguous = [
    { key: "one", aliases: ["shared"] },
    { key: "two", aliases: ["shared"] },
  ];
  assert.throws(() => routeGuide(["shared"], ambiguous), /Ambiguous.*choose one, two/);
  assert.throws(
    () =>
      routeGuide(
        ["one"],
        [
          { key: "one", requires: ["two"] },
          { key: "two", requires: ["one"] },
        ],
      ),
    /dependency cycle/,
  );
});

test("route discovery covers every existing handbook topic/article and friendly frontend keys without truncation", () => {
  const routes = createRoutes();
  const frontend = listRoutes("frontend", routes);
  for (const key of [
    "styling",
    "forms",
    "header-tabs",
    "url-state",
    "state",
    "localization",
    "authentication",
    "collections",
    "settings",
    "workflows",
    "inbox",
    "testing",
  ])
    assert.ok(frontend.includes(key));
  assert.match(frontend, /complete list, no truncation/);
  const topic = routes.find(route => route.key === "topic:frontend-forms");
  assert.ok(topic.requires.length > 0);
  for (const key of topic.requires) assert.ok(routeGuide([topic.key], routes).routes.some(route => route.key === key));
});

test("supplemental routing derives handbook metadata from existing catalogs; related is advisory", () => {
  const routes = createRoutes({
    catalog,
    supplemental: [{ key: "backend-baseline", scope: "backend", trigger: "Backend" }],
  });
  const route = routeGuide(["example"], routes).routes.at(-1);
  assert.equal(route.path, articlePath);
  assert.equal(route.status, "reference recipe");
  assert.equal(route.provenance, catalog.articles[0].sources);
  assert.deepEqual(route.related, ["other-example"]);
  assert.ok(!route.requires.includes("other-example"));
});

test("route metadata integrity rejects alias collisions, cycles, missing paths and duplicate canonical owners", async () => {
  const routes = createRoutes();
  const changed = routes.map(route => ({ ...route }));
  changed[0].aliases = ["backend-baseline"];
  changed[0].requires = [changed[0].key, "missing-prerequisite"];
  changed[0].examples = ["missing/example.ts"];
  changed.push({
    key: "duplicate",
    scope: "invalid-scope",
    kind: "invalid-kind",
    status: "invalid-status",
    trigger: "bad owner",
    path: routes[0].path,
  });
  const problems = await validateRoutes({ routes: changed });
  for (const diagnostic of [
    "collision",
    "dependency cycle",
    "unknown prerequisite",
    "missing path missing/example.ts",
    "Duplicate canonical owner",
    "invalid scope",
    "invalid kind",
    "invalid status",
  ])
    assert.ok(
      problems.some(problem => problem.includes(diagnostic)),
      diagnostic,
    );
});
