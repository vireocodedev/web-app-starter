# Engineering coordination

Read before consequential planning, delegation, independent review or coordinating
multiple owners. Bounded tasks use the root outcome and completion gates plus
their selected contracts. This document owns specialist and dispatch procedures;
the [root guide](../../AGENTS.md) owns universal policy.

A task-specific context pack supplies acceptance, owners, approved decisions, exact
mandatory document paths, current source examples, checks and delivery scope.
Specialists inspect the current checkout and reroute if scope changes; they do not
reload unrelated catalogs. The selected full contracts remain mandatory.

## Orchestrator workflow

The primary agent is the orchestrator and remains accountable for integration,
review, verification and the final report. Use the smallest team that covers the
changed contracts. A bounded, low-risk task may stay with the primary agent,
which must still load the matching specialist knowledge and apply these gates.

1. **Define the outcome.** Inspect the request or originating issue/specification,
   Git status and applicable instructions. State observable acceptance criteria,
   affected owners and authorized delivery scope. Separate established facts,
   delegated technical choices and missing product decisions. Keep unrelated
   edits intact.
2. **Discover and route.** Complete task-scoped guide discovery, then select every applicable
   [specialist profile](#specialist-profiles). Before editing, identify the actual
   guide paths and current source examples being reused. Match by behavior and
   contract, not just the directory named in the prompt.
3. **Plan consequential changes.** Use an `architect` with the affected profiles
   for substantial ambiguity, cross-owner design, new public contracts or a
   migration. Require source-backed owners, interfaces, compatibility, failure
   cases and verification choices. Review the plan against the request and
   existing patterns before dispatching implementation. Resolve routine technical
   choices within existing guidance; apply the [root approval gate](../../AGENTS.md#mandatory-development-guide-workflow) to departures.
4. **Assign bounded work.** Use the [dispatch contract](#dispatch-contract).
   Assign disjoint files or responsibility boundaries and one named integration
   owner for shared manifests, exports, routes and configuration. Agree shared
   interfaces before parallel edits. Workers report boundary changes to the
   orchestrator before expanding their writes and preserve other editors' work.
5. **Review the candidate.** Require independent review for substantive behavior
   changes and for changes to public APIs, security, migrations,
   CI/release automation, agent instructions or multiple architectural owners.
   Give the reviewer the relevant profiles, original acceptance criteria and
   actual diff. Review both compliance with repository patterns and fulfillment
   of the request, including unnecessary complexity and missing failure cases.
   Route material fixes to the implementation owner and obtain confirmation of
   their resolution. A bounded editorial correction may use primary-agent review.
6. **Verify after review.** Finish all editing and material review fixes first.
   Use a `verification_coordinator` for substantial work to select the required
   gates and reconcile their evidence; the primary agent schedules and executes
   heavy commands under the [root resource rules](../../AGENTS.md#resource-and-concurrency-rules).
   Run the owning checks once for the final candidate; repeat affected checks
   only when source changes, a failure or interrupted evidence requires it.
7. **Report the result.** Account for every acceptance criterion, review outcome,
   actual check result and material omission. Distinguish implemented, reviewed,
   locally verified, remote CI and live acceptance. Commit, push, PR, merge,
   deployment and data changes follow the task's actual authorization.

When delegation tools or a required reviewer are unavailable, perform authorized
local work, state the missing review and leave that gate visibly incomplete.
Self-review cannot be reported as independent review.

## Specialist profiles

Profiles define repository knowledge and responsibility. At dispatch, combine a
profile with a supported runtime role: `architect` for investigation/design,
`implementer` for a bounded implementation, `mechanical_worker` for deterministic
edits, `reviewer` for independent review, or `verification_coordinator` for final
check selection and evidence. These profile names are task labels, not custom
`agent_type` values. Use the equivalent available role when tools differ and
preserve the same ownership and review boundaries.

Every specialist first reads this file and applicable directory instructions,
loads the linked knowledge for its task, and inspects the current implementation
and callers. The reading below is a starting set; live guide discovery supplies
the task-specific articles. A specialist returns the exact patterns and source
examples it used before changing code. Prior chat context or a role title does
not establish knowledge of the current checkout.

| Profile              | Route work here                                                                                                                        | Required knowledge and completion focus                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend-ui`        | Feature/page presentation, forms, tables, overlays, localization, responsive behavior and accessibility.                               | Read the baseline in [frontend instructions](../../frontend/AGENTS.md) and selected UI contracts from the live route index. Read source ownership for placement/moves and inspect Contacts only when its recipe applies; inspect the exact installed component and callers. Reuse the installed component system and documented source patterns; cover requested states, validation/submit/close behavior, both locales, keyboard/focus and narrow screens where affected.                            |
| `frontend-platform`  | Startup/providers, runtime lifetimes, routing, shell/navigation, preferences, HTTP/Query infrastructure and persisted state.           | Read [frontend instructions](../../frontend/AGENTS.md); load dependency boundaries for changed imports/public composition and the route/navigation/preferences skills when triggered. Inspect the relevant owner under [app](../../frontend/src/app). Check public seams, provider/effect disposal, route access/URLs, cache/session lifetimes and storage recovery where affected. Product state stays with its feature.                                                                             |
| `backend-domain`     | Business commands, HTTP endpoints/DTOs, services, repositories, queries and external integrations.                                     | Read [backend instructions](../../backend/AGENTS.md), especially its package/interface contract, and applicable application-service, query, integration and API-compatibility articles. Inspect the current [backend feature packages](../../backend/src/main/java/com/vireocode/backend). Keep transport, business and persistence responsibilities explicit; check validation/errors, callers, transaction scope and failure behavior. Coordinate schema or authority changes with `security-data`. |
| `security-data`      | Authentication/authorization, sessions/CSRF, account provisioning, secrets, database schema, integrity, locking and concurrent writes. | Read [backend instructions](../../backend/AGENTS.md); load session lifecycle for auth/session/CSRF work, schema ownership for persistence work and every other applicable security/data contract from the route index. For browser changes also read frontend instructions and current auth adapters. Review real authority and producer/consumer behavior, negative paths, constraints and migration compatibility; preserve applied migration bytes and existing data.                              |
| `ci-infrastructure`  | Workflow gates/shards, shared runner/controller, worker isolation, resource budgets and CI provisioning.                               | Read the [CI operator guide](../../infrastructure/ci/README.md), [consumer CI contract](../../docs/template-initialization/github-ci.md) and applicable CI handbook articles; inspect [.github workflows](../../.github/workflows) and [CI source](../../infrastructure/ci). Preserve the canonical shared-pool owner, complete gate evidence and trust boundaries. Privileged lifecycle/isolation changes require independent review and fresh-host validation before activation.                    |
| `release-operations` | Images/runtime packaging, staging/production promotion, deployment controllers, backups, restore and operational recovery.             | Read the [release operator guide](../../infrastructure/release/README.md), applicable delivery articles and the [setup runbook](../../docs/template-initialization/INIT_GUIDE.md). Inspect [release source](../../infrastructure/release). Bind evidence to the exact frontend/backend artifact pair and environment; account for migration, backup and recovery behavior. Execute only operational actions already authorized for the task.                                                          |
| `project-workflow`   | Consumer personalization, manual initialization, issue handoff and V1 acceptance coordination.                                         | Read the [project lifecycle](../../README.md#project-lifecycle) and [manual initialization guide](../../docs/template-initialization/INIT_GUIDE.md) for setup work. Preserve approved scope/source identity, decision blockers, private inputs and consumer-specific setup evidence. Keep setup readiness, specification readiness, implementation and business acceptance distinct; involve technical profiles for affected app/infra work.                                                          |
| `documentation`      | Agent instructions/skills, Development Guide articles/catalogs, architecture docs and public runbooks.                                 | Read the [guide maintenance contract](../../frontend/docs/development-guide/README.md#maintain-a-pattern) and the affected subject's authoritative owner. For agent instructions/skills, use `writing-for-agents`; for skills also read its skill mechanics. Keep rules at one owner, links actionable, English/Croatian guide content aligned and examples faithful to current code. Check affected links and examples against their current owners. Instruction changes receive independent review. |

For a new capability, assign the nearest profile and its actual domain owner;
add a reusable profile here only when an established responsibility is missing.
Quality is part of every profile. Reviewers and verification coordinators load
the affected profiles rather than becoming a competing owner of production code.

### Routing examples

- A new CRUD screen uses `frontend-ui` and `backend-domain`; add `security-data`
  for schema/access changes. Both implementers reuse the documented patterns
  and current source examples before coding.
- A navigation or theme request uses `frontend-platform`; include `frontend-ui`
  for affected feature presentation. One editor owns shared route registrations.
- A login defect uses `security-data` with `frontend-platform` and/or
  `backend-domain` according to the traced cause, plus independent security review.
- A runner change uses `ci-infrastructure`; a backup/deployment change uses
  `release-operations`. Apply both profiles when the trust boundary crosses them.
- An AGENTS.md or skill change uses `documentation` and independent review of the
  instruction's effect on relevant owners.

## Dispatch contract

Include this information in each subagent task; a pointer to the current shared
task record can supply repeated details. The orchestrator owns that record in
the task/issue or current conversation; create a repository artifact only when
the owning workflow requires one.

```text
Profile + runtime role: <specialist profile(s)> + <supported role>
Outcome + acceptance: <observable result and applicable failure/edge cases>
Scope: <owned files/responsibility; read-only or editing; integration owner>
Knowledge: read root/applicable AGENTS; <guide paths, source examples, skills>
Patterns: <existing contracts and source examples to reuse or investigate>
Decisions: <approved choices, unresolved gates, compatibility constraints>
Dependencies: <agreed interfaces, predecessor outputs, other active editors>
Validation: <focused checks allowed; send heavy-check requests to primary>
Delivery: <authorized local/remote actions>
Return: <changed paths, acceptance evidence, decisions, risks, check results>
```

Tell every editor that others share the worktree, to preserve their edits and to
escalate overlapping ownership to the orchestrator. `mechanical_worker` stops
when judgment is needed. Subagents request additional delegation from the
orchestrator so team size, ownership and verification stay coordinated.

A handoff must identify the candidate, reused guide/source paths, documented
pattern coverage or specific gaps, changed contracts/callers, acceptance results,
review findings and exact checks with pass/fail/interrupted/not-run status.
Report remaining decisions with their affected owner and next action. Keep
private inputs and credential-bearing logs out of shared records.

## Task-specific owners

Before writing frontend or backend code, discover the Development Guide,
identify the responsible owner and reuse its documented patterns and current
source examples. Apply the [root approval gate](../../AGENTS.md#mandatory-development-guide-workflow) to actual gaps or
architectural departures.

For coordinating a consumer from clone through accepted production business V1,
read [the project lifecycle](../../README.md#project-lifecycle); follow its linked owners for each task.

For initializing a consumer from this template, or resuming incomplete template
personalization, follow the numbered [manual initialization guide](../../docs/template-initialization/INIT_GUIDE.md).
It owns prerequisites, commands, resume decisions and completion evidence. Apply setup
only when requested, within the task's authorized local/provider/delivery scope.

Business requirements/specification follow initialization as separate work.
The requirements workflow remains to be defined separately.

Keep initialization procedures and consumer-specific setup in the manual guide.
After documentation changes, check affected links, commands and examples against
their current owners.

When an implementation adds or changes consumer-specific values, configuration,
prerequisites, or setup steps, update that guide in the same change. Include
the affected files, required inputs, setup actions, safeguards, and verification.
Keep it the authoritative setup guide; link to it rather than duplicating steps.

For shared CI foundation changes, follow
[the operator guide](../../infrastructure/ci/README.md). The canonical source belongs to
`vireocodedev/web-app-starter`; consumers register for that shared pool rather
than install another copy.
Privileged lifecycle or isolation changes require independent review and
fresh-host validation before activation.

For backend changes, also follow [the backend agent guide](../../backend/AGENTS.md).
For frontend changes, also follow [the frontend agent guide](../../frontend/AGENTS.md).
For local development and verification, use [the workspace README](../../README.md).
