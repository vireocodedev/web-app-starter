# Scope erasure and holds in the same database predicate

**Support status: Vireo framework reference recipe, not installed in this RGO/Spring starter.** History/Offline lifecycle services provide partition-scoped deletion and hold mechanics. Applications still own administrative authority, retention purpose and any legal assessment. The word “legal” in a flag does not establish a legal obligation or compliance outcome.

Use this pattern when an actor/owner ID can exist in several tenants or when some retained rows must survive ordinary purge/erasure. A global lookup followed by a loosely scoped delete can cross boundaries even if its UI starts from the correct tenant.

## Bind all scope in one mutation

The reference History repository erases where partition, actor ID and `legalHold=false` all match. Offline uses partition, owner key and the same hold exclusion. Expiry deletion similarly requires the supplied partition and a nonheld expired row. Parameters are bound by repository queries rather than concatenated into SQL.

Hold changes bind partition plus audit-row ID for History or public command ID for Offline. The service returns true only when one matching record changed; an identifier from another partition returns false. Input validation requires nonblank bounded keys and non-null identifiers.

| Operation           | Required mutation scope                   |
| ------------------- | ----------------------------------------- |
| Expiry purge        | Partition + expiry + not held             |
| Actor/owner erasure | Partition + subject identity + not held   |
| Place/release hold  | Partition + exact record/command identity |

This is structural scope enforcement, not caller authorization. The services do not install a consumer administrator role or prove that a caller may manage the supplied partition. Resolve scope from trusted current authority before invoking them.

## Make hold and completion semantics explicit

The erasure service reports the number deleted and separately counts matching held rows for a neutral lifecycle event. A successful call can therefore leave held data behind. “Request processed” must not be translated into “all personal data everywhere deleted.” The API covers particular module rows, not application entities, exports, caches, backups or external providers.

**Pseudocode recipe:** implement current administrative policy, trusted partition mapping, scoped repositories, protected audit/reporting and the estate-wide erasure inventory. These helpers are not installed starter APIs.

```java
@Transactional
public ErasureSummary erase(ErasureCommand command, Authentication auth) {
    var scope = administration.requireErasureScope(auth, command.workspaceId());
    var subject = subjects.requireInScope(scope, command.subjectId());
    var removed = retained.deleteUnheld(scope.partition(), subject.stableId());
    var held = retained.countHeld(scope.partition(), subject.stableId());
    return new ErasureSummary(removed, held);
}
```

A consumer must decide whether the subject account itself stays, how hold release is authorized and how subsequent writes are prevented or handled. A row deletion alone does not prevent the next replay/import from recreating data. Record the policy result accurately without retaining a fresh unrestricted copy of what was erased.

## Review concurrency and transaction limits

The pinned queries include hold exclusion in their delete predicate, which is stronger than checking a flag earlier in Java. However, the inspected services do not show a universal lock/version protocol coordinating new holds, erasure, quota eviction and concurrent admission. A consumer needing strict ordering must define it across every writer; do not promise “a simultaneous hold always wins” without implementation evidence.

Services publish lifecycle events in their transaction path. Unlike isolated operational telemetry, these calls are not wrapped by the same listener-failure catch. A synchronous listener failure can affect the operation, and an emitted event is not automatically a committed erasure receipt. Choose transactional audit and post-commit reporting deliberately.

## Failure and recovery

Wrong-partition hold changes should return the narrow false/not-found result without disclosing another tenant's record. Erasure of one tenant's subject must never fall back to global actor/owner deletion when no row matches. Held-data leftovers need a protected explanation and authorized decision, not silent flag removal.

An interrupted multi-system erasure needs resumable per-owner evidence and current authorization, with explicit pending/held/failed states. That orchestration is additional consumer work; the framework's scoped delete is not a full data-subject workflow. Background purge scheduling and backup retention also require their own owners.

## Adaptation checklist

- Every delete/update predicate binds tenant partition and subject/record identity together.
- Caller authority is checked separately from the supplied scope string.
- Hold placement/release and concurrency order are explicit.
- Completion reports removed, held and out-of-scope work honestly.
- Event/audit reporting follows transaction outcome rather than publication alone.
- Other stores, caches, exports and reconstruction paths are inventoried.
- No legal conclusion or whole-estate deletion claim is inferred from the module flag/API.

## Exact source references

- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-history/src/main/java/com/vireocode/vireo/history/HistoryRepository.java` — partition/actor/hold delete and partition/record hold update.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-offline/src/main/java/com/vireocode/vireo/offline/OfflineSyncCommandRepository.java` — partition/owner/hold predicates.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-history/src/main/java/com/vireocode/vireo/history/HistoryDataLifecycleService.java` and `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-offline/src/main/java/com/vireocode/vireo/offline/OfflineDataLifecycleService.java` — bounded inputs, return values, held counts and transactional publication.
