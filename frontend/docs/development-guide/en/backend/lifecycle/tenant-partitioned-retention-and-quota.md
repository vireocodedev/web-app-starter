# Partition retention and quota by trusted tenant scope

**Support status: Vireo framework reference recipe, not installed RGO behavior.** Vireo lifecycle policies attach an opaque partition, expiry and hold flag to History/Offline rows. This starter requires explicit module adoption or equivalent consumer implementation. Framework defaults are storage mechanics, not universal product/legal retention policy.

Use this pattern when the same account/owner can appear in several tenants or when one tenant's retained history must not evict another's data. A retention period and a quota need the same clearly defined ownership boundary as authorization.

## Default ownership is not a tenant model

Pinned Vireo History defaults to an actor-derived partition, or `system` without actor ID. Offline uses its stable owner key. Both default to 30-day retention and 10,000 records/commands per partition. Applications with tenant boundaries must replace the policy; the default does not invent a tenant merely because the deployment serves several customers.

Build partition identity from trusted current tenant/owner values, not a caller's arbitrary string. A stable opaque encoding of a canonical tuple can avoid delimiter collisions and needless disclosure, but hashing is not authorization or guaranteed anonymization. Keep mapping/version rules stable enough to find retained data later.

| Decision        | Application owner must define                         |
| --------------- | ----------------------------------------------------- |
| Partition tuple | Every boundary needed for retention/erasure isolation |
| Expiry          | Purpose, duration and exact time owner                |
| Quota           | Count/byte semantics and eviction/rejection policy    |
| Holds           | Who may place/release them and on what basis          |
| Mapping change  | How old partitions remain discoverable and scoped     |

## Read admission behavior precisely

History store first purges expired nonheld rows in the partition. If count would exceed the configured ceiling, it selects the oldest nonheld rows by occurrence time/ID and removes enough to admit the new row. Offline admission uses corresponding creation-time/ID ordering. Thus quota pressure can remove ordinary rows before expiry; retention is not a promise to retain every row for the full period.

Held rows are excluded. When too few ordinary rows can be removed, the service publishes a quota-rejected event and throws. It does not intentionally delete held rows or bypass its observed quota merely because a new write is convenient.

**Pseudocode recipe:** implement trusted partition resolution, policy/schema, shared concurrency owner and repository operations. The helpers below are not starter imports.

```java
@Transactional
public void admit(RetainedRecord record, CurrentScope scope) {
    var partition = partitions.requireForTrustedScope(scope);
    partitionLocks.acquire(partition);
    repository.purgeExpiredUnheld(partition, clock.instant());
    quota.makeRoomFromOldestUnheld(partition);
    repository.insert(record.withPartition(partition));
}
```

The partition lock is **proposed consumer hardening**, not shown in the pinned lifecycle service. Its code performs count/select/delete/store within transactions, but the inspected repositories show no partition lock or serializable admission protocol. Do not claim a strict concurrent hard cap from a sequential count check. A consumer needing that invariant must coordinate every writer and hold/purge operation deliberately.

## Keep scope binding in every query

The reference repositories bind partition into expiry deletion, actor/owner erasure and hold changes. Expiry checks use the service's injected clock. Indexes lead with lifecycle partition and include expiry/hold or owner identity for their access paths. A global purge-all shortcut has a different authority and operational scope; it is not supplied by the partition API's safety argument.

Purge scheduling is application-owned. Admission's opportunistic purge does not guarantee old unused partitions are cleaned at a specific cadence. Nor does a row-count quota bound total bytes if a custom policy retains large payloads; define payload sizes and storage budget separately.

## Failure and recovery

When holds exhaust ordinary capacity, surface a controlled admission failure and a protected operational count. Resolve policy/capacity through the authorized owner; silently dropping holds or growing without bound changes the contract. A quota-rejected event emitted before rollback is not itself proof of a committed lifecycle mutation.

Changing partition encoding without a migration can strand data or make erasure incomplete. Keep old mapping readable until its retained rows are handled. Avoid tenantless owner keys, client-selected partitions and asserting guaranteed retention duration while quota eviction can remove unheld rows earlier.

## Adaptation checklist

- Tenant/owner tuple and partition encoding are trusted, stable and documented.
- Default durations/counts are replaced or consciously accepted by application policy.
- Expiry and quota eviction are distinguished; payload bytes are separately bounded.
- All mutation/purge/hold writers share the required concurrency protocol.
- Held-data exhaustion produces explicit failure without hidden policy changes.
- Purge cadence and old partition mapping have owners.
- No legal/compliance guarantee is inferred from a framework retention default.

## Exact source references

- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-history/src/main/java/com/vireocode/vireo/history/HistoryDataLifecycleService.java` — purge, oldest-unheld eviction and held-quota failure.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-offline/src/main/java/com/vireocode/vireo/offline/OfflineDataLifecycleService.java` — analogous command admission and partition-scoped operations.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-history/src/main/java/com/vireocode/vireo/history/HistoryRepository.java` — scoped predicates and absence of explicit partition locking here.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-history/src/main/java/com/vireocode/vireo/history/SafeDefaultHistoryDataLifecyclePolicy.java` and `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-offline/src/main/java/com/vireocode/vireo/offline/SafeDefaultOfflineDataLifecyclePolicy.java` — actor/owner defaults do not invent tenant scope.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-history/src/main/java/com/vireocode/vireo/history/StarterHistoryProperties.java` and `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-offline/src/main/java/com/vireocode/vireo/offline/StarterOfflineProperties.java` — bounded reference defaults.
