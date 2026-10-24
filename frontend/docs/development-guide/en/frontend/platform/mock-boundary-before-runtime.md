# Finish mock transport setup before runtime can send requests

Development fixtures must be ready before authentication, queries, or React can make the first request. Starting a worker in a page effect creates a race: startup requests can escape to a real server or fail before interception exists. Put mock readiness in the bootstrap dependency chain.

This is **installed starter behavior**. `main.tsx` validates configuration, conditionally imports and awaits the development mock worker, then initializes signal effects, runtime, router, and React. The worker module returns deliberate login assistance; production build validation separately rejects mock API mode.

## Trigger and owner

Use this boundary when adding development HTTP fixtures or diagnosing a request that only fails on first load. Bootstrap owns whether fixtures are permitted and when transport becomes ready. Mock modules own handlers and synthetic session state. Feature APIs keep the same HTTP contract rather than importing mock stores directly.

The condition requires Vite DEV and parsed `VITE_API_MODE === "mock"`. It is not enough to set an application environment label. The dynamic import keeps this fixture module outside ordinary production composition. Do not add another unconditional mock import inside a runtime factory or route.

## Preserve the startup sequence

This neutral **sequence illustration** describes the installed order:

```text
validate public config
if DEV and mock:
  restore synthetic auth fixture
  await worker.start()
  retain explicit login-assistance metadata
initialize synchronous signal lifecycle
create runtime and router
render application
```

The worker's unhandled-request callback identifies the configured API origin and base path. An unhandled request inside that boundary is reported as an error; unrelated assets/origins are not treated as missing API fixtures. This is more useful than universally silencing requests or mocking every browser request with a success response.

A base path check matters: `/api` and `/api/...` belong to that boundary, while a coincidentally similar path should not be captured merely by an unsafe text prefix. Keep handler construction tied to the validated API base.

| Condition                             | Bootstrap response                          |
| ------------------------------------- | ------------------------------------------- |
| DEV + mock                            | Await worker before runtime                 |
| DEV + HTTP                            | Create normal HTTP runtime without fixtures |
| Production build + mock configuration | Reject configuration before runtime         |
| Worker startup rejects                | Follow fatal startup recovery               |
| Unknown request in owned API scope    | Report missing fixture                      |
| Login assistance supplied             | Pass typed metadata into auth runtime       |

## Failure and lifetime limits

Do not catch worker failure and continue as if interception succeeded. The first real request would then exercise a different system from the selected mode. Show provider-independent startup recovery and actionable development diagnostics instead.

The inspected helper starts the worker but does not return its stop/dispose handle. Bootstrap therefore demonstrates readiness, not a complete application-controlled worker restart/teardown protocol. If a future host can swap runtime modes without reloading, add an explicit owner for stopping the old worker and its state; do not assume React unmount provides that behavior.

Mock session restore and demo login assistance are development conveniences. They must not become production identity evidence, fallback authorization, or a reason to accept missing backend behavior. A frontend fixture proves the UI/adapter contract it simulates, not real server persistence or security.

## Acceptance scenarios

The first auth read occurs only after worker readiness. A failed worker start prevents runtime creation. An unhandled API endpoint is visible rather than silently succeeding. Switching configuration to HTTP removes fixture setup from that startup path. A built mock configuration is rejected. Feature code remains unaware of mock-store internals, and login hints arrive only through the explicit runtime option.

When debugging, record selected mode, validated public API scope, and readiness failure without logging session secrets. Keep mock data synthetic and bounded; copied customer records are unnecessary to demonstrate a contract.

## Avoid these shortcuts

Do not initialize mocks in a page effect, start requests before awaiting readiness, swallow all unhandled API calls, import fixture stores into business features, or equate mock mode with backend evidence. Startup ordering is part of the transport contract.

## Sources and provenance

- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/main.tsx` — conditional awaited mock setup before runtime/render.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/mocks/browser.ts` — fixture restore, scoped unhandled API reporting, and returned assistance.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/config/loadAppConfig.ts` — built mock-mode rejection.
