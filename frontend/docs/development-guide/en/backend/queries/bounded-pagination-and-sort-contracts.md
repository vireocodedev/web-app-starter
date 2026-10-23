# Bounded pagination and deliberate sort contracts

**Support status: source-backed reference recipe.** Client Discovery shows strict offset/limit validation and a fixed deterministic order; FRED shows stable repository ordering. LMS's flexible pageable helper is a legacy comparison with unbounded-input risks, not a safe default to transplant. The starter does not supply a universal production list endpoint.

Use this pattern when a new list could grow beyond fixture data, a table exposes sort controls, or an export/lookup is being mistaken for ordinary paging. Define the query's work and ordering contract before connecting a generic UI paginator.

## Bound the wire values explicitly

The Discovery browse controller accepts offset and limit as strings. The service requires ASCII digit sequences, parses them as integers, and rejects invalid or overflowing values. Offset is nonnegative; the source permits limit 1–100, defaults to 25 in the controller and caps search text at 1000 characters. These are peer endpoint policies, not universal template defaults.

Strict parsing distinguishes a malformed request from a valid empty page. Silently coercing `-1`, `1.5`, whitespace or arbitrary text into a default hides client mistakes and can create surprising resource use. In a consumer, choose a documented maximum page size, search bound and sensible offset policy according to the data/query cost.

| Input                                        | Recommended contract decision                          |
| -------------------------------------------- | ------------------------------------------------------ |
| Limit absent                                 | Use the endpoint's documented default                  |
| Limit above ceiling                          | Reject or explicitly clamp; choose one and document it |
| Fractional/negative/overflowing paging value | Reject malformed input                                 |
| Valid page after the last row                | Return an empty page with coherent metadata            |
| Arbitrary sort property                      | Reject unless it maps to a known server choice         |

The inspected source rejects an excessive limit; a new endpoint should not claim it clamps merely because the frontend control has a maximum.

## SQL values and SQL structure need different protection

Bind search text, IDs, offset and limit as query parameters. A caller-provided SQL column or direction cannot be made safe by treating it like a value placeholder. Select a fixed expression through a server allowlist, then append only that trusted expression.

The following is a **recipe fragment**, not an installed query helper. The consumer must implement its request DTO, validation, authorized projection, repository method, indexes and public error mapping.

```java
String order = switch (request.sort()) {
    case UPDATED_NEWEST -> "updated_at desc, id asc";
    case NAME_ASCENDING -> "display_name asc, id asc";
};
var sql = permittedProjection
    + " select id,display_name,updated_at from visible_records"
    + " order by " + order + " offset ? limit ?";
return db.queryForList(sql, request.offset(), request.limit());
```

Only the enumerated string is structural. Do not replace it with `request.sortBy()` or a caller-owned fragment. Translate UI column identifiers into the endpoint's deliberate enum rather than exposing persistence property names as an accidental public API.

## Always define ties and nulls

Discovery orders by `updated_at desc, id asc`. Two records with the same timestamp still have a deterministic order. FRED repository methods similarly include `RequestedAtDescIdDesc` when choosing the latest session. The ID direction need not be the same in every endpoint; what matters is one documented total order that the query and any cursor both share.

Specify null handling and text collation when nullable or localized fields participate. A display label alone can collide or change; a timestamp alone commonly ties. Evaluate indexes against the permitted filters and actual ordering rather than adding an index for every UI column. Stable ordering does not freeze data across separate page requests: concurrent edits can still shift offset pages.

## Bound result size without pretending all work is bounded

`LIMIT` caps returned rows, not necessarily scanned rows, offset skipping, exact-count work or facet generation. Deep offsets can become expensive. Choose query-side keyset paging, a smaller query budget or another search design if the endpoint's growth requires it; those are implementation changes, not guarantees granted by the paginator.

LMS's legacy helper accepts an arbitrary sort property and maps negative page size to `Integer.MAX_VALUE`; an `/all` endpoint can request an unpaged collection. Those may reflect historical application assumptions, but they are not production defaults for a growing generated app. If a lookup is intentionally small and fully returned, give it an explicit ceiling and justify that invariant. Export is a separate bounded/streamed job contract, not `limit = unlimited` on the interactive list.

## Failure and recovery

When a user changes search, filter or sort, reset the page/cursor according to the frontend URL-state contract. An old offset against a smaller result set may legitimately be empty; choose whether the UI offers first-page recovery rather than silently rewriting history. Do not retry malformed paging values or unsupported sorts as transient network failures.

If a query exceeds its budget, distinguish unavailable/incomplete data from a genuinely empty collection. Reducing returned page size does not automatically fix an unbounded count or an inefficient permission join. Diagnose the owned query and response promises, not only the visual table.

## Acceptance cases to carry into an implementation

- Missing paging values use documented defaults; malformed, fractional, negative and overflowing values follow the explicit rejection policy.
- No ordinary list request can bypass its page ceiling through a special negative value.
- Sort identifiers and direction are allowlisted; all caller values are bound.
- Tied sort values return deterministic ID order, including boundary rows.
- Permission filters apply before count and paging, with no post-page unauthorized filtering.
- A valid empty final page is distinct from an unavailable query.
- Query/index review includes count, facets and deep offsets, not just returned row count.

## Exact source references

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectBrowseService.java` — strict integer bounds, search ceiling, placeholders and stable timestamp/ID order.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectBrowseController.java` — wire defaults and string paging inputs.
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/session/LivestreamSessionRepository.java` — deterministic latest-session tie-breaker.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/core/utils/RestUtils.java` — legacy arbitrary-sort and negative-size comparison.
