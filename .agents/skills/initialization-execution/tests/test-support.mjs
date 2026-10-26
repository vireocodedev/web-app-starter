import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execute = promisify(execFile);
export async function workspaceFixture() {
  const root = await mkdtemp(join(tmpdir(), "initialization-consumer-"));
  await writeFile(
    join(root, ".gitignore"),
    "/.template-initialization/\n/.agents/skills/initialization-intake/state/\n",
  );
  await execute("git", ["init", "--quiet"], { cwd: root });
  await execute(
    "git",
    ["remote", "add", "origin", "https://github.com/example/portal.git"],
    { cwd: root },
  );
  return { root, remove: () => rm(root, { recursive: true }) };
}
