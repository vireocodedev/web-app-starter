import { lstat, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseEnv } from 'node:util';
const owned = stat => !process.getuid || stat.uid === process.getuid();

/** Dotenv data only. Credentials never enter workbooks, provenance or logs. */
export async function readProfile(profile, needed = true) {
  if (!profile && !needed) return {};
  const path = profile ? resolve(profile) : join(homedir(), '.config/client-discovery/production.env');
  let stat;
  try { stat = await lstat(path); } catch (error) {
    if (!profile && error.code === 'ENOENT') return {};
    throw new Error('Discovery credential profile could not be read.');
  }
  if (!stat.isFile() || stat.isSymbolicLink() || !owned(stat) || (stat.mode & 0o077)) throw new Error('Discovery credential profile must be an owner-only regular file (chmod 600).');
  let configured;
  try { configured = parseEnv(await readFile(path, 'utf8')); } catch { throw new Error('Discovery credential profile is invalid.'); }
  if (Object.keys(configured).some(key => !['DISCOVERY_API_URL', 'DISCOVERY_USERNAME', 'DISCOVERY_PASSWORD'].includes(key))) throw new Error('Discovery credential profile contains unsupported keys.');
  return configured;
}

export function normalizeApiUrl(value) {
  let base;
  try { base = new URL(value); } catch { throw new Error('DISCOVERY_API_URL requires HTTPS (HTTP only on loopback), without credentials, query or fragment.'); }
  if (base.username || base.password || base.search || base.hash || (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)))) throw new Error('DISCOVERY_API_URL requires HTTPS (HTTP only on loopback), without credentials, query or fragment.');
  base.pathname = base.pathname.replace(/\/+$/, '') + '/';
  return base.href.replace(/\/$/, '');
}

export async function discoveryConnection(options = {}) {
  let username = options.username ?? process.env.DISCOVERY_USERNAME;
  let password = options.password ?? process.env.DISCOVERY_PASSWORD;
  const configured = await readProfile(options.profile, !username || !password);
  username ||= configured.DISCOVERY_USERNAME;
  password ||= configured.DISCOVERY_PASSWORD;
  const apiUrl = normalizeApiUrl(options.apiUrl || process.env.DISCOVERY_API_URL || configured.DISCOVERY_API_URL || 'https://clientdiscovery.vireocode.com/api');
  return { username, password, apiUrl, timeoutMs: options.timeoutMs };
}

function httpError(status, path) {
  const error = new Error(status === 409 ? 'Preparation is not reviewed at its current revision. Review it in Client Discovery, then retry.' : `Discovery ${path} returned HTTP ${status}.`);
  error.status = status;
  return error;
}

/** Shared session transport. The caller alone chooses project-specific GET endpoints. */
export async function withDiscoverySession(connection, operation) {
  const options = await discoveryConnection(connection);
  if (!options.username || !options.password) throw new Error('Set DISCOVERY_USERNAME and DISCOVERY_PASSWORD in the protected administrator profile.');
  const base = new URL(options.apiUrl + '/');
  if (base.username || base.password || base.search || base.hash || (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)))) throw new Error('DISCOVERY_API_URL requires HTTPS (HTTP only on loopback), without credentials, query or fragment.');
  base.pathname = base.pathname.replace(/\/$/, '') + '/';
  const timeoutMs = options.timeoutMs ?? 15000;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1) throw new Error('timeoutMs must be a positive integer.');
  const cookies = new Map();
  const request = async (path, method = 'GET', body, headers = {}) => {
    let response;
    try {
      response = await fetch(new URL(path, base), { method, body, redirect: 'error', signal: AbortSignal.timeout(timeoutMs), headers: { Accept: 'application/json', Origin: base.origin, Cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join('; '), ...headers } });
    } catch { throw new Error(`Discovery ${path} could not be reached, timed out or redirected.`); }
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(';', 1)[0], separator = pair.indexOf('=');
      if (separator > 0) cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
    }
    if (!response.ok) throw httpError(response.status, path);
    return response;
  };
  const json = async response => { try { return await response.json(); } catch { const error = new Error('Discovery returned invalid preparation JSON.'); error.code = 'invalid-json'; throw error; } };
  const mutate = async (path, body) => {
    const csrf = await json(await request('auth/csrf'));
    if (csrf.headerName !== 'X-CSRF-TOKEN' || typeof csrf.token !== 'string' || !csrf.token) throw new Error('Discovery returned an invalid CSRF token.');
    await request(path, 'POST', body === undefined ? undefined : JSON.stringify(body), { 'X-CSRF-TOKEN': csrf.token, 'Content-Type': 'application/json' });
  };
  let loggedIn = false, failed = false;
  try {
    await mutate('auth/login', { username: options.username, password: options.password });
    loggedIn = true;
    return await operation({ get: async path => json(await request(path)), apiUrl: options.apiUrl });
  } catch (error) { failed = true; throw error; }
  finally {
    try { if (loggedIn) await mutate('auth/logout'); } catch (error) { if (!failed) throw error; }
    finally { cookies.clear(); }
  }
}
