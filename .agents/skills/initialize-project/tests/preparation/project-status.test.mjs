import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { chmod, lstat, mkdir, readFile, readdir, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { preparationContract, sha256 } from '../../scripts/fetch-preparation.mjs';
import { inspectLocalInitialization, projectStatus, summarizePreparation, summarizeScope } from '../../scripts/project-status.mjs';
import { renderWorkbook } from '../../scripts/preparation/model.mjs';
import { workspaceFixture } from './test-support.mjs';

const projectId = 'b3fb9a43-4895-4c03-b5ac-5a52e224f921';
const adminId = 'c3fb9a43-4895-4c03-b5ac-5a52e224f921';
const clientId = 'd3fb9a43-4895-4c03-b5ac-5a52e224f921';
const otherId = 'e3fb9a43-4895-4c03-b5ac-5a52e224f921';
const now = Date.parse('2026-10-17T12:00:00Z');
const reviewedAt = '2026-10-17T12:00:00Z';
const contentHash = 'a'.repeat(64);
const phases = Object.fromEntries(['intake', 'identity', 'local', 'ci', 'environments', 'staging', 'production', 'recovery', 'handoff'].map(phase => [phase, 'passed']));

async function envelope(name = 'complete', reviewed = true) {
  const { draft } = JSON.parse(await readFile(new URL(`./fixtures/${name}.json`, import.meta.url), 'utf8'));
  const pinned = await preparationContract();
  return { formatVersion: 1, answers: draft.answers, prerequisites: draft.prerequisites, approvals: draft.approvals, replacements: draft.replacements, projectId, revision: 1, validationErrors: {}, review: reviewed ? { revision: 1, reviewedAt, reviewedBy: adminId, workbookSha256: sha256(renderWorkbook(pinned.schema, draft)) } : null };
}
function candidate(state = 'IN_REVIEW', version = 1) {
  return { id: `03fb9a43-4895-4c03-b5ac-${String(version).padStart(12, '0')}`, version, state, hash: contentHash, requiredClientId: clientId, approvals: [], ...(state === 'LOCKED' ? { lockedAt: reviewedAt } : {}) };
}
function approvals() {
  return [{ userId: adminId, role: 'ADMIN', hash: contentHash, approvedAt: reviewedAt, displayName: 'PRIVATE APPROVER' }, { userId: clientId, role: 'CLIENT', hash: contentHash, approvedAt: reviewedAt }];
}
function detail(draftState = 'DRAFT', baselines = []) {
  return { id: projectId, revision: 1, canManage: true, draftState, baselines, name: 'PRIVATE PROJECT', document: { secret: 'PRIVATE ANSWERS' }, audit: ['PRIVATE AUDIT'] };
}
async function mock(t, { project = detail(), preparation, projectStatus = 200, preparationStatus = 200, loginStatus = 200, logoutStatus = 200, schema, invalidJson = false, invalidProjectJson = false, disconnectProject = false } = {}) {
  preparation ??= await envelope();
  const pinned = await preparationContract();
  const calls = [];
  const server = createServer(async (req, res) => {
    calls.push({ method: req.method, path: req.url });
    res.setHeader('Content-Type', 'application/json');
    let body = '';
    for await (const chunk of req) body += chunk;
    if (req.url === '/api/auth/csrf') return res.end(JSON.stringify({ headerName: 'X-CSRF-TOKEN', token: 'private-csrf' }));
    if (req.url === '/api/auth/login') {
      assert.equal(req.headers['x-csrf-token'], 'private-csrf');
      assert.deepEqual(JSON.parse(body), { username: 'admin', password: 'PRIVATE PASSWORD' });
      res.setHeader('Set-Cookie', 'SESSION=PRIVATESESSION; HttpOnly');
      res.statusCode = loginStatus;
      return res.end('{}');
    }
    assert.equal(req.headers.cookie, 'SESSION=PRIVATESESSION');
    if (req.url === '/api/auth/logout') { res.statusCode = logoutStatus; return res.end('{}'); }
    if (req.url === '/api/discovery/preparation-schema') return res.end(JSON.stringify(schema ?? { ...pinned.contract, contractSha256: pinned.contractSha256, templateSha256: pinned.templateSha256 }));
    if (req.url === `/api/discovery/projects/${projectId}`) {
      if (disconnectProject) return req.socket.destroy();
      res.statusCode = projectStatus; return res.end(invalidProjectJson ? 'invalid: PRIVATE CONTENT' : JSON.stringify(project));
    }
    assert.equal(req.method, 'GET');
    assert.equal(req.url, `/api/discovery/projects/${projectId}/preparation`);
    res.statusCode = preparationStatus;
    res.end(invalidJson ? 'not JSON: PRIVATE CONTENT' : JSON.stringify(preparation));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  return { calls, options: { apiUrl: `http://127.0.0.1:${server.address().port}/api`, username: 'admin', password: 'PRIVATE PASSWORD' } };
}
async function workspace(t) {
  const fixture = await workspaceFixture();
  t.after(fixture.remove);
  return fixture.root;
}
async function privateFiles(root, files) {
  const directory = join(root, '.template-initialization');
  await mkdir(directory, { mode: 0o700, recursive: true });
  for (const [name, value] of Object.entries(files)) await writeFile(join(directory, name), typeof value === 'string' ? value : JSON.stringify(value), { mode: 0o600 });
  return directory;
}
async function acceptance(root, record) {
  await mkdir(join(root, 'docs/acceptance'), { recursive: true });
  await writeFile(join(root, 'docs/acceptance/initialization-acceptance.json'), JSON.stringify(record));
}

test('status uses authenticated project/schema/preparation GET only and emits no private data or files', async t => {
  const root = await workspace(t), f = await mock(t);
  const before = await readdir(root);
  const result = await projectStatus({ projectId, root, now, ...f.options });
  assert.equal(result.project.status, 'available');
  assert.equal(result.projectId, projectId);
  assert.equal(result.apiUrl, f.options.apiUrl);
  assert.equal(result.preparation.status, 'execution-ready');
  assert.equal(result.nextAction.code, 'initialize-or-resume');
  assert.deepEqual(await readdir(root), before);
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE|private-csrf|approval_signer|operator_profile|admin@example/);
  assert.deepEqual(f.calls.map(call => call.path), ['/api/auth/csrf', '/api/auth/login', `/api/discovery/projects/${projectId}`, '/api/discovery/preparation-schema', `/api/discovery/projects/${projectId}/preparation`, '/api/auth/csrf', '/api/auth/logout']);
  assert.ok(f.calls.every(call => !/export|review|lock|baselines/.test(call.path)));
});

test('no binding is offline and does not consume a supplied profile', async t => {
  const root = await workspace(t);
  const result = await projectStatus({ root, profile: '/does-not-exist' });
  assert.equal(result.binding.status, 'project-required');
  assert.equal(result.nextAction.code, 'supply-project-id');
  assert.equal(result.repository, 'example/portal');
  assert.equal(result.initialization.status, 'unrecorded');
  assert.equal((await readdir(root)).includes('.template-initialization'), false);
});

test('preparation states distinguish absent, incomplete, unreviewed, plan, execution, malformed and expired', async () => {
  const pinned = await preparationContract();
  const context = { projectId, repository: 'example/portal', now };
  const summarize = data => summarizePreparation(data, pinned, context);
  assert.equal(summarize({ ...await envelope(), revision: 0 }).status, 'absent');
  assert.equal(summarize(await envelope('complete', false)).status, 'needs-review');
  assert.equal(summarize(await envelope('plan')).status, 'reviewed-plan');
  assert.equal(summarize(await envelope()).status, 'execution-ready');
  const incomplete = await envelope('complete', false);
  incomplete.answers.project_slug = '';
  assert.equal(summarize(incomplete).status, 'needs-completion');
  assert.ok(summarize(incomplete).validationFields.includes('project_slug'));
  for (const changed of [{ revision: 2 }, { reviewedAt: '2026-02-30T12:00:00Z' }, { reviewedAt: '2026-10-18T12:00:00Z' }, { workbookSha256: 'f'.repeat(64) }, { reviewedBy: 'PRIVATE NAME' }]) {
    const data = await envelope(); Object.assign(data.review, changed);
    assert.equal(summarize(data).status, 'expired/invalid');
  }
  const expired = await envelope();
  assert.equal(summarizePreparation(expired, pinned, { ...context, now: now + 172800000 }).status, 'expired/invalid');
  assert.equal(summarizePreparation(await envelope(), pinned, { ...context, repository: 'other/checkout' }).status, 'expired/invalid');
  const malformed = await envelope(); malformed.answers = { secret: 'PRIVATE' };
  assert.equal(summarize(malformed).status, 'expired/invalid');
});

test('scope needs two independent same-hash approvals and a real lock, preserving an older lock alongside draft', () => {
  const pending = candidate();
  assert.deepEqual(summarizeScope(detail('IN_REVIEW', [pending])).latestCandidate.missingApprovals, ['administrator', 'designated-client']);
  pending.approvals = approvals().slice(0, 1);
  assert.deepEqual(summarizeScope(detail('IN_REVIEW', [pending])).latestCandidate.missingApprovals, ['designated-client']);
  pending.approvals = approvals();
  assert.equal(summarizeScope(detail('IN_REVIEW', [pending])).status, 'not-export-ready');
  const locked = candidate('LOCKED'); locked.approvals = approvals();
  assert.equal(summarizeScope(detail('LOCKED', [locked])).lockedBaseline.exportEligible, true);
  const newReview = candidate('IN_REVIEW', 2);
  const streams = summarizeScope(detail('IN_REVIEW', [newReview, locked]));
  assert.equal(streams.latestCandidate.version, 2);
  assert.equal(streams.lockedBaseline.version, 1);
  assert.equal(summarizeScope(detail('DRAFT', [locked])).currentState, 'DRAFT');
  for (const changed of [{ hash: 'f'.repeat(64) }, { userId: adminId }, { approvedAt: 'invalid' }]) {
    const bad = candidate('LOCKED'); bad.approvals = approvals(); Object.assign(bad.approvals[1], changed);
    assert.equal(summarizeScope(detail('LOCKED', [bad])).status, 'invalid-metadata');
  }
  const wrongClient = candidate(); wrongClient.approvals = [{ ...approvals()[1], userId: otherId }];
  assert.deepEqual(summarizeScope(detail('IN_REVIEW', [wrongClient])).latestCandidate.missingApprovals, ['administrator', 'designated-client']);
  assert.equal(summarizeScope(detail('IN_REVIEW', [candidate(), candidate('IN_REVIEW', 2)])).status, 'invalid-metadata');
  assert.equal(summarizeScope(detail('LOCKED', [candidate('LOCKED')])).status, 'invalid-metadata');
  assert.equal(summarizeScope(detail('DRAFT', [candidate('DISCARDED'), { ...candidate('DISCARDED', 2), version: 1 }])).status, 'invalid-metadata');
});

test('HTTP absence, access, schema and transport failures remain distinct and sessions log out', async t => {
  const root = await workspace(t);
  for (const status of [401, 403, 404]) {
    const f = await mock(t, { projectStatus: status });
    const result = await projectStatus({ projectId, root, ...f.options });
    assert.equal(result.project.status, status === 404 ? 'missing' : 'access-denied');
    assert.equal(result.projectId, projectId);
    assert.equal(result.apiUrl, f.options.apiUrl);
    assert.equal(f.calls.at(-1).path, '/api/auth/logout');
  }
  const login = await mock(t, { loginStatus: 401 });
  assert.equal((await projectStatus({ projectId, root, ...login.options })).project.status, 'access-denied');
  assert.equal(login.calls.length, 2);
  const absent = await mock(t, { preparationStatus: 404 });
  const absentResult = await projectStatus({ projectId, root, ...absent.options });
  assert.deepEqual(absentResult.preparation, { status: 'unavailable', reason: 'unsupported-api' });
  const schema = await mock(t, { schema: { formatVersion: 2 } });
  assert.equal((await projectStatus({ projectId, root, ...schema.options })).preparation.status, 'schema-mismatch');
  const invalid = await mock(t, { invalidJson: true });
  assert.equal((await projectStatus({ projectId, root, ...invalid.options })).preparation.reason, 'invalid-json');
  assert.equal(invalid.calls.at(-1).path, '/api/auth/logout');
  const invalidProject = await mock(t, { invalidProjectJson: true });
  const malformed = await projectStatus({ projectId, root, ...invalidProject.options });
  assert.equal(malformed.project.status, 'invalid-metadata');
  assert.doesNotMatch(JSON.stringify(malformed), /PRIVATE/);
  assert.equal(invalidProject.calls.at(-1).path, '/api/auth/logout');
  const disconnected = await mock(t, { disconnectProject: true });
  assert.equal((await projectStatus({ projectId, root, ...disconnected.options })).project.status, 'request-failed');
  assert.equal(disconnected.calls.at(-1).path, '/api/auth/logout');
  const logout = await mock(t, { logoutStatus: 500 });
  assert.equal((await projectStatus({ projectId, root, ...logout.options })).project.status, 'request-failed');
});

test('remember is explicit, protected, source-bound and independent of preparation readiness', async t => {
  const root = await workspace(t), f = await mock(t, { preparationStatus: 404 });
  const directory = await privateFiles(root, { 'preparation.md': 'PRESERVE WORKBOOK', 'state.json': { repository: 'example/portal', phases: { intake: 'passed' } } });
  const before = await readFile(join(directory, 'state.json'));
  const result = await projectStatus({ projectId, root, remember: true, ...f.options });
  assert.equal(result.binding.remembered, true);
  const binding = JSON.parse(await readFile(join(directory, 'discovery-project.json'), 'utf8'));
  assert.deepEqual(binding, { formatVersion: 1, repository: 'example/portal', projectId, apiUrl: f.options.apiUrl });
  assert.equal((await lstat(directory)).mode & 0o777, 0o700);
  assert.equal((await lstat(join(directory, 'discovery-project.json'))).mode & 0o777, 0o600);
  assert.deepEqual(await readFile(join(directory, 'state.json')), before);
  assert.equal(await readFile(join(directory, 'preparation.md'), 'utf8'), 'PRESERVE WORKBOOK');
  const remembered = await projectStatus({ root, ...f.options });
  assert.equal(remembered.binding.source, 'binding');
  assert.equal(remembered.project.id, projectId);
  const requests = f.calls.length;
  assert.equal((await projectStatus({ projectId: otherId, root, ...f.options })).binding.status, 'invalid-or-conflicting');
  const mismatch = await projectStatus({ root, ...f.options, apiUrl: f.options.apiUrl + '/other' });
  assert.equal(mismatch.binding.status, 'source-mismatch');
  assert.equal(mismatch.apiUrl, f.options.apiUrl + '/other');
  assert.equal(mismatch.projectId, projectId);
  assert.equal(f.calls.length, requests);
  await chmod(join(directory, 'discovery-project.json'), 0o644);
  assert.equal((await projectStatus({ root, ...f.options })).binding.status, 'invalid-or-conflicting');
});

test('provenance resolves one project but conflicts and unsafe files never cause reassociation', async t => {
  const root = await workspace(t), f = await mock(t);
  const data = await envelope();
  const provenance = { formatVersion: 1, projectId, revision: 1, reviewedAt, reviewedBy: adminId, workbookSha256: data.review.workbookSha256, apiUrl: f.options.apiUrl, capturedAt: reviewedAt };
  const directory = await privateFiles(root, { 'preparation-provenance.json': provenance });
  assert.equal((await projectStatus({ root, now, ...f.options })).binding.source, 'provenance');
  await privateFiles(root, { 'discovery-project.json': { formatVersion: 1, repository: 'example/portal', projectId: otherId, apiUrl: f.options.apiUrl } });
  assert.equal((await projectStatus({ root, ...f.options })).binding.status, 'invalid-or-conflicting');
  const second = await workspace(t);
  await privateFiles(second, {});
  await symlink(join(directory, 'preparation-provenance.json'), join(second, '.template-initialization/preparation-provenance.json'));
  assert.equal((await projectStatus({ root: second, ...f.options })).binding.status, 'invalid-or-conflicting');
});

test('only consumer-matched complete recorded evidence can skip initialization and request specification output', async t => {
  const root = await workspace(t), locked = candidate('LOCKED'); locked.approvals = approvals();
  const f = await mock(t, { project: detail('LOCKED', [locked]) });
  await acceptance(root, { repository: 'upstream/template', ready: true, phases });
  const inherited = await projectStatus({ projectId, root, now, ...f.options });
  assert.equal(inherited.initialization.status, 'repository-mismatch');
  assert.equal(inherited.nextAction.code, 'resolve-initialization-evidence');
  await acceptance(root, { repository: 'example/portal', ready: true, phases: { ...phases, recovery: 'blocked' } });
  const incomplete = await projectStatus({ projectId, root, now, ...f.options });
  assert.equal(incomplete.initialization.status, 'recorded-incomplete');
  assert.equal(incomplete.initialization.nextPhase, 'recovery');
  await acceptance(root, { repository: 'example/portal', ready: true, phases });
  const complete = await projectStatus({ projectId, root, now, ...f.options });
  assert.equal(complete.initialization.status, 'recorded-complete');
  assert.equal(complete.initialization.evidence, 'recorded-only');
  assert.equal(complete.nextAction.code, 'choose-specification-output');
  await writeFile(join(root, 'docs/acceptance/initialization-acceptance.json'), 'invalid');
  assert.equal((await projectStatus({ root })).initialization.status, 'invalid-evidence');
  assert.equal((await projectStatus({ projectId, root, now, ...f.options })).nextAction.code, 'resolve-initialization-evidence');
});

test('client or malformed management metadata never advertises administrator export access', async t => {
  const root = await workspace(t), locked = candidate('LOCKED'); locked.approvals = approvals();
  await acceptance(root, { repository: 'example/portal', ready: true, phases });
  for (const canManage of [false, undefined, 'true']) {
    const project = { ...detail('LOCKED', [locked]), canManage };
    const f = await mock(t, { project });
    const result = await projectStatus({ projectId, root, remember: true, now, ...f.options });
    assert.equal(result.project.status, canManage === false ? 'access-denied' : 'invalid-metadata');
    assert.equal(result.scope.status, 'unavailable');
    assert.equal(result.nextAction.code, 'check-project-access');
    assert.equal(summarizeScope(project).status, canManage === false ? 'access-denied' : 'invalid-metadata');
    assert.ok(f.calls.every(call => !/preparation/.test(call.path)));
    assert.equal((await readdir(root)).includes('.template-initialization'), false);
  }
});

test('current scope actions take priority while older locked export availability remains visible', async t => {
  const root = await workspace(t), locked = candidate('LOCKED'); locked.approvals = approvals();
  await acceptance(root, { repository: 'example/portal', ready: true, phases });
  for (const [state, currentApprovals, expected] of [
    ['DRAFT', null, 'complete-scope'],
    ['IN_REVIEW', [], 'obtain-scope-approvals'],
    ['IN_REVIEW', approvals(), 'lock-scope'],
  ]) {
    const current = candidate('IN_REVIEW', 2); current.approvals = currentApprovals;
    const f = await mock(t, { project: detail(state, currentApprovals === null ? [locked] : [current, locked]) });
    const result = await projectStatus({ projectId, root, now, ...f.options });
    assert.equal(result.nextAction.code, expected);
    assert.equal(result.scope.lockedBaseline.version, 1);
    assert.equal(result.scope.lockedBaseline.exportEligible, true);
  }
});

test('legacy state repository and phase objects are normalized without exposing private fields', async t => {
  const root = await workspace(t);
  const state = {
    repository: { name: 'example/portal', id: 123, initial_commit: 'PRIVATE COMMIT', personalization_commit: 'PRIVATE COMMIT' },
    phases: Object.fromEntries(Object.entries(phases).map(([phase, status]) => [phase, { status, privateData: 'PRIVATE PHASE NOTES' }])),
    completion: { ready: true, all_nine_phases_passed: true },
    privateData: 'PRIVATE INPUTS',
  };
  const directory = await privateFiles(root, { 'state.json': state });
  assert.equal((await inspectLocalInitialization(root, 'example/portal')).status, 'recorded-complete');
  state.phases.recovery.status = 'blocked';
  await writeFile(join(directory, 'state.json'), JSON.stringify(state));
  const partial = await inspectLocalInitialization(root, 'example/portal');
  assert.equal(partial.status, 'recorded-incomplete');
  assert.equal(partial.nextPhase, 'recovery');
  assert.equal(partial.phases.local, 'passed');
  assert.doesNotMatch(JSON.stringify(partial), /PRIVATE|initial_commit|personalization_commit/);
  state.phases.recovery.status = 'passed';
  state.completion.all_nine_phases_passed = false;
  await writeFile(join(directory, 'state.json'), JSON.stringify(state));
  assert.equal((await inspectLocalInitialization(root, 'example/portal')).status, 'recorded-incomplete');
  state.completion.all_nine_phases_passed = true;
  await writeFile(join(directory, 'state.json'), JSON.stringify(state));
  await acceptance(root, { repository: 'example/portal', ready: false, phases: { ...phases, production: 'blocked' } });
  const acceptanceFirst = await inspectLocalInitialization(root, 'example/portal');
  assert.equal(acceptanceFirst.status, 'recorded-incomplete');
  assert.equal(acceptanceFirst.nextPhase, 'production');
  assert.equal(acceptanceFirst.phases.production, 'blocked');
  await acceptance(root, { repository: 'example/portal', ready: true, phases });
  state.phases.local.status = 'blocked';
  await writeFile(join(directory, 'state.json'), JSON.stringify(state));
  assert.equal((await inspectLocalInitialization(root, 'example/portal')).status, 'recorded-complete');
  await writeFile(join(root, 'docs/acceptance/initialization-acceptance.json'), 'malformed');
  assert.equal((await inspectLocalInitialization(root, 'example/portal')).status, 'invalid-evidence');
});

test('portable status and session transport depend only on Node and bundled local modules', async () => {
  for (const path of ['project-status.mjs', 'discovery-client.mjs']) {
    const source = await readFile(new URL(`../../scripts/${path}`, import.meta.url), 'utf8');
    const imports = [...source.matchAll(/from ['"]([^'"]+)['"]/g)].map(match => match[1]);
    assert.ok(imports.every(value => value.startsWith('node:') || value.startsWith('./')));
  }
});
