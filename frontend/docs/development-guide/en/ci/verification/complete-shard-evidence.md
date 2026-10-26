# Prove complete execution across test shards

Split a suite to bound individual jobs while proving exact-once membership of the configured frontend test files and collected backend classes. Frontend reports must contain passing assertions with valid counts; backend results additionally match an independently collected testcase inventory. Parallel green jobs alone establish neither contract.

**Installed template pattern.** `infrastructure/ci/test_shards.py`, its timing configuration, the root workflow and backend Gradle inventory task own this protocol. The current policy has three frontend shards and three backend shards. Numbers are implementation settings, not a reason to increase nested worker pools.

## Trigger, owner and invariant

Use the pattern when suite duration or resource pressure requires separate jobs. The maintainer changing collection, test configuration or shard assignment owns preservation of complete membership. The infrastructure operator owns available worker capacity. Timing weights tune placement only.

The invariant is `collect configured units → assign deterministically → execute assigned files/classes → prove exact-once unit coverage and validate reported cases`. Newly added matching frontend test files and collected backend classes participate without a hand-maintained allowlist. A weight file cannot exclude them. Shared-fixture affinity may keep classes together, but cannot remove them.

Browser tests under `tests/browser` are outside this non-browser frontend inventory. Do not describe this gate as proof that every possible browser workflow executed. Additional suite policies remain separate owners.

## Collect before selecting

Frontend collection uses Vitest's file listing and compares it with the configured source inventory under `frontend/tests`, excluding browser files. A discovered named Vitest project is rejected until the helper supports its identity explicitly. This is deliberate: silently combining projects could lose or duplicate test units.

The proof is deliberately asymmetric. Frontend collection uses `vitest list --filesOnly` and stores `inventory: null`: it independently proves complete file membership, then validates the assertions and aggregate counts reported by execution. It does not independently collect frontend testcase identities before execution. A conditionally absent assertion that never appears in the runtime report is therefore outside this completeness proof; valid reported counts alone cannot detect it. Backend dry-run collection supplies an independent testcase identity inventory and supports the stronger case-membership comparison.

Backend collection runs Gradle's `ciTestInventory` against the full test source set. It records JUnit XML produced in dry-run mode. Complete source compilation remains necessary because assigned classes may reference fixtures elsewhere. Inventory-mode skipped cases represent dry-run discovery; the same skip in real execution is a failure.

Assignment sorts affinity groups by descending combined weight with stable ties, then places each group in the least-loaded shard. Unknown weights default to one. Existing timing values are planning weights until measured successful reports justify an update. The same checkout and timing configuration must derive identical assignments in every shard and in final verification.

## Keep identity in the evidence

A partial illustrative report looks like this; it is not a valid complete report schema:

```json
{
  "schemaVersion": 1,
  "kind": "frontend",
  "sourceSha": "<exact-40-character-checkout-sha>",
  "runId": "<current-workflow-run-id>",
  "runAttempt": "<current-workflow-attempt>",
  "shard": 1,
  "total": 3,
  "selected": ["tests/features/example.test.tsx"]
}
```

The real report also contains the full unit list, all assignments, collected backend inventory where applicable, executed test identities, durations and elapsed time. `sourceSha` must agree with the checkout and workflow source. Run and attempt distinguish repeated execution of identical source.

Frontend execution uses one Vitest worker and requires successful suites with passing assertions. It rejects missing/duplicate/unexpected files, zero-assertion modules, pending/todo/skipped assertions and inconsistent aggregate counts. Backend execution selects classes from a generated file, uses the standard `test` task, and compares executed test cases with dry-run inventory.

Human test names are not unique identifiers. Repeated display names are preserved with occurrence indices; backend membership uses multisets rather than sets. Collapsing repeated parameterized names would let missing execution masquerade as completeness.

## Aggregate against this attempt only

The final gate first checks every selected lane's required outcome, then downloads artifacts whose names end in the current `github.run_attempt`. Each application verifier requires exactly the configured shard count, unique shard numbers, matching schema/kind/source/run/attempt, identical full unit inventories and matching backend testcase inventories where applicable.

It independently recomputes assignment and verifies every report's selected units. Flattened assignments must equal the collected unit multiset. Test identities must be unique across shards, passing and tied to assigned units; backend identities must equal the complete dry-run identities.

```text
full inventory + source-bound timing policy
                     |
       deterministic assignment 1..3
                     |
        execution reports for attempt N
                     |
   recompute + identity + membership checks
                     |
  exact-once units + validated case reports
```

Matrix fail-fast is disabled so one failure does not silently cancel peers. After a failed attempt, rerun all jobs. Rerunning only failed jobs while borrowing successful reports from a previous attempt violates the source/run/attempt evidence contract even when the source SHA has not changed.

## Failure and decision table

| Failure                                       | Decision                                                                                                        |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| New source test missing from collection       | Fix collector/configuration agreement; do not add an exclusion to get green.                                    |
| Reports from different attempts               | Rerun all jobs and collect one complete attempt.                                                                |
| Unexpected skip or todo                       | Resolve it or introduce an explicitly reviewed suite policy. Current policy declares no such non-browser skips. |
| Duplicate assignment or altered selected list | Repair deterministic assignment or report handling.                                                             |
| One shard is slow                             | Measure its indivisible units and fixture affinity before adding capacity.                                      |
| All shards pass but report upload fails       | Complete proof is absent; gate must fail.                                                                       |

## Acceptance and inspection

Inspect that new matching test files/classes enter the unit inventory automatically, all configured shards upload evidence, current-attempt names are used for downloads, and malformed or mixed reports are rejected. Review measured durations separately from membership. Preserve full-suite behavior of ordinary local test commands; sharding CI does not authorize developers to silently verify only a subset.

Reports currently retain synthetic test evidence for seven days. They must not contain application databases, deployed credentials or customer data. Record actual SHA/run/attempt and the final scoped proof result when making a CI acceptance claim. State the frontend file-level and backend testcase-level coverage separately.

This article documents normal CI test execution. It runs nothing and does not override a user's explicit instruction to skip tests during a development task.

## Source provenance

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/test_shards.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/test-timings.json`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/build.gradle`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:.github/workflows/ci.yml`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:docs/github-ci.md`
