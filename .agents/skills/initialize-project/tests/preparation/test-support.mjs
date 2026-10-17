import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { emptyDraft, parseTemplate } from "../../scripts/preparation/model.mjs";

const execute = promisify(execFile);
const source = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../references/preparation.md",
);
export const template = () => readFile(source, "utf8");
export const schemaForTests = async () => parseTemplate(await template());

export function executionDraft(schema, now = Date.now()) {
  const draft = emptyDraft(schema, "example/portal");
  Object.assign(draft.answers, {
    execution_mode: "execute-listed-scope",
    operator_profile: "/protected/operator-profile.json",
    reuse_existing_operator: "yes",
    project_slug: "portal",
    display_name: "Portal",
    java_base_package: "com.example.portal",
    pwa_short_name: "Portal",
    data_boundary: "fresh-isolated",
    production_hostname: "portal.example.com",
    staging_hostname: "portal-staging.example.com",
    dns_mode: "agent-create-missing",
    initial_username: "admin",
    initial_display_name: "Example User",
    initial_email: "admin@example.com",
    backup_destination: "same-server",
    same_server_loss_acknowledged: "yes",
    backup_time: "03:00",
    backup_timezone: "Europe/Zagreb",
    local_port_policy: "allocate-free-loopback",
    approval_signer: "example",
    approval_signed_at: new Date(now - 60000).toISOString(),
    approval_expires_at: new Date(now + 86400000).toISOString(),
  });
  draft.prerequisites.fill(true);
  draft.approvals.fill(true);
  return draft;
}

export async function workspaceFixture() {
  const root = await mkdtemp(join(tmpdir(), "preparation-capture-"));
  await writeFile(join(root, ".gitignore"), "/.template-initialization/\n");
  await execute("git", ["init", "--quiet"], { cwd: root });
  await execute(
    "git",
    ["remote", "add", "origin", "https://github.com/example/portal.git"],
    { cwd: root },
  );
  return { root, remove: () => rm(root, { recursive: true }) };
}
