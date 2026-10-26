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
import {
  completeFullInitialization,
  requireFullInitialization,
} from "../scripts/completion.mjs";
import { run as intake } from "../../initialization-intake/scripts/intake.mjs";
import {
  actions,
  prerequisites,
} from "../../initialization-intake/scripts/schema.mjs";

import { fullCompletionInput } from "./completion-fixture.mjs";

const source = resolve(dirname(fileURLToPath(import.meta.url)), "..");
async function fixture(t, scope = "full") {
  const root = await mkdtemp(join(tmpdir(), "completion-consumer-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  execFileSync("git", ["init", "--quiet", root]);
  execFileSync("git", [
    "-C",
    root,
    "remote",
    "add",
    "origin",
    "https://github.com/example/consumer.git",
  ]);
  await writeFile(join(root, "README.md"), "Fixture consumer\n");
  execFileSync("git", ["-C", root, "add", "README.md"]);
  execFileSync("git", [
    "-C",
    root,
    "-c",
    "user.name=Fixture",
    "-c",
    "user.email=fixture@example.test",
    "commit",
    "--quiet",
    "-m",
    "Initial consumer",
  ]);
  const commit = execFileSync("git", ["-C", root, "rev-parse", "HEAD"], {
    encoding: "utf8",
  }).trim();
  const scripts = join(root, ".agents/skills/initialization-intake/scripts");
  await mkdir(scripts, { recursive: true });
  for (const file of ["intake.mjs", "schema.mjs"])
    await copyFile(
      join(source, "../initialization-intake/scripts", file),
      join(scripts, file),
    );
  await intake("init", { root });
  const full = scope === "full";
  const values = {
    execution_scope: scope,
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
    credential_store: "store:consumer",
    initial_username: "owner",
    initial_display_name: "Owner",
    initial_email: "owner@example.test",
    new_paid_resource_ceiling: 0,
    action_scope: full
      ? [...actions]
      : [
          "personalize",
          "install-locked-dependencies",
          "local-verification",
          "provision-initial-accounts",
        ],
    ...(full
      ? {
          github_account: "owner",
          allow_global_cli_switch: "no",
          authorized_maintainers: ["owner"],
          operator_profile: "profile:operator",
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
        }
      : {}),
  };
  await intake("save", {
    root,
    input: {
      expectedRevision: 0,
      answers: Object.fromEntries(
        Object.entries(values).map(([id, value]) => [
          id,
          { status: "answered", value },
        ]),
      ),
      prerequisites: Object.fromEntries(
        Object.entries(prerequisites)
          .filter(([, item]) => full || !item.full)
          .map(([id]) => [
            id,
            {
              status: "ready",
              evidence: "Protected fixture observation reference.",
            },
          ]),
      ),
    },
  });
  await intake("complete", {
    root,
    input: {
      expectedRevision: 1,
      confirmation: { response: "I confirm this fixture's exact setup scope." },
    },
  });
  const input = fullCompletionInput(commit);
  return {
    root,
    input,
    acceptance: join(root, "docs/acceptance/initialization-acceptance.json"),
    marker: join(root, ".template-initialization/completion.json"),
  };
}

test("missing execution evidence stops read-only despite completed full intake", async (t) => {
  const f = await fixture(t);
  await assert.rejects(
    requireFullInitialization(f.root),
    /Full initialization is not complete/,
  );
  await assert.rejects(stat(join(f.root, ".template-initialization")), {
    code: "ENOENT",
  });
  await assert.rejects(stat(join(f.root, "docs")), { code: "ENOENT" });
});

test("local-only scope and incomplete phase evidence cannot produce full completion", async (t) => {
  const local = await fixture(t, "local-only");
  await assert.rejects(
    completeFullInitialization(local.root, local.input),
    /Full initialization is not complete/,
  );
  const full = await fixture(t);
  delete full.input.phases.ci.evidence.failingGate;
  await assert.rejects(
    completeFullInitialization(full.root, full.input),
    /Incomplete/,
  );
  await assert.rejects(stat(join(full.root, "docs")), { code: "ENOENT" });
});

test("immutable pair, initialized retrieved recovery and separate hosts are mandatory", async (t) => {
  const f = await fixture(t);
  const cases = [
    (v) => {
      v.deployments.production.frontend = `ghcr.io/example/consumer-frontend@sha256:${"d".repeat(64)}`;
    },
    (v) => {
      v.deployments.staging.backend = "ghcr.io/example/consumer-backend:latest";
    },
    (v) => {
      v.recovery.initialized = false;
    },
    (v) => {
      v.recovery.isolated = false;
    },
    (v) => {
      v.recovery.restoredSha256 = "d".repeat(64);
    },
    (v) => {
      delete v.phases.recovery.evidence.restoredData;
    },
    (v) => {
      v.deployments.production.url = v.deployments.staging.url;
    },
    (v) => {
      v.deployments.production.sourceCommit = "0".repeat(40);
    },
    (v) => {
      v.deployments.production.runUrl =
        "https://github.com/other/project/actions/runs/1";
    },
  ];
  for (const change of cases) {
    const candidate = structuredClone(f.input);
    change(candidate);
    await assert.rejects(completeFullInitialization(f.root, candidate));
  }
});

test("valid consumer completion survives new sessions, later commits and changed intake", async (t) => {
  const f = await fixture(t);
  const result = await completeFullInitialization(f.root, f.input);
  assert.equal(result.scope, "full");
  assert.equal(result.repository, "example/consumer");
  assert.equal((await stat(f.marker)).mode & 0o777, 0o600);
  assert.equal((await stat(dirname(f.marker))).mode & 0o777, 0o700);
  await writeFile(join(f.root, "SPECIFICATION.md"), "Later specification\n");
  execFileSync("git", ["-C", f.root, "add", "SPECIFICATION.md"]);
  execFileSync("git", [
    "-C",
    f.root,
    "-c",
    "user.name=Fixture",
    "-c",
    "user.email=fixture@example.test",
    "commit",
    "--quiet",
    "-m",
    "Later specification",
  ]);
  await intake("save", {
    root: f.root,
    input: {
      expectedRevision: 2,
      answers: { display_name: { status: "proposed", value: "Future name" } },
    },
  });
  assert.deepEqual(await requireFullInitialization(f.root), result);
  const cli = spawnSync(
    process.execPath,
    [
      join(source, "scripts/completion.mjs"),
      "require-complete",
      "--root",
      f.root,
    ],
    { encoding: "utf8", cwd: tmpdir() },
  );
  assert.equal(cli.status, 0, cli.stderr);
  assert.deepEqual(JSON.parse(cli.stdout), result);
  assert.ok(!cli.stdout.includes("Future name"));
});

test("malformed, tampered, copied and partial receipts fail closed", async (t) => {
  const f = await fixture(t);
  await completeFullInitialization(f.root, f.input);
  const original = await readFile(f.acceptance, "utf8");
  for (const value of [
    "{invalid",
    JSON.stringify({ ready: true }),
    original.replace("productionTimer", "editedTimer"),
  ]) {
    await writeFile(f.acceptance, value);
    await assert.rejects(
      requireFullInitialization(f.root),
      /Full initialization is not complete/,
    );
  }
  await writeFile(f.acceptance, original);
  execFileSync("git", [
    "-C",
    f.root,
    "remote",
    "set-url",
    "origin",
    "https://github.com/foreign/consumer.git",
  ]);
  await assert.rejects(requireFullInitialization(f.root), /another consumer/);
  execFileSync("git", [
    "-C",
    f.root,
    "remote",
    "set-url",
    "origin",
    "https://github.com/example/consumer.git",
  ]);
  await rm(f.marker);
  await assert.rejects(
    requireFullInitialization(f.root),
    /Full initialization is not complete/,
  );
});

test("unsafe private permissions, links and unsupported input cannot leak or replace evidence", async (t) => {
  const f = await fixture(t);
  const secret = "ghp_123456789012345678901234567890";
  f.input.phases.handoff.evidence.protectedReferences = secret;
  const cli = spawnSync(
    process.execPath,
    [
      join(source, "scripts/completion.mjs"),
      "complete",
      "--root",
      f.root,
      "--input",
      "-",
    ],
    { encoding: "utf8", input: JSON.stringify(f.input) },
  );
  assert.equal(cli.status, 1);
  assert.ok(!`${cli.stdout}${cli.stderr}`.includes(secret));
  f.input.phases.handoff.evidence.protectedReferences = "private:credentials";
  await completeFullInitialization(f.root, f.input);
  const before = await readFile(f.acceptance, "utf8");
  await assert.rejects(
    completeFullInitialization(f.root, f.input),
    /already has a receipt/,
  );
  assert.equal(await readFile(f.acceptance, "utf8"), before);
  await chmod(f.marker, 0o644);
  await assert.rejects(requireFullInitialization(f.root), /owner-only/);
  await chmod(f.marker, 0o600);
  const outside = join(f.root, "saved-marker.json");
  await copyFile(f.marker, outside);
  await rm(f.marker);
  await symlink(outside, f.marker);
  await assert.rejects(requireFullInitialization(f.root), /Unsafe/);
});

test("unavailable historical commits cannot certify a consumer", async (t) => {
  const f = await fixture(t);
  f.input.sourceCommit = "0".repeat(40);
  for (const value of Object.values(f.input.deployments))
    value.sourceCommit = f.input.sourceCommit;
  await assert.rejects(
    completeFullInitialization(f.root, f.input),
    /available commit/,
  );
});

test("historical public evidence is preserved until deliberate reconciliation", async (t) => {
  const f = await fixture(t);
  await mkdir(dirname(f.acceptance), { recursive: true });
  const legacy = JSON.stringify({
    ready: true,
    historical: "Retain original observations",
  });
  await writeFile(f.acceptance, legacy);
  await assert.rejects(
    completeFullInitialization(f.root, f.input),
    /explicit reconciliation/,
  );
  assert.equal(await readFile(f.acceptance, "utf8"), legacy);
  await assert.rejects(stat(f.marker), { code: "ENOENT" });
});
