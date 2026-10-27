# Bind each completion claim to its source and evidence layer

Make a handoff say exactly what is implemented, what was observed and what remains unknown. Source provenance, local verification, remote CI and live acceptance are different claims with different identities.

**Documented workflow with an evidence recipe.** The V1 workflow, repository agent instructions and CI/release protocols define evidence ownership and state boundaries. The compact handoff below is a working recommendation, not a replacement schema for those receipts.

## Trigger, owner and invariant

Use when finishing a task, resuming another agent's work, reviewing agreed requirements or reporting deployment. The implementing owner records source and checks. The operator owns live/recovery observations; product/client owners own business acceptance.

The invariant is that evidence describes the exact candidate and its real layer. A template acceptance receipt does not certify a generated consumer. Agreed requirements do not prove implemented code. A green build does not prove all tests or a live deployment.

## Distinguish identities before combining them

| Identity                                     | Purpose                                         |
| -------------------------------------------- | ----------------------------------------------- |
| Repository commit or working-tree scope      | What source was implemented/reviewed.           |
| Requirement document/version or content hash | Which agreed scope was selected.                |
| Input-file SHA-256                           | Integrity of the exact input bytes.             |
| CI SHA/run/attempt                           | Which execution produced verification evidence. |
| Immutable frontend/backend digests           | Which artifacts form a release pair.            |
| Staging receipt and environment transaction  | Which host acceptance/mutation was observed.    |

When recording a checksum, state exactly which file or canonical payload was hashed and how it was produced. A whole-file checksum and a service-defined payload hash may identify different bytes; compare them only when the producing contract establishes equivalence.

When resuming, compare recorded source identity with the actual working tree and agreed requirements. Preserve existing documents and execution history. Review an explicitly requested requirements refresh rather than reassigning old evidence to the new source.

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

| Observation                                    | Decision                                                         |
| ---------------------------------------------- | ---------------------------------------------------------------- |
| Log belongs to another checkout or attempt     | Do not use it as proof for this candidate.                       |
| New source after old passing build             | Reassess affected evidence before claiming completion.           |
| Requirements agreed, implementation incomplete | Preserve both states; no coding completion inferred.             |
| Template production was accepted               | Consumer still needs its own initialized/live evidence.          |
| Artifact published, host result absent         | State publication success and deployment uncertainty separately. |
| Source status is tentative/unanswered          | Preserve the status; do not rewrite it as confirmed.             |

## Acceptance and inspection

A receiver should be able to locate the source, understand decisions, reproduce allowed checks, identify what was not verified and continue without repeating unrelated work. Stable issue/PR keys and source references retain execution identity across handoffs.

Relevant owner procedures remain authoritative for publishing client artifacts, running checks, deploying or restoring. Reading a handoff grants no new authority. This article creates no receipt, runs no validation and changes no progress state.

## Source provenance

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:docs/v1-workflow.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:infrastructure/ci/test_shards.py`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:infrastructure/release/README.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/docs/architecture/en/tests-mocks-stories-and-architecture-checks.md`
