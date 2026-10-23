# Stable lock order and retries in a fresh transaction

**Support status: source-backed reference recipe.** FRED uses a deterministic resource lock order and explicit `TransactionTemplate` boundaries to recover from insertion races. LMS's retry annotation is a legacy comparison, not a starter dependency or a recommended default retry count. The starter supplies no universal retry coordinator.

Use this pattern when one command locks several existing resources or two requests can attempt the same unique insert. Ordering lowers avoidable deadlock risk; database constraints settle races; a fresh transaction provides a usable state after an aborted attempt. None of these makes an arbitrary command safe to repeat.

## Define order in terms of the actual locked identity

FRED's registration service sorts recent resource serials by canonical database identity and then by serial before processing them. The source explicitly accounts for configured aliases. Sorting only the user-supplied alias could produce different orders for the same underlying resources, defeating the intended protocol.

For a consumer that transfers capacity between two collections, both directions must acquire collections in the same canonical ID order, irrespective of source/target role. Deduplicate identities before locking when aliases can resolve to one row. Include other commands—deletion, batch edits, maintenance—in the protocol; a single correctly ordered endpoint cannot constrain a competing writer that uses another order.

```text
Recipe lock protocol:
  resolve and authorize the current actor
  resolve caller references to canonical resource identities
  sort and deduplicate the identities using one defined comparator
  acquire the shared domain lock first, if the invariant requires one
  lock resources in canonical order
  revalidate protected state and apply the command
```

This is a design recipe, not the exact ordering of every FRED or Discovery command. Explicitly review authorization and lock placement for the domain. Discovery's finance mutex, for example, documents administrator authority before its global mutex and resource locks afterward. Stable ordering reduces one deadlock cause; it does not guarantee a database can never abort a transaction.

## Let uniqueness settle the insertion race

In FRED, different resource locks can still collide on a shared request ID. Its session entity declares request ID unique, and preparation catches an integrity violation only after the first transaction execution unwinds. A second transaction looks up the existing request and verifies resource, controller and operator ownership. A reused ID belonging elsewhere is a conflict, not proof of idempotent success.

The registration service similarly retries one complete operation in a new template execution after `DataIntegrityViolationException`. That broad exception catch is what the source does; it is not evidence that every integrity failure is transient. A new consumer should identify the expected constraint/race and propagate unrelated not-null, foreign-key or domain errors instead of repeatedly hammering invalid data.

The database must actually enforce the selected uniqueness rule in the consumer's Flyway schema. An entity annotation or preflight `exists` query alone is not a portable deployment guarantee, especially in a starter that uses Hibernate validation rather than schema generation.

## End the failed transaction before recovering

A database error can leave the transaction aborted or rollback-only. Catching it inside the transaction and querying the competing insert from that same context is unsafe. With Spring interception, even a seemingly successful method return can later produce rollback failure because an inner failure already marked the transaction.

**Pseudocode recipe:** `attempts` below is a deliberately configured `TransactionTemplate` using `REQUIRES_NEW`. `commands`, `conflicts` and `recovery` are consumer-owned collaborators, not starter APIs. Configure the transaction manager and implement request ownership/idempotency before adapting this shape.

```java
public Result submit(Command command) {
    try {
        return attempts.execute(status -> commands.createOrLoad(command));
    } catch (DataIntegrityViolationException failure) {
        if (!conflicts.isExpectedIdentityRace(failure)) throw failure;
        return attempts.execute(status -> recovery.loadAndVerifyOwner(command));
    }
}
```

The catch is outside `execute`, so rollback completes before recovery begins. `REQUIRES_NEW` is explicit in the FRED source; self-calling an annotated helper is not an equivalent proxy boundary. An outer transaction, if present, is suspended rather than magically cleared and can retain locks. Prefer an explicit orchestration contract and review pool/lock interactions before nesting independent transactions.

## Bound retry and side effects together

The observed FRED recovery performs one second attempt; the session path also switches to existing-only resolution rather than issuing a second new identity. LMS's `OptimisticLockRetry` instead names up to ten attempts with 200 ms backoff for optimistic locking failures. Its values belong to that older project's policy and dependencies. They are not universal settings to copy onto every mutation.

Before enabling retry, state which database conflicts qualify, maximum attempts or deadline, whether authority/state is reloaded, and why repeated execution cannot duplicate an external effect. A retry around email, provider submission or an audit write committed in an independent transaction needs additional idempotency design. Authentication failures, permission denials and stale user revisions are not transport hiccups to retry silently.

## Failure, recovery and acceptance

When the bounded recovery cannot find an existing operation with the correct owner, return the documented conflict. Preserve the original request identity and diagnostic cause without leaking private data. Do not generate a new identity merely to escape a uniqueness failure; that can turn one intended action into two.

Acceptance cases for a consumer:

- Opposite-direction batch operations acquire the same canonical resource order, including aliases.
- Concurrent inserts yield one durable identity and a verified existing-result response or explicit conflict.
- Recovery runs after the first transaction has ended; rollback-only state does not leak into its reads.
- Reusing a request ID for another actor/resource never returns someone else's result.
- Unrelated constraint violations and nonretryable domain errors are surfaced immediately.
- The attempt budget is explicit, and repeated attempts cannot duplicate an irreversible effect.

## Exact source references

- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/registration/PilotRegistrationService.java` — canonical identity sort and fresh transaction retry.
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/session/LivestreamSessionService.java` — prepare, integrity-race recovery and existing-only owner checks.
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/session/LivestreamSession.java` — unique request identity declaration.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectFinanceLock.java` — documented global/resource order.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/core/OptimisticLockRetry.java` — legacy optimistic retry/backoff policy.
