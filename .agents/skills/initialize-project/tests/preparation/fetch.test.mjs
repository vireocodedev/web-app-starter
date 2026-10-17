import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { chmod, lstat, mkdir, readFile, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { capturePreparation, fetchReviewedPreparation, inspectWorkbook, preparationContract, readProfile, sha256, validateReviewedExport } from '../../scripts/fetch-preparation.mjs';
import { renderWorkbook } from '../../scripts/preparation/model.mjs';
import { workspaceFixture } from './test-support.mjs';

const projectId = 'b3fb9a43-4895-4c03-b5ac-5a52e224f921';
const now = Date.parse('2026-10-17T12:00:00Z');
const fixtures = new URL('./fixtures/', import.meta.url);
async function exported(name = 'complete') {
  const fixture = JSON.parse(await readFile(new URL(`${name}.json`, fixtures), 'utf8'));
  const markdown = await readFile(new URL(`${name}.md`, fixtures), 'utf8');
  const pinned = await preparationContract();
  return { projectId, revision: 1, formatVersion: 1, reviewedAt: '2026-10-17T12:00:00Z', reviewedBy: 'example', workbookSha256: fixture.workbookSha256, markdown, contractSha256: pinned.contractSha256, templateSha256: pinned.templateSha256 };
}
async function mock(t, { data, status = 200, loginStatus = 200, schemaOverride } = {}) {
  data ??= await exported();
  const pinned = await preparationContract();
  const calls = [];
  const server = createServer(async (req, res) => {
    calls.push({ method: req.method, path: req.url });
    res.setHeader('Content-Type', 'application/json');
    let body = '';
    for await (const chunk of req) body += chunk;
    if (req.url === '/api/auth/csrf') return res.end(JSON.stringify({ headerName: 'X-CSRF-TOKEN', token: 'synthetic-csrf' }));
    if (req.url === '/api/auth/login') {
      assert.equal(req.headers['x-csrf-token'], 'synthetic-csrf');
      assert.deepEqual(JSON.parse(body), { username: 'admin', password: 'protected-synthetic-password' });
      res.statusCode = loginStatus;
      res.setHeader('Set-Cookie', 'SESSION=synthetic; HttpOnly; SameSite=Lax');
      return res.end('{}');
    }
    assert.equal(req.headers.cookie, 'SESSION=synthetic');
    if (req.url === '/api/auth/logout') return res.end('{}');
    if (req.url === '/api/discovery/preparation-schema') return res.end(JSON.stringify(schemaOverride ?? { ...pinned.contract, contractSha256: pinned.contractSha256, templateSha256: pinned.templateSha256 }));
    assert.equal(req.url, `/api/discovery/projects/${projectId}/preparation/export`);
    res.statusCode = status;
    res.end(JSON.stringify(data));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  return { calls, options: { apiUrl: `http://127.0.0.1:${server.address().port}/api`, username: 'admin', password: 'protected-synthetic-password' } };
}

test('complete and plan fixtures pin exact Markdown, schema and hashes for cross-repository rendering', async () => {
  const pinned = await preparationContract();
  assert.equal(pinned.contract.fields.length, 39);
  for (const name of ['complete', 'plan']) {
    const fixture = JSON.parse(await readFile(new URL(`${name}.json`, fixtures), 'utf8'));
    const expected = await readFile(new URL(`${name}.md`, fixtures), 'utf8');
    assert.equal(renderWorkbook(pinned.schema, fixture.draft), expected);
    assert.equal(sha256(expected), fixture.workbookSha256);
    assert.deepEqual(inspectWorkbook(pinned.schema, expected, { repository: fixture.repository, now: Date.parse(fixture.now) }).errors, {});
  }
});

test('optional cross-repository gate compares backend pinned resources byte for byte', { skip: !process.env.DISCOVERY_PREPARATION_RESOURCES }, async () => {
  const directory = process.env.DISCOVERY_PREPARATION_RESOURCES;
  for (const [name, resource] of [['preparation-contract.json', 'preparation-contract.v1.json'], ['preparation.md', 'preparation.v1.md']]) {
    const expected = await readFile(new URL(`../../references/${name}`, import.meta.url));
    assert.deepEqual(await readFile(join(directory, resource)), expected);
  }
});

test('authenticated fetch targets only the selected project, pins schema and logs out', async t => {
  const f = await mock(t);
  const { data } = await fetchReviewedPreparation(projectId, f.options);
  assert.equal(data.projectId, projectId);
  assert.equal((await validateReviewedExport(data, projectId, { repository: 'example/portal', now })).executionMode, 'execute-listed-scope');
  assert.deepEqual(f.calls.map(call => call.path), ['/api/auth/csrf', '/api/auth/login', '/api/discovery/preparation-schema', `/api/discovery/projects/${projectId}/preparation/export`, '/api/auth/csrf', '/api/auth/logout']);
});

test('unreviewed preparation and authentication failures remain distinct blockers', async t => {
  for (const status of [401, 403, 404, 409]) {
    await t.test(String(status), async t => {
      const f = await mock(t, { status });
      await assert.rejects(fetchReviewedPreparation(projectId, f.options), error => error.status === status && (status !== 409 || /not reviewed/.test(error.message)));
      assert.equal(f.calls.at(-1).path, '/api/auth/logout');
    });
  }
  const f = await mock(t, { loginStatus: 401 });
  await assert.rejects(fetchReviewedPreparation(projectId, f.options), error => error.status === 401);
  assert.equal(f.calls.length, 2);
});

test('schema mismatch and unsafe endpoints are rejected', async t => {
  const f = await mock(t, { schemaOverride: { formatVersion: 2 } });
  await assert.rejects(fetchReviewedPreparation(projectId, f.options), /schema differs/);
  for (const apiUrl of ['http://example.com/api', 'https://user:pass@example.com/api', 'https://example.com/api?token=secret']) await assert.rejects(fetchReviewedPreparation(projectId, { ...f.options, apiUrl }), /requires HTTPS/);
  await assert.rejects(fetchReviewedPreparation('../another-project', f.options), /UUID/);
});

test('export validation rejects tampering, wrong project, unsupported schema, checkout mismatch and expired execution', async () => {
  const valid = await exported();
  const context = { repository: 'example/portal', now };
  for (const changed of [{ markdown: valid.markdown + '\n' }, { projectId: 'cc17e087-6a12-4dc7-9682-dfa0456111ee' }, { formatVersion: 2 }, { reviewedAt: null }, { reviewedBy: '' }, { revision: 0 }, { contractSha256: '0'.repeat(64) }, { templateSha256: '0'.repeat(64) }]) await assert.rejects(validateReviewedExport({ ...valid, ...changed }, projectId, context));
  await assert.rejects(validateReviewedExport(valid, projectId, { ...context, repository: 'example/wrong' }), /repository/);
  await assert.rejects(validateReviewedExport(valid, projectId, { ...context, now: now + 172800000 }), /approval_expires_at/);
  const plan = await exported('plan');
  assert.ok((await validateReviewedExport(plan, projectId, context)).missingFields.length);
});

test('capture is private, reusable, source-pinned and requires explicit refresh for changed revision', async t => {
  const workspace = await workspaceFixture();
  t.after(workspace.remove);
  const f = await mock(t);
  const captured = await capturePreparation({ projectId, root: workspace.root, now, ...f.options });
  assert.equal(captured.status, 'captured');
  const directory = join(workspace.root, '.template-initialization');
  assert.equal((await lstat(directory)).mode & 0o777, 0o700);
  for (const name of ['preparation.md', 'preparation-provenance.json']) assert.equal((await lstat(join(directory, name))).mode & 0o777, 0o600);
  const before = await readFile(join(directory, 'preparation.md'));
  assert.equal(sha256(before), captured.workbookSha256);
  assert.equal((await capturePreparation({ projectId, root: workspace.root, now, ...f.options })).status, 'reused');
  const next = await exported(); next.revision = 2;
  const changed = await mock(t, { data: next });
  await assert.rejects(capturePreparation({ projectId, root: workspace.root, now, ...changed.options }), /Explicitly request a refresh/);
  assert.deepEqual(await readFile(join(directory, 'preparation.md')), before);
  const refreshed = await capturePreparation({ projectId, root: workspace.root, now, refresh: true, ...changed.options });
  assert.equal(refreshed.provenance.revision, 2);
  assert.deepEqual(await readFile(join(directory, 'preparation.md')), before);
  const receipt = await readFile(join(directory, 'preparation-provenance.json'), 'utf8');
  assert.doesNotMatch(receipt, /password|SESSION|csrf/i);
});

test('legacy workbooks work offline and differing or edited local input is preserved', async t => {
  const workspace = await workspaceFixture();
  t.after(workspace.remove);
  const directory = join(workspace.root, '.template-initialization');
  await mkdir(directory, { mode: 0o700 });
  const plan = await exported('plan');
  await writeFile(join(directory, 'preparation.md'), plan.markdown, { mode: 0o600 });
  assert.equal((await capturePreparation({ root: workspace.root, now })).status, 'existing-workbook');
  const f = await mock(t);
  await assert.rejects(capturePreparation({ projectId, root: workspace.root, now, ...f.options }), /Explicitly request a refresh/);
  assert.equal(await readFile(join(directory, 'preparation.md'), 'utf8'), plan.markdown);
  await capturePreparation({ projectId, root: workspace.root, now, refresh: true, ...f.options });
  await writeFile(join(directory, 'preparation.md'), plan.markdown, { mode: 0o600 });
  await assert.rejects(capturePreparation({ projectId, root: workspace.root, now, ...f.options }), /pinned provenance/);
  assert.equal(await readFile(join(directory, 'preparation.md'), 'utf8'), plan.markdown);
});

test('capture preserves completion without network access and rejects symlinks, public files and missing ignores', async t => {
  const workspace = await workspaceFixture();
  t.after(workspace.remove);
  const directory = join(workspace.root, '.template-initialization');
  await mkdir(directory, { mode: 0o700 });
  const state = JSON.stringify({ completion: { status: 'ready' } });
  await writeFile(join(directory, 'state.json'), state, { mode: 0o600 });
  assert.equal((await capturePreparation({ projectId, root: workspace.root, refresh: true })).status, 'completed-preserved');
  assert.equal(await readFile(join(directory, 'state.json'), 'utf8'), state);
  const second = await workspaceFixture(); t.after(second.remove);
  const target = join(second.root, 'outside.md');
  await writeFile(target, 'preserve');
  await mkdir(join(second.root, '.template-initialization'), { mode: 0o700 });
  await symlink(target, join(second.root, '.template-initialization/preparation.md'));
  await assert.rejects(capturePreparation({ root: second.root }), /owner-only regular/);
  assert.equal(await readFile(target, 'utf8'), 'preserve');
  await writeFile(join(second.root, '.gitignore'), '');
  await assert.rejects(capturePreparation({ root: second.root }), /Ignore the entire/);
});

test('credential profiles are owner-only dotenv data, never executed or copied', async t => {
  const workspace = await workspaceFixture(); t.after(workspace.remove);
  const profile = join(workspace.root, 'profile.env');
  await writeFile(profile, 'DISCOVERY_USERNAME=example\nDISCOVERY_PASSWORD=protected\n', { mode: 0o600 });
  assert.equal((await readProfile(profile)).DISCOVERY_USERNAME, 'example');
  await chmod(profile, 0o644);
  await assert.rejects(readProfile(profile), /owner-only/);
  await chmod(profile, 0o600);
  await writeFile(profile, 'UNSUPPORTED_KEY=value\n');
  await assert.rejects(readProfile(profile), /unsupported keys/);
});
