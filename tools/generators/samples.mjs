#!/usr/bin/env node
import { execFile } from "node:child_process";
import { open, readFile, readdir, realpath, rmdir, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { createIndexPlan, createPlan, translationDirectory, verifyTranslationIndex } from "./core.mjs";
import { applyPlan, digest, exists, safePath } from "./filesystem.mjs";
import { naming } from "./naming.mjs";
import { generators } from "./registry.mjs";

const execute = promisify(execFile);
export const sampleReceipt = ".generator-samples.json";
const workspaceRoot = fileURLToPath(new URL("../../", import.meta.url));
const legacyNames = {
  component: "GeneratorCard",
  form: "GeneratorProfile",
  shell: "GeneratorDashboard",
  table: "GeneratorOrders",
  page: "GeneratorOverview",
  feature: "GeneratorWorkspace",
  api: "GeneratorProduct",
};

/** Discover every frontend recipe, including variants added to the live catalog. */
export function sampleInvocations(catalog = generators) {
  return catalog
    .filter(generator => generator.target === "frontend")
    .flatMap(generator =>
      (generator.variants ?? [null]).map((variant, index) => {
        const name =
          index === 0 && legacyNames[generator.kind]
            ? legacyNames[generator.kind]
            : `Generator${naming(generator.kind).pascal}${variant ? naming(variant.value).pascal : ""}`;
        const acceptsFields = (variant ?? generator).acceptsFields !== false;
        return {
          target: "frontend",
          kind: generator.kind,
          name,
          feature: generator.kind === "api" ? "GeneratorCatalog" : name,
          ...(variant ? { variant: variant.value } : {}),
          ...(acceptsFields
            ? { fields: generator.kind === "api" ? "title,quantity:integer?,active:boolean" : "title,notes?" }
            : {}),
        };
      }),
    );
}

const samplePath = value =>
  /^(?:frontend\/src\/features\/generator-[a-z0-9-]+\/|frontend\/tests\/features\/generator-[a-z0-9-]+\/|frontend\/src\/pages\/generator-[a-z0-9-]+\/|frontend\/src\/pages\/development-guide\/generated\/[a-z]+\/generator-[a-z0-9-]+--generator-[a-z0-9-]+\.example\.tsx$|frontend\/src\/app\/router\/generated\/generator-[a-z0-9-]+--generator-[a-z0-9-]+\.routes\.tsx$|frontend\/src\/app\/localization\/translations\/generated\/generator[A-Za-z0-9_]+\.(?:en|hr)\.ts$)/.test(
    value,
  );

async function inventory(directory) {
  if (!(await exists(directory))) return [];
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const child = path.join(directory, entry.name);
    if (entry.isDirectory()) paths.push(...(await inventory(child)));
    else paths.push(child);
  }
  return paths;
}

async function readReceipt(root) {
  const destination = await safePath(root, sampleReceipt);
  if (!(await exists(destination))) return { previous: undefined, files: [] };
  const previous = await readFile(destination, "utf8");
  const receipt = JSON.parse(previous);
  if (receipt.schemaVersion !== 1 || !Array.isArray(receipt.files) || receipt.files.length > 1000)
    throw new Error("Invalid generator sample receipt. Preserve it and inspect the sample inventory.");
  const seen = new Set();
  for (const file of receipt.files) {
    if (
      typeof file.path !== "string" ||
      !samplePath(file.path) ||
      !/^[a-f0-9]{64}$/.test(file.sha256) ||
      seen.has(file.path)
    )
      throw new Error("Invalid generator sample receipt path or digest.");
    await safePath(root, file.path);
    seen.add(file.path);
  }
  return { previous, files: receipt.files };
}

async function checkSamples(root, files) {
  for (const file of files) {
    const destination = await safePath(root, file.path);
    if (await exists(destination)) {
      if (digest(await readFile(destination)) !== file.sha256)
        throw new Error(`Edited sample: ${file.path}. Stash your changes with git stash push -u before refreshing.`);
    }
  }
  const { stdout } = await execute("git", [
    "-C",
    root,
    "ls-files",
    "-z",
    "--",
    sampleReceipt,
    ...files.map(file => file.path),
  ]);
  if (stdout)
    throw new Error("Sample refresh refuses tracked sample files or receipts. Preserve adopted application code.");
  const owned = new Set(files.map(file => path.join(root, file.path)));
  const directories = new Set(
    files.flatMap(file => {
      const match = /^(frontend\/(?:src|tests)\/(?:features|pages)\/generator-[a-z0-9-]+)\//.exec(file.path);
      return match ? [match[1]] : [];
    }),
  );
  for (const directory of directories)
    for (const file of await inventory(path.join(root, directory)))
      if (!owned.has(file))
        throw new Error(`Unmanaged file in sample owner: ${path.relative(root, file)}. Preserve it before refreshing.`);
}

const receiptContent = files => JSON.stringify({ schemaVersion: 1, files }, null, 2) + "\n";

async function checkRemainingLocales(root, files) {
  await verifyTranslationIndex(root);
  const removed = new Set(files.map(file => file.path));
  const names = (await readdir(path.dirname(await safePath(root, `${translationDirectory}/index.ts`)))).filter(
    name => /\.(en|hr)\.ts$/.test(name) && !removed.has(`${translationDirectory}/${name}`),
  );
  for (const name of names) {
    const match = /^([a-z][a-zA-Z0-9_]*)\.(en|hr)\.ts$/.exec(name);
    if (!match || !names.includes(`${match[1]}.${match[2] === "en" ? "hr" : "en"}.ts`))
      throw new Error(`Unpaired or invalid locale outside the sample receipt: ${name}`);
  }
}

/** Remove only receipt-owned unchanged samples; normal application generation never gains overwrite rights. */
export async function refreshSamples(root = workspaceRoot, { dryRun = false } = {}) {
  root = await realpath(root);
  const lockPath = await safePath(root, ".generator-samples.lock");
  const lock = dryRun ? undefined : await open(lockPath, "wx");
  try {
    const receipt = await readReceipt(root);
    await checkSamples(root, receipt.files);
    // Owned missing halves can be completed after interruption; unrelated locale damage still refuses before cleanup.
    await checkRemainingLocales(root, receipt.files);
    const invocations = sampleInvocations();
    if (dryRun) return { dryRun: true, remove: receipt.files.map(file => file.path), recipes: invocations };
    for (const file of receipt.files) {
      const destination = await safePath(root, file.path);
      if (!(await exists(destination))) continue;
      if (digest(await readFile(destination)) !== file.sha256)
        throw new Error(`Sample changed during refresh: ${file.path}`);
      await unlink(destination);
      let directory = path.dirname(destination);
      while (directory !== root) {
        try {
          await rmdir(directory);
        } catch (error) {
          if (["ENOTEMPTY", "ENOENT"].includes(error.code)) break;
          throw error;
        }
        directory = path.dirname(directory);
      }
    }
    let previous = receiptContent([]);
    await applyPlan(root, [
      ...(await createIndexPlan(root)),
      {
        path: sampleReceipt,
        content: previous,
        ...(receipt.previous !== undefined ? { previous: receipt.previous } : {}),
      },
    ]);
    const files = [];
    const results = [];
    for (const invocation of invocations) {
      const plan = await createPlan(root, invocation);
      const added = plan.files
        .filter(file => file.previous === undefined)
        .map(file => ({ path: file.path, sha256: digest(file.content) }));
      if (added.some(file => !samplePath(file.path)))
        throw new Error("Sample renderer emitted a path outside the sample inventory.");
      const next = receiptContent([...files, ...added]);
      await applyPlan(root, [...plan.files, { path: sampleReceipt, previous, content: next }]);
      files.push(...added);
      previous = next;
      results.push({
        generator: plan.generator,
        ...(invocation.variant ? { variant: invocation.variant } : {}),
        name: invocation.name,
      });
    }
    return { dryRun: false, recipes: results, files: files.length, preview: "/dev-guide/frontend/generated" };
  } finally {
    if (lock) {
      await lock.close();
      await unlink(lockPath);
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const rootIndex = args.indexOf("--root");
  const root = rootIndex >= 0 ? args[rootIndex + 1] : workspaceRoot;
  const remaining = rootIndex < 0 ? args : args.filter((_, index) => index !== rootIndex && index !== rootIndex + 1);
  if (
    !root ||
    remaining.some(arg => arg !== "--dry-run") ||
    remaining.length > 1 ||
    args.filter(arg => arg === "--root").length > 1 ||
    root.startsWith("--")
  ) {
    process.stderr.write("Usage: node tools/generators/samples.mjs [--root directory] [--dry-run]\n");
    process.exitCode = 1;
  } else
    refreshSamples(root, { dryRun: args.includes("--dry-run") }).then(
      result => process.stdout.write(JSON.stringify(result, null, 2) + "\n"),
      error => {
        process.stderr.write(`Sample refresh refused: ${error.message}\n`);
        process.exitCode = 1;
      },
    );
}
