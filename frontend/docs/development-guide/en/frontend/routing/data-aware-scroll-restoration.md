# Let the committed leaf declare scroll readiness

A router can know that navigation finished before a data-dependent page has enough height or the target heading exists. Restoring a saved position too early clamps the viewport to a short loading screen; scrolling again on every query refresh then pulls the person away from what they are reading. Coordinate entry scrolling with the committed leaf's layout readiness.

This is a **reference extension with an installed starter comparison**. The starter already has `RouteScrollRestoration` and `RouteScrollContentReady` for committed route-branch content. CDA adds a deliberate `useRouteScrollReady` leaf contract that can defer restoration until its data/layout is usable. That consumer hook and private coordination context are not installed starter APIs.

## Trigger and ownership

Use data-aware readiness when entry content is asynchronous, an anchor appears after a read, or a returning task has a validated scroll destination. The router owns navigation type, history-entry identity, saved position, and entry-scroll policy. The leaf owns whether its current location's content is ready and what should receive focus after settlement.

Readiness is not necessarily “every query is idle.” An error panel can be a ready destination. A page with retained data can be readable during background refresh. Define a small state that says the layout needed for this entry action now exists. Waiting for an unrelated polling query can leave restoration pending forever.

The CDA hook creates a stable owner symbol and claims the current location in a layout effect. Cleanup releases only that owner's claim. The router compares location/entry tokens, current claim owner, and readiness again when the scheduled animation frame executes. An old leaf cannot settle a newer route merely because its request finished late.

## Separate entry policy from later updates

This **pseudocode** describes the consumer contract; it is not a starter import:

```ts
const ready = initialReadSucceeded || initialReadFailed;

claimEntryScroll({
  ready,
  onSettled: context => {
    if (!context?.restoredPosition) {
      focusAppropriateEntryHeading();
    }
  },
});

// Background refreshes update content without replaying entry scrolling.
```

The inspected router settles an entry once. A replacement leaf, such as a retry result, can receive its own settlement callback without replaying the entry scroll. A settled callback is therefore not permission to call `scrollTo(0, 0)` again. It should choose focus behavior consistent with the router's restored-position information and the actual task.

CDA optionally accepts an explicit finite nonnegative return position for a validated non-POP entry whose default action would be top. POP retains the router's saved history position. That is a narrow override, not permission for any URL parameter to control arbitrary scroll behavior. Validate the return context in the owning flow before passing it to router coordination.

## Choose the right action

| Navigation or state                | Scroll decision                   | Leaf responsibility                                    |
| ---------------------------------- | --------------------------------- | ------------------------------------------------------ |
| New pathname without fragment      | Entry policy usually moves to top | Declare usable layout                                  |
| Known history return               | Restore saved entry position      | Avoid overriding with autofocus scroll                 |
| Fragment target appears after data | Apply fragment after readiness    | Render stable target ID and header offset              |
| Query-only presentation update     | Follow documented router policy   | Do not add unconditional top scrolling                 |
| Initial read fails                 | Error view can be ready           | Focus meaningful error/retry content where appropriate |
| Background refresh                 | Preserve reading position         | Update content without entry replay                    |
| Leaf unmounts while pending        | Release its claim                 | Ignore late layout/result effects                      |

The starter's existing policy already distinguishes pathname, fragments, query-only changes, and history positions. Extend that owner when a feature needs finer readiness; do not add a second independent scroll manager inside every page. Multiple competing effects produce timing-dependent jumps even when each looks reasonable in isolation.

## Failure and recovery

A missing fragment needs a documented fallback. The inspected base policy can use top when a cross-path fragment is absent; a same-page fragment does not justify resetting the page arbitrarily. Malformed fragment encoding should fail safely rather than throw during navigation.

A loading view that never reports failure readiness can strand the entry. A leaf that reports ready before its large body renders recreates the clamping bug. A claim tied only to pathname can confuse two history entries with different query/hash state. Use the complete location identity provided by the router boundary.

Focus can move the viewport. Do not focus a top heading after restoring a historical reading position unless that is the intended task behavior. Sticky headers need a consistent target offset, such as the application's established scroll margin, rather than page-specific magic numbers. User-triggered focus after an explicit task transition is different from unsolicited focus on every refetch.

## Acceptance scenarios

Return through browser Back to a long record whose initial content loads slowly: the saved position applies after useful layout exists and is not replaced by top autofocus. Open a deep fragment whose heading arrives with data: it reaches the heading after readiness. Fail the initial read: the error view settles and permits retry. Resolve an old route after navigation: it cannot claim the new entry. Refresh an already readable page: the viewport stays where the person left it. Retry into a replacement leaf: entry scrolling is not replayed unnecessarily.

## Avoid these shortcuts

Do not scroll on every data change, use an arbitrary timeout as readiness, restore before the body exists, let several outlets claim the same entry without ownership, or infer history identity from pathname alone. Keep one router policy and one current leaf readiness contract.

## Sources and provenance

- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/src/app/router/components/RouteScrollRestoration.tsx` — installed entry policy, branch-content readiness, fragments, and saved positions.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/router/hooks/useRouteScrollReady.ts` — committed leaf location/owner claim and cleanup.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/router/routeScrollContext.ts` — deliberate leaf options and private router coordination.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/router/components/RouteScrollRestoration.tsx` — readiness gate, one-time settlement, replacement owner notification, and POP precedence.
