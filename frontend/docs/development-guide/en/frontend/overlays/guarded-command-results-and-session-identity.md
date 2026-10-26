# Separate overlay results, guarded exits and editor session identity

An overlay result describes how that UI session ended. It does not independently prove a server command succeeded. A dirty-exit confirmation can finish after the view changed, and an old editor can report completion after a new editor occupies the same panel. Keep transport outcome, mounted overlay, and inner view session distinct.

This is **installed starter composition with the RGO overlay contract**. Contacts uses a page-local overlay provider and `useAppMultiViewOverlay`; RGO owns presentation/result lifecycle. The feature supplies leave policy and accepts editor callbacks only for the current inner session.

## Trigger and owner

Use this protocol when filters, detail, and editing share one mounted panel or when commands finish asynchronously. The provider owns the page's overlay store. An overlay handle owns one mounted presentation and result. The application controller owns inner view/session identity. The feature owns dirty/busy rules and actual API acknowledgement.

RGO result is either completed with a typed value or cancelled with an explicit reason. Ordinary dismissal resolves cancellation rather than rejecting. Configuration/implementation errors are separate; do not treat every resolved promise as success or assume no operation can ever throw.

## Inspect the result explicitly

This **minimal use pattern** follows the installed result union:

```ts
const outcome = await handle.result;
if (outcome.status === "completed") {
  // Consume the content's declared result contract.
} else {
  // Dismissal/page change is cancellation, not successful persistence.
}
```

Content should call completion only after its command contract acknowledges the intended result. RGO's `complete(value)` bypasses that overlay's own busy/close guard after successful work, but descendants still approve parent close. It returns `Promise<boolean>`; callers must await it to observe the guarded closure outcome, including descendant checks and transition exits. If a descendant refuses, the promise resolves false even though the write may already be committed and the overlay remains; do not invite a duplicate save to “complete” the UI.

Contacts awaits `mutateAsync`, then its form completion callback checks the current session before asking the overlay to complete. This guards editor acceptance/closure. Its notification path is separate; do not claim every late feedback effect is automatically session-gated by the controller.

## Keep mounted and inner identities separate

`useAppMultiViewOverlay` assigns an increasing session ID to each accepted view and a symbol to the mounted overlay. A view switch reuses the handle but changes the session. Dirty/state/saved callbacks include that session ID, so a callback from editor A cannot reset editor B.

Leave checks are single-flight and abortable. The controller captures the active entry, calls feature `canLeave`, then requires approval, no abortion, mounted lifetime, and the same active entry. It updates callback configuration at a committed layout boundary. Feature policy still rechecks submitting after an awaited discard decision.

| Transition                | Required distinction                               |
| ------------------------- | -------------------------------------------------- |
| Request same view         | Reuse current view under feature identity rule     |
| Dirty different view      | Await current-session leave policy                 |
| Busy editor               | Refuse ordinary replacement/dismissal              |
| Old editor reports saved  | Ignore if session no longer current                |
| Page/provider ends        | Force cancellation and abort guard lifetime        |
| Server write acknowledged | Preserve commit fact independently of UI dismissal |

## Capture presentation at opening

The Contacts owner chooses dialog, docked desktop panel, or modal panel from current preference/breakpoint when opening. RGO captures effective bottom-drawer/presentation mode for that session. Later provider breakpoint/preference changes do not remount the existing session into another presentation. `updateProps` patches caller data shallowly; it does not change presentation or run close guards.

This preserves mounted draft state across resizing. It also means “change editor preference” does not promise an already-open editor immediately moves. New sessions use current configuration; existing sessions retain their captured lifecycle.

## Forced lifecycle and recovery

RGO pageKey changes and real provider unmount force-cancel sessions, including guard abortion. The store uses a microtask attachment policy to tolerate React effect replay. A pageKey transition occurs after routing; it is cleanup, not an unsaved-navigation authorization mechanism. Install an appropriate route/task guard separately if leaving must be prevented.

A result after cancellation must not close a replacement session or overwrite its dirty/busy state. An uncertain write needs the server receipt/reconciliation protocol; deleting the overlay is not rollback. If callback or guard fails, route error reporting through the provider's error owner without fabricating success.

## Acceptance scenarios

Cancel discard: view and draft remain. Begin submission while discard is open: the recheck prevents leaving. Change inner view, then deliver an old state/saved callback: the new session stays untouched. Resize or change presentation preference mid-edit: mounted draft remains in captured presentation. End the page: pending guards abort and results cancel. Complete a write with a refusing child: persistence fact stays acknowledged even if the UI completion promise resolves false.

## Avoid these shortcuts

Do not equate settled result with success, use view names without session identity, treat pageKey cleanup as a navigation guard, or mutate presentation through prop patches. Each result belongs to a specific owner and lifetime.

## Sources and provenance

- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/overlays/hooks/useAppMultiViewOverlay.ts` — abortable leave policy, mount/view identities, and current-session acceptance.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/features/development-guide/contacts/hooks/useContactsWorkspace.ts` — feature dirty/busy policy and opening-time presentation.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/features/development-guide/contacts/components/ContactsSidePanel.tsx` — awaited mutation and session-aware completion.
- `RGO/frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:src/capabilities/Overlays/types.ts` — result/cancellation, completion, immutable presentation, and shallow prop contract.
- `RGO/frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:src/capabilities/Overlays/internal/store.ts` — force cancellation, guard and replay-safe provider lifecycle.
