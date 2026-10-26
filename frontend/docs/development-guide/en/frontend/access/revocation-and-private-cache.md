# Revoke draft authority and private cache together

Permission can disappear while a page is open. Disabling Save is insufficient if the old draft, package preview, or private query cache still exposes content that the viewer may no longer read. Treat observed revocation as a coordinated change to the editor's authority and retained data.

This is a **reference consumer protocol** from client-discovery-app. Its specification editor combines capability projection, pinned records, operation generations, and scoped Query cleanup. The starter does not install this product's revocation predicate or query families. Adapt the protocol to the current feature's actual visibility and error contracts; do not copy its array positions as a universal cache API.

## Trigger and ownership

The feature authority owner decides whether a fresh observation removes an existing privilege, hides a record, changes a grant principal, archives an editable resource, or makes a private package inaccessible. The session owner clears its own draft and pending retry authority. The query-key owner identifies exactly which cached projections are no longer safe.

CDA treats observed 401, 403, and 404 responses as terminal authority loss for this editor. That is this endpoint's policy, not a rule that every missing item or network failure means logout. Its fresh workspace projection can also remove capabilities, allowed action identities, versions, or grants. Restrictions reset the editor; unrelated additions preserve input and may make its concurrency basis stale.

Keep “stale” and “revoked” distinct. Stale data can justify retaining authorized input for reconciliation. Revoked visibility can require removing that same input. Preserving work is valuable only while its owner may still hold it.

## Coordinate the transition

A neutral sequence is **conceptual pseudocode**, not an installed starter function:

```ts
function observeRestriction(nextAuthority: Authority) {
  invalidatePendingGeneration();
  clearUnauthorizedDraftAndRetry();
  projectOnlyPermittedVisibleFacts(nextAuthority);
  void cancelAndRemovePrivateQueries(affectedScope);
}
```

The inspected editor guards the visible record immediately with denied/visibility state, so asynchronous cache cleanup is not its only protection. A cleared pin cannot rehydrate from the same successful but unauthorized projection. The displayed projection uses current capabilities and action grants, filters versions no longer visible, and removes administrative grants/events when management access is lost.

Authority epoch changes are committed through a layout effect before obsolete actions can affect the page. The separate cleanup effect cancels affected queries and then removes them. Cancel-before-remove reduces the chance of an old request repopulating the entry, but the request/result owner still needs an authority check for adapters that settle late. Neither removal nor generation counters revoke server access by themselves.

The source scopes cleanup by project and viewer, then selects private package, administration, workspace, or status queries according to what was revoked. A neighboring viewer's cache or an unrelated public collection is outside that boundary. Use your feature's named key factory or typed predicate to express that scope; avoid spreading undocumented key-index assumptions into page components.

## Decide what survives

| Observation                                 | Draft policy                               | Read-model policy                                            |
| ------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------ |
| Transport temporarily unavailable           | Preserve permitted input                   | Show failure/staleness; do not infer revocation              |
| Remote revision changes without restriction | Preserve input, mark old basis stale       | Keep fresh authorized projection separately                  |
| Edit permission removed but view remains    | Stop editing according to feature policy   | Retain only allowed read projection                          |
| Private version becomes invisible           | Remove restricted version material         | Cancel/remove that package and dependent private projections |
| Viewer/project changes                      | End old owner's session                    | Use a distinct cache identity                                |
| Session or view authority lost              | Clear restricted pin and obsolete commands | Remove affected private entries and show denial              |

A UI cannot erase information the person already saw or captured. This protocol prevents continued rendering, accidental cross-owner reuse, and obsolete local operations; it is not a claim of retroactive secrecy. The server must continue enforcing every read/download/command.

## Failure and recovery

Once an operation loses authority, an older successful response must not reset the denied state. A permission addition can start a new authorized read and session under a deliberate recovery policy; it should not silently resurrect old private drafts. Re-entry and reauthentication must establish the correct owner before hydrating content.

If cleanup fails, retain the visible denial and report safe diagnostics without logging the private payload. Do not show the old content as a fallback. Conversely, do not destroy permitted work for an ordinary timeout just because clearing everything is easier than modeling failure.

Longer-lived preview objects, downloads, local stores, or imperative viewers need their own disposal policy. The inspected Query cleanup is evidence for Query entries, not proof that every possible client copy is removed. Inventory those additional owners when the feature introduces them.

## Acceptance scenarios

Revoke view access while a dirty editor and a private package are open: restricted content disappears, pending confirmation cannot send, and late reads cannot restore it. Remove management access while basic view remains: administrative detail disappears while the permitted projection remains coherent. Refresh with an unrelated added record: input is preserved rather than discarded as a false revocation. Switch viewer/project: the old draft and retry identity cannot carry over. Fail a read with a timeout: permitted input remains available for safe recovery.

Localize denial, stale basis, unavailable data, and restart actions separately. Put focus on a meaningful heading or recovery destination after removing the editor; do not leave focus on a detached field.

## Avoid these shortcuts

Do not merely disable writes, keep a private pin forever, remove queries without guarding late results, invalidate the entire application cache on every refresh, or classify every failure as permanent authority loss. Revocation is an owner transition with a data-retention consequence, not just a button state.

## Sources and provenance

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/specifications/hooks/useSpecificationEditor.ts` — restrictive projections, terminal authority, editor invalidation, and cancel/remove scope.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/specifications/hooks/useSpecificationRegistrationSession.ts` — owner/revocation disposal of retained draft and retry state.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/specifications/api/specifications.api.http.ts` — project/viewer query identity and validated API projections.
