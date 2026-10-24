import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { startLocalDevelopment } from "./start-local.mjs";

test("rejects a healthy reused volume with a different password and preserves its data", () => {
  const directory = mkdtempSync(join(tmpdir(), "starter-local-start-test-"));
  const project = `starter-start-test-${randomBytes(8).toString("hex")}`;
  const original = randomBytes(24).toString("hex");
  const changed = randomBytes(24).toString("hex");
  const envFile = join(directory, ".env");
  const compose = [
    "compose",
    "--file",
    join(directory, "compose.yaml"),
    "--env-file",
    envFile,
  ];
  const env = { ...process.env, COMPOSE_PROJECT_NAME: project };
  const fixture = (password) =>
    [
      `COMPOSE_PROJECT_NAME=${project}`,
      "POSTGRES_DB=verification",
      "POSTGRES_USER=verification",
      `POSTGRES_PASSWORD=${password}`,
      "POSTGRES_PORT=55436",
      "",
    ].join("\n");
  writeFileSync(
    join(directory, "compose.yaml"),
    readFileSync(new URL("../compose.yaml", import.meta.url), "utf8").replace(
      '"127.0.0.1:${POSTGRES_PORT:-55436}:5432"',
      '"127.0.0.1::5432"',
    ),
  );
  writeFileSync(envFile, fixture(original), { mode: 0o600 });
  const run = (args, extraEnv = {}) =>
    spawnSync("docker", [...compose, ...args], {
      cwd: directory,
      env: { ...env, ...extraEnv },
      encoding: "utf8",
    });
  const query = (sql) =>
    run(
      [
        "exec",
        "--no-TTY",
        "--env",
        "PGPASSWORD",
        "postgres",
        "psql",
        "--host",
        "postgres",
        "--username",
        "verification",
        "--dbname",
        "verification",
        "--no-password",
        "--tuples-only",
        "--no-align",
        "--command",
        sql,
      ],
      { PGPASSWORD: original },
    );
  try {
    startLocalDevelopment(directory);
    assert.equal(
      query(
        "CREATE TABLE preserved_data (value INTEGER); INSERT INTO preserved_data VALUES (7)",
      ).status,
      0,
    );
    writeFileSync(envFile, fixture(changed));
    // This is the old VS Code prelaunch behavior: health succeeds despite bad credentials.
    assert.equal(run(["up", "--detach", "--wait", "postgres"]).status, 0);
    assert.throws(
      () => startLocalDevelopment(directory),
      (error) => {
        assert.match(
          error.message,
          /healthy but rejects backend\/\.env credentials/,
        );
        assert.equal(
          error.message.includes(original) || error.message.includes(changed),
          false,
        );
        return true;
      },
    );
    writeFileSync(envFile, fixture(original));
    startLocalDevelopment(directory);
    const preserved = query("SELECT value FROM preserved_data");
    assert.equal(preserved.status, 0);
    assert.equal(preserved.stdout.trim(), "7");
  } finally {
    // Only this test's random project and freshly created volume are removed.
    const cleanup = run(["down", "--volumes"]);
    rmSync(directory, { recursive: true, force: true });
    assert.equal(
      cleanup.status,
      0,
      "Could not clean up the test-owned Compose project",
    );
  }
});
