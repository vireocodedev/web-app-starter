# Bind each completion claim to its source and evidence layer

Make a handoff say exactly what is implemented, what was observed and what remains unknown. Source provenance, local verification, remote CI and live acceptance are different claims with different identities.

**Documented workflow with an evidence recipe.** The current initialization/specification owners and CI/release protocols define receipts and state boundaries. The compact handoff below is a working recommendation, not a replacement schema for those receipts.

## Trigger, owner and invariant

Use when finishing a task, resuming another agent's work, reviewing a specification or reporting deployment. The implementing owner records source and checks. The operator owns live/recovery observations; product/client owners own business acceptance.

The invariant is that evidence describes the exact candidate and its real layer. A template acceptance receipt does not certify a generated consumer. A generated specification does not prove implemented code. A green build does not prove all tests or a live deployment.

## Distinguish identities before combining them

| Identity                                      | Purpose                                                  |
| --------------------------------------------- | -------------------------------------------------------- |
| Repository commit or working-tree scope       | What source was implemented/reviewed.                    |
| Specification revision and approval binding   | Which exact functional scope the user approved.          |
| Supplied-source reference and content digest  | Which original material informed the interview.          |
| Issue-package identity and source/body hashes | Which approved snapshot and local tickets were packaged. |
| Import target, stable markers and mappings    | Which package items map to actual GitHub issues.         |
| CI SHA/run/attempt                            | Which execution produced verification evidence.          |
| Immutable frontend/backend digests            | Which artifacts form a release pair.                     |
| Staging receipt and environment transaction   | Which host acceptance/mutation was observed.             |

A source checksum identifies bytes; it does not establish client approval or truth. Specification approval must refer to the exact reviewed revision, with the actual user response recorded according to the specification creator (`.agents/skills/specification-creator/SKILL.md`). Draft validation alone grants no approval.

Resume uses saved answers, unresolved branches and source references. It must not silently overwrite approved scope when supplied material changes. Revisions preserve the old approved baseline, identify affected requirements and reopen affected branches for review; unaffected decisions remain available.

The initialization execution owner (`.agents/skills/initialization-execution/SKILL.md`) defines the full-setup completion gate. That local check validates recorded completion evidence for this consumer; it does not establish current remote service health.

Local issue-package generation belongs to specification-to-issues (`.agents/skills/specification-to-issues/SKILL.md`); later publication belongs to github-issues-import (`.agents/skills/github-issues-import/SKILL.md`). Package hashes bind copied approved source, approval evidence and issue bodies; they are integrity evidence, not new product approval or coding readiness. An imported issue mapping identifies a remote record, not implementation progress.

Resume local generation from its approved source and resume import from the exact package/target and reconciled remote markers. Preserve human edits and closed issues. A changed specification needs a reviewed new package revision; do not reassign old import evidence to changed content. Record native relationships or explicit reference fallback accurately.

## Report states, not one green checkbox

Use explicit states such as implemented, locally checked, tests not run, remote CI pending, staging accepted or production health observed. Keep failed/interrupted checks visible. Label proposals and missing evidence rather than filling gaps from a previous run.

A suggested task handoff is:

```text
Outcome: <observable behavior>
Source: <branch/commit or exact working-tree scope>
Decisions: <resolved choices and remaining affected blockers>
Evidence: <commands/results and artifact/run references>
Limits: <omitted suites, mock-only checks, missing business acceptance>
Delivery: <actual commit/push/PR state>
Next owner/action: <one bounded continuation>
```

Do not place private tokens, customer exports, database rows or credential-bearing logs in this record. A safe reference to protected evidence is often sufficient.

## Keep proof scope precise

The frontend CI shard collector proves configured non-browser file membership and validates executed assertion reports/counts. It does not independently precollect frontend testcase identities. Backend dry-run inventory supports the stronger testcase comparison. Say which proof was obtained instead of claiming universal exact-once test coverage.

The architecture checker enforces mechanical boundaries; review judges semantic accuracy and ownership. Restricted image smoke checks the packaged artifact with disposable resources; host runtime checks actual image/public state. Business journeys and initialized restore evidence remain separate acceptance work.

A successful status read can become stale after source changes or another release. Bind a completion report to the observed revision/time and record uncertainty when final host reporting was lost.

## Failure and decision table

| Observation                                   | Decision                                                         |
| --------------------------------------------- | ---------------------------------------------------------------- |
| Log belongs to another checkout or attempt    | Do not use it as proof for this candidate.                       |
| New source after old passing build            | Reassess affected evidence before claiming completion.           |
| Specification approved, implementation absent | Preserve both states; no coding completion inferred.             |
| Template production was accepted              | Consumer still needs its own initialized/live evidence.          |
| Artifact published, host result absent        | State publication success and deployment uncertainty separately. |
| Source status is tentative/unanswered         | Preserve the status; do not rewrite it as confirmed.             |

## Acceptance and inspection

A receiver should be able to locate the source, understand decisions, reproduce allowed checks, identify what was not verified and continue without repeating unrelated work. Approved specification revisions, package identities, affected acceptance references, stable import mappings and actual issue/PR links retain task identity across handoffs. Keep private interview state and credentials out of shared packages and reports.

Relevant owner procedures remain authoritative for publishing client artifacts, running checks, deploying or restoring. Reading a handoff grants no new authority. This article creates no receipt, runs no validation and changes no progress state.

Current owners: V1 workflow (`docs/v1-workflow.md`), specification creator (`.agents/skills/specification-creator/SKILL.md`) and initialization execution (`.agents/skills/initialization-execution/SKILL.md`). The pinned sources below preserve historical provenance, including the retired export/capture implementation. Its server hashes and import mappings are not current specification prerequisites.

## Source provenance

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:docs/v1-workflow.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/references/export-contract.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/references/specification-contract.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/scripts/prepare-output.mjs`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:infrastructure/ci/test_shards.py`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:infrastructure/release/README.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/docs/architecture/en/tests-mocks-stories-and-architecture-checks.md`
