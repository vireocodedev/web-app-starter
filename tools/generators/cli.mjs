#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";

import { createIndexPlan, createPlan } from "./core.mjs";
import { applyPlan, digest } from "./filesystem.mjs";
import { assessCompatibility, compatibilityWeights } from "./policy.mjs";
import { findGenerator, generators } from "./registry.mjs";
import { selectGenerator } from "./terminal-menu.mjs";

const workspaceRoot = fileURLToPath(new URL("../../", import.meta.url));
const help = `Usage: npm run generate -- <frontend|backend> <kind> <Name> [options]
       npm run generate -- --list [--json]
       npm run generate -- assess <frontend/kind|backend/kind> --assessment file.json [--json]
       npm run generate -- index [--dry-run]    Rebuild the mechanical locale index
       npm run generate                         Keyboard menu (TTY only)

Interactive menu: choose Frontend/Backend, then a generator.
↑/↓ move, Space/Enter select, PgUp/PgDn page, Home/End jump.
Esc/← returns to groups; Esc at groups or Ctrl+C cancels.

Options:
  --feature Name        New capability owner (defaults to Name)
  --fields a,b:string?  1–20 lowerCamelCase fields, ? means optional
                        Backend: string, integer, boolean. Frontend: string.
  --variant Name        Shell: simple|workspace; Page: simple|dashboard|detail
                        Backend DTO: request|response (default request)
  --migration N         Explicit new Flyway version (backend domain/feature)
  --dry-run             Validate and print the complete plan without writing
  --json                Machine-readable catalog, plan, result or error
  --root path           Existing isolated starter checkout (default this repo)
  --assessment path     Evidence-based compatibility assessment JSON
  --help                Show this help or selected generator metadata

Generated source is application-owned; existing files are never overwritten.
Only the drift-checked translation index is regenerated. No --force switch.
Use backend feature for a complete read-only shared-authenticated slice.
Visual examples: /dev-guide/frontend/generated/<kind>/<feature>--<name>.
Frontend previews have no backend writes. Product routing remains an explicit decision.
`;

export function parseArguments(argv) {
  const positional = [],
    options = {};
  const flags = new Set(["help", "list", "json", "dry-run"]);
  const values = new Set(["feature", "fields", "variant", "migration", "root", "assessment"]);
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }
    const key = token.slice(2);
    if (!(flags.has(key) || values.has(key))) throw new Error(`Unknown option: ${token}`);
    if (key in options) throw new Error(`Repeated option: ${token}`);
    if (flags.has(key)) options[key] = true;
    else {
      const value = argv[++i];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${token}`);
      options[key] = value;
    }
  }
  return { positional, options };
}

async function interactive() {
  const generator = await selectGenerator(generators);
  const prompt = createInterface({
    input: process.stdin,
    output: process.stderr,
  });
  try {
    const name = (await prompt.question("Name: ")).trim();
    const fields =
      generator.acceptsFields === false
        ? undefined
        : (await prompt.question("Fields (default name; e.g. title,description?): ")).trim() || "name";
    const options = {
      target: generator.target,
      kind: generator.kind,
      name,
      fields,
      ...(generator.variant ? { variant: generator.variant } : {}),
    };
    if (generator.inputs.required.includes("migration"))
      options.migration = (await prompt.question("New Flyway integer version: ")).trim();
    return options;
  } finally {
    prompt.close();
  }
}

export async function main(argv = process.argv.slice(2)) {
  const { positional, options } = parseArguments(argv);
  const json = value => process.stdout.write(JSON.stringify(value, null, 2) + "\n");
  if (options.list) {
    if (positional.length) throw new Error("--list does not accept a generator invocation.");
    if (options.json) json({ schemaVersion: 1, generators, compatibilityWeights });
    else process.stdout.write(generators.map(item => `${item.id.padEnd(22)} ${item.purpose}`).join("\n") + "\n");
    return;
  }
  if (options.help) {
    if (positional.length >= 2) json(findGenerator(positional[0], positional[1]));
    else process.stdout.write(help);
    return;
  }
  const root = path.resolve(options.root ?? workspaceRoot);
  if (positional[0] === "index") {
    if (positional.length !== 1 || Object.keys(options).some(key => !["root", "json", "dry-run"].includes(key)))
      throw new Error("index supports only --root, --json and --dry-run.");
    const files = await createIndexPlan(root);
    if (!options["dry-run"] && files.length) await applyPlan(root, files);
    json({
      schemaVersion: 1,
      operation: "index",
      dryRun: Boolean(options["dry-run"]),
      files: files.map(file => ({
        path: file.path,
        action: "update-index",
        sha256: digest(file.content),
      })),
    });
    return;
  }
  if (positional[0] === "assess") {
    if (positional.length !== 2 || !options.assessment)
      throw new Error("Use assess <frontend/kind|backend/kind> --assessment file.json.");
    const [target, kind, extra] = positional[1].split("/");
    if (extra) throw new Error("Assessment generator ID must be target/kind.");
    const generator = findGenerator(target, kind);
    const policy = JSON.parse(await readFile(path.join(root, "generator-policy.json"), "utf8"));
    const assessment = JSON.parse(await readFile(path.resolve(options.assessment), "utf8"));
    json({
      generator: generator.id,
      ...assessCompatibility(assessment, policy.compatibilityThreshold),
    });
    return;
  }
  let invocation;
  if (!positional.length) {
    if (!process.stdin.isTTY)
      throw new Error("Non-interactive execution requires target, kind and name. Run --help or --list.");
    invocation = { ...options, ...(await interactive()) };
  } else {
    if (positional.length !== 3) throw new Error("Expected <frontend|backend> <kind> <Name>. Run --help.");
    invocation = {
      ...options,
      target: positional[0],
      kind: positional[1],
      name: positional[2],
    };
  }
  if (options.assessment) throw new Error("--assessment is supported only by assess.");
  const plan = await createPlan(root, invocation);
  if (!options["dry-run"]) await applyPlan(root, plan.files);
  const result = {
    schemaVersion: 1,
    generator: plan.generator,
    ...(findGenerator(invocation.target, invocation.kind).variants ? { variant: plan.context.variant } : {}),
    dryRun: Boolean(options["dry-run"]),
    files: plan.files.map(file => ({
      path: file.path,
      action: file.previous === undefined ? "create" : "update-index",
      sha256: digest(file.content),
    })),
    ...(findGenerator(invocation.target, invocation.kind).visual
      ? {
          preview: `/dev-guide/frontend/generated/${invocation.kind}/${plan.context.feature.kebab}--${plan.context.name.kebab}`,
        }
      : {}),
  };
  if (options.json) json(result);
  else
    process.stdout.write(
      `${result.dryRun ? "Dry run" : "Generated"}: ${result.generator}\n${result.files.map(file => `  ${file.action.padEnd(12)} ${file.path}`).join("\n")}\n${result.preview ? `Preview: ${result.preview}\n` : ""}`,
    );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    if (process.argv.includes("--json")) process.stderr.write(JSON.stringify({ error: error.message }) + "\n");
    else
      process.stderr.write(`${error.code === "GENERATOR_CANCELLED" ? "" : "Generation refused: "}${error.message}\n`);
    process.exitCode = error.code === "GENERATOR_CANCELLED" ? 130 : 1;
  });
}
