# Preserve an owned draft across a deliberate route detour

A longer task may need to leave its form temporarily: create an attachment, repair a prerequisite, then return to the original draft. Treat that detour as an explicit session protocol. A URL alone is not permission to preserve arbitrary unsaved state, and returning from an upload is not permission to select the newest file automatically.

This is a **reference consumer pattern** from client-discovery-app. Its specification registration session and workspace route composition coordinate retained drafts, evidence creation, and return refresh. These helpers and route names are product-owned; the starter does not install a universal multi-route draft store or an evidence-session API.

## Trigger and owner

Use a parent session when a task genuinely spans several mounted views but still has one draft owner. The parent owns the draft and its disposal policy. Leaf routes own presentation, local focus, and route-specific controls. Do not move all form state globally just because one child unmounts.

The inspected registration draft holds a random nonce, inputs, selected topic, initial-value serialization, optional replacement identity, and freshness tokens. Its owner is the project/viewer pair. Changing that owner clears the draft and detour state; observed revocation clears them too. The nonce identifies one draft session, not a server authorization credential.

Dirty state compares meaningful inputs with the initial snapshot, while selected topic is presentation. Busy state belongs to the shared task, so navigating to an adjacent route cannot accidentally enable a second submission. Retry identity remains with the session rather than a disposable leaf component.

## Arm a narrow transition

The reference `armEvidence` operation only succeeds when a draft exists, it is not busy, observed authority is fresh, the draft is not stale, and no authority error or revocation is present. It records the draft nonce and optional replacement identity as the permitted detour. Return matching requires both the armed session ID and the current draft nonce.

A neutral **conceptual session contract** looks like this:

```ts
type DraftSession = {
  owner: { workspaceId: string; viewerId: string };
  nonce: string;
  values: { title: string; attachmentId: string | null };
  basis: { revision: number; sourceId: string };
  topic: "details" | "attachments";
};
type ArmedDetour = {
  sessionNonce: string;
  kind: "create-attachment";
};

// Permit only the known task <-> detour pair for this owner and nonce.
// Return refreshes attachment options; selection remains an explicit user action.
```

The workspace route owner composes that protocol with ordinary dirty-navigation guards. It recognizes the specific forward and return pair for the current project, task/replacement identity, setup route, and matching session. Arbitrary URLs, a copied old nonce, or a different task remain normal navigation subject to disposal/confirmation rules. A guard predicate should decide whether a transition is allowed; it should not secretly discard the draft while evaluating a potential route.

This is an exception for a known task transition, not a general exemption from unsaved-change protection. A busy operation or lost authority can invalidate the detour even if the URL still looks correct.

## Refresh on return without inventing intent

The inspected return operation selects the documents topic and increments a refresh epoch. The article's consuming component includes that epoch in the administration query key, then accepts the refreshed option projection after the return read succeeds. It focuses the relevant document control. The retained input still belongs to the original draft.

The evidence-retained callback deliberately does not assign the uploaded artifact ID. A user might upload several files, create something for another purpose, or return without completing an upload. Refreshing available choices and explicitly choosing the intended attachment avoids an invisible business decision.

If the remote source or revision changed during the detour, mark the draft stale and require reconciliation. Do not “repair” the problem by replacing only its token. If authority is lost, clear restricted draft material even if preserving it would be convenient. Client session matching supplements server checks; it cannot authorize attachment access or linking.

## Lifecycle and recovery decisions

| Event                                  | Session behavior                                   | Visible next step                                     |
| -------------------------------------- | -------------------------------------------------- | ----------------------------------------------------- |
| Enter permitted attachment detour      | Preserve the same draft and nonce                  | Create or inspect attachment                          |
| Return with matching session           | Refresh choices; keep explicit selection           | Focus attachment section                              |
| Return with old or foreign nonce       | Do not adopt another session                       | Explain missing/expired task or use normal navigation |
| Source changes during detour           | Preserve safe draft, mark stale                    | Reconcile against current source                      |
| Project/viewer changes                 | Clear owner-specific draft and retry state         | Start a separate task                                 |
| Authority is revoked                   | Clear restricted content and invalidate transition | Show permitted recovery destination                   |
| Browser reload loses in-memory session | Do not fabricate a draft from URL alone            | Explain that the draft must be restarted              |

A durable draft feature is a separate product decision. It needs storage scope, schema/version migration, retention, privacy, ownership, and restore rules. The reference in-memory session is not evidence that browser restart restoration exists.

## Acceptance scenarios

Enter a title, select a topic, take the permitted detour, and return: the same input and draft identity remain. Upload an attachment: the options refresh, but no attachment is silently selected. Return using a copied stale nonce or a different workspace: no draft is adopted. Change the remote revision during the detour: submission cannot pair old values with a fresh token. Revoke the viewer's permission while away: the retained draft disappears and the return path does not bypass denial. Try leaving for an unrelated route while dirty: ordinary discard protection still applies.

Localize detour, return, expired-session, stale-source, and discard messages. A return control should say what task it resumes. Restore focus to the relevant topic or field after fresh options arrive, not to a detached element or an arbitrary page top.

## Avoid these shortcuts

Do not preserve drafts in an unscoped singleton, derive ownership from a mutable label, allow any `returnTo` URL to bypass guards, infer attachment choice from “newest,” or clear retry identity on every topic change. Do not claim that a nonce in the URL proves authority. A useful session protocol specifies exactly who owns the draft, which route pair may retain it, and what ends that lifetime.

## Sources and provenance

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/specifications/hooks/useSpecificationRegistrationSession.ts` — draft/nonce ownership, detour arming, matching, return epoch, and explicit non-selection.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/specifications/components/ProjectSpecifications.tsx` — return-dependent option query, refreshed projection acceptance, and document-control focus.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/discovery/components/DiscoveryWorkspace.tsx` — project/task-specific route pairing, session matching, and ordinary navigation integration.
