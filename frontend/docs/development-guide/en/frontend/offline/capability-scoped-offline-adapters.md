# Make offline capability an explicit operation contract

An unavailable network does not make every server operation safe to execute locally. Offline reads need an authorized retained dataset; offline writes need durable commands, replay semantics, and conflict recovery. Decide which operations support those guarantees before choosing an adapter.

This is a **historical reference capability** from LMS, not an installed starter mode. LMS routes a shared API interface to online or offline implementations using operation/role policy and connection evidence. Its designated offline role is product-specific. The starter does not inherit that role, its cache, or permission to queue writes after an error.

## Trigger and ownership

Use offline adapters when the product must support particular tasks through intermittent connectivity and has accepted the privacy, durability, and reconciliation implications. The feature API owns operation semantics. An offline policy owner defines eligible viewers, operations, cached scope, validity limits, and unavailable behavior. The server owns authorization when commands are replayed and defines any explicit offline authority agreement.

LMS enumerates API modules/members through `ApiSchema`, provides online/offline implementations, and applies per-operation access overrides. Some product roles always use the server, while one eligible role can fall back. A method without an allowed offline implementation raises an unsupported-offline error rather than reporting success.

Its connection resolver uses a role-aware heartbeat signal and a recognized error classifier. Status 0 or 503 and selected no-response transport failures can trigger fallback for the eligible role. Other explicit statuses do not. In particular, a 400 validation error, 401 session failure, 403 denial, or 409 conflict must not silently become a queued successful write.

## Specify policy before implementation

This is a **proposed policy model**, not an installed helper:

```ts
type OperationPolicy =
  | { mode: "online-only" }
  | { mode: "cached-read"; scope: "viewer-workspace"; maxAgeMs: number }
  | {
      mode: "durable-offline-command";
      scope: "viewer-workspace";
      requiresReceiptProtocol: true;
    };

// Classify the actual failure before considering fallback.
// Validate owner, cache availability, and operation policy.
// Persist safely before reporting locally retained work.
```

An interface-compatible adapter should preserve the operation's documented meaning. Returning an entity after local persistence must not be presented as server acknowledgement. If callers need to distinguish online completion from locally queued work, add an explicit result/outcome contract at the feature boundary rather than hiding the distinction behind an identical success toast.

The historical LMS dynamic builder uses casts and ignored type errors while joining modules. Transfer the interface and policy boundary, not that implementation as a default abstraction. A small explicit pair of injected adapters is often clearer for a bounded feature. Runtime schemas remain necessary for persisted and incoming data even when both adapters satisfy one TypeScript interface.

## Choose fallback deliberately

| Condition                                    | Allowed behavior                           | Forbidden shortcut                    |
| -------------------------------------------- | ------------------------------------------ | ------------------------------------- |
| Authorized fresh cache and supported read    | Show cached projection with freshness      | Pretend it was a new server read      |
| Supported offline write with durable queue   | Retain local command and show pending sync | Claim server completion               |
| Missing offline implementation               | Show unsupported operation                 | Manufacture an empty success          |
| 403 from server                              | Apply denial/revocation policy             | Queue around authorization            |
| 409 from server                              | Reconcile conflict                         | Reclassify as offline                 |
| Recognized transport loss, ineligible viewer | Fail with recovery                         | Borrow another role's offline policy  |
| Missing or wrong-owner cache                 | Block protected task                       | Use another viewer's retained records |

The heartbeat itself is policy input, not universal proof. LMS intentionally does not turn roles that never receive heartbeats offline just because no heartbeat exists. Browser network presence is also insufficient to prove backend reachability, authentication, or cache freshness. Keep those states separate.

## Failure and recovery

A failed local write, quota error, or unavailable IndexedDB means the offline operation was not durably retained. Preserve safe input and show a recoverable persistence error; do not emit a queued receipt merely because the adapter ran. A failed online write with unknown outcome needs idempotency/reconciliation before an offline duplicate can be invented.

On reconnect, do not automatically replace a dirty local view with a downloaded server snapshot. Separate queued local intent from the read cache and reconcile them under the synchronization protocol. On logout or viewer change, partition and dispose data according to the product's privacy and pending-work policy. Do not replay one user's commands as the next user.

Offline authority can expire or be revoked while disconnected. A capability flag in browser storage cannot prove ongoing permission. The product must decide whether locally permitted work can be drafted, queued, or blocked under uncertainty, and the backend must reauthorize replay. This is a business decision, not a generic network catch.

## Acceptance scenarios

Run an allowed cached read with the correct owner and show its age. Attempt an unsupported operation offline: it fails explicitly. Return 403 and 409 while online: neither becomes offline success. Lose transport on an eligible durable operation: only a successful local commit produces queued status. Change viewer: prior cached data and queued commands are not adopted. Reconnect after a possible online commit: reconciliation prevents an automatic duplicate. Remove local storage availability: the page retains safe input and accurately reports that no durable queue entry exists.

Localize offline, stale, queued, unsupported, denied, and reconciliation messages independently. Explain which action is unavailable and what can still be done; do not replace the whole page with an unexplained connectivity icon.

## Avoid these shortcuts

Do not use every catch as offline fallback, equate 403 with connectivity loss, copy LMS roles into the starter, hide queued work behind “saved,” or adopt a generic proxy before the operation contract is clear. Offline support is a deliberate capability with a replay and retention owner.

## Sources and provenance

- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/infrastructure/api/api.ts` — adapter resolution, eligibility, unsupported fallback, and recognized transport classification.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/infrastructure/api/apiAccessLookup.ts` — explicit per-operation product policy, not portable role defaults.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/sse/events/heartbeat/signals/sigHeartbeat.ts` — role-aware connection evidence and cache-refresh coordination.
