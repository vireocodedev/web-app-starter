# Resumable batches and item receipts

Use durable batch admission when work spans multiple commits and an interrupted caller must resume the same ordered intent. The batch identity owns the input snapshot; each retained item position owns an observed outcome; a completion receipt owns the final ordered report. None of these facts alone means every item achieved its desired business effect.

This reference recipe comes from Client Discovery's `ServiceOperatorService.admit` and `batch`. It is a consumer implementation, not an installed starter queue or general-purpose parallel batch engine.

## Admit exact intent once

The entry point refuses an ambient transaction and creates independent transaction phases. Admission resolves a currently enabled privileged actor, acquires the owner locks, validates the supported command and scoped items, and fingerprints a canonical envelope containing a namespace, application ID and the entire request. This includes the request's expected revision.

A previous admission is reusable only when its fingerprint and actor match. Reusing a request ID with changed content or another actor is a conflict. A new admission must match the current workspace revision, saves its canonical input and request receipt, and advances the workspace revision. Because the original request is fingerprinted, a retry must preserve its original expected revision; replacing it with today's revision changes the admitted intent.

The method validates some current source prerequisites before looking up an old admission. Replay is therefore not an unauthenticated unconditional lookup. Preserve authorization and source-validation policy when adapting the mechanism. See [durable ingestion deduplication](../integrations/durable-ingestion-deduplication.md) for the distinction between an idempotency identity and a payload fingerprint.

## Retain positions and complete from evidence

The runner reads the retained input, checks for an existing completion receipt, then iterates the input in order. A recorded item position is skipped. Otherwise the supported operation runs in its own phase and its result is subsequently retained for that batch position. If that position already contains different canonical bytes, the writer rejects the changed outcome.

Some expected conditions become explicit item results: start observation can be waiting, available or blocked; cross-owner reconciliation can be pending, blocked or acknowledged. The final transaction reads retained items in index order, requires their count to equal the input count, and stores an immutable completion report. A completed report may legitimately contain blocked or pending items.

The sequence has an important gap: an operation can commit before its item result is retained. A crash there causes the operation to be entered again on resume. Its owner therefore needs retained idempotency or reconciliation evidence. The batch receipt does not itself make arbitrary side effects exactly once. The referenced [cross-owner acknowledgment protocol](cross-owner-acknowledgments.md) provides that separate boundary for one supported operation.

Conceptual pseudocode, not a starter API:

```text
admission = admitOrRead(actor, requestId, exactFingerprint, frozenInput)
if retainedCompletion(admission): return it
for position, item in admission.inputOrder:
  if retainedItem(admission, position): continue
  result = executeIdempotentOrReconciledItem(item)
  retainExactOutcome(admission, position, result)
require retainedItemCount == admittedItemCount
retainCompletion(orderedRetainedOutcomes)
```

## Failure and recovery

| Situation                                            | Recovery                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Admission committed but the caller lost its response | Resume using the same actor, request ID and unchanged request.                        |
| Process stops after several item receipts            | Skip those retained positions and continue the unrecorded positions.                  |
| Item effect committed but its receipt is missing     | Reconcile through the item owner's durable evidence before retaining its outcome.     |
| Completion exists with a blocked result              | Replay that report; use a new authorized operation to address repaired prerequisites. |
| A retry changes order or expected revision           | Reject the fingerprint mismatch; do not mutate admitted input.                        |
| Current actor authority is revoked                   | Stop authorized processing; prior admission does not grant perpetual authority.       |

The source processes a finite retained list but does not demonstrate a configurable global item-count/time budget or arbitrary parallel position ownership. Its check-before-execute and later retention are separate phases. Concurrent runners can enter the same item; merely putting a unique constraint on the receipt cannot undo an already duplicated external effect. A parallel adaptation needs explicit position claims/fencing, owner-level idempotency and bounded work. Follow [transactional commands](transactional-commands.md) and [uncertain provider outcomes](../integrations/uncertain-provider-outcomes.md).

## Acceptance scenarios and anti-patterns

Cover replay after admission, resume after a middle position, interruption after the item's commit but before its receipt, and replay of a completion containing mixed states. Require changed payloads, actors and item ordering to conflict. Require an incomplete retained item set to prevent completion. These are desired verification scenarios, not evidence of executed checks.

Avoid regenerating request IDs on transport retry, refreshing only the expected revision inside a frozen request, reordering retained input, treating completion as universal success, or promising safe parallelism from item-index uniqueness alone. A batch is a durable report of exact admitted work and retained outcomes; each item owner still owns its business transition.

## Source

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceOperatorService.java`
