import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  link,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { loadPackage, run } from "../scripts/package.mjs";
import {
  authorPackage,
  createApprovedConsumer,
  createPortablePackage,
  issueBody,
  issueMetadata,
  writeManifest,
} from "./fixtures.mjs";
import { run as specification } from "../../specification-creator/scripts/specification.mjs";

test("missing initialization or unapproved specification stops before any output", async (t) => {
  for (const options of [{ initialized: false }, { approved: false }]) {
    const f = await createApprovedConsumer(t, options);
    await assert.rejects(
      f.prepare(),
      /Specification is not complete and approved/,
    );
    await assert.rejects(readFile(join(f.output, "manifest.json")), {
      code: "ENOENT",
    });
  }
});
test("approved consumer prepares exact public source, seals authored issues and validates", async (t) => {
  const f = await createApprovedConsumer(t);
  const prepared = await f.prepare();
  assert.equal(prepared.status, "draft");
  await assert.rejects(loadPackage(f.output), /draft/);
  await authorPackage(f.output);
  const sealed = await run("seal", { root: f.root, packageDir: f.output });
  const result = await loadPackage(f.output, { root: f.root });
  assert.equal(result.packageDigest, sealed.packageDigest);
  assert.equal(result.issues[0].bodyText, issueBody("ISSUE-001"));
  assert.deepEqual((await readdir(join(f.output, "source"))).sort(), [
    "ACCEPTANCE.md",
    "SPECIFICATION.md",
    "approval.json",
  ]);
  const sourceText = await readFile(
    join(f.output, "source/approval.json"),
    "utf8",
  );
  assert.equal(sourceText.includes("Synthetic user approves"), false);
  await assert.rejects(f.prepare(), /already exists/);
});
test("portable package validates without consumer or private state", async (t) => {
  const f = await createPortablePackage(t);
  const result = await loadPackage(f.directory);
  assert.equal(result.manifest.repository, "example/consumer");
  assert.equal(result.issues.length, 1);
  await assert.rejects(
    loadPackage(f.directory, { requireCurrentSource: true }),
    /root is required/,
  );
});
test("a public receipt cannot substitute another consumer repository", async (t) => {
  const f = await createApprovedConsumer(t);
  const path = join(
    f.root,
    "docs/specification/versions/approved-001/approval.json",
  );
  const receipt = JSON.parse(await readFile(path, "utf8"));
  receipt.repository = "example/foreign";
  await writeFile(path, JSON.stringify(receipt));
  await assert.rejects(f.prepare(), /receipt does not match/);
  await assert.rejects(readFile(join(f.output, "manifest.json")), {
    code: "ENOENT",
  });
});
test("manual issue edits are preserved and require intentional resealing", async (t) => {
  const f = await createApprovedConsumer(t);
  await f.prepare();
  await authorPackage(f.output);
  await run("seal", { root: f.root, packageDir: f.output });
  const path = join(f.output, "issues/ISSUE-001.md"),
    edited = issueBody("Reviewed manual wording");
  await writeFile(path, edited);
  await assert.rejects(loadPackage(f.output), /body hash mismatch/);
  await run("seal", { root: f.root, packageDir: f.output });
  assert.equal((await loadPackage(f.output)).issues[0].bodyText, edited);
});
test("revision makes old package stale while preserving portable history", async (t) => {
  const f = await createApprovedConsumer(t);
  await f.prepare();
  await authorPackage(f.output);
  await run("seal", { root: f.root, packageDir: f.output });
  const status = await specification("status", { root: f.root });
  await specification("revise", {
    root: f.root,
    input: {
      expectedRevision: status.revision,
      affectedQuestionIds: ["scope"],
      reason: "Synthetic revised release scope.",
    },
  });
  await assert.rejects(
    loadPackage(f.output, { root: f.root }),
    /not complete and approved/,
  );
  assert.equal((await loadPackage(f.output)).issues.length, 1);
});
test("source drift, forged foreign source and unexpected private files are rejected", async (t) => {
  const a = await createPortablePackage(t);
  await writeFile(
    join(a.directory, "source/SPECIFICATION.md"),
    "Changed approved bytes",
  );
  await assert.rejects(loadPackage(a.directory), /source hash mismatch/);
  const b = await createPortablePackage(t);
  b.manifest.repository = "example/foreign";
  await writeManifest(b.directory, b.manifest);
  await assert.rejects(loadPackage(b.directory), /source identity/);
  const c = await createPortablePackage(t);
  await writeFile(join(c.directory, "source/interview.json"), "private");
  await assert.rejects(loadPackage(c.directory), /inventory/);
});
test("traversal, symlinks and hardlinked body files are rejected", async (t) => {
  const a = await createPortablePackage(t);
  a.manifest.issues[0].body = "../outside.md";
  await writeManifest(a.directory, a.manifest);
  await assert.rejects(loadPackage(a.directory), /body path/);
  for (const makeLink of [symlink, link]) {
    const f = await createPortablePackage(t),
      path = join(f.directory, "issues/ISSUE-001.md"),
      target = join(f.directory, "source/SPECIFICATION.md");
    await rm(path);
    await makeLink(target, path);
    await assert.rejects(loadPackage(f.directory), /Unsafe package path/);
  }
});
test("dependencies and parents each reject cycles without imposing parent execution order", async (t) => {
  const good = await createPortablePackage(t, {
    issues: [
      issueMetadata("ISSUE-001", { kind: "epic" }),
      issueMetadata("ISSUE-002", { parent: "ISSUE-001" }),
    ],
  });
  assert.equal(
    (await loadPackage(good.directory)).issues[1].dependsOn.length,
    0,
  );
  for (const field of ["dependsOn", "parent"]) {
    const f = await createPortablePackage(t, {
      issues: [
        issueMetadata("ISSUE-001", {
          [field]: field === "dependsOn" ? ["ISSUE-002"] : "ISSUE-002",
        }),
        issueMetadata("ISSUE-002", {
          [field]: field === "dependsOn" ? ["ISSUE-001"] : "ISSUE-001",
        }),
      ],
    });
    await assert.rejects(loadPackage(f.directory), /Cycle/);
  }
});
test("dangling dependency, duplicated ID, source reference and empty acceptance fail", async (t) => {
  for (const issue of [
    issueMetadata("ISSUE-001", { dependsOn: ["MISSING"] }),
    issueMetadata("ISSUE-001", {
      sourceRefs: [{ document: "SPECIFICATION.md", id: "FEATURE-MISSING" }],
    }),
    issueMetadata("ISSUE-001", {
      bodyText: issueBody().replace(
        "- Coordinators can inspect availability.\n- Unauthorized users cannot inspect it.",
        "",
      ),
    }),
  ]) {
    const f = await createPortablePackage(t, { issues: [issue] });
    await assert.rejects(loadPackage(f.directory));
  }
  const duplicate = await createPortablePackage(t, {
    issues: [issueMetadata("ISSUE-001"), issueMetadata("ISSUE-001")],
  });
  await assert.rejects(loadPackage(duplicate.directory), /duplicate issue IDs/);
});
test("manifest drift and reserved import marker are rejected", async (t) => {
  const a = await createPortablePackage(t);
  a.manifest.issues[0].title = "Changed title";
  await writeManifest(a.directory, a.manifest);
  await assert.rejects(loadPackage(a.directory), /digest mismatch/);
  const b = await createPortablePackage(t, {
    issues: [
      issueMetadata("ISSUE-001", {
        bodyText: issueBody() + "\n<!-- issue-package-provenance -->\n",
      }),
    ],
  });
  await assert.rejects(loadPackage(b.directory), /reserved import marker/);
});

test("malformed package and source JSON stays out of package diagnostics", async (t) => {
  const script = fileURLToPath(
    new URL("../scripts/package.mjs", import.meta.url),
  );
  const sentinel = "PRIVATE_MALFORMED_CLIENT_VALUE";
  for (const selected of ["manifest.json", "source/approval.json"]) {
    const fixture = await createPortablePackage(t);
    await writeFile(join(fixture.directory, selected), sentinel);
    await assert.rejects(loadPackage(fixture.directory), (error) => {
      assert.equal(error.message.includes(sentinel), false);
      assert.match(error.message, /Invalid issue-package JSON/);
      return true;
    });
    const result = spawnSync(
      process.execPath,
      [script, "validate", "--package", fixture.directory],
      {
        cwd: fixture.directory,
        encoding: "utf8",
      },
    );
    assert.equal(result.status, 1);
    assert.equal(`${result.stdout}${result.stderr}`.includes(sentinel), false);
    assert.match(result.stderr, /Invalid issue-package JSON/);
  }
});
