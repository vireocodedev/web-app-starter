# From a cloned template to a production V1

Use this overview to keep setup, business requirements, implementation and
acceptance separate. Each owner supplies its detailed procedure and authority;
this page adds no execution, publication or deployment permission.

## Stage map

| Stage | Completion evidence | Procedure owner |
| --- | --- | --- |
| Clone and inspect | Intended consumer checkout, preserved work and compatible bundled skills | [Setup entry point](template-initialization.md) |
| Complete initialization intake | All applicable answers, ready prerequisites and confirmed execution scope for this checkout | [Intake skill](../.agents/skills/initialization-intake/SKILL.md) |
| Execute initialization | Actual local, CI, deployment and recovery evidence within the confirmed scope | [Execution skill](../.agents/skills/initialization-execution/SKILL.md) |
| Agree requirements and specification | Reviewed business scope, decisions and observable acceptance criteria | Replacement workflow to be defined separately |
| Implement bounded outcomes | Reviewed changes, relevant passing checks and actual delivery evidence | Repository agent and development guides |
| Accept business V1 on staging | Agreed journeys, roles, integrations and failures accepted on the exact candidate | Product/client owners and [release procedure](../infrastructure/release/README.md) |
| Promote and hand over | Exact accepted image pair in production, smoke/recovery evidence and operating instructions | [Release owner](../infrastructure/release/README.md) |

A deployed skeleton completes setup, not business V1. Intake completion establishes
setup decisions and scope, not successful execution or business approval.

## Clone, complete intake, then execute

Create a repository with GitHub **Use this template**, clone it and open the
trusted workspace. Inspect actual Git origin and local changes. Preserve existing
credentials, data and completed evidence. Older clones must adopt both complete
compatible skill packages, including references, helpers and tests; reconcile
with local edits. See [skill registration](../.agents/skills/initialization-execution/references/runbook.md#codex-skill-registration)
when discovery needs configuration.

```text
$initialization-intake prepare initialization for this repository
$initialization-execution initialize this repository
```

Run the second task after completing the first. Intake presents all known setup
questions upfront and records each answer and prerequisite in the ignored
`.agents/skills/initialization-intake/state/intake.json`. It resolves application
identity, local development, GitHub/CI, hosting/DNS, accounts, backups, protected
access references and permitted actions before execution. Resume in a separate
agent session with `$initialization-intake resume intake`; resolved answers remain
available and missing inputs stay visible. Credentials remain in protected stores.

Execution's first gate verifies completed intake for the actual checkout and its
current answers. Missing, partial, stale or mismatched intake produces an explicit
stop directing the user to `$initialization-intake`, before provider readiness
checks or initialization actions. Answer changes require renewed completion.

After that gate, execution verifies live readiness and follows the
[contract](../.agents/skills/initialization-execution/references/contract.md) and
[runbook](../.agents/skills/initialization-execution/references/runbook.md). Full setup
requires real consumer evidence for local development, CI/protection, staging,
production and initialized recovery. Explicit local-only scope completes only
local setup. Unexpected failures and actions outside confirmed scope remain
visible blockers. Historical template receipts do not certify a consumer.

No Client Discovery account, project UUID, API connection or workbook export is
part of this setup path.

## Requirements and specification remain a separate design task

The replacement requirements/specification workflow is outside this initialization
change. No new automated specification or issue-generation workflow is supplied.
The existing [Discovery specification package](discovery-specification.md) is a
legacy integration with the experimental app; it is not part of the current
journey and does not consume local initialization intake.

Before implementation, agree useful scope, exclusions, users, permissions,
journeys, data rules, integrations, dependencies and observable acceptance
criteria. Keep unresolved product decisions explicit with an owner and affected
work. Setup answers cannot fill these business decisions. Technical choices may
be resolved within existing architecture and delegated authority.

## Implement, accept and promote

For each authorized outcome, establish its source, boundaries, dependencies and
acceptance. Use repository guidance, independent review where required and checks
for the changed owners. Report implemented behavior, local verification, remote
CI and delivery separately. Issue/PR records describe actual execution; intake or
initialization status does not describe business-feature progress. Publishing
issues or code requires the task's actual authorization.

Deploy through **Deploy staging** following the [release procedure](../infrastructure/release/README.md#deploy-an-initialized-project).
Test agreed business journeys, roles, integrations, failure cases and quality
criteria on the exact candidate. Record product/client acceptance and release
blockers. Agreement on requirements is distinct from acceptance of delivered code.

Promote the exact accepted staging frontend/backend pair through **Deploy
production**, preserving its source SHA and staging run identity. Use the release
owner for migrations, pre-migration backups, account provisioning, smoke and
recovery, and the [CI owner](../infrastructure/ci/README.md) for shared infrastructure.

Finish with accepted requirement coverage, production health and business smoke,
current access/operating documentation, backup retrieval and isolated restore,
approved backup scheduling and known limitations. Record consumer setup changes
in [its setup entry point](template-initialization.md#consumer-specific-setup).
