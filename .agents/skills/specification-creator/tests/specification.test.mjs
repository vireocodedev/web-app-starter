import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  chmod,
  cp,
  link,
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { run, topicIds } from "../scripts/specification.mjs";
import { fullCompletionReceipt } from "../../initialization-execution/tests/completion-fixture.mjs";

const packages = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
async function fixture(t, complete = true) {
  const root = await mkdtemp(join(tmpdir(), "specification-creator-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const name of [
    "initialization-intake",
    "initialization-execution",
    "specification-creator",
  ]) {
    const destination = join(root, ".agents/skills", name);
    await mkdir(destination, { recursive: true });
    await cp(join(packages, name, "scripts"), join(destination, "scripts"), {
      recursive: true,
    });
  }
  const git = (args) =>
    execFileSync("git", args, { cwd: root, stdio: "pipe" }).toString().trim();
  git(["init", "-q"]);
  git(["remote", "add", "origin", "https://github.com/example/consumer.git"]);
  git([
    "-c",
    "user.name=Fixture",
    "-c",
    "user.email=fixture@example.test",
    "commit",
    "-q",
    "--allow-empty",
    "-m",
    "Synthetic fixture",
  ]);
  const sourceCommit = git(["rev-parse", "HEAD"]);
  const receipt = fullCompletionReceipt(sourceCommit);
  if (complete) {
    await mkdir(join(root, "docs/acceptance"), { recursive: true });
    await mkdir(join(root, ".template-initialization"), { mode: 0o700 });
    await writeFile(
      join(root, "docs/acceptance/initialization-acceptance.json"),
      JSON.stringify(receipt),
    );
    await writeFile(
      join(root, ".template-initialization/completion.json"),
      JSON.stringify({
        schemaVersion: 1,
        root,
        repository: "example/consumer",
        sourceCommit,
        digest: receipt.digest,
      }),
      { mode: 0o600 },
    );
  }
  const call = (command, input) => run(command, { root, input });
  const path = join(
    root,
    ".agents/skills/specification-creator/state/interview.json",
  );
  return { root, path, call, receipt };
}
function question(topic, overrides = {}) {
  return {
    topic,
    prompt: `Synthetic question for ${topic}?`,
    dependsOn: [],
    status: "answered",
    answer: `Synthetic fixture answer for ${topic}.`,
    provenance: "user",
    sourceIds: [],
    blocking: true,
    decisionEvidence:
      "Synthetic fixture user explicitly confirmed this answer.",
    ...overrides,
  };
}
function completePatch(expectedRevision = 0) {
  return {
    expectedRevision,
    questions: Object.fromEntries(
      topicIds.map((topic) => [
        topic,
        question(topic, topic === "users" ? { dependsOn: ["problem"] } : {}),
      ]),
    ),
    topics: Object.fromEntries(
      topicIds.map((topic) => [
        topic,
        {
          status: "addressed",
          rationale: "Synthetic fixture coverage.",
          questionIds: [topic],
        },
      ]),
    ),
    documents: {
      "SPECIFICATION.md":
        "# Synthetic test specification\n\nSee [acceptance](ACCEPTANCE.md).\n",
      "ACCEPTANCE.md": "# Synthetic acceptance\n",
    },
  };
}
function approveInput(
  result,
  response = "I approve the displayed synthetic test revision and its exact documents.",
) {
  return {
    expectedRevision: result.revision,
    reviewedDigest: result.reviewDigest,
    reviewedDocuments: result.documentHashes,
    confirmation: { response },
  };
}
async function ready(f) {
  await f.call("init");
  return f.call("save", completePatch());
}

test("every project operation stops before interview or output writes when full initialization is missing", async (t) => {
  const f = await fixture(t, false);
  for (const command of [
    "init",
    "status",
    "save",
    "validate",
    "approve",
    "require-approved",
    "revise",
  ])
    await assert.rejects(
      f.call(command, {}),
      /Full initialization is not complete.*initialization-execution/,
    );
  await assert.rejects(
    lstat(join(f.root, ".agents/skills/specification-creator/state")),
    { code: "ENOENT" },
  );
  await assert.rejects(lstat(join(f.root, "docs/specification")), {
    code: "ENOENT",
  });
});

test("missing sibling helper and local-only or corrupt receipts cannot be bypassed", async (t) => {
  const f = await fixture(t);
  const receiptPath = join(
    f.root,
    "docs/acceptance/initialization-acceptance.json",
  );
  await writeFile(
    receiptPath,
    JSON.stringify({ ...f.receipt, scope: "local-only" }),
  );
  await assert.rejects(f.call("init"), /Full initialization is not complete/);
  await rm(
    join(
      f.root,
      ".agents/skills/initialization-execution/scripts/completion.mjs",
    ),
  );
  await assert.rejects(f.call("init"), /helper is unavailable/);
  await assert.rejects(
    lstat(join(f.root, ".agents/skills/specification-creator/state")),
    { code: "ENOENT" },
  );
});

test("partial answers persist across independent session helper imports with safe status diagnostics", async (t) => {
  const f = await fixture(t);
  assert.equal((await f.call("init")).revision, 0);
  const result = await f.call("save", {
    expectedRevision: 0,
    questions: {
      problem: question("problem", { answer: "Private client problem text." }),
      users: question("users", {
        status: "unknown",
        dependsOn: ["problem"],
        answer: undefined,
      }),
      scope: question("scope", {
        status: "unknown",
        dependsOn: ["users"],
        answer: undefined,
      }),
    },
  });
  assert.deepEqual(result.frontier, ["users"]);
  assert.equal(
    JSON.stringify(result).includes("Private client problem text."),
    false,
  );
  const installed = await import(
    `${join(f.root, ".agents/skills/specification-creator/scripts/specification.mjs")}?session=second`
  );
  assert.equal((await installed.run("status", { root: f.root })).revision, 1);
  assert.equal(
    JSON.parse(await readFile(f.path, "utf8")).questions.problem.answer,
    "Private client problem text.",
  );
  assert.equal((await lstat(f.path)).mode & 0o777, 0o600);
  assert.equal((await lstat(dirname(f.path))).mode & 0o777, 0o700);
  await assert.rejects(f.call("validate"), /incomplete/);
});

test("source-derived answers require real references, proposed answers remain blockers and cycles are rejected", async (t) => {
  const f = await fixture(t);
  await f.call("init");
  await assert.rejects(
    f.call("save", {
      expectedRevision: 0,
      questions: { problem: question("problem", { provenance: "source" }) },
    }),
    /source references/,
  );
  await assert.rejects(
    f.call("save", {
      expectedRevision: 0,
      questions: { problem: question("problem", { provenance: "proposal" }) },
    }),
    /proposal cannot/,
  );
  await assert.rejects(
    f.call("save", {
      expectedRevision: 0,
      questions: {
        problem: question("problem", { dependsOn: ["users"] }),
        users: question("users", { dependsOn: ["problem"] }),
      },
    }),
    /cycle/,
  );
  await assert.rejects(
    f.call("save", {
      expectedRevision: 0,
      questions: { problem: question("problem", { dependsOn: ["missing"] }) },
    }),
    /Unknown question dependency/,
  );
  const proposed = completePatch();
  proposed.questions.scope = question("scope", {
    status: "proposed",
    provenance: "proposal",
  });
  const result = await f.call("save", proposed);
  assert.deepEqual(result.blockedQuestions, ["scope"]);
  assert.equal(result.ready, false);
});

test("all topics need justified dispositions, core topics remain applicable and settled answers need settled prerequisites", async (t) => {
  const f = await fixture(t);
  await f.call("init");
  const patch = completePatch();
  patch.topics.integrations = {
    status: "not_applicable",
    rationale: "No external systems in this synthetic release.",
    questionIds: [],
  };
  patch.questions.integrations.status = "not_applicable";
  const result = await f.call("save", patch);
  assert.equal(result.ready, true);
  const invalid = await f.call("save", {
    expectedRevision: 1,
    topics: {
      problem: {
        status: "not_applicable",
        rationale: "Invalid core topic exclusion.",
        questionIds: [],
      },
    },
    questions: {
      problem: question("problem", { status: "unknown", answer: undefined }),
    },
  });
  assert.equal(invalid.ready, false);
  assert.ok(invalid.unresolvedTopics.includes("problem"));
  assert.ok(invalid.blockedQuestions.includes("users"));
});

test("readiness and exact human approval bind reviewed state and documents with private/public snapshots", async (t) => {
  const f = await fixture(t),
    result = await ready(f);
  assert.equal(result.ready, true);
  assert.equal(result.approved, false);
  assert.equal((await f.call("validate")).revision, result.revision);
  await assert.rejects(f.call("require-approved"), /not approved/);
  await assert.rejects(
    f.call("approve", {
      expectedRevision: 1,
      confirmation: { response: "Approved." },
    }),
    /exact reviewed/,
  );
  await assert.rejects(
    f.call("approve", approveInput(result, " ")),
    /actual human response/,
  );
  await assert.rejects(
    f.call("approve", {
      ...approveInput(result),
      reviewedDigest: "0".repeat(64),
    }),
    /exact reviewed/,
  );
  const approved = await f.call("approve", approveInput(result));
  assert.equal(approved.approved, true);
  assert.equal(approved.revision, 2);
  assert.equal((await f.call("require-approved")).approved, true);
  const directory = join(f.root, "docs/specification/versions/approved-001");
  assert.equal(
    await readFile(join(directory, "SPECIFICATION.md"), "utf8"),
    completePatch().documents["SPECIFICATION.md"],
  );
  const publicReceipt = await readFile(
    join(directory, "approval.json"),
    "utf8",
  );
  assert.equal(publicReceipt.includes("I approve"), false);
  assert.equal(publicReceipt.includes(f.root), false);
  const privateSnapshot = JSON.parse(
    await readFile(join(dirname(f.path), "approved-001.json"), "utf8"),
  );
  assert.equal(
    privateSnapshot.approval.response,
    approveInput(result).confirmation.response,
  );
  await assert.rejects(
    f.call("save", {
      expectedRevision: 2,
      documents: { "SPECIFICATION.md": "Changed" },
    }),
    /requires revise/,
  );
});

test("manual draft edits are preserved until explicit adoption and old reviewed hashes cannot approve them", async (t) => {
  const f = await fixture(t),
    old = await ready(f);
  const doc = join(f.root, "docs/specification/SPECIFICATION.md");
  await writeFile(doc, "# A human edited this draft\n");
  assert.equal((await f.call("status")).documentsCurrent, false);
  await assert.rejects(
    f.call("save", {
      expectedRevision: 1,
      documents: { "SPECIFICATION.md": "Overwrite" },
    }),
    /preserve manual edits/,
  );
  assert.equal(await readFile(doc, "utf8"), "# A human edited this draft\n");
  const adopted = await f.call("save", {
    expectedRevision: 1,
    adoptDocuments: true,
  });
  await assert.rejects(
    f.call("approve", {
      ...approveInput(old),
      expectedRevision: adopted.revision,
    }),
    /exact reviewed/,
  );
  assert.equal((await f.call("approve", approveInput(adopted))).approved, true);
});

test("approved edits stale approval, revisions preserve exact history and reopen dependent branches only", async (t) => {
  const f = await fixture(t),
    readyResult = await ready(f);
  await f.call("approve", approveInput(readyResult));
  await writeFile(
    join(f.root, "docs/specification/SPECIFICATION.md"),
    "# Requested new draft\n",
  );
  await assert.rejects(f.call("require-approved"), /not approved/);
  const result = await f.call("revise", {
    expectedRevision: 2,
    affectedQuestionIds: ["problem"],
    reason: "Synthetic request changing the core problem.",
  });
  assert.equal(result.iteration, 2);
  assert.equal(result.approved, false);
  const state = JSON.parse(await readFile(f.path, "utf8"));
  assert.equal(state.questions.problem.status, "unknown");
  assert.equal(state.questions.users.status, "unknown");
  assert.equal(state.questions.acceptance.status, "answered");
  assert.equal(state.questions.scope.status, "answered");
  assert.deepEqual(state.changes[0].affectedQuestionIds, ["problem", "users"]);
  assert.equal(
    await readFile(
      join(f.root, "docs/specification/versions/approved-001/SPECIFICATION.md"),
      "utf8",
    ),
    completePatch().documents["SPECIFICATION.md"],
  );
  const nextDraft = await f.call("save", {
    expectedRevision: 3,
    questions: {
      problem: question("problem", { answer: "Revised problem." }),
      users: question("users", { dependsOn: ["problem"] }),
    },
    topics: {
      problem: completePatch().topics.problem,
      users: completePatch().topics.users,
    },
  });
  assert.equal(
    (await f.call("approve", approveInput(nextDraft))).approved,
    true,
  );
  assert.equal(
    await readFile(
      join(f.root, "docs/specification/versions/approved-002/SPECIFICATION.md"),
      "utf8",
    ),
    "# Requested new draft\n",
  );
});

test("tampered approved state and version bytes are rejected", async (t) => {
  const f = await fixture(t),
    result = await ready(f);
  await f.call("approve", approveInput(result));
  const state = JSON.parse(await readFile(f.path, "utf8"));
  state.questions.problem.answer = "Tampered without revision.";
  await writeFile(f.path, JSON.stringify(state), { mode: 0o600 });
  await assert.rejects(f.call("require-approved"), /not approved/);
  state.questions.problem.answer = completePatch().questions.problem.answer;
  await writeFile(f.path, JSON.stringify(state), { mode: 0o600 });
  await writeFile(
    join(f.root, "docs/specification/versions/approved-001/ACCEPTANCE.md"),
    "# Tampered history\n",
  );
  await assert.rejects(f.call("require-approved"), /contents changed/);
  await assert.rejects(
    f.call("revise", {
      expectedRevision: 2,
      affectedQuestionIds: ["problem"],
      reason: "Change.",
    }),
    /contents changed/,
  );
});

test("revision conflicts, document traversal, secrets and concurrent writer locks fail without overwriting saved answers", async (t) => {
  const f = await fixture(t);
  await f.call("init");
  await assert.rejects(
    f.call("save", { expectedRevision: 5 }),
    /revision conflict/,
  );
  await assert.rejects(
    f.call("save", {
      expectedRevision: 0,
      documents: { "../OUTSIDE.md": "bad" },
    }),
    /uppercase simple filenames/,
  );
  await assert.rejects(
    f.call("save", {
      expectedRevision: 0,
      questions: {
        problem: question("problem", { answer: `ghp_${"a".repeat(30)}` }),
      },
    }),
    /Secret-like/,
  );
  await writeFile(join(dirname(f.path), ".write-lock"), "Existing writer", {
    mode: 0o600,
  });
  await assert.rejects(
    f.call("save", { expectedRevision: 0 }),
    /Another specification writer/,
  );
  assert.equal(JSON.parse(await readFile(f.path, "utf8")).revision, 0);
});

test("unsafe linked or public private-state paths are rejected", async (t) => {
  const f = await fixture(t);
  await f.call("init");
  await chmod(f.path, 0o644);
  await assert.rejects(f.call("status"), /private permissions/);
  await chmod(f.path, 0o600);
  const backup = join(f.root, "state-link");
  await link(f.path, backup);
  await assert.rejects(f.call("status"), /Unsafe specification path/);
  await rm(backup);
  const bytes = await readFile(f.path);
  await rm(f.path);
  await writeFile(backup, bytes, { mode: 0o600 });
  await symlink(backup, f.path);
  await assert.rejects(f.call("status"), /Unsafe specification path/);
});

test("installed CLI works in a fresh process and gates before reading answer input", async (t) => {
  const f = await fixture(t),
    cli = join(
      f.root,
      ".agents/skills/specification-creator/scripts/specification.mjs",
    );
  const invoke = (args) =>
    execFileSync(process.execPath, [cli, ...args], {
      cwd: f.root,
      encoding: "utf8",
      stdio: "pipe",
    });
  assert.equal(JSON.parse(invoke(["init"])).revision, 0);
  assert.equal(JSON.parse(invoke(["status"])).revision, 0);
  const answerFile = join(f.root, "private-invalid-input.json");
  await writeFile(
    answerFile,
    "This is not JSON and must not be read before the gate.",
    { mode: 0o600 },
  );
  await rm(join(f.root, ".template-initialization/completion.json"));
  assert.throws(
    () => invoke(["save", "--input", answerFile]),
    (error) => {
      assert.match(
        error.stderr.toString(),
        /Full initialization is not complete/,
      );
      assert.doesNotMatch(error.stderr.toString(), /Invalid JSON/);
      return true;
    },
  );
});

test("skill package contains resolvable reference links and zero install-time dependencies", async () => {
  const directory = join(packages, "specification-creator");
  const pkg = JSON.parse(
    await readFile(join(directory, "package.json"), "utf8"),
  );
  assert.deepEqual(Object.keys(pkg.dependencies ?? {}), []);
  assert.deepEqual(Object.keys(pkg.devDependencies ?? {}), []);
  for (const name of [
    "SKILL.md",
    "references/interview.md",
    "references/state.md",
    "references/outputs.md",
  ]) {
    const content = await readFile(join(directory, name), "utf8");
    for (const match of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      if (/^(?:https?:|#)/.test(match[1])) continue;
      const path = resolve(
        dirname(join(directory, name)),
        match[1].split("#")[0],
      );
      assert.ok(
        (await lstat(path)).isFile(),
        `${name} has an unresolved reference`,
      );
    }
  }
});

test("draft answer changes reopen direct and transitive dependents while preserving unrelated decisions", async (t) => {
  const f = await fixture(t);
  await f.call("init");
  const patch = completePatch();
  patch.questions.features.dependsOn = ["users"];
  assert.equal((await f.call("save", patch)).ready, true);
  const changed = await f.call("save", {
    expectedRevision: 1,
    questions: {
      problem: question("problem", {
        answer: "A different client problem changes dependent requirements.",
      }),
      users: question("users", {
        dependsOn: ["problem"],
        answer: "Same-batch dependent answer still requires a later round.",
      }),
    },
  });
  assert.equal(changed.ready, false);
  const state = JSON.parse(await readFile(f.path, "utf8"));
  assert.equal(state.questions.problem.status, "answered");
  assert.equal(state.questions.users.status, "unknown");
  assert.equal(state.questions.features.status, "unknown");
  assert.equal(state.questions.users.answer, undefined);
  assert.equal(state.questions.acceptance.status, "answered");
  assert.equal(state.topics.acceptance.status, "addressed");
  for (const key of ["problem", "users", "features"])
    assert.equal(state.topics[key].status, "unresolved");
  await assert.rejects(
    f.call("approve", approveInput(changed)),
    /Resolve all applicable topics/,
  );
});
