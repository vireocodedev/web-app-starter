import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { startPreparationCli } from "./preparation/server.mjs";
import { workbookTemplate } from "./preparation/model.mjs";
import { argumentsFor, skillDirectory } from "./workspace.mjs";

try {
  const { root, selected } = argumentsFor(process.argv.slice(2), [
    "--no-open",
    "--template",
  ]);
  if (selected.has("--template")) {
    process.stdout.write(
      workbookTemplate(
        await readFile(
          join(skillDirectory, "references/preparation.md"),
          "utf8",
        ),
      ),
    );
  } else {
    await startPreparationCli({
      root,
      openBrowser: !selected.has("--no-open"),
    });
  }
} catch (error) {
  console.error(`Preparation startup failed: ${error.message}`);
  process.exitCode = 1;
}
