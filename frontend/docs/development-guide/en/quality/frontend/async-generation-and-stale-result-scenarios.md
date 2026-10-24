# Control async ordering to expose stale-result bugs

A race scenario should determine which operation starts and which result arrives first. Sleeping until “the network is probably done” does not establish that ordering. Use held promises or intercepted responses, observe the start boundary, change the owner, then release the obsolete result and assert what it cannot change.

This is an **installed starter pattern with consumer extensions**. The lookup test deliberately ignores transport cancellation to expose late results. Auth runtime tests hold old session/feature reads across identity changes. CDA editor tests hold writes across unmount and revocation. The source asserts these contracts; this article does not claim the tests were executed.

## Trigger and ownership

Use controlled ordering for replacement searches, route/editor ownership, authentication expiry, confirmation delays, and writes whose acknowledgement can arrive after navigation. The test owns the release gates; the production owner owns cancellation and result acceptance.

The starter lookup test captures each request's filter, signal, and resolver. It changes search and department, resolves the current response, then resolves an older department last. Assertions cover both aborted signals and the retained current result. This matters because a transport can finish even after abort; seeing `signal.aborted` alone does not prove stale-result safety.

## Design the race explicitly

This is **inert conceptual pseudocode**, not an installed helper:

```ts
const oldRead = holdResponse();
startReadFor("owner-a", oldRead);
await oldRead.started;

switchTo("owner-b");
await showCurrentResult();
oldRead.release(oldProjection);

// Current owner/result remains B; old private state is not restored.
```

Keep start and completion gates separate. Releasing before the request began can miss the race, while awaiting completion before owner change tests the ordinary sequence instead. Wrap React state-producing releases in the suite's appropriate `act`/observable wait boundary.

| Race                                          | Positive outcome                      | Forbidden outcome                        |
| --------------------------------------------- | ------------------------------------- | ---------------------------------------- |
| Old lookup resolves last                      | Current choices remain                | Old parent/search replaces them          |
| Session expires before read returns           | Anonymous/private cache cleared       | Old session rehydrates identity          |
| Login completes before old anonymous response | New identity stays authoritative      | Late 401 expires the new lifetime        |
| Write acknowledges after unmount              | Valid commit observer can learn fact  | Old editor accepts/reset state           |
| View revoked during held write                | Restricted draft/cache remain removed | Late success resurrects content          |
| Confirmation outlives task identity           | Current owner rechecked               | Obsolete action sends for the wrong task |

The first five have concrete variants in cited source. The confirmation row is a required design scenario when adapting the generation protocol, not a claim that every cited suite already covers it. Add exact owner/generation assertions around any newly introduced await.

## Separate acknowledgement from local effects

CDA's editor source test expects a committed-result observer after a held write completes even when the editor unmounted. It simultaneously expects the old query projection not to accept that result. Another case revokes visible authority before releasing an acknowledged response: the observer may run, but restricted editor data must stay revoked.

Do not “fix” such a test by suppressing all late acknowledgement. The server fact and current UI owner's acceptance have different lifetimes. Conversely, an observer is not called for canceled confirmation, local edits, or failed commands. Assert the intended distinction directly.

## Failure and cleanup

Settle or cancel held work in failure-safe teardown. Clear owned clients and restore mocks; an unresolved fixture promise can contaminate later cases or leave resources alive. Avoid arbitrary real delays and do not rely on automatic retries to reorder the scenario accidentally.

Review the remaining branches: an obsolete `finally` can clear a newer operation's busy state even when success is guarded. A same-owner refresh should not invalidate useful work without cause. Simulated cancellation does not prove real browser transport behavior; use the boundary appropriate to the claim.

## Acceptance scenarios

A meaningful race test fails when the late-result guard is removed even if abort remains. Identity expiry cannot be reversed by an old successful read. Current login survives a stale anonymous response. Revocation removes private input before the held write settles and stays effective afterward. A canceled confirmation sends zero writes. Cleanup completes every held operation and leaves no old owner active.

## Avoid these shortcuts

Do not test only immediate resolved promises, assert abort without late completion, use sleeps as synchronization, or equate mounted with authorized. Own the schedule and assert both current effects and obsolete non-effects.

## Sources and provenance

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/features/development-guide/patterns/forms/components/AsyncLookupsPanel/useAsyncLookup.test.tsx` — cancellation-ignoring transport and old-department late result.
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/integration/auth/createAppAuthRuntime.test.ts` — held identity/session reads and competing lifetime outcomes.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/tests/features/specifications/hooks/useSpecificationEditor.test.tsx` — held command, unmount/revocation, observer separation, and forbidden rehydration.
