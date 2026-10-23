# Apply visibility before search, facets and counts

**Support status: source-backed reference recipe.** Client Discovery's browse service projects permitted rows and redacts protected related identity before it searches, counts, builds options or pages results. The starter has no installed generalized visibility-projection framework; a consumer must implement its own authority model, query and response contract.

Use this pattern when a user may see a record but not every related identity, or when a list offers search, dropdown filters and totals. Removing a protected field only while serializing the final DTO leaves earlier computations able to disclose it indirectly.

## Separate row authority from field visibility

In the inspected browse source, nonadministrators first qualify through project membership. A separate current-profile-access projection determines whether related identity may be shown. Thus an authorized row can remain visible while its related profile is withheld. Authorization and projection answer different questions: which rows belong in this user's collection, and which information may be used to describe or search them?

The service builds these stages:

```text
authorized rows
  -> permission-aware related-identity projection
  -> state and text filters over the projected fields
  -> selected facet predicate
  -> count and page
```

Facet options derive from the same permitted base projection, with explicitly defined filter semantics. In this source, the related-identity option list respects the state and search filters but intentionally omits the selected related-identity filter itself, so alternative choices remain available. Do not translate “same projection” into an assumption that every metadata query applies identical predicates.

## Make absence states meaningful

Discovery distinguishes related identity as WITHHELD, UNLINKED, UNAVAILABLE or LINKED. These states avoid treating “not allowed to know,” “no relation exists” and “a relation cannot currently be resolved” as interchangeable. Only a permitted linked identity contributes its related name to text matching or options.

| State       | What the UI may infer                                   |
| ----------- | ------------------------------------------------------- |
| WITHHELD    | The projection intentionally does not expose identity   |
| UNLINKED    | No related identity is linked under this contract       |
| UNAVAILABLE | The relation cannot currently supply its usable profile |
| LINKED      | The permitted identity fields and version are available |

Do not include a withheld raw ID, private name or diagnostic reason “for convenience.” Those can leak through URLs, filter values, command-palette entries or telemetry even if the table cell looks redacted.

## Worked projection recipe

Suppose users can browse authorized workspace records but only some may see the linked party label. The following is **SQL pseudocode**, not an installed migration or query. Implement membership/current-grant policy, table names, projection DTO, query binding and indexes in the consumer.

```sql
WITH authorized AS (
    SELECT r.*, permission.may_view_party
    FROM record r
    JOIN permitted_record_for_actor permission ON permission.record_id = r.id
    WHERE permission.actor_id = ?
), visible AS (
    SELECT id, title,
           CASE WHEN may_view_party THEN party_label END AS party_label
    FROM authorized
), filtered AS (
    SELECT * FROM visible
    WHERE position(lower(?) in lower(title)) > 0
       OR position(lower(?) in lower(party_label)) > 0
)
SELECT id, title, party_label
FROM filtered
ORDER BY id
LIMIT ?;
```

The important order is projection before matching. Applying a predicate to the unredacted party table and hiding the output afterward would allow a user to guess a protected label and observe matches. Counting that hidden match or offering it as a facet is the same kind of disclosure.

Every caller value in the observed browse query is bound through placeholders. Structural clauses are chosen by server policy and validated filter states, not copied from caller-owned SQL fragments. A sort direction or column requires a separate allowlist; binding a search value does not make arbitrary SQL concatenation safe.

## Keep reads read-only in meaning

The browse service is expressly a projection: it does not initialize missing lifecycle records merely to make a row easier to render. A page visit should not create an identity, membership or domain transition. If missing records are legitimate, represent their state; if repair is needed, route it through a separate authorized command.

The controller sets `Cache-Control: no-store` before it validates filters or calls the service, so failures reached through that controller share the cache policy. This is a source-specific safeguard for identity-bearing responses, not a substitute for correct cache headers on every protected endpoint or for backend authorization.

## Failure and recovery

If a permission is revoked, the next projection must use the current authority contract. Cached options, counts and row snapshots must not keep advertising the old private identity. A failed lookup should preserve UNAVAILABLE versus WITHHELD semantics rather than fabricating an empty linked name.

The dangerous anti-pattern is “fetch everything, page it, then filter unauthorized rows.” It leaks counts/facets and produces underfilled pages. Another is separate hand-written count SQL that gradually diverges from row visibility. Keep the permitted base projection shared and make deliberate facet exceptions visible in code and documentation.

## Acceptance cases to carry into an implementation

- A user who cannot see a related label gets no search hit, option or count change caused solely by that label.
- Authorized rows remain available with the documented withheld/unlinked/unavailable states.
- Rows, total and facet options share the same visibility policy; intentional facet predicate differences are explicit.
- Caller text and identifiers are bound parameters; structural choices come from server allowlists.
- Browsing does not create or repair domain state.
- Revocation removes protected information from the next response and its metadata, not just its visible cells.
- Error and cache behavior do not expose protected identity detail.

## Exact source references

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectBrowseService.java` — authorized/projected/base-filtered stages, current related visibility, bound values and option/count/page semantics.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectBrowseController.java` — no-store set before validation and service invocation.
