import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  chmod,
  lstat,
  mkdir,
  readFile,
  symlink,
  writeFile,
} from "node:fs/promises";
import { request as httpRequest } from "node:http";
import { join } from "node:path";
import test from "node:test";
import { renderWorkbook } from "../../scripts/preparation/model.mjs";
import { startPreparationServer } from "../../scripts/preparation/server.mjs";
import {
  executionDraft,
  schemaForTests,
  workspaceFixture,
} from "./test-support.mjs";

const hash = (data) => createHash("sha256").update(data).digest("hex");
async function request(app, route, method = "GET", data, headers = {}) {
  return fetch(new URL(route, app.url), {
    method,
    headers: {
      ...(data === undefined
        ? {}
        : { "Content-Type": "application/json", Origin: app.origin }),
      ...headers,
    },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
}
async function saveDraft(app, draft) {
  const current = await (await request(app, "api/state")).json();
  const response = await request(app, "api/draft", "PUT", {
    draft,
    revision: current.revision,
  });
  assert.equal(response.status, 200);
  return (await response.json()).revision;
}

test("the loopback capability protects private data and all runtime files are owner-only", async () => {
  const fixture = await workspaceFixture();
  const app = await startPreparationServer({ root: fixture.root });
  try {
    assert.equal(app.server.address().address, "127.0.0.1");
    assert.equal((await fetch(app.origin + "/api/state")).status, 404);
    const target = new URL("api/state", app.url);
    const forgedHostStatus = await new Promise((accept, reject) => {
      const outgoing = httpRequest(
        {
          hostname: "127.0.0.1",
          port: target.port,
          path: target.pathname,
          headers: { Host: "attacker.example" },
        },
        (response) => {
          response.resume();
          response.on("end", () => accept(response.statusCode));
        },
      );
      outgoing.once("error", reject);
      outgoing.end();
    });
    assert.equal(forgedHostStatus, 403);
    const state = await (await request(app, "api/state")).json();
    assert.equal(state.context.repository, "example/portal");
    assert.equal(state.draft.answers.approval_signed_at, "");
    assert.equal(state.workbookExists, false);
    const dir = join(fixture.root, ".template-initialization");
    assert.equal((await lstat(dir)).mode & 0o777, 0o700);
    for (const name of [
      "preparation-server.lock",
      "preparation-session.json",
      "preparation-launch.html",
    ])
      assert.equal((await lstat(join(dir, name))).mode & 0o777, 0o600);
    assert.equal(
      (await request(app, "api/state")).headers.get("cache-control"),
      "no-store",
    );
    assert.equal(
      (await request(app, "api/state")).headers.get(
        "access-control-allow-origin",
      ),
      null,
    );
    await assert.rejects(lstat(join(dir, "preparation.md")), {
      code: "ENOENT",
    });
    const reference = await request(app, "reference");
    const html = await reference.text();
    assert.match(html, /Bundled template reference only/);
    assert.match(html, /0 \/ 9/);
    assert.doesNotMatch(html, /Verified ready|belts\.vireocode/i);
    assert.match(
      reference.headers.get("content-security-policy"),
      /unsafe-inline/,
    );
  } finally {
    await app.close();
    await fixture.remove();
  }
});

test("draft save/resume is private and never overwrites the completed initialization state", async () => {
  const fixture = await workspaceFixture();
  const dir = join(fixture.root, ".template-initialization");
  await mkdir(dir, { mode: 0o700 });
  const original =
    '{"completion":{"status":"ready"},"preserved":"existing consumer evidence"}\n';
  await writeFile(join(dir, "state.json"), original, { mode: 0o600 });
  let app = await startPreparationServer({ root: fixture.root });
  try {
    const state = await (await request(app, "api/state")).json();
    assert.equal(state.context.completed, true);
    state.draft.answers.project_slug = "saved-draft";
    state.draft.step = 4;
    await saveDraft(app, state.draft);
    assert.equal(
      (await lstat(join(dir, "preparation-draft.json"))).mode & 0o777,
      0o600,
    );
    await app.close();
    app = await startPreparationServer({ root: fixture.root });
    const resumed = await (await request(app, "api/state")).json();
    assert.equal(resumed.draft.answers.project_slug, "saved-draft");
    assert.equal(resumed.draft.step, 4);
    assert.equal(await readFile(join(dir, "state.json"), "utf8"), original);
    await assert.rejects(lstat(join(dir, "preparation.md")), {
      code: "ENOENT",
    });
  } finally {
    await app.close();
    await fixture.remove();
  }
});

test("writes reject cross-origin requests, non-JSON, invalid drafts, secrets and extra operations", async () => {
  const fixture = await workspaceFixture();
  const app = await startPreparationServer({ root: fixture.root });
  try {
    const { draft, revision } = await (await request(app, "api/state")).json();
    assert.equal(
      (
        await request(
          app,
          "api/draft",
          "PUT",
          { draft, revision },
          { Origin: "https://attacker.example" },
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await request(
          app,
          "api/draft",
          "PUT",
          { draft, revision },
          { "Content-Type": "text/plain" },
        )
      ).status,
      415,
    );
    assert.equal(
      (await request(app, "api/draft", "POST", { draft, revision })).status,
      405,
    );
    assert.equal((await request(app, "api/draft", "PUT", null)).status, 400);
    draft.answers.operator_profile = "PASSWORD=" + "not-a-real-secret";
    const blocked = await request(app, "api/draft", "PUT", { draft, revision });
    assert.equal(blocked.status, 422);
    assert.doesNotMatch(await blocked.text(), /not-a-real-secret/);
    await assert.rejects(
      lstat(join(app.stateDirectory, "preparation-draft.json")),
      { code: "ENOENT" },
    );
    assert.equal((await request(app, "api/execute", "POST", {})).status, 405);
  } finally {
    await app.close();
    await fixture.remove();
  }
});

test("only an explicit reviewed save produces the exact workbook, and incomplete execution is refused", async () => {
  const fixture = await workspaceFixture();
  const app = await startPreparationServer({ root: fixture.root });
  try {
    const schema = await schemaForTests();
    const draft = executionDraft(schema);
    draft.approvals[2] = false;
    let revision = await saveDraft(app, draft);
    let response = await request(app, "api/workbook", "POST", {
      revision,
      reviewed: true,
      replaceExisting: false,
      expectedWorkbookHash: null,
    });
    assert.equal(response.status, 422);
    assert.ok((await response.json()).issues["approval-2"]);
    draft.approvals[2] = true;
    revision = await saveDraft(app, draft);
    response = await request(app, "api/workbook", "POST", {
      revision,
      reviewed: false,
      replaceExisting: false,
      expectedWorkbookHash: null,
    });
    assert.equal(response.status, 422);
    response = await request(app, "api/workbook", "POST", {
      revision,
      reviewed: true,
      replaceExisting: false,
      expectedWorkbookHash: null,
    });
    assert.equal(response.status, 200);
    const contents = await readFile(
      join(app.stateDirectory, "preparation.md"),
      "utf8",
    );
    assert.equal(contents, renderWorkbook(schema, draft));
    assert.equal(
      (await lstat(join(app.stateDirectory, "preparation.md"))).mode & 0o777,
      0o600,
    );
  } finally {
    await app.close();
    await fixture.remove();
  }
});

test("existing Markdown imports, stale revisions and uncertain external edits preserve original answers", async () => {
  const fixture = await workspaceFixture();
  const dir = join(fixture.root, ".template-initialization");
  await mkdir(dir, { mode: 0o700 });
  const schema = await schemaForTests();
  const draft = executionDraft(schema);
  const original = renderWorkbook(schema, draft);
  await writeFile(join(dir, "preparation.md"), original, { mode: 0o600 });
  const app = await startPreparationServer({ root: fixture.root });
  try {
    const imported = await (await request(app, "api/state")).json();
    assert.deepEqual(imported.draft.answers, draft.answers);
    const revision = await saveDraft(app, draft);
    assert.equal(
      (await request(app, "api/draft", "PUT", { draft, revision: null }))
        .status,
      409,
    );
    const input = {
      revision,
      reviewed: true,
      replaceExisting: false,
      expectedWorkbookHash: hash(original),
    };
    assert.equal(
      (await request(app, "api/workbook", "POST", input)).status,
      409,
    );
    await writeFile(
      join(dir, "preparation.md"),
      original + "\nExternal manual note.\n",
    );
    assert.equal(
      (
        await request(app, "api/workbook", "POST", {
          ...input,
          replaceExisting: true,
        })
      ).status,
      409,
    );
    assert.equal(
      await readFile(join(dir, "preparation.md"), "utf8"),
      original + "\nExternal manual note.\n",
    );
    input.expectedWorkbookHash = hash(original + "\nExternal manual note.\n");
    assert.equal(
      (
        await request(app, "api/workbook", "POST", {
          ...input,
          replaceExisting: true,
        })
      ).status,
      200,
    );
  } finally {
    await app.close();
    await fixture.remove();
  }
});

test("symlink/private-mode violations and a second server are rejected without following or removing them", async () => {
  const fixture = await workspaceFixture();
  const app = await startPreparationServer({ root: fixture.root });
  try {
    await assert.rejects(
      startPreparationServer({ root: fixture.root }),
      /lock already exists/,
    );
    assert.equal((await request(app, "api/state")).status, 200);
    const target = join(fixture.root, "outside.md");
    await writeFile(target, "preserve this file");
    await symlink(target, join(app.stateDirectory, "preparation.md"));
    assert.equal((await request(app, "api/state")).status, 403);
    assert.equal(await readFile(target, "utf8"), "preserve this file");
  } finally {
    await app.close();
    await fixture.remove();
  }
  const unsafe = await workspaceFixture();
  try {
    await mkdir(join(unsafe.root, ".template-initialization"), { mode: 0o700 });
    await chmod(join(unsafe.root, ".template-initialization"), 0o755);
    await assert.rejects(startPreparationServer({ root: unsafe.root }), /0700/);
  } finally {
    await unsafe.remove();
  }
});

test("corrupt draft errors do not echo contents or silently reset private work", async () => {
  const fixture = await workspaceFixture();
  const app = await startPreparationServer({ root: fixture.root });
  try {
    const content = '{"private-note": "DO_NOT_ECHO_THIS", invalid';
    const path = join(app.stateDirectory, "preparation-draft.json");
    await writeFile(path, content, { mode: 0o600 });
    const response = await request(app, "api/state");
    assert.equal(response.status, 422);
    assert.doesNotMatch(await response.text(), /DO_NOT_ECHO_THIS/);
    assert.equal(await readFile(path, "utf8"), content);
  } finally {
    await app.close();
    await fixture.remove();
  }
});

test("ignoring only the workbook cannot expose other private runtime files to Git", async () => {
  const fixture = await workspaceFixture();
  try {
    await writeFile(
      join(fixture.root, ".gitignore"),
      "/.template-initialization/preparation.md\n",
    );
    await assert.rejects(
      startPreparationServer({ root: fixture.root }),
      /Ignore the entire/,
    );
    await assert.rejects(
      lstat(join(fixture.root, ".template-initialization")),
      { code: "ENOENT" },
    );
  } finally {
    await fixture.remove();
  }
});
