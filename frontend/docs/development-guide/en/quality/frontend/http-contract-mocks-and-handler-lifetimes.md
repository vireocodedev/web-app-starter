# Mock HTTP at the transport boundary with bounded handler lifetimes

When the behavior is request construction, schema validation, CSRF sequencing, or response classification, keep the real application client and intercept HTTP. Replacing the feature API with a resolved function would remove the contract the scenario needs to inspect.

This is an **installed starter pattern**. The MSW server starts with no default handlers, rejects unhandled requests, resets scenario overrides after each test, and closes after the suite. Authentication API tests install only their scenario's endpoints and keep the real Axios/application API factories. These are source examples, not an execution report.

## Trigger and ownership

Use transport interception for HTTP adapter contracts and selected assembled frontend flows. The test owns handlers, synthetic responses, held requests, and any mutable mock store. The application owns serialization, headers, parsing, and error mapping. A mock server cannot prove the real backend authorizes or persists correctly; pair that need with backend HTTP/database scenarios.

The starter setup calls `listen({ onUnhandledRequest: "error" })`, React cleanup, `resetHandlers`, and `close` at their respective lifetimes. Handler reset removes overrides; it does not automatically reset arbitrary state held by a fixture. The auth tests explicitly reset their mock session store after each case.

## Inspect the request that actually leaves the client

This is **inert neutral scenario code**, not a newly installed handler:

```ts
let writes = 0;
server.use(
  http.post("https://api.example.invalid/documents", async ({ request }) => {
    writes += 1;
    const body = await request.json();
    expect(body).toEqual(expectedCommand);
    return HttpResponse.json({ id: "document-example" });
  }),
);

// Call the real feature HTTP adapter, then assert outcome and writes.
```

Keep response shape realistic enough for the actual schema parser. A malformed-response scenario should deliberately exercise that parser rather than casting the payload to the desired type. A rejected-response scenario should preserve the expected status and body contract, not throw an unrelated JavaScript error unless network failure is the subject.

The installed auth API suite increments token responses and checks the token header on login, logout, and another mutation. It also counts login requests after CSRF failure and expects zero. This verifies sequencing and forbidden submission, not merely that both endpoints were mentioned in test setup.

| Scenario                   | Transport evidence        | Expected client outcome                     |
| -------------------------- | ------------------------- | ------------------------------------------- |
| Anonymous session          | 401 response              | Null session under auth contract            |
| Invalid credentials        | Login rejection           | Domain-specific credentials error           |
| Unavailable server         | 503 response              | Not mislabeled credentials                  |
| CSRF fetch fails           | No protected POST follows | Preserve actual acquisition failure         |
| CSRF shape invalid         | Runtime schema rejects    | No unprotected mutation                     |
| Unknown endpoint requested | No handler                | Fail visibly instead of accidental fallback |

## Failure and cleanup

Use per-scenario overrides for one endpoint rather than broad catch-all success responses. A catch-all returning valid-looking data can hide unexpected fetches and wrong paths. Keep origins and methods precise; encoding, credentials, and content type belong to the contract where relevant.

For a held response, expose a started signal and explicit release instead of sleeping. Ensure the test settles or cancels the held work in cleanup, even if an assertion fails. Handler reset alone does not resolve an already awaited promise.

Be careful when shared mock handlers reuse production serialization helpers: that can keep fixtures aligned but also share a bug between producer and expectation. Assert important independent request facts, response field limits, or rejected malformed shapes rather than trusting round-trip agreement alone.

## Acceptance scenarios

An unexpected path fails because it has no handler. A malformed payload reaches the real schema parser. Failed CSRF causes zero protected writes. A 503 remains distinct from wrong credentials. Resetting overrides restores a neighboring scenario's intended handlers, and resetting its mutable store clears prior login state. Releasing a late response after owner change cannot repopulate an obsolete lifetime.

Keep fixtures synthetic and avoid real account data or credentials. Error diagnostics should identify request method/path and scenario intent without dumping sensitive headers or payloads.

## Avoid these shortcuts

Do not mock the client whose serialization is under test, install a universal success handler, assume handler reset clears store state, or treat mock-backend success as server persistence evidence. Match the mock boundary to the claim.

## Sources and provenance

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/server.ts` — empty scenario-owned MSW server.
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/setup.ts` — unhandled-request failure and handler/server lifetimes.
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/integration/auth/api/appAuth.api.springSession.test.ts` — real client/API factories, request headers/counts, malformed responses, and store reset.
