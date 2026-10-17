import assert from 'node:assert/strict';
import { chmod, mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { analyzeSource, validateSource, verifyCheckpointIntegrity } from '../scripts/source.mjs';
import { fetchExportCapture, readProfile } from '../scripts/fetch-export.mjs';
import { fileSha256, prepareOutput } from '../scripts/prepare-output.mjs';
import { captureFixture, sourceFixture } from './fixtures.mjs';

async function temporary(t) {
  const path = await mkdtemp(join(tmpdir(), 'discovery-synthetic-'));
  t.after(() => rm(path, { recursive: true, force: true }));
  return path;
}
function apiFixture(t, { source = sourceFixture(), projectStatus = 200, noLocked = false, failure, exportText } = {}) {
  const original = globalThis.fetch;
  const requests = [];
  const newest = { id: source.baseline.id, version: source.baseline.version, state: 'LOCKED', hash: source.contentHash };
  globalThis.fetch = async (url, options) => {
    const path = new URL(url).pathname.replace(/^\/api\//, '');
    requests.push({ path, ...options });
    assert.equal(options.redirect, 'error');
    if (failure?.path === path) {
      if (failure.error) throw new Error(failure.error);
      return new Response('{}', { status: failure.status });
    }
    if (path === 'auth/csrf') return Response.json({ headerName: 'X-CSRF-TOKEN', token: 'synthetic-csrf' }, { headers: { 'set-cookie': 'SESSION=synthetic; Path=/' } });
    if (['auth/login', 'auth/logout'].includes(path)) {
      assert.equal(options.headers['X-CSRF-TOKEN'], 'synthetic-csrf');
      assert.match(options.headers.Cookie, /SESSION=synthetic/);
      return new Response(null, { status: 204 });
    }
    if (path === `discovery/projects/${source.project.id}`) return Response.json({ canManage: true, baselines: noLocked ? [] : [...(newest.version > 1 ? [{ ...newest, id: '80000000-0000-0000-0000-000000000001', version: newest.version - 1 }] : []), newest, { ...newest, id: '90000000-0000-0000-0000-000000000001', version: 99, state: 'IN_REVIEW' }] }, { status: projectStatus });
    if (path === `discovery/projects/${source.project.id}/baselines/${newest.id}/export`) return new Response(exportText ?? JSON.stringify(source));
    throw new Error('Unexpected or unscoped request');
  };
  t.after(() => { globalThis.fetch = original; });
  return requests;
}
const credentials = { username: 'synthetic-admin', password: 'synthetic-secret', apiUrl: 'https://discovery.example.invalid/api' };

test('two synthetic projects derive different inventories and preserve all custom records', () => {
  for (const variant of [1, 2]) {
    const source = sourceFixture(variant);
    assert.equal(validateSource(source), source);
    const analysis = analyzeSource(source);
    assert.equal(analysis.questions.length, variant === 1 ? 4 : 5);
    assert.equal(analysis.totals.capturedAnswers, 3);
    assert.equal(analysis.records.length, analysis.totals.records);
    for (const kind of ['category', 'category-question', 'requirement', 'feature', 'page', 'entity', 'entity-field', 'reference', 'decision', 'commercial-field', 'history', 'approval']) assert.ok(analysis.records.some(record => record.kind === kind), kind);
    assert.equal(analysis.totals.byKind['commercial-field'], 6);
    assert.ok(analysis.records.some(record => record.path === `/requirements/answers/custom~1${variant}~0detail`));
    assert.equal(analysis.questions.find(q => q.id === `detail.${variant}`).visible, true);
    assert.equal(analysis.questions.find(q => q.id === `count.${variant}`).answer.value, 0);
  }
});

test('conditions require visible confirmed/tentative parents and strict operators/types', () => {
  const source = sourceFixture();
  source.requirements.answers['enabled.1'].status = 'UNDECIDED';
  assert.equal(analyzeSource(source).questions.find(q => q.id === 'detail.1').visible, false);
  source.requirements.answers['enabled.1'].status = 'TENTATIVE';
  source.effectiveCatalog.sections[0].questions[0].visibleWhen = { questionId: 'detail.1', operator: 'equals', value: 'yes' };
  assert.throws(() => analyzeSource(source), /cyclic/);
  for (const rule of [{ questionId: 'missing', operator: 'equals', value: false }, { questionId: 'enabled.1', operator: 'includes', value: false }, { questionId: 'enabled.1', operator: 'equals', value: 'false' }, { questionId: 'enabled.1', operator: 'other', value: false }]) {
    const invalid = sourceFixture(); invalid.effectiveCatalog.sections[0].questions[2].visibleWhen = rule;
    assert.throws(() => validateSource(invalid), /condition|parent/);
  }
  const choices = sourceFixture();
  const parent = choices.effectiveCatalog.sections[0].questions[0];
  parent.type = 'multi'; parent.options = [{ value: 'yes', label: 'Yes' }];
  choices.requirements.answers['enabled.1'].value = ['yes'];
  choices.effectiveCatalog.sections[0].questions[2].visibleWhen = { questionId: parent.id, operator: 'includes', value: 'yes' };
  assert.equal(analyzeSource(choices).questions.find(q => q.id === 'detail.1').visible, true);
});

test('rejects mismatched approvals, identities, schemas, unknown IDs and custom question drift', () => {
  const mutate = [s => { s.schemaVersion = '1.1.0'; }, s => { s.lockedAt = null; }, s => { s.approvals[0].hash = 'f'.repeat(64); }, s => { s.approvals[0].userId = s.approvals[1].userId; }, s => { s.approvals.pop(); }, s => { s.requirements.answers.unknown = { value: false, status: 'CONFIRMED' }; }, s => { s.requirements.categories[0].questions[0].label = 'Changed'; }, s => { s.requirements.pages[0].featureIds = ['missing']; }, s => { s.requirements.entities[0].fields[0].id = s.requirements.features[0].id; }];
  for (const change of mutate) { const source = sourceFixture(); change(source); assert.throws(() => validateSource(source), /Invalid Discovery source/); }
  assert.throws(() => validateSource(sourceFixture(), { projectId: sourceFixture(2).project.id }), /projectId/);
});

test('fetch preserves exact bytes, performs only scoped reads and logs out', async t => {
  const source = sourceFixture(2);
  const raw = ` ${JSON.stringify(source).replace('"value":0', '"value":9007199254740993')}\n`;
  const requests = apiFixture(t, { source, exportText: raw });
  const capture = await fetchExportCapture(source.project.id, credentials);
  assert.equal(capture.text, raw);
  assert.equal(capture.baseline.id, source.baseline.id);
  assert.equal(capture.data.project.id, source.project.id);
  assert.equal(requests.at(-1).path, 'auth/logout');
  assert.equal(requests.filter(r => r.method === 'GET' && r.path.startsWith('discovery/')).length, 2);
});
for (const scenario of [{ name: 'missing project', projectStatus: 404 }, { name: 'no locked baseline', noLocked: true }]) test(`fetch returns null for ${scenario.name}`, async t => {
  const requests = apiFixture(t, scenario);
  assert.equal(await fetchExportCapture(sourceFixture().project.id, credentials), null);
  assert.equal(requests.at(-1).path, 'auth/logout');
});
for (const status of [401, 403, 500]) test(`fetch propagates HTTP ${status} rather than source-unavailable`, async t => {
  apiFixture(t, { failure: { path: `discovery/projects/${sourceFixture().project.id}`, status } });
  await assert.rejects(fetchExportCapture(sourceFixture().project.id, credentials), error => error.status === status && !error.message.includes(credentials.password));
});
test('fetch rejects identity drift and suppresses network error secrets', async t => {
  const raw = JSON.stringify(sourceFixture(2));
  apiFixture(t, { exportText: raw });
  await assert.rejects(fetchExportCapture(sourceFixture().project.id, credentials), /does not match/);
});
test('fetch network failure does not expose credentials or become null', async t => {
  apiFixture(t, { failure: { path: 'auth/csrf', error: credentials.password } });
  await assert.rejects(fetchExportCapture(sourceFixture().project.id, credentials), error => /could not be reached/.test(error.message) && !error.message.includes(credentials.password));
});
test('profile is protected dotenv data, with no shell execution', async t => {
  const directory = await temporary(t), path = join(directory, 'production.env');
  await writeFile(path, 'DISCOVERY_USERNAME=synthetic\nDISCOVERY_PASSWORD="$(echo never-execute)"\n', { mode: 0o600 });
  assert.equal((await readProfile(path)).DISCOVERY_PASSWORD, '$(echo never-execute)');
  const unsafe = join(directory, 'unsafe.env');
  await writeFile(unsafe, 'DISCOVERY_PASSWORD=synthetic', { mode: 0o644 });
  // Creation modes are filtered by the runner's umask; set the unsafe fixture explicitly.
  await chmod(unsafe, 0o644);
  await assert.rejects(readProfile(unsafe), /owner-only/);
  await symlink(path, join(directory, 'linked.env'));
  await assert.rejects(readProfile(join(directory, 'linked.env')), /regular file/);
});
test('prepare preserves bytes, source receipts and standalone tools; resume is offline and retains authored documents', async t => {
  const directory = await temporary(t), output = join(directory, 'package');
  let calls = 0;
  const capture = captureFixture(2);
  const result = await prepareOutput({ projectId: capture.data.project.id, output, capture: async () => { calls++; return capture; } });
  assert.equal(await readFile(join(output, 'source/approved-export.json'), 'utf8'), capture.text);
  assert.equal(result.receipt.exportFileSha256, fileSha256(capture.text));
  assert.equal(result.receipt.contentHash, capture.data.contentHash);
  assert.equal(result.receipt.contentHashRecomputed, false);
  assert.equal(result.state.status, 'collecting');
  assert.equal((await readdir(join(output, 'tools'))).length, 3);
  await writeFile(join(output, 'specification.md'), 'Human-edited specification');
  const resumed = await prepareOutput({ projectId: capture.data.project.id, output, resume: true, capture: () => { throw new Error('Resume must be offline'); } });
  assert.equal(resumed.resumed, true);
  assert.equal(calls, 1);
  assert.equal(await readFile(join(output, 'specification.md'), 'utf8'), 'Human-edited specification');
  assert.ok(!JSON.stringify(result.receipt).includes(credentials.password));
  await assert.rejects(prepareOutput({ projectId: sourceFixture().project.id, output, resume: true }), /does not match/);
  await writeFile(join(output, 'source/analysis.json'), '{}');
  await assert.rejects(prepareOutput({ projectId: capture.data.project.id, output, resume: true }), /changed or missing/);
});
test('initial preparation rejects unavailable or invalid source without partial output', async t => {
  const directory = await temporary(t), output = join(directory, 'package');
  await assert.rejects(prepareOutput({ projectId: sourceFixture().project.id, output, capture: async () => null }), /No locked/);
  assert.deepEqual(await readdir(directory), []);
  await assert.rejects(prepareOutput({ projectId: sourceFixture().project.id, output, capture: async () => captureFixture(2) }), /projectId/);
  assert.deepEqual(await readdir(directory), []);
});
test('preparation rejects nonempty paths and symlink ancestors before reading source', async t => {
  const directory = await temporary(t), output = join(directory, 'occupied');
  await mkdir(output); await writeFile(join(output, 'keep.txt'), 'keep');
  const capture = () => { throw new Error('Must reject before capture'); };
  await assert.rejects(prepareOutput({ projectId: sourceFixture().project.id, output, capture }), /new or empty/);
  await symlink(output, join(directory, 'link'));
  await assert.rejects(prepareOutput({ projectId: sourceFixture().project.id, output: join(directory, 'link', 'package'), capture }), /symlink/);
  assert.equal(await readFile(join(output, 'keep.txt'), 'utf8'), 'keep');
});
test('resume detects changed tool files and symlink substitutions without fetching or overwriting', async t => {
  const directory = await temporary(t), output = join(directory, 'package'), capture = captureFixture();
  await prepareOutput({ projectId: capture.data.project.id, output, capture: async () => capture });
  const tool = join(output, 'tools/source.mjs');
  await rm(tool); await symlink(join(directory, 'outside.mjs'), tool);
  await writeFile(join(directory, 'outside.mjs'), 'Human content');
  await assert.rejects(prepareOutput({ projectId: capture.data.project.id, output, resume: true }), /symlink/);
  assert.equal(await readFile(join(directory, 'outside.mjs'), 'utf8'), 'Human content');
});

test('nested output parents are created only after a successful validated capture', async t => {
  const directory = await temporary(t), output = join(directory, 'docs/specifications/synthetic-project');
  const capture = captureFixture();
  await assert.rejects(prepareOutput({ projectId: capture.data.project.id, output, capture: async () => null }), /No locked/);
  assert.deepEqual(await readdir(directory), []);
  await assert.rejects(prepareOutput({ projectId: capture.data.project.id, output, capture: async () => { throw new Error('Synthetic network failure'); } }), /network failure/);
  assert.deepEqual(await readdir(directory), []);
  await assert.rejects(prepareOutput({ projectId: capture.data.project.id, output, capture: async () => captureFixture(2) }), /projectId/);
  assert.deepEqual(await readdir(directory), []);
  await prepareOutput({ projectId: capture.data.project.id, output, capture: async () => capture });
  assert.equal(await readFile(join(output, 'source/approved-export.json'), 'utf8'), capture.text);
  assert.equal((await verifyCheckpointIntegrity(output, { projectId: capture.data.project.id })).status, 'collecting');
});
test('shared checkpoint verification rejects changed tools, inventory and pinned identity', async t => {
  const directory = await temporary(t), output = join(directory, 'package'), capture = captureFixture();
  await prepareOutput({ projectId: capture.data.project.id, output, capture: async () => capture });
  const checkpoint = join(output, 'state/generation.json');
  const original = await readFile(checkpoint, 'utf8');
  const state = JSON.parse(original);
  state.baselineVersion += 1;
  await writeFile(checkpoint, JSON.stringify(state));
  await assert.rejects(verifyCheckpointIntegrity(output), /Checkpoint source metadata/);
  await writeFile(checkpoint, original);
  delete state.files['tools/source.mjs'];
  await writeFile(checkpoint, JSON.stringify(state));
  await assert.rejects(verifyCheckpointIntegrity(output), /Checkpoint.*inventory/);
  await writeFile(checkpoint, original);
  await writeFile(join(output, 'tools/import-issues.mjs'), 'Human-edited tool');
  await assert.rejects(verifyCheckpointIntegrity(output), /Checkpoint.*owned file/);
});
