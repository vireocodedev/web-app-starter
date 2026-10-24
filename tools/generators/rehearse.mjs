#!/usr/bin/env node
/** Real output rehearsal in a disposable copy; never adds sample features to source. */
import { cp, mkdir, mkdtemp, readFile, readdir, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

import { createIndexPlan, createPlan } from "./core.mjs";
import { applyPlan } from "./filesystem.mjs";
import { sampleInvocations, sampleReceipt } from "./samples.mjs";

const source = fileURLToPath(new URL("../../", import.meta.url));
const args = new Set(process.argv.slice(2));
if ([...args].some(arg => !["--frontend", "--backend", "--browser", "--prepare-only"].includes(arg)))
  throw new Error("Use --frontend, --backend, --browser and/or --prepare-only.");
const fixture = await mkdtemp(path.join(os.tmpdir(), "starter-generator-rehearsal-"));
let samplePaths = new Set();
try {
  samplePaths = new Set(
    JSON.parse(await readFile(path.join(source, sampleReceipt), "utf8")).files.map(file => file.path),
  );
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const excluded = new Set([
  "node_modules",
  ".git",
  ".gradle",
  "build",
  "dist",
  "storybook-static",
  "test-results",
  "playwright-report",
  ".local",
  ".aws",
  ".codex",
  "__pycache__",
]);
for (const entry of [
  "backend",
  "frontend",
  "docs",
  ".agents",
  "tools",
  "infrastructure",
  ".github",
  ".vscode",
  "AGENTS.md",
  "README.md",
  "package.json",
  "generator-policy.json",
]) {
  await cp(path.join(source, entry), path.join(fixture, entry), {
    recursive: true,
    filter: file =>
      !excluded.has(path.basename(file)) &&
      !/^\.env(?:\.|$)/.test(path.basename(file)) &&
      !samplePaths.has(path.relative(source, file)),
  });
}
// Each copy owns compiler/bundler caches; package bytes are reused read-only.
const dependencies = path.join(fixture, "frontend/node_modules");
await mkdir(dependencies);
for (const entry of await readdir(path.join(source, "frontend/node_modules"))) {
  if (entry.startsWith(".") && entry !== ".bin") continue;
  if (entry === "@fontsource-variable") {
    // Vite serves font URLs as files; keep them inside the fixture's filesystem allow list.
    await cp(path.join(source, "frontend/node_modules", entry), path.join(dependencies, entry), { recursive: true });
  } else {
    await symlink(path.join(source, "frontend/node_modules", entry), path.join(dependencies, entry), "junction");
  }
}

const commands = [];
async function run(command, argv, cwd) {
  const started = Date.now();
  process.stdout.write(`\nRehearsal: ${command} ${argv.join(" ")}\n`);
  const code = await new Promise((resolve, reject) => {
    const child = spawn(command, argv, {
      cwd,
      stdio: "inherit",
      env: { ...process.env, GENERATOR_REHEARSAL: "true", RGO_BROWSER_DEV_PORT: "4181" },
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => (signal ? reject(new Error(`Interrupted: ${signal}`)) : resolve(code)));
  });
  commands.push({ command: [command, ...argv], exitCode: code, seconds: (Date.now() - started) / 1000 });
  await writeFile(
    path.join(fixture, "rehearsal.json"),
    JSON.stringify({ source, fixture, generated, commands }, null, 2) + "\n",
  );
  if (code !== 0) throw new Error(`Rehearsal failed (${code}); inspect ${fixture}/rehearsal.json`);
}

const generated = [];
await applyPlan(fixture, await createIndexPlan(fixture));
for (const options of sampleInvocations()) {
  const plan = await createPlan(fixture, options);
  await applyPlan(fixture, plan.files);
  generated.push({ generator: plan.generator, files: plan.files.map(file => file.path) });
}
const migrations = (await readdir(path.join(fixture, "backend/src/main/resources/db/migration"))).map(name =>
  Number(/^V(\d+)/.exec(name)?.[1] ?? 0),
);
const nextVersion = Math.max(...migrations) + 1;
for (const options of [
  { kind: "dto", name: "GeneratorCreateProduct", fields: "title,quantity:integer,active:boolean?" },
  { kind: "dto", name: "GeneratorSummary", variant: "response", fields: "title" },
  {
    kind: "domain",
    name: "GeneratorPart",
    migration: String(nextVersion),
    fields: "title,quantity:integer?,active:boolean",
  },
  { kind: "repository", name: "GeneratorPart", fields: "title,quantity:integer?,active:boolean" },
  { kind: "service", name: "GeneratorPart", fields: "title,quantity:integer?,active:boolean" },
  { kind: "controller", name: "GeneratorPart", fields: "title,quantity:integer?,active:boolean" },
  {
    kind: "feature",
    name: "GeneratorProduct",
    feature: "GeneratorCatalog",
    migration: String(nextVersion + 1),
    fields: "title,quantity:integer?,active:boolean",
  },
]) {
  const plan = await createPlan(fixture, { target: "backend", ...options });
  await applyPlan(fixture, plan.files);
  generated.push({ generator: plan.generator, files: plan.files.map(file => file.path) });
}
await writeFile(
  path.join(fixture, "rehearsal.json"),
  JSON.stringify({ source, fixture, generated, commands }, null, 2) + "\n",
);
process.stdout.write(`Generated fixture: ${fixture}\n`);
if (!args.has("--prepare-only")) {
  const all = !args.has("--frontend") && !args.has("--backend");
  if (all || args.has("--frontend")) {
    const cwd = path.join(fixture, "frontend"),
      npm = process.platform === "win32" ? "npm.cmd" : "npm";
    for (const command of ["format:check", "lint", "verify:architecture", "typecheck"])
      await run(npm, ["run", command], cwd);
    await run(
      npm,
      [
        "run",
        "test",
        "--",
        "tests/features/generator-",
        "tests/app/router/generatedExampleRoutes.test.tsx",
        "--maxWorkers=1",
      ],
      cwd,
    );
    await run(npm, ["run", "build", "--", "--manifest"], cwd);
    const manifest = await readFile(path.join(cwd, "dist/.vite/manifest.json"), "utf8");
    if (
      /\.example\.tsx|generatedExamples|generator-profile|generator-orders|generator-workspace|GeneratorProfile|GeneratorWorkspace|generator-navigation|GeneratorNavigation|generator-page-dashboard|generator-page-detail|generator-form-wizard|generator-form-collection|generator-feature-workspace|generator-page-report/.test(
        manifest,
      )
    )
      throw new Error("Generated example leaked into the production manifest.");
    const chunks = await readdir(path.join(cwd, "dist/assets"));
    for (const chunk of chunks.filter(name => name.endsWith(".js"))) {
      const body = await readFile(path.join(cwd, "dist/assets", chunk), "utf8");
      if (
        /Simulated submission failure|sample-12|generator-profile--generator-profile|Complete submission|Fail the next save or export|Sample data covers 1–14 January 2026/.test(
          body,
        )
      )
        throw new Error(`Generated preview fixture/copy leaked into production: ${chunk}`);
    }
    if (args.has("--browser"))
      await run(npm, ["exec", "--", "playwright", "test", "--config", "playwright.generators.config.ts"], cwd);
  }
  if (all || args.has("--backend"))
    await run(
      process.platform === "win32" ? "gradlew.bat" : "./gradlew",
      ["--no-daemon", "--console=plain", "test", "--tests", "*Generator*", "--tests", "*.architecture.*", "bootJar"],
      path.join(fixture, "backend"),
    );
}
process.stdout.write(`Rehearsal receipt: ${fixture}/rehearsal.json\n`);
