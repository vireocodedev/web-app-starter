# Deduplicate durable effects, not only received messages

**Support status: source-backed consumer recipe.** FRED combines a bounded ingress cache with deterministic persisted observation identities, locked resource state and timestamp watermarks. The starter does not ship this ingestion subsystem or its MQTT/Jackson dependencies. A consumer must implement its own durable event and state contract.

Use this pattern when a broker, webhook sender or polling feed can deliver an event more than once or out of order. “The handler ran twice” is expected transport behavior; “the same event created two business effects” is the defect to prevent.

## Distinguish three identities

The ingress derives a deterministic identity from topic plus raw JSON text. Successful handling places that identity in a bounded 10,000-entry cache. Identical redelivery can then skip repeated observation work. The identity is byte/text-sensitive: differently formatted JSON is not automatically the same semantic event. The cache size is peer policy, not a universal default.

The store derives durable identity from observation kind, resource serial and event identity. Telemetry checks the resulting persisted primary identity before adding another row. Resource state also retains the latest accepted observation time. These mechanisms survive process restart, unlike the ingress cache.

| Mechanism                    | Role                                              | Limitation                                                    |
| ---------------------------- | ------------------------------------------------- | ------------------------------------------------------------- |
| In-memory message cache      | Avoid repeated work for recent identical input    | Lost on restart, bounded eviction, process-local              |
| Durable observation identity | Identify the same business observation            | Requires stable source/event meaning and database enforcement |
| Resource watermark           | Prevent old observations regressing current state | Time/order policy must handle ties and source clocks          |

Choose a stable provider event ID when the source supplies one with a reliable uniqueness scope. A payload hash can be useful, but it is not automatically the identity of a business action, and a content-changing retry may need explicit conflict handling rather than a second action.

## Serialize the protected resource effect

FRED's store locks the approved canonical resource and refreshes it before checking current ownership and observation state. Telemetry rejects duplicates and observations not newer than the latest relevant telemetry/end time. Livestream handling keeps a resource-level observed-time watermark and checks durable stream identity so redelivery does not reopen a closed stream after restart.

The important invariant is not merely “insert once.” An old active event must not reactivate a resource after newer inactive evidence; a duplicate must not create a new parent lifecycle row because its earlier child was already closed. Review the parent, child and state-transition effects together under the same transaction.

**Pseudocode recipe:** `events`, `resources`, ordering policy and result types below are consumer-owned. Implement unique constraints in the actual Flyway schema, canonical resource mapping, authority, replay/conflict policy and transaction boundaries before adapting it.

```java
@Transactional
public IngestionResult accept(Observation observation) {
    var resource = resources.lockApproved(observation.resourceRef());
    if (events.sameIdentityExists(observation.identity())) return duplicate();
    if (!ordering.isNewer(observation, resource.watermark())) return obsolete();
    events.insertUnique(observation);
    resource.apply(observation);
    resource.advanceWatermark(observation.position());
    return applied();
}
```

The recipe deliberately leaves ordering abstract: some sources provide a sequence/revision stronger than their timestamp. FRED uses strictly newer observation times in relevant paths; equal timestamps can therefore be ignored under that peer policy. Do not silently adopt this for a source that emits distinct same-time events.

## Keep transport replies independent of duplicate effects

FRED replies to required status/event messages before checking its ingress cache, so duplicate delivery still receives the required protocol reply. A missing reply can otherwise cause endless redelivery even when the domain effect was correctly deduplicated.

Those replies occur before durable observation handling, so they are not database-commit acknowledgments. A source-specific protocol may require that behavior; a new adapter must state whether its response means received, accepted for processing or committed. An acknowledgment lost after commit is one reason a sender can legitimately retry an already-applied event.

The cache is populated only after the accept path completes successfully. That still does not mean every supported envelope created a database row: some paths update presence or represent observations intentionally ignored by policy. Describe cached completion precisely rather than calling it an authoritative durable inbox.

## Failure and recovery

If persistence fails, allow the transaction to roll back and keep the event eligible for the defined retry. Do not mark it completed in memory before the durable boundary succeeds. If a competing unique insert fails, recover only after the failed transaction has ended, using the consumer's bounded race policy.

After restart, replay should yield the same durable effect and preserve the latest state. Conflicting content under the same trusted event identity needs a documented conflict/quarantine path, not last-write-wins. A cache hit must not bypass a required reply or become a permanent substitute for current resource approval.

Avoid distributed exactly-once claims based on a synchronized Java method, an in-memory set or a single application replica. Correctness rests on durable identity, transaction/constraint ownership and ordering rules at the resource seam.

## Acceptance cases for a consumer

- Identical delivery before and after restart produces one durable effect.
- Cache eviction changes cost, not correctness.
- An old active observation cannot undo newer inactive state or recreate a closed lifecycle.
- Equal-time and content-conflicting events follow explicit source policy.
- A required reply is still sent on duplicate delivery, with honest acknowledgment semantics.
- Failed persistence does not poison the completed cache or leave partial parent/child state.
- Concurrent writers meet the database uniqueness and lock protocol rather than relying on one process's memory.

## Exact source references

- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/protocol/DroneMessageIngress.java` — raw-envelope identity, bounded cache, completion placement and replies before deduplication/storage.
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/persistence/DroneObservationStore.java` — durable observation identity, resource locks, watermarks and restart-safe lifecycle checks.
