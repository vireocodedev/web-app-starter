# Guard route changes, reload and explicit logout coherently

An unsaved form can be lost through more than a pathname change. Search parameters can select another record, browser reload leaves the application, and explicit sign-out may end the editor without using the router. Compose those exit channels around one form lifecycle instead of implementing unrelated prompts in each button.

This is a **reference extension of the starter's basic form example**. The installed `GuardedDraftPreview` demonstrates a cancellable React Router blocker for dirty pathname changes. CDA's `useFormNavigationGuard` additionally considers search changes, busy state, browser unload, and an explicit logout guard. Those consumer hooks are not installed starter APIs; treat them as contracts to adapt, not imports to copy.

## Trigger and ownership

The form owns meaningful dirty and submitting state. The parent editor owns whether a task can be left or discarded. The authenticated application composition owns explicit logout and its guard registry. Browser unload remains a separate platform mechanism with browser-controlled messaging.

Distinguish dirty from busy. Dirty means current input differs from its accepted baseline. Busy means an operation is pending and may already have reached the server. Discarding input during an uncertain write is not equivalent to canceling a local edit. A busy task may need to reject navigation rather than offer an ordinary discard confirmation.

The CDA hook keeps current dirty/busy values in a ref updated at a committed layout boundary. Its SPA blocker compares pathname **or search**, then blocks when dirty or busy. A blocked transition while busy is reset. Otherwise it opens a cancellable confirmation; after the person answers, it rechecks current busy state before proceeding. That prevents a delayed discard decision from leaving after submission began.

## Compose the exit channels

This is a **conceptual policy table expressed as pseudocode**, not an installed hook signature:

```ts
async function mayLeaveTask(signal: AbortSignal) {
  if (task.isBusy()) return false;
  if (!task.isDirty()) return true;
  const discard = await confirmDiscard(signal);
  return discard && !signal.aborted && !task.isBusy();
}

// SPA router asks for relevant owner-changing transitions.
// Explicit logout asks through its own application-owned guard registry.
// Browser unload uses beforeunload, not an awaited custom dialog.
```

A same-page fragment often changes only reading position. A query parameter may change either presentation or the actual task identity. The CDA generic hook conservatively treats any search change as a guarded transition; its larger workspace can define narrower task-identity exceptions. Choose the feature's rule explicitly. Do not ignore every search change merely because pathname stays constant, or block harmless topic navigation without considering a retained-session design.

The browser `beforeunload` path sets `preventDefault` and `returnValue` when dirty or busy. It cannot await the application's normal modal or guarantee a custom translated warning. Browser restrictions and abrupt termination mean it is a last warning, not durable draft storage.

Explicit logout must consult the application guard before destroying authentication state. CDA's form logout adapter rejects while busy, allows clean forms, and confirms dirty ones with another busy/abort check afterward. This covers intentional sign-out through that composition. It does not promise that server session expiry, another tab, or an operating-system process kill can be delayed by a client prompt.

## Decisions and recovery

| Attempt                                    | Policy                                            | Recovery                                              |
| ------------------------------------------ | ------------------------------------------------- | ----------------------------------------------------- |
| Clean, idle route change                   | Proceed                                           | None                                                  |
| Dirty, idle owner-changing route           | Ask once                                          | Keep editing or explicitly discard                    |
| Busy route change                          | Reject/reset transition                           | Wait for known outcome or use explicit reconciliation |
| Submit starts while discard dialog is open | Recheck busy after confirmation                   | Stay in task                                          |
| Reload/tab close                           | Browser-controlled unload warning where supported | Durable recovery requires a separate draft feature    |
| Explicit logout while dirty                | Ask through application logout guard              | Sign out only after allowed exit                      |
| Authority is revoked                       | Apply revocation policy                           | Do not let discard prompts retain forbidden content   |

Confirmation lifetime matters. Abort obsolete prompts on cleanup or replacement so a late answer cannot proceed an old transition. A single owner should prevent stacked discard dialogs. Keep errors in the confirmation channel distinguishable from an affirmative result; a failed dialog must not accidentally mean “allowed.”

After acknowledged save, reset the form baseline deliberately so dirty becomes false for the accepted values. After a rejected save, preserve useful input and keep the guard active. A successful toast alone does not establish that the form baseline was updated.

## Acceptance scenarios

Change only a query parameter that selects record B while A is dirty: the relevant guard runs. Cancel discard: the destination is not entered and fields remain. Open discard, begin a write through another valid action, then confirm: the busy recheck prevents exit. Click logout with a dirty task: authentication survives canceled discard. Attempt logout while busy: the application refuses it under the policy. Trigger reload: the browser path is separate from the custom modal. Revoke access: restricted data clears even if dirty.

Localize ordinary discard and keep-editing actions. Explain a busy refusal near the task and keep keyboard focus in a usable place after a canceled transition. Avoid button text suggesting that leaving will roll back a command already sent.

## Avoid these shortcuts

Do not guard pathname alone when search changes ownership, derive dirty state from focus, allow logout to bypass the form, offer discard during an unacknowledged write, or let a stale dialog call `proceed`. Do not promise crash recovery from `beforeunload`. Define the complete exit policy once, then connect each relevant navigation channel to that owner.

## Sources and provenance

- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/src/features/development-guide/patterns/forms/components/DirtyStateAndNavigationGuardPanel/GuardedDraftPreview.tsx` — installed pathname blocker, cancellable prompt, and accepted-value reset.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/hooks/useFormNavigationGuard.ts` — pathname/search, busy state, unload, and post-confirmation checks.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/hooks/useFormLogoutGuard.ts` — explicit logout policy for dirty/busy forms.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/auth/hooks/useBeforeLogoutGuard.ts` — committed callback and application-owned guard registration.
