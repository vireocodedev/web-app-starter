import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { JSDOM } from "jsdom";
import {
  buildProjectHtml,
  loadReferences,
  loadSources,
  syncProjectPage,
  syncReferencePage,
} from "../scripts/project-docs.mjs";

function source(path, value) {
  const content = typeof value === "string" ? value : JSON.stringify(value);
  return {
    path,
    content,
    data: path.endsWith(".json") ? value : undefined,
    digest: createHash("sha256").update(content).digest("hex"),
  };
}

const fixture = () => [
  source(
    "docs/guide.md",
    "# Guide\n\n[Recovery](recovery.md#restore)\n\n| Step | State |\n| --- | --- |\n| Backup | Pending |\n\n```sh\nnpm run dev\n```\n\n<script>alert('unsafe')</script>",
  ),
  source(
    "docs/recovery.md",
    "# Recovery\n\n## Restore\n\nKeep the initialized dump.",
  ),
  source("docs/acceptance/initialization-acceptance.json", {
    repository: "example/consumer",
    ready: false,
    status: "partial",
    identity: { display_name: "Test <Project>" },
    phases: { intake: "passed", recovery: "pending" },
    remaining: ["Restore a retrieved backup."],
  }),
  source("docs/acceptance/upstream-acceptance.json", {
    repository: "example/template",
    ready: true,
    note: "</script><script>alert('unsafe')</script>",
  }),
];

test("renders every source offline, with deterministic output and honest consumer readiness", () => {
  const sources = fixture();
  const html = buildProjectHtml(sources);
  assert.equal(html, buildProjectHtml(sources));
  assert.equal(html, buildProjectHtml([...sources].reverse()));
  const { document } = new JSDOM(html).window;
  assert.equal(document.querySelectorAll(".record").length, sources.length);
  assert.equal(
    document.title,
    "Test <Project> · Project status & documentation",
  );
  assert.match(document.querySelector(".hero .pill").textContent, /Not ready/);
  assert.equal(document.querySelectorAll("script").length, 1);
  assert.equal(
    document.querySelectorAll("script[src],link[rel=stylesheet],iframe").length,
    0,
  );
  assert.equal(document.querySelectorAll("table tbody tr").length, 1);
  assert.equal(document.querySelector(".table-scroll").tabIndex, 0);
  assert.ok(
    [...document.querySelectorAll("pre")].every(
      (element) => element.tabIndex === 0,
    ),
  );
  assert.equal(document.querySelector("pre code").textContent, "npm run dev\n");
  assert.ok(
    document.querySelector("a[href='#source-docsrecoverymd--restore']"),
  );
  assert.ok(document.getElementById("source-docsrecoverymd--restore"));
  assert.match(html, /Historical or operator reference/);
  for (const item of sources) assert.ok(html.includes(item.digest));
  assert.notEqual(
    html,
    buildProjectHtml([
      ...sources.slice(0, -1),
      source(sources.at(-1).path, { changed: true }),
    ]),
  );
});

test("supports search, source filters, empty state, reset and filtered deep links without a server", () => {
  const { window } = new JSDOM(buildProjectHtml(fixture()), {
    runScripts: "dangerously",
    url: "file:///docs/project.html",
  });
  const { document } = window;
  const search = document.getElementById("search");
  const filter = document.getElementById("kind");
  search.value = "missing-phrase";
  search.dispatchEvent(new window.Event("input"));
  assert.equal(document.getElementById("empty").hidden, false);
  assert.equal(document.querySelectorAll(".record:not([hidden])").length, 0);
  document.getElementById("reset").click();
  assert.equal(document.querySelectorAll(".record:not([hidden])").length, 4);
  filter.value = "consumer";
  filter.dispatchEvent(new window.Event("change"));
  assert.equal(document.querySelectorAll(".record:not([hidden])").length, 1);
  window.location.hash = "#source-docsrecoverymd--restore";
  window.dispatchEvent(new window.HashChangeEvent("hashchange"));
  assert.equal(filter.value, "all");
  assert.equal(document.querySelectorAll(".record:not([hidden])").length, 4);
  assert.match(document.getElementById("results").textContent, /4 of 4/);
  window.close();
});

test("never reports ready when consumer phases are incomplete or missing", () => {
  const sources = fixture();
  sources[2].data.ready = true;
  assert.match(
    new JSDOM(buildProjectHtml(sources)).window.document.querySelector(
      ".hero .pill",
    ).textContent,
    /Not ready/,
  );
  assert.match(
    new JSDOM(buildProjectHtml([])).window.document.body.textContent,
    /No consumer phases recorded/,
  );
  sources[2].data.phases.recovery = "passed";
  assert.match(
    new JSDOM(buildProjectHtml(sources)).window.document.querySelector(
      ".hero .pill",
    ).textContent,
    /Not ready/,
  );
  sources[2].data.phases = Object.fromEntries(
    [
      "intake",
      "identity",
      "local",
      "ci",
      "environments",
      "staging",
      "production",
      "recovery",
      "handoff",
    ].map((phase) => [phase, "passed"]),
  );
  assert.match(
    new JSDOM(buildProjectHtml(sources)).window.document.querySelector(
      ".hero .pill",
    ).textContent,
    /Verified ready/,
  );
});

test("renders meaningful accessible names for tight and loose read-only checklists", () => {
  const markdown =
    "# Checklist\n\n- [ ] Confirm **App** access\n- [x] Preserve credentials\n\n## DNS\n\n- [ ] Verify DNS\n\n  Preserve matching records.\n";
  const { document } = new JSDOM(
    buildProjectHtml([source("docs/checklist.md", markdown)]),
  ).window;
  const inputs = [
    ...document.querySelectorAll(".markdown input[type=checkbox]"),
  ];
  assert.equal(inputs.length, 3);
  assert.equal(inputs[0].getAttribute("aria-label"), "Confirm App access");
  assert.equal(inputs[1].getAttribute("aria-label"), "Preserve credentials");
  assert.match(inputs[2].getAttribute("aria-label"), /Verify DNS/);
  assert.match(
    inputs[2].getAttribute("aria-label"),
    /Preserve matching records/,
  );
  assert.ok(inputs.every((input) => input.disabled));
  assert.deepEqual(
    inputs.map((input) => input.checked),
    [false, true, false],
  );
});

test("loads exactly top-level Markdown and acceptance JSON, and rejects malformed evidence", async () => {
  const root = await mkdtemp(join(tmpdir(), "project-docs-"));
  try {
    await mkdir(join(root, "docs/acceptance"), { recursive: true });
    await mkdir(join(root, "docs/nested"));
    await mkdir(join(root, ".template-initialization"), { mode: 0o700 });
    await writeFile(join(root, "docs/guide.md"), "# Guide");
    await writeFile(join(root, "docs/nested/ignored.md"), "# Nested");
    await writeFile(
      join(root, "docs/acceptance/test-acceptance.json"),
      '{"value":true}',
    );
    const privateMarker = "PRIVATE_PREPARATION_AND_OPERATOR_REFERENCES";
    await mkdir(join(root, ".agents/skills/initialization-intake/state"), {
      recursive: true,
      mode: 0o700,
    });
    await writeFile(
      join(root, ".agents/skills/initialization-intake/state/intake.json"),
      privateMarker,
      { mode: 0o600 },
    );
    await writeFile(
      join(root, ".template-initialization/preparation.md"),
      privateMarker,
      { mode: 0o600 },
    );
    await writeFile(
      join(root, ".template-initialization/readiness.md"),
      privateMarker,
      { mode: 0o600 },
    );
    await writeFile(
      join(root, ".template-initialization/preparation-session.json"),
      privateMarker,
      { mode: 0o600 },
    );
    await writeFile(
      join(root, ".template-initialization/preparation-draft.json"),
      privateMarker,
      { mode: 0o600 },
    );
    await writeFile(
      join(root, ".template-initialization/preparation-launch.html"),
      privateMarker,
      { mode: 0o600 },
    );
    assert.deepEqual(
      (await loadSources(root))
        .map((item) => item.path)
        .filter((path) => path.startsWith("docs/")),
      ["docs/acceptance/test-acceptance.json", "docs/guide.md"],
    );
    assert.equal(
      buildProjectHtml(await loadSources(root)).includes(privateMarker),
      false,
    );
    await writeFile(
      join(root, "docs/acceptance/test-acceptance.json"),
      "invalid",
    );
    await assert.rejects(loadSources(root), SyntaxError);
  } finally {
    await rm(root, { recursive: true });
  }
});

test("bundled reference freshness and anchors do not depend on consumer documents or acceptance", async () => {
  const sources = await loadReferences();
  assert.ok(
    sources.some((source) =>
      source.path.startsWith(
        ".agents/skills/initialization-intake/references/",
      ),
    ),
  );
  assert.ok(
    sources.some((source) =>
      source.path.startsWith(
        ".agents/skills/initialization-execution/references/",
      ),
    ),
  );
  const html = buildProjectHtml(sources, { reference: true });
  const { document } = new JSDOM(html).window;
  assert.match(document.body.textContent, /Bundled template reference only/);
  assert.match(document.querySelector(".hero .pill").textContent, /Not ready/);
  assert.equal(document.querySelectorAll("[data-kind=consumer]").length, 0);
  for (const link of document.querySelectorAll("a[href^='#']")) {
    assert.ok(
      document.getElementById(link.getAttribute("href").slice(1)),
      link.outerHTML,
    );
  }
  for (const link of document.querySelectorAll("a[href]")) {
    assert.match(
      link.getAttribute("href"),
      /^(#|https:|mailto:)/,
      link.outerHTML,
    );
  }
  await syncReferencePage(true);
});

test("freshness gate fails on changed, missing or edited output and regeneration repairs it", async () => {
  const root = await mkdtemp(join(tmpdir(), "project-docs-freshness-"));
  try {
    await mkdir(join(root, "docs/acceptance"), { recursive: true });
    const guide = join(root, "docs/guide.md");
    const page = join(root, "docs/project.html");
    const record = join(root, "docs/acceptance/test-acceptance.json");
    await writeFile(guide, "# Guide");
    await writeFile(record, '{"status":"pending"}');
    await assert.rejects(syncProjectPage(root, true), { code: "ENOENT" });
    await syncProjectPage(root);
    await syncProjectPage(root, true);
    for (const [path, value] of [
      [guide, "# Updated guide"],
      [record, '{"status":"passed"}'],
      [page, "<html>edited</html>"],
    ]) {
      await writeFile(path, value);
      await assert.rejects(
        syncProjectPage(root, true),
        /project.html is stale/,
      );
      await syncProjectPage(root);
      await syncProjectPage(root, true);
    }
  } finally {
    await rm(root, { recursive: true });
  }
});
