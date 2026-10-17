import { createHash } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
/** Frozen Discovery 1.0.0 source validation and exhaustive record inventory. */
export const toolVersion = '1.0.0';
export const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const sha256Pattern = /^[0-9a-f]{64}$/;
const statuses = new Set(['CONFIRMED', 'TENTATIVE', 'UNDECIDED', 'DEVELOPER_TO_DECIDE', 'NOT_APPLICABLE']);
const provenance = new Set(['createdAt', 'createdBy', 'updatedAt', 'updatedBy']);
const collections = ['categories', 'requirements', 'features', 'pages', 'entities', 'references', 'decisions'];
const fail = message => { throw new Error(`Invalid Discovery source: ${message}.`); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const timestamp = value => typeof value === 'string' && /^\d{4}-\d\d-\d\dT/.test(value) && Number.isFinite(Date.parse(value));
export const pointerSegment = value => String(value).replaceAll('~', '~0').replaceAll('/', '~1');
function list(value, name) { if (!Array.isArray(value)) fail(`${name} must be an array`); return value; }
function identity(value, name) { if (typeof value !== 'string' || !uuid.test(value)) fail(`${name} must be a UUID`); }
function id(value, name) { if (typeof value !== 'string' || !value.trim()) fail(`${name} requires an ID`); }
function same(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => same(v, b[i]));
  if (!object(a) || !object(b)) return false;
  const keys = Object.keys(a).filter(k => !provenance.has(k)).sort();
  return same(keys, Object.keys(b).filter(k => !provenance.has(k)).sort()) && keys.every(k => same(a[k], b[k]));
}
function questionIndex(snapshot) {
  const questions = new Map();
  const sections = new Set();
  for (const [s, section] of list(snapshot.effectiveCatalog.sections, 'catalog sections').entries()) {
    if (!object(section)) fail('invalid catalog section');
    id(section.id, 'section');
    if (sections.has(section.id)) fail('duplicate section ID');
    sections.add(section.id);
    for (const [q, question] of list(section.questions, 'section questions').entries()) {
      if (!object(question)) fail('invalid question');
      id(question.id, 'question');
      if (questions.has(question.id) || sections.has(question.id)) fail('duplicate question ID');
      if (!['text', 'textarea', 'single', 'multi', 'number', 'boolean'].includes(question.type) || typeof question.label !== 'string') fail('unsupported question definition');
      if (['single', 'multi'].includes(question.type)) {
        if (!Array.isArray(question.options) || !question.options.length || question.options.some(o => !object(o) || typeof o.value !== 'string') || new Set(question.options.map(o => o.value)).size !== question.options.length) fail('invalid question choices');
      }
      questions.set(question.id, { id: question.id, path: `/effectiveCatalog/sections/${s}/questions/${q}`, sectionId: section.id, question });
    }
  }
  const visiting = new Set(), done = new Set();
  function visit(key) {
    if (done.has(key)) return;
    if (visiting.has(key)) fail('cyclic visibility conditions');
    visiting.add(key);
    const rule = questions.get(key).question.visibleWhen;
    if (rule !== undefined && rule !== null) {
      if (!object(rule) || Object.keys(rule).sort().join() !== 'operator,questionId,value' || !questions.has(rule.questionId) || !['equals', 'includes'].includes(rule.operator)) fail('unknown or invalid visibility condition');
      const parent = questions.get(rule.questionId).question;
      if (rule.operator === 'includes' && parent.type !== 'multi') fail('includes requires a multi-choice parent');
      if (parent.type === 'number' || (parent.type === 'boolean' ? typeof rule.value !== 'boolean' : typeof rule.value !== 'string')) fail('invalid visibility condition value');
      if (['single', 'multi'].includes(parent.type) && !parent.options.some(o => o.value === rule.value)) fail('unknown condition choice');
      visit(rule.questionId);
    }
    visiting.delete(key); done.add(key);
  }
  for (const key of questions.keys()) visit(key);
  for (const section of snapshot.effectiveCatalog.sections) if (questions.has(section.id)) fail('section and question IDs collide');
  return questions;
}

export function validateSource(snapshot, expected = {}) {
  if (!object(snapshot) || snapshot.schemaVersion !== '1.0.0') fail('only schemaVersion 1.0.0 is supported');
  if (!object(snapshot.project) || !object(snapshot.baseline)) fail('project and baseline are required');
  identity(snapshot.project.id, 'project.id'); identity(snapshot.baseline.id, 'baseline.id'); identity(snapshot.baseline.requiredClientId, 'baseline.requiredClientId');
  if (!Number.isSafeInteger(snapshot.baseline.version) || snapshot.baseline.version < 1 || !timestamp(snapshot.lockedAt) || !sha256Pattern.test(snapshot.contentHash)) fail('locked baseline metadata is invalid');
  const actual = { projectId: snapshot.project.id, baselineId: snapshot.baseline.id, baselineVersion: snapshot.baseline.version, contentHash: snapshot.contentHash };
  for (const key of Object.keys(actual)) if (expected[key] !== undefined && (key.endsWith('Id') ? String(expected[key]).toLowerCase() !== actual[key].toLowerCase() : expected[key] !== actual[key])) fail(`${key} does not match the selected baseline`);
  const approvals = list(snapshot.approvals, 'approvals');
  for (const a of approvals) if (!object(a) || !uuid.test(a.userId) || !['ADMIN', 'CLIENT'].includes(a.role) || a.hash !== snapshot.contentHash || !timestamp(a.approvedAt)) fail('approval metadata or hash does not match');
  const client = approvals.find(a => a.role === 'CLIENT' && a.userId.toLowerCase() === snapshot.baseline.requiredClientId.toLowerCase());
  if (!client || !approvals.some(a => a.role === 'ADMIN' && a.userId.toLowerCase() !== client.userId.toLowerCase())) fail('independent administrator and designated client approvals are required');
  if (!object(snapshot.requirements) || !object(snapshot.requirements.answers) || !object(snapshot.effectiveCatalog)) fail('requirements and effective catalog are required');
  for (const key of collections) list(snapshot.requirements[key], `requirements.${key}`);
  if (!object(snapshot.requirements.commercial)) fail('commercial fields are required');
  list(snapshot.history, 'history'); list(snapshot.changeRequests, 'changeRequests');
  const questions = questionIndex(snapshot), allIds = new Set(questions.keys());
  for (const section of snapshot.effectiveCatalog.sections) allIds.add(section.id);
  const idsByKind = Object.fromEntries(collections.map(key => [key, new Set()]));
  for (const key of collections) for (const record of snapshot.requirements[key]) {
    if (!object(record)) fail(`invalid ${key} record`);
    id(record.id, key);
    if (idsByKind[key].has(record.id)) fail(`duplicate ${key} ID`);
    idsByKind[key].add(record.id);
    if (key === 'categories') {
      const section = snapshot.effectiveCatalog.sections.find(s => s.id === record.id);
      if (!section || !same(section.questions, record.questions)) fail('custom category questions differ from effective catalog');
      for (const q of list(record.questions, 'category questions')) if (!questions.has(q.id)) fail('unknown custom question');
    } else {
      if (allIds.has(record.id)) fail('duplicate record ID');
      allIds.add(record.id);
    }
    if (key === 'entities') for (const field of list(record.fields, 'entity fields')) {
      if (!object(field)) fail('invalid entity field');
      id(field.id, 'entity field');
      if (allIds.has(field.id)) fail('duplicate entity field ID');
      allIds.add(field.id);
    }
  }
  for (const [key, answer] of Object.entries(snapshot.requirements.answers)) {
    if (!questions.has(key)) fail('unknown captured answer question');
    if (!object(answer) || !statuses.has(answer.status) || !Object.hasOwn(answer, 'value')) fail('invalid answer state');
    const q = questions.get(key).question, v = answer.value;
    if (v === null) { if (answer.status === 'CONFIRMED') fail('confirmed answer requires a value'); continue; }
    if ((['text', 'textarea', 'single'].includes(q.type) && typeof v !== 'string') || (q.type === 'boolean' && typeof v !== 'boolean') || (q.type === 'number' && (typeof v !== 'number' || !Number.isFinite(v))) || (q.type === 'multi' && (!Array.isArray(v) || v.some(item => typeof item !== 'string')))) fail('answer type does not match question');
    if (['single', 'multi'].includes(q.type) && (q.type === 'multi' ? v : [v]).some(value => !q.options.some(o => o.value === value))) fail('unknown captured answer choice');
  }
  const refs = (values, allowed, name) => { if (!Array.isArray(values) || values.some(v => !allowed.has(v))) fail(`unknown ${name} reference`); };
  for (const key of ['requirements', 'features']) for (const r of snapshot.requirements[key]) {
    if (r.categoryId && !idsByKind.categories.has(r.categoryId)) fail('unknown category reference');
    refs(r.references, idsByKind.references, 'source');
    if (key === 'features') refs(r.dependencies, idsByKind.features, 'feature dependency');
    if (!statuses.has(r.status)) fail('invalid requirement status');
  }
  for (const r of snapshot.requirements.pages) refs(r.featureIds, idsByKind.features, 'page feature');
  for (const r of snapshot.requirements.decisions) {
    refs(r.relatedIds, allIds, 'decision');
    if (!['OPEN', 'RESOLVED', 'ACCEPTED'].includes(r.status)) fail('invalid decision status');
  }
  return snapshot;
}

export function analyzeSource(snapshot) {
  validateSource(snapshot);
  const index = questionIndex(snapshot), answers = snapshot.requirements.answers, visibility = new Map();
  function visible(key) {
    if (visibility.has(key)) return visibility.get(key);
    const rule = index.get(key).question.visibleWhen;
    let result = true;
    if (rule) {
      const answer = answers[rule.questionId];
      result = visible(rule.questionId) && !!answer && ['CONFIRMED', 'TENTATIVE'].includes(answer.status) && (rule.operator === 'includes' ? Array.isArray(answer.value) && answer.value.includes(rule.value) : answer.value === rule.value);
    }
    visibility.set(key, result); return result;
  }
  const questions = [...index.values()].map(q => ({ ...q, ...(Object.hasOwn(answers, q.id) ? { answer: answers[q.id] } : {}), status: answers[q.id]?.status ?? 'UNANSWERED', visible: visible(q.id) }));
  const records = [{ kind: 'project', id: snapshot.project.id, path: '/project', disposition: 'context' }, { kind: 'baseline', id: snapshot.baseline.id, path: '/baseline', disposition: 'context' }, ...questions.map(q => ({ kind: 'question', id: q.id, path: q.path, status: q.status, visible: q.visible }))];
  for (const [key, answer] of Object.entries(answers)) records.push({ kind: 'captured-answer', id: key, path: `/requirements/answers/${pointerSegment(key)}`, status: answer.status, visible: visible(key) });
  const singular = { categories: 'category', requirements: 'requirement', features: 'feature', pages: 'page', entities: 'entity', references: 'reference', decisions: 'decision' };
  for (const key of collections) snapshot.requirements[key].forEach((r, i) => {
    const path = `/requirements/${key}/${i}`;
    records.push({ kind: singular[key], id: r.id, path, ...(r.status ? { status: r.status } : {}) });
    if (key === 'categories') r.questions.forEach((q, n) => records.push({ kind: 'category-question', id: q.id, path: `${path}/questions/${n}`, status: answers[q.id]?.status ?? 'UNANSWERED', visible: visible(q.id) }));
    if (key === 'entities') r.fields.forEach((field, n) => records.push({ kind: 'entity-field', id: field.id, path: `${path}/fields/${n}` }));
  });
  for (const key of Object.keys(snapshot.requirements.commercial).filter(key => !provenance.has(key))) records.push({ kind: 'commercial-field', id: key, path: `/requirements/commercial/${pointerSegment(key)}` });
  for (const [key, kind] of [['history', 'history'], ['changeRequests', 'change-request'], ['approvals', 'approval']]) snapshot[key].forEach((r, i) => records.push({ kind, id: String(r.id ?? r.userId ?? i), path: `/${key}/${i}`, ...(r.status ? { status: r.status } : {}), disposition: 'context' }));
  const byKind = {};
  for (const r of records) byKind[r.kind] = (byKind[r.kind] ?? 0) + 1;
  return { questions, records, totals: { questions: questions.length, visibleQuestions: questions.filter(q => q.visible).length, capturedAnswers: Object.keys(answers).length, unansweredQuestions: questions.filter(q => q.status === 'UNANSWERED').length, records: records.length, byKind } };
}


export const checkpointOwnedPaths = Object.freeze(['source/approved-export.json', 'source/receipt.json', 'source/analysis.json', 'tools/source.mjs', 'tools/import-issues.mjs', 'tools/validate-package.mjs']);
export const fileSha256 = bytes => createHash('sha256').update(bytes).digest('hex');
/** Reject symlinks at every existing component, including package ancestors. */
export async function safeOutputPath(path) {
  const absolute = resolve(path), parts = absolute.split(sep).filter(Boolean);
  let current = sep;
  for (const [i, part] of parts.entries()) {
    current = join(current, part);
    let stat;
    try { stat = await lstat(current); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    if (stat.isSymbolicLink()) throw new Error('Checkpoint/output paths must not contain symlinks.');
    if (i < parts.length - 1 && !stat.isDirectory()) throw new Error('Checkpoint/output parent must be a directory.');
  }
  return absolute;
}

/** Shared by offline resume and the copied standalone package validator. */
export async function verifyCheckpointIntegrity(output, expected = {}) {
  const root = await safeOutputPath(output);
  const checkpoint = await safeOutputPath(join(root, 'state/generation.json'));
  let state;
  try {
    if (!(await lstat(checkpoint)).isFile()) throw new Error();
    state = JSON.parse(await readFile(checkpoint, 'utf8'));
  } catch { throw new Error('Checkpoint requires a valid regular state/generation.json file.'); }
  if (!object(state) || state.schemaVersion !== '1.0.0' || state.toolVersion !== toolVersion || !uuid.test(state.projectId) || !uuid.test(state.baselineId) || !Number.isSafeInteger(state.baselineVersion) || state.baselineVersion < 1 || !sha256Pattern.test(state.contentHash) || !sha256Pattern.test(state.exportFileSha256) || !['collecting', 'complete'].includes(state.status) || !object(state.files)) throw new Error('Checkpoint project or tool version does not match supported metadata.');
  for (const key of ['projectId', 'baselineId', 'baselineVersion', 'contentHash']) if (expected[key] !== undefined && (key.endsWith('Id') ? String(expected[key]).toLowerCase() !== state[key].toLowerCase() : expected[key] !== state[key])) throw new Error(`Checkpoint ${key} does not match the requested source.`);
  if (Object.keys(state.files).sort().join() !== [...checkpointOwnedPaths].sort().join()) throw new Error('Checkpoint has an invalid owned-file inventory.');
  const bytes = new Map();
  for (const relative of checkpointOwnedPaths) {
    const path = await safeOutputPath(join(root, relative));
    let data, stat;
    try { stat = await lstat(path); data = stat.isFile() ? await readFile(path) : undefined; } catch { /* Report the owned path without exposing unrelated filesystem details. */ }
    if (!data || !sha256Pattern.test(state.files[relative]) || fileSha256(data) !== state.files[relative]) throw new Error(`Checkpoint found changed or missing owned file: ${relative}. Preserve the output and resolve the conflict explicitly.`);
    bytes.set(relative, data);
  }
  if (fileSha256(bytes.get('source/approved-export.json')) !== state.exportFileSha256) throw new Error('Checkpoint source digest does not match the checkpoint.');
  let source, receipt, analysis;
  try {
    source = validateSource(JSON.parse(bytes.get('source/approved-export.json').toString('utf8')), state);
    receipt = JSON.parse(bytes.get('source/receipt.json').toString('utf8'));
    analysis = JSON.parse(bytes.get('source/analysis.json').toString('utf8'));
  } catch { throw new Error('Checkpoint source metadata or owned JSON is invalid.'); }
  if (!object(receipt) || receipt.schemaVersion !== '1.0.0' || receipt.exportFileSha256 !== state.exportFileSha256 || receipt.contentHash !== source.contentHash || receipt.projectId !== source.project.id || receipt.baselineId !== source.baseline.id || receipt.baselineVersion !== source.baseline.version || receipt.toolVersion !== toolVersion || receipt.environment !== 'production' || receipt.contentHashRecomputed !== false || receipt.exportFile !== 'source/approved-export.json' || !timestamp(receipt.capturedAt)) throw new Error('Checkpoint receipt does not match the pinned source.');
  let api;
  try { api = new URL(receipt.apiUrl); } catch { throw new Error('Checkpoint receipt API URL is invalid.'); }
  if (api.username || api.password || api.search || api.hash || (api.protocol !== 'https:' && !(api.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(api.hostname))) || (receipt.exportBytes !== undefined && receipt.exportBytes !== bytes.get('source/approved-export.json').length)) throw new Error('Checkpoint receipt URL or byte count is invalid.');
  if (JSON.stringify(analysis) !== JSON.stringify(analyzeSource(source))) throw new Error('Checkpoint analysis does not match the pinned source.');
  return state;
}
