import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { promisify } from "node:util";

import { renderTranslationIndex, translationDirectory } from "../core.mjs";
import { digest, exists } from "../filesystem.mjs";
import { generators } from "../registry.mjs";
import { refreshSamples, sampleInvocations, sampleReceipt } from "../samples.mjs";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const execute = promisify(execFile);

async function fixture(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "starter-samples-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await execute("git", ["init", "--quiet", directory]);
  await mkdir(path.join(directory, translationDirectory), { recursive: true });
  await writeFile(path.join(directory, "frontend/package.json"), '{"type":"module"}\n');
  await writeFile(
    path.join(directory, "frontend/.prettierrc.json"),
    await readFile(path.join(root, "frontend/.prettierrc.json")),
  );
  await symlink(path.join(root, "frontend/node_modules"), path.join(directory, "frontend/node_modules"), "dir");
  const prettier = await import(path.join(root, "frontend/node_modules/prettier/index.mjs"));
  await writeFile(
    path.join(directory, translationDirectory, "index.ts"),
    await prettier.format(renderTranslationIndex([]), {
      parser: "typescript",
      ...(await prettier.resolveConfig(path.join(root, "frontend/package.json"))),
    }),
  );
  return directory;
}

test("sample inventory covers every frontend kind and variant, including future catalog additions", () => {
  const cases = sampleInvocations();
  const count = generators
    .filter(item => item.target === "frontend")
    .reduce((sum, item) => sum + (item.variants?.length ?? 1), 0);
  assert.equal(cases.length, count);
  assert.equal(new Set(cases.map(item => item.feature)).size, count);
  assert.ok(cases.every(item => item.target === "frontend"));
  assert.equal(cases.find(item => item.variant === "entity-picker").name, "GeneratorComponentEntityPicker");
  assert.equal(cases.find(item => item.variant === "entity-picker").fields, undefined);
  assert.match(
    cases.find(item => item.kind === "form" && item.variant === "wizard").fields,
    /budget:number\?.*status:select/,
  );
  assert.match(cases.find(item => item.kind === "feature" && item.variant === "workspace").fields, /active:boolean/);
  const future = sampleInvocations([
    {
      target: "frontend",
      kind: "new-layout",
      variants: [{ value: "rich", acceptsFields: false }],
    },
  ]);
  assert.equal(future[0].name, "GeneratorNewLayoutRich");
  assert.equal(future[0].fields, undefined);
});

test("refresh replaces the complete known catalog deterministically and preserves unrelated code", async t => {
  const directory = await fixture(t);
  const unrelated = path.join(directory, "frontend/src/features/keep.ts");
  await mkdir(path.dirname(unrelated), { recursive: true });
  await writeFile(unrelated, "// application-owned\n");
  const first = await refreshSamples(directory);
  const before = await readFile(path.join(directory, sampleReceipt), "utf8");
  const second = await refreshSamples(directory);
  assert.deepEqual(second, first);
  assert.equal(await readFile(path.join(directory, sampleReceipt), "utf8"), before);
  assert.equal(await readFile(unrelated, "utf8"), "// application-owned\n");
  assert.ok(first.recipes.some(item => item.generator === "frontend/navigation"));
  assert.ok(first.recipes.some(item => item.variant === "dashboard"));
  for (const file of JSON.parse(before).files)
    assert.equal(digest(await readFile(path.join(directory, file.path))), file.sha256);
  assert.equal(await exists(path.join(directory, ".generator-samples.lock")), undefined);
});

test("dry run leaves a clean workspace untouched", async t => {
  const directory = await fixture(t);
  const result = await refreshSamples(directory, { dryRun: true });
  assert.equal(result.dryRun, true);
  assert.equal(await exists(path.join(directory, sampleReceipt)), undefined);
  assert.equal(await exists(path.join(directory, ".generator-samples.lock")), undefined);
  assert.equal(await exists(path.join(directory, "frontend/src/features")), undefined);
});

test("interrupted owned locale removal recovers, while unrelated orphan locales refuse before cleanup", async t => {
  const directory = await fixture(t);
  const first = await refreshSamples(directory);
  const receipt = JSON.parse(await readFile(path.join(directory, sampleReceipt), "utf8"));
  const english = receipt.files.find(file => file.path.endsWith(".en.ts"));
  await rm(path.join(directory, english.path));
  assert.deepEqual(await refreshSamples(directory), first);
  const retained = receipt.files.find(file => file.path.endsWith(".tsx"));
  const orphan = path.join(directory, translationDirectory, "orphan.en.ts");
  await writeFile(orphan, "export const translations = {} as const;\n");
  await assert.rejects(refreshSamples(directory), /outside the sample receipt/);
  assert.equal(digest(await readFile(path.join(directory, retained.path))), retained.sha256);
  assert.ok(await exists(orphan));
});

test("edited and adopted samples are rejected before any cleanup", async t => {
  const directory = await fixture(t);
  await refreshSamples(directory);
  const receipt = JSON.parse(await readFile(path.join(directory, sampleReceipt), "utf8"));
  const changed = receipt.files[0];
  const destination = path.join(directory, changed.path);
  const original = await readFile(destination);
  await writeFile(destination, "// human edit\n");
  await assert.rejects(refreshSamples(directory), /Edited sample/);
  assert.equal(await readFile(destination, "utf8"), "// human edit\n");
  assert.ok(await exists(path.join(directory, receipt.files.at(-1).path)));
  await writeFile(destination, original);
  await execute("git", ["-C", directory, "add", "--", changed.path]);
  await assert.rejects(refreshSamples(directory), /tracked sample/);
  assert.equal(digest(await readFile(destination)), changed.sha256);
});

test("unsafe receipts, symlinks and new files in sample owners never grant deletion rights", async t => {
  const directory = await fixture(t);
  await writeFile(
    path.join(directory, sampleReceipt),
    JSON.stringify({
      schemaVersion: 1,
      files: [{ path: "../outside", sha256: "a".repeat(64) }],
    }),
  );
  await assert.rejects(refreshSamples(directory), /receipt/);
  await rm(path.join(directory, sampleReceipt));
  await refreshSamples(directory);
  const receipt = JSON.parse(await readFile(path.join(directory, sampleReceipt), "utf8"));
  const destination = path.join(directory, receipt.files[0].path);
  const bytes = await readFile(destination);
  await rm(destination);
  await symlink(path.join(directory, "frontend/package.json"), destination);
  await assert.rejects(refreshSamples(directory), /symlink/);
  await rm(destination);
  await writeFile(destination, bytes);
  const extra = path.join(directory, "frontend/src/features/generator-card/notes.txt");
  await writeFile(extra, "keep me");
  await assert.rejects(refreshSamples(directory), /Unmanaged file/);
  assert.equal(await readFile(extra, "utf8"), "keep me");
  assert.equal(digest(await readFile(destination)), receipt.files[0].sha256);
});
