# From a cloned template to a production V1

Use this overview to keep setup, business requirements, implementation and
acceptance separate. Each owner supplies its detailed procedure and authority;
this page adds no execution, publication or deployment permission.

## Stage map

| Stage                                | Completion evidence                                                                         | Procedure owner                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Clone and inspect                    | Intended consumer checkout, preserved work and compatible bundled skills                    | [Setup entry point](template-initialization.md)                                    |
| Complete initialization intake       | All applicable answers, ready prerequisites and confirmed execution scope for this checkout | [Intake skill](../.agents/skills/initialization-intake/SKILL.md)                   |
| Execute initialization               | Actual local, CI, deployment and recovery evidence within the confirmed scope               | [Execution skill](../.agents/skills/initialization-execution/SKILL.md)             |
| Agree requirements and specification | Approved exact specification revision, covered topics and observable acceptance criteria    | [Specification creator](../.agents/skills/specification-creator/SKILL.md)          |
| Prepare local issue package          | Exact approved source, validated issue bodies and dependency graph                          | [Specification to issues](../.agents/skills/specification-to-issues/SKILL.md)      |
| Import GitHub issues                 | Actual remote issue identities and resumable publication results                            | [GitHub issues import](../.agents/skills/github-issues-import/SKILL.md)            |
| Implement bounded outcomes           | Reviewed changes, relevant passing checks and actual delivery evidence                      | Repository agent and development guides                                            |
| Accept business V1 on staging        | Agreed journeys, roles, integrations and failures accepted on the exact candidate           | Product/client owners and [release procedure](../infrastructure/release/README.md) |
| Promote and hand over                | Exact accepted image pair in production, smoke/recovery evidence and operating instructions | [Release owner](../infrastructure/release/README.md)                               |

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

To practice this first stage here, use `$initialization-intake dry run` and later
`$initialization-intake resume dry run`. The
[local practice contract](../.agents/skills/initialization-intake/references/dry-run.md)
keeps the same questionnaire with hypothetical targets, simulated prerequisites
and separate saved sessions. Practice completion cannot unlock the next stage;
dry-run support currently covers intake only.

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

## Create and approve the functional specification

After full initialization, run the bundled
[specification creator](../.agents/skills/specification-creator/SKILL.md):

```text
$specification-creator start a specification using /path/to/project-brief.md
$specification-creator resume the specification interview
```

The first operation checks execution completion for this consumer. Missing,
incomplete, inconsistent or local-only evidence stops the task and directs you
back to initialization execution. The offline check verifies recorded completion;
it does not rerun setup or assert current live health.

The agent extracts established requirements from supplied material, identifies
gaps and contradictions, and interviews you in numbered adaptive rounds. It asks
the currently answerable questions, records actual answers and challenges feature
value and first-release scope. Future ideas and exclusions stay explicit. Pages,
roles, data relationships, workflows, cross-cutting requirements, visual direction,
delivery constraints and acceptance receive applicable follow-up questions.

Private progress lives in the Git-ignored
`.agents/skills/specification-creator/state/`; another session resumes unresolved
branches. Review `docs/specification/SPECIFICATION.md` and its supporting documents.
Completion requires addressed applicable topics, resolved implementation-blocking
product decisions and approval of that exact revision. Later changes preserve the
approved version, reopen affected branches and require renewed approval.

This workflow creates the functional specification. Architecture planning, issue
creation/publication and application implementation are separate tasks. Setup
answers and automated validation cannot supply missing client decisions or grant
business approval. See the [skill guide](specification-creator.md).

## Implement, accept and promote

Before implementation, prepare and publish bounded issues through the separate
[issue workflow](github-issue-workflow.md):

```text
$specification-to-issues convert the approved specification into ./docs/issue-packages/v1
$github-issues-import preview ./docs/issue-packages/v1
$github-issues-import import ./docs/issue-packages/v1 into OWNER/REPO
```

Preparation checks exact specification approval, writes local Markdown bodies and
a source-bound manifest, and validates the package without GitHub calls. Import
is a separate explicit publication task for that package's repository, with saved
progress and duplicate reconciliation. Default `needs-triage` keeps functional
agreement distinct from technical readiness and permission to implement. Package
readiness, actual issue URLs and implemented behavior are separate evidence.

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
