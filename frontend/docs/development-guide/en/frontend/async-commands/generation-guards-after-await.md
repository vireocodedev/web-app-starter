# Recheck owner and authority after every meaningful await

Opening a confirmation does not freeze the record, viewer, route, or permission that justified it. A person can navigate while the dialog is open, another user can revoke access, and a response can arrive after its editor has gone away. Capture an operation's owner and generation, then recheck them at the boundaries where the result could still cause an effect.

This is a **reference consumer pattern** from client-discovery-app. Its specification editor uses a generation counter and terminal authority state; its sales lifetime helper uses layout-effect cleanup. These are consumer-owned helpers, not exported starter APIs. The useful contract is invalidation of obsolete work, not a universal hook name to paste into every form.

## Trigger and owner

Use a generation when the same mounted component can represent different editing authority over time. A mounted flag answers whether a component is alive. It does not answer whether the current viewer may still change record A, whether A is still selected, or whether the operation belongs to the latest editor session.

The feature owner defines the generation boundary: viewer, workspace, record identity, draft session, and observed restrictions that invalidate pending work. A harmless refresh need not invalidate everything; actual restriction must. Keep the immutable command basis captured with that owner. The backend remains responsible for checking live authorization and concurrency before committing.

The reference editor increments its generation on observed authority loss. Other restrictive authority transitions are staged in state and committed through a layout effect; the lifecycle ref is not mutated during render. That distinction matters under render replay: an abandoned render should not revoke a still-committed owner merely because it was evaluated.

## Guard both sides of the command

The following is **pseudocode for a feature-owned protocol**, not a starter helper or a complete React implementation:

```ts
const operation = owner.capture(); // record identity + generation + immutable basis
if (!owner.mayStart(operation)) return;

const confirmed = await confirmExactAction(operation);
if (!confirmed || !owner.isCurrent(operation)) return;

const result = await api.send(operation.command);
recordAcknowledgedOutcome(result); // server result remains a fact
if (!owner.isCurrent(operation)) return;

acceptIntoCurrentEditor(result);
```

The first post-await check prevents a confirmation for record A from submitting after the owner became record B. The second prevents A's late result from resetting B's form or showing B a misleading local outcome. A committed result can still notify a separate application-level observer where that observer has its own valid owner; local editor acceptance and command acknowledgement have different lifetimes.

A generation check is not a lock against server changes. Even after the check passes, authority can change before the request arrives. Send the command's expected revision/token and let the server reject stale or unauthorized work. Do not replace server authorization with a browser counter.

The inspected `useFormFeedback` aborts an active confirmation when it unmounts and can link an external abort signal. The editor additionally checks captured generation and terminal state after confirmation, because dialog cancellation alone cannot cover every authority transition. Its feedback write function also accepts an `isCurrent` predicate for integrations that need current-owner notification gating. Supplying that predicate is a caller decision; not every inspected call supplies one.

## Invalidation and cleanup decisions

| Boundary                                  | Required decision                                               |
| ----------------------------------------- | --------------------------------------------------------------- |
| User cancels confirmation                 | End without sending or success feedback                         |
| Viewer/record changes during confirmation | Invalidate the captured owner; ignore confirmation result       |
| Capability is revoked                     | Make pending actions obsolete and clear restricted data         |
| Command finishes after navigation         | Preserve acknowledged server fact; skip obsolete editor effects |
| Current command fails                     | Present the failure for that current owner                      |
| Old command finishes its cleanup          | Do not clear a newer owner's busy state                         |

Busy state and duplicate-click prevention also belong to the operation owner. A synchronous pending flag can prevent a second invocation before React paints a disabled button. Cleanup must release that operation's resources without mutating a replacement editor. An ownership check in the success branch alone is incomplete if an unconditional `finally` can clear somebody else's pending state.

Prefer synchronous committed invalidation before obsolete actions can affect the visible page. The reference sales lifetime uses a layout boundary; the specification editor uses layout effects for authority epoch changes. Do not interpret this as permission to mutate refs during render or to move all unrelated effects to layout effects.

## Failure and recovery

Canceling a confirmation means no command was sent. Canceling transport after a write was sent does not prove the server rolled it back. If acknowledgement is lost, use the command's retry identity and the server's receipt protocol rather than manufacturing a fresh operation. A late rejection for an obsolete owner should not overwrite the current editor's error message.

On observed permission loss, invalidate first, then coordinate restricted draft/cache cleanup. On a transient read failure, preserve safe input and offer recovery; do not mark every failure as permanent revocation. Map actual response contracts through the feature API rather than scattering status-code guesses through UI controls.

## Acceptance scenarios

Open “Archive document A,” navigate to B, and confirm: no archive request for the obsolete owner is sent. Revoke permission while the dialog is open: confirmation cannot bypass denial. Start a write for A, navigate, then resolve it: B keeps its own values, busy state, and feedback. Trigger two clicks before the disabled state renders: one operation starts. Replay mount/cleanup in development: obsolete confirmations and subscriptions terminate without canceling a distinct valid owner.

Name the exact action and target in localized confirmation copy. Keep cancel and confirm focus behavior intact. Never infer consent from a dialog having opened or from a user remaining on the page.

## Avoid these shortcuts

Do not use `isMounted` as authorization, check generation only before awaiting, mutate lifecycle refs in render, let an old `finally` reset a new operation, or assume a disabled button prevents programmatic calls. Keep guards near each externally visible effect so future awaits cannot silently reopen the race.

## Sources and provenance

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/specifications/hooks/useSpecificationEditor.ts` — generation capture, authority invalidation, confirmation/write checks, and duplicate-call guard.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/sales/hooks/useSalesLifetime.ts` — committed mount lifetime and layout cleanup.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/hooks/useFormFeedback.ts` — cancellable confirmation and optional current-owner predicate for write feedback.
