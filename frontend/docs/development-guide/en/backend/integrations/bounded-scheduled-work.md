# Keep scheduled work bounded and ownership explicit

**Support status: source-backed consumer recipe with observed limitations.** FRED and LMS show timer-driven maintenance and per-resource work; Client Discovery shows a bounded claim-based provider poll. None supplies a universal starter scheduler or proves that every peer job is bounded or safe across replicas.

Use this pattern for expiry, reconciliation, polling or cleanup. A timer decides when to ask for work. The domain owner decides which work is valid, which transaction protects it, and how repeated or concurrent execution avoids duplicate effects.

## Separate trigger cadence from business time

FRED's finalizer checks active records every two seconds and compares the last telemetry event time with a configured inactivity timeout. When it ends a lifecycle, it uses that last event time rather than the later polling time. Otherwise scheduler delay would inflate the recorded duration of activity.

LMS's status loop has a five-second `fixedRate` annotation despite an adjacent ten-second comment. A configurable interval further gates its body. Teach the actual code, not the stale comment. Its enabled setting controls external status integration, while some lifecycle maintenance still runs when that integration is disabled; “disabled” is not evidence that every maintenance action stops.

| Time                   | Meaning                               |
| ---------------------- | ------------------------------------- |
| Trigger time           | The scheduler woke up                 |
| Due/deadline time      | The domain says work may be needed    |
| Observed event time    | The external fact actually occurred   |
| Processing/commit time | The application recorded its decision |

Keep these distinct in state and diagnostics. A delayed tick is not permission to invent a newer event time.

## Bound selection and isolate item transactions

LMS executes relevant maintenance in transaction-template boundaries per resource and skips resources with planning in progress. This demonstrates a domain-aware exclusion and small transaction seam. Its source still iterates `findAll`; FRED similarly loads the active collection. Neither loop proves a database-bounded batch for a growing consumer.

Client Discovery's provider worker offers a contrasting bounded poll: it attempts one due operation, alternates owner classes and uses the operation service's durable claim protocol. A process-local `AtomicBoolean` avoids overlap in that instance; database claim checks carry a different responsibility. The worker first checks configured capability, so the unconfigured adapter does not dispatch.

**Pseudocode recipe:** implement due-ID selection with stable order/ceiling, current policy, budget/cancellation, per-item transactional service, durable claim/idempotency and safe failure reporting. The helper names are not starter APIs.

```java
public void poll() {
    if (!policy.enabled()) return;
    var due = repository.nextDueIds(policy.batchLimit());
    for (var id : due) {
        budget.checkCancellation();
        if (budget.exhausted()) break;
        items.processInOwnTransaction(id);
    }
}
```

`items` must be a real intercepted service or explicit transaction template. Calling an annotated private helper on the same object does not create a new per-item transaction. Recheck current state inside the transaction: selection can become stale before the item is processed.

## Scheduling is not distributed ownership

An in-memory running flag, last-execution timestamp or sent-notification map belongs to one process and resets on restart. A second replica can run the same timer independently. If duplicate work matters, choose a database claim/lease, lock, unique operation identity or another reviewed coordination mechanism and make the action idempotent.

The FRED/LMS sources do not demonstrate distributed leader election for their loops. A consumer must not assume a single active worker just because local development runs one application. Nor does serial execution inside one loop guarantee that an HTTP command cannot mutate the same resource concurrently; they need a shared domain lock/transition protocol.

## Capacity and shutdown belong to the design

LMS's separate retry executor has finite queue capacity, a maximum pool and `CallerRunsPolicy`. Its numeric thread/queue values are historical peer policy, not starter recommendations. Caller-runs applies pressure to the submitting thread, which may delay a scheduler or HTTP request; review that tradeoff explicitly.

The executor also waits a configured interval on shutdown. Its comment about forcibly killing threads is not a guarantee established by setting await-termination seconds. Cooperative cancellation, interrupt handling and cleanup still need implementation. A bounded queue limits one resource, not payload size, external request time or database lock duration.

## Failure and recovery

A failed item should not mark the entire selected batch completed or erase the evidence needed to retry. Decide whether other items continue, where failure/next-attempt state is retained and how a poison item avoids starving later work. Crash recovery should select due durable state again rather than depend on a memory “already sent” map.

For external effects, use claim/call/reconcile with transport outside database transactions. For pure maintenance, keep the invariant and any audit in the item's transaction. Avoid one giant transaction for an unbounded scan, timers that execute commands without current policy, and retry loops that spin on an unchanged permanently invalid item.

## Acceptance cases for a consumer

- Selection, per-item work and total tick budget have explicit bounds and stable ordering.
- Event time and processing time remain distinct when the scheduler is delayed.
- Disabled integration and still-required maintenance have documented separate semantics.
- Concurrent HTTP work, overlapping ticks and multiple replicas follow the same ownership protocol.
- One failed item has an explicit recovery policy without silently completing unrelated work.
- Restart recovers from durable due/claim state; memory flags are only local optimizations.
- Queue, external timeout, cancellation and shutdown claims match actual implementation.

## Exact source references

- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/app/flight/DroneFlightFinalizer.java` — timer versus last-event end time; active-list iteration limit.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/doris/DorisChamberStateService.java` — actual cadence, enabled/interval policy, planning exclusion and per-resource transactions.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/core/AsyncRetryConfig.java` — bounded queue, caller-runs and shutdown configuration, not forced termination proof.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BillingProviderWorker.java` — one-operation poll, owner alternation and local overlap guard.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BillingProviderOperations.java` — durable due selection and claim/reconciliation boundary.
