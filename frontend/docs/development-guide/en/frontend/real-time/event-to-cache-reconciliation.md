# Validate events before reconciling a bounded cache

An event payload is an untrusted input, even when its transport is authenticated. Validate its envelope and entity projection, route it to the owner of that read model, and decide whether direct replacement or refetch is safe. A message arriving is not enough evidence to mutate every cached list.

This is a **reference recipe** from LMS and FRED. LMS validates event types and entity payloads before updating IndexedDB and invalidating entity queries. FRED shows a DTO-to-display transformation but relies on unchecked provider decoding. Neither source proves a complete ordered replay, deduplication, or gap-recovery protocol. Those are additional backend/frontend contracts for a new integration.

## Trigger and ownership

Use reconciliation when server events can change an entity already shown in several views or persisted for offline reads. The event boundary owns decoding and schema validation. The feature's data owner knows its entity schema, query keys, persisted representation, and affected summaries. The transport owner manages connection lifetime; it should not learn every table's filter membership.

LMS first checks special event shapes, then parses a generic update envelope with a typed target and unknown payload. It validates that payload through the target's registered Zod schema. Only then does it attempt an IndexedDB put and invalidate the relevant entity queries. This two-stage boundary prevents a valid event name from making arbitrary JSON a trusted record.

The inspected update handler ignores an IndexedDB write error because not every entity has a store. That is an observed historical accommodation, not a guarantee of durable event application. A new offline feature must distinguish “this entity is intentionally not persisted” from “the required local write failed.”

## Define an event contract before applying it

This is a **proposed envelope**, not the source's installed message shape:

```ts
type DocumentEvent = {
  schemaVersion: 1;
  eventId: string;
  workspaceId: string;
  entityId: string;
  revision: number;
  kind: "document-changed" | "document-removed";
};

// Decode safely -> validate -> verify owner -> compare ordering/cursor.
// Apply an authoritative compatible projection, or invalidate scoped reads.
// On an unknown gap, fetch an authoritative snapshot before claiming freshness.
```

The source envelopes include type, target, payload, and nullable source. Do not pretend that they already supply the proposed event ID, revision, cursor, or schema-version guarantees. If the backend lacks those facts, a conservative policy can treat events as invalidation hints and refetch current state rather than attempting ordered patch replay.

A full entity projection can sometimes replace an exact detail entry. A partial patch cannot safely replace that detail without a documented merge contract. Sorted, filtered, and paged lists are harder: an update may add/remove membership, move pages, or change totals. Invalidate their scoped family instead of manually editing every cached variant by guesswork.

## Ordering and failure decisions

| Input or condition                                 | Action                                       | Freshness consequence                   |
| -------------------------------------------------- | -------------------------------------------- | --------------------------------------- |
| Malformed JSON or invalid envelope                 | Reject safely and record bounded diagnostics | Do not mutate data                      |
| Valid envelope, invalid entity payload             | Reject incompatible projection               | Mark affected stream/model for recovery |
| Event belongs to old viewer/workspace              | Ignore under owner policy                    | Never cross-populate private state      |
| Duplicate with a supported event identity          | Apply idempotently or skip                   | Do not duplicate rows or effects        |
| Older revision under a supported revision contract | Do not overwrite newer state                 | Retain current projection               |
| Missing cursor range or reconnect gap              | Fetch authoritative state                    | Do not claim complete freshness yet     |
| Required IndexedDB write fails                     | Surface persistence failure separately       | Do not claim offline durability         |

Runtime validation does not prove ordering. A perfectly shaped older event can still overwrite a newer projection. Conversely, a timestamp alone is not necessarily a total order: clock skew and equal timestamps require an agreed protocol. Document whether the event carries a projection, a patch, or only a hint.

## Heartbeats and model conversion

LMS parses heartbeat messages before updating its heartbeat signal and forwarding the payload to a worker. That is a bounded ownership path for liveness, separate from entity update handling. A heartbeat must not acknowledge unrelated commands or imply that a missing entity event was applied.

FRED converts timestamp strings and coordinates into display-model values in its vehicle handler. The transferable seam is an explicit adapter after validation. New code should validate dates, finite coordinates, and supported values rather than relying on a TypeScript cast or allowing invalid numerical values to leak into a map or table.

## Recovery and acceptance scenarios

A schema failure should provide safe event-type/version diagnostics without logging private payloads. Repeated incompatibility may require a full refresh or visible “updates unavailable” state. Do not silently discard all failures while continuing to show a fresh indicator.

Deliver an invalid entity payload under a valid event name: no cache entry changes. Deliver an old owner's event after account switch: private data does not cross over. Deliver the same supported event twice: the projection and counts remain coherent. Deliver an older revision after a newer one: no rollback occurs under the agreed contract. Disconnect across a change, then reconnect: authoritative refetch repairs the gap. Fail a required local store write: the UI distinguishes live data from durable offline availability.

Localize stale/update-failed recovery separately from ordinary empty data. Announce meaningful changes without moving focus on each background update; preserve stable row and control identities.

## Avoid these shortcuts

Do not trust `JSON.parse(...) as T`, treat heartbeat as write success, manually patch every list variant, claim replay guarantees from a schema parser, or swallow required persistence failures. Events should enter through a narrow validated boundary and leave through the owner of the affected read model.

## Sources and provenance

- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/sse/events/update/handler.ts` — special handlers, envelope/entity validation, optional IndexedDB write, and entity invalidation.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/sse/events/update/type.ts` — observed envelope fields, without the proposed replay metadata.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/sse/events/heartbeat/handler.ts` — validated liveness signal and worker handoff.
- `FRED/FRED-front@7a78e4f624e4b51ce1cdb9334036f2fb6119f62a:src/infrastructure/sse/SseVehicleEventData.ts` — explicit transport-to-display model mapping, with validation limitations.
