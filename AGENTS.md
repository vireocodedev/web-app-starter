# Workspace agent guide

This is the always-on policy and task router. Directory `AGENTS.md` files add
area contracts. Keep rules at their authoritative owner and preserve unrelated
work. Inspect the request, Git status, acceptance criteria, affected owners and
authorized delivery scope before acting; separate facts, delegated technical
choices and unresolved product decisions.

## Mandatory development-guide workflow

For every task, including analysis, review, documentation and operations, follow
[task-scoped discovery](frontend/docs/development-guide/README.md#mandatory-agent-workflow)
before consequential decisions or edits. Classify all concerns, retrieve compact
metadata, and read the **full applicable contracts, skills and exact current
examples** before planning the affected implementation. Expand reading when
ownership, dependencies or scope change. A route/search miss requires broader
discovery; it grants no architectural freedom. Reuse installed infrastructure;
reference recipes describe explicit implementation work, not installed APIs.

If a required pattern is undocumented, documentation conflicts with code, or the
approach departs from a contract, **stop the affected implementation and obtain
Bruno's explicit approval**. Present the gap, alternatives and recommendation.
An existing instruction approving that specific departure satisfies the gate.
Editing guidance/checks cannot approve a departure. Continue independent approved
work. Publication, merge, deployment and data changes require their actual task
authorization; never infer merge approval from a review or green CI.

## Task routing

Use the live index through `bash backend/scripts/with-local-node.sh
frontend/scripts/development-guide-index.mjs route <keys...>` from the root.
Select multiple keys for multiple concerns; discover keys with `route --list`,
and use existing `search <terms...>` and no-argument inventory for broader audits.
Metadata selects reading; it does not replace contracts or agent judgment.

| Task involves                                   | Required entry point before affected work                                                                                                                                                                                                               |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend source, UI, routing or frontend review | [Frontend baseline and concern triggers](frontend/AGENTS.md); matching full tutorials/contracts                                                                                                                                                         |
| Java, HTTP, security or persistence             | [Backend router](backend/AGENTS.md); selected domain/security/data contracts                                                                                                                                                                            |
| CI gates, runners, isolation or provisioning    | [CI operator guide](infrastructure/ci/README.md), [consumer CI contract](docs/template-initialization/github-ci.md) and relevant CI articles                                                                                                            |
| Images, deployment, backup or recovery          | [Release operator guide](infrastructure/release/README.md), relevant delivery articles and [setup runbook](docs/template-initialization/INIT_GUIDE.md)                                                                                                  |
| Consumer setup/resume or V1 coordination        | [Project lifecycle](README.md#project-lifecycle), [template-initialization skill](.agents/skills/template-initialization/SKILL.md) for agent-led setup/resume, and the authoritative [initialization guide](docs/template-initialization/INIT_GUIDE.md) |
| Guide articles, tutorials, catalogs or runbooks | [Maintenance contract](frontend/docs/development-guide/README.md#maintain-a-pattern) and the subject owner; [Storybook authoring](frontend/docs/storybook/CONTRIBUTING.md) for its artifacts                                                            |
| Agent instructions or skills                    | `writing-for-agents`; for skill edits also read its skill mechanics; independent review                                                                                                                                                                 |
| Issue operations / triage / domain exploration  | [Issue conventions](docs/agents/issue-tracker.md) / [label mapping](docs/agents/triage-labels.md) / [domain rules](docs/agents/domain.md), respectively                                                                                                 |

A project-name skill invocation prepares private intake; full initialization
requires explicit confirmation of the displayed values, configured DNS and scope.

Shared CI is owned by `vireocodedev/web-app-starter`; consumers register for its
pool. Privileged lifecycle/isolation changes need independent review and
fresh-host validation before activation. Setup runs only when requested. When
consumer-specific values, configuration, prerequisites or setup steps change,
update the authoritative initialization guide with inputs, actions, safeguards
and verification in the same task. Keep setup, requirements, implementation and
business acceptance distinct.

## Coordination and review

The primary agent owns integration, verification scheduling and the final report.
Use the smallest useful team. Before consequential planning, delegation,
independent review or cross-owner coordination, read
[engineering coordination](docs/agents/engineering-workflow.md) for profiles,
dispatch, current-source knowledge and handoff requirements. Use an `architect`
for substantial ambiguity, cross-owner design, new public contracts or migrations;
assign disjoint ownership and one integration owner for shared files.

Require **independent review** for substantive behavior changes, public APIs,
security, migrations, CI/release automation, agent instructions and multiple
architectural owners. Review standards, original acceptance and failure cases;
resolve material findings before final checks. Bounded editorial corrections may
use primary review. If required delegation/review is unavailable, perform
permitted work and visibly leave that gate incomplete; self-review is not
independent. Use a `verification_coordinator` for substantial final check
selection/evidence; the primary schedules and executes heavy commands.

## Resource and concurrency rules

32 GB RAM / 16 GB swap: the primary alone schedules and executes at most **one**
full or focused build, typecheck, test suite, Storybook build, browser suite,
Gradle or Maven command at a time. Use foreground/no-daemon commands, no parallel
tool calls or `Promise.all` for these checks, and avoid nested worker pools.
Independent reading/editing may overlap. Use focused checks during implementation;
finish all editors and review fixes before complete required verification once
per candidate. Repeat only affected invalidated, failed or interrupted evidence.
Before restarting, inspect Node/Vitest/browser/Java/Gradle/Maven processes and
reconcile the previous run without terminating another owner's work.

## Completion gates

Confirm all acceptance criteria, compatibility, affected callers, locales,
documentation, setup and generated artifacts agree. Confirm selected full
contracts were followed, actual departures have Bruno's approval, required
independent review finished and material findings are resolved. Run the owning
checks from the [workspace README](README.md#verification) and actual scripts.
Read-only explanation requires evidence from source/contracts, not implementation
suite execution. Report commands/results and omissions for the final candidate;
distinguish implementation, local verification, remote CI and live/business
acceptance. Automated checks prove only their tested contracts.

When Bruno supplies an authorized reusable correction, update its authoritative
guidance in the same task; keep task-specific preferences in the task record.
Keep private inputs and credential-bearing logs out of shared handoffs.
