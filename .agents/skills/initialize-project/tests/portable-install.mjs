import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, lstat } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { skillDirectory } from "../scripts/workspace.mjs";
import { workspaceFixture } from "./preparation/test-support.mjs";

const execute = promisify(execFile);
const workspace = await workspaceFixture();
try {
  const installed = join(workspace.root, ".agents/skills/initialize-project");
  await cp(skillDirectory, installed, {
    recursive: true,
    filter: (path) => !path.split("/").includes("node_modules"),
  });
  for (const path of [
    "frontend",
    "backend",
    "docs",
    ".agents/skills/initialize-project/node_modules",
  ])
    await assert.rejects(lstat(join(workspace.root, path)), { code: "ENOENT" });
  for (const args of [
    ["ci", "--ignore-scripts", "--no-audit", "--no-fund"],
    ["run", "docs:build"],
    ["run", "verify"],
  ]) {
    const { stdout, stderr } = await execute("npm", args, {
      cwd: installed,
      timeout: 180000,
      maxBuffer: 4 * 1024 * 1024,
    });
    process.stdout.write(stdout);
    process.stderr.write(stderr);
  }
  console.log(
    "Portable install verified with its own lockfile, dependencies, browser tests and generated documentation.",
  );
  console.log(
    "Only template-specific application/CI/receipt/pointer checks were inapplicable in this skill-only fixture.",
  );
} finally {
  await workspace.remove();
}
