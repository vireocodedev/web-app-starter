import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const defaultDirectory = fileURLToPath(new URL("../", import.meta.url));

/** Start only this checkout's database and verify the same password Java uses. */
export function startLocalDevelopment(directory = defaultDirectory) {
  const envFile = resolve(directory, ".env");
  const values = parseEnv(readFileSync(envFile, "utf8"));
  for (const key of ["POSTGRES_DB", "POSTGRES_USER", "POSTGRES_PASSWORD"]) {
    if (!values[key])
      throw new Error(
        `Missing ${key} in backend/.env. Run setup-local.mjs first.`,
      );
  }
  const env = { ...process.env, ...values };
  // Avoid inheriting another checkout's Compose identity from a parent terminal.
  env.COMPOSE_PROJECT_NAME =
    values.COMPOSE_PROJECT_NAME || "vireocode-web-app-starter-local";
  const compose = [
    "compose",
    "--file",
    resolve(directory, "compose.yaml"),
    "--env-file",
    envFile,
  ];
  const started = spawnSync(
    "docker",
    [...compose, "up", "--detach", "--wait", "postgres"],
    {
      cwd: directory,
      env,
      stdio: "inherit",
    },
  );
  if (started.error || started.status !== 0) {
    throw new Error(
      "Local PostgreSQL did not start. Check Docker access and the configured loopback port.",
    );
  }
  // Service DNS reaches the container interface, where password authentication
  // applies. Loopback/socket probes and pg_isready may succeed with trust auth.
  const verified = spawnSync(
    "docker",
    [
      ...compose,
      "exec",
      "--no-TTY",
      "--env",
      "PGPASSWORD",
      "postgres",
      "psql",
      "--host",
      "postgres",
      "--username",
      values.POSTGRES_USER,
      "--dbname",
      values.POSTGRES_DB,
      "--no-password",
      "--tuples-only",
      "--no-align",
      "--command",
      "SELECT 1",
    ],
    {
      cwd: directory,
      env: { ...env, PGPASSWORD: values.POSTGRES_PASSWORD },
      encoding: "utf8",
    },
  );
  if (
    verified.error ||
    verified.status !== 0 ||
    verified.stdout.trim() !== "1"
  ) {
    throw new Error(
      "Local PostgreSQL is healthy but rejects backend/.env credentials. " +
        "Its persistent volume keeps the password used when it was initialized. " +
        "Restore the matching credentials or use a separate COMPOSE_PROJECT_NAME and free POSTGRES_PORT. " +
        "Existing database data has not been changed.",
    );
  }
  console.log("Local PostgreSQL started and password authentication verified.");
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    startLocalDevelopment();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
