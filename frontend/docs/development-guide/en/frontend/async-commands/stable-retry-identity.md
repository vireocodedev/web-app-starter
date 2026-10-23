# Keep one request identity for an uncertain command

A request can commit on the server while its response is lost. Retrying that command with a new UUID can create a second registration or repeat a decision. Give one logical command a stable request identity and preserve it while its acknowledgement is uncertain.

This is a **reference fullstack protocol**, not installed starter mutation behavior. client-discovery-app pairs a frontend retry envelope with transactional backend receipts. A frontend UUID alone does not provide idempotency. Before enabling retries in another feature, identify the backend's receipt scope, payload comparison, authorization, locking, and retention contract.

## Trigger and owner

Use this protocol for commands where duplicate effects matter and response loss cannot safely be treated as rollback. Examples include registering a document version, submitting an exact decision, or creating a resource through an unreliable connection. Read retries and idempotent replacement semantics have different requirements; do not apply a generic write retry policy blindly.

The draft or editor session owns `{payload, id}`. The payload identity includes every fact that defines the command: expected revision, expected token, and the command body. Viewer, workspace, and target record form the surrounding owner. In the inspected editor, identical serialized payloads reuse the same UUID. A changed payload creates a new UUID. The longer-lived registration session holds retry identity across its own route detours and clears it on owner change, observed revocation, explicit discard, and acknowledged completion.

That is bounded in-memory persistence. It does not promise survival across tab close or browser restart. Durable retries need a deliberately secured outbox and a server reconciliation contract; saving opaque sensitive commands to local storage is not an automatic extension of this pattern.

## Capture one immutable command

This neutral example is **pseudocode**, not an importable starter helper:

```ts
type Attempt = { payload: string; id: string };
let attempt: Attempt | undefined;

function requestId(payload: string): string {
  if (attempt?.payload !== payload) {
    attempt = { payload, id: crypto.randomUUID() };
  }
  return attempt.id;
}

const payload = JSON.stringify({ expectedRevision, expectedToken, command });
const id = requestId(payload);
// Send exactly the captured payload with id; reuse both for an uncertain retry.
```

`JSON.stringify` here compares a consistently constructed local command. It is not a cryptographic commitment or a universal canonical-JSON specification. The backend in the reference hashes its own canonical serialization. Another client can serialize properties differently, so server equivalence must be defined independently of the browser's string comparison.

Keep the editing basis pinned. A refresh must not silently substitute a new revision into an uncertain retry. If the user changes input or explicitly accepts a different basis, that is a different command identity. Before sending a different command after an uncertain outcome, reconcile the old outcome where necessary; generating a new ID does not make the earlier side effect disappear.

## The backend half is mandatory

The inspected specification service locks the scoped project row, validates command shape and current authorization, then checks for an existing receipt. A receipt replay occurs before rejecting the old expected revision: the first successful command naturally advanced that revision. The receipt helper checks that the stored actor matches and that a hash of the canonical payload matches. Reusing an ID with different content is a conflict; another actor cannot inherit the receipt.

The mutation and receipt write occur in the same transaction. A replay returns a current authorized workspace projection plus `replayed: true`; this is not a promise of byte-identical original response replay. The server's exact replay semantics should be documented for each protocol. Scope and command namespace also matter: a UUID should not collide semantically with an unrelated operation on the same owner.

| Situation                         | Identity decision                            | Recovery                                    |
| --------------------------------- | -------------------------------------------- | ------------------------------------------- |
| Response lost, payload unchanged  | Reuse request ID and captured payload        | Replay through server receipt contract      |
| User edits a field                | New logical payload gets a new ID            | Resolve any uncertain prior effect first    |
| Expected basis explicitly changes | New command identity                         | Reconcile and revalidate                    |
| Acknowledgement succeeds          | Clear pending retry identity                 | Show durable result and refresh projections |
| Viewer or authority changes       | Invalidate the old session's retry authority | Do not replay under a replacement viewer    |

## Failure and recovery

A timeout means the outcome may be unknown; it does not establish failure. Show a localized message that distinguishes uncertainty from a known rejection. Provide a safe retry only if the server supports the protocol. If no receipt mechanism exists, query authoritative state or expose a reconciliation action rather than automatically repeating the write.

A conflict can mean stale revision or request-ID payload mismatch. Preserve the actual server contract so the UI chooses the right recovery instead of presenting every conflict as “try again.” Permission failure must not expose an old receipt or private result. Abort and route departure do not cancel a committed server transaction.

## Acceptance scenarios

Commit a command but lose its response, then resend the same envelope: exactly one business effect exists and the response reports replay according to the server contract. Submit the same request ID with changed content: the server rejects it. Retry as another actor: the server denies receipt access. Change the draft after an uncertain result: the UI does not automatically send a fresh duplicate command. Complete a command successfully, then intentionally perform a distinct action: the previous retry identity is cleared.

## Avoid these shortcuts

Do not generate a UUID per transport attempt, reuse one UUID for all edits, retry arbitrary POST requests globally, or equate a client abort with rollback. Do not advertise “exactly once” from a client-side ref. The useful guarantee comes from a scoped, authorized, atomic server receipt protocol combined with a stable client command identity.

## Sources and provenance

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/specifications/hooks/useSpecificationEditor.ts` — immutable revision/token/command identity and retry-envelope lifecycle.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/specifications/hooks/useSpecificationRegistrationSession.ts` — draft-owned request identity and owner/revocation cleanup.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/SpecificationService.java` — transaction, scoped lock, authorization, receipt-before-revision replay, and current projection response.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/SalesService.java` — receipt actor and canonical-payload hash checks.
