import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, rm, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { validatePackage } from '../scripts/validate-package.mjs';
import { packageFixture, digest } from './package-fixtures.mjs';
const exec = promisify(execFile);

test('two synthetic projects derive complete coverage from different catalogs and decision outcomes', async t => {
  const first = await packageFixture(t, 1), second = await packageFixture(t, 2);
  const a = await validatePackage(first.root), b = await validatePackage(second.root);
  assert.equal(a.coverage.expected, first.analysis.records.length);
  assert.equal(b.coverage.expected, second.analysis.records.length);
  assert.notEqual(a.coverage.expected, b.coverage.expected);
  assert.equal(a.coverage.complete, true); assert.equal(b.coverage.complete, true);
  assert.equal(a.decisions.resolvedTechnical, 1); assert.equal(a.issues.blockedByDecision, 0);
  assert.equal(b.decisions.requiresInput, 1); assert.equal(b.issues.blockedByDecision, 1);
  assert.equal(a.reviewStatus, 'draft'); assert.match(a.notice, /does not approve implementation/);
  assert.ok(second.analysis.records.some(record => record.kind === 'entity-field'));
  assert.ok(first.analysis.records.some(record => record.path.includes('~1') && record.path.includes('~0')));
});

test('coverage requires every dynamic source identity exactly once', async t => {
  const f = await packageFixture(t);
  const original = structuredClone(f.traceability.records);
  f.traceability.records.pop(); await f.save();
  await assert.rejects(validatePackage(f.root), /Incomplete traceability coverage/);
  f.traceability.records = [...original, original[0]]; await f.save();
  await assert.rejects(validatePackage(f.root), /duplicate traceability/);
  f.traceability.records = original; f.traceability.records[0].path = '/unknown'; await f.save();
  await assert.rejects(validatePackage(f.root), /Unknown or duplicate traceability/);
});

test('traceability preserves captured statuses and visibility, including hidden answered records', async t => {
  const f = await packageFixture(t);
  const visible = f.traceability.records.find(record => record.kind === 'question' && record.visible);
  visible.status = 'NOT_APPLICABLE'; await f.save();
  await assert.rejects(validatePackage(f.root), /status differs/);
  visible.status = f.analysis.records.find(record => record.path === visible.path).status;
  const hidden = f.traceability.records.find(record => record.kind === 'captured-answer' && record.visible === false);
  hidden.disposition = 'mapped'; hidden.issueKeys = ['SPEC-2']; await f.save();
  await assert.rejects(validatePackage(f.root), /hidden source cannot become/);
});

test('source references and traceability mappings must be reciprocal', async t => {
  const f = await packageFixture(t);
  const feature = f.traceability.records.find(record => record.kind === 'feature');
  feature.issueKeys = ['SPEC-1']; await f.save();
  await assert.rejects(validatePackage(f.root), /missing reciprocal traceability/);
  feature.issueKeys = ['SPEC-1', 'SPEC-2'];
  const entity = f.traceability.records.find(record => record.kind === 'entity');
  entity.disposition = 'mapped'; entity.issueKeys = ['SPEC-2']; await f.save();
  await assert.rejects(validatePackage(f.root), /lacks reciprocal source reference/);
});

test('every record needs an explicit disposition', async t => {
  const f = await packageFixture(t);
  delete f.traceability.records[0].disposition; await f.save();
  await assert.rejects(validatePackage(f.root), /explicit traceability disposition/);
});

test('technical decisions require a recorded rationale and choice while unresolved decisions require consistent gates', async t => {
  const resolved = await packageFixture(t);
  resolved.decisions.decisions[0].choice = ''; await resolved.save();
  await assert.rejects(validatePackage(resolved.root), /requires a choice/);
  const open = await packageFixture(t, 2);
  open.decisions.decisions[0].affectedIssueKeys = []; await open.save();
  await assert.rejects(validatePackage(open.root), /lacks a consistent decision record/);
});

test('developer decisions cannot disappear from the authored decision register', async t => {
  const f = await packageFixture(t);
  f.decisions.decisions = []; await f.save();
  await assert.rejects(validatePackage(f.root), /unknown or unlinked decision/);
});

test('decision source references require reciprocal traceability decisionIds', async t => {
  const f = await packageFixture(t);
  const record = f.traceability.records.find(record => record.decisionIds);
  delete record.decisionIds; await f.save();
  await assert.rejects(validatePackage(f.root), /missing reciprocal traceability decision/);
});

test('page maps cover captured pages without pinning a page count or final routing', async t => {
  const f = await packageFixture(t, 2);
  f.pageMap.pages[0].proposedPath = null; await f.save();
  assert.equal((await validatePackage(f.root)).valid, true);
  f.pageMap.pages = []; await f.save();
  await assert.rejects(validatePackage(f.root), /Incomplete page-map coverage/);
});

test('source bytes, approval evidence, capture receipt, and derived analysis remain verifiable', async t => {
  const f = await packageFixture(t);
  await f.write('source/approved-export.json', '{}');
  await assert.rejects(validatePackage(f.root), /SHA-256/);
  await f.save();
  f.receipt.exportFileSha256 = 'f'.repeat(64); await f.save();
  await assert.rejects(validatePackage(f.root), /receipt.*(?:digest|pinned source)/);
  f.receipt.exportFileSha256 = f.manifest.source.exportFileSha256; await f.save();
  await f.write('source/analysis.json', { questions: [], records: [] });
  await assert.rejects(validatePackage(f.root), /owned file|analysis does not match/);
  f.snapshot.approvals[0].hash = 'f'.repeat(64);
  const invalid = JSON.stringify(f.snapshot);
  f.manifest.source.exportFileSha256 = digest(invalid); await f.save(); await f.write('source/approved-export.json', invalid);
  await assert.rejects(validatePackage(f.root), /approval/);
});

test('all authored handoff documents are required and nonempty', async t => {
  const f = await packageFixture(t);
  await f.write('DOMAIN-MODEL.md', ' \n');
  await assert.rejects(validatePackage(f.root), /document must be nonempty/);
  await f.save(); await rm(join(f.root, 'ACCEPTANCE.md'));
  await assert.rejects(validatePackage(f.root), /ENOENT/);
});

test('local Markdown links are validated without fetching external references', async t => {
  const f = await packageFixture(t);
  await f.write('README.md', '[External](https://never-fetch.example.invalid/)\n[Specification](SPECIFICATION.md#overview)\n');
  assert.equal((await validatePackage(f.root)).valid, true);
  await f.write('README.md', '[Escapes](../outside.md)\n');
  await assert.rejects(validatePackage(f.root), /escapes output/);
  await f.write('README.md', '[Missing](missing.md)\n');
  await assert.rejects(validatePackage(f.root), /ENOENT/);
  await f.write('README.md', '[Secret](outside.md)\n');
  await symlink('/etc/passwd', join(f.root, 'outside.md'));
  await assert.rejects(validatePackage(f.root), /escapes package/);
});

test('agent state describes an unimplemented handoff rather than executed work', async t => {
  const f = await packageFixture(t);
  await f.write('state/agent-state.json', { schemaVersion: '1.0.0', phase: 'implemented', implementationStatus: 'complete' });
  await assert.rejects(validatePackage(f.root), /planned, unimplemented/);
});

test('review status supports draft and approved independently of coverage completeness', async t => {
  const f = await packageFixture(t);
  f.manifest.reviewStatus = 'approved'; await f.save();
  assert.equal((await validatePackage(f.root)).reviewStatus, 'approved');
  f.manifest.reviewStatus = 'complete'; await f.save();
  await assert.rejects(validatePackage(f.root), /reviewStatus/);
});

test('CLI default is local validation and offline planning with no gh subprocess or import state', async t => {
  const f = await packageFixture(t);
  const script = fileURLToPath(new URL('../scripts/import-issues.mjs', import.meta.url));
  const { stdout } = await exec(process.execPath, [script, '--package', f.root], { env: { PATH: '/nonexistent', HOME: f.root } });
  assert.equal(JSON.parse(stdout).mode, 'offline');
  const copied = await exec(process.execPath, [join(f.root, 'tools/import-issues.mjs')], { env: { PATH: '/nonexistent', HOME: f.root } });
  assert.equal(JSON.parse(copied.stdout).mode, 'offline');
  await assert.rejects(readFile(join(f.root, '.import-state/example--project.json')), { code: 'ENOENT' });
  await assert.rejects(exec(process.execPath, [script]), /Canonical skill script requires --package/);
});

test('complete handoffs require a generation checkpoint with the pinned source identity', async t => {
  const f = await packageFixture(t);
  await rm(join(f.root, 'state/generation.json'));
  await assert.rejects(validatePackage(f.root), /Checkpoint.*generation.json/);
  await f.save();
  const generation = JSON.parse(await readFile(join(f.root, 'state/generation.json')));
  generation.baselineVersion += 1;
  await f.write('state/generation.json', generation);
  await assert.rejects(validatePackage(f.root), /Checkpoint baselineVersion/);
});

test('copied standalone tools must exist and match every checkpoint-owned digest', async t => {
  const f = await packageFixture(t);
  for (const name of ['source.mjs', 'import-issues.mjs', 'validate-package.mjs']) {
    await rm(join(f.root, 'tools', name));
    await assert.rejects(validatePackage(f.root), /changed or missing owned file/);
    await f.save();
    await f.write(`tools/${name}`, '// Modified after capture\n');
    await assert.rejects(validatePackage(f.root), /changed or missing owned file/);
    await f.save();
  }
  const generation = JSON.parse(await readFile(join(f.root, 'state/generation.json')));
  delete generation.files['tools/source.mjs'];
  await f.write('state/generation.json', generation);
  await assert.rejects(validatePackage(f.root), /invalid owned-file inventory/);
});
