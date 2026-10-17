#!/usr/bin/env node
// Complete local handoff validation. Built-ins only; never fetches links or authenticates.
import { readFile, readdir } from 'node:fs/promises';
import { resolve, dirname, extname, basename } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { loadPackage, safeFile, defaultPackageRoot } from './import-issues.mjs';
import { analyzeSource, verifyCheckpointIntegrity } from './source.mjs';

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const text = value => typeof value === 'string' && value.trim().length > 0;
const identityFields = ['projectId', 'baselineId', 'baselineVersion', 'contentHash'];
const refKey = ref => JSON.stringify([ref.kind, ref.id, ref.path]);
const sourceIdentity = source => Object.fromEntries(identityFields.map(key => [key, source[key]]));
const dispositions = ['context', 'excluded', 'hidden-context', 'not-applicable', 'mapped', 'unresolved'];
const decisionStatuses = ['RESOLVED_TECHNICAL', 'PROPOSED', 'REQUIRES_INPUT'];
const documents = ['README.md', 'SPECIFICATION.md', 'CONTEXT.md', 'DOMAIN-MODEL.md', 'DECISIONS.md', 'ACCEPTANCE.md', 'IMPLEMENTATION-WORKFLOW.md'];
const readJson = async (root, name) => JSON.parse(await readFile(await safeFile(root, name), 'utf8'));
function checkIdentity(value, expected, label) {
  assert(object(value) && identityFields.every(key => value[key] === expected[key]), `${label}: source identity mismatch`);
}
function knownKeys(value, issues, label) {
  assert(Array.isArray(value) && value.every(key => text(key) && issues.has(key)) && new Set(value).size === value.length, `${label}: invalid or unknown issueKeys`);
}
function checkReferences(refs, records, label) {
  assert(Array.isArray(refs) && refs.length > 0, `${label}: missing sourceRefs`);
  const seen = new Set();
  for (const ref of refs) {
    const key = refKey(ref);
    assert(records.has(key) && !seen.has(key), `${label}: unknown or duplicate source reference ${ref.id}`);
    seen.add(key);
  }
}

function validateTraceability(trace, pkg, analysis) {
  assert(trace.schemaVersion === '1.0.0' && Array.isArray(trace.records), 'Invalid traceability document');
  checkIdentity(trace.source, pkg.manifest.source, 'traceability');
  const expected = new Map(analysis.records.map(record => [refKey(record), record]));
  assert(expected.size === analysis.records.length, 'Source analysis has duplicate record identities');
  const issues = new Map(pkg.manifest.issues.map(issue => [issue.key, issue]));
  const actual = new Map();
  for (const record of trace.records) {
    const key = refKey(record); const captured = expected.get(key);
    assert(captured && !actual.has(key), `Unknown or duplicate traceability record: ${record.id}`);
    assert(dispositions.includes(record.disposition), `${record.id}: missing explicit traceability disposition`);
    for (const field of ['status', 'visible']) if (Object.hasOwn(captured, field)) assert(record[field] === captured[field], `${record.id}: traceability ${field} differs from captured source`);
    knownKeys(record.issueKeys, issues, record.id);
    if (record.disposition === 'mapped') assert(record.issueKeys.length > 0, `${record.id}: mapped record requires issueKeys`);
    if (captured.visible === false) assert(['context', 'excluded', 'hidden-context', 'not-applicable'].includes(record.disposition) && record.issueKeys.length === 0, `${record.id}: hidden source cannot become an active implementation requirement`);
    if (!['mapped', 'unresolved'].includes(record.disposition)) assert(record.issueKeys.length === 0, `${record.id}: context/excluded records cannot have active issue mappings`);
    for (const issueKey of record.issueKeys) assert(issues.get(issueKey).sourceRefs.some(ref => refKey(ref) === key), `${record.id}: issue ${issueKey} lacks reciprocal source reference`);
    actual.set(key, record);
  }
  assert(actual.size === expected.size, `Incomplete traceability coverage: ${actual.size}/${expected.size}`);
  for (const issue of issues.values()) for (const ref of issue.sourceRefs) {
    const record = actual.get(refKey(ref));
    assert(record?.issueKeys.includes(issue.key), `${issue.key}: source reference missing reciprocal traceability mapping`);
  }
  return { expected, actual, issues };
}

function validateDecisions(document, pkg, coverage) {
  assert(document.schemaVersion === '1.0.0' && Array.isArray(document.decisions), 'Invalid decisions document');
  checkIdentity(document.source, pkg.manifest.source, 'decisions');
  const decisions = new Map();
  for (const decision of document.decisions) {
    assert(text(decision.id) && !decisions.has(decision.id) && decisionStatuses.includes(decision.status), 'Invalid or duplicate decision');
    assert(text(decision.rationale) && text(decision.owner) && typeof decision.choice === 'string', `${decision.id}: missing decision rationale/owner/choice`);
    checkReferences(decision.sourceRefs, coverage.expected, decision.id);
    knownKeys(decision.affectedIssueKeys, coverage.issues, decision.id);
    assert(decision.issueKey === null || coverage.issues.get(decision.issueKey)?.kind === 'decision', `${decision.id}: issueKey must reference a decision issue`);
    if (decision.status === 'RESOLVED_TECHNICAL') {
      assert(text(decision.choice), `${decision.id}: resolved technical decision requires a choice`);
      if (decision.issueKey) assert(![...coverage.issues.values()].some(issue => issue.decisionBlockers.includes(decision.issueKey)), `${decision.id}: resolved technical decision cannot remain an open blocker`);
    } else {
      assert(!decision.affectedIssueKeys.length || decision.issueKey, `${decision.id}: unresolved affected issues require a decision issue`);
      for (const key of decision.affectedIssueKeys) assert(coverage.issues.get(key).decisionBlockers.includes(decision.issueKey), `${decision.id}: affected issue ${key} lacks its decision gate`);
    }
    for (const ref of decision.sourceRefs) assert(coverage.actual.get(refKey(ref)).decisionIds?.includes(decision.id), `${decision.id}: missing reciprocal traceability decision mapping`);
    decisions.set(decision.id, decision);
  }
  for (const record of coverage.actual.values()) {
    assert(record.decisionIds === undefined || (Array.isArray(record.decisionIds) && new Set(record.decisionIds).size === record.decisionIds.length), `${record.id}: invalid decisionIds`);
    const linked = (record.decisionIds ?? []).map(id => {
      const decision = decisions.get(id);
      assert(decision && decision.sourceRefs.some(ref => refKey(ref) === refKey(record)), `${record.id}: unknown or unlinked decision ${id}`);
      return decision;
    });
    if ((record.status === 'DEVELOPER_TO_DECIDE' || (record.kind === 'decision' && record.status === 'OPEN')) && record.visible !== false) assert(linked.length > 0, `${record.id}: developer decision requires an explicit decision record`);
    if (record.disposition === 'unresolved') {
      const open = linked.filter(decision => decision.status !== 'RESOLVED_TECHNICAL');
      assert(open.length > 0, `${record.id}: unresolved record requires an open decision`);
      for (const key of record.issueKeys) if (coverage.issues.get(key).kind !== 'decision') assert(open.some(decision => decision.affectedIssueKeys.includes(key) && coverage.issues.get(key).decisionBlockers.includes(decision.issueKey)), `${record.id}: unresolved implementation mapping ${key} lacks a decision gate`);
    }
  }
  // Every declared gate must be backed by an unresolved decision and its affected set.
  for (const issue of coverage.issues.values()) for (const blocker of issue.decisionBlockers) {
    assert([...decisions.values()].some(decision => decision.status !== 'RESOLVED_TECHNICAL' && decision.issueKey === blocker && decision.affectedIssueKeys.includes(issue.key)), `${issue.key}: decision blocker ${blocker} lacks a consistent decision record`);
  }
  return decisions;
}

function validatePages(pageMap, pkg, analysis, issues) {
  assert(pageMap.schemaVersion === '1.0.0' && Array.isArray(pageMap.pages), 'Invalid page-map document');
  checkIdentity(pageMap.source, pkg.manifest.source, 'page-map');
  const expected = new Set(analysis.records.filter(record => record.kind === 'page').map(record => record.id));
  const seen = new Set();
  for (const page of pageMap.pages) {
    assert(expected.has(page.sourceId) && !seen.has(page.sourceId), `Unknown or duplicate page sourceId: ${page.sourceId}`);
    assert(page.proposedPath === null || (text(page.proposedPath) && page.proposedPath.startsWith('/') && !page.proposedPath.startsWith('//')), `${page.sourceId}: invalid proposedPath`);
    knownKeys(page.issueKeys, issues, page.sourceId);
    seen.add(page.sourceId);
  }
  assert(seen.size === expected.size, `Incomplete page-map coverage: ${seen.size}/${expected.size}`);
}

async function validateCapture(root, source, analysis) {
  const receipt = await readJson(root, 'source/receipt.json');
  checkIdentity(receipt, source, 'receipt');
  assert(receipt.schemaVersion === '1.0.0' && text(receipt.toolVersion) && receipt.environment === 'production' && receipt.exportFile === source.exportFile && receipt.exportFileSha256 === source.exportFileSha256 && receipt.contentHashRecomputed === false, 'Invalid source receipt or export digest');
  assert(text(receipt.capturedAt) && !Number.isNaN(Date.parse(receipt.capturedAt)), 'Invalid source receipt capturedAt');
  let apiUrl; try { apiUrl = new URL(receipt.apiUrl); } catch { throw new Error('Invalid source receipt apiUrl'); }
  assert(apiUrl.protocol === 'https:' && !apiUrl.username && !apiUrl.password, 'Invalid source receipt apiUrl');
  assert(isDeepStrictEqual(await readJson(root, 'source/analysis.json'), analysis), 'Source analysis does not match captured export');
}

async function markdownFiles(root, directory = '') {
  const files = [];
  for (const entry of await readdir(resolve(root, directory), { withFileTypes: true })) {
    if (entry.name === '.import-state') continue;
    const name = directory ? `${directory}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await markdownFiles(root, name));
    else if (extname(entry.name).toLowerCase() === '.md') files.push(name);
  }
  return files;
}
async function validateDocuments(root) {
  for (const name of documents) assert(text(await readFile(await safeFile(root, name), 'utf8')), `${name}: document must be nonempty`);
  let linkCount = 0;
  for (const name of await markdownFiles(root)) {
    const markdown = await readFile(await safeFile(root, name), 'utf8');
    // Inline and reference-style Markdown destinations; remote URLs remain local text.
    const links = [...markdown.matchAll(/!?\[[^\]\n]*\]\((<[^>]+>|[^\s)]+)(?:\s+[^)]*)?\)/g)].map(match => match[1]);
    links.push(...[...markdown.matchAll(/^\s*\[[^\]]+\]:\s*(<[^>]+>|\S+)/gm)].map(match => match[1]));
    for (let destination of links) {
      destination = destination.replace(/^<|>$/g, '');
      if (/^(?:https?:|mailto:)/i.test(destination) || destination.startsWith('#')) continue;
      assert(!/^[a-z][a-z0-9+.-]*:/i.test(destination) && !destination.startsWith('//'), `${name}: unsafe local Markdown link`);
      const path = decodeURIComponent(destination.split(/[?#]/, 1)[0]);
      if (!path) continue;
      const absolute = resolve(root, dirname(name), path);
      const relativeName = absolute.slice(root.length + 1);
      assert(absolute.startsWith(root + '/') && !path.startsWith('/') && !path.includes('\\'), `${name}: local Markdown link escapes output`);
      await safeFile(root, relativeName); linkCount++;
    }
  }
  return linkCount;
}

/** Validate the complete authored handoff without transport, subprocesses or authentication. */
export async function validatePackage(packageRoot = defaultPackageRoot) {
  const pkg = await loadPackage(packageRoot);
  await verifyCheckpointIntegrity(pkg.root, pkg.manifest.source);
  const analysis = analyzeSource(pkg.snapshot);
  await validateCapture(pkg.root, pkg.manifest.source, analysis);
  const coverage = validateTraceability(await readJson(pkg.root, 'traceability.json'), pkg, analysis);
  const decisions = validateDecisions(await readJson(pkg.root, 'decisions.json'), pkg, coverage);
  validatePages(await readJson(pkg.root, 'page-map.json'), pkg, analysis, coverage.issues);
  const state = await readJson(pkg.root, 'state/agent-state.json');
  assert(state.schemaVersion === '1.0.0' && state.phase === 'planned' && state.implementationStatus === 'unimplemented', 'Agent state must describe a planned, unimplemented handoff');
  const localLinks = await validateDocuments(pkg.root);
  return {
    valid: true, packageId: pkg.manifest.packageId, reviewStatus: pkg.manifest.reviewStatus,
    source: sourceIdentity(pkg.manifest.source),
    coverage: { expected: coverage.expected.size, recorded: coverage.actual.size, complete: true },
    issues: { total: pkg.manifest.issues.length, readyForSpecReview: pkg.manifest.issues.filter(issue => issue.readiness === 'ready-for-spec-review').length, blockedByDecision: pkg.manifest.issues.filter(issue => issue.readiness === 'blocked-by-decision').length },
    decisions: { resolvedTechnical: [...decisions.values()].filter(decision => decision.status === 'RESOLVED_TECHNICAL').length, proposed: [...decisions.values()].filter(decision => decision.status === 'PROPOSED').length, requiresInput: [...decisions.values()].filter(decision => decision.status === 'REQUIRES_INPUT').length },
    documents: { required: documents.length, localLinks },
    notice: 'Complete local handoff validation. Specification review status is recorded separately; this report does not approve implementation.',
  };
}

export async function main(argv = process.argv.slice(2)) {
  let root = defaultPackageRoot;
  if (argv.length === 1 && argv[0] === '--help') { process.stdout.write('Usage: node tools/validate-package.mjs --package PATH\nOmit --package only when this script is inside an output package tools directory. No network calls.\n'); return; }
  if (argv.length) { assert(argv.length === 2 && argv[0] === '--package' && text(argv[1]) && !argv[1].startsWith('--'), 'Use --package PATH'); root = argv[1]; }
  else assert(basename(dirname(fileURLToPath(import.meta.url))) === 'tools', 'Canonical skill script requires --package PATH');
  process.stdout.write(JSON.stringify(await validatePackage(root), null, 2) + '\n');
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) main().catch(error => { process.stderr.write(`Validation failed: ${error.message}\n`); process.exitCode = 1; });
