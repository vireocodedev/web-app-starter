# Persist offline intent as owned durable commands

An offline success indicator must mean more than “the screen changed.” If a mutation must later reach the server, persist a stable command with its owner and dependencies before claiming that the work is retained. Keep local read models and pending intent distinct so a cache refresh cannot erase an unsubmitted action.

This is a **reference protocol inspired by historical LMS code**, not an installed starter outbox. LMS stores UUID-keyed sync commands in IndexedDB, assigns ordering metadata, and tracks temporary entity identities. Its inspected offline adapters write the local entity and queue in separate calls. That does **not** establish atomic durability of both records; a production adaptation needs an explicit transaction or recoverable journal protocol.

## Trigger and owner

Use a durable queue for explicitly supported offline commands with meaningful later effects. The feature defines the command schema and local projection. A queue owner manages persistence, owner partition, ordering, retry state, and reconciliation. The server defines deduplication, authorization, temporary-identity resolution, and outcome receipts.

The LMS command shape includes command UUID, entity/action, target and result entity IDs, payload, optional business key, client timestamp, and sequence. Its queue store is keyed by UUID, so writing the same stored command again replaces that local key. That local overwrite is not proof that sending the command twice is safe on the server.

The source queue lists commands ordered by timestamp. A separate sequence service supplies a tie-breaker documented for server ordering. Wall-clock order alone is not a dependency graph, and a sequence from local storage is not a multi-tab allocation lock. A new consumer must define concurrency and ordering guarantees for its actual execution environment.

## Commit local state and intent together

This is a **proposed neutral envelope**, not an installed API:

```ts
type QueuedCommand = {
  commandId: string;
  owner: { viewerId: string; workspaceId: string };
  kind: "create-document" | "rename-document";
  localEntityId: string;
  dependsOn: string[];
  payloadVersion: 1;
  payload: unknown;
  state: "queued" | "sending" | "needs-reconciliation";
};

// One local transaction: write projection + command + dependency metadata.
// Only after commit: expose locally retained status and refresh queue display.
```

LMS's inspected comment adapter first calls `put(stored)` and then `enqueueSyncCommand`. A crash or queue-write failure between them can leave a visible entity without corresponding pending intent. Do not copy that sequence and describe it as atomic. Put the required stores in one IndexedDB transaction, or design a journal whose incomplete states can be detected and repaired after restart. The exact solution belongs to the storage owner.

Do not update an in-memory queue signal before durable commit and use it as proof of retention. Conversely, reconstruct the signal from persistent records after restart rather than treating a blank signal as an empty durable queue. Handle quota, schema upgrade, and storage access failures without discarding safe typed input.

## Preserve identity and dependencies

LMS uses negative temporary entity IDs and a persisted decreasing counter. Negative IDs are one product protocol, not a requirement for new features. Stable client UUIDs can be another choice if the backend agrees. Distinguish the command identity from the local entity identity: several commands can target the same entity, and a create may produce an identity that later updates depend on.

A create followed by update or delete must not replay in arbitrary order. Persist dependencies or an agreed total order and maintain the local-to-server mapping across acknowledgement and restart. The inspected source comments differ on how business keys participate in mapping; do not infer a complete backend resolver from the frontend comments alone. Confirm that contract in the actual server owner.

Partition commands by viewer/workspace, and decide what logout, revocation, or workspace removal does to pending private work. Never replay a command under the next user's credentials merely because it remains in the same browser. Retrying preserves the original command ID and payload; changing intent is a new command subject to reconciliation of any uncertain predecessor.

## Failure and recovery decisions

| Failure point                             | Durable truth                    | Required recovery                               |
| ----------------------------------------- | -------------------------------- | ----------------------------------------------- |
| Local transaction fails                   | No retained command promised     | Keep safe input and explain storage failure     |
| Process stops after local commit          | Command still queued             | Rehydrate from storage                          |
| Response lost after send                  | Remote outcome uncertain         | Retry stable identity or query receipt          |
| Create accepted, dependent update pending | Mapping/order still matters      | Resolve identity before dependent replay        |
| Viewer changes                            | Old queue has a different owner  | Pause/partition, never relabel ownership        |
| Payload schema evolves                    | Old commands remain real intent  | Migrate deliberately or surface manual recovery |
| Local cache snapshot refreshes            | Pending commands remain distinct | Preserve outbox and reconcile projections       |

Removing a queued command is also a user-visible decision. Canceling an unsent command can require undoing its local projection and dependent commands. A command already sent or accepted cannot be canceled by deleting its local row; the remote outcome must be reconciled. Keep safe diagnostics to IDs/state, not whole private payload dumps.

## Acceptance scenarios

Fail the queue write while the entity projection would otherwise succeed: the UI must not claim a retained command without a recoverable journal state. Restart after a successful local commit: the same command IDs and dependencies return. Send twice after losing the first response: the agreed server receipt prevents duplicate effects. Create locally, then update: the update targets the resolved entity in the correct order. Switch users: commands do not cross partitions. Upgrade payload schema: old pending intent is neither silently discarded nor executed with new meaning.

Show localized queued, uncertain, failed, and completed states with exact scope and recovery actions. “Saved locally; waiting to synchronize” is different from acknowledged server completion.

## Avoid these shortcuts

Do not keep the outbox only in memory, regenerate IDs during replay, reset counters while old references remain, execute dependencies out of order, share one unowned queue, or call two independent writes atomic. Durability is a storage and server protocol, not a green badge.

## Sources and provenance

- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/sync/services/LmsSyncQueueService.ts` — UUID-keyed IndexedDB queue and timestamp ordering.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/sync/utils/enqueueSyncCommand.ts` — command envelope construction and persistent-before-signal update.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/sync/models/LmsSyncCommand.ts` — command schema, identity fields, and documented ordering/mapping intent.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/sync/services/LmsSyncIdService.ts` — historical persisted temporary-ID counter and its scope limits.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/sync/services/LmsSyncSequenceService.ts` — historical persisted sequence counter.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/shiftComment/api/shiftComment.offline.ts` — separate entity and queue writes, without demonstrated atomic transaction.
