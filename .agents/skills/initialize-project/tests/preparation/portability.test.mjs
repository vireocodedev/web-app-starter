import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { cp, lstat, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { skillDirectory, verifyWorkspace } from "../../scripts/workspace.mjs";
import { workspaceFixture } from "./test-support.mjs";

const execute = promisify(execFile);

test("only the installed skill starts from another working directory without application files or dependencies", async () => {
  const fixture = await workspaceFixture();
  const installed = join(fixture.root, ".agents/skills/initialize-project");
  let child;
  try {
    await cp(skillDirectory, installed, {
      recursive: true,
      filter: (path) => !path.split("/").includes("node_modules"),
    });
    await assert.rejects(lstat(join(installed, "node_modules")), {
      code: "ENOENT",
    });
    await assert.rejects(lstat(join(fixture.root, "frontend")), {
      code: "ENOENT",
    });
    await assert.rejects(lstat(join(fixture.root, "docs")), { code: "ENOENT" });
    const exported = await execute(
      process.execPath,
      [join(installed, "scripts/prepare.mjs"), "--template"],
      {
        cwd: "/tmp",
      },
    );
    assert.match(
      exported.stdout,
      /\]\(\.\.\/\.agents\/skills\/initialize-project\/references\/contract.md\)/,
    );
    assert.doesNotMatch(exported.stdout, /^- \[x\]/m);
    for (const [, target] of exported.stdout.matchAll(
      /\]\((\.{1,2}\/[^)\s]*)\)/g,
    )) {
      if (target.startsWith("../.agents/"))
        assert.ok(
          await lstat(
            join(
              fixture.root,
              ".template-initialization",
              target.split("#")[0],
            ),
          ),
        );
    }

    child = spawn(
      process.execPath,
      [join(installed, "scripts/prepare.mjs"), "--no-open"],
      {
        cwd: "/tmp",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    const exited = new Promise((accept, reject) => {
      child.once("exit", (code, signal) => accept({ code, signal }));
      child.once("error", reject);
    });
    let output = "";
    await Promise.race([
      new Promise((accept, reject) => {
        const timer = setTimeout(
          () =>
            reject(new Error("Portable launcher did not announce readiness")),
          10000,
        );
        child.stdout.on("data", (data) => {
          output += data;
          if (output.includes("Keep this terminal running.")) {
            clearTimeout(timer);
            accept();
          }
        });
        child.once("error", (error) => {
          clearTimeout(timer);
          reject(error);
        });
        child.once("exit", (code) => {
          clearTimeout(timer);
          reject(new Error(`Launcher exited early: ${code}`));
        });
      }),
      exited.then((result) => {
        throw new Error(`Portable launcher exited: ${JSON.stringify(result)}`);
      }),
    ]);
    const stateDirectory = join(fixture.root, ".template-initialization");
    const { url } = JSON.parse(
      await readFile(join(stateDirectory, "preparation-session.json"), "utf8"),
    );
    const state = await (await fetch(new URL("api/state", url))).json();
    assert.equal(state.context.repository, "example/portal");
    assert.equal(state.context.completed, false);
    assert.equal(state.workbookExists, false);
    assert.equal((await fetch(new URL("client.mjs", url))).status, 200);
    assert.equal((await fetch(new URL("model.mjs", url))).status, 200);
    const reference = await (await fetch(new URL("reference", url))).text();
    assert.match(reference, /Bundled template reference only/);
    assert.match(reference, /0 \/ 9/);
    child.kill("SIGTERM");
    assert.equal((await exited).code, 0);
    child = null;
    await assert.rejects(
      lstat(join(stateDirectory, "preparation-server.lock")),
      { code: "ENOENT" },
    );
  } finally {
    if (child && child.exitCode === null) {
      const stopped = new Promise((accept) => child.once("exit", accept));
      child.kill("SIGTERM");
      await stopped;
    }
    await fixture.remove();
  }
});

test("explicit worktree roots are verified and private files require ignore protection", async () => {
  const fixture = await workspaceFixture();
  try {
    const nested = join(fixture.root, "nested");
    await mkdir(nested);
    await assert.rejects(verifyWorkspace(nested), /worktree root/);
    const { stdout } = await execute(
      process.execPath,
      [
        join(skillDirectory, "scripts/prepare.mjs"),
        "--root",
        fixture.root,
        "--template",
      ],
      { cwd: nested },
    );
    assert.match(stdout, /Prepare a consumer/);
    await writeFile(join(fixture.root, ".gitignore"), "");
    await assert.rejects(
      execute(process.execPath, [
        join(skillDirectory, "scripts/prepare.mjs"),
        "--root",
        fixture.root,
        "--no-open",
      ]),
      (error) => /Ignore .*before starting/.test(error.stderr),
    );
    await assert.rejects(
      lstat(join(fixture.root, ".template-initialization")),
      { code: "ENOENT" },
    );
  } finally {
    await fixture.remove();
  }
});
