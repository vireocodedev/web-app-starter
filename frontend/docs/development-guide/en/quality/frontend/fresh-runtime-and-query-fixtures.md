# Start each scenario with a deliberate runtime and cache lifetime

A scenario can pass alone and fail beside another when it inherits cached records, an authenticated identity, or a mutable service fixture. Build fresh owners for the boundary under test and expose them to the test so isolation can be asserted directly.

This is an **installed starter pattern with a reference scenario**. `renderApp` supplies a fresh QueryClient by default, accepts an explicit application runtime, and optionally wraps a MemoryRouter. Authentication runtime tests construct real client/runtime factories with isolated dependencies. These sources describe fixture design; no execution result is claimed here.

## Trigger and ownership

Use fresh fixtures for components that observe server data, runtime capabilities, authentication, or routing. The test owns its QueryClient, API adapter, initial route, and mutable scenario data. The application factories remain the real composition seams. A feature-specific provider can add a bounded dependency without replacing the entire application.

The installed helper disables automatic query and mutation retries in its test client. That makes a single intentional rejection stay a single scenario event. It does not change production retry policy: the application QueryClient has separate tests for cancellation, client errors, and bounded network/retryable failures.

`renderApp` uses a supplied runtime's QueryClient unless another one is deliberately passed. Do not accidentally give the runtime one cache and the component another, then assert against the wrong instance. Its returned `queryClient` supports observing the actual mounted cache.

## Compose only the needed boundary

This is **inert fixture pseudocode**, not a new installed helper:

```ts
const fixture = createDocumentScenario(); // proposed feature fixture
const view = renderApp(<DocumentPage />, {
  runtime: fixture.runtime,
  initialEntries: ["/documents/example"],
});

// Exercise the real page owner through its chosen API seam.
// Inspect view.queryClient and visible outcomes, then release owned work.
```

Use `withRouter: false` when mounting a real RouterProvider or another owner that already provides routing; nested routers are not extra integration coverage. Choose a memory route when location behavior is local and a real browser scenario when layout/focus/history requires the browser.

The helper does not reset every module singleton or dispose every custom runtime effect automatically. Testing Library cleanup unmounts React trees; the test still owns persistent fixture state, pending queries, subscriptions, fake timers, and service disposers it creates. Make those lifetimes explicit with `finally` or hooks appropriate to the suite.

| Dependency          | Scenario setup                             | Isolation assertion                                    |
| ------------------- | ------------------------------------------ | ------------------------------------------------------ |
| Query cache         | Fresh client or explicit shared-owner test | Unrelated/previous-owner records absent                |
| Authentication      | Fresh runtime and synthetic session        | Identity transition clears old private scope           |
| Route               | Explicit initial entry                     | Intended URL/outlet state                              |
| API state           | New fixture instance                       | One scenario's failure counter does not affect another |
| Application effects | Deliberate initialization/disposal         | No work after teardown                                 |

## Failure and recovery

The auth runtime source holds a feature response, changes accepted identity, then releases the old response. Assertions cover cancellation, removed private entries, and inability of the late result to repopulate the new lifetime. A neighboring scenario keeps queries when the accepted user is unchanged. Together they verify the boundary rather than assuming every session read should clear everything.

Avoid solving fixture leakage with broad module resets by default. Prefer factories and explicit owners; use module isolation only when the actual module contract requires it. A mock reset does not necessarily reset a store, and an empty DOM does not imply an empty QueryClient.

## Acceptance scenarios

Run the designed scenario with a new fixture and confirm its starting state is explicit. Change viewer while a read is pending: the previous scope cannot return. Refresh the same viewer: valid retained state is preserved. Create two API fixtures with controlled failure: one fixture's first failure does not consume the other's. Unmount and settle held work: no old owner accepts it. Verify production retry behavior through its policy tests instead of relying on retries disabled for fixture determinism.

Prefer real localized providers when language behavior is the subject; translation-key stubs are appropriate only for a narrower unrelated boundary and should not be presented as localization coverage.

## Avoid these shortcuts

Do not share one mutable QueryClient across unrelated cases, compose two caches accidentally, assume cleanup resets all global state, or mock the runtime factory whose identity policy is being tested. Fresh ownership makes the scenario's evidence interpretable.

## Sources and provenance

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/renderApp.tsx` — fresh client, optional runtime/router, and returned cache seam.
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/integration/auth/createAppAuthRuntime.test.ts` — fresh runtime composition and identity/late-response isolation.
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/app/data/query/createAppQueryClient.test.ts` — separate production retry contract assertions.
