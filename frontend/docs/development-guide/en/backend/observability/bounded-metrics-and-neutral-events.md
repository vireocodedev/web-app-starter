# Emit neutral events and keep metric dimensions bounded

**Support status: Vireo observability reference profile, not installed in this RGO/Spring starter.** Vireo exposes structured operational events and optional Micrometer bridges. Adopting that module/event vocabulary requires explicit dependencies and wiring; an existing Spring application can implement an equivalent seam. No tracing vendor or meter backend is implied.

Use this pattern when adding query/replay/lifecycle telemetry. A useful event can explain outcome, count and elapsed work without recording identity, URLs, search text or payloads. Metrics dimensions must stay bounded even when private values are hashed.

## Separate categories from measurements

The pinned query event contains a bounded outcome enum, searched/filtered booleans, result count and duration nanoseconds. It validates nonnegative measurements. Offline's operational event similarly uses operation/outcome enums plus count/duration. Lifecycle events carry operation and affected/held counts, not partition or actor identity.

| Data                                     | Safe role in this contract          |
| ---------------------------------------- | ----------------------------------- |
| Fixed operation/outcome enum             | Low-cardinality tag                 |
| Searched/filtered boolean                | Low-cardinality tag                 |
| Count or elapsed nanoseconds             | Numeric measurement field           |
| Actor, tenant, entity, command ID        | Excluded from framework events/tags |
| URL, exception message, query or payload | Excluded, not a new tag             |

Hashing a tenant ID still produces one value per tenant; it does not solve cardinality or automatically anonymize telemetry. A free-form “reason” string is not a bounded dimension merely because it is short.

## Preserve the source's timing meaning

Query execution measures with `System.nanoTime` and publishes from `finally`, preserving success/denied/rejected/error categorization. The result count is the returned page's element count, not an assertion about all matching records. Relation-option observations use their own bounded result count and search-presence flag.

**Pseudocode recipe:** implement event enums/schema, publication boundary, protected diagnostics policy and an application metrics adapter. These helpers are not installed starter APIs.

```java
record ReadCompleted(ReadOutcome outcome, boolean searched,
                     long returnedCount, long elapsedNanos) {}

void record(ReadCompleted event) {
    counters.increment("records.read", "outcome", event.outcome().name());
    measurements.record("records.read.duration", event.elapsedNanos());
    measurements.record("records.read.returned", event.returnedCount());
}
```

Define duration units and adapter behavior explicitly. The sample's measurement helpers are proposed, not evidence that a framework event automatically creates all desired histograms.

## Optional registry does not install a telemetry backend

Vireo auto-configuration creates its bridge only when an `ObservationRegistry` class/bean is available. Without the bean, structured events remain available. Applications choose the registry implementation, exporter, sampling, retention and access controls; libraries do not provision those services.

The inspected bridges create low-cardinality named observations around an empty completion callback. They do **not** read `durationNanos` or result/count fields into custom histograms themselves. The emitted observation's own short callback duration must not be labelled the full query/replay latency. An application needing the original measurement must consume those structured fields deliberately.

The bridge also does not create a distributed span around the original database request retroactively. Decide correlation at the operation boundary if tracing is required, while retaining the safe event vocabulary.

## Failure and recovery

If a metric adapter is unavailable, operational behavior should follow its owned failure-isolation contract, not become a different business outcome. Lifecycle events have distinct transactional semantics; do not assume every event family is disposable telemetry. Record sink failure using bounded protected diagnostics without appending the sensitive request to “help debugging.”

When troubleshooting cardinality growth, inspect dynamically added listener tags as well as the event type. A neutral event enriched with actor IDs downstream defeats its design. A missing measurement should remain missing/unknown, not be replaced with a fabricated zero-latency success.

Avoid entity-specific observation names, request paths with IDs, search strings in tags and exception-message labels. Counts are measurements; making `count=12345` a label creates a new time series for each value.

## Adaptation checklist

- Event schema has fixed enum/boolean dimensions and bounded measurement semantics.
- Sensitive identities/payloads stay out of publishers and listener enrichment.
- Returned count versus total and original duration versus bridge callback duration are distinguished.
- Registry/exporter activation, retention and access remain application-owned.
- Required histograms consume structured measurements explicitly.
- Failure handling matches each event family's operation/transaction contract.
- No backend, distributed tracing or installation claim is inferred from a reference bridge.

## Exact source references

- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-core/src/main/java/com/vireocode/vireo/observability/QueryExecutionObservationEvent.java` — neutral query fields and measurement validation.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-offline/src/main/java/com/vireocode/vireo/offline/OfflineObservationEvent.java` — bounded operation/outcome families.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-history/src/main/java/com/vireocode/vireo/history/HistoryDataLifecycleEvent.java` — operation and aggregate lifecycle counts.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-core/src/main/java/com/vireocode/vireo/base/CrudLifecycleSupport.java` — measured query completion and returned-page count.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-core/src/main/java/com/vireocode/vireo/config/CoreMicrometerObservations.java` — bridge tags and empty callback, not event-duration histogram.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-core/src/main/java/com/vireocode/vireo/config/StarterCoreAutoConfiguration.java` — conditional registry activation.
