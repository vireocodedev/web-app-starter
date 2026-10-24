# Pin editable values and concurrency tokens together

A background refresh must not replace a person's draft or silently attach a newer revision to older values. Use a pinned editor session when a record can change remotely while a form is open, especially when commands carry an expected revision or public concurrency token.

This is a **reference consumer pattern** from client-discovery-app. The starter's `AppEntityFormMode` distinguishes create from update and requires initial values for an update. It does not install `usePinnedRecord`, define remote conflict policy, or make every form revision-aware. Introduce the protocol inside the feature that owns the editable record before extracting a genuinely shared helper.

## Trigger and owner

The feature's editor owner holds the selected record identity, original values, concurrency tokens, dirty state, and pending command. The form owns its current field values and validation. The query owns remote observations; a new query result is an observation until the editor explicitly accepts it.

Keep two representations: the pinned record on which editing began and the latest received projection. A stamp describes the remote facts that make the current editing basis obsolete. A simple record may use its revision. A derived editor can also depend on a source identity, token, or gate. A stamp must represent that contract deliberately; object identity alone is unsuitable.

The inspected helper records `record`, `received`, and `stale`. Its first fresh observation fills the pin. Further fresh observations update `received`, preserve `record`, and latch `stale` when their stamps differ. Its `accept` operation replaces both records and clears stale; `conflict` marks stale after a rejected command; `clear` removes the session. Stale remains latched even if a later projection happens to match an old stamp, so recovery stays explicit.

## Preserve one editing basis

For a neutral document editor, the following is a **conceptual state contract**, not an importable starter API:

```ts
type DocumentBasis = {
  id: string;
  revision: number;
  title: string;
};
type EditorSession = {
  basis: DocumentBasis;
  values: { title: string };
  latest: DocumentBasis;
  stale: boolean;
};

// A refresh changes latest/stale; it does not replace basis or values.
// A save uses basis.revision and values from this same session.
// Explicit reload replaces basis and values together after a discard decision.
```

If the form began at revision 7, a refresh showing revision 8 must not change only its hidden revision field to 8. Doing so claims that the person edited against facts they never saw. Submit against revision 7 or block and ask for reconciliation, according to the command policy. The server still enforces the concurrency contract; a client stale flag is only presentation and local coordination.

Not every refresh requires discarding input. A harmless remote addition can preserve the draft and show a stale notice. Actual visibility or permission loss takes precedence over draft preservation: clear unauthorized content and invalidate pending actions. The inspected editor separates pinned editable facts from current capability and visibility projections for this reason. Its product-specific projection rules are not a universal merge algorithm.

## Freshness and recovery decisions

Only hydrate from an observation the owner considers fresh and authorized. A retained cached result may help display a loading state but must not automatically become current permission evidence. The reference editor requires a successful read fetched after mount and no active fetch before accepting its fresh projection.

| Event                        | Local behavior                             | Next action                             |
| ---------------------------- | ------------------------------------------ | --------------------------------------- |
| Same stamp, new query object | Keep values and editing basis              | Continue editing                        |
| New stamp while dirty        | Preserve draft, mark stale                 | Explain reload or reconciliation        |
| Server conflict              | Keep useful authorized draft, mark stale   | Fetch and explicitly choose a new basis |
| Reload with unsaved input    | Ask whether to discard                     | Accept fresh values and token together  |
| Authority lost               | Clear restricted pin and obsolete commands | Show denial or a permitted destination  |

Reload is a command with its own busy state, not a side effect of rendering a warning. If its read fails, keep the previous authorized draft and show a recoverable error. A successful reload resets dirty state and any retry identity tied to the old basis. If the form library initializes values only on mount, use its deliberate reset operation or an owner-controlled editor epoch; do not rely on changing an arbitrary prop.

## Acceptance scenarios

Inspect the behavior with a dirty revision-7 form and a revision-8 background result: typed input stays visible, the warning appears, and the next write never silently uses revision 8. A same-stamp refresh does not reset focus or fields. Canceling discard retains both values and revision; confirming reload updates both. A conflict does not display success. Permission revocation removes restricted content even when dirty, and a late old response cannot hydrate it again.

Localize warning, reload, discard, and denial copy. Explain the effect in visible text rather than color alone. Place the recovery action near the stale notice and keep validation/error focus usable after an explicit reset.

## Avoid these shortcuts

Do not reset on every query change, refresh only hidden concurrency tokens, compare complete transport objects without understanding their semantics, or make a stale notice an authorization mechanism. Do not turn the reference hook into a global store that leaks drafts between viewers. The smallest useful abstraction preserves one coherent editing basis and exposes explicit accept, conflict, and clear transitions.

## Sources and provenance

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/hooks/usePinnedRecord.ts` — pin, received projection, stamp comparison, and explicit transitions.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/specifications/hooks/useSpecificationEditor.ts` — fresh observations, concurrency payload, restricted authority, and explicit reload.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/src/app/forms/types/AppEntityForm.ts` — installed entity-form contract; no pinned-record protocol.
