import { execFile } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, mkdir, open, readFile, rename, unlink } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual, parseArgs, promisify } from 'node:util';
import { defaultRoot, skillDirectory, verifyWorkspace } from './workspace.mjs';
import { fixed, importWorkbook, options, parseTemplate, validatePreparation } from './preparation/model.mjs';

import { withDiscoverySession } from './discovery-client.mjs';
export { readProfile } from './discovery-client.mjs';

const execute = promisify(execFile);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const hash = /^[0-9a-f]{64}$/;
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const owned = stat => !process.getuid || stat.uid === process.getuid();
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const timestamp = value => typeof value === 'string' && /^\d{4}-\d\d-\d\dT.*(?:Z|\+00:00)$/.test(value) && Number.isFinite(Date.parse(value));

export async function preparationContract() {
  const markdown = await readFile(join(skillDirectory, 'references/preparation.md'), 'utf8');
  const bytes = await readFile(join(skillDirectory, 'references/preparation-contract.json'));
  const contract = JSON.parse(bytes);
  const schema = parseTemplate(markdown);
  if (contract.formatVersion !== 1 || !isDeepStrictEqual(contract.fields, schema.fields) || !isDeepStrictEqual(contract.topics, schema.steps) || !isDeepStrictEqual(contract.prerequisites, schema.prerequisites) || !isDeepStrictEqual(contract.approvals, schema.approvals) || !isDeepStrictEqual(contract.options, options) || !isDeepStrictEqual(contract.fixed, fixed)) throw new Error('Bundled preparation contract and template differ.');
  return { contract, schema, contractSha256: sha256(bytes), templateSha256: sha256(markdown) };
}

/** Authenticate once and request only the supplied project; never enumerate projects. */
export async function fetchReviewedPreparation(projectId, options = {}) {
  if (typeof projectId !== 'string' || !uuid.test(projectId)) throw new Error('projectId must be a UUID.');
  return withDiscoverySession(options, async ({ get, apiUrl }) => {
    const pinned = await preparationContract();
    const schema = await get('discovery/preparation-schema');
    if (!object(schema) || !Object.keys(pinned.contract).every(key => isDeepStrictEqual(schema[key], pinned.contract[key])) || (schema.contractSha256 !== undefined && schema.contractSha256 !== pinned.contractSha256) || (schema.templateSha256 !== undefined && schema.templateSha256 !== pinned.templateSha256)) throw new Error('Discovery preparation schema differs from this initializer. Update the portable package deliberately.');
    const data = await get(`discovery/projects/${projectId}/preparation/export`);
    return { data, apiUrl };
  });
}

/** Pure, headless validation also supports existing manually prepared format-1 files. */
export function inspectWorkbook(schema, markdown, { repository, now = Date.now() } = {}) {
  const draft = importWorkbook(schema, markdown);
  const errors = validatePreparation(schema, draft, { repository, now });
  if (!repository || repository.toLowerCase() === 'vireocodedev/web-app-starter') errors.repository = 'Select a verified consumer checkout; the canonical template cannot be initialized.';
  else if (draft.answers.repository && draft.answers.repository.toLowerCase() !== repository.toLowerCase()) errors.repository = 'The workbook repository differs from this checkout.';
  return { executionMode: draft.answers.execution_mode, repository, errors, missingFields: schema.fields.filter(field => !draft.answers[field.id]).map(field => field.id), signer: draft.answers.approval_signer, signedAt: draft.answers.approval_signed_at, expiresAt: draft.answers.approval_expires_at };
}

export async function validateReviewedExport(data, projectId, context) {
  const pinned = await preparationContract();
  if (!object(data) || !uuid.test(data.projectId) || data.projectId.toLowerCase() !== projectId.toLowerCase() || data.formatVersion !== 1 || !Number.isSafeInteger(data.revision) || data.revision < 1 || !timestamp(data.reviewedAt) || typeof data.reviewedBy !== 'string' || !data.reviewedBy.trim() || typeof data.markdown !== 'string' || Buffer.byteLength(data.markdown) > 131072 || !hash.test(data.workbookSha256) || sha256(data.markdown) !== data.workbookSha256) throw new Error('Reviewed preparation project, revision, review metadata, format or exact workbook SHA-256 is invalid.');
  for (const key of ['contractSha256', 'templateSha256']) if (data[key] !== undefined && data[key] !== pinned[key]) throw new Error(`Reviewed preparation ${key} differs from this initializer.`);
  const readiness = inspectWorkbook(pinned.schema, data.markdown, context);
  if (Object.keys(readiness.errors).length) {
    const error = new Error(`Preparation readiness blocked: ${Object.keys(readiness.errors).join(', ')}. Correct and review the app revision; existing files were preserved.`);
    error.readiness = readiness;
    throw error;
  }
  return readiness;
}

async function optionalPrivateFile(path) {
  let stat;
  try { stat = await lstat(path); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  if (!stat.isFile() || stat.isSymbolicLink() || !owned(stat) || (stat.mode & 0o077) || stat.size > 131072) throw new Error('Private preparation files must be owner-only regular files; existing files were preserved.');
  const stream = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
  try { return await stream.readFile(); } finally { await stream.close(); }
}

async function protectDirectory(path) {
  const stat = await lstat(path);
  if (!stat.isDirectory() || stat.isSymbolicLink() || !owned(stat) || (stat.mode & 0o077)) throw new Error('Use a user-owned mode 0700 .template-initialization directory.');
}

async function actualRepository(root) {
  const { stdout } = await execute('git', ['remote', 'get-url', 'origin'], { cwd: root, timeout: 5000 });
  return /^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)([a-z\d-]+\/[a-z\d_.-]+?)(?:\.git)?\s*$/i.exec(stdout)?.[1] ?? null;
}

/** Explicit refresh is the only replacement path. Initialized acceptance is immutable here. */
export async function capturePreparation({ projectId, root = defaultRoot, refresh = false, now = Date.now(), ...connection } = {}) {
  root = await verifyWorkspace(root);
  const repository = await actualRepository(root);
  if (!repository || repository.toLowerCase() === 'vireocodedev/web-app-starter') throw new Error('Select a verified consumer checkout, never the canonical template.');
  const directory = join(root, '.template-initialization');
  const names = ['preparation.md', 'preparation-provenance.json', 'preparation-capture.lock', 'state.json', 'readiness.md'];
  const ignored = await execute('git', ['check-ignore', '--', ...names.map(name => `.template-initialization/${name}`)], { cwd: root, timeout: 5000 }).catch(() => { throw new Error('Ignore the entire /.template-initialization/ directory before private capture.'); });
  if (ignored.stdout.trim().split('\n').length !== names.length) throw new Error('Ignore the entire /.template-initialization/ directory before private capture.');
  try { await mkdir(directory, { mode: 0o700 }); } catch (error) { if (error.code !== 'EEXIST') throw error; }
  await protectDirectory(directory);
  const stateBytes = await optionalPrivateFile(join(directory, 'state.json'));
  let state;
  try { state = stateBytes ? JSON.parse(stateBytes) : null; } catch { throw new Error('Existing initialization state is invalid; it was preserved.'); }
  let acceptanceExists = false;
  try { await lstat(join(root, 'docs/acceptance/initialization-acceptance.json')); acceptanceExists = true; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (state?.completion?.status === 'ready' || acceptanceExists) return { status: 'completed-preserved', repository };
  const lockPath = join(directory, 'preparation-capture.lock');
  const lock = await open(lockPath, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600).catch(() => { throw new Error('Preparation capture is locked. Inspect the existing lock before explicitly removing a stale one.'); });
  try {
    await lock.writeFile(JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }) + '\n');
    const workbookPath = join(directory, 'preparation.md'), provenancePath = join(directory, 'preparation-provenance.json');
    const previous = await optionalPrivateFile(workbookPath), previousReceipt = await optionalPrivateFile(provenancePath);
    let receipt;
    try { receipt = previousReceipt ? JSON.parse(previousReceipt) : null; } catch { throw new Error('Existing preparation provenance is invalid; it was preserved.'); }
    if (previousReceipt && (!object(receipt) || receipt.formatVersion !== 1 || !uuid.test(receipt.projectId ?? '') || !Number.isSafeInteger(receipt.revision) || receipt.revision < 1 || !hash.test(receipt.workbookSha256 ?? '') || !timestamp(receipt.reviewedAt) || typeof receipt.reviewedBy !== 'string' || !receipt.reviewedBy.trim())) throw new Error('Existing preparation provenance is invalid; it was preserved.');
    if (receipt && (!previous || receipt.workbookSha256 !== sha256(previous)) && !refresh) throw new Error('Existing workbook differs from its pinned provenance; reconcile it explicitly before capture.');
    if (!projectId) {
      if (!previous) throw new Error('Supply the production projectId, or preserve an existing manual preparation workbook.');
      const pinned = await preparationContract();
      return { status: 'existing-workbook', ...inspectWorkbook(pinned.schema, previous.toString('utf8'), { repository, now }), workbookSha256: sha256(previous), provenance: receipt };
    }
    const { data, apiUrl } = await fetchReviewedPreparation(projectId, connection);
    const readiness = await validateReviewedExport(data, projectId, { repository, now });
    const same = previous && sha256(previous) === data.workbookSha256;
    const sameSource = !receipt || (receipt.projectId?.toLowerCase() === data.projectId.toLowerCase() && receipt.revision === data.revision && receipt.reviewedAt === data.reviewedAt && receipt.reviewedBy === data.reviewedBy && receipt.workbookSha256 === data.workbookSha256);
    if ((previous && !same || !sameSource) && !refresh) throw new Error('A differing workbook or pinned revision exists. Explicitly request a refresh; existing preparation was preserved.');
    const latestState = await optionalPrivateFile(join(directory, 'state.json'));
    if ((stateBytes && sha256(stateBytes)) !== (latestState && sha256(latestState))) throw new Error('Initialization state changed during capture; existing preparation was preserved.');
    try { await lstat(join(root, 'docs/acceptance/initialization-acceptance.json')); return { status: 'completed-preserved', repository }; } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const provenance = { formatVersion: 1, projectId: data.projectId, revision: data.revision, reviewedAt: data.reviewedAt, reviewedBy: data.reviewedBy, workbookSha256: data.workbookSha256, ...(data.contractSha256 ? { contractSha256: data.contractSha256 } : {}), ...(data.templateSha256 ? { templateSha256: data.templateSha256 } : {}), apiUrl, capturedAt: new Date(now).toISOString() };
    const write = async (path, bytes, expected) => {
      const temporary = join(directory, `.preparation-pending-${randomUUID()}`);
      try {
        const handle = await open(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
        try { await handle.writeFile(bytes); await handle.sync(); } finally { await handle.close(); }
        await protectDirectory(directory);
        const current = await optionalPrivateFile(path);
        if ((current && sha256(current)) !== (expected && sha256(expected))) throw new Error('Private preparation changed during capture; existing data was preserved.');
        await rename(temporary, path);
        const parent = await open(directory, constants.O_RDONLY | constants.O_DIRECTORY);
        try { await parent.sync(); } finally { await parent.close(); }
      } finally { await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
    };
    if (!same) await write(workbookPath, data.markdown, previous);
    if (!receipt || !sameSource || !same) await write(provenancePath, JSON.stringify(provenance, null, 2) + '\n', previousReceipt);
    return { status: same ? 'reused' : 'captured', ...readiness, workbookSha256: data.workbookSha256, provenance: receipt && same && sameSource ? receipt : provenance };
  } finally { await lock.close(); await unlink(lockPath); }
}

async function main() {
  const { values, positionals } = parseArgs({ options: { root: { type: 'string' }, profile: { type: 'string' }, 'api-url': { type: 'string' }, refresh: { type: 'boolean' }, help: { type: 'boolean' } }, allowPositionals: true });
  if (values.help) { console.log('Usage: node fetch-preparation.mjs [PROJECT_UUID] [--root PATH] [--profile PATH] [--refresh]'); return; }
  if (positionals.length > 1) throw new Error('Supply only the intended production projectId.');
  const result = await capturePreparation({ projectId: positionals[0], root: values.root, profile: values.profile, apiUrl: values['api-url'], refresh: values.refresh });
  console.log(JSON.stringify(result, null, 2));
  if (result.errors && Object.keys(result.errors).length) process.exitCode = 1;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode = 1; });
