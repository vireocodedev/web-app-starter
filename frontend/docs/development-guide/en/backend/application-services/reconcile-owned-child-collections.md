# Reconcile an owned child collection by stable identity

**Support status: LMS reference recipe with explicit input-validation gaps.** The completed-aggregate update path reconciles existing, removed and new children. Its entity helpers maintain parent/child references. The starter does not install this aggregate model, mappers or collection-replacement protocol; a consumer must define ownership and deletion rules first.

Use this pattern when a parent editor submits the intended complete set of children. Do not confuse replacement with PATCH omission: a missing existing child can mean delete only when the endpoint explicitly accepts a complete replacement collection.

## Separate the three cases

The source builds a map of incoming non-null child IDs, iterates children already belonging to the aggregate and removes each matched ID from that map. Matched children are updated in place; missing children are deleted through their repositories; null-ID inputs create new children. Server-owned parent/scope/direction and derived positioning are reassigned by the owner.

| Input identity                           | Consumer meaning                                       |
| ---------------------------------------- | ------------------------------------------------------ |
| Existing ID owned by this parent         | Update allowed child fields without replacing identity |
| No ID                                    | Create a new owned child                               |
| Existing child omitted from complete set | Apply explicit remove/delete policy                    |
| Unknown or foreign non-null ID           | Reject; never guess create/move                        |
| Duplicate ID                             | Reject a malformed replacement command                 |

The last two rows are required adaptation rules, not guarantees of the peer method. In the inspected source, unmatched non-null IDs remain in the incoming map without an explicit rejection. Duplicate map keys can fail through `Collectors.toMap`, but that incidental exception is not a deliberate safe client-error contract.

## Validate identity before mutating the graph

**Pseudocode recipe:** implement current parent authority, revision/lock, command validation, owned-child lookup, mapper allowlist, remove policy and audit. None is supplied by this starter.

```java
@Transactional
public ParentView replaceChildren(UUID id, ReplaceChildren command, Authentication auth) {
    var parent = parents.lockAuthorized(id, actors.current(auth));
    revisions.requireExpected(parent.revision(), command.expectedRevision());
    var existing = children.indexOwnedBy(parent.id());
    var incoming = commands.requireUniqueIds(command.children());
    commands.rejectUnknownOrForeignIds(incoming, existing.keySet());
    reconciliation.applyCompleteReplacement(parent, existing, incoming);
    invariants.requireValid(parent);
    return views.parent(parent);
}
```

Validate every supplied ID before any destructive work. If moving an existing child is a valid business action, use an explicit move command rather than hiding it inside replacement. A missing/null collection needs its own request rule; the source directly streams expected collections and does not demonstrate nullable-collection semantics.

For the surrounding boundary use [transactional commands](./transactional-commands.md) and [revision conflict handling](../data/revision-conflicts-and-shared-locks.md). Reconciliation here owns identity matching and graph mutation, not a second transaction framework.

## Keep both sides and deletion semantics deliberate

The source parent entity has add/remove/clear helpers that update the child back-reference. Some helpers also reset dependent position fields. Its replacement path performs explicit repository deletions, including nested rows for one child type. That is stronger than detaching a child and different from an orphan-removal annotation.

Choose whether removal means unlink, soft delete, hard delete or retained history. Do not add cascade REMOVE merely to make a mapper work. Replacing an owned child with a newly mapped object of the same ID can lose managed state, audit and associations; update the existing managed instance through allowed fields.

Inverse helpers keep the in-memory graph consistent, but they do not authorize cross-tenant linkage or validate every supplied child. Database foreign keys and scope constraints remain relevant. The source mapper/DTO pattern is legacy infrastructure, not a reason to import MapStruct or Lombok into the starter without approval of that design.

## Failure and recovery

A foreign/unknown ID must fail the whole command without deleting the parent’s legitimate omitted children. A later validation or database failure must roll back deletions, updates and creations together. Flush success is not a committed replacement; preserve the UI draft until the command outcome is known.

If the caller's parent revision is stale, retain its proposed collection separately from refreshed server children and reconcile deliberately. A blind retry can delete a child another editor just added. Return stable IDs for accepted new children so subsequent edits update rather than duplicate them.

Avoid broad DTO-to-entity collection replacement, treating every unknown ID as new, accepting client parent IDs inside children and relying on duplicate-key exceptions for validation.

## Acceptance and implementation checklist

- The endpoint declares complete replacement versus partial collection intent.
- All incoming IDs are unique, known and currently owned before mutation.
- Existing children keep stable identity; new children receive server identity.
- Omission follows documented detach/delete/history policy.
- Parent/back-reference and dependent fields stay consistent.
- Any failed invariant/write restores the original complete graph.
- Stale replacement preserves user intent instead of deleting concurrent additions.

## Exact source references

- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/lockage/LockageService.java` — completed-parent reconciliation, explicit deletes, null-ID creates and unmatched-ID limitation.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/lockage/Lockage.java` — inverse add/remove/clear and position cleanup.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/lockage/LockageMapper.java` — DTO projection and legacy mapping ownership.
