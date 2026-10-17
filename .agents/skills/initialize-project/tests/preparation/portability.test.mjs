import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { cp, lstat, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { skillDirectory, verifyWorkspace } from '../../scripts/workspace.mjs';
import { workspaceFixture } from './test-support.mjs';
const execute = promisify(execFile);

test('the installed initializer parses a legacy workbook from another directory without sibling skills or dependencies', async () => {
  const workspace = await workspaceFixture();
  try {
    const installed = join(workspace.root, '.agents/skills/initialize-project');
    await cp(skillDirectory, installed, { recursive: true, filter: path => !path.split('/').includes('node_modules') });
    for (const absent of ['frontend', 'backend', '.agents/skills/discovery-specification', '.agents/skills/initialize-project/node_modules']) await assert.rejects(lstat(join(workspace.root, absent)), { code: 'ENOENT' });
    await mkdir(join(workspace.root, '.template-initialization'), { mode: 0o700 });
    await writeFile(join(workspace.root, '.template-initialization/preparation.md'), await readFile(join(installed, 'tests/preparation/fixtures/plan.md')), { mode: 0o600 });
    const { stdout } = await execute(process.execPath, [join(installed, 'scripts/fetch-preparation.mjs')], { cwd: '/tmp' });
    const result = JSON.parse(stdout);
    assert.equal(result.status, 'existing-workbook');
    assert.equal(result.repository, 'example/portal');
    assert.equal(result.executionMode, 'plan-only');
    assert.deepEqual(result.errors, {});
    for (const retired of ['scripts/prepare.mjs', 'scripts/preparation/server.mjs', 'web/index.html', 'web/client.mjs', 'web/styles.css']) await assert.rejects(lstat(join(installed, retired)), { code: 'ENOENT' });
  } finally { await workspace.remove(); }
});

test('explicit roots require the actual Git worktree root', async () => {
  const workspace = await workspaceFixture();
  try {
    const nested = join(workspace.root, 'nested'); await mkdir(nested);
    await assert.rejects(verifyWorkspace(nested), /worktree root/);
    const { stdout } = await execute(process.execPath, [join(skillDirectory, 'scripts/fetch-preparation.mjs'), '--help', '--root', workspace.root], { cwd: nested });
    assert.match(stdout, /PROJECT_UUID/);
  } finally { await workspace.remove(); }
});
