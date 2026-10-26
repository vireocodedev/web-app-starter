import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { canonical, sha256, run } from "../scripts/package.mjs";
import { fullCompletionReceipt } from "../../initialization-execution/tests/completion-fixture.mjs";
import {
  topicIds,
  run as specification,
} from "../../specification-creator/scripts/specification.mjs";

const packages = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const issueBody = (label = "Availability") =>
  `## Outcome\n${label} is observable.\n\n## Scope\nThe included first-release coordinator workflow.\n\n## Acceptance criteria\n- Coordinators can inspect availability.\n- Unauthorized users cannot inspect it.\n\n## Verification\nExisting focused workflow checks and manual role acceptance.\n\n## Decisions\nFollow existing capability owners; no new product policy.\n\n## Source\nSPECIFICATION.md FEATURE-001 and ACCEPTANCE.md ACCEPT-001.\n\n## Dependencies\nSee manifest dependsOn; no additional implicit blockers.\n`;
export async function writeManifest(directory, manifest) {
  await writeFile(
    join(directory, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
}
export function issueMetadata(id, overrides = {}) {
  return {
    id,
    kind: "task",
    owner: "Availability workflow",
    title: `Deliver ${id}`,
    body: `issues/${id}.md`,
    sha256: null,
    labels: ["needs-triage"],
    sourceRefs: [{ document: "SPECIFICATION.md", id: "FEATURE-001" }],
    dependsOn: [],
    parent: null,
    ...overrides,
  };
}
export async function authorPackage(
  directory,
  issues = [issueMetadata("ISSUE-001")],
) {
  const manifest = JSON.parse(
    await readFile(join(directory, "manifest.json"), "utf8"),
  );
  manifest.issues = [];
  for (const issue of issues) {
    const { bodyText = issueBody(issue.id), ...metadata } = issue;
    await writeFile(join(directory, metadata.body), bodyText);
    manifest.issues.push(metadata);
  }
  await writeManifest(directory, manifest);
  return manifest;
}
// Synthetic public-only fixture: proves import/portable validation without the
// original consumer, private answers, credentials or a real approval claim.
export async function createPortablePackage(t, options = {}) {
  const directory = await mkdtemp(
    join(tmpdir(), "issue-package-portable-test-"),
  );
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(join(directory, "source"));
  await mkdir(join(directory, "issues"));
  const documents = {
    "SPECIFICATION.md":
      "# Synthetic approved specification\n\nFEATURE-001: Coordinators inspect appointment availability.\n",
    "ACCEPTANCE.md":
      "# Synthetic acceptance\n\nACCEPT-001: Authorized coordinator sees availability.\n",
  };
  const documentHashes = Object.fromEntries(
    Object.entries(documents).map(([name, contents]) => [
      name,
      sha256(contents),
    ]),
  );
  const receipt = {
    schemaVersion: 1,
    repository: options.repository ?? "example/consumer",
    revision: 3,
    digest: sha256("synthetic approved state"),
    confirmedAt: "2026-01-01T00:00:00.000Z",
    documents: documentHashes,
  };
  for (const [name, contents] of Object.entries(documents))
    await writeFile(join(directory, "source", name), contents);
  await writeFile(
    join(directory, "source/approval.json"),
    JSON.stringify(receipt, null, 2) + "\n",
  );
  await writeFile(
    join(directory, "README.md"),
    "# Synthetic portable issue package\n",
  );
  const manifest = {
    schemaVersion: 1,
    packageId: options.packageId ?? randomUUID(),
    repository: receipt.repository,
    source: {
      iteration: 1,
      revision: receipt.revision,
      digest: receipt.digest,
      documents: documentHashes,
    },
    labels: [
      {
        name: "needs-triage",
        color: "D4C5F9",
        description: "Maintainer evaluation needed",
      },
    ],
    issues: [],
    packageDigest: null,
  };
  for (const issue of options.issues ?? [issueMetadata("ISSUE-001")]) {
    const { bodyText = issueBody(issue.id), ...metadata } = issue;
    await writeFile(join(directory, metadata.body), bodyText);
    manifest.issues.push({ ...metadata, sha256: sha256(bodyText) });
  }
  const { packageDigest: _unused, ...content } = manifest;
  manifest.packageDigest = sha256(canonical(content));
  await writeManifest(directory, manifest);
  return { directory, packageDir: directory, manifest, sourceReceipt: receipt };
}
export async function createApprovedConsumer(
  t,
  { initialized = true, approved = true } = {},
) {
  const root = await mkdtemp(join(tmpdir(), "issue-package-consumer-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const name of [
    "initialization-intake",
    "initialization-execution",
    "specification-creator",
  ]) {
    const destination = join(root, ".agents/skills", name, "scripts");
    await mkdir(dirname(destination), { recursive: true });
    await cp(join(packages, name, "scripts"), destination, { recursive: true });
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
  if (initialized) {
    const sourceCommit = git(["rev-parse", "HEAD"]),
      receipt = fullCompletionReceipt(sourceCommit);
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
    await specification("init", { root });
    await specification("save", {
      root,
      input: {
        expectedRevision: 0,
        questions: Object.fromEntries(
          topicIds.map((topic) => [
            topic,
            {
              topic,
              prompt: `Synthetic ${topic}?`,
              dependsOn: [],
              status: "answered",
              answer: `Synthetic ${topic} answer.`,
              provenance: "user",
              sourceIds: [],
              blocking: true,
              decisionEvidence: "Synthetic user confirmed this answer.",
            },
          ]),
        ),
        topics: Object.fromEntries(
          topicIds.map((topic) => [
            topic,
            {
              status: "addressed",
              rationale: "Synthetic complete coverage.",
              questionIds: [topic],
            },
          ]),
        ),
        documents: {
          "SPECIFICATION.md":
            "# Synthetic approved specification\n\nFEATURE-001: Coordinators inspect availability.\n",
          "ACCEPTANCE.md":
            "# Synthetic acceptance\n\nACCEPT-001: Unauthorized access is rejected.\n",
        },
      },
    });
    if (approved) {
      const result = await specification("validate", { root });
      await specification("approve", {
        root,
        input: {
          expectedRevision: result.revision,
          reviewedDigest: result.reviewDigest,
          reviewedDocuments: result.documentHashes,
          confirmation: {
            response: "Synthetic user approves this exact test specification.",
          },
        },
      });
    }
  }
  const output = join(root, "docs/issue-packages/specification-001");
  return { root, output, prepare: () => run("prepare", { root, output }) };
}
