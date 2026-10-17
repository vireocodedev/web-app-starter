import { randomUUID } from 'node:crypto';
import { lstat, mkdir, mkdtemp, readFile, readdir, rename, rmdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { fetchExportCapture } from './fetch-export.mjs';
import { analyzeSource, fileSha256, safeOutputPath as safePath, toolVersion, uuid, validateSource, verifyCheckpointIntegrity } from './source.mjs';
export { fileSha256 } from './source.mjs';

const scripts = dirname(fileURLToPath(import.meta.url));
const jsonText = value => `${JSON.stringify(value, null, 2)}\n`;
async function exists(path) { try { return await lstat(path); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } }
async function resumeOutput(projectId, output) {
  const state = await verifyCheckpointIntegrity(output, { projectId });
  const source = validateSource(JSON.parse(await readFile(join(output, 'source/approved-export.json'), 'utf8')), state);
  const receipt = JSON.parse(await readFile(join(output, 'source/receipt.json'), 'utf8'));
  return { output, source, receipt, state, resumed: true };
}
/** Create only missing ordinary directories after the source has been validated. */
async function createParents(parent) {
  const parts = resolve(parent).split(sep).filter(Boolean);
  let current = sep;
  for (const part of parts) {
    current = join(current, part);
    let stat = await exists(current);
    if (!stat) {
      try { await mkdir(current, { mode: 0o700 }); } catch (error) { if (error.code !== 'EEXIST') throw error; }
      stat = await exists(current);
    }
    if (!stat?.isDirectory() || stat.isSymbolicLink()) throw new Error('Output parents must be ordinary directories without symlinks.');
  }
}

/** Capture once, then resume offline without touching agent-authored documents. */
export async function prepareOutput({ projectId, output, profile, resume = false, capture = fetchExportCapture } = {}) {
  if (typeof projectId !== 'string' || !uuid.test(projectId)) throw new Error('projectId must be a UUID.');
  if (typeof output !== 'string' || !output.trim()) throw new Error('Provide an explicit output folder.');
  const destination = await safePath(output);
  if (destination === sep || destination === resolve('.') || destination === dirname(destination)) throw new Error('Choose a dedicated output folder.');
  const stat = await exists(destination);
  if (resume) {
    if (!stat?.isDirectory()) throw new Error('Resume output must already exist.');
    return resumeOutput(projectId, destination);
  }
  if (stat && (!stat.isDirectory() || (await readdir(destination)).length)) throw new Error('Initial output must be a new or empty folder; use --resume for an owned checkpoint.');
  // Capture and validate before creating even the staging folder.
  const captured = await capture(projectId, { profile });
  if (!captured) throw new Error('No locked approved source is available; no output was written.');
  if (typeof captured.text !== 'string') throw new Error('Capture must provide the original export bytes.');
  let source;
  try { source = JSON.parse(captured.text); } catch { throw new Error('Capture did not provide valid JSON.'); }
  validateSource(source, { projectId, baselineId: captured.baseline?.id, baselineVersion: captured.baseline?.version, contentHash: captured.baseline?.hash });
  let api;
  try { api = new URL(captured.apiUrl); } catch { throw new Error('Capture receipt requires an explicit API URL.'); }
  if (api.username || api.password || api.search || api.hash || (api.protocol !== 'https:' && !(api.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(api.hostname)))) throw new Error('Capture API URL is invalid.');
  const exportFileSha256 = fileSha256(captured.text);
  const identity = { projectId: source.project.id, baselineId: source.baseline.id, baselineVersion: source.baseline.version, contentHash: source.contentHash };
  const receipt = { schemaVersion: '1.0.0', toolVersion, environment: 'production', apiUrl: captured.apiUrl, ...identity, exportFile: 'source/approved-export.json', exportFileSha256, exportBytes: Buffer.byteLength(captured.text), capturedAt: new Date().toISOString(), contentHashRecomputed: false };
  const contents = {
    'source/approved-export.json': captured.text,
    'source/receipt.json': jsonText(receipt),
    'source/analysis.json': jsonText(analyzeSource(source)),
  };
  for (const name of ['source.mjs', 'import-issues.mjs', 'validate-package.mjs']) contents[`tools/${name}`] = await readFile(join(scripts, name));
  const state = { schemaVersion: '1.0.0', toolVersion, status: 'collecting', ...identity, exportFileSha256, files: Object.fromEntries(Object.entries(contents).map(([path, bytes]) => [path, fileSha256(bytes)])) };
  contents['state/generation.json'] = jsonText(state);
  const parent = dirname(destination);
  await safePath(destination);
  await createParents(parent);
  await safePath(destination);
  const stage = await mkdtemp(join(parent, `.discovery-${randomUUID()}-`));
  try {
    await Promise.all(Object.entries(contents).map(async ([relative, bytes]) => {
      await mkdir(dirname(join(stage, relative)), { recursive: true, mode: 0o700 });
      await writeFile(join(stage, relative), bytes, { flag: 'wx', mode: 0o600 });
    }));
    await safePath(destination);
    const latest = await exists(destination);
    if (latest) {
      if (!stat || latest.ino !== stat.ino || latest.dev !== stat.dev || !latest.isDirectory() || (await readdir(destination)).length) throw new Error('Output changed while capturing; refusing to replace it.');
      await rmdir(destination);
    }
    await rename(stage, destination);
  } finally { await rm(stage, { recursive: true, force: true }); }
  return { output: destination, source, receipt, state, resumed: false };
}

async function main() {
  const { values } = parseArgs({ options: { 'project-id': { type: 'string' }, output: { type: 'string' }, profile: { type: 'string' }, resume: { type: 'boolean' }, help: { type: 'boolean', short: 'h' } } });
  if (values.help) { process.stdout.write('Usage: node prepare-output.mjs --project-id UUID --output PATH [--profile PATH] [--resume]\nCaptures a frozen approved source or resumes its existing offline checkpoint.\n'); return; }
  const result = await prepareOutput({ projectId: values['project-id'], output: values.output, profile: values.profile, resume: values.resume });
  process.stdout.write(`${result.resumed ? 'Resumed' : 'Prepared'} ${result.output}; baseline ${result.source.baseline.version}, status ${result.state.status}.\n`);
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { process.stderr.write(`Preparation failed: ${error.message}\n`); process.exitCode = 1; });
