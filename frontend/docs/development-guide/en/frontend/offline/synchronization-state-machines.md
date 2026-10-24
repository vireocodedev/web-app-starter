# Distinguish queued, accepted and completed synchronization

HTTP acceptance is not completed business processing. A synchronization UI needs to distinguish local retention, an in-flight upload, server acceptance, asynchronous processing, and a known result. Otherwise a drained local queue can falsely look like completed work, while a lost heartbeat can leave the page blocked forever.

This is a **reference protocol inspired by LMS**, not an installed starter synchronizer. The inspected orchestrator single-flights flushes, sends a snapshot, and removes that snapshot's commands after the sync API resolves. Its comments describe HTTP 202 acceptance. Backend progress is observed separately through heartbeat state. A durable per-command receipt and crash-recovery state machine are additional requirements, not guarantees demonstrated by this frontend alone.

## Trigger and ownership

Use a state machine when queued commands are processed asynchronously or when network and browser failure can separate upload from final acknowledgement. The queue owner holds durable local intent. The transport orchestrator owns one active submission attempt. The server owns acceptance and execution receipts. The UI projects those states without inventing completion from connectivity.

LMS watches online state, its eligible product role, and the queue. A module-level `flushing` flag prevents concurrent submissions within that JavaScript instance. It snapshots the commands passed to a flush, sets a freeze signal, and sends the snapshot. This is not a browser-wide multi-tab lock or a distributed job lease; a new product needs coordination appropriate to its actual concurrency model.

The inspected API returns `Promise<void>`, not a parsed list of individually accepted command IDs. After success, the orchestrator deletes IDs from the submitted snapshot and filters only those IDs from the in-memory queue. New commands added later are outside that set. Do not describe that as a partial-acceptance protocol unless the backend actually supplies one.

## Model durable acknowledgement explicitly

This is a **proposed stronger state contract**, not LMS's installed API:

```ts
type CommandStatus =
  | { state: "queued" }
  | { state: "sending"; attemptId: string }
  | { state: "accepted"; receiptId: string }
  | { state: "processing"; receiptId: string }
  | { state: "succeeded"; resultId: string }
  | { state: "failed"; code: string; retryable: boolean }
  | { state: "unknown"; receiptId?: string };

// Acceptance and final execution have separate durable evidence.
// Restart resolves receipts before manufacturing another logical command.
```

A server can accept an entire batch atomically, accept a subset, or reject the submission. Pick one contract. If a subset is possible, parse the accepted IDs and retain all others with their actual errors. Never clear the entire queue because one request returned a successful status. If acceptance is all-or-nothing, document that boundary and the receipt that proves it.

For robust crash recovery, retain an accepted marker or durable receipt reference until the outcome can be recovered. Deleting the only local command immediately after 202 can be valid only with a deliberate server-owned recovery story. A reload between acceptance and final heartbeat must not turn real work into “nothing pending.”

## Progress, recovery and UI blocking

LMS distinguishes frontend sending from backend `syncInProgress`. Its heartbeat effects request a cache refresh when backend processing transitions from active to inactive. This is useful separation, but a global boolean is not proof of each command's final result. A new protocol needs command/batch identity and an outcome endpoint or event contract when individual errors matter.

| Observed state         | What is known                                   | Safe next action                                 |
| ---------------------- | ----------------------------------------------- | ------------------------------------------------ |
| Queued locally         | Intent is durably retained under local contract | Submit stable identities when allowed            |
| Sending                | Request is in flight                            | Avoid duplicate concurrent flush                 |
| Response lost          | Acceptance/execution may be unknown             | Query receipt or retry same supported identity   |
| 202 accepted           | Server accepted processing responsibility       | Show accepted/processing, not final success      |
| Processing heartbeat   | Backend reports scoped activity                 | Continue observing with bounded recovery         |
| Final outcome received | Exact command result is known                   | Reconcile local projection and retire receipt    |
| Heartbeat disappears   | Progress observation unavailable                | Show unknown/recovering and permit safe recovery |

A full-screen freeze can be appropriate for a short consistency-critical transition, but it must have a bounded escape/recovery policy. Do not keep users trapped permanently because the final heartbeat was lost. Do not unfreeze into a falsely current cache either; retain explicit stale/reconciling state and disable only the actions whose prerequisites are unknown.

## Failure boundaries

If upload fails before known acceptance, preserve commands for safe retry. If the server may have accepted, preserve uncertainty and stable identity. If local deletion fails after acceptance, some rows may already have been removed: the inspected per-ID deletion calls do not prove atomic queue retirement. Recover by receipt and durable state, not by trusting that a catch restored all prior rows.

New commands arriving during a flush remain separate. After the attempt ends, scheduling must reliably notice any remaining eligible work; a state change observed while the single-flight flag was set must not be the only trigger. Confirm the scheduling contract when adapting a reactive implementation rather than assuming an in-memory flag supplies a complete pump.

Server rejection, domain conflict, and permission loss require different recovery. Do not endlessly retry a denied command. Preserve useful safe intent for reconciliation where allowed, and keep private data partitioned by its original owner.

## Acceptance scenarios

Add a command during upload: only the submitted snapshot is retired and the remaining work is scheduled. Return 202 while processing is delayed: the UI says accepted, not completed. Reload after acceptance: receipt recovery still finds the outcome. Lose the final heartbeat: the application shows unknown/recovery without permanent freeze. Reject part of a batch under a subset contract: unaccepted commands remain. Fail local retirement after server acceptance: stable receipts prevent duplicate business effects during repair.

Localize queued, sending, accepted, processing, completed, failed, and uncertain states. Expose exact next actions rather than a generic spinner with no end condition.

## Avoid these shortcuts

Do not equate 202, heartbeat, or an empty local queue with final success; clear commands outside the submitted snapshot; regenerate retry identities; or assume a module flag coordinates tabs. Synchronization is an acknowledged state machine across two durable systems.

## Sources and provenance

- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/sync/services/LmsSyncOrchestrator.ts` — single-flight snapshot flush, snapshot-ID removal, sending signal, and limits of retirement/scheduling evidence.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/sync/api/sync.online.ts` — void-returning upload boundary without parsed per-command acceptance receipts.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/sse/events/heartbeat/signals/sigHeartbeat.ts` — separate backend-processing signal and post-processing cache refresh.
