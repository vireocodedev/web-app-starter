import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { sourceFixture } from './fixtures.mjs';
import { analyzeSource } from '../scripts/source.mjs';
import { markerFor, provenanceFor } from '../scripts/import-issues.mjs';
export const digest = bytes => createHash('sha256').update(bytes).digest('hex');
export async function packageFixture(t, variant = 1) {
  const root = await mkdtemp(join(tmpdir(), 'discovery-package-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const snapshot = sourceFixture(variant);
  const n = variant === 1 ? '1' : '2';
  snapshot.requirements.answers[`enabled.${n}`].value = true;
  snapshot.requirements.answers[`detail.${n}`] = { value: 'Stale hidden answer', status: 'CONFIRMED' };
  snapshot.requirements.answers[`count.${n}`].status = 'DEVELOPER_TO_DECIDE';
  const sourceBytes = ` ${JSON.stringify(snapshot, null, 2)}\n`;
  const source = { projectId: snapshot.project.id, baselineId: snapshot.baseline.id, baselineVersion: snapshot.baseline.version, contentHash: snapshot.contentHash };
  const analysis = analyzeSource(snapshot);
  const ref = record => ({ kind: record.kind, id: record.id, path: record.path });
  const feature = ref(analysis.records.find(record => record.kind === 'feature'));
  const decisionRefs = analysis.records.filter(record => record.id === `count.${n}` || record.kind === 'decision').map(ref);
  const issues = [
    { key: 'SPEC-1', kind: 'initiative', title: 'Review specification', parent: null, blockedBy: [], sourceRefs: [feature] },
    { key: 'SPEC-2', kind: 'story', title: 'Review application behavior', parent: 'SPEC-1', blockedBy: variant === 1 ? [] : ['SPEC-3'], sourceRefs: [feature] },
    ...(variant === 1 ? [] : [{ key: 'SPEC-3', kind: 'decision', title: 'Choose behavior', parent: 'SPEC-1', blockedBy: [], sourceRefs: decisionRefs }]),
  ].map(issue => ({ ...issue, bodyFile: `bodies/${issue.key}.md`, decisionBlockers: issue.blockedBy, labels: ['spec:review'], ownerBoundary: 'Future application repository', readiness: issue.blockedBy.length ? 'blocked-by-decision' : 'ready-for-spec-review' }));
  const manifest = { schemaVersion: '1.0.0', packageId: `synthetic-project-${n}`, reviewStatus: 'draft', repository: null, source: { ...source, exportFile: 'source/approved-export.json', exportFileSha256: digest(sourceBytes), environment: 'production' }, labelsFile: 'issues/labels.json', issues };
  const referenceKey = ref => JSON.stringify([ref.kind, ref.id, ref.path]);
  const decisionId = `technical-choice-${n}`;
  const traceability = { schemaVersion: '1.0.0', source, records: analysis.records.map(record => {
    const issueKeys = issues.filter(issue => issue.sourceRefs.some(ref => referenceKey(ref) === referenceKey(record))).map(issue => issue.key);
    const decisionLinked = decisionRefs.some(ref => referenceKey(ref) === referenceKey(record));
    return { ...record, disposition: record.visible === false ? 'hidden-context' : decisionLinked && variant !== 1 ? 'unresolved' : issueKeys.length ? 'mapped' : 'context', issueKeys, ...(decisionLinked ? { decisionIds: [decisionId] } : {}) };
  }) };
  const decisions = { schemaVersion: '1.0.0', source, decisions: [{ id: decisionId, status: variant === 1 ? 'RESOLVED_TECHNICAL' : 'REQUIRES_INPUT', sourceRefs: decisionRefs, rationale: 'Explain the tradeoff with captured source evidence.', choice: variant === 1 ? 'Use a reversible technical default.' : '', owner: variant === 1 ? 'Specification agent' : 'Product owner', issueKey: variant === 1 ? null : 'SPEC-3', affectedIssueKeys: ['SPEC-2'] }] };
  const pageMap = { schemaVersion: '1.0.0', source, pages: analysis.records.filter(record => record.kind === 'page').map(record => ({ sourceId: record.id, proposedPath: `/proposal-${n}`, issueKeys: ['SPEC-2'] })) };
  const receipt = { schemaVersion: '1.0.0', toolVersion: '1.0.0', environment: 'production', apiUrl: 'https://discovery.example.invalid/api', ...source, exportFile: manifest.source.exportFile, exportFileSha256: manifest.source.exportFileSha256, exportBytes: Buffer.byteLength(sourceBytes), capturedAt: '2026-10-17T10:00:00Z', contentHashRecomputed: false };
  const write = async (name, value) => { await mkdir(dirname(join(root, name)), { recursive: true }); await writeFile(join(root, name), typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value, null, 2) + '\n'); };
  const save = async () => {
    await write('source/approved-export.json', sourceBytes);
    for (const [name, value] of Object.entries({ 'issues/manifest.json': manifest, 'issues/labels.json': [{ name: 'spec:review', color: 'abcdef', description: 'Specification review' }], 'source/receipt.json': receipt, 'source/analysis.json': analysis, 'traceability.json': traceability, 'decisions.json': decisions, 'page-map.json': pageMap, 'state/agent-state.json': { schemaVersion: '1.0.0', phase: 'planned', implementationStatus: 'unimplemented' } })) await write(name, value);
    for (const name of ['README', 'SPECIFICATION', 'CONTEXT', 'DOMAIN-MODEL', 'DECISIONS', 'ACCEPTANCE', 'IMPLEMENTATION-WORKFLOW']) await write(`${name}.md`, `# ${name}\n\n[Source](source/approved-export.json)\n`);
    for (const issue of issues) await write(`issues/${issue.bodyFile}`, `${markerFor(source.projectId, issue.key)}\n${provenanceFor(source, issue.sourceRefs)}\n\n## Source references\nSee source.\n\n## Acceptance criteria\nReview specification.\n\n## Dependencies\nSee manifest.\n`);
    for (const name of ['source.mjs', 'import-issues.mjs', 'validate-package.mjs']) await write(`tools/${name}`, await readFile(new URL(`../scripts/${name}`, import.meta.url)));
    const owned = ['source/approved-export.json', 'source/receipt.json', 'source/analysis.json', 'tools/source.mjs', 'tools/import-issues.mjs', 'tools/validate-package.mjs'];
    const files = {};
    for (const path of owned) files[path] = digest(await readFile(join(root, path)));
    await write('state/generation.json', { schemaVersion: '1.0.0', toolVersion: '1.0.0', status: 'collecting', ...source, exportFileSha256: manifest.source.exportFileSha256, files });
  };
  await save();
  return { root, snapshot, source, manifest, analysis, traceability, decisions, pageMap, receipt, write, save };
}
