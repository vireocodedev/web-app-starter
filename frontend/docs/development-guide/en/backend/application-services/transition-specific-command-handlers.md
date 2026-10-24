# Give each state transition a deliberate command handler

**Support status: LMS reference recipe, not an installed starter state-machine API.** LMS separates lifecycle entry points from confirmation, start, end and cancellation handlers. Its domain types, authority rules, outbound transport and mapper infrastructure require deliberate consumer implementation. Reuse the separation of responsibilities rather than copying its operational assumptions.

Use this pattern when a generic update endpoint allows callers to assign any status, or one service method accumulates unrelated confirm/start/cancel branches. A transition is a business action with its own prerequisites and effects; writing a new enum value is only part of that action.

## A lifecycle facade coordinates named actions

`LockageLifecycleService` exposes named transactional methods and delegates to focused collaborators such as `LockageConfirmer`. This gives callers a discoverable operation vocabulary while keeping confirmation prerequisites separate from starting or cancellation. It is not a requirement to create a class for every one-line assignment; split when the transition owns meaningful policy or collaborators.

The inspected confirmer checks operator authority for the aggregate's scope, already-confirmed state, current operational status when available, child registration completeness and eligible preceding work. Unconfirmation has a separate confirmed-only precondition and returns the aggregate to the peer's fixed state.

| Command               | Consumer must specify                                   |
| --------------------- | ------------------------------------------------------- |
| Confirm               | Allowed source states, authority and readiness evidence |
| Withdraw confirmation | Whether work has become irreversible/protected          |
| Start                 | Resource ownership, time and predecessor constraints    |
| Complete/cancel       | Required evidence, accounting and dependent effects     |

Do not describe the source as a complete reusable transition matrix. Confirmation explicitly rejects already-confirmed state but does not enumerate every valid source status. Unconfirmation's later ongoing check follows its confirmed-only check and is not independent proof of a broader matrix. A consumer should define allowed-from states exhaustively.

## Keep the command's decision visible

**Pseudocode recipe:** implement current actor policy, scoped/locked repository, explicit transition rules, required child checks, audit and public errors. The helpers below are not starter imports.

```java
@Transactional
public OperationView confirm(UUID id, ConfirmOperation command, Authentication auth) {
    var actor = actors.requireCurrent(auth);
    var operation = operations.lockAuthorized(id, actor);
    revisions.requireExpected(operation.revision(), command.expectedRevision());
    transitions.requireCanConfirm(operation.state());
    prerequisites.requireReady(operation, actor);
    operation.confirm(clock.instant(), actor.id());
    audit.confirmed(operation.id(), actor.id());
    return views.operation(operation, actor);
}
```

The revision and lock are consumer design, not claims that the LMS confirmer implements them. Use [transactional commands](./transactional-commands.md) for the complete mutation boundary and [revision conflicts/shared locks](../data/revision-conflicts-and-shared-locks.md) for concurrent decisions. State transition semantics should stay readable rather than repeating their full infrastructure recipes here.

A repeated command also needs a policy: return the same result, reject already-applied work, or reconcile an uncertain operation. The peer rejects an already-confirmed request; it does not establish universal idempotence for every lifecycle action.

## Separate local transition success from outbound delivery

The source flushes confirmation and publishes a UI change, then attempts outbound protocol work inside the transaction and catches `Throwable`. That is a legacy best-effort behavior and a limitation: remote effects cannot be rolled back with the database, a swallowed transport failure is not a delivery receipt, and broad fatal-error catching is not recommended consumer policy. The inspected transport path is also selectively gated; it does not prove general production delivery.

If outbound effect is required, persist intent and use [claim/call/reconcile](../integrations/claim-call-reconcile.md). If only a UI hint is needed, use [commit-aware notifications](./commit-aware-notifications.md) and state its delivery limits. A handler returning a DTO proves neither commit nor external acceptance by itself.

## Failure and recovery

An unmet prerequisite must leave the aggregate unchanged. If confirmation commits but notification fails, distinguish local confirmed state from pending/unavailable delivery; do not ask the user to re-confirm blindly. If withdrawal is forbidden after a downstream commitment, expose a separate corrective workflow rather than forcing the enum backward.

Keep incoming command DTOs narrow: clients should not supply server confirmation time, actor or arbitrary status. Preserve user context on revision conflict and report which action is unavailable through safe reason codes. Avoid a generic “set status” bypass that skips the focused handlers.

## Acceptance and implementation checklist

- Every action has explicit allowed source states and current authority.
- Required child/predecessor/resource evidence is checked before mutation.
- Confirm and withdraw have independently documented prerequisites and repeat semantics.
- Failed checks/mandatory writes leave no partial local transition.
- Concurrency follows the consumer's revision/lock protocol.
- External uncertainty is separate from local transition state and has a recovery owner.
- Broad catch/best-effort source behavior is not presented as durable delivery.

## Exact source references

- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/lockage/LockageLifecycleService.java` — named transactional lifecycle delegation.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/lockage/LockageConfirmer.java` — different confirmation/withdrawal checks and best-effort outbound limitations.
