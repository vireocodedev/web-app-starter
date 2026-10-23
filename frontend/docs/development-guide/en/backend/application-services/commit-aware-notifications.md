# Notify clients after commit, and state delivery limits

**Support status: source-backed reference recipe with legacy implementation limits.** LMS batches Server-Sent Events in memory and flushes them after transaction commit, with rollback and lifecycle cleanup. The starter does not install this SSE feature, a distributed event bus or a durable outbox. Commit-aware timing and durable delivery are different guarantees.

Use this pattern when a mutation should refresh other open views without showing rolled-back changes. First decide whether the notification is a best-effort invalidation hint or a business message that must survive process failure. That decision determines whether an in-memory after-commit callback is sufficient.

## Explain the observed transaction lifecycle

LMS `SseService` appends payloads to a thread-local batch and publishes a flush event once the context considers a flush scheduled. `SseBatchPublisher` listens in `AFTER_COMMIT` to flush and in `AFTER_ROLLBACK` to remove the batch context. A successful database flush alone does not trigger the same durable business fact as commit.

Its commit listener uses `fallbackExecution = true`: publication outside a transaction can execute immediately. The service also has an explicit no-active-transaction flush path. These are intentional observed behaviors to review during adaptation; do not summarize the source as “notifications are impossible without a committed transaction” or claim exactly-once dispatch from its scheduling flag.

| Boundary                    | What it establishes                                  |
| --------------------------- | ---------------------------------------------------- |
| Added to in-memory batch    | A process/thread currently holds a payload           |
| AFTER_COMMIT listener       | The associated database transaction committed        |
| Dispatch queued to executor | Work was submitted in this process                   |
| Emitter send succeeded      | The server attempted a successful stream write       |
| Client applied the update   | A separate application observation, not proven above |

The application must choose whether no-transaction publication is valid. A progress/heartbeat hint may be independent of a business transaction; an “approved” notification generally needs a committed owner action. Keep separate entry points when those meanings differ.

## A small adaptation recipe

For a record rename, an authorized invalidation hint can be safer than broadcasting its complete private DTO. The following is **recipe pseudocode**, not starter classes. Implement the event type, current-authority service, transactional record owner, recipient policy and live-update transport before adopting it.

```java
@Transactional
public void rename(UUID recordId, Rename command, Authentication auth) {
    var actor = actors.requireCurrent(auth);
    records.renameAuthorized(recordId, command, actor);
    events.publishEvent(new RecordViewChanged(recordId));
}

@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
public void afterCommit(RecordViewChanged event) {
    liveUpdates.invalidatePermittedViews(event.recordId());
}
```

This deliberately omits fallback publication. Add it only with an explicit consumer decision; the omission does not describe the LMS source's setting. The receiver refetches its ordinary authorized read model, so receiving an identifier does not replace access checks. Even the identifier itself needs recipient scoping when resource existence is private.

## Thread-local batches require complete cleanup ownership

The source holder removes its `ThreadLocal` on clear. Rollback listeners clear it; an MVC interceptor registered for the application's API paths clears it after request completion; a scheduled-method aspect also clears it after scheduled work. `flushBatch` clears pending entries and the scheduling flag. Each path exists because pooled threads can later serve unrelated work.

A consumer must cover its own asynchronous jobs, exceptions and non-HTTP entry points rather than assuming the HTTP interceptor reaches them. Plain ThreadLocal state does not automatically travel to another executor thread. Nested independent transactions on one thread also require a deliberate batching model; a thread is not universally equivalent to one transaction. Review cleanup in `finally`-equivalent lifecycle paths and separate batch ownership from dispatch ownership.

## Bound transport resources and recheck authority

LMS removes emitters on completion, timeout and error, and removes failed emitters after send exceptions. It dispatches through a cached executor and keeps active subscribers in memory. The inspected implementation does not establish a bounded sender queue or distributed subscription registry. A new consumer needs capacity, shutdown/backpressure and multi-replica decisions before claiming operational readiness.

The source stores subscriber principal information when the emitter is registered and filters recipients using that view. That is not proof of live membership revocation on every send. Define how permission changes close subscriptions or suppress later events. A long-lived connection must not keep access merely because it was authorized at opening.

## Failure and recovery

A process can crash after database commit but before dispatch; a client can disconnect after a send. The in-memory batch disappears on restart, and the inspected initial-events hook supplies no durable replay protocol. Treat events as hints and reconcile through authoritative reads on reconnect when that is the chosen contract.

If a message must survive crashes, persist delivery intent with the mutation and implement a durable worker, retries, ownership, idempotency and receipts. That outbox/operation design is additional work. Retrying an after-commit network call indefinitely does not create it and can duplicate messages without proof of receipt.

## Acceptance cases to carry into an implementation

- Rolled-back mutations produce no committed-success hint; commit is distinguished from flush.
- No-transaction publication follows an explicit policy, including any fallback behavior.
- Every request/job completion path clears batch state before thread reuse.
- Disconnection, timeout and send failure remove unusable emitters.
- Revoked recipients lose access to subsequent hints/payloads under the defined policy.
- Restart and reconnect recover through authoritative reads or a real persisted replay contract.
- Documentation calls in-memory notification best-effort and claims durability only when durable delivery is implemented.

## Exact source references

- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/sse/SseBatchPublisher.java` — commit, rollback and fallback listener semantics.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/sse/SseBatchContextHolder.java` and `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/sse/SseBatchContext.java` — thread-local context and batch flags.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/sse/SseBatchCleanupInterceptor.java` and `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/core/WebConfig.java` — request cleanup and interceptor registration.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/sse/ScheduledSseCleanupAspect.java` — scheduled-entry cleanup.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/sse/SseService.java` — batching, explicit no-transaction flush, emitter lifecycle, executor and recipient filtering limits.
