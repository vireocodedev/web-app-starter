# Distinguish a missing filter from an empty result

A table that has not run its query does not contain zero matching records. It has no result yet. Model the prerequisite, initial request, retained refresh, successful emptiness, failure, and denial separately so each message tells the truth and offers the right next action.

This is a **reference refinement** of historical LMS table behavior. The inspected `ShiftTable` requires at least one active filter before rendering results and tells the person to adjust filters otherwise. Its fallback also covers missing data, so it does not demonstrate a complete result-state machine. A new implementation should make those meanings explicit rather than copy one fallback for every absence.

## Trigger and owner

Use prerequisite-aware state when an unbounded query would be expensive, the task requires a workspace/date selection, or a backend requires a filter. The collection owner defines the prerequisite and request identity. The table renders the current state. The server still enforces limits and authorization; a disabled client query does not protect the endpoint.

Keep entered filter values separate from the normalized committed request when the UI has an Apply action. Decide whether changing a filter immediately fetches or waits for submission. A prerequisite warning should identify exactly what is missing, not imply that no business records exist.

## Represent the actual result

This is **conceptual pseudocode**, not an installed query API:

```ts
type ResultState<Row> =
  | { kind: "filter-required" }
  | { kind: "loading" }
  | { kind: "ready"; rows: Row[]; refreshing: boolean }
  | { kind: "failed"; retainedRows?: Row[] }
  | { kind: "denied" };

// ready + rows.length === 0 means a successful empty result.
// filter-required says nothing about collection size.
```

Retained rows must correspond to a known request and owner. If filters change, do not silently label the previous filter's rows as the new result. Either keep them with an explicit pending/previous-results indication or show a new initial loading state according to the feature's policy.

| State                         | Useful message/action                          |
| ----------------------------- | ---------------------------------------------- |
| Prerequisite missing          | Name the required filter and focus its control |
| First request pending         | Show loading without claiming emptiness        |
| Successful zero matches       | Explain no matches and offer filter adjustment |
| Existing result refreshing    | Retain compatible rows and indicate refresh    |
| Read fails with retained rows | Mark them stale and offer retry                |
| Access denied                 | Apply authority policy, not “no matches”       |

## Failure and recovery

A timeout and a 403 need different treatment. Do not erase an authorized useful result on every transient refresh failure, and do not preserve restricted rows after revocation merely because stale data is convenient. Query-key scope and private-cache policy remain separate owners of those decisions.

When a mutation removes the final row, confirm whether it means no matches on this page or no records in the full filtered collection. Reconcile pagination before presenting a global empty state. Likewise, a missing prerequisite must not reset the user's valid filter inputs unnecessarily.

## Acceptance scenarios

Open the page without its required filter: no “zero records” claim appears. Apply a valid filter with no matches: show successful emptiness. Fail the first read: show retry. Fail background refresh: retained permitted data is clearly stale. Change the filter while a slow request is pending: the old result cannot masquerade as the new one. Revoke access: the page switches to denial and clears restricted data.

Localize each state independently. Make the prerequisite action keyboard accessible, keep filter labels associated with controls, and avoid shifting focus on every background state change. Screen-reader announcements should describe meaningful changes without repeatedly reading the whole table.

## Avoid these shortcuts

Do not use `null` for every state, show emptiness before an enabled query completes, hide failures behind filter hints, or render prior-filter data as a fresh response. Small explicit state distinctions prevent misleading workflow decisions.

## Sources and provenance

- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/shift/components/ShiftTable/ShiftTable.tsx` — active-filter prerequisite, parent-provided result, and historical combined fallback limitation.
