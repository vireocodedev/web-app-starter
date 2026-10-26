# Claim one bounded outcome and preserve its decision gates

Turn an issue or plain-language request into a checkable implementation boundary before editing. Separate facts, delegated technical choices and missing human decisions so useful ready work can continue without inventing requirements.

**Documented workflow with a worked recipe.** The V1 workflow and root agent guide define bounded tasks, source references, decisions and acceptance. The short task record below is a suggested working aid, not a new installed schema or automatic approval mechanism.

## Trigger, owner and invariant

Use when claiming an implementation leaf, expanding an ambiguous request or receiving a task that crosses capabilities. The implementation owner owns the proposed code boundary. Product/client owners retain consequential business decisions. A source-backed technical choice can be resolved within developer authority, but a guessed client answer remains a proposal.

The invariant is an observable outcome with explicit owner, acceptance, dependencies, decision gates and authorized delivery scope. Parent/child decomposition does not automatically create an execution dependency. A draft specification or completed interview is not approval to start coding.

## Read the actual execution contract

Read the actual request or issue, the approved specification revision and the relevant decisions and acceptance criteria. Confirm ownership, dependencies, unresolved product questions and authorized delivery actions. Use the current issue/PR record when one exists; initialization and specification status do not report implementation progress.

The specification creator (`.agents/skills/specification-creator/SKILL.md`) owns functional discovery and specification approval. Architecture planning, issue-package generation, tracker publication and implementation are separate tasks. The specification skill does not generate execution issues.

Local issue-package generation belongs to specification-to-issues (`.agents/skills/specification-to-issues/SKILL.md`); later publication belongs to github-issues-import (`.agents/skills/github-issues-import/SKILL.md`). Generation requires the exact approved specification; the local package preserves copied approved source and approval evidence, content hashes, versioned manifest, Markdown issue bodies, labels, dependencies and source references. Missing business rules return to specification revision, rather than becoming invented issue requirements.

Read the actual package and ticket acceptance, source references, owner boundary and declared blockers. Parent grouping alone creates no blocking order. Default `needs-triage` means maintainer review is still required: functional approval and a valid package do not establish architecture or agent implementation readiness.

For either a direct request or an issue, a concise working record can be:

```text
Outcome: readers can locate a category and its existing article URLs still work.
Owner: category presentation input and route composition.
Acceptance: both locales, direct URL, breadcrumbs and preserved destinations.
Dependencies: existing article catalog and shared navigation interface.
Decisions: no new business policy; public API change requires explicit migration.
Evidence: authorized checks for this candidate, with omissions stated.
Delivery: only the publication actions actually requested.
```

These neutral values demonstrate structure. They do not authorize repository publication, deployment, data changes or unrelated refactors.

## Classify decisions without erasing uncertainty

| State                | Meaning                                                                        | Implementation consequence                                                |
| -------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| `RESOLVED_TECHNICAL` | Reasoned solution within developer authority and established constraints       | Record rationale/source/affected tasks; do not leave a fake open blocker. |
| `PROPOSED`           | Assumption offered for review, not a confirmed source fact                     | Expose its effect and gate consequential dependent work.                  |
| `REQUIRES_INPUT`     | Missing policy, capability, credential or conflicting scope with a human owner | Create/retain the targeted decision gate for affected work.               |

The source may explicitly delegate a technical detail. Resolve that detail rather than leaving every implementation question open. Conversely, an approved specification revision cannot silently supply a newly discovered missing business rule; return that affected branch for a reviewed revision.

The labels above illustrate decision categories, not required fields in an installed issue schema. Mechanical checks cannot turn an analyst proposal into client agreement. Semantic review remains necessary.

## Scope the smallest coherent implementation

Trace all affected callers and registrations before choosing files. A small public prop change may require several consumers; a single visual heading may not. Keep one outcome complete rather than shipping one file that leaves translations, links or lifecycle registration inconsistent.

If evidence reveals a larger migration, name the expanded boundary before silently changing compatibility. Preserve public contracts unless the task includes a deliberate migration. Keep unrelated edits owned by another developer intact.

Ready independent work can continue while a specific decision blocks another leaf. Record which acceptance case depends on the missing answer; do not mark the whole project blocked when unrelated tasks remain ready, and do not implement the blocked policy from intuition.

## Failure and decision table

| Observation                                                  | Decision                                                        |
| ------------------------------------------------------------ | --------------------------------------------------------------- |
| Issue has a parent but no execution blocker                  | Do not infer ordering solely from hierarchy.                    |
| Specification remains a draft                                | Complete product review and task authorization before coding.   |
| UI title suggests an unstated permission                     | Treat as a proposal/input gap, not approved security policy.    |
| Technical choice is delegated and source supports a solution | Resolve with rationale within the existing architecture.        |
| Acceptance needs an unrelated cleanup                        | Keep cleanup separate unless necessary to the coherent outcome. |
| New baseline appears during implementation                   | Preserve pinned source; refresh is a separate reviewed task.    |

## Acceptance and handoff

A completed task has implemented acceptance behavior, source/decision traceability, actual permitted verification and a clear delivery record. A blocked task has a precise owner/question/affected boundary rather than a vague request for more information.

Use **Capability owners and review boundaries** to choose seams and **Source-bound evidence and handoff** to report outcomes. The guide explains how to work; it does not claim the task, approve its requirements or execute publication.

Current owners: V1 workflow (`docs/v1-workflow.md`), agent guide (`AGENTS.md`), specification creator (`.agents/skills/specification-creator/SKILL.md`), specification-to-issues (`.agents/skills/specification-to-issues/SKILL.md`) and github-issues-import (`.agents/skills/github-issues-import/SKILL.md`). The pinned sources below document historical provenance, including the retired app-linked specification package; they are not its current execution instructions.

## Source provenance

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:docs/v1-workflow.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/references/specification-contract.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/SKILL.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/scripts/validate-package.mjs`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:AGENTS.md`
