import { resolve, join } from "node:path";
import { readFile, lstat } from "node:fs/promises";
import { homedir } from "node:os";
import { parseEnv } from "node:util";
import { sha256Pattern, validateSource } from "./source.mjs";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

const defaultApiUrl = "https://clientdiscovery.vireocode.com/api";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Profiles are dotenv data, never shell scripts. Read the default only for missing credentials. */
export async function readProfile(profile, needed = true) {
  if (!profile && !needed) return {};
  const path = profile ? resolve(profile) : join(homedir(), '.config', 'client-discovery', 'production.env');
  let stat;
  try { stat = await lstat(path); } catch (error) {
    if (!profile && error.code === 'ENOENT') return {};
    throw new Error('Discovery credential profile could not be read.');
  }
  if (!stat.isFile() || stat.isSymbolicLink() || (stat.mode & 0o077) !== 0 || (process.getuid && stat.uid !== process.getuid())) throw new Error('Discovery credential profile must be an owner-only regular file (chmod 600).');
  let configured;
  try { configured = parseEnv(await readFile(path, 'utf8')); } catch { throw new Error('Discovery credential profile is invalid.'); }
  const allowed = ['DISCOVERY_USERNAME', 'DISCOVERY_PASSWORD', 'DISCOVERY_API_URL'];
  if (Object.keys(configured).some(key => !allowed.includes(key))) throw new Error('Discovery credential profile contains unsupported keys.');
  return configured;
}

function httpError(status, path) {
  const error = new Error(`Discovery ${path} returned HTTP ${status}.`);
  error.status = status;
  return error;
}

export async function fetchExportCapture(
  projectId,
  {
    apiUrl,
    username = process.env.DISCOVERY_USERNAME,
    password = process.env.DISCOVERY_PASSWORD,
    timeoutMs = 15_000,
    profile,
  } = {},
) {
  const configured = await readProfile(profile, !username || !password);
  username ||= configured.DISCOVERY_USERNAME;
  password ||= configured.DISCOVERY_PASSWORD;
  apiUrl ||= process.env.DISCOVERY_API_URL || configured.DISCOVERY_API_URL || defaultApiUrl;
  if (typeof projectId !== "string" || !uuid.test(projectId))
    throw new Error("projectId must be a UUID.");
  if (
    typeof username !== "string" ||
    !username ||
    typeof password !== "string" ||
    !password
  ) {
    throw new Error(
      "Set DISCOVERY_USERNAME and DISCOVERY_PASSWORD to an administrator's credentials.",
    );
  }
  const base = new URL(apiUrl);
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname);
  if (
    base.username ||
    base.password ||
    base.search ||
    base.hash ||
    (base.protocol !== "https:" && !(base.protocol === "http:" && loopback))
  ) {
    throw new Error(
      "DISCOVERY_API_URL must use HTTPS (HTTP is allowed on loopback only), without credentials, query or fragment.",
    );
  }
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1)
    throw new Error("timeoutMs must be a positive integer.");
  base.pathname = base.pathname.replace(/\/$/, "") + "/";
  const cookies = new Map();
  const request = async (path, { method = "GET", body, headers = {} } = {}) => {
    let response;
    try {
      response = await fetch(new URL(path, base), {
        method,
        redirect: "error",
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          Accept: "application/json",
          Origin: base.origin,
          Cookie: [...cookies]
            .map(([name, value]) => `${name}=${value}`)
            .join("; "),
          ...headers,
        },
        body,
      });
    } catch {
      throw new Error(
        `Discovery ${path} could not be reached, timed out or redirected.`,
      );
    }
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(";", 1)[0];
      const separator = pair.indexOf("=");
      if (separator > 0)
        cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
    }
    return response;
  };
  const requireSuccess = (response, path) => {
    if (!response.ok) throw httpError(response.status, path);
    return response;
  };
  const json = async (response, path) => {
    requireSuccess(response, path);
    try {
      return await response.json();
    } catch {
      throw new Error(`Discovery ${path} did not return valid JSON.`);
    }
  };
  const mutate = async (path, body) => {
    const csrf = await json(await request("auth/csrf"), "auth/csrf");
    if (
      csrf.headerName !== "X-CSRF-TOKEN" ||
      typeof csrf.token !== "string" ||
      !csrf.token
    ) {
      throw new Error("Discovery returned an invalid CSRF token.");
    }
    requireSuccess(
      await request(path, {
        method: "POST",
        headers: {
          "X-CSRF-TOKEN": csrf.token,
          "Content-Type": "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      path,
    );
  };

  let loggedIn = false;
  let failed = false;
  try {
    await mutate("auth/login", { username, password });
    loggedIn = true;
    const path = `discovery/projects/${projectId}`;
    const response = await request(path);
    if (response.status === 404) return null;
    const project = await json(response, path);
    if (project?.canManage === false)
      throw httpError(403, "export (administrator required)");
    if (
      project?.canManage !== true ||
      !Array.isArray(project.baselines) ||
      project.baselines.some(
        (baseline) => !baseline || typeof baseline !== "object",
      )
    ) {
      throw new Error("Discovery returned invalid project metadata.");
    }
    const locked = project.baselines.filter(
      (baseline) => baseline.state === "LOCKED",
    );
    if (
      locked.some(
        (baseline) =>
          !uuid.test(baseline.id) ||
          !sha256Pattern.test(baseline.hash) ||
          !Number.isSafeInteger(baseline.version) ||
          baseline.version < 1,
      )
    ) {
      throw new Error("Discovery returned invalid locked-baseline metadata.");
    }
    if (new Set(locked.map(b => b.id.toLowerCase())).size !== locked.length || new Set(locked.map(b => b.version)).size !== locked.length) throw new Error("Discovery returned ambiguous locked-baseline metadata.");
    const baseline = locked.sort((a, b) => b.version - a.version)[0];
    if (!baseline) return null;
    const exportPath = `${path}/baselines/${baseline.id}/export`;
    const exported = await request(exportPath);
    // The project may have been deleted or its baseline removed between reads.
    if (exported.status === 404 || exported.status === 409) return null;
    requireSuccess(exported, exportPath);
    const text = await exported.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Discovery export did not return valid JSON.");
    }
    validateSource(data, { projectId, baselineId: baseline.id, baselineVersion: baseline.version, contentHash: baseline.hash });
    return { data, text, baseline, apiUrl: base.href.replace(/\/$/, "") };
  } catch (error) {
    failed = true;
    throw error;
  } finally {
    try {
      if (loggedIn) await mutate("auth/logout");
    } catch (error) {
      if (!failed) throw error;
    } finally {
      cookies.clear();
    }
  }
}

/** Return the newest locked export, or null when no export is available. */
export async function fetchProjectExport(projectId, options) {
  return (await fetchExportCapture(projectId, options))?.data ?? null;
}

async function main() {
  const { values, positionals } = parseArgs({
    options: {
      "api-url": { type: "string" },
      profile: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
    allowPositionals: true,
  });
  if (values.help) {
    process.stdout.write(
      "Usage: node fetch-export.mjs <projectId> [--api-url URL] [--profile PATH]\n\nSet DISCOVERY_USERNAME and DISCOVERY_PASSWORD. DISCOVERY_API_URL defaults to the production /api URL.\nPrints the original export JSON, or null if unavailable. Errors go to stderr with exit code 1.\n",
    );
    return;
  }
  if (positionals.length !== 1)
    throw new Error("Provide exactly one projectId. Use --help for usage.");
  const result = await fetchExportCapture(positionals[0], {
    apiUrl: values["api-url"],
    profile: values.profile,
  });
  // Keep canonical bytes and numeric precision intact for the specification handoff.
  process.stdout.write(result?.text ?? "null\n");
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    process.stderr.write(`Export fetch failed: ${error.message}\n`);
    process.exitCode = 1;
  });
}
