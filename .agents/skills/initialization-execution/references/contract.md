# Consumer initialization contract

The [execution skill](../SKILL.md) owns running setup. The sibling
[intake skill](../../initialization-intake/SKILL.md) owns the complete upfront
questionnaire, saved answers and completed handoff. The
[runbook](runbook.md) owns exact application edits and links to operator procedures.

## Supported scope and target

Initialize one existing private GitHub consumer with one Git worktree containing
`frontend/` and `backend/`. Preserve the template stack, session authentication,
examples, shared Hetzner CI and paired staging/production release workflows.
Reuse the approved operator, shared App/pool, deployment host and supported
backup destination. Creating a new foundation, changing privileged shared code,
rebuilding a host, replacing data and implementing business features are separate
tasks. Canonical `vireocodedev/web-app-starter` cannot initialize itself.

## Intake handoff and authority

Execution's first operation is the intake `require-complete` gate. Missing,
partial, invalid, changed or repository-mismatched intake stops execution with
an explicit instruction to finish `$initialization-intake` first. A legacy
workbook or old execution state is not a completed new intake. Local
[dry-run intake](../../initialization-intake/references/dry-run.md) is practice
only: its separate state and `rehearsalComplete` cannot unlock execution.

Read the [state contract](../../initialization-intake/references/state.md).
The helper derives readiness from valid applicable answers and prerequisites,
and binds confirmation to their exact content and repository. A mutable
`complete: true` flag alone is insufficient. Record the returned intake revision
and digest in execution state; recheck them on resume and before phase writes.
Answer changes require refreshed intake confirmation, while preserving already
verified execution evidence and existing resources.

All setup choices, scope authorization and foreseeable human prerequisites are
collected during intake. Use only actual user answers/consent; the agent can
record their words but cannot approve for them. The current execution request
and the completed confirmed scope must agree. A saved file grants no standing
authority for unrelated resources or new actions. Credentials stay in protected
stores; intake/state contain references only. No Client Discovery service,
project UUID, export, app review or external workbook is required.

## Operator profile

The intake's protected external operator reference identifies the existing
operator. Resolve it as data, not commands. Keep the JSON file outside Git,
owner-only (`0600` in private directories). It contains references, never token,
password or private-key values:

| Field             | Required contents                                                                                                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `version`, `name` | Format `1` and recognizable name.                                                                                          |
| `github`          | Host, authorized account and allowed repository owner.                                                                     |
| `ssh`             | Target, identity/agent reference, approved host-key fingerprint, root or noninteractive sudo mode.                         |
| `ci`              | Existing pool label, reviewed canonical operator source/revision, protected configuration and App metadata/key references. |
| `dns`             | Provider, exact zone/project and protected credential/tool reference.                                                      |
| `deployment`      | Approved host, per-project namespace, free-port range and authorized maintainers.                                          |
| `backup`          | Supported destination and proposed schedule; consumer risk/schedule choices remain explicit intake answers.                |
| `bounds`          | Prerequisite policy, resource ceilings and exclusions.                                                                     |

## Live readiness gate

After intake passes, verify actual checkout and resource ownership, intended
GitHub actor/admin/plan/Actions support, selected-repository App access, strict
SSH host trust, reviewed operator source/configuration/current-boot receipt,
DNS zone authority/conflicts, available ports/capacity, supported backup adapter,
and local tools including an unattended path for both saved IDE launches.
Use the existing operator interfaces; unreviewed host repair is a blocker.

Write a nonsecret resolved plan and results to
`.template-initialization/readiness.md`. Readiness-only requests stop here.
Runtime/IDE/browser, deployed CI and initialized recovery evidence are collected
after personalization, not inferred from preflight checkboxes. Missing access or
changed scope produces a precise blocker and an intake update where needed.
Continue only matching authorized independent work. Mandatory tool/provider
approvals remain in force.

## Execution and resume

Keep ignored `.template-initialization/state.json` under owner-only permissions
with atomic writes. Record version, exact repository/root, initial commit,
intake revision/digest/scope, phase states, source/run/image/resource identities,
protected credential references and redacted failures/recovery transaction IDs.
Never execute values as commands. Reconcile actual state before retries and
preserve volumes/passwords. Existing completed consumers retain their evidence;
read-only reconciliation never recreates their setup. A missing new intake only
blocks new execution, not the validity of historical acceptance.

| Phase          | Evidence required before `passed`                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `intake`       | Completed confirmed intake, current matching request and live readiness.                                                      |
| `identity`     | Application values, packages and launches agree; residual template references classified.                                     |
| `local`        | Required checks/builds, native API/browser login-refresh-logout and actual saved IDE launches.                                |
| `ci`           | Exact shared-pool registration, current isolation receipt, genuine workflows and failing/green branch-gate proof.             |
| `environments` | DNS/TLS/ports, isolated DBs/volumes/credentials, approved controller and certificate variable.                                |
| `staging`      | Successful workflow with tested consumer commit and private immutable image pair.                                             |
| `production`   | Same successful staging pair promoted without rebuild behind a fresh production backup.                                       |
| `recovery`     | Explicit user provisioning, HTTPS/browser flows, initialized dump retrieval/checksum/isolated restore, then production timer. |
| `handoff`      | Consumer-specific acceptance, operating docs and protected references.                                                        |

Local-only execution completes `intake`, `identity`, `local` and the bounded
handoff; remote phases remain out of scope, not passed. It does not authorize
publication, registration or deployments. No phase can borrow copied template
receipts. Follow the [CI](../../../../infrastructure/ci/README.md) and
[release](../../../../infrastructure/release/README.md) owners for actual commands.

## Completion and rehearsal

Full setup is ready only when all phases pass for this consumer's exact source
and deployed pair. Store sanitized
`docs/acceptance/initialization-acceptance.json` and operating instructions with
run/source/digest identities, actual commands and recovery results. Other
documentation acceptance records belong in `docs/acceptance/`; infrastructure
receipts retain their owner locations. Keep private state out of docs inputs.

Regenerate `docs/project.html` and the bundled offline view using the
[dashboard procedure](runbook.md#project-documentation-dashboard). Report actual
checks, missing evidence, deferred artwork and any human intervention after
intake. Configuration alone does not prove runtime or live setup. A clean
fresh-consumer rehearsal is still required to prove the unattended experience.
Business requirements/specification follow full initialization through
`$specification-creator`. It requires the offline
[completion receipt gate](completion.md); local-only completion is insufficient.
Record actual observed full execution with that contract's producer and private
binding. Older evidence remains historical acceptance but must be deliberately
reconciled into the structured receipt before specification creation. Read-only
reconciliation preserves existing setup and never fabricates missing observations.
