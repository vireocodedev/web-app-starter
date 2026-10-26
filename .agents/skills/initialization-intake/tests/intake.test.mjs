import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  chmod,
  copyFile,
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
  return { root, directory, path: join(directory, "state", "intake.json") };
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
  await assert.rejects(stat(join(f.directory, "state")), { code: "ENOENT" });
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
        ide_consent: { status: "blocked", evidence: "Awaiting user trust." },
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
    input: { expectedRevision: 4, answers: { action_scope: answer(actions) } },
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
