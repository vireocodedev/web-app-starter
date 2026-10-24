# Separate acknowledged writes from observer failures

A successful command can be followed by a failed cache refresh, notification, analytics callback, or parent observer. Those failures do not undo the server's commit. Model the command outcome separately so the UI does not invite the person to repeat an already completed action.

This is a **reference consumer pattern with an installed starter comparison**. client-discovery-app has a small `notifyMutationCommitted` utility that isolates observer failures. The starter Contacts mutation factory uses targeted collection invalidation in `onSuccess`; it does not install that utility or define a general durable-command outcome protocol. Decide which behavior a feature needs rather than assuming every mutation wrapper has the stronger guarantee.

## Trigger and owner

Use the separation when a write has meaningful irreversible or duplicate-sensitive effects, or when multiple UI observers need to react after acknowledgement. The feature command owner records whether the server acknowledged a result. Each observer owns its own follow-up work and recovery. Query cache refresh belongs to the read projection, not to the transaction that already completed remotely.

Name at least three phases: sending the command, receiving acknowledgement, and updating secondary views. A server rejection belongs to the first outcome. A refresh failure after a valid acknowledgement belongs to the third. A lost or unparsable response can leave the outcome uncertain; it is not automatically a known server failure or an acknowledged success.

The inspected helper accepts an optional callback. It catches a synchronous throw and attaches a rejection handler if the callback returns a promise at runtime. It does not await that observer and deliberately suppresses its errors. The specification editor invokes it after a successful API result, before deciding whether its local editor generation is still current and before accepting the new workspace into that editor.

## Make the phases visible in code

The following is **conceptual pseudocode**, not a starter API:

```ts
let result;
try {
  result = await commands.save(capturedEnvelope);
} catch (failure) {
  presentCommandFailureOrUncertainty(failure);
  return;
}

recordAcknowledgedResult(result);
acceptForCurrentOwner(result);
void refreshReadModel().catch(reportRefreshFailure);
void notifyOtherOwner(result).catch(reportObserverFailure);
```

The narrow command catch is the important seam. A later observer failure must not enter a catch that labels the write as failed and offers a new submission. Report follow-up trouble with accurate language, for example “Saved; the list could not refresh. Refresh the list.” A durable result can provide the saved identity or next action while the projection catches up.

This snippet assumes the API resolved to a validated acknowledgement. If response parsing fails after the server may have committed, preserve the uncertainty and use the endpoint's receipt/reconciliation contract. Do not label that case “saved” merely because the request left the browser.

Isolation is also not permission to forget observability. The reference helper intentionally ignores observer failure; that can be appropriate for a best-effort notification. A mandatory downstream action needs its own owned state, retry, and reporting. If it must be atomic with the business write, it belongs in a server transaction or a reliable server-side process, rather than a browser callback disguised as part of the commit.

## Decide what a failure means

| Outcome                                       | User-facing fact                   | Safe recovery                                 |
| --------------------------------------------- | ---------------------------------- | --------------------------------------------- |
| Server rejects validation                     | No accepted command result         | Keep draft and correct fields                 |
| Server reports stale basis                    | Command rejected for conflict      | Reload and reconcile                          |
| Acknowledgement is lost                       | Commit outcome uncertain           | Reuse supported request identity or reconcile |
| Server acknowledges; refresh fails            | Write completed, view may be stale | Retry the read                                |
| Server acknowledges; observer throws          | Write completed, observer failed   | Recover that observer independently           |
| Owner changes before acknowledgement handling | Server fact may still be valid     | Skip obsolete local editor effects            |

Treat cache invalidation as a deliberate async boundary. Awaiting an invalidation in a mutation callback can be useful when a feature intentionally keeps a saving indicator until the next view is ready. That presentation choice still must not erase the distinction between acknowledged persistence and failed refresh. Check the actual mutation library behavior and callback contract before promising how errors propagate.

The starter Contacts factory invalidates only `ContactQueryKey.collection()`, which is a useful scope rule. Preserve that narrow ownership when adding outcome separation; replacing it with “invalidate everything” increases failure surface and does not improve acknowledgement semantics.

## Recovery and feedback

Clear duplicate-sensitive retry state only according to the acknowledged command contract. If the command is known complete, do not keep a generic “retry save” action simply because a toast callback threw. If the result is uncertain, do not clear identity merely because a promise rejected.

A parent observer may need notification even after the child editor navigates away, provided that observer has valid ownership. Conversely, a late child result must not reset a replacement form. Route those effects separately and apply current-owner checks to local acceptance and feedback.

Localize success, uncertainty, and refresh failure independently. Use a persistent inline recovery message where a transient toast would hide important uncertainty. Keep the retry-read action keyboard accessible and named for its actual effect. Avoid presenting a generic error banner that contradicts a durable success receipt elsewhere on the page.

## Acceptance scenarios

Make a successful API call followed by a synchronous observer throw: the command remains acknowledged. Repeat with a rejected observer promise: no unhandled rejection or duplicate-save invitation appears. Fail the collection refresh after acknowledgement: the draft is not resubmitted, and the person can retry the read. Reject the actual write: no success is recorded. Lose the response after a possible commit: show uncertainty and retain a safe reconciliation path. Navigate during completion: the new editor remains untouched.

## Avoid these shortcuts

Do not wrap the server command and every follow-up in one undifferentiated `try/catch`, call every rejected promise “save failed,” hide the actual write error, or move mandatory business work into best-effort callbacks. A small observer-isolation helper is useful only when the outcome boundary is already explicit.

## Sources and provenance

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/utils/notifyMutationCommitted.ts` — synchronous and asynchronous observer-failure isolation without awaiting completion.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/specifications/hooks/useSpecificationEditor.ts` — notification after acknowledgement and before current-editor acceptance.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/src/features/development-guide/contacts/api/contact.mutation.ts` — installed, targeted collection invalidation in mutation callbacks.
