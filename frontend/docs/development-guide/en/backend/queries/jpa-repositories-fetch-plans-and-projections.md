# JPA repositories, fetch plans and projections

**Support status: installed foundation and test-only executable reference.**

Start with feature-local `JpaRepository<Entity, UUID>`. Use derived methods for simple scoped lookups and counts, JPQL/projections for explicit complex reads, and justified native SQL only when required. Do not add a universal BaseRepository or expose repository entities through HTTP.

## Scope first, fetch deliberately

[ContactRepository](../../../../../../backend/src/test/java/referencefixtures/contacts/ContactRepository.java) demonstrates detail EntityGraph, a to-one fetch join for a paged list and a separate non-fetch count query. Every public action constrains actor, parent and child before projection. Do not load a global page and then filter unauthorized rows in Java; items, count and search must use the same visibility predicate.

To-many collection fetch joins can multiply rows and corrupt paging; choose a projection, two-phase read or separately bounded query. Keep entity-to-response mapping inside the service boundary with OSIV false. Native queries must explicitly include scope and `deleted_at is null`; Hibernate's entity SQLRestriction does not rewrite arbitrary native SQL. A same-context cached deleted entity also requires the service active check.

## Publish a stable page

[PageResponse](../../../../../../backend/src/main/java/com/vireocode/backend/http/PageResponse.java) defensively copies `items` and exposes only `(items, page, size, totalItems)`. Never serialize Spring Page directly. Reference endpoints use zero-based page, default size 20, permitted size 1–100, nonnegative page, feature sort allowlist and UUID `id` tie-breaker. Unsupported sort/direction, negative/fractional/overflow input and excessive size fail with 400. The page value is an index, not a row offset.

Reference contacts allow displayName/code/createdAt and group lists name/createdAt, with asc/desc. Search length is bounded and SQL LIKE metacharacters escaped; values stay bound parameters. [Pagination ownership](bounded-pagination-and-sort-contracts.md) covers total order, deep-offset/count cost and indexes.

The full reference contact list has a budget of at most three SELECTs (owned group lookup, page with related group, count), independent of row count. Tests must use a full page and cold persistence state so cache or omitted count optimizations cannot conceal N+1. This bound is specific evidence, not a universal query-count rule. Read-only alone does not promise a shared snapshot; [snapshot policy](snapshot-consistent-page-metadata.md) remains explicit.

## Exact source references

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/build.gradle` — Baseline JPA/build dependency provenance; current implementation links above describe the working tree.
