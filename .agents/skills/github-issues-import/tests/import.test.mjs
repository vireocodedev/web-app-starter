import test from "node:test";
import assert from "node:assert/strict";
import {
  chmod,
  cp,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  createPortablePackage,
  createApprovedConsumer,
  authorPackage,
  issueMetadata,
  writeManifest,
} from "../../specification-to-issues/tests/fixtures.mjs";
import {
  canonical,
  sha256,
  loadPackage,
  run as packageCommand,
} from "../../specification-to-issues/scripts/package.mjs";
import { importPackage, publishedBody } from "../scripts/import.mjs";
import { stateLocation, withState } from "../scripts/state.mjs";
import { FakeGitHub } from "./fake-github.mjs";

async function setup(t, metadata) {
  const fixture = await createPortablePackage(t, metadata);
  const transport = new FakeGitHub();
  const privateRoot = await mkdtemp(
    path.join(tmpdir(), "issue-import-state-test-"),
  );
  t.after(() => rm(privateRoot, { recursive: true, force: true }));
  const stateBase = path.join(privateRoot, "private-import-state");
  const options = {
    packageDir: fixture.directory,
    repository: fixture.manifest.repository,
    stateBase,
    transport,
    mode: "apply",
  };
  return { ...fixture, options, transport, stateBase };
}
async function rehash(directory, manifest) {
  const { packageDigest: _old, ...content } = manifest;
  manifest.packageDigest = sha256(canonical(content));
  await writeManifest(directory, manifest);
}

// Every network effect below uses FakeGitHub; no authenticated provider is invoked.
test("offline plan produces dependency order without provider calls or checkpoint writes", async (t) => {
  const f = await setup(t);
  const result = await importPackage({ ...f.options, mode: "plan" });
  assert.equal(result.repository, "example/consumer");
  assert.deepEqual(
    result.issues.map((item) => item.id),
    ["ISSUE-001"],
  );
  assert.deepEqual(f.transport.requests, []);
  await assert.rejects(lstat(f.stateBase), { code: "ENOENT" });
});

test("invalid package and mismatched target stop before provider calls", async (t) => {
  const f = await setup(t);
  await assert.rejects(
    importPackage({ ...f.options, repository: "another/repo" }),
    /must match/,
  );
  await writeFile(path.join(f.directory, "issues/ISSUE-001.md"), "tampered");
  await assert.rejects(importPackage(f.options));
  assert.deepEqual(f.transport.requests, []);
});

test("standalone package requires an explicit repository", async (t) => {
  const f = await setup(t);
  await assert.rejects(
    importPackage({ ...f.options, repository: undefined }),
    /standalone/,
  );
  assert.deepEqual(f.transport.requests, []);
});

test("dependency-first creation uses native database IDs; grouping is not blocking", async (t) => {
  const f = await setup(t, {
    issues: [
      issueMetadata("ISSUE-001", { kind: "epic", dependsOn: ["ISSUE-002"] }),
      issueMetadata("ISSUE-002", { parent: "ISSUE-001" }),
    ],
  });
  const result = await importPackage(f.options);
  assert.equal(result.complete, true);
  const created = f.transport.writes.filter((call) =>
    call.endpoint.endsWith("/issues"),
  );
  assert.match(created[0].payload.body, /:ISSUE-002 -->/);
  assert.match(created[1].payload.body, /:ISSUE-001 -->/);
  const child = f.transport.issues[0],
    parent = f.transport.issues[1];
  assert.equal(f.transport.parents.get(child.id), parent.id);
  assert.deepEqual(f.transport.blockers.get(parent.id), [child.id]);
  const subIssue = f.transport.writes.find((call) =>
    call.endpoint.endsWith("/sub_issues"),
  );
  assert.deepEqual(subIssue.payload, { sub_issue_id: child.id });
  const blocker = f.transport.writes.find((call) =>
    call.endpoint.endsWith("/blocked_by"),
  );
  assert.deepEqual(blocker.payload, { issue_id: child.id });
});

test("existing labels retain metadata and only missing declared labels are created", async (t) => {
  const f = await setup(t);
  f.transport.labels.push({
    name: "needs-triage",
    color: "000000",
    description: "Human metadata",
  });
  await importPackage(f.options);
  assert.equal(f.transport.labels[0].description, "Human metadata");
  assert.equal(
    f.transport.writes.filter((call) => call.endpoint.endsWith("/labels"))
      .length,
    0,
  );
});

test("complete import rerun performs zero remote writes", async (t) => {
  const f = await setup(t, {
    issues: [
      issueMetadata("ISSUE-001"),
      issueMetadata("ISSUE-002", {
        dependsOn: ["ISSUE-001"],
        parent: "ISSUE-001",
      }),
    ],
  });
  await importPackage(f.options);
  f.transport.writes = [];
  const result = await importPackage(f.options);
  assert.equal(result.complete, true);
  assert.deepEqual(f.transport.writes, []);
});

test("lost successful create response resumes from exact marker without duplicate creation", async (t) => {
  const f = await setup(t);
  f.transport.failAfter = (method, endpoint) =>
    method === "POST" && endpoint.endsWith("/issues");
  await assert.rejects(importPackage(f.options), /lost successful response/);
  assert.equal(f.transport.issues.length, 1);
  f.transport.failAfter = null;
  f.transport.writes = [];
  const result = await importPackage(f.options);
  assert.equal(result.complete, true);
  assert.equal(f.transport.issues.length, 1);
  assert.deepEqual(f.transport.writes, []);
  const state = JSON.parse(await readFile(result.statePath, "utf8"));
  assert.equal(state.operations["create:ISSUE-001"].status, "recovered");
});

test("missing marker after pending create remains uncertain and is never blindly retried", async (t) => {
  const f = await setup(t);
  f.transport.failBefore = (method, endpoint) =>
    method === "POST" && endpoint.endsWith("/issues");
  await assert.rejects(importPackage(f.options), /uncertain/);
  f.transport.failBefore = null;
  f.transport.writes = [];
  await assert.rejects(importPackage(f.options), /uncertain/);
  assert.deepEqual(f.transport.writes, []);
});

test("manual body or title drift stops before new remote writes", async (t) => {
  const f = await setup(t);
  await importPackage(f.options);
  f.transport.issues[0].body += "\nHuman note";
  f.transport.writes = [];
  await assert.rejects(importPackage(f.options), /drift/);
  assert.deepEqual(f.transport.writes, []);
});

test("duplicate stable markers stop before labels or issue creation", async (t) => {
  const f = await setup(t);
  const item = {
    ...f.manifest.issues[0],
    bodyText: await readFile(
      path.join(f.directory, "issues/ISSUE-001.md"),
      "utf8",
    ),
  };
  f.transport.seed(item.title, publishedBody(f.manifest, item));
  f.transport.seed(item.title, publishedBody(f.manifest, item));
  await assert.rejects(importPackage(f.options), /Duplicate marker/);
  assert.deepEqual(f.transport.writes, []);
});

test("closed issues are reused without lifecycle or content changes", async (t) => {
  const f = await setup(t);
  await importPackage(f.options);
  f.transport.issues[0].state = "closed";
  f.transport.writes = [];
  const result = await importPackage(f.options);
  assert.equal(result.complete, true);
  assert.equal(f.transport.issues[0].state, "closed");
  assert.deepEqual(f.transport.writes, []);
});

test("lost native relationship response is reconciled without repeated mutations", async (t) => {
  const f = await setup(t, {
    issues: [
      issueMetadata("ISSUE-001"),
      issueMetadata("ISSUE-002", { parent: "ISSUE-001" }),
    ],
  });
  f.transport.failAfter = (method, endpoint) =>
    method === "POST" && endpoint.endsWith("/sub_issues");
  await assert.rejects(importPackage(f.options), /lost successful/);
  f.transport.failAfter = null;
  f.transport.writes = [];
  const result = await importPackage(f.options);
  assert.equal(result.complete, true);
  assert.deepEqual(f.transport.writes, []);
});

test("explicit body-link mode resumes lost update response and then performs no writes", async (t) => {
  const f = await setup(t, {
    issues: [
      issueMetadata("ISSUE-001"),
      issueMetadata("ISSUE-002", {
        dependsOn: ["ISSUE-001"],
        parent: "ISSUE-001",
      }),
    ],
  });
  const options = { ...f.options, relationshipMode: "body-links" };
  let lost = false;
  f.transport.failAfter = (method) =>
    method === "PATCH" && !lost && (lost = true);
  await assert.rejects(importPackage(options), /lost successful/);
  f.transport.failAfter = null;
  const result = await importPackage(options);
  assert.equal(result.complete, true);
  assert.match(
    f.transport.issues[0].body,
    /Children: https:\/\/github.com\/example\/consumer\/issues\/2/,
  );
  assert.match(
    f.transport.issues[1].body,
    /Blocked by: https:\/\/github.com\/example\/consumer\/issues\/1/,
  );
  f.transport.writes = [];
  await importPackage(options);
  assert.deepEqual(f.transport.writes, []);
  await assert.rejects(importPackage(f.options), /relationship mode/);
});

test("changed valid package digest blocks reuse of earlier checkpoint", async (t) => {
  const f = await setup(t);
  await importPackage(f.options);
  f.manifest.issues[0].title = "Changed approved package task";
  await rehash(f.directory, f.manifest);
  f.transport.requests = [];
  await assert.rejects(importPackage(f.options), /checkpoint differs/);
  assert.deepEqual(f.transport.requests, []);
});

test("unsafe state directories and active writer locks stop before provider calls", async (t) => {
  const f = await setup(t);
  const destination = path.join(path.dirname(f.stateBase), "elsewhere");
  await mkdir(destination);
  await symlink(destination, f.stateBase);
  await assert.rejects(importPackage(f.options), /real directories/);
  assert.deepEqual(f.transport.requests, []);
  const stateBase = path.join(path.dirname(f.stateBase), "real-private");
  await withState(
    stateBase,
    f.manifest.repository,
    f.manifest.packageId,
    async () => {
      await assert.rejects(
        importPackage({ ...f.options, stateBase }),
        /locked/,
      );
    },
  );
  assert.deepEqual(f.transport.requests, []);
});

test("checkpoint permissions are private and insecure replacements are rejected", async (t) => {
  const f = await setup(t);
  const result = await importPackage(f.options);
  assert.equal((await lstat(result.statePath)).mode & 0o777, 0o600);
  assert.equal(
    (await lstat(path.dirname(result.statePath))).mode & 0o777,
    0o700,
  );
  await chmod(result.statePath, 0o644);
  f.transport.requests = [];
  await assert.rejects(importPackage(f.options), /private/);
  assert.deepEqual(f.transport.requests, []);
});

test("recorded issue removed remotely never triggers replacement creation", async (t) => {
  const f = await setup(t);
  const result = await importPackage(f.options);
  assert.equal(
    result.statePath,
    stateLocation(f.stateBase, f.manifest.repository, f.manifest.packageId),
  );
  f.transport.issues = [];
  f.transport.writes = [];
  await assert.rejects(
    importPackage(f.options),
    /missing after recorded intent/,
  );
  assert.deepEqual(f.transport.writes, []);
});

test("pagination reconciles a closed matching issue beyond the first page", async (t) => {
  const f = await setup(t);
  f.transport.labels.push(f.manifest.labels[0]);
  for (let index = 0; index < 100; index++)
    f.transport.seed(`Other ${index}`, "Unrelated human issue");
  const item = {
    ...f.manifest.issues[0],
    bodyText: await readFile(
      path.join(f.directory, "issues/ISSUE-001.md"),
      "utf8",
    ),
  };
  const existing = f.transport.seed(
    item.title,
    publishedBody(f.manifest, item),
    "closed",
  );
  const result = await importPackage(f.options);
  assert.equal(result.imported[0].number, existing.number);
  assert.deepEqual(f.transport.writes, []);
  assert.equal(
    f.transport.requests.some((call) =>
      call.endpoint.includes("state=all&per_page=100&page=2"),
    ),
    true,
  );
});

test("closed issue with a missing desired link is preserved and reported incomplete", async (t) => {
  const f = await setup(t, {
    issues: [
      issueMetadata("ISSUE-001"),
      issueMetadata("ISSUE-002", { dependsOn: ["ISSUE-001"] }),
    ],
  });
  await importPackage(f.options);
  const child = f.transport.issues[1];
  child.state = "closed";
  f.transport.blockers.delete(child.id);
  f.transport.writes = [];
  const result = await importPackage(f.options);
  assert.equal(result.complete, false);
  assert.deepEqual(result.skipped, [
    {
      id: "ISSUE-002",
      relationship: "blocker:ISSUE-001",
      reason: "closed issue preserved",
    },
  ]);
  assert.deepEqual(f.transport.writes, []);
});

test("recreated repository identity stops before issue writes", async (t) => {
  const f = await setup(t);
  await importPackage(f.options);
  f.transport.repositoryId = 999;
  f.transport.writes = [];
  await assert.rejects(importPackage(f.options), /database identity changed/);
  assert.deepEqual(f.transport.writes, []);
});

test("human removal of a successful owned relationship section is drift, never repaired silently", async (t) => {
  const f = await setup(t);
  const options = { ...f.options, relationshipMode: "body-links" };
  await importPackage(options);
  const item = {
    ...f.manifest.issues[0],
    bodyText: await readFile(
      path.join(f.directory, "issues/ISSUE-001.md"),
      "utf8",
    ),
  };
  f.transport.issues[0].body = publishedBody(f.manifest, item);
  f.transport.writes = [];
  await assert.rejects(importPackage(options), /drift/);
  assert.deepEqual(f.transport.writes, []);
});

test("mixed-case provider repository names and strict issue URLs preserve identity", async (t) => {
  const f = await setup(t);
  f.transport.repositoryId = 555;
  const realRequest = f.transport.request.bind(f.transport);
  f.transport.request = async (...args) => {
    const result = await realRequest(...args);
    if (result?.full_name) result.full_name = "Example/Consumer";
    const change = (issue) => {
      if (issue?.html_url)
        issue.html_url = issue.html_url.replace(
          "/example/consumer/",
          "/Example/Consumer/",
        );
    };
    if (Array.isArray(result)) result.forEach(change);
    else change(result);
    return result;
  };
  const result = await importPackage(f.options);
  assert.equal(result.complete, true);
  assert.match(result.imported[0].url, /Example\/Consumer/);
  f.transport.writes = [];
  await importPackage(f.options);
  assert.deepEqual(f.transport.writes, []);
});

test("standard ssh URL origins reconcile with the package target in an offline plan", async (t) => {
  const f = await setup(t);
  const root = path.join(path.dirname(f.stateBase), "consumer");
  await mkdir(root);
  execFileSync("git", ["init", "-q", root]);
  execFileSync("git", [
    "-C",
    root,
    "remote",
    "add",
    "origin",
    "ssh://git@github.com/example/consumer.git",
  ]);
  // This focused origin-parser case uses the real portable validator; approval
  // currentness is independently exercised by the packaging owner's tests.
  const result = await importPackage({
    ...f.options,
    root,
    mode: "plan",
    load: (directory) => loadPackage(directory),
  });
  assert.equal(result.repository, "example/consumer");
  assert.deepEqual(f.transport.requests, []);
});

test("malformed private state produces a value-free CLI error", async (t) => {
  const f = await setup(t);
  const sandbox = path.join(path.dirname(f.stateBase), "cli-install");
  const installed = path.join(sandbox, ".agents/skills/github-issues-import");
  const packageScripts = path.join(
    sandbox,
    ".agents/skills/specification-to-issues/scripts",
  );
  const skill = fileURLToPath(new URL("..", import.meta.url));
  await mkdir(installed, { recursive: true });
  await cp(path.join(skill, "scripts"), path.join(installed, "scripts"), {
    recursive: true,
  });
  await mkdir(packageScripts, { recursive: true });
  await cp(
    fileURLToPath(
      new URL(
        "../../specification-to-issues/scripts/package.mjs",
        import.meta.url,
      ),
    ),
    path.join(packageScripts, "package.mjs"),
  );
  const location = stateLocation(
    path.join(installed, "state"),
    f.manifest.repository,
    f.manifest.packageId,
  );
  await mkdir(path.dirname(location), { recursive: true, mode: 0o700 });
  await writeFile(location, '{"privateSentinel":"DO_NOT_ECHO_69c871",', {
    mode: 0o600,
  });
  // State parsing occurs before provider access. Install a dead fake gh as an
  // additional guard so a regression cannot reach authenticated GitHub.
  const bin = path.join(sandbox, "bin");
  await mkdir(bin);
  await writeFile(path.join(bin, "gh"), "#!/bin/sh\nexit 79\n", {
    mode: 0o700,
  });
  const result = spawnSync(
    process.execPath,
    [
      path.join(installed, "scripts/import.mjs"),
      "apply",
      "--package",
      f.directory,
      "--repo",
      f.manifest.repository,
    ],
    {
      cwd: f.directory,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${bin}${path.delimiter}${process.env.PATH}`,
      },
    },
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /checkpoint JSON is malformed/);
  assert.doesNotMatch(
    result.stderr + result.stdout,
    /DO_NOT_ECHO|privateSentinel/,
  );
});

test("malformed package JSON stays out of import errors before provider access", async (t) => {
  const script = fileURLToPath(
    new URL("../scripts/import.mjs", import.meta.url),
  );
  const sentinel = "PRIVATE_MALFORMED_CLIENT_VALUE";
  for (const selected of ["manifest.json", "source/approval.json"]) {
    const fixture = await setup(t);
    await writeFile(path.join(fixture.directory, selected), sentinel);
    await assert.rejects(
      importPackage({ ...fixture.options, mode: "plan" }),
      (error) => {
        assert.equal(error.message.includes(sentinel), false);
        assert.match(error.message, /Invalid issue-package JSON/);
        return true;
      },
    );
    assert.equal(fixture.transport.requests.length, 0);
    const bin = path.join(path.dirname(fixture.stateBase), "dead-gh");
    await mkdir(bin);
    await writeFile(path.join(bin, "gh"), "#!/bin/sh\nexit 79\n", {
      mode: 0o700,
    });
    const result = spawnSync(
      process.execPath,
      [
        script,
        "plan",
        "--repo",
        fixture.manifest.repository,
        "--package",
        fixture.directory,
      ],
      {
        cwd: fixture.directory,
        encoding: "utf8",
        env: {
          ...process.env,
          PATH: `${bin}${path.delimiter}${process.env.PATH}`,
        },
      },
    );
    assert.equal(result.status, 1);
    assert.equal(`${result.stdout}${result.stderr}`.includes(sentinel), false);
    assert.match(result.stderr, /Invalid issue-package JSON/);
  }
});

test("approved specification flows through local packaging and resumed mock import", async (t) => {
  const consumer = await createApprovedConsumer(t);
  await consumer.prepare();
  await authorPackage(consumer.output);
  await packageCommand("seal", {
    root: consumer.root,
    packageDir: consumer.output,
  });
  const transport = new FakeGitHub();
  const options = {
    packageDir: consumer.output,
    root: consumer.root,
    repository: "example/consumer",
    stateBase: path.join(
      consumer.root,
      ".agents/skills/github-issues-import/state",
    ),
    transport,
  };
  const preview = await importPackage({ ...options, mode: "plan" });
  assert.equal(preview.source.iteration, 1);
  assert.equal(preview.issues.length, 1);
  assert.deepEqual(transport.requests, []);
  const published = await importPackage({ ...options, mode: "apply" });
  assert.equal(published.complete, true);
  assert.equal(transport.issues.length, 1);
  const before = transport.writes.length;
  const resumed = await importPackage({ ...options, mode: "apply" });
  assert.equal(resumed.complete, true);
  assert.equal(transport.writes.length, before);
  assert.equal(transport.issues.length, 1);
});
