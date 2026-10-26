# Keep table presentation separate from collection ownership

A table can share columns, density, labels, expansion, and row actions without owning the remote collection. Keep fetching and result-defining state with the feature. Choose client or server processing deliberately so a remote page is never presented as if it were the complete dataset.

This is a **reference presentation recipe**. CDA's `SalesTable` wraps the current `RgoDesktopTable` interface and optionally accepts controlled server state. LMS and FRED show historical server-table boundaries. Their `@rgo/front-ui` and hand-built table components are not starter APIs to import or restore. Use the current library and installed table examples when implementing a consumer.

## Trigger and ownership

Use a thin shared table when several feature pages need the same presentation policy. The table owns accessible rendering and interaction callbacks. The collection owner holds filters, page, page size, sort, selection scope, query identity, pending/error state, and remote totals. The API owner translates supported server sorting and pagination into the actual request contract.

The inspected CDA wrapper receives rows, columns, stable row identity, table label, empty content, and optional expansion. Without a server prop it configures local default pagination. With a server prop it forwards `mode: "server"`, total count, controlled state, and state-change callback. It shares localized pagination labels and display-preference density, but it does not create a query or copy remote state into another store.

The LMS table similarly receives data, pagination, filters, and callbacks from its parent. FRED's historical server table changes controlled sort fields and renders the supplied rows; it does not sort a fetched page into a complete global order. Those are transferable ownership boundaries, not endorsements of every historical markup or state convention.

## Choose processing mode explicitly

This is a **conceptual owner contract**, not a copyable current-library prop definition:

```ts
type CollectionRequest = {
  page: number;
  pageSize: number;
  sort: { field: "title" | "updatedAt"; direction: "asc" | "desc" };
  search: string;
};
type CollectionPage<Row> = {
  rows: Row[];
  totalCount: number;
};

// Owner: request -> query key -> API -> page.
// Server table: render page.rows and emit the next request state.
// Client table: receive the complete bounded collection, then process locally.
```

Client processing fits a known complete bounded collection. Server processing fits remote datasets where the backend selects and orders the page. With server pagination, sorting and filtering normally belong to the same backend result contract. Sorting only the visible page gives a false global ordering; filtering only that page can report no matches while matching records exist elsewhere.

Validate allowed sort fields at the backend and provide stable tie-breaking so repeated pages do not unpredictably shuffle equal values. A changed filter or sort often resets page to the first page; a page-size change needs a documented rule. The reference presentation wrappers do not supply all those server guarantees automatically.

## State and selection decisions

| Change                             | Collection owner                                     | Table presentation                 |
| ---------------------------------- | ---------------------------------------------------- | ---------------------------------- |
| Sort column clicked in server mode | Update supported request and query identity          | Reflect controlled sort state      |
| Filter changes                     | Reset/clamp page under policy and fetch              | Show current filter/result state   |
| Display density changes            | No new business query unless contract requires it    | Render chosen density              |
| Background refresh                 | Preserve valid rows and indicate staleness           | Keep stable row identity and focus |
| Last row on a page is removed      | Reconcile page against new total                     | Avoid an impossible current page   |
| Bulk selection spans pages         | Define explicit selected IDs or all-matches contract | Show accurate scope and counts     |

Stable business or local draft identifiers belong in row keys. Array indices break selection, expansion, and focus when sorting or refreshing. A selected row becoming inaccessible or disappearing requires reconciliation by the feature; a table wrapper cannot infer the business outcome.

## Failure and recovery

Distinguish “provide a filter,” “no matches,” initial loading, initial failure, and retained results during refresh. LMS's inspected page asks for a filter before showing results; its historical fallback also covers missing data. A new implementation should refine these states rather than copying one message for every absence.

Keep an actual failure visible and provide a retry for the current request. Do not silently render stale rows as freshly authoritative, nor blank a useful table on every refresh. Row actions must still check current capabilities and command ownership; a checked row is not authorization.

Use a table label, keyboard-operable sort and expansion controls, localized pagination, and clear selection counts. Avoid making the whole row an ambiguous click target when it also contains links, checkboxes, and expansion controls. Preserve focus by stable identity after a remote update where possible.

## Acceptance scenarios

Sort a multi-page server collection: the API receives the sort and all pages follow one ordering. Filter while on a later page: the owner applies the documented page reset. Change density: no unnecessary collection request is created. Refresh after removing a row: selection and page remain coherent. Select rows across pages: the bulk action names exactly which scope it affects. Fail a background read: retained rows are marked appropriately and the error is recoverable.

## Avoid these shortcuts

Do not build a generic table that secretly fetches every feature, mirror query results in a parallel signal, combine server paging with client-only global sort, use row indices as keys, or let density own remote state. Share presentation policies while the feature retains the collection contract.

## Sources and provenance

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/sales/components/SalesTable.tsx` — current-library presentation wrapper with optional controlled server mode.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/shift/components/ShiftTable/ShiftTable.tsx` — parent-owned pagination/filter inputs and filter prerequisite presentation.
- `FRED/FRED-front@7a78e4f624e4b51ce1cdb9334036f2fb6119f62a:src/shared/components/data-display/FredTable/components/FredServerTable/FredServerTable.tsx` — historical controlled server-sort interaction and supplied-row rendering.
