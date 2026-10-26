import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  chmod,
  copyFile,
  link,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { run } from "../scripts/intake.mjs";
import { actions, fields, prerequisites } from "../scripts/schema.mjs";

const source = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const answer = (value) => ({ status: "answered", value });
async function fixture(t, name = "example/consumer") {
  const root = await mkdtemp(join(tmpdir(), "initialization-intake-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  execFileSync("git", ["init", "--quiet", root]);
  execFileSync("git", [
    "-C",
    root,
    "remote",
    "add",
    "origin",
    `https://github.com/${name}.git`,
  ]);
  const directory = join(root, ".agents", "skills", "initialization-intake");
  await mkdir(join(directory, "scripts"), { recursive: true });
  for (const file of ["intake.mjs", "schema.mjs"])
    await copyFile(
      join(source, "scripts", file),
      join(directory, "scripts", file),
    );
  return {
    root,
    directory,
    path: join(directory, "state", "intake.json"),
  };
}
function answers(full = false) {
  const values = {
    execution_scope: full ? "full" : "local-only",
    repository: "example/consumer",
    project_slug: "inventory",
    display_name: "Inventory",
    java_base_package: "com.example.inventory",
    pwa_short_name: "Inventory",
    localization_policy: "same-name-across-locales",
    artwork_source: "retain-template",
    theme_policy: "retain",
    data_boundary: "fresh-isolated",
    preserve_resources: ["all-existing"],
    local_port_policy: "allocate-free-loopback",
    prerequisite_policy: "locked-project-dependencies-only",
    credential_store: "store:consumer-credentials",
    initial_username: "owner",
    initial_display_name: "Owner",
    initial_email: "owner@example.test",
    new_paid_resource_ceiling: 0,
    action_scope: [
      "personalize",
      "install-locked-dependencies",
      "local-verification",
      "provision-initial-accounts",
    ],
  };
  if (full)
    Object.assign(values, {
      github_account: "owner",
      allow_global_cli_switch: "no",
      authorized_maintainers: ["owner"],
      operator_profile: "profile:shared-operator",
      reuse_existing_operator: "yes",
      production_hostname: "app.example.test",
      staging_hostname: "staging.example.test",
      dns_mode: "agent-create-missing",
      deployment_port_range: [18000, 18999],
      registry_policy: "require-absent",
      backup_destination: "same-server",
      same_server_loss_acknowledged: "yes",
      backup_time: "03:00",
      backup_timezone: "Europe/Zagreb",
      backup_retention_days: 30,
      action_scope: [...actions],
    });
  return Object.fromEntries(
    Object.entries(values).map(([id, value]) => [id, answer(value)]),
  );
}
function ready(full = false) {
  return Object.fromEntries(
    Object.entries(prerequisites)
      .filter(([, p]) => full || !p.full)
      .map(([id]) => [
        id,
        {
          status: "ready",
          evidence:
            "Verified locally; protected evidence reference store:consumer-preflight.",
        },
      ]),
  );
}
async function prepare(root, full = false) {
  await run("init", { root });
  return run("save", {
    root,
    input: {
      expectedRevision: 0,
      answers: answers(full),
      prerequisites: ready(full),
    },
  });
}
async function complete(root, revision = 1) {
  return run("complete", {
    root,
    input: {
      expectedRevision: revision,
      confirmation: {
        response:
          "I confirm the displayed targets and authorize every listed setup action.",
      },
    },
  });
}

test("missing state blocks execution without creating state", async (t) => {
  const f = await fixture(t);
  assert.equal((await run("status", { root: f.root })).reason, "missing");
  await assert.rejects(
    run("require-complete", { root: f.root }),
    /Intake is not complete; run \$initialization-intake/,
  );
  await assert.rejects(stat(join(f.directory, "state")), {
    code: "ENOENT",
  });
});

test("separate CLI sessions preserve answers and selected --root controls state location", async (t) => {
  const f = await fixture(t);
  const helper = join(source, "scripts", "intake.mjs");
  const cli = (command, input) =>
    spawnSync(
      process.execPath,
      [helper, command, "--root", f.root, ...(input ? ["--input", "-"] : [])],
      {
        cwd: tmpdir(),
        input: input ? JSON.stringify(input) : undefined,
        encoding: "utf8",
      },
    );
  assert.equal(cli("init").status, 0);
  assert.equal(
    cli("save", {
      expectedRevision: 0,
      answers: { display_name: answer("Actual user answer") },
    }).status,
    0,
  );
  const resumed = JSON.parse(cli("status").stdout);
  assert.equal(resumed.revision, 1);
  assert.ok(resumed.answered.includes("display_name"));
  assert.ok(resumed.missing.includes("project_slug"));
  assert.equal(
    JSON.parse(await readFile(f.path, "utf8")).answers.display_name.value,
    "Actual user answer",
  );
  const before = await readFile(f.path, "utf8");
  await run("init", { root: f.root });
  assert.equal(await readFile(f.path, "utf8"), before);
  assert.equal((await stat(join(f.directory, "state"))).mode & 0o777, 0o700);
  assert.equal((await stat(f.path)).mode & 0o777, 0o600);
});

test("proposed defaults, unknowns and blocked prerequisites remain incomplete", async (t) => {
  const f = await fixture(t);
  await prepare(f.root);
  const report = await run("save", {
    root: f.root,
    input: {
      expectedRevision: 1,
      answers: {
        display_name: { status: "proposed", value: "Default name" },
        initial_email: { status: "unknown" },
      },
      prerequisites: {
        ide_consent: {
          status: "blocked",
          evidence: "Awaiting user trust.",
        },
      },
    },
  });
  assert.ok(report.missing.includes("display_name"));
  assert.ok(report.missing.includes("initial_email"));
  assert.deepEqual(report.blocked, ["ide_consent"]);
  await assert.rejects(run("require-complete", { root: f.root }), (error) => {
    for (const id of ["display_name", "initial_email", "ide_consent"])
      assert.ok(error.message.includes(id), id);
    assert.ok(!error.message.includes("Default name"));
    assert.ok(!error.message.includes("Awaiting user trust."));
    return true;
  });
  await assert.rejects(complete(f.root, 2), /Intake is not complete/);
});

test("full scope requires all full answers, access evidence and exact scope confirmation", async (t) => {
  const f = await fixture(t);
  await prepare(f.root, true);
  assert.equal((await run("status", { root: f.root })).complete, false);
  const result = await complete(f.root);
  assert.equal(result.complete, true);
  assert.equal(result.scope, "full");
  assert.equal(
    (await run("require-complete", { root: f.root })).digest,
    result.digest,
  );
  assert.equal(
    JSON.parse(await readFile(f.path, "utf8")).completion.confirmation.response,
    "I confirm the displayed targets and authorize every listed setup action.",
  );
  await run("save", {
    root: f.root,
    input: {
      expectedRevision: 2,
      prerequisites: { app_consent: { status: "unknown" } },
    },
  });
  await assert.rejects(
    run("require-complete", { root: f.root }),
    /Intake is not complete/,
  );
});

test("local-only completion does not authorize remote actions and edits clear completion", async (t) => {
  const f = await fixture(t);
  await prepare(f.root);
  assert.equal((await complete(f.root)).complete, true);
  const changed = await run("save", {
    root: f.root,
    input: {
      expectedRevision: 2,
      answers: { display_name: answer("Changed name") },
    },
  });
  assert.equal(changed.complete, false);
  assert.equal(JSON.parse(await readFile(f.path, "utf8")).completion, null);
  await complete(f.root, 3);
  await run("save", {
    root: f.root,
    input: {
      expectedRevision: 4,
      answers: { action_scope: answer(actions) },
    },
  });
  await assert.rejects(complete(f.root, 5), /Intake is not complete/);
});

test("invalid answers are preserved, but distinct environments, accepted risk and action bounds gate completion", async (t) => {
  const f = await fixture(t);
  await prepare(f.root, true);
  const result = await run("save", {
    root: f.root,
    input: {
      expectedRevision: 1,
      answers: {
        java_base_package: answer("com.class.invalid"),
        project_slug: answer("bad slug"),
        staging_hostname: answer("app.example.test"),
        same_server_loss_acknowledged: answer("not-required"),
        new_paid_resource_ceiling: answer(99),
      },
    },
  });
  for (const id of [
    "java_base_package",
    "project_slug",
    "staging_hostname",
    "same_server_loss_acknowledged",
    "new_paid_resource_ceiling",
  ])
    assert.ok(result.invalid.includes(id), id);
  assert.equal(
    JSON.parse(await readFile(f.path, "utf8")).answers.project_slug.value,
    "bad slug",
  );
  await assert.rejects(complete(f.root, 2), /Intake is not complete/);
});

test("conflicting revisions and active locks preserve previous answers", async (t) => {
  const f = await fixture(t);
  await prepare(f.root);
  const before = await readFile(f.path, "utf8");
  await assert.rejects(
    run("save", {
      root: f.root,
      input: {
        expectedRevision: 0,
        answers: { display_name: answer("Stale overwrite") },
      },
    }),
    /revision conflict/,
  );
  await writeFile(join(f.directory, "state", ".write-lock"), "other owner", {
    mode: 0o600,
  });
  await assert.rejects(
    run("save", { root: f.root, input: { expectedRevision: 1 } }),
    /Another intake writer/,
  );
  assert.equal(await readFile(f.path, "utf8"), before);
});

test("unknown flags, approval booleans and secret-like contents are rejected without echo", async (t) => {
  const f = await fixture(t);
  await run("init", { root: f.root });
  await assert.rejects(
    run("save", {
      root: f.root,
      input: { expectedRevision: 0, complete: true },
    }),
    /Unsupported input/,
  );
  const secret = "ghp_123456789012345678901234567890";
  const result = spawnSync(
    process.execPath,
    [
      join(source, "scripts", "intake.mjs"),
      "save",
      "--root",
      f.root,
      "--input",
      "-",
    ],
    {
      input: JSON.stringify({
        expectedRevision: 0,
        answers: { display_name: answer(secret) },
      }),
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 1);
  assert.ok(!`${result.stdout}${result.stderr}`.includes(secret));
  assert.equal(JSON.parse(await readFile(f.path, "utf8")).revision, 0);
});

test("edited completion, malformed JSON and changed repository identity fail closed", async (t) => {
  const f = await fixture(t);
  await prepare(f.root);
  await complete(f.root);
  const state = JSON.parse(await readFile(f.path, "utf8"));
  state.answers.display_name.value = "Unconfirmed manual edit";
  await writeFile(f.path, JSON.stringify(state));
  await assert.rejects(
    run("require-complete", { root: f.root }),
    /Intake is not complete/,
  );
  await writeFile(f.path, "{invalid");
  await assert.rejects(
    run("require-complete", { root: f.root }),
    /Invalid intake JSON/,
  );
  await writeFile(
    f.path,
    JSON.stringify({
      ...state,
      repository: { root: f.root, name: "other/consumer" },
    }),
  );
  await assert.rejects(
    run("require-complete", { root: f.root }),
    /different repository/,
  );
});

test("stale schema preserves answers for explicit save reconciliation and re-confirmation", async (t) => {
  const f = await fixture(t);
  await prepare(f.root);
  await complete(f.root);
  const state = JSON.parse(await readFile(f.path, "utf8"));
  state.schemaDigest = "old-schema";
  await writeFile(f.path, JSON.stringify(state));
  await assert.rejects(
    run("require-complete", { root: f.root }),
    /schema\/helpers changed/,
  );
  await run("save", { root: f.root, input: { expectedRevision: 2 } });
  assert.equal(
    JSON.parse(await readFile(f.path, "utf8")).answers.display_name.value,
    "Inventory",
  );
  await assert.rejects(
    run("require-complete", { root: f.root }),
    /Intake is not complete/,
  );
  assert.equal((await complete(f.root, 3)).complete, true);
});

test("canonical template, symlink state and public permissions are rejected", async (t) => {
  const canonical = await fixture(t, "vireocodedev/web-app-starter");
  await assert.rejects(
    run("init", { root: canonical.root }),
    /canonical template/,
  );
  const f = await fixture(t);
  await run("init", { root: f.root });
  await chmod(f.path, 0o644);
  await assert.rejects(
    run("status", { root: f.root }),
    /permissions must be private/,
  );
  await chmod(f.path, 0o600);
  const original = await readFile(f.path, "utf8");
  const outside = join(f.root, "preserved.json");
  await writeFile(outside, original, { mode: 0o600 });
  await rm(f.path);
  await symlink(outside, f.path);
  await assert.rejects(
    run("save", { root: f.root, input: { expectedRevision: 0 } }),
    /Unsafe intake path/,
  );
  assert.equal(await readFile(outside, "utf8"), original);
});

test("catalog covers all fixture answers and each prerequisite has explicit ownership", () => {
  assert.deepEqual(
    Object.keys(answers(true)).sort(),
    Object.keys(fields).sort(),
  );
  assert.ok(
    Object.values(prerequisites).every(
      (p) => typeof p.full === "boolean" && p.question,
    ),
  );
});

const dryPath = (f, session = "default") =>
  join(f.directory, "state", "dry-runs", session, "intake.json");
const dryOptions = (root, session = "default") => ({
  root,
  dryRun: true,
  session,
});
async function prepareDry(root, full = false, session = "default") {
  const options = dryOptions(root, session);
  await run("init", options);
  return run("save", {
    ...options,
    input: {
      expectedRevision: 0,
      answers: answers(full),
      prerequisites: ready(full),
    },
  });
}
const confirmation = (expectedRevision) => ({
  expectedRevision,
  confirmation: {
    response: "I confirm this hypothetical scope for rehearsal only.",
  },
});

test("dry-run missing status and execution rejection create no state, including on the canonical template", async (t) => {
  const f = await fixture(t, "vireocodedev/web-app-starter");
  const report = await run("status", { root: f.root, dryRun: true });
  assert.deepEqual(
    {
      dryRun: report.dryRun,
      session: report.session,
      complete: report.complete,
      rehearsalComplete: report.rehearsalComplete,
      reason: report.reason,
    },
    {
      dryRun: true,
      session: "default",
      complete: false,
      rehearsalComplete: false,
      reason: "missing",
    },
  );
  assert.equal(report.statePath, dryPath(f));
  await assert.rejects(
    run("require-complete", { root: f.root, dryRun: true }),
    /Dry-run intake cannot satisfy require-complete/,
  );
  await assert.rejects(stat(join(f.directory, "state")), {
    code: "ENOENT",
  });
  await assert.rejects(run("init", { root: f.root }), /canonical template/);
});

test("full dry-run uses hypothetical answers and confirmation but cannot become real completion", async (t) => {
  const f = await fixture(t, "vireocodedev/web-app-starter");
  const options = dryOptions(f.root);
  const prepared = await prepareDry(f.root, true);
  assert.deepEqual(prepared.invalid, []);
  assert.deepEqual(prepared.missing, []);
  assert.deepEqual(prepared.blocked, []);
  assert.equal(prepared.rehearsalComplete, false);
  const report = await run("complete", {
    ...options,
    input: confirmation(1),
  });
  assert.equal(report.complete, false);
  assert.equal(report.rehearsalComplete, true);
  assert.equal(report.scope, "full");
  assert.ok(report.rehearsalDigest);
  assert.equal(report.digest, undefined);
  assert.deepEqual(
    (await run("status", options)).rehearsalDigest,
    report.rehearsalDigest,
  );
  const state = JSON.parse(await readFile(dryPath(f), "utf8"));
  assert.deepEqual(state.dryRun, { session: "default" });
  assert.equal(state.repository.name, "vireocodedev/web-app-starter");
  assert.equal(state.answers.repository.value, "example/consumer");
  for (const directory of ["state", "state/dry-runs", "state/dry-runs/default"])
    assert.equal(
      (await stat(join(f.directory, directory))).mode & 0o777,
      0o700,
    );
  assert.equal((await stat(dryPath(f))).mode & 0o777, 0o600);
  await assert.rejects(stat(f.path), { code: "ENOENT" });
  await assert.rejects(stat(join(f.root, ".template-initialization")), {
    code: "ENOENT",
  });
});

test("dry-run uses the same validation, prerequisites and revision invalidation as real intake", async (t) => {
  const f = await fixture(t);
  const options = dryOptions(f.root);
  await prepareDry(f.root, true);
  await run("complete", { ...options, input: confirmation(1) });
  const changed = await run("save", {
    ...options,
    input: {
      expectedRevision: 2,
      answers: {
        repository: answer("bad repository"),
        staging_hostname: answer("app.example.test"),
        same_server_loss_acknowledged: answer("not-required"),
        action_scope: answer(["personalize"]),
        display_name: { status: "proposed", value: "Unaccepted default" },
      },
      prerequisites: { dns_access: { status: "unknown" } },
    },
  });
  assert.equal(changed.rehearsalComplete, false);
  assert.equal(changed.complete, false);
  assert.equal(JSON.parse(await readFile(dryPath(f), "utf8")).completion, null);
  for (const id of [
    "repository",
    "staging_hostname",
    "same_server_loss_acknowledged",
    "action_scope",
  ])
    assert.ok(changed.invalid.includes(id), id);
  assert.ok(changed.missing.includes("display_name"));
  assert.deepEqual(changed.blocked, ["dns_access"]);
  await assert.rejects(
    run("complete", { ...options, input: confirmation(3) }),
    /Dry-run intake is not complete/,
  );
  await assert.rejects(
    run("save", { ...options, input: { expectedRevision: 2 } }),
    /revision conflict/,
  );
  await run("save", {
    ...options,
    input: {
      expectedRevision: 3,
      answers: answers(true),
      prerequisites: ready(true),
    },
  });
  assert.equal(
    (await run("complete", { ...options, input: confirmation(4) }))
      .rehearsalComplete,
    true,
  );
});

test("dry and live progress and session locks remain independent and copied dry state cannot unlock execution", async (t) => {
  const f = await fixture(t);
  await prepare(f.root);
  await complete(f.root);
  const liveBefore = await readFile(f.path, "utf8");
  await writeFile(join(f.directory, "state", ".write-lock"), "real writer", {
    mode: 0o600,
  });
  await prepareDry(f.root, false, "first");
  await run("complete", {
    ...dryOptions(f.root, "first"),
    input: confirmation(1),
  });
  await run("init", dryOptions(f.root, "second"));
  await writeFile(
    join(f.directory, "state", "dry-runs", "first", ".write-lock"),
    "dry writer",
    { mode: 0o600 },
  );
  await assert.rejects(
    run("save", {
      ...dryOptions(f.root, "first"),
      input: { expectedRevision: 2 },
    }),
    /Another intake writer/,
  );
  assert.equal(
    (
      await run("save", {
        ...dryOptions(f.root, "second"),
        input: { expectedRevision: 0 },
      })
    ).revision,
    1,
  );
  assert.equal(await readFile(f.path, "utf8"), liveBefore);
  assert.equal(
    (await run("require-complete", { root: f.root })).complete,
    true,
  );
  await copyFile(dryPath(f, "first"), f.path);
  await assert.rejects(
    run("require-complete", { root: f.root }),
    /Dry-run intake cannot be used/,
  );
  await writeFile(f.path, liveBefore);
  await copyFile(f.path, dryPath(f, "second"));
  await assert.rejects(
    run("status", dryOptions(f.root, "second")),
    /Real intake cannot be used as dry-run/,
  );
});

test("dry sessions are bound to their selected session, host origin, worktree and installed schema", async (t) => {
  const f = await fixture(t);
  await prepareDry(f.root);
  const bytes = await readFile(dryPath(f), "utf8");
  const state = JSON.parse(bytes);
  await run("init", dryOptions(f.root, "other"));
  await copyFile(dryPath(f), dryPath(f, "other"));
  await assert.rejects(
    run("status", dryOptions(f.root, "other")),
    /session does not match/,
  );
  for (const repository of [
    { root: "/other/worktree", name: "example/consumer" },
    { root: f.root, name: "other/repository" },
  ]) {
    await writeFile(dryPath(f), JSON.stringify({ ...state, repository }));
    await assert.rejects(
      run("status", dryOptions(f.root)),
      /different repository\/worktree/,
    );
  }
  await writeFile(
    dryPath(f),
    JSON.stringify({ ...state, schemaDigest: "old" }),
  );
  await assert.rejects(
    run("status", dryOptions(f.root)),
    /schema\/helpers changed/,
  );
  await run("save", {
    ...dryOptions(f.root),
    input: { expectedRevision: 1 },
  });
  assert.equal(
    (await run("status", dryOptions(f.root))).rehearsalComplete,
    false,
  );
  assert.equal(
    JSON.parse(await readFile(dryPath(f), "utf8")).answers.display_name.value,
    "Inventory",
  );
  execFileSync("git", [
    "-C",
    f.root,
    "remote",
    "set-url",
    "origin",
    "https://github.com/changed/host.git",
  ]);
  await assert.rejects(
    run("status", dryOptions(f.root)),
    /different repository\/worktree/,
  );
});

test("dry-run CLI resumes in a separate process and admits only local read-only Git calls", async (t) => {
  const f = await fixture(t, "vireocodedev/web-app-starter");
  const bin = join(f.root, "local-only-bin");
  await mkdir(bin);
  const gitPath = execFileSync("which", ["git"], {
    encoding: "utf8",
  }).trim();
  const audit = join(f.root, "git-calls.log");
  await writeFile(
    join(bin, "git"),
    `#!/bin/sh\ncase "$*" in\n  'rev-parse --show-toplevel'|'remote get-url origin') ;;\n  *) exit 81 ;;\nesac\nprintf '%s\\n' "$*" >> "$INTAKE_GIT_AUDIT"\nexec '${gitPath.replaceAll("'", "'\\''")}' "$@"\n`,
    { mode: 0o700 },
  );
  const config = await readFile(join(f.root, ".git", "config"), "utf8");
  const sentinel = join(f.root, "preserve-existing.txt");
  await writeFile(sentinel, "existing project data");
  const cli = (command, input, extra = []) =>
    spawnSync(
      process.execPath,
      [
        join(source, "scripts", "intake.mjs"),
        command,
        "--root",
        f.root,
        "--dry-run",
        "--session",
        "rehearsal",
        ...extra,
        ...(input ? ["--input", "-"] : []),
      ],
      {
        cwd: tmpdir(),
        input: input ? JSON.stringify(input) : undefined,
        encoding: "utf8",
        env: { ...process.env, PATH: bin, INTAKE_GIT_AUDIT: audit },
      },
    );
  assert.equal(cli("init").status, 0);
  assert.equal(
    cli("save", {
      expectedRevision: 0,
      answers: { display_name: answer("Rehearsal answer") },
    }).status,
    0,
  );
  const resumed = JSON.parse(cli("status").stdout);
  assert.equal(resumed.revision, 1);
  assert.ok(resumed.answered.includes("display_name"));
  assert.equal(resumed.session, "rehearsal");
  assert.equal(resumed.complete, false);
  assert.equal(await readFile(join(f.root, ".git", "config"), "utf8"), config);
  assert.equal(await readFile(sentinel, "utf8"), "existing project data");
  assert.deepEqual(
    new Set((await readFile(audit, "utf8")).trim().split("\n")),
    new Set(["rev-parse --show-toplevel", "remote get-url origin"]),
  );
  for (const extra of [
    ["--dry-run"],
    ["--session", "other"],
    ["true"],
    ["--unknown"],
  ]) {
    const rejected = cli("status", undefined, extra);
    assert.equal(rejected.status, 1);
  }
});

test("invalid dry mode and session names fail without creating state", async (t) => {
  const f = await fixture(t);
  for (const session of [
    "../outside",
    "",
    "/absolute",
    "two/parts",
    "UPPERCASE",
    "a".repeat(65),
    "under_score",
    null,
  ])
    await assert.rejects(
      run("init", { root: f.root, dryRun: true, session }),
      /session name/,
    );
  await assert.rejects(
    run("init", { root: f.root, session: "named" }),
    /session requires --dry-run/,
  );
  await assert.rejects(
    run("init", { root: f.root, dryRun: "true" }),
    /dryRun must be a boolean/,
  );
  await assert.rejects(stat(join(f.directory, "state")), {
    code: "ENOENT",
  });
  const cli = spawnSync(
    process.execPath,
    [
      join(source, "scripts", "intake.mjs"),
      "init",
      "--root",
      f.root,
      "--session",
      "named",
    ],
    { encoding: "utf8" },
  );
  assert.equal(cli.status, 1);
  assert.match(cli.stderr, /session requires --dry-run/);
});

test("dry-run rejects unsafe ancestors, symlink leaves, hardlinks and public permissions without touching targets", async (t) => {
  for (const relative of [
    "state",
    "state/dry-runs",
    "state/dry-runs/default",
  ]) {
    const f = await fixture(t);
    const outside = await mkdtemp(join(tmpdir(), "intake-outside-"));
    t.after(() => rm(outside, { recursive: true, force: true }));
    const path = join(f.directory, relative);
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    await symlink(outside, path);
    await assert.rejects(run("init", dryOptions(f.root)), /Unsafe intake path/);
    await assert.rejects(stat(join(outside, "intake.json")), {
      code: "ENOENT",
    });
  }
  const f = await fixture(t);
  await run("init", dryOptions(f.root));
  await chmod(join(f.directory, "state", "dry-runs"), 0o755);
  await assert.rejects(
    run("status", dryOptions(f.root)),
    /permissions must be private/,
  );
  await chmod(join(f.directory, "state", "dry-runs"), 0o700);
  const outside = join(f.root, "outside.json");
  const original = await readFile(dryPath(f), "utf8");
  await writeFile(outside, original, { mode: 0o600 });
  await rm(dryPath(f));
  await symlink(outside, dryPath(f));
  await assert.rejects(
    run("save", { ...dryOptions(f.root), input: { expectedRevision: 0 } }),
    /Unsafe intake path/,
  );
  await rm(dryPath(f));
  await link(outside, dryPath(f));
  await assert.rejects(
    run("status", dryOptions(f.root)),
    /Hard-linked intake files/,
  );
  assert.equal(await readFile(outside, "utf8"), original);
});

test("dry-run retains secret redaction and requires actual confirmation text", async (t) => {
  const f = await fixture(t);
  await prepareDry(f.root);
  const secret = "ghp_123456789012345678901234567890";
  const result = spawnSync(
    process.execPath,
    [
      join(source, "scripts", "intake.mjs"),
      "save",
      "--root",
      f.root,
      "--dry-run",
      "--input",
      "-",
    ],
    {
      input: JSON.stringify({
        expectedRevision: 1,
        answers: { display_name: answer(secret) },
      }),
      encoding: "utf8",
    },
  );
  assert.equal(result.status, 1);
  assert.ok(!`${result.stdout}${result.stderr}`.includes(secret));
  assert.equal(JSON.parse(await readFile(dryPath(f), "utf8")).revision, 1);
  await assert.rejects(
    run("complete", {
      ...dryOptions(f.root),
      input: { expectedRevision: 1, confirmation: { response: "" } },
    }),
    /actual user response/,
  );
  assert.equal(
    (await run("status", dryOptions(f.root))).rehearsalComplete,
    false,
  );
});
