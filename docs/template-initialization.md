# Initialize a project from this template

For the journey through business V1 acceptance and production delivery, use
[From a cloned template to a production V1](v1-workflow.md). Initialization and
client scope collection can proceed independently; this page owns setup.

The authoritative reusable setup procedure is bundled with the
[initialize-project skill](../.agents/skills/initialize-project/SKILL.md):

- [Preparation and blank workbook](../.agents/skills/initialize-project/references/preparation.md):
  required human inputs, protected references, login/App consent, safeguards
  and reviewed Client Discovery preparation or an existing manual workbook.
- [Project status](../.agents/skills/initialize-project/references/project-status.md):
  current preparation, recorded setup, scope approvals/lock and the next action.
- [Contract](../.agents/skills/initialize-project/references/contract.md):
  written authority, live readiness, private resume state and acceptance.
- [Runbook](../.agents/skills/initialize-project/references/runbook.md):
  affected identity/configuration files, setup actions, owners and verification.
- [Rehearsal lessons](../.agents/skills/initialize-project/references/rehearsal-lessons.md):
  generic prevention rules, not a consumer execution receipt.

Invoke `$initialize-project` in the trusted consumer workspace to see the current
phase and next action. Supply the production project ID once; the skill remembers
its local association and checks preparation and scope independently. It reports
which approvals are missing and whether a locked baseline is eligible for export,
then offers setup, readiness, specification generation or refreshed status.

To explicitly initialize after completing and reviewing developer preparation:

```text
$initialize-project initialize this consumer from production project PROJECT_UUID
```

The skill automatically captures the reviewed workbook using the protected
user-local administrator profile. Keep `/.template-initialization/` Git-ignored;
workbook, provenance and readiness reports remain private. Differing input needs
an explicit refresh request; accepted setup is preserved. Existing manual
workbooks and legacy resumes remain supported. Agents with skill slash commands
can use `/initialize-project`. See [registration and verification](../.agents/skills/initialize-project/references/runbook.md#codex-skill-registration).

Full initialization preserves the stack and existing resources and uses the
existing approved operator. It verifies local development, real CI, both paired
deployments and initialized recovery; local-only personalization remains a
separate explicit scope. The canonical template cannot initialize itself.

## Consumer-specific setup

This template records no consumer-specific setup or acceptance. During
personalization, record application-specific values, prerequisites, affected
files, setup actions, safeguards and verification here, linking to the bundled
runbook instead of copying it. Keep protected values in secret stores and
private run evidence, not this document.

## Shared CI setup

The consumer inherits `.github/workflows/ci.yml`,
`infrastructure/ci/{ci_scope.py,test_shards.py,test-timings.json}` and backend
inventory/filter configuration. The backend Dockerfile copies `gradle.properties`
to preserve the same bounded JVM/worker configuration inside image compilation.
Its prerequisites are an authorized shared-pool
repository registration, pinned Node/npm/Java toolchains and enough validated
isolated slots; registration is not inherited by template creation. Per-job test
workers remain bounded even when the pool runs jobs concurrently. Initial timing
weights are planning seeds; measure the new consumer and rebalance without
omitting tests. No deployment credentials or application data belong in shard
reports. Follow [CI setup, inventory proofs and validation](github-ci.md) and the
[canonical pool operator guide](../infrastructure/ci/README.md), including the
[explicit serial PostgreSQL readiness repair](../infrastructure/ci/README.md#explicit-serial-postgresql-readiness-repair)
and [pool dispatch repair](../infrastructure/ci/README.md#versioned-pool-dispatch-repair-and-rollback), fresh-host
validation before changing isolation or lifecycle settings.

## Documentation verification

Follow the bundled
[dashboard procedure](../.agents/skills/initialize-project/references/runbook.md#project-documentation-dashboard).
The skill owns its documentation dependencies and lockfile; the public
[project dashboard](project.html) combines project documents and bundled
references, while its bundled reference page never includes consumer evidence.
