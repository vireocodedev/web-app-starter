import { execFile } from 'node:child_process';
import { constants } from 'node:fs';
import { lstat, mkdir, open, readFile, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual, parseArgs, promisify } from 'node:util';
import { discoveryConnection, normalizeApiUrl, withDiscoverySession } from './discovery-client.mjs';
import { preparationContract, sha256 } from './fetch-preparation.mjs';
import { renderWorkbook, validatePreparation } from './preparation/model.mjs';
import { defaultRoot, verifyWorkspace } from './workspace.mjs';

const execute = promisify(execFile);
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
const hash = value => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const owned = stat => !process.getuid || stat.uid === process.getuid();
const same = (left, right) => typeof left === 'string' && typeof right === 'string' && left.toLowerCase() === right.toLowerCase();
const phases = ['intake', 'identity', 'local', 'ci', 'environments', 'staging', 'production', 'recovery', 'handoff'];
const phaseStates = ['pending', 'in_progress', 'passed', 'blocked'];
const utc = value => {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4}-\d\d-\d\dT\d\d:\d\d)(?::(\d\d))?(?:\.\d{1,9})?(?:Z|\+00:00)$/.exec(value);
  const time = Date.parse(value);
  return !!match && Number.isFinite(time) && new Date(time).toISOString().slice(0, 16) === match[1] && new Date(time).toISOString().slice(17, 19) === (match[2] ?? '00');
};
const unavailable = status => ({ status });

async function privateJson(path) {
  let stat;
  try { stat = await lstat(path); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  if (!stat.isFile() || stat.isSymbolicLink() || !owned(stat) || (stat.mode & 0o077) || stat.size > 131072) throw new Error('invalid-private-evidence');
  const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const current = await file.stat();
    if (!current.isFile() || !owned(current) || (current.mode & 0o077) || current.size > 131072) throw new Error('invalid-private-evidence');
    return JSON.parse(await file.readFile('utf8'));
  } finally { await file.close(); }
}

async function privateDirectory(directory, create = false) {
  if (create) await mkdir(directory, { mode: 0o700 }).catch(error => { if (error.code !== 'EEXIST') throw error; });
  try {
    const stat = await lstat(directory);
    if (!stat.isDirectory() || stat.isSymbolicLink() || !owned(stat) || (stat.mode & 0o077)) throw new Error('invalid-private-evidence');
    return true;
  } catch (error) { if (error.code === 'ENOENT' && !create) return false; throw error; }
}

async function repositoryFor(root) {
  try {
    const { stdout } = await execute('git', ['remote', 'get-url', 'origin'], { cwd: root, timeout: 5000 });
    return /^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)([a-z\d-]+\/[a-z\d_.-]+?)(?:\.git)?\s*$/i.exec(stdout)?.[1] ?? null;
  } catch { return null; }
}

function recordedPhases(record) {
  if (!object(record.phases)) return null;
  const result = {};
  for (const phase of phases) {
    const state = object(record.phases[phase]) ? record.phases[phase].status : record.phases[phase];
    if (state !== undefined && !phaseStates.includes(state)) return null;
    result[phase] = state ?? 'unrecorded';
  }
  return result;
}

/** Local receipts describe recorded evidence only; no remote deployment is probed. */
export async function inspectLocalInitialization(root, repository) {
  const result = { status: 'unrecorded', evidence: 'recorded-only' };
  const records = [];
  try {
    const directory = join(root, '.template-initialization');
    if (await privateDirectory(directory)) {
      const state = await privateJson(join(directory, 'state.json'));
      if (state !== null) records.push({ data: state, source: 'state' });
    }
  } catch { result.state = 'invalid'; }
  try {
    const path = join(root, 'docs/acceptance/initialization-acceptance.json');
    const stat = await lstat(path);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1048576) throw new Error('invalid');
    records.unshift({ data: JSON.parse(await readFile(path, 'utf8')), source: 'acceptance' });
  } catch (error) { if (error.code !== 'ENOENT') result.acceptance = 'invalid'; }
  if (result.acceptance === 'invalid') return { ...result, status: 'invalid-evidence' };
  for (const { data: record, source } of records) {
    if (!object(record)) return { ...result, status: 'invalid-evidence' };
    const name = source === 'state' && object(record.repository) ? record.repository.name : record.repository;
    if (!repository || !same(name, repository) || same(repository, 'vireocodedev/web-app-starter')) return { ...result, status: 'repository-mismatch' };
    const recorded = recordedPhases(record);
    if (!recorded) return { ...result, status: 'invalid-evidence' };
    const nextPhase = phases.find(phase => recorded[phase] !== 'passed');
    const ready = source === 'state' && object(record.completion)
      ? record.completion.ready === true && record.completion.all_nine_phases_passed === true
      : record.ready === true;
    // The public acceptance receipt takes precedence over private resume state.
    if (ready && !nextPhase) return { ...result, status: 'recorded-complete', phases: recorded };
    return { ...result, status: 'recorded-incomplete', phases: recorded, nextPhase: nextPhase ?? 'handoff' };
  }
  if (result.state === 'invalid') result.status = 'invalid-evidence';
  return result;
}

/** Validate the GET envelope locally without exporting or retaining the workbook. */
export function summarizePreparation(data, pinned, { projectId, repository, now = Date.now() }) {
  const invalid = { status: 'expired/invalid', validationFields: [] };
  if (!object(data) || !same(data.projectId, projectId) || data.formatVersion !== 1 || !Number.isSafeInteger(data.revision) || data.revision < 0 || !object(data.validationErrors)) return invalid;
  if (data.revision === 0) return { status: 'absent', revision: 0 };
  const draft = { version: 1, answers: data.answers, prerequisites: data.prerequisites, approvals: data.approvals, replacements: data.replacements, step: 0 };
  let errors, markdown;
  try {
    errors = validatePreparation(pinned.schema, draft, { repository, now });
    markdown = renderWorkbook(pinned.schema, draft);
  } catch { return invalid; }
  const allowed = new Set([...pinned.schema.fields.map(field => field.id), 'replacements', ...Array.from({ length: 10 }, (_, index) => `prerequisite-${index}`), ...Array.from({ length: 10 }, (_, index) => `approval-${index}`)]);
  if (Object.keys(data.validationErrors).some(id => !allowed.has(id))) return invalid;
  const validationFields = [...new Set([...Object.keys(errors), ...Object.keys(data.validationErrors)])].sort();
  const missingFields = pinned.schema.fields.filter(field => !draft.answers[field.id] || draft.answers[field.id] === 'REQUIRED').map(field => field.id);
  const result = { revision: data.revision, validationFields, missingFields, reviewed: false };
  if (validationFields.length) return { ...result, status: data.review ? 'expired/invalid' : 'needs-completion' };
  if (!data.review) return { ...result, status: 'needs-review' };
  const review = data.review;
  if (!object(review) || review.revision !== data.revision || !utc(review.reviewedAt) || Date.parse(review.reviewedAt) > now || !uuid(review.reviewedBy) || !hash(review.workbookSha256) || review.workbookSha256 !== sha256(markdown)) return { ...result, status: 'expired/invalid' };
  return { ...result, reviewed: true, status: draft.answers.execution_mode === 'plan-only' ? 'reviewed-plan' : 'execution-ready' };
}

function candidateSummary(candidate) {
  if (!object(candidate) || !uuid(candidate.id) || !Number.isSafeInteger(candidate.version) || candidate.version < 1 || !['IN_REVIEW', 'LOCKED', 'DISCARDED'].includes(candidate.state) || !hash(candidate.hash) || !uuid(candidate.requiredClientId) || !Array.isArray(candidate.approvals)) return null;
  const admins = new Set(), clients = new Set(), users = new Set();
  for (const approval of candidate.approvals) {
    if (!object(approval) || !uuid(approval.userId) || !['ADMIN', 'CLIENT'].includes(approval.role) || approval.hash !== candidate.hash || !utc(approval.approvedAt) || users.has(approval.userId.toLowerCase())) return null;
    users.add(approval.userId.toLowerCase());
    if (approval.role === 'ADMIN') admins.add(approval.userId.toLowerCase());
    if (approval.role === 'CLIENT' && same(approval.userId, candidate.requiredClientId)) clients.add(approval.userId.toLowerCase());
  }
  const missingApprovals = [];
  if (!admins.size) missingApprovals.push('administrator');
  if (!clients.size) missingApprovals.push('designated-client');
  const lockValid = candidate.state === 'LOCKED' && utc(candidate.lockedAt) && !missingApprovals.length && candidate.approvals.every(approval => Date.parse(approval.approvedAt) <= Date.parse(candidate.lockedAt));
  if (candidate.state === 'LOCKED' && !lockValid || candidate.state !== 'LOCKED' && candidate.lockedAt != null) return null;
  return { id: candidate.id.toLowerCase(), version: candidate.version, state: candidate.state, approvalCount: candidate.approvals.length, missingApprovals, exportEligible: lockValid };
}

/** Current working scope and an older locked baseline are independent streams. */
export function summarizeScope(project) {
  if (object(project) && project.canManage === false) return unavailable('access-denied');
  if (!object(project) || project.canManage !== true || !['DRAFT', 'IN_REVIEW', 'LOCKED'].includes(project.draftState) || !Array.isArray(project.baselines)) return unavailable('invalid-metadata');
  const candidates = [], ids = new Set(), versions = new Set();
  for (const candidate of project.baselines) {
    const summary = candidateSummary(candidate);
    if (!summary || ids.has(summary.id) || versions.has(summary.version)) return { status: 'invalid-metadata', currentState: project.draftState };
    ids.add(summary.id); versions.add(summary.version); candidates.push(summary);
  }
  candidates.sort((left, right) => right.version - left.version);
  const active = candidates.filter(candidate => candidate.state === 'IN_REVIEW');
  const latestCandidate = candidates.find(candidate => candidate.state !== 'DISCARDED') ?? null;
  const lockedBaseline = candidates.find(candidate => candidate.state === 'LOCKED') ?? null;
  if (active.length > 1 || project.draftState === 'IN_REVIEW' && latestCandidate?.state !== 'IN_REVIEW' || project.draftState !== 'IN_REVIEW' && active.length || project.draftState === 'LOCKED' && latestCandidate?.state !== 'LOCKED') return { status: 'invalid-metadata', currentState: project.draftState };
  return { status: lockedBaseline ? 'export-ready' : 'not-export-ready', currentState: project.draftState, latestCandidate, lockedBaseline };
}

function nextAction(summary) {
  if (summary.binding.status !== 'resolved') return { code: summary.binding.status === 'project-required' ? 'supply-project-id' : 'resolve-binding' };
  if (summary.project.status !== 'available') return { code: summary.project.status === 'access-not-configured' ? 'configure-access' : 'check-project-access' };
  const initialized = summary.initialization.status === 'recorded-complete';
  if (!initialized) {
    if (!summary.repository || summary.canonicalTemplate) return { code: 'select-consumer-checkout' };
    if (['invalid-evidence', 'repository-mismatch'].includes(summary.initialization.status)) return { code: 'resolve-initialization-evidence' };
    const status = summary.preparation.status;
    if (['absent', 'needs-completion', 'expired/invalid'].includes(status)) return { code: 'complete-preparation' };
    if (status === 'needs-review') return { code: 'review-preparation' };
    if (status === 'reviewed-plan') return { code: 'choose-execution-scope' };
    if (status !== 'execution-ready') return { code: 'resolve-preparation-api' };
    return { code: 'initialize-or-resume' };
  }
  if (summary.scope.status === 'invalid-metadata') return { code: 'resolve-scope-metadata' };
  if (!summary.scope.latestCandidate || summary.scope.currentState === 'DRAFT') return { code: 'complete-scope' };
  if (summary.scope.currentState === 'IN_REVIEW') return { code: summary.scope.latestCandidate.missingApprovals.length ? 'obtain-scope-approvals' : 'lock-scope' };
  if (summary.scope.lockedBaseline) return { code: 'choose-specification-output', prompt: 'Choose the specification output folder for this locked baseline.' };
  return { code: 'complete-scope' };
}

function validProvenance(value) {
  return object(value) && value.formatVersion === 1 && uuid(value.projectId) && Number.isSafeInteger(value.revision) && value.revision > 0 && utc(value.reviewedAt) && typeof value.reviewedBy === 'string' && !!value.reviewedBy.trim() && hash(value.workbookSha256) && typeof value.apiUrl === 'string' && utc(value.capturedAt);
}

async function rememberProject(directory, binding) {
  await privateDirectory(directory, true);
  const path = join(directory, 'discovery-project.json');
  const existing = await privateJson(path);
  if (existing) {
    if (!isDeepStrictEqual(existing, binding)) throw new Error('binding-conflict');
    return;
  }
  const handle = await open(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
  let written = false;
  try { await handle.writeFile(JSON.stringify(binding, null, 2) + '\n'); await handle.sync(); written = true; }
  finally { await handle.close(); if (!written) await unlink(path); }
}

export async function projectStatus({ projectId, root = defaultRoot, remember = false, now = Date.now(), ...options } = {}) {
  const explicitProject = projectId !== undefined;
  root = await verifyWorkspace(root);
  const repository = await repositoryFor(root);
  const summary = { formatVersion: 1, repository, projectId: null, apiUrl: null, canonicalTemplate: same(repository, 'vireocodedev/web-app-starter'), binding: { status: 'project-required', source: null, remembered: false }, project: unavailable('not-requested'), initialization: await inspectLocalInitialization(root, repository), preparation: unavailable('unavailable'), scope: unavailable('unavailable') };
  const finish = () => ({ ...summary, nextAction: nextAction(summary) });
  const directory = join(root, '.template-initialization');
  let binding, provenance;
  try {
    if (await privateDirectory(directory)) {
      binding = await privateJson(join(directory, 'discovery-project.json'));
      provenance = await privateJson(join(directory, 'preparation-provenance.json'));
    }
    if (binding && (!object(binding) || Object.keys(binding).sort().join() !== ['apiUrl', 'formatVersion', 'projectId', 'repository'].sort().join() || binding.formatVersion !== 1 || !uuid(binding.projectId) || !same(binding.repository, repository) || normalizeApiUrl(binding.apiUrl) !== binding.apiUrl)) throw new Error('invalid-binding');
    if (provenance && !validProvenance(provenance)) throw new Error('invalid-provenance');
    if (projectId !== undefined && !uuid(projectId)) throw new Error('invalid-project-id');
    const selected = projectId ?? binding?.projectId ?? provenance?.projectId;
    if (!selected) return finish();
    summary.projectId = selected.toLowerCase();
    if ([binding?.projectId, provenance?.projectId].some(id => id && !same(id, selected))) throw new Error('binding-conflict');
    projectId = selected.toLowerCase();
    summary.binding = { status: 'resolved', source: explicitProject ? 'explicit' : binding ? 'binding' : 'provenance', remembered: !!binding };
  } catch { summary.binding.status = 'invalid-or-conflicting'; return finish(); }
  let connection;
  try {
    connection = await discoveryConnection(options);
    summary.apiUrl = connection.apiUrl;
    if ([binding, provenance].some(value => value && normalizeApiUrl(value.apiUrl) !== connection.apiUrl)) { summary.binding.status = 'source-mismatch'; return finish(); }
    if (!connection.username || !connection.password) { summary.project.status = 'access-not-configured'; return finish(); }
  } catch { summary.project.status = 'access-not-configured'; return finish(); }
  let lookup = false;
  try {
    await withDiscoverySession(connection, async ({ get, apiUrl }) => {
      const project = await get(`discovery/projects/${projectId}`);
      if (!object(project) || !same(project.id, projectId) || !Number.isSafeInteger(project.revision) || project.revision < 0) { summary.project.status = 'invalid-metadata'; return; }
      if (project.canManage !== true) { summary.project.status = project.canManage === false ? 'access-denied' : 'invalid-metadata'; return; }
      lookup = true;
      summary.project = { status: 'available', id: projectId, revision: project.revision };
      summary.scope = summarizeScope(project);
      if (remember) {
        const ignored = await execute('git', ['check-ignore', '--', '.template-initialization/discovery-project.json'], { cwd: root, timeout: 5000 }).catch(() => null);
        if (!ignored?.stdout.trim()) { summary.binding.status = 'private-ignore-required'; return; }
        if (!repository) { summary.binding.status = 'repository-unverified'; return; }
        await rememberProject(directory, { formatVersion: 1, repository, projectId, apiUrl });
        summary.binding.remembered = true;
      }
      try {
        const pinned = await preparationContract();
        const remote = await get('discovery/preparation-schema');
        if (!object(remote) || !Object.keys(pinned.contract).every(key => isDeepStrictEqual(remote[key], pinned.contract[key])) || remote.contractSha256 !== pinned.contractSha256 || remote.templateSha256 !== pinned.templateSha256) { summary.preparation.status = 'schema-mismatch'; return; }
        const preparation = await get(`discovery/projects/${projectId}/preparation`);
        summary.preparation = summarizePreparation(preparation, pinned, { projectId, repository, now });
      } catch (error) {
        summary.preparation = { status: 'unavailable', reason: error.code === 'invalid-json' ? 'invalid-json' : error.status === 404 ? 'unsupported-api' : [401, 403].includes(error.status) ? 'access-denied' : 'request-failed' };
      }
    });
  } catch (error) {
    if (lookup) summary.project = { ...summary.project, status: 'request-failed' };
    else summary.project = unavailable(error.code === 'invalid-json' ? 'invalid-metadata' : error.status === 404 ? 'missing' : [401, 403].includes(error.status) ? 'access-denied' : 'request-failed');
  }
  return finish();
}

async function main() {
  const { values, positionals } = parseArgs({ options: { root: { type: 'string' }, profile: { type: 'string' }, 'api-url': { type: 'string' }, remember: { type: 'boolean' }, help: { type: 'boolean' } }, allowPositionals: true });
  if (values.help) { console.log('Usage: node project-status.mjs [PROJECT_UUID] [--root PATH] [--profile PATH] [--api-url URL] [--remember]'); return; }
  if (positionals.length > 1) throw new Error('Supply only the intended project UUID.');
  console.log(JSON.stringify(await projectStatus({ projectId: positionals[0], root: values.root, profile: values.profile, apiUrl: values['api-url'], remember: values.remember }), null, 2));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(() => { console.error('Project status could not inspect this workspace. Existing files were preserved.'); process.exitCode = 1; });
