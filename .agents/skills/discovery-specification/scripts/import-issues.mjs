#!/usr/bin/env node
// Node 24, built-ins only. Importing this module never starts a subprocess.
import { readFile, realpath, mkdir, writeFile, rename, open, unlink } from 'node:fs/promises';
import { resolve, dirname, relative, sep, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { validateSource, analyzeSource } from './source.mjs';

export const API_VERSION = '2026-03-10';
export const defaultPackageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hash = value => createHash('sha256').update(value).digest('hex');
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const exactKeys = (value, keys, label) => assert(object(value) && Object.keys(value).every(key => keys.includes(key)) && keys.every(key => Object.hasOwn(value, key)), `Invalid ${label} fields`);
const text = value => typeof value === 'string' && value.trim().length > 0;
const sha = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const repoPattern = /^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9_.-]+$/;
const keyPattern = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*$/;
const issueKinds = ['initiative', 'epic', 'story', 'task', 'decision'];
const readJson = async path => JSON.parse(await readFile(path, 'utf8'));
export const markerFor = (projectId, key) => `<!-- discovery-issue-key: ${projectId}:${key} -->`;
/** Canonical, standalone provenance line; sourceRefs retain manifest order. */
export const provenanceFor = (source, sourceRefs) => `<!-- discovery-source: ${JSON.stringify({ projectId: source.projectId, baselineId: source.baselineId, baselineVersion: source.baselineVersion, contentHash: source.contentHash, sourceRefs: sourceRefs.map(({ kind, id, path }) => ({ kind, id, path })) }).replaceAll('<', '\\u003c').replaceAll('>', '\\u003e')} -->`;

export async function safeFile(root, name) {
  assert(text(name) && !name.includes('\\') && !name.split('/').includes('..') && !name.startsWith('/'), `Unsafe package path: ${name}`);
  const base = await realpath(root);
  const target = await realpath(resolve(base, name));
  const rel = relative(base, target);
  assert(rel && rel !== '..' && !rel.startsWith(`..${sep}`) && !rel.startsWith(sep), `Path escapes package: ${name}`);
  return target;
}

export function pointerAt(value, pointer) {
  assert(typeof pointer === 'string' && (pointer === '' || pointer.startsWith('/')), `Source path must be a JSON Pointer: ${pointer}`);
  if (pointer === '') return value;
  return pointer.slice(1).split('/').reduce((current, token) => {
    assert(!/~(?:[^01]|$)/.test(token), `Invalid JSON Pointer escape: ${pointer}`);
    const key = token.replaceAll('~1', '/').replaceAll('~0', '~');
    assert(current !== null && typeof current === 'object' && Object.hasOwn(current, key), `Unknown source path: ${pointer}`);
    return current[key];
  }, value);
}

function checkCycles(issues, edges, name) {
  const byKey = new Map(issues.map(issue => [issue.key, issue]));
  const visiting = new Set(); const done = new Set();
  function visit(key) {
    assert(!visiting.has(key), `${name} cycle at ${key}`);
    if (done.has(key)) return;
    visiting.add(key);
    for (const next of edges(byKey.get(key))) {
      assert(byKey.has(next), `${key}: unknown ${name} reference ${next}`);
      visit(next);
    }
    visiting.delete(key); done.add(key);
  }
  for (const issue of issues) visit(issue.key);
}

/** Validate local bytes, identity, graph and bodies before any remote operation. */
export async function loadPackage(packageRoot = defaultPackageRoot) {
  const root = await realpath(packageRoot);
  const manifest = await readJson(await safeFile(root, 'issues/manifest.json'));
  exactKeys(manifest, ['schemaVersion', 'packageId', 'reviewStatus', 'repository', 'source', 'labelsFile', 'issues'], 'manifest');
  assert(object(manifest) && manifest.schemaVersion === '1.0.0', 'Unsupported manifest schemaVersion');
  assert(text(manifest.packageId) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.packageId), 'Invalid packageId slug');
  assert(['draft', 'approved'].includes(manifest.reviewStatus), 'Invalid reviewStatus');
  assert(manifest.repository === null || (text(manifest.repository) && repoPattern.test(manifest.repository)), 'Invalid manifest repository');
  const source = manifest.source;
  exactKeys(source, ['projectId', 'baselineId', 'baselineVersion', 'contentHash', 'exportFile', 'exportFileSha256', 'environment'], 'source');
  assert(object(source) && text(source.projectId) && text(source.baselineId) && Number.isInteger(source.baselineVersion) && source.baselineVersion > 0 && sha(source.contentHash) && sha(source.exportFileSha256) && source.environment === 'production', 'Invalid source metadata');
  assert(source.exportFile === 'source/approved-export.json', 'Unexpected exportFile');
  const sourceBytes = await readFile(await safeFile(root, source.exportFile));
  assert(hash(sourceBytes) === source.exportFileSha256, 'Export file SHA-256 mismatch');
  const snapshot = JSON.parse(sourceBytes.toString('utf8'));
  validateSource(snapshot, source);
  const sourceRecords = new Set(analyzeSource(snapshot).records.map(record => JSON.stringify([record.kind, record.id, record.path])));
  assert(manifest.labelsFile === 'issues/labels.json', 'Unexpected labelsFile');
  const labels = await readJson(await safeFile(root, manifest.labelsFile));
  assert(Array.isArray(labels), 'Labels must be an array');
  const labelNames = new Set();
  for (const label of labels) {
    exactKeys(label, ['name', 'color', 'description'], 'label');
    assert(object(label) && text(label.name) && /^[a-fA-F0-9]{6}$/.test(label.color) && typeof label.description === 'string', 'Invalid label');
    assert(!labelNames.has(label.name.toLowerCase()), `Duplicate label: ${label.name}`);
    labelNames.add(label.name.toLowerCase());
  }
  assert(Array.isArray(manifest.issues) && manifest.issues.length > 0, 'Manifest has no issues');
  const keys = new Set(); const bodies = new Map();
  for (const issue of manifest.issues) {
    exactKeys(issue, ['key', 'kind', 'title', 'bodyFile', 'parent', 'blockedBy', 'decisionBlockers', 'sourceRefs', 'labels', 'ownerBoundary', 'readiness'], 'issue');
    assert(object(issue) && keyPattern.test(issue.key) && !keys.has(issue.key), `Invalid or duplicate issue key: ${issue?.key}`);
    keys.add(issue.key);
    assert(issueKinds.includes(issue.kind) && text(issue.title) && text(issue.ownerBoundary), `${issue.key}: missing issue metadata`);
    assert(issue.parent === null || (typeof issue.parent === 'string' && keyPattern.test(issue.parent)), `${issue.key}: invalid parent`);
    for (const field of ['blockedBy', 'decisionBlockers', 'labels']) assert(Array.isArray(issue[field]) && issue[field].every(text) && new Set(issue[field]).size === issue[field].length, `${issue.key}: invalid ${field}`);
    assert(issue.labels.every(label => labelNames.has(label.toLowerCase())), `${issue.key}: unknown label`);
    assert(['ready-for-spec-review', 'blocked-by-decision'].includes(issue.readiness), `${issue.key}: invalid readiness`);
    assert(issue.readiness === (issue.decisionBlockers.length ? 'blocked-by-decision' : 'ready-for-spec-review'), `${issue.key}: readiness disagrees with decision blockers`);
    assert(Array.isArray(issue.sourceRefs) && issue.sourceRefs.length > 0, `${issue.key}: missing sourceRefs`);
    for (const ref of issue.sourceRefs) {
      exactKeys(ref, ['kind', 'id', 'path'], 'source reference');
      assert(object(ref) && text(ref.kind) && text(ref.id) && typeof ref.path === 'string', `${issue.key}: invalid source reference`);
      pointerAt(snapshot, ref.path);
      assert(sourceRecords.has(JSON.stringify([ref.kind, ref.id, ref.path])), `${issue.key}: source ID/kind does not match path: ${ref.id}`);
    }
    assert(issue.bodyFile === `bodies/${issue.key}.md`, `${issue.key}: bodyFile must use its stable key`);
    const body = await readFile(await safeFile(root, `issues/${issue.bodyFile}`), 'utf8');
    const marker = markerFor(source.projectId, issue.key);
    assert(body.split(marker).length === 2 && (body.match(/<!-- discovery-issue-key:/g) ?? []).length === 1, `${issue.key}: missing or duplicate exact source marker`);
    const provenance = provenanceFor(source, issue.sourceRefs);
    assert(body.split('\n').includes(provenance) && (body.match(/<!-- discovery-source:/g) ?? []).length === 1, `${issue.key}: missing, duplicate or mismatched exact source provenance`);
    for (const heading of ['Source', 'Acceptance', 'Dependencies']) assert(new RegExp(`^##+ .*${heading}.*$`, 'mi').test(body), `${issue.key}: missing ${heading} section`);
    assert(!body.includes('<!-- discovery-resolved-links:'), `${issue.key}: body contains reserved generated footer`);
    bodies.set(issue.key, body.trimEnd() + '\n');
  }
  const issuesByKey = new Map(manifest.issues.map(issue => [issue.key, issue]));
  for (const issue of manifest.issues) {
    for (const key of issue.decisionBlockers) {
      assert(issuesByKey.has(key), `${issue.key}: unknown decision blocker ${key}`);
      assert(issuesByKey.get(key).kind === 'decision', `${issue.key}: decision blocker ${key} is not a decision issue`);
      assert(issue.blockedBy.includes(key), `${issue.key}: decision blocker ${key} must also appear in blockedBy`);
    }
  }
  checkCycles(manifest.issues, issue => issue.parent ? [issue.parent] : [], 'parent');
  checkCycles(manifest.issues, issue => issue.blockedBy, 'blocker');
  return { root, manifest, labels, bodies, snapshot };
}

export function offlinePlan(pkg, { repo = null, relationships = 'native' } = {}) {
  assert(repo === null || repoPattern.test(repo), 'Use --repo OWNER/REPO');
  assert(['native', 'body-links'].includes(relationships), 'Use --relationships native|body-links');
  assert(!repo || !pkg.manifest.repository || pkg.manifest.repository.toLowerCase() === repo.toLowerCase(), 'Target differs from manifest repository');
  return {
    mode: 'offline', packageId: pkg.manifest.packageId, reviewStatus: pkg.manifest.reviewStatus,
    repository: repo ?? pkg.manifest.repository, relationships,
    source: pkg.manifest.source,
    labels: [...pkg.labels].sort((a, b) => a.name.localeCompare(b.name, 'en')),
    issues: [...pkg.manifest.issues].sort((a, b) => a.key.localeCompare(b.key, 'en')).map(issue => ({ ...issue, bodySha256: hash(pkg.bodies.get(issue.key)) })),
    notice: 'Local validation only. Draft issues require specification review; no implementation authorization is implied.',
  };
}

/** Injectable REST transport; JSON payloads travel on stdin, never through a shell. */
export function createGhTransport() {
  return async (method, endpoint, payload) => new Promise((accept, reject) => {
    const args = ['api', '--hostname', 'github.com', '--method', method, '-H', 'Accept: application/vnd.github+json', '-H', `X-GitHub-Api-Version: ${API_VERSION}`, endpoint];
    if (payload !== undefined) args.push('--input', '-');
    const child = spawn('gh', args, { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, GH_PROMPT_DISABLED: '1', GH_PAGER: 'cat' } });
    let stdout = ''; let stderr = '';
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.stdin.on('error', () => {});
    child.on('close', code => {
      if (code !== 0) {
        const error = new Error(`gh ${method} ${endpoint} failed: ${stderr.trim()}`);
        error.status = Number(stderr.match(/HTTP (\d{3})/)?.[1]) || null;
        reject(error); return;
      }
      try { accept(stdout.trim() ? JSON.parse(stdout) : null); } catch { reject(new Error(`Invalid JSON from ${method} ${endpoint}`)); }
    });
    child.stdin.end(payload === undefined ? undefined : JSON.stringify(payload));
  });
}

async function paginate(request, endpoint) {
  const all = [];
  for (let page = 1; ; page++) {
    const rows = await request('GET', `${endpoint}${endpoint.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
    assert(Array.isArray(rows), `Expected paginated array at ${endpoint}`);
    all.push(...rows);
    if (rows.length < 100) return all;
  }
}

async function atomicState(path, value) {
  const temp = `${path}.${randomUUID()}.tmp`;
  try { await writeFile(temp, JSON.stringify(value, null, 2) + '\n', { mode: 0o600, flag: 'wx' }); await rename(temp, path); }
  finally { await unlink(temp).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
}

function checkRemoteIssue(issue, repo) {
  assert(Number.isSafeInteger(issue?.number) && issue.number > 0 && Number.isSafeInteger(issue.id) && issue.id > 0, 'Remote issue missing numeric database ID or issue number');
  assert(issue.repository_url?.toLowerCase() === `https://api.github.com/repos/${repo}`.toLowerCase() && issue.html_url?.toLowerCase() === `https://github.com/${repo}/issues/${issue.number}`.toLowerCase(), 'Remote issue belongs to another repository');
}

function resolvedBody(pkg, issue, remote, repo) {
  const lines = [`<!-- discovery-resolved-links: ${issue.key} -->`, '## Resolved issue links', ''];
  if (issue.parent) lines.push(`Parent: https://github.com/${repo}/issues/${remote.get(issue.parent).number}`);
  for (const key of issue.blockedBy) lines.push(`Blocked by ${key}: https://github.com/${repo}/issues/${remote.get(key).number}`);
  for (const key of pkg.manifest.issues.filter(other => other.parent === issue.key).map(other => other.key).sort()) lines.push(`Child ${key}: https://github.com/${repo}/issues/${remote.get(key).number}`);
  if (lines.length === 3) lines.push('No issue relationships.');
  return pkg.bodies.get(issue.key) + '\n' + lines.join('\n') + '\n';
}

/** Explicit apply only; transport injection makes tests fully offline. */
export async function runImport(pkg, options = {}, injectedTransport) {
  const plan = offlinePlan(pkg, options);
  if (!options.apply) return plan;
  const { repo, relationships = 'native' } = options;
  assert(text(repo) && repoPattern.test(repo), '--apply requires explicit --repo OWNER/REPO');
  const canonicalRepo = repo.toLowerCase();
  const directory = resolve(pkg.root, '.import-state');
  await mkdir(directory, { recursive: true });
  assert(await realpath(directory) === directory, 'Import state directory must not be a symlink');
  const statePath = resolve(directory, canonicalRepo.replace('/', '--') + '.json');
  const lockPath = statePath + '.lock';
  let lock;
  try { lock = await open(lockPath, 'wx', 0o600); } catch (error) {
    if (error.code === 'EEXIST') throw new Error(`Import lock exists: ${lockPath}. Confirm no importer is running before removing a stale lock.`);
    throw error;
  }
  try {
    let state;
    try { state = await readJson(statePath); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    if (!state) state = { schemaVersion: '1.0.0', repository: canonicalRepo, projectId: pkg.manifest.source.projectId, issues: {} };
    assert(state.schemaVersion === '1.0.0' && state.repository === canonicalRepo && state.projectId === pkg.manifest.source.projectId && object(state.issues), 'Import state belongs to another repository/project or has invalid shape');
    const transport = injectedTransport ?? createGhTransport();
    const request = async (method, endpoint, payload) => {
      try { return await transport(method, endpoint, payload); }
      catch (error) {
        if (method === 'POST') throw new Error(`${error.message}. Write outcome may be unknown; no automatic retry. Rerun to recover by exact issue markers and relationship reads.`, { cause: error });
        throw error;
      }
    };
    const base = `repos/${repo}`;
    const repository = await request('GET', base);
    assert(repository.full_name?.toLowerCase() === canonicalRepo && repository.has_issues === true, 'Repository identity mismatch or issues disabled');
    const all = await paginate(request, `${base}/issues?state=all`);
    const remote = new Map();
    for (const item of all) {
      if (item.pull_request) continue;
      for (const issue of pkg.manifest.issues) {
        const marker = markerFor(pkg.manifest.source.projectId, issue.key);
        const count = (item.body ?? '').split(marker).length - 1;
        if (!count) continue;
        checkRemoteIssue(item, repo);
        assert(count === 1 && !remote.has(issue.key), `Duplicate exact marker for ${issue.key}; resolve manually before importing`);
        assert(![...remote.values()].some(previous => previous.id === item.id), `One remote issue contains multiple package markers: #${item.number}`);
        remote.set(issue.key, item);
      }
    }
    for (const [key, saved] of Object.entries(state.issues)) {
      assert(object(saved) && Number.isSafeInteger(saved.id) && Number.isSafeInteger(saved.number), `Invalid state entry ${key}`);
      const found = remote.get(key);
      assert(found && found.id === saved.id && found.number === saved.number, `${key}: saved issue missing/moved or marker removed; refusing duplicate creation`);
    }
    // Detect manual edits before labels, issue creation, or relationship writes.
    for (const issue of pkg.manifest.issues) {
      const current = remote.get(issue.key);
      if (!current) continue;
      const saved = state.issues[issue.key];
      const exactLocal = current.body === pkg.bodies.get(issue.key);
      const completeGraph = [issue.parent, ...issue.blockedBy, ...pkg.manifest.issues.filter(other => other.parent === issue.key).map(other => other.key)].filter(Boolean).every(key => remote.has(key));
      const exactResolved = completeGraph && current.body === resolvedBody(pkg, issue, remote, repo);
      assert(saved?.bodySha256 ? hash(current.body ?? '') === saved.bodySha256 || exactResolved : exactLocal || exactResolved, `${issue.key}: manual body drift; reconcile package and remote issue before applying. No remote writes performed.`);
    }
    // Inspect native capabilities and existing relationships before the first write.
    const parents = new Map(); const blockers = new Map();
    if (relationships === 'native') {
      // Successful sub-issue list + dependency reads establish API support. A parent
      // 404 alone cannot distinguish absent parent from an unsupported endpoint.
      const probe = all.find(item => !item.pull_request);
      if (probe) {
        await paginate(request, `${base}/issues/${probe.number}/sub_issues`);
        await paginate(request, `${base}/issues/${probe.number}/dependencies/blocked_by`);
      }
      for (const issue of pkg.manifest.issues) {
        const current = remote.get(issue.key);
        if (!current) continue;
        if (issue.parent) {
          try { parents.set(issue.key, await request('GET', `${base}/issues/${current.number}/parent`)); }
          catch (error) { if (error.status !== 404) throw error; parents.set(issue.key, null); }
          const existing = parents.get(issue.key);
          assert(!existing || existing.id === remote.get(issue.parent)?.id, `${issue.key}: existing parent conflicts; importer never replaces parents`);
        }
        if (issue.blockedBy.length) blockers.set(issue.key, await paginate(request, `${base}/issues/${current.number}/dependencies/blocked_by`));
      }
    }
    const existingLabels = await paginate(request, `${base}/labels`);
    for (const label of pkg.labels) if (!existingLabels.some(existing => existing.name.toLowerCase() === label.name.toLowerCase())) await request('POST', `${base}/labels`, label);
    const confirmedLabels = await paginate(request, `${base}/labels`);
    assert(pkg.labels.every(label => confirmedLabels.some(existing => existing.name.toLowerCase() === label.name.toLowerCase())), 'Required labels were not created');
    const report = { mode: 'applied', repository: repo, relationships, created: [], recovered: [] };
    for (const issue of pkg.manifest.issues) {
      let current = remote.get(issue.key);
      if (!current) {
        current = await request('POST', `${base}/issues`, { title: issue.title, body: pkg.bodies.get(issue.key), labels: issue.labels });
        checkRemoteIssue(current, repo);
        assert(current.body === pkg.bodies.get(issue.key), `${issue.key}: created body did not match request; rerun for marker recovery`);
        remote.set(issue.key, current);
        state.issues[issue.key] = { id: current.id, number: current.number, bodySha256: hash(current.body) };
        await atomicState(statePath, state);
        report.created.push(issue.key);
      } else if (!state.issues[issue.key]) {
        // Trust a recovered body only if it exactly equals the current local body.
        state.issues[issue.key] = { id: current.id, number: current.number, bodySha256: hash(current.body) };
        await atomicState(statePath, state);
        report.recovered.push(issue.key);
      }
      const present = new Set((current.labels ?? []).map(label => (typeof label === 'string' ? label : label.name).toLowerCase()));
      const missing = issue.labels.filter(label => !present.has(label.toLowerCase()));
      if (missing.length) await request('POST', `${base}/issues/${current.number}/labels`, { labels: missing });
      const verified = await request('GET', `${base}/issues/${current.number}`);
      checkRemoteIssue(verified, repo);
      assert(issue.labels.every(label => verified.labels?.some(value => (typeof value === 'string' ? value : value.name).toLowerCase() === label.toLowerCase())), `${issue.key}: required labels missing after import`);
      remote.set(issue.key, verified);
    }
    // An empty repository has no issue on which to probe these endpoints until
    // creation. Fail explicitly here if native relationships are unavailable;
    // created issues remain recoverable by their exact markers on the next run.
    if (relationships === 'native' && !all.some(item => !item.pull_request)) {
      const first = remote.values().next().value;
      await paginate(request, `${base}/issues/${first.number}/sub_issues`);
      await paginate(request, `${base}/issues/${first.number}/dependencies/blocked_by`);
    }
    for (const issue of pkg.manifest.issues) {
      const current = remote.get(issue.key);
      if (relationships === 'native') {
        if (issue.parent && !parents.get(issue.key)) await request('POST', `${base}/issues/${remote.get(issue.parent).number}/sub_issues`, { sub_issue_id: current.id });
        const existing = blockers.get(issue.key) ?? [];
        for (const key of issue.blockedBy) if (!existing.some(other => other.id === remote.get(key).id)) await request('POST', `${base}/issues/${current.number}/dependencies/blocked_by`, { issue_id: remote.get(key).id });
        if (issue.parent) {
          const verifiedParent = await request('GET', `${base}/issues/${current.number}/parent`);
          assert(verifiedParent.id === remote.get(issue.parent).id, `${issue.key}: native parent was not confirmed`);
        }
        if (issue.blockedBy.length) {
          const verifiedBlockers = await paginate(request, `${base}/issues/${current.number}/dependencies/blocked_by`);
          assert(issue.blockedBy.every(key => verifiedBlockers.some(other => other.id === remote.get(key).id)), `${issue.key}: native blockers were not confirmed`);
        }
      }
      const desired = resolvedBody(pkg, issue, remote, repo);
      // Fetch immediately before a body update to detect edits made during import.
      const latest = await request('GET', `${base}/issues/${current.number}`);
      const saved = state.issues[issue.key];
      if (latest.body === desired) { saved.bodySha256 = hash(desired); await atomicState(statePath, state); continue; }
      assert(saved.bodySha256 && hash(latest.body ?? '') === saved.bodySha256, `${issue.key}: body changed during import; reconcile manually before rerunning`);
      const updated = await request('PATCH', `${base}/issues/${current.number}`, { body: desired });
      assert(updated.body === desired, `${issue.key}: body update was not confirmed`);
      saved.bodySha256 = hash(desired);
      await atomicState(statePath, state);
    }
    return report;
  } finally { await lock.close(); await unlink(lockPath); }
}

export async function main(argv = process.argv.slice(2)) {
  const options = { apply: false, relationships: 'native', packageRoot: defaultPackageRoot };
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--apply') { assert(!options.apply, 'Duplicate --apply'); options.apply = true; }
    else if (['--package', '--repo', '--relationships'].includes(arg)) {
      const value = argv[++index]; assert(value && !value.startsWith('--'), `Missing value for ${arg}`);
      options[{ '--package': 'packageRoot', '--repo': 'repo', '--relationships': 'relationships' }[arg]] = value;
    } else if (arg === '--help') { process.stdout.write('Usage: node tools/import-issues.mjs --package PATH [--repo OWNER/REPO] [--relationships native|body-links] [--apply]\nDefault: validate and print an offline JSON plan. --apply requires explicit --repo. Omit --package only for tools copied inside an output package.\n'); return; }
    else throw new Error(`Unknown argument: ${arg}`);
  }
  assert(argv.includes('--package') || basename(dirname(fileURLToPath(import.meta.url))) === 'tools', 'Canonical skill script requires --package PATH');
  assert(!options.apply || options.repo, '--apply requires explicit --repo OWNER/REPO');
  const { validatePackage } = await import('./validate-package.mjs');
  await validatePackage(options.packageRoot);
  const pkg = await loadPackage(options.packageRoot);
  process.stdout.write(JSON.stringify(await runImport(pkg, options), null, 2) + '\n');
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => { process.stderr.write(`Import failed: ${error.message}\n`); process.exitCode = 1; });
}
