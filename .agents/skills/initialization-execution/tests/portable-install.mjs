import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { cp, lstat } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { skillDirectory } from "../scripts/workspace.mjs";
import { workspaceFixture } from "./test-support.mjs";

const execute = promisify(execFile);
const workspace = await workspaceFixture();
try {
  const installed = join(
    workspace.root,
    ".agents/skills/initialization-execution",
  );
  await cp(skillDirectory, installed, {
    recursive: true,
    filter: (path) => !path.split("/").includes("node_modules"),
  });
  await cp(
    join(skillDirectory, "../initialization-intake"),
    join(workspace.root, ".agents/skills/initialization-intake"),
    {
      recursive: true,
      filter: (path) =>
        !path
          .split("/")
          .some((part) => ["node_modules", "state"].includes(part)),
    },
  );
  for (const path of [
    "frontend",
    "backend",
    "docs",
    ".agents/skills/initialization-execution/node_modules",
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
    "Both skills are installed; template-only application and CI contracts are checked in the real checkout.",
  );
} finally {
  await workspace.remove();
}
