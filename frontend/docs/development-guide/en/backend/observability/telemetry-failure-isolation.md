# Keep operational telemetry failure outside the business result

**Support status: Vireo framework reference recipe, not installed observability behavior here.** Selected Vireo query, relation-option, replay/queue and SSE publishers isolate synchronous listener runtime failures. Lifecycle publishers retain a different transactional contract. Adopting either requires explicit source-owner and dependency work in this RGO/Spring application.

Use this pattern when a logging/metrics/export listener might fail during an otherwise valid query or mutation. An unavailable optional telemetry sink should not turn an applied action into a client-visible failure that invites duplicate work. Mandatory audit and lifecycle decisions are separate concerns.

## Read the failure boundary narrowly

The core query path measures and classifies the operation, rethrows its original denied/rejected/error exception and publishes the neutral completion event in `finally`. Its publisher catches `RuntimeException` from synchronous event publication. Relation-option and Offline operational/SSE paths use corresponding catches.

This protects the result from the handled listener exception. It is not a catch of every JVM failure, a timeout for a blocking listener, or an asynchronous delivery guarantee. A slow synchronous exporter can still add latency. An asynchronous listener's later failure belongs to its executor/handler, not the caller's publication catch.

| Failure                                            | Intended owner                            |
| -------------------------------------------------- | ----------------------------------------- |
| Domain authorization/validation                    | Original operation; preserve its response |
| Optional synchronous metric listener runtime error | Isolated publisher/adapter diagnostics    |
| Blocking or unbounded telemetry I/O                | Adapter timeout/queue design              |
| Async sink failure                                 | Executor/retry/drop policy                |
| Mandatory transactional audit/lifecycle failure    | Explicit business/transaction policy      |

Do not place business commands or required audit writes in a listener that the publisher intentionally treats as optional.

## Preserve original outcome in `finally`

**Pseudocode recipe:** implement bounded neutral events, publication and safe protected diagnostics. This is not a helper installed in the starter.

```java
var outcome = ReadOutcome.ERROR;
long started = System.nanoTime();
try {
    var result = reads.execute(command);
    outcome = ReadOutcome.SUCCESS;
    return result;
} finally {
    try {
        telemetry.publish(new ReadCompleted(outcome, System.nanoTime() - started));
    } catch (RuntimeException sinkFailure) {
        diagnostics.optionalSinkUnavailable();
    }
}
```

The real source has more specific denied/rejected categories; the sample shows isolation only. If event construction itself can fail, keep that construction inside the chosen isolation boundary too. Avoid replacing a domain exception with a new telemetry exception or logging the whole request in the catch.

For strict transaction independence, review listeners as well as the publisher. Catching an exception cannot reverse listener side effects or clear a transaction already marked rollback-only by participating transactional work. The inspected catch is not proof against every possible custom listener implementation. Optional telemetry should avoid joining business writes and should use deliberately bounded delivery mechanics.

## Lifecycle events are not covered by a blanket rule

History/Offline lifecycle services publish directly while performing store, purge, erasure, holds or quota rejection. They do not use the same operational catch wrapper. A synchronous exception can therefore propagate according to Spring's transaction/listener configuration. An event can also be emitted before the transaction subsequently rolls back.

Choose whether a consumer's lifecycle event is mandatory audit, a transactional integration event or optional metrics. If it is only metrics, implement a safe adapter without weakening the actual retention/hold decision. If it is mandatory evidence, its failure/recovery semantics must be explicit rather than hidden by a universal swallow-all publisher.

The pinned Micrometer bridge itself does not install a backend/exporter or provide queue bounds. An application-supplied registry/handler can introduce blocking or failures; adding its bean is a behavior change requiring review, not a purely visual dashboard setting.

## Failure and recovery

When optional telemetry is lost, retain the authoritative operation outcome. Report bounded sink health separately; do not repeat the original command just to recreate a missing metric. Define drop/retry/backpressure without sensitive IDs as labels or durable copies of private payloads.

When the original operation fails, preserve that exact failure even if publication also fails. When transactional lifecycle evidence fails, use its documented rollback/retry policy. These cases need different acceptance evidence; a successful metric callback is not a committed business receipt.

## Adaptation checklist

- Identify optional versus mandatory event families before adding listeners.
- Preserve original success/error and catch only the intended sink failure boundary.
- Bound telemetry latency, queues and retry independently.
- Keep optional listeners out of business transaction side effects.
- Treat asynchronous failures through their own lifecycle.
- Describe direct lifecycle publication/rollback semantics accurately.
- Missing telemetry remains missing; commands are not retried solely to reconstruct it.

## Exact source references

- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-core/src/main/java/com/vireocode/vireo/base/CrudLifecycleSupport.java` — finally publication and runtime listener isolation.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-query/src/main/java/com/vireocode/vireo/queryengine/QueryEngineRelationOptionService.java` — relation-option outcome and guarded publisher.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-offline/src/main/java/com/vireocode/vireo/offline/OfflineSyncService.java` and `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-offline/src/main/java/com/vireocode/vireo/offline/OfflineHeartbeatService.java` — operational replay/queue/SSE isolation.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-history/src/main/java/com/vireocode/vireo/history/HistoryDataLifecycleService.java` — contrasting direct transactional lifecycle events.
