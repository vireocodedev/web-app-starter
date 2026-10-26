import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { githubTransport } from "../scripts/transport.mjs";

async function fakeGh(t, mode = "success") {
  const root = await mkdtemp(path.join(tmpdir(), "fake-gh-process-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const bin = path.join(root, "bin");
  await mkdir(bin);
  await writeFile(
    path.join(bin, "gh"),
    `#!/usr/bin/env node
import fs from 'node:fs';
const input = fs.readFileSync(0, 'utf8');
if (process.env.GH_IMPORT_FAKE_MODE === 'error') {
  process.stderr.write('gh: HTTP 403 Bearer PRIVATE_CREDENTIAL_SENTINEL');
  process.exit(1);
}
if (process.env.GH_IMPORT_FAKE_MODE === 'malformed') {
  process.stdout.write('PRIVATE_PROVIDER_SENTINEL {');
  process.exit(0);
}
const bytes = Buffer.from(JSON.stringify({ args: process.argv.slice(2), payload: input ? JSON.parse(input) : null, body: 'Čekanje čćžšđ 🚀' }));
const split = bytes.indexOf(Buffer.from('č')) + 1;
process.stdout.write(bytes.subarray(0, split));
setTimeout(() => process.stdout.write(bytes.subarray(split)), 15);
`,
    { mode: 0o700 },
  );
  const oldPath = process.env.PATH;
  const oldMode = process.env.GH_IMPORT_FAKE_MODE;
  process.env.PATH = `${bin}${path.delimiter}${oldPath}`;
  process.env.GH_IMPORT_FAKE_MODE = mode;
  t.after(() => {
    process.env.PATH = oldPath;
    if (oldMode === undefined) delete process.env.GH_IMPORT_FAKE_MODE;
    else process.env.GH_IMPORT_FAKE_MODE = oldMode;
  });
}

test("fake gh verifies fixed API headers, JSON stdin, literal content and split Unicode", async (t) => {
  await fakeGh(t);
  const payload = {
    title: "Client wants čćž",
    body: "Literal $(do-not-execute) `not-shell` 🚀",
  };
  const result = await githubTransport().request(
    "POST",
    "repos/example/consumer/issues",
    payload,
  );
  assert.deepEqual(result.payload, payload);
  assert.equal(result.body, "Čekanje čćžšđ 🚀");
  assert.deepEqual(result.args, [
    "api",
    "--hostname",
    "github.com",
    "--method",
    "POST",
    "-H",
    "Accept: application/vnd.github+json",
    "-H",
    "X-GitHub-Api-Version: 2026-03-10",
    "repos/example/consumer/issues",
    "--input",
    "-",
  ]);
});

test("provider stderr credentials are excluded from bounded error messages", async (t) => {
  await fakeGh(t, "error");
  await assert.rejects(
    githubTransport().request("GET", "repos/example/consumer"),
    (error) => {
      assert.equal(error.status, 403);
      assert.match(error.message, /HTTP 403/);
      assert.doesNotMatch(error.message, /PRIVATE_CREDENTIAL|Bearer/);
      return true;
    },
  );
});

test("malformed provider responses preserve uncertainty without echoing response content", async (t) => {
  await fakeGh(t, "malformed");
  await assert.rejects(
    githubTransport().request("POST", "repos/example/consumer/issues", {
      title: "Test",
    }),
    (error) => {
      assert.match(error.message, /malformed JSON/);
      assert.doesNotMatch(error.message, /PRIVATE_PROVIDER/);
      return true;
    },
  );
});
