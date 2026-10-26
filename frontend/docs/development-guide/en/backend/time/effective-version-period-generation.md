# Effective versions and resumable period generation

Use effective versions when an accepted configuration can change future periods while already retained periods keep their original meaning. Selecting the newest row is insufficient: the relevant version is the accepted version applicable to a particular period index. Generation then materializes bounded evidence from that selection rather than recalculating history from today's settings.

This is a Client Discovery reference recipe, not an installed scheduling API. `ServiceAgreementService.effective` and `ServicePeriodService.generate` provide the observed contracts. Their calendar, prerequisites and numeric limits belong to that consumer; new applications must define suitable equivalents.

## Select an applicable accepted version

`effective` scopes the query by application and line, accepts period indices from 0 through 9999, requires an accepted transition, and considers only versions whose effective-from index is no greater than the requested index. Ordering by effective index descending, then version descending, chooses the most specific applicable accepted version. A later draft cannot silently replace accepted terms.

The selected row is checked and its retained package is validated against its version, digest, canonical terms and artifact references. An applicable row without trustworthy supporting evidence is not an invitation to use the current editor draft. Follow [digests and reviewed artifact versions](../data/digests-and-reviewed-artifact-versions.md) for that evidence boundary.

A retained period captures its identity, index, version, package digest, local dates, zone, start/end instants and prerequisite receipt references. Those fields answer which terms and calendar boundaries were used. Changing current configuration must not rewrite that retained answer. Correction needs an explicit business operation with attributable evidence.

## Generate from the first missing contiguous index

The source observes eligible start evidence and attempts activation. A line without activation is skipped. Existing period indices are scanned from zero to find the first missing contiguous position. The generator does not resume from `max(index) + 1`, which would hide holes.

For each selected line per invocation, it also revisits up to 100 prior period receipts without charge evidence, allowing elapsed period-end work to catch up separately. For new periods, it selects an effective version at each index, obtains a calendar interval from the activation start and applicable terms, checks start/notice prerequisites, reuses the period identity, and retains a receipt before deriving any corresponding charge evidence.

The inspected insertion bound is at most 100 newly inserted receipts per selected line per invocation. The additional local-date horizon is calculated from the initial/index-zero terms evaluated at the next index, plus 366 days; the index ceiling is below 10000. The supplied horizon cannot exceed the current UTC date plus one day; intervals whose start instant is still in the future are not generated. A multi-line invocation can exceed 100 catch-up reads and 100 inserts overall, and the existing-index query has no explicit row limit. The source does not demonstrate a whole-invocation read, time or work budget; add one where required. These limits are not a general authorization to schedule a year of future work. Clock and local calendar semantics must remain explicit.

Conceptual adaptation pseudocode, not a starter method:

```text
next = firstMissingContiguousIndex(retainedPeriods)
for index from next within workBudget:
  version = requireApplicableAcceptedVersion(scope, line, index)
  interval = calendar(version, activationStart, index)
  if interval is beyond the requested or observed horizon: stop
  require prerequisites for this exact version and interval
  retainOrReadPeriod(identity(scope, line, index), version, interval)
recordProgress(nextUnprocessedIndex, requestedHorizon, pending)
```

The caller still owns transaction boundaries, scoped uniqueness and serialization of competing generators. A progress marker is useful navigation evidence, not a replacement for checking retained receipts. See [transactional commands](../application-services/transactional-commands.md) and [bounded scheduled work](../integrations/bounded-scheduled-work.md).

## Failure and recovery

| Condition                                                   | Outcome and next action                                                           |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------- |
| A later version is unaccepted                               | Continue selecting the applicable accepted version.                               |
| Activation evidence is unavailable                          | Leave the line unactivated; do not manufacture a start timestamp.                 |
| Index 2 is missing but index 3 exists                       | Resume from 2 and retain/read existing identities when reached.                   |
| A prerequisite for the selected version is missing          | Block that work; repair evidence rather than borrowing another version's receipt. |
| The pass reaches its work or date budget                    | Retain progress and resume with the same period identities.                       |
| Period exists but its derived downstream evidence is absent | Reconcile that missing phase; do not create another period identity.              |

The source captures some expected activation conflicts and continues without activation; other failures propagate. Do not flatten every failure into “nothing to generate.” Keep waiting, blocked, exhausted-budget and failed-work states distinguishable.

## Acceptance scenarios and anti-patterns

Require an amendment effective at index 4 to affect index 4 onward while index 3 keeps its original version. Cover unaccepted amendments, a missing middle index, an interrupted pass, a period-end catch-up and intervals around the configured zone's calendar boundaries. Verify that no future-start receipt is materialized merely because the date horizon allows it. These are adaptation acceptance scenarios, not execution evidence.

Avoid selecting by creation time alone, recomputing retained periods from mutable settings, using UTC midnight as every local boundary, or treating a successful bounded pass as proof that the entire horizon is complete. The durable unit is the scoped period receipt; the loop and its progress record are resumable machinery around it.

## Sources

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceAgreementService.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServicePeriodService.java`
