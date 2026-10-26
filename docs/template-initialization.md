# Initialize a project from this template

For later business implementation and acceptance, use the
[V1 stage overview](v1-workflow.md). This page owns the setup entry point;
requirements collection is a separate workflow.

Initialization has two skills:

1. [initialization-intake](../.agents/skills/initialization-intake/SKILL.md)
   inspects the checkout, asks all setup questions upfront, resolves human
   prerequisites and saves progress for another session. Start with
   `$initialization-intake prepare initialization for this repository`;
   resume with `$initialization-intake resume intake`.
2. [initialization-execution](../.agents/skills/initialization-execution/SKILL.md)
   initializes only after intake has completed. Use
   `$initialization-execution initialize this repository`. Its first gate checks
   completion, current answers and repository binding. Invalid or missing intake
   stops execution with instructions to finish `$initialization-intake`.

Intake state lives in the Git-ignored
`.agents/skills/initialization-intake/state/intake.json`. It records answered,
proposed and unknown inputs, prerequisite evidence and confirmation of the exact
execution scope. Changed answers invalidate completion and need review again.
Save nonsecret answers and protected storage references only. Neither skill
requires a Client Discovery account, project UUID, API profile or exported workbook.
A bare skill invocation offers a task menu and waits; a concrete task proceeds
directly. See [registration](../.agents/skills/initialization-execution/references/runbook.md#codex-skill-registration)
for agents that do not discover the bundled skills.

The authoritative reusable detail remains with its owners:

- [Intake skill](../.agents/skills/initialization-intake/SKILL.md): questionnaire,
  private answer state, remaining questions and resumable completion.
- [Questionnaire](../.agents/skills/initialization-intake/references/questionnaire.md):
  setup decisions, service access, protected operator references and human prerequisites.
- [Private state](../.agents/skills/initialization-intake/references/state.md):
  answer status, save/resume, revision checks and completion binding.
- [Contract](../.agents/skills/initialization-execution/references/contract.md):
  intake completion, confirmed authority, live readiness, resume and acceptance.
- [Runbook](../.agents/skills/initialization-execution/references/runbook.md):
  affected identity/configuration files, setup actions, owners and verification.
- [Rehearsal lessons](../.agents/skills/initialization-execution/references/rehearsal-lessons.md):
  prevention rules rather than consumer execution receipts.

Full initialization preserves the stack and existing resources and uses the
approved existing operator. It verifies local development, real CI, both paired
deployments and initialized recovery. Explicit local-only scope completes only
that bounded task. Known configuration questions and human preparation finish in
intake; unexpected failures or a changed scope can still block execution. The
canonical template cannot initialize itself. This documentation change performs
no consumer initialization or deployment.

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
[dashboard procedure](../.agents/skills/initialization-execution/references/runbook.md#project-documentation-dashboard).
The skill owns its documentation dependencies and lockfile; the public
[project dashboard](project.html) combines project documents and bundled
references, while its bundled reference page never includes consumer evidence.
