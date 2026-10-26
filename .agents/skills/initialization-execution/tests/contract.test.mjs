import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { defaultRoot, skillDirectory } from "../scripts/workspace.mjs";

const execute = promisify(execFile);
const intakeDirectory = resolve(skillDirectory, "../initialization-intake");
const exists = async (path) =>
  stat(path).then(
    () => true,
    () => false,
  );

test("both complete skill packages ship with valid entrypoints and resolvable public references", async () => {
  for (const directory of [intakeDirectory, skillDirectory]) {
    const entry = await readFile(join(directory, "SKILL.md"), "utf8");
    assert.match(
      entry,
      new RegExp(`^---\\nname: ${directory.split("/").at(-1)}\\n`),
    );
    for (const section of ["## Start", "## Workflow", "## Finish"])
      assert.ok(entry.includes(section));
    const references = (await readdir(join(directory, "references"))).filter(
      (name) => name.endsWith(".md"),
    );
    for (const file of [
      "SKILL.md",
      ...references.map((name) => `references/${name}`),
    ]) {
      const source = join(directory, file);
      const content = await readFile(source, "utf8");
      for (const match of content.matchAll(/\[[^\]]+\]\(([^)\s]+)\)/g)) {
        const [path] = match[1].split("#");
        if (!path || /^[a-z]+:/i.test(path)) continue;
        const target = resolve(dirname(source), decodeURIComponent(path));
        if (
          !(await exists(join(defaultRoot, "backend"))) &&
          !target.startsWith(resolve(skillDirectory, "..") + "/")
        )
          continue;
        assert.ok(await exists(target), `${source}: missing ${path}`);
      }
    }
  }
});

test("private intake and execution state are ignored and absent from tracked files", async () => {
  for (const path of [
    ".agents/skills/initialization-intake/state/intake.json",
    ".template-initialization/state.json",
  ]) {
    await execute("git", ["check-ignore", "--quiet", path], {
      cwd: defaultRoot,
    });
    const { stdout } = await execute("git", ["ls-files", "--", path], {
      cwd: defaultRoot,
    });
    assert.equal(stdout, "");
  }
});

test("real checkout routes both initialization packages and uses their portable verification", async (t) => {
  if (!(await exists(join(defaultRoot, ".github/workflows/ci.yml"))))
    return t.skip("No template CI in portable fixture");
  const workflow = await readFile(
    join(defaultRoot, ".github/workflows/ci.yml"),
    "utf8",
  );
  assert.ok(
    workflow.includes("package=.agents/skills/initialization-execution"),
  );
  assert.ok(workflow.includes('npm --prefix "$package" run verify'));
  for (const file of ["README.md", "AGENTS.md"]) {
    const text = await readFile(join(defaultRoot, file), "utf8");
    for (const name of ["initialization-intake", "initialization-execution"])
      assert.ok(text.includes(`.agents/skills/${name}/SKILL.md`));
  }
});
