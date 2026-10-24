# Bind server-event subscriptions to authenticated ownership

A server-event connection has a lifetime: an authenticated viewer, an optional workspace, listeners, reconnect attempts, and messages still arriving during teardown. Give that lifetime one owner. Otherwise logout can leave a private stream alive, a workspace switch can apply old events to a new view, or repeated mounts can register duplicate handlers.

This is a **reference capability**, not an installed starter service. FRED uses a native credentialed `EventSource`; LMS composes a historical `useRgoSseEmitter`. The starter does not acquire either product's stream endpoint, event vocabulary, or offline policy by adding this article. Establish the backend event contract before enabling a real stream.

## Trigger and owner

Use server events when the server must notify a browser of changing state without the browser repeatedly asking for every update. The authenticated application composition owns the connection when events span several features. A workspace-specific feature may own a narrower subscription if the backend supports that scope. Individual widgets consume owned projections instead of each opening the same global stream.

FRED opens `/api/sse` with credentials only while authenticated and closes the source in effect cleanup. LMS disables its stream when authentication or its product role does not qualify, registers named handlers centrally, and reconnects when a product-specific context changes. Transfer the lifetime rule, not those role names or business transitions.

Choose the complete connection identity explicitly. A boolean authenticated flag is sufficient only when viewer/workspace changes cannot occur without ending that lifetime. A new consumer that can switch accounts in place needs identity-scoped cleanup and late-message rejection, even if `isAuthenticated` remains true.

## Separate transport state from authority

This is a **proposed neutral protocol**, not an installed API:

```ts
type StreamOwner = {
  viewerId: string;
  workspaceId: string;
  generation: number;
};
type StreamState = "disabled" | "connecting" | "connected" | "recovering" | "session-check-required";

// Open only for the captured owner.
// Validate each message and reject it if that owner is obsolete.
// On cleanup: close source, release listeners, cancel scheduled reconnects.
```

A connected transport does not prove the viewer may execute a command. The backend must authorize the stream and every operation separately. A heartbeat establishes only the documented liveness facts. It is not acknowledgement of a particular pending write or proof that every cache entry is fresh.

LMS documents that an EventSource error does not expose the failed handshake's HTTP status. Its error handler single-flights a current-user refresh to distinguish an expired session from network failure through the authentication API. That is more precise than labeling every stream error “logged out” or every error “offline allowed.” The new application's session API must supply its own explicit outcomes.

## Recovery decisions

| Event                          | Connection owner                            | Data owner                                       |
| ------------------------------ | ------------------------------------------- | ------------------------------------------------ |
| Login completes                | Open eligible stream                        | Establish fresh authorized projection            |
| Viewer/workspace changes       | End old lifetime and start a new scoped one | Reject old messages and clear restricted data    |
| Transient connection error     | Follow bounded reconnect policy             | Mark freshness/reconciliation state              |
| Session check denies access    | Close stream and invalidate owner           | Apply authentication/revocation cleanup          |
| Stream reconnects              | Resume only under documented cursor policy  | Reconcile missed state before claiming freshness |
| Component composition unmounts | Close and release scheduled work            | Prevent late local effects                       |

FRED's historical provider closes EventSource on any error. That ends the connection and does not itself schedule recovery. Do not present it as a complete resilient reconnect strategy. Its listener also uses unchecked `JSON.parse(...) as T`; malformed or incompatible messages can throw. New integrations need guarded decoding and runtime schema validation before application handlers.

A robust replay/gap protocol is additional work, not a guarantee demonstrated by these providers. Agree with the backend on event IDs or cursors, retention, reconnect behavior, owner scoping, and a full-refetch fallback. If recovery uses an application retry timer, bound its backoff and cancel it on owner change. Avoid layering an uncontrolled second retry loop over the chosen transport's own lifecycle.

## Failure and feedback

Represent recovering separately from denied and from permanently unsupported. Keep permitted last-known data with an honest freshness indication when product policy allows it. Do not toast every expected heartbeat gap or print private event payloads to diagnostics. Report repeated schema incompatibility or unrecoverable recovery failures with safe event-type/version metadata.

A retry action should reconnect the current owner's stream and reconcile its state. It should not replay arbitrary writes, resurrect a logged-out session, or silently adopt events from another workspace. Background recovery normally should not move keyboard focus away from the person's task.

## Acceptance scenarios

Mount and clean up the authenticated composition repeatedly: exactly the intended live connection and listeners remain. Change viewer while still authenticated: old messages cannot update the replacement owner's state. End the session: the stream and reconnect schedule stop. Trigger a transient error: the page distinguishes recovery from denial. Deliver malformed JSON: it does not crash unrelated UI. Reconnect after missing events: the application reconciles through an explicit server-supported policy rather than assuming nothing changed.

Localize connection, recovery, stale-data, and session messages. Pair status color with text and reserve disruptive announcements for actionable changes.

## Avoid these shortcuts

Do not open one global connection per widget, leave retry timers after logout, use a heartbeat as command success, cast decoded JSON directly to a trusted type, or copy FRED's close-on-error behavior as a full recovery policy. A stream is an owned channel with a documented recovery contract.

## Sources and provenance

- `FRED/FRED-front@7a78e4f624e4b51ce1cdb9334036f2fb6119f62a:src/shared/providers/SseProvider/SseProvider.tsx` — authenticated credentialed connection and cleanup; unchecked decoding and close-on-error limitations.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/sse/providers/LmsSseProvider.tsx` — centralized handlers, eligibility, context reconnect, and single-flight session verification.
