# Move children between aggregates as one authorized graph change

**Support status: LMS reference recipe with explicit authority and concurrency gaps.** LMS moves existing children by removing the old assignment and adding the new one within transactional operations. The starter does not install its packing model or transfer service. Source-parent authority, tenant compatibility and ordered locking need deliberate consumer implementation.

Use this pattern when an existing task, asset or reservation moves between parent collections. A transfer changes both parents and the child's owning reference; two independent update requests cannot preserve that invariant reliably.

## Identify all affected owners before mutation

The source `addConvoys` validates the target's operator scope, allowed target state and available operational status. It loads requested children, removes prior assignments through a helper, attaches them to the target and validates target placement. Failed target placement raises an exception in the transactional command.

The removal helper refuses confirmed/ongoing source parents and repairs their remaining layout. `addSmallCraft` similarly removes an old inverse relationship and attaches the child, but does not demonstrate the same comprehensive old-parent state/authority checks. The methods do not prove a general cross-tenant transfer policy or a canonical lock order for every affected row.

| Boundary               | Required consumer rule                                           |
| ---------------------- | ---------------------------------------------------------------- |
| Child                  | Known, unique, in permitted scope and still assigned as expected |
| Source parent(s)       | Current authority and transferable state                         |
| Destination            | Current authority, state, compatibility and capacity             |
| All affected parents   | One concurrency/ordering protocol                                |
| Dependent layout/state | Revalidated after transfer                                       |

A valid destination does not confer permission to remove someone else's child. Treat the source of every moved child as an authorization boundary, not merely a nullable back-reference.

## Keep both sides consistent in one command

The source entity's add/remove helpers maintain child parent pointers; some clear or set dependent position/waiting fields. A transfer therefore includes domain cleanup, not just changing a foreign key. Recompute the source's remaining derived state and the target's new state according to the consumer model.

**Pseudocode recipe:** implement the transfer graph loader, current authority on both sides, stable lock order, expected assignments/revisions, compatibility/capacity and explicit layout results. These collaborators are not starter APIs.

```java
@Transactional
public TransferView move(MoveChildren command, Authentication auth) {
    var actor = actors.current(auth);
    var graph = transfers.lockAuthorizedGraph(command, actor);
    graph.requireExpectedAssignmentsAndRevisions(command);
    graph.requireCompatibleMutableParents();
    for (var child : graph.selectedChildren()) {
        child.parent().detach(child);
        graph.destination().attach(child);
    }
    graph.requireValidSourceAndDestinationLayouts();
    audit.transferred(graph, actor.id());
    return views.transfer(graph, actor);
}
```

The graph helper must resolve all source parents, lock identities in the chosen canonical order and revalidate assignments after locking. Its name does not supply that implementation. Follow [lock order/fresh transaction retries](../data/lock-order-and-fresh-transaction-retries.md) and [transactional commands](./transactional-commands.md) rather than embedding a conflicting locking recipe here.

## Rollback includes the old assignment

Removing from the old parent and even flushing that change is not a separate committed transfer when the effective command transaction still surrounds it. If the target cannot accept the child, roll back the whole mutation so the old assignment remains. Avoid “remove first, then call destination endpoint” from the frontend.

Source `addConvoys` checks the target placement result; a consumer must also inspect every required source-repair result. Calling a layout method is not proof its unsuccessful return value was handled. Any invalid protected layout must cause the intended failure before commit.

Do not rely on ordinary entity helpers for access control or tenant checks. They maintain an object graph; current domain policy and database scope constraints enforce where that graph may connect.

## Failure and recovery

If any child is missing, foreign, duplicated or concurrently reassigned, reject the defined batch before leaving partial moves. Decide whether all-or-nothing is the business contract; a partial-success batch is a different API with explicit per-item results, not an accidental consequence of catching exceptions in the loop.

Same-parent requests and repeated moves also need policy. The peer paths can reset dependent fields during attachment, so they do not prove that repetition is a harmless no-op. Use expected source/revision or operation identity when retries could repeat meaningful work.

Publish UI changes for affected parents/children through the selected commit-aware notification policy. A stale source view should refetch after success, while a failed transfer should retain the user's intended destination without presenting a false detached item.

## Acceptance and implementation checklist

- Both source and destination are currently authorized and tenant-compatible.
- All child IDs are unique, known and assigned as expected under the lock protocol.
- Protected source/target states reject the move.
- Back-references and derived source/target state remain consistent.
- Target or source-layout failure restores every old assignment atomically.
- Same-parent/retry semantics are deliberate rather than assumed idempotent.
- Notifications and response projections reflect only the accepted graph change.

## Exact source references

- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/lockage/LockagePackingService.java` — transactional transfer, protected-source helper and checked target placement.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/lockage/LockageService.java` — small-child transfer and source-check limitations.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/lockage/Lockage.java` and `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/convoy/Convoy.java` — inverse relationships and dependent-field cleanup.
