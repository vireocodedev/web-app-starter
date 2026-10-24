# One transaction for one complete business command

**Support status: source-backed reference recipe.** Spring transactions and JPA are available in the starter, but the command services, audit writer and domain authority shown here must be implemented by the consumer. Client Discovery supplies the transactional action examples; LMS supplies a useful comparison between flushing and actual transaction completion.

Use this pattern when one user action changes several rows, a quota depends on concurrent writers, or an audit event must exist exactly when its business mutation exists. Define the invariant first: the database must never retain only a successful-looking prefix of the command.

## Put the application command around the whole action

Client Discovery's `DiscoveryService` has a class-level `@Transactional`. Its metadata action resolves the enabled actor, requires administrator authority, locks the project, checks mutability and expected revision, updates organization and project data, advances the revision and appends audit data before returning the projection. These are one application operation rather than independent repository commits.

`ProjectFilesService` uses the same pattern for an upload. It authenticates the actor, locks the parent, checks quota, reads bounded content, rechecks actual length, inserts content and metadata, and appends audit within the service transaction. Its read methods explicitly use read-only transactions. The service boundary expresses the action; a transaction annotation on every individual SQL call would not establish the same invariant.

| Work                              | Required relationship to the command                                     |
| --------------------------------- | ------------------------------------------------------------------------ |
| Live actor and resource authority | Resolve before protected mutation                                        |
| Quota/state/revision checks       | Observe the protected state inside the mutation boundary                 |
| Business rows and mandatory audit | Commit or roll back together                                             |
| Public response projection        | Deliberately select fields from the permitted result                     |
| Remote irreversible effect        | Design a separate durable operation; it cannot roll back with PostgreSQL |

## Worked command recipe

Suppose a workspace record is moved to a collection with a capacity limit. Record membership, collection capacity, revision and audit must agree. The following is **pseudocode**, not an importable starter API. Implement the actor policy, scoped locking repository, command/result DTOs, audit storage, migrations and error translation before using it.

```java
@Transactional
public RecordView move(UUID workspaceId, UUID recordId, MoveRecord command,
                       Authentication authentication) {
    var actor = actors.requireEnabled(authentication);
    var record = records.lockVisible(workspaceId, recordId, actor);
    var collection = collections.lockTarget(workspaceId, command.targetId(), actor);
    revisions.requireExpected(record.revision(), command.expectedRevision());
    collection.requireSpareCapacity();
    record.moveTo(collection.id());
    record.advanceRevision();
    audit.append(actor.id(), record.id(), "RECORD_MOVED");
    return views.record(record, actor);
}
```

This abbreviated recipe does not define a universal lock order. If another command locks the collection before the record, design a common order before adopting it. The application service owns that protocol across all participants, including deletion and membership changes. Input DTO validation remains useful, but an apparently valid target ID is not evidence that the target belongs to this workspace.

## Proxy entry, flush and commit are different boundaries

The effective Spring transaction boundary is a call intercepted by the configured transactional proxy, or an explicit `TransactionTemplate` execution. A helper call on the same object does not pass through a fresh proxy. In the Discovery source, an internally called helper carries `noRollbackFor`; do not advertise that annotation as independently changing the surrounding transaction's rollback policy on self-invocation.

Choose the actual outer boundary and exception semantics deliberately. With ordinary Spring defaults, unchecked failures cause rollback; checked exceptions and custom `rollbackFor` policies require review. Catching a failure and returning a success DTO can undermine the command contract, and a persistence failure may already have marked the transaction rollback-only.

LMS `BaseService` calls `saveAndFlush`. Flushing sends pending changes toward the database and can expose a constraint failure early; it does not make those changes committed or visible as a completed action. Its more specific versioning service registers transaction synchronization callbacks that distinguish committed, rolled-back and unknown completion. A debug message printed after flush must not be described as evidence of commit. An outer caller can still govern the final outcome.

## Failure and recovery decisions

If audit insertion fails after the business row changes, the intended result is rollback of both when audit is mandatory. Correct the underlying fault and let a later authorized request retry from committed state. If an invariant failure occurs before mutation, return the documented domain conflict without changing state. After an ambiguous HTTP failure, the client needs the command's idempotency/reconciliation contract; blindly repeating an irreversible command is not justified by a lost response.

Avoid sending email or invoking a payment adapter while a database transaction holds resource locks. A database rollback cannot recall that effect. Persisted intent, outside-transaction I/O and reconciliation are a separate recipe. Likewise, an after-commit in-memory notification is not a durable outbox merely because its timing is correct.

## Acceptance cases to carry into an implementation

- Failure on any mandatory related write leaves none of the command's business changes committed.
- An unauthorized or newly disabled actor cannot reach protected mutation through a different service entry point.
- Competing capacity-changing commands participate in the same lock protocol.
- Flush success followed by commit failure is surfaced as failure, never as a durable-success claim.
- A self-invoked helper is not relied on to create a new transaction or alter rollback rules.
- Remote effects have an explicit durable/idempotency design rather than being treated as rollback-capable database writes.

These cases specify behavior; source inspection alone is not runtime proof.

## Exact source references

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/DiscoveryService.java` — transactional metadata, revision and audit command; internally invoked lookup helper.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectFilesService.java` — locked quota, bounded content and audit in one command.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/base/BaseService.java` — save-and-flush comparison.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/vessel/VesselService.java` — synchronization-based completion reporting, distinct from flush.
