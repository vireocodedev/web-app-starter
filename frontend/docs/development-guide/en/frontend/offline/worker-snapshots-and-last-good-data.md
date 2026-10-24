# Preserve the last good snapshot when background refresh fails

Refreshing an offline cache often downloads several related entity collections. Replacing some stores while another collection fails can leave a mixed snapshot that never existed on the server. Keep the last usable snapshot until the candidate is complete and can be promoted under the storage owner's consistency contract.

This is a **reference recipe from historical LMS code**, not an installed starter worker. LMS's worker collects all refresh results and emits no replacement cache when any fetch fails. Its UI bridge then preserves the prior cache and distinguishes expected connectivity loss from actionable refresh failures. This demonstrates a network-completeness gate; it does not prove runtime payload validation, a server-consistent snapshot, or atomic local promotion.

## Trigger and ownership

Use a worker when refresh processing or large data transfer benefits from isolation from the UI thread. The worker owns request/processing work for one refresh attempt. The cache owner owns persistent schema, snapshot promotion, retained-data privacy, and query invalidation. The UI owns truthful pending, stale, failed, and ready states.

Do not introduce a worker merely to hide an unclear cache lifetime. Define the viewer/workspace identity, source revision or snapshot token where available, entities required for a coherent dataset, and what happens to pending local commands. A worker processing an old owner's response must not overwrite the new owner's cache.

The inspected worker fetches configured collections with credentials and waits for all results. If any request rejects, it emits an error event and does not emit a replacement cache. Its comment explains that the downstream cache loader clears stores before bulk saving, so a partial download would otherwise destroy useful data. This all-or-nothing download gate is the transferable safeguard.

## Stage, validate, then promote

This is a **proposed stronger protocol**, not LMS's installed message shape:

```ts
type SnapshotCandidate = {
  owner: { viewerId: string; workspaceId: string };
  requestId: string;
  schemaVersion: 1;
  snapshotToken: string;
  entities: unknown;
};

// Download complete candidate -> validate every required collection.
// Recheck current owner and request generation.
// Promote with a local transaction or a recoverable generation pointer.
// Invalidate affected query projections only after successful promotion.
```

TypeScript worker message types do not validate arbitrary runtime messages or fetched JSON. LMS's inspected worker checks response status but casts JSON into its expected collection shape. A new implementation needs guarded message decoding and per-entity runtime schemas on the actual trust boundary. It must also reject stale request generations and mismatched owners.

Fetching every endpoint successfully does not guarantee all collections describe one server instant. If the feature requires cross-collection consistency, agree on a server snapshot token, revision, or export endpoint. Otherwise document the weaker consistency rather than describing a simultaneous request batch as a transactional server snapshot.

The local promotion needs its own failure boundary. The network gate alone cannot prevent a quota failure halfway through clear-and-repopulate. Use an IndexedDB transaction spanning required stores or stage a new generation and atomically switch the active pointer after validation. Retain enough prior state to recover interrupted promotion. Inspect the actual storage implementation before claiming those guarantees.

## Keep local intent separate

LMS configures its offline cache service to skip reloading the sync-command and user stores. That shows deliberate separation between downloaded read data and some locally owned state. A new feature must identify its own outbox, identity mappings, receipts, and private session state; do not assume every store should be replaced by a server refresh.

A dirty draft is another owner. Downloading a new snapshot can mark its basis stale, but must not silently overwrite typed values or attach a new token to old input. Actual permission loss can require removing restricted content even if preserving the last snapshot would otherwise be useful.

## Failure and recovery decisions

| Refresh outcome                                      | Retained data                                      | Visible state                                     |
| ---------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------- |
| All required fetches succeed and candidate validates | Promote under local consistency protocol           | Fresh at documented snapshot/version              |
| One endpoint fails                                   | Keep last good snapshot                            | Stale with retry/recovery                         |
| Expected transport/backend loss                      | Keep permitted cached data                         | Offline/unavailable without repeated noisy toasts |
| Schema incompatibility                               | Reject candidate                                   | Update unavailable; safe diagnostics              |
| Local promotion fails                                | Recover prior generation or explicit journal state | Storage failure, not fresh success                |
| Owner or authority changes                           | Reject obsolete candidate                          | New scope or denial                               |
| Initial cache never existed                          | Nothing valid to retain                            | Explain missing offline data                      |

The inspected UI bridge treats known connection-like refresh errors quietly and shows an actionable error for other failures. Its classifier uses error-message strings, which is historical evidence rather than a robust typed transport contract. A new boundary should preserve structured error categories where possible and avoid leaking endpoint details or private payloads in user-facing diagnostics.

## Acceptance scenarios

Fail one collection while others succeed: the old coherent cache remains and no partial replacement appears. Deliver malformed data with HTTP success: validation rejects the candidate. Fail local persistence during promotion: the prior generation or recoverable journal remains available. Switch viewer mid-download: old results cannot publish into the new scope. Refresh while a command is queued: the outbox survives. Start with no valid cache and no connection: show unavailable data rather than an empty successful dataset. Recover successfully: invalidate relevant reads after promotion and clear pending state.

Localize stale, offline, refreshing, failed, and missing-cache messages. Keep last-updated information meaningful and do not steal focus when a background snapshot arrives.

## Avoid these shortcuts

Do not replace valid data with a partial download, treat message typing as runtime validation, describe successful endpoints as a server transaction, clear the outbox with the read cache, or claim freshness from network presence alone. A snapshot refresh has separate download, validation, ownership, promotion, and presentation boundaries.

## Sources and provenance

- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/infrastructure/browser/webWorker/webWorker.ts` — complete-download gate, error/skipped events, and unchecked payload limitations.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/infrastructure/browser/webWorker/webWorkerService.tsx` — UI bridge, last-good preservation, pending cleanup, and query invalidation after load.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/infrastructure/browser/webWorker/WebWorkerSchema.ts` — compile-time worker input vocabulary, not runtime validation.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/infrastructure/browser/indexedDb/IDBService.ts` — configured stores and deliberate cache-reload exclusions.
