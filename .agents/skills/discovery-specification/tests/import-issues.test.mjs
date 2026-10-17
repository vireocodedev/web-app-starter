import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { loadPackage, runImport, markerFor, provenanceFor, offlinePlan } from '../scripts/import-issues.mjs';

import { sourceFixture } from './fixtures.mjs';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const repo = 'example/sample-project';
async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'sample-project-import-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'issues/bodies'), { recursive: true });
  await mkdir(join(root, 'source'));
  const snapshot = sourceFixture();
  const contentHash = snapshot.contentHash;
  const bytes = JSON.stringify(snapshot) + '\n';
  await writeFile(join(root, 'source/approved-export.json'), bytes);
  const labels = [{ name: 'spec:review', color: 'abcdef', description: 'Specification review required' }];
  await writeFile(join(root, 'issues/labels.json'), JSON.stringify(labels));
  const manifest = {
    schemaVersion: '1.0.0', packageId: 'sample-project', reviewStatus: 'draft', repository: null,
    source: { projectId: snapshot.project.id, baselineId: snapshot.baseline.id, baselineVersion: 1, contentHash, exportFile: 'source/approved-export.json', exportFileSha256: digest(bytes), environment: 'production' }, labelsFile: 'issues/labels.json',
    issues: [
      { key: 'SPEC-1', kind: 'initiative', title: 'Review shop specification', parent: null, blockedBy: [] },
      { key: 'SPEC-2', kind: 'story', title: 'Review customer flow', parent: 'SPEC-1', blockedBy: ['SPEC-1'] },
    ].map(issue => ({ ...issue, bodyFile: `bodies/${issue.key}.md`, decisionBlockers: [], sourceRefs: [{ kind: 'feature', id: 'feature.1', path: '/requirements/features/0' }], labels: ['spec:review'], ownerBoundary: 'Future application repository', readiness: 'ready-for-spec-review' })),
  };
  for (const issue of manifest.issues) await writeFile(join(root, 'issues', issue.bodyFile), `${markerFor(snapshot.project.id, issue.key)}\n${provenanceFor(manifest.source, issue.sourceRefs)}\n\n## Source references\nfeature-id\n\n## Acceptance criteria\nReview specification.\n\n## Dependencies\nSee manifest.\n`);
  const save = async () => writeFile(join(root, 'issues/manifest.json'), JSON.stringify(manifest));
  await save();
  return { root, manifest, snapshot, save };
}

function mockGitHub() {
  const issues = []; const labels = []; const calls = []; const parents = new Map(); const blockers = new Map();
  let next = 1; let failAfterCreate = false; let unsupported = false;
  const clone = value => structuredClone(value);
  const httpError = status => Object.assign(new Error(`HTTP ${status}`), { status });
  function issue(number) { const found = issues.find(item => item.number === Number(number)); assert.ok(found, `Unknown issue number ${number}`); return found; }
  const request = async (method, endpoint, payload) => {
    calls.push({ method, endpoint, payload: clone(payload) });
    const [path, query] = endpoint.split('?');
    const segments = path.replace(`repos/${repo}`, '').split('/').filter(Boolean);
    const page = Number(new URLSearchParams(query).get('page') ?? 1);
    const paginated = values => clone(values.slice((page - 1) * 100, page * 100));
    if (!segments.length) { assert.equal(method, 'GET'); return { full_name: repo, has_issues: true }; }
    if (segments[0] === 'labels') {
      if (method === 'GET') return paginated(labels);
      assert.equal(method, 'POST'); labels.push(clone(payload)); return clone(payload);
    }
    assert.equal(segments[0], 'issues');
    if (segments.length === 1) {
      if (method === 'GET') { assert.equal(new URLSearchParams(query).get('state'), 'all'); return paginated(issues); }
      assert.equal(method, 'POST');
      const number = next++;
      const created = { ...clone(payload), labels: payload.labels.map(name => ({ name })), number, id: 5000 + number, state: 'open', repository_url: `https://api.github.com/repos/${repo}`, html_url: `https://github.com/${repo}/issues/${number}` };
      issues.push(created);
      if (failAfterCreate) { failAfterCreate = false; throw new Error('Connection lost after accepted create'); }
      return clone(created);
    }
    const current = issue(segments[1]);
    if (segments.length === 2) {
      if (method === 'GET') return clone(current);
      assert.equal(method, 'PATCH'); assert.deepEqual(Object.keys(payload), ['body']); current.body = payload.body; return clone(current);
    }
    if (segments[2] === 'labels') {
      assert.equal(method, 'POST'); current.labels.push(...payload.labels.map(name => ({ name }))); return clone(current.labels);
    }
    if (unsupported) throw httpError(404);
    if (segments[2] === 'sub_issues') {
      if (method === 'GET') return paginated(issues.filter(item => parents.get(item.id) === current.id));
      assert.equal(method, 'POST'); assert.ok(issues.some(item => item.id === payload.sub_issue_id)); assert.equal(payload.replace_parent, undefined);
      parents.set(payload.sub_issue_id, current.id); return clone(current);
    }
    if (segments[2] === 'parent') {
      assert.equal(method, 'GET'); const parent = issues.find(item => item.id === parents.get(current.id)); if (!parent) throw httpError(404); return clone(parent);
    }
    assert.deepEqual(segments.slice(2), ['dependencies', 'blocked_by']);
    if (method === 'GET') return paginated((blockers.get(current.id) ?? []).map(id => issues.find(item => item.id === id)));
    assert.equal(method, 'POST'); assert.ok(issues.some(item => item.id === payload.issue_id));
    blockers.set(current.id, [...(blockers.get(current.id) ?? []), payload.issue_id]); return clone(issues.find(item => item.id === payload.issue_id));
  };
  return { issues, labels, calls, parents, blockers, request, interruptNextCreate() { failAfterCreate = true; }, disableNative() { unsupported = true; } };
}

test('default validates and prints deterministic offline plan with no transport or state calls', async t => {
  const f = await fixture(t); const pkg = await loadPackage(f.root);
  const never = () => { throw new Error('Offline plan invoked transport'); };
  const first = await runImport(pkg, {}, never);
  assert.equal(first.mode, 'offline'); assert.equal(first.repository, null);
  assert.deepEqual(first, await runImport(pkg, {}, never));
  await assert.rejects(readFile(join(f.root, '.import-state/example--sample-project.json')), { code: 'ENOENT' });
  await assert.rejects(runImport(pkg, { apply: true }, never), /explicit --repo/);
});

test('rejects digest, identity, labels, paths, source refs and cycles before transport', async t => {
  const f = await fixture(t);
  const cases = [
    [m => { m.source.exportFileSha256 = 'b'.repeat(64); }, /SHA-256/],
    [m => { m.source.projectId = 'wrong'; }, /does not match/],
    [m => { m.issues[0].labels = ['missing']; }, /unknown label/],
    [m => { m.issues[0].bodyFile = '../outside.md'; }, /bodyFile/],
    [m => { m.issues[0].sourceRefs[0].path = '/requirements/features/9'; }, /Unknown source path/],
    [m => { m.issues[0].sourceRefs[0].id = 'wrong'; }, /source ID/],
    [m => { m.issues[1].key = 'SPEC-1'; }, /duplicate issue key/],
    [m => { m.issues[0].parent = 'SPEC-2'; }, /parent cycle/],
    [m => { m.issues[0].blockedBy = ['SPEC-2']; }, /blocker cycle/],
    [m => { m.issues[0].blockedBy = ['MISSING']; }, /unknown blocker/],
  ];
  const original = structuredClone(f.manifest);
  for (const [mutate, expected] of cases) {
    Object.assign(f.manifest, structuredClone(original)); mutate(f.manifest); await f.save();
    await assert.rejects(loadPackage(f.root), expected);
  }
});

test('rejects body symlinks escaping package and invalid approval evidence', async t => {
  const f = await fixture(t);
  await rm(join(f.root, 'issues/bodies/SPEC-1.md'));
  await symlink('/etc/passwd', join(f.root, 'issues/bodies/SPEC-1.md'));
  await assert.rejects(loadPackage(f.root), /escapes package/);
  f.snapshot.approvals[1].hash = 'b'.repeat(64);
  const bytes = JSON.stringify(f.snapshot);
  await writeFile(join(f.root, 'source/approved-export.json'), bytes);
  f.manifest.source.exportFileSha256 = digest(bytes); await f.save();
  await assert.rejects(loadPackage(f.root), /approval/);
});

test('decision blockers must exist, target decision issues, and appear in blockedBy', async t => {
  const f = await fixture(t);
  const original = structuredClone(f.manifest);
  const cases = [
    [m => { m.issues[1].decisionBlockers = ['MISSING']; }, /unknown decision blocker MISSING/],
    [m => { m.issues[1].decisionBlockers = ['SPEC-1']; }, /is not a decision issue/],
    [m => { m.issues[0].kind = 'decision'; m.issues[1].decisionBlockers = ['SPEC-1']; m.issues[1].blockedBy = []; }, /must also appear in blockedBy/],
  ];
  for (const [mutate, expected] of cases) {
    Object.assign(f.manifest, structuredClone(original));
    mutate(f.manifest); f.manifest.issues[1].readiness = 'blocked-by-decision';
    await f.save(); await assert.rejects(loadPackage(f.root), expected);
  }
  Object.assign(f.manifest, structuredClone(original));
  f.manifest.issues[0].kind = 'decision';
  f.manifest.issues[1].decisionBlockers = ['SPEC-1'];
  f.manifest.issues[1].readiness = 'blocked-by-decision';
  await f.save(); assert.equal((await loadPackage(f.root)).manifest.issues[1].decisionBlockers[0], 'SPEC-1');
});

test('native import uses database IDs, confirms labels, and is idempotent across closed issues', async t => {
  const f = await fixture(t); const pkg = await loadPackage(f.root); const gh = mockGitHub();
  const first = await runImport(pkg, { apply: true, repo }, gh.request);
  assert.deepEqual(first.created, ['SPEC-1', 'SPEC-2']);
  assert.equal(gh.parents.get(5002), 5001); assert.deepEqual(gh.blockers.get(5002), [5001]);
  assert.ok(gh.calls.some(call => call.endpoint.endsWith('/issues/1/sub_issues') && call.payload.sub_issue_id === 5002));
  assert.ok(gh.calls.some(call => call.endpoint.endsWith('/issues/2/dependencies/blocked_by') && call.payload.issue_id === 5001));
  gh.issues[0].state = 'closed'; gh.issues[0].labels.push({ name: 'human-label' });
  const before = gh.calls.length;
  await runImport(pkg, { apply: true, repo }, gh.request);
  assert.equal(gh.issues.length, 2); assert.equal(gh.issues[0].state, 'closed');
  assert.ok(gh.issues[0].labels.some(label => label.name === 'human-label'));
  assert.deepEqual(gh.calls.slice(before).filter(call => call.method !== 'GET'), []);
});

test('lost create response recovers exact marker without retrying POST', async t => {
  const f = await fixture(t); const pkg = await loadPackage(f.root); const gh = mockGitHub(); gh.interruptNextCreate();
  await assert.rejects(runImport(pkg, { apply: true, repo }, gh.request), /no automatic retry/);
  assert.equal(gh.issues.length, 1);
  const report = await runImport(pkg, { apply: true, repo }, gh.request);
  assert.deepEqual(report.recovered, ['SPEC-1']); assert.equal(gh.issues.length, 2);
});

test('duplicate remote markers and manual body drift fail before remote writes', async t => {
  const f = await fixture(t); const pkg = await loadPackage(f.root); const gh = mockGitHub();
  await runImport(pkg, { apply: true, repo }, gh.request);
  const duplicate = structuredClone(gh.issues[0]); duplicate.number = 99; duplicate.id = 5099; duplicate.html_url = `https://github.com/${repo}/issues/99`; gh.issues.push(duplicate);
  let before = gh.calls.length;
  await assert.rejects(runImport(pkg, { apply: true, repo }, gh.request), /Duplicate exact marker/);
  assert.deepEqual(gh.calls.slice(before).filter(call => call.method !== 'GET'), []);
  gh.issues.pop(); gh.issues[0].body += '\nHuman progress update.\n'; before = gh.calls.length;
  await assert.rejects(runImport(pkg, { apply: true, repo }, gh.request), /manual body drift/);
  assert.deepEqual(gh.calls.slice(before).filter(call => call.method !== 'GET'), []);
});

test('wrong-repository state and removed source marker refuse duplicate creation', async t => {
  const f = await fixture(t); const pkg = await loadPackage(f.root); const gh = mockGitHub();
  await runImport(pkg, { apply: true, repo }, gh.request);
  const stateFile = join(f.root, '.import-state/example--sample-project.json');
  const state = JSON.parse(await readFile(stateFile)); state.repository = 'wrong/repo'; await writeFile(stateFile, JSON.stringify(state));
  const before = gh.calls.length;
  await assert.rejects(runImport(pkg, { apply: true, repo }, gh.request), /another repository/);
  assert.equal(gh.calls.length, before);
  state.repository = repo; await writeFile(stateFile, JSON.stringify(state));
  gh.issues[0].body = 'Human replaced body';
  await assert.rejects(runImport(pkg, { apply: true, repo }, gh.request), /marker removed/);
  assert.equal(gh.issues.length, 2);
});

test('unsupported native relationships fail explicitly; body-links is an explicit fallback', async t => {
  const f = await fixture(t); const pkg = await loadPackage(f.root); const gh = mockGitHub(); gh.disableNative();
  await assert.rejects(runImport(pkg, { apply: true, repo }, gh.request), /HTTP 404/);
  assert.equal(gh.issues.length, 2); // Successfully created marked issues are retained for recovery.
  const before = gh.calls.length;
  const report = await runImport(pkg, { apply: true, repo, relationships: 'body-links' }, gh.request);
  assert.equal(report.relationships, 'body-links'); assert.equal(gh.issues.length, 2);
  assert.match(gh.issues[1].body, /Blocked by SPEC-1: https:\/\/github.com\/example\/sample-project\/issues\/1/);
  assert.ok(!gh.calls.slice(before).some(call => /sub_issues|\/parent|dependencies/.test(call.endpoint)));
});

test('all-state pagination finds markers beyond first page', async t => {
  const f = await fixture(t); const pkg = await loadPackage(f.root); const gh = mockGitHub();
  await runImport(pkg, { apply: true, repo }, gh.request);
  for (let number = 100; number < 200; number++) gh.issues.unshift({ number, id: 6000 + number, body: 'Unrelated', pull_request: {} });
  const before = gh.calls.length;
  await runImport(pkg, { apply: true, repo }, gh.request);
  assert.ok(gh.calls.slice(before).some(call => call.endpoint.includes('state=all&per_page=100&page=2')));
  assert.deepEqual(gh.calls.slice(before).filter(call => call.method !== 'GET'), []);
});

test('repository overrides are validated offline', async t => {
  const f = await fixture(t); const pkg = await loadPackage(f.root);
  assert.throws(() => offlinePlan(pkg, { repo: 'owner/repo; command' }), /OWNER\/REPO/);
  pkg.manifest.repository = 'expected/repo';
  assert.throws(() => offlinePlan(pkg, { repo }), /differs from manifest/);
});

test('accepted body update with interrupted response recovers without overwriting edits', async t => {
  const f = await fixture(t); const pkg = await loadPackage(f.root); const gh = mockGitHub();
  let interrupted = false;
  const transport = async (method, endpoint, payload) => {
    const response = await gh.request(method, endpoint, payload);
    if (!interrupted && method === 'PATCH') { interrupted = true; throw new Error('Lost PATCH response'); }
    return response;
  };
  await assert.rejects(runImport(pkg, { apply: true, repo }, transport), /Lost PATCH response/);
  const report = await runImport(pkg, { apply: true, repo }, gh.request);
  assert.deepEqual(report.created, []); assert.equal(gh.issues.length, 2);
  assert.match(gh.issues[0].body, /discovery-resolved-links: SPEC-1/);
});

test('conflicting native parent is preserved and stops import before remote writes', async t => {
  const f = await fixture(t); const pkg = await loadPackage(f.root); const gh = mockGitHub();
  await runImport(pkg, { apply: true, repo }, gh.request);
  const other = structuredClone(gh.issues[0]); other.number = 90; other.id = 5090; other.body = 'Human initiative'; other.html_url = `https://github.com/${repo}/issues/90`; gh.issues.push(other);
  gh.parents.set(5002, 5090);
  const before = gh.calls.length;
  await assert.rejects(runImport(pkg, { apply: true, repo }, gh.request), /existing parent conflicts/);
  assert.equal(gh.parents.get(5002), 5090);
  assert.deepEqual(gh.calls.slice(before).filter(call => call.method !== 'GET'), []);
});

test('recovered issue with manually edited body conflicts before writes', async t => {
  const f = await fixture(t); const pkg = await loadPackage(f.root); const gh = mockGitHub(); gh.interruptNextCreate();
  await assert.rejects(runImport(pkg, { apply: true, repo }, gh.request));
  gh.issues[0].body += '\nA human edited this issue after creation.\n';
  const before = gh.calls.length;
  await assert.rejects(runImport(pkg, { apply: true, repo }, gh.request), /manual body drift/);
  assert.deepEqual(gh.calls.slice(before).filter(call => call.method !== 'GET'), []);
});

test('every issue body independently preserves exact baseline and source-reference provenance', async t => {
  const f = await fixture(t);
  const issue = f.manifest.issues[0];
  const path = join(f.root, 'issues', issue.bodyFile);
  const body = await readFile(path, 'utf8');
  const exact = provenanceFor(f.manifest.source, issue.sourceRefs);
  const cases = [
    '',
    `${exact}\n${exact}`,
    provenanceFor({ ...f.manifest.source, projectId: f.snapshot.baseline.id }, issue.sourceRefs),
    provenanceFor({ ...f.manifest.source, baselineId: f.snapshot.project.id }, issue.sourceRefs),
    provenanceFor({ ...f.manifest.source, baselineVersion: 99 }, issue.sourceRefs),
    provenanceFor({ ...f.manifest.source, contentHash: 'f'.repeat(64) }, issue.sourceRefs),
    provenanceFor(f.manifest.source, [{ ...issue.sourceRefs[0], id: 'wrong-source-id' }]),
    provenanceFor(f.manifest.source, []),
  ];
  for (const replacement of cases) {
    await writeFile(path, body.replace(exact, replacement));
    await assert.rejects(loadPackage(f.root), /exact source provenance/);
  }
  await writeFile(path, body);
  assert.equal((await loadPackage(f.root)).manifest.packageId, 'sample-project');
});
