# Deliver a coherent increment with a truthful review record

Choose a reviewable task boundary, preserve unrelated work and publish only the actions requested for that task. Small delivery units are useful because behavior, evidence and source identity remain understandable together.

**Source-backed implementation recipe.** The V1 workflow and root agent guide require bounded tasks, review and completion evidence. The commit/checkpoint sequence below is a recommended application of those contracts, not an installed Git automation or standing permission to push, merge or deploy.

## Trigger, owner and invariant

Use for an implementation leaf, an incremental guide expansion or a task with explicit commit/push/PR instructions. The implementation owner prepares the coherent candidate. The coordinating developer owns integration and the current publication scope. Issues/PRs become execution records after publication; initialization/specification status is not coding progress.

The invariant is that delivered source, stated behavior, review result and evidence describe the same increment. A commit is not proof of passing checks. A pushed branch is not proof of a successful remote CI run. A WIP PR is not production acceptance.

## Choose the boundary by outcome

A useful increment might add one reusable input and all callers, one route family with redirects/locales or one focused bilingual pattern batch. Avoid a half-migrated public interface that leaves consumers broken merely to make the commit smaller.

Inspect branch, diff and existing work before staging. Stage task-owned paths or reviewed hunks; do not sweep another editor's files into a commit because they are visible in the same worktree. Preserve concurrent source and ask the integration owner to resolve genuine shared-file contention.

A neutral checkpoint record is:

```text
Outcome: one complete category and its paired article navigation.
Candidate: reviewed source scope, with relevant verification evidence.
Commit: behavior-focused message for task-owned changes.
Publication: existing task branch/PR only when requested.
Next: next bounded outcome or explicit remaining blocker.
```

This is a recipe, not an instruction to create branches, publish client content or open an issue without the appropriate task scope.

## Review before claiming delivery

Review compatibility, source fidelity, both locales and the affected public seams. Resolve material findings before final coordinated verification. A source change invalidates the evidence it can affect, so do not carry an earlier build receipt across an incompatible review fix without re-evaluating it.

The architecture checker cannot decide semantic accuracy or product fit. Visual inspection cannot prove persistence or security. Keep those limits visible in the PR description rather than using one passing check as a universal claim.

## Keep publication and operational authority separate

| Action               | Result and boundary                                                        |
| -------------------- | -------------------------------------------------------------------------- |
| Local implementation | Reviewable source candidate.                                               |
| Commit               | Local named source checkpoint; no remote CI implied.                       |
| Push                 | Remote branch updated; inspect actual CI separately.                       |
| WIP/draft PR         | Review surface and task linkage; not approval to merge.                    |
| Merge                | Integration action requiring its own authorized scope and required checks. |
| Deploy/promotion     | Operational action under release owner and exact artifact evidence.        |

If the user requests commit and push after each completed task, apply that cadence to that run. If they provide a timezone/deadline, record checkpoints against that instruction and stop at the agreed boundary. Those are temporary task constraints, not source-controlled universal workflow policy or provenance for the application implementation.

A local-only task remains local. A permission to push does not authorize changing remote protections, dispatching a deployment or publishing private specification material.

## Describe the final candidate, not the conversation

Lead a commit/PR description with the concrete problem and resulting behavior. Include compatibility decisions and actual verification limits. Keep the description current as the PR grows; do not leave a title about an abandoned first approach over unrelated final scope.

Link the actual issue or request, approved specification revision and affected acceptance criteria where relevant. A proposed requirement or draft specification is not automatically an approved coding target. Preserve source/decision mapping when an increment implements only part of a larger accepted capability.

The specification creator (`.agents/skills/specification-creator/SKILL.md`) produces functional specification documents. Local issue-package generation belongs to specification-to-issues (`.agents/skills/specification-to-issues/SKILL.md`); later publication belongs to github-issues-import (`.agents/skills/github-issues-import/SKILL.md`). A request to generate the local package grants no GitHub-write authority. Offline validation/dry-run can inspect the package without API access; actual import requires an explicit import request for the exact target repository.

Publish blockers before dependants. Use native blocking/sub-issue relationships where available, with explicit linked references as the documented fallback. Grouping alone does not imply a blocker. Imports reconcile stable markers and saved mappings on resume, preserve human edits and closed issues, and stop on conflicts instead of silently replacing existing work. Preserve the exact imported package identity in the handoff.

`needs-triage` remains the default. Functional approval does not automatically grant `ready-for-agent`, and publication does not authorize architecture invention, application source edits or implementation.

## Failure and decision table

| Observation                                 | Decision                                                                      |
| ------------------------------------------- | ----------------------------------------------------------------------------- |
| Unrelated files are staged                  | Unstage unrelated scope without reverting another owner's edits.              |
| Commit succeeds, push fails                 | Report local checkpoint and remote failure separately.                        |
| Push succeeds, CI pending/fails             | Report actual state; do not call delivery CI-green.                           |
| PR remains WIP                              | Continue reviewable work within scope; do not infer merge permission.         |
| New task changes an earlier public contract | Revisit caller migration and affected evidence.                               |
| Deadline arrives with unfinished work       | Preserve coherent progress and report remainder without inventing completion. |

## Acceptance and handoff

Record resulting behavior, task scope, commit/branch/PR when actually created, checks and omissions, review findings resolved and next bounded task. Private client data remains outside public artifacts unless separately approved.

The owning V1/specification/release procedures remain authoritative. This article executes no Git, issue, PR or deployment action.

Current owners: V1 workflow (`docs/v1-workflow.md`), agent guide (`AGENTS.md`) and specification creator (`.agents/skills/specification-creator/SKILL.md`). The pinned references below preserve historical provenance, including the retired app-linked specification contract. The current two skills own the issue handoff; historical procedures do not replace their contracts.

## Source provenance

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:docs/v1-workflow.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/references/specification-contract.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/docs/architecture/en/add-change-or-remove-a-feature.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/docs/architecture/en/tests-mocks-stories-and-architecture-checks.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:infrastructure/release/README.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:AGENTS.md`
