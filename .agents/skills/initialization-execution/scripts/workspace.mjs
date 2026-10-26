import { execFile } from "node:child_process";
import { realpath } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

export const skillDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const defaultRoot = resolve(skillDirectory, "../../..");
const execute = promisify(execFile);

export async function verifyWorkspace(root = defaultRoot) {
  root = await realpath(root);
  const { stdout } = await execute("git", ["rev-parse", "--show-toplevel"], {
    cwd: root,
    timeout: 5000,
  });
  if ((await realpath(stdout.trim())) !== root)
    throw new Error(
      "Select the consumer Git worktree root, not a nested directory.",
    );
  return root;
}

export function argumentsFor(args, flags = []) {
  let root = defaultRoot;
  const selected = new Set();
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (
      argument === "--root" &&
      args[index + 1] &&
      !args[index + 1].startsWith("--") &&
      !selected.has(argument)
    ) {
      root = resolve(args[++index]);
    } else if (!flags.includes(argument) || selected.has(argument)) {
      throw new Error(
        `Unsupported or duplicate argument: ${argument}. Use --root PATH and ${flags.join(", ")}.`,
      );
    }
    selected.add(argument);
  }
  return { root, selected };
}
