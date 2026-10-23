# Distinguish owned reads from shared query subscriptions

An editor can own a replaceable read without owning every subscriber to the same remote record. Make that distinction before adding abort controllers or query cancellation. It prevents one closing dialog from interrupting a header, another panel, or a retained route that still needs the shared result.

This is a **reference consumer pattern**. client-discovery-app provides `useOwnedRead` for editor-started operations and separately lets TanStack Query own shared reads. That helper is not an installed starter API. Apply the ownership rule through the current HTTP and query boundaries instead of copying consumer imports.

## Trigger and lifetime

Use an owned read when one feature interaction starts a request whose result only makes sense for that interaction: replacing an async lookup after changing its parent choice, loading a one-off preview, or resolving a selection before a local transition. The owner can supersede its own previous request and cancel it on unmount or authority change.

Use a shared query when multiple observers intentionally refer to the same cache identity. A mounted editor is one observer, not the sole owner of that request. Shared query keys must contain the inputs that define the result, including viewer or workspace identity when relevant. Passing those inputs only in an HTTP header does not isolate cached data.

The inspected `useOwnedRead` stores one active controller. Each new call aborts the preceding controller, creates a replacement, passes its signal into the supplied reader, and checks the signal after the promise resolves. Its layout-effect cleanup aborts the active request when the authority value changes or the owner unmounts. It translates errors to `AbortError` only when that owned controller is actually aborted; otherwise it rethrows the original failure.

## Carry cancellation through the boundary

A conceptual owned reader can expose this contract:

```ts
// Pseudocode: readCurrent and recordsApi are feature-owned, not starter imports.
const choice = await readCurrent(signal => recordsApi.findChoices({ parentId, signal }));
// readCurrent rejects if this call was superseded, even if transport ignored abort.
applyChoices(choice);
```

Checking only before the request is insufficient. A transport may finish while cancellation is racing, or an adapter may not stop its underlying work. The post-await check prevents the obsolete result from reaching local state. That check does not undo server work and should not be used to justify abort-based write recovery.

Propagate the signal through each adapter that supports cancellation. Document any boundary that cannot honor it, and retain the result guard there. Avoid inventing an options signature for an existing API: inspect the real request function and add a deliberate parameter where its owner can support one.

The reference specification editor follows a different rule for its query: other workspace and header observers can retain the read across editor unmount or effect replay, so the query function uses Query's signal. It does not globally cancel that query merely because the editor closes. Observed authority loss is handled separately, including invalidation of the affected owner and removal of scoped private entries where required.

## Decide what may be canceled

| Event                                               | Owned one-off read                       | Shared query                               |
| --------------------------------------------------- | ---------------------------------------- | ------------------------------------------ |
| User changes the parent lookup                      | Abort previous call and replace it       | Change the result-defining query key       |
| One editor unmounts                                 | Abort its active request                 | Let Query manage observer/request lifetime |
| Another panel still uses the record                 | No effect on that panel                  | Preserve its valid subscription            |
| Viewer loses authority                              | Abort owned work and reject late results | Coordinate scoped private-cache cleanup    |
| Server returns a real validation or transport error | Preserve error identity                  | Expose the query's error state             |

Not all query cancellation is wrong. A feature may intentionally cancel an exact owned key before an optimistic cache update or remove inaccessible private data after revocation. The reason and scope must come from that feature's lifecycle, rather than a generic “cancel everything on cleanup” effect.

## Failure and recovery

Treat a superseded read as obsolete work, normally without an error toast. Treat an actual failed current read as an actionable failure. A broad `catch` returning an empty collection collapses cancellation, denied access, missing data, and an outage into a misleading success state.

If an old lookup returns after a new one, leave the new selection untouched. If the current lookup fails, preserve compatible typed input where safe and offer a named retry. If the viewer or record owner changes, clear owner-specific results before a late completion can expose them. Query cancellation alone does not supply that authority check.

Keep the pending state local to the relevant operation. An independently refreshing header should not make an unrelated lookup appear to be loading, and canceling the lookup should not clear the header's fetched data.

## Acceptance scenarios

Start a slow lookup for parent A, switch to B, and resolve A last: only B's choices appear. Repeat with an adapter that resolves despite abort; the post-await guard still rejects A. Close the editor while a header observes the same shared query: the editor's local work ends without an application-level cancellation of the header's query. Change viewer identity during a read: the old result cannot populate the new owner's state. A genuine current network failure remains visible as a failure rather than “no matches.”

Localize pending, retry, unavailable, and no-match messages independently. Keep disabled choice explanations readable by assistive technology and avoid stealing focus when a background query settles.

## Avoid these shortcuts

Do not allocate an unrelated abort controller that never reaches the request, cancel every query with a broad prefix on unmount, classify every rejected promise as cancellation, or rely on transport abort as the only stale-result protection. Do not promote an editor-only result into a parallel global signal merely to make cleanup easier. Match the request lifetime to the smallest owner that can truthfully decide when its result is obsolete.

## Sources and provenance

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/hooks/useOwnedRead.ts` — replacement, layout cleanup, signal propagation, and post-await abortion check.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/specifications/hooks/useSpecificationEditor.ts` — shared Query read lifetime, viewer-scoped key, and separate authority-loss cleanup.
