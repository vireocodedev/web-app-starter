import assert from "node:assert/strict";
import test from "node:test";
import {
  activeSteps,
  assertDraft,
  emptyDraft,
  importWorkbook,
  parseTemplate,
  renderWorkbook,
  steps,
  validatePreparation,
} from "../../scripts/preparation/model.mjs";
import { executionDraft, schemaForTests, template } from "./test-support.mjs";

test("every workbook answer belongs to one short wizard step with no preset approval", async () => {
  const schema = await schemaForTests();
  assert.equal(schema.fields.length, 39);
  assert.equal(new Set(steps.flatMap((step) => step.fields)).size, 39);
  assert.ok(steps.every((step) => step.fields.length <= 4));
  const draft = emptyDraft(schema, "example/portal");
  assert.equal(draft.answers.repository, "example/portal");
  assert.equal(draft.answers.execution_mode, "");
  assert.equal(draft.answers.approval_signed_at, "");
  assert.equal(draft.answers.approval_signer, "");
  assert.ok(
    [...draft.prerequisites, ...draft.approvals].every(
      (value) => value === false,
    ),
  );
  assert.equal(draft.answers.new_paid_resource_ceiling, "0");
});

test("the authoritative template cannot silently lose fields or gain checked approvals", async () => {
  const markdown = await template();
  assert.throws(
    () =>
      parseTemplate(markdown.replace("| `project_slug`", "| `unknown_field`")),
    /differ/,
  );
  assert.throws(
    () => parseTemplate(markdown.replace("- [ ]", "- [x]")),
    /unchecked/,
  );
});

test("the exact Markdown contract round-trips literal cells, replacement rows and human checks", async () => {
  const schema = await schemaForTests();
  const draft = executionDraft(schema);
  draft.answers.display_name = "Example [Guide](./guide.md) | Supply\\Workshop";
  draft.answers.registry_policy = "replace-listed-only";
  draft.answers.registry_delete_auth = "completed";
  draft.answers.old_image_loss_acknowledged = "yes";
  draft.replacements = [
    {
      name: "portal-frontend",
      id: "1234",
      repository: "example/older-ui",
      versions: "2",
    },
  ];
  const output = renderWorkbook(schema, draft);
  const imported = importWorkbook(schema, output);
  assert.deepEqual(imported, draft);
  assert.match(
    output,
    /Example \[Guide\]\(\.\/guide\.md\) \\\| Supply\\\\Workshop/,
  );
  assert.equal((output.match(/^- \[x\]/gm) ?? []).length, 20);
});

test("read-only planning accepts unresolved answers without manufacturing execution consent", async () => {
  const schema = await schemaForTests();
  const draft = emptyDraft(schema);
  draft.answers.execution_mode = "plan-only";
  assert.deepEqual(validatePreparation(schema, draft), {});
  assert.ok(activeSteps(draft).every((step) => !step.executionOnly));
  const output = renderWorkbook(schema, draft);
  assert.match(output, /\| `approval_signer` \| REQUIRED \|/);
  assert.doesNotMatch(output, /^- \[x\]/m);
});

test("bounded execution needs the actual checkout, human prerequisites, scope and current signature", async () => {
  const schema = await schemaForTests();
  const now = Date.now();
  const draft = executionDraft(schema, now);
  assert.deepEqual(
    validatePreparation(schema, draft, { repository: "example/portal", now }),
    {},
  );
  draft.prerequisites[3] = false;
  draft.approvals[6] = false;
  draft.answers.approval_expires_at = new Date(now - 1).toISOString();
  const errors = validatePreparation(schema, draft, {
    repository: "example/another",
    now,
  });
  for (const id of [
    "repository",
    "prerequisite-3",
    "approval-6",
    "approval_expires_at",
  ])
    assert.ok(errors[id], id);
  draft.answers.repository = "vireocodedev/web-app-starter";
  assert.match(
    validatePreparation(schema, draft, { repository: draft.answers.repository })
      .repository,
    /canonical/,
  );
});

test("package replacement is conditional, exact, unique and never implicit", async () => {
  const schema = await schemaForTests();
  const draft = executionDraft(schema);
  draft.prerequisites[7] = false;
  draft.approvals[9] = false;
  assert.deepEqual(
    validatePreparation(schema, draft, { repository: "example/portal" }),
    {},
  );
  draft.answers.registry_policy = "replace-listed-only";
  let errors = validatePreparation(schema, draft, {
    repository: "example/portal",
  });
  for (const id of [
    "replacements",
    "registry_delete_auth",
    "old_image_loss_acknowledged",
    "prerequisite-7",
    "approval-9",
  ])
    assert.ok(errors[id], id);
  draft.answers.registry_delete_auth = "completed";
  draft.answers.old_image_loss_acknowledged = "yes";
  draft.prerequisites[7] = draft.approvals[9] = true;
  draft.replacements = [
    {
      name: "portal-backend",
      id: "55",
      repository: "example/old-api",
      versions: "5",
    },
  ];
  assert.deepEqual(
    validatePreparation(schema, draft, { repository: "example/portal" }),
    {},
  );
  draft.replacements.push({ ...draft.replacements[0] });
  assert.ok(
    validatePreparation(schema, draft, { repository: "example/portal" })
      .replacements,
  );
  draft.replacements[1] = {
    name: "unrelated-package",
    id: "66",
    repository: "example/elsewhere",
    versions: "1",
  };
  assert.ok(
    validatePreparation(schema, draft, { repository: "example/portal" })
      .replacements,
  );
});

test("known invalid names, backend lengths, dates, backup risk and bounds are caught before handoff", async () => {
  const schema = await schemaForTests();
  const draft = executionDraft(schema);
  Object.assign(draft.answers, {
    java_base_package: "com.class.portal",
    project_slug: "bad--slug",
    pwa_short_name: "more-than-twelve",
    staging_hostname: draft.answers.production_hostname,
    backup_timezone: "Unknown/Zone",
    backup_time: "25:00",
    same_server_loss_acknowledged: "not-required",
    deployment_port_range: "2000-2001",
    approval_signed_at: "2026-02-31T10:00:00Z",
    new_paid_resource_ceiling: "100",
    initial_username: "x".repeat(101),
  });
  const errors = validatePreparation(schema, draft, {
    repository: "example/portal",
  });
  for (const id of [
    "java_base_package",
    "project_slug",
    "pwa_short_name",
    "staging_hostname",
    "backup_timezone",
    "backup_time",
    "same_server_loss_acknowledged",
    "deployment_port_range",
    "approval_signed_at",
    "new_paid_resource_ceiling",
    "initial_username",
  ])
    assert.ok(errors[id], id);
});

test("secret-like material, extra fields and changed consent wording never become a saved approval", async () => {
  const schema = await schemaForTests();
  const draft = executionDraft(schema);
  draft.answers.operator_profile = "ghp_" + "x".repeat(32);
  assert.throws(() => assertDraft(schema, draft), /protected reference/);
  draft.answers.operator_profile = "/protected/profile.json";
  draft.answers.extra = "not-a-supported-field";
  assert.throws(() => assertDraft(schema, draft), /fields/);
  delete draft.answers.extra;
  const output = renderWorkbook(schema, draft).replace(
    "Remove only exact task-owned scratch",
    "Remove unrelated production",
  );
  assert.throws(
    () => importWorkbook(schema, output),
    /consent wording differs/,
  );
});
