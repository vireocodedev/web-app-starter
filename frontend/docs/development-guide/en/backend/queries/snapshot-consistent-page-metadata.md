# One snapshot for page rows and metadata

**Support status: source-backed reference recipe.** Client Discovery's browse method explicitly combines a read-only transaction with PostgreSQL REPEATABLE READ so count, options, page and related permission projections use one transaction snapshot. The starter does not install this isolation policy on all reads or provide a general snapshot-response helper.

Use this pattern when a response promises a coherent total, facet options and page rows even while other users edit records. A read-only annotation describes intended access; by itself it does not guarantee that several SQL statements observe the same committed state.

## State the consistency promise precisely

Under PostgreSQL's usual READ COMMITTED behavior, separate statements can observe different committed states. A count can finish, another transaction can insert or archive a row, and the following page query can see the new state. Each statement may be individually correct while the assembled response contradicts itself.

Discovery's browse service chooses `@Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)`. It then runs count, option and row queries from the same permission-aware base projection, with related deletion-eligibility reads inside the same method. The source explicitly promises the same PostgreSQL transaction snapshot and timestamp for those statements.

| Guarantee                           | What it means                                                |
| ----------------------------------- | ------------------------------------------------------------ |
| One response snapshot               | Related database reads describe one consistent visible state |
| Read-only intent                    | The method is not a place for business mutations             |
| Stable ordering                     | Tied rows have an explicit secondary identity order          |
| Snapshot across later page requests | A separate contract; not supplied by this annotation         |

These guarantees complement rather than replace each other. A fixed snapshot does not correct missing authorization, an unstable sort or an unbounded exact-count query.

## Keep the complete response inside the boundary

The browse count also selects `current_timestamp` and returns it as `checkedAt`. This is database transaction time, not a claim that the response is fresh until its browser render or that every external system was checked. Its `coverage: COMPLETE` applies to the response's bounded, permitted browse projection; it does not certify unrelated operational domains.

**Recipe pseudocode:** `visible`, `metadata`, `rows` and `PageView` are consumer-owned collaborators, not starter imports. Implement their scoped query model, DTOs, parameter binding and index/timeout policy before adapting this shape.

```java
@Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
public PageView browse(BrowseRequest request, Authentication auth) {
    var projection = visible.forCurrentActor(auth, request);
    var summary = metadata.countAndCheckedAt(projection);
    var options = metadata.options(projection.withoutItsOwnFacetSelection());
    var page = rows.page(projection, request.offset(), request.limit());
    return new PageView(page, options, summary.total(), summary.checkedAt());
}
```

The facet exception is deliberate: a dropdown can omit its own current selection while retaining the same visibility/search/state rules. A single snapshot does not require identical predicates, but every difference must be part of the public contract rather than accidental count drift.

The boundary must actually be entered through Spring interception or a configured transaction template. A self-invoked annotation does not create an independent snapshot. A method joining an existing transaction can inherit that transaction's isolation; do not assume an inner annotation automatically upgrades it. Review the caller/transaction-manager contract when composing this read into another service.

## Separate database consistency from distributed freshness

Calling an external provider between count and rows cannot make the provider share PostgreSQL's snapshot. An aggregator that opens a separate REPEATABLE READ transaction per contributor has internally consistent contributor reads, not one global snapshot across all contributors. Report separate coverage/freshness when that is the design.

Likewise, two HTTP page requests normally use two transactions. A stable offset order can still shift after an intervening insert; a signed cursor may detect a changed projection or seek by a stable key, but those are additional protocols. Do not describe a response timestamp as a reusable snapshot token unless retained snapshot semantics are actually implemented.

Keep the read transaction short. Large scans, long application loops or network waits hold snapshot resources longer and can complicate database maintenance. Choose bounded response work and query design first; REPEATABLE READ is not a performance fix. A service that must mutate state while rendering a list needs a separate command rather than hiding writes under a read-only declaration.

## Failure and recovery

If any mandatory metadata query fails, do not combine successful rows from an earlier attempt with a count from a later retry. Retry the complete read under a fresh boundary according to the consumer's bounded policy, or return the documented unavailable response. For an explicitly partial contract, mark the missing piece rather than labelling it complete.

A count/row mismatch should trigger inspection of transaction entry, data source/connection ownership, visibility predicates and intentional facet differences. Increasing isolation globally or caching a previous total is not a targeted repair. An empty page remains a legitimate result only when its metadata is from the same defined contract.

## Acceptance cases to carry into an implementation

- A concurrent insert/archive between statements cannot make one response's count and page describe different snapshots.
- Facets share the permitted projection, with documented differences for their own selected filter.
- `checkedAt` is tied to its chosen database/time owner and is not advertised as external-system freshness.
- A nested caller cannot silently invalidate the intended isolation contract.
- Later HTTP pages are documented as new reads unless a separate retained-snapshot mechanism exists.
- A failed component is retried as part of a coherent read or reported incomplete/unavailable.
- Read boundaries remain bounded and do not perform hidden domain writes or external I/O.

## Exact source references

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectBrowseService.java` — explicit read-only REPEATABLE READ, shared projection, count timestamp, rows/options and coverage.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/AttentionService.java` — contrasting per-contributor independent read transactions rather than one global snapshot.
