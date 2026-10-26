# Separate bootstrap failure from React render recovery

Configuration can fail before a React boundary exists. A provider can fail during rendering after bootstrap succeeded. An async command can reject in an event handler outside either render path. Give those failures distinct owners instead of expecting one error boundary to catch everything.

This is **installed starter behavior with explicit limits**. Bootstrap catches initialization failures and renders a provider-independent fatal screen. `AppRenderErrorBoundary` surrounds the application provider tree and renders the same recovery screen after a descendant render failure. Feature/API errors still belong to their command/query owner.

## Trigger and owner

Use bootstrap recovery for parsed configuration, awaited mock setup, synchronous signal initialization, and runtime/router/root creation inside the guarded startup block. Use the React boundary for descendant rendering failures covered by React's error-boundary contract. Use ordinary feature error state for expected validation, denial, conflict, or request failures.

Static module evaluation occurs before the guarded body, so a failed top-level import is not automatically caught by this startup try/catch. Likewise, a rejected click-handler promise is not transformed into a render failure merely because the component sits inside the boundary.

## Keep fallback independent

The installed **failure routing** can be summarized as:

```text
bootstrap failure -> development diagnostics -> signal cleanup -> fatal screen
React render failure -> boundary failed state -> fatal screen
expected command/query failure -> feature-owned message and recovery
```

`FatalErrorScreen` uses plain styles, text, a main heading, and a reload button. It focuses the heading after mount. It does not require theme, runtime, localization, feedback, or auth to be healthy. Its current text is fixed English. Do not claim the fatal path is localized by the normal provider tree that may have failed.

The startup renderer accepts only a root element, not the raw Error, and returns without rendering if no HTMLElement is available. This avoids showing technical details to the user; it also means a missing/unusable root has no guaranteed visible fallback from that helper.

| Failure                     | Appropriate recovery           | Unsupported inference                     |
| --------------------------- | ------------------------------ | ----------------------------------------- |
| Invalid config/mock startup | Fatal startup screen           | Healthy runtime can continue              |
| Descendant render exception | Boundary fallback              | Every async error is caught               |
| Validation/409/403          | Specific feature recovery      | Entire app must crash                     |
| Event-handler rejection     | Command owner handles it       | Render boundary automatically observes it |
| Missing root element        | External/host diagnosis needed | Fatal screen necessarily appears          |

## Reporting and cleanup limits

`reportStartupFailure` writes detailed local diagnostics only in development. Production reporting requires a separately sanitized adapter. The render boundary has an optional notification callback without raw error arguments, but the shown root `App` does not install a telemetry callback. Do not advertise a production reporting pipeline that is not wired.

Bootstrap stores the signal disposer and calls it on caught failure; HMR also registers it for normal module replacement. A render-boundary fallback does not itself dispose application signal effects or every runtime resource. If a new owner allocates listeners/workers, specify its own teardown policy.

There is another narrow limit: the startup catch calls the disposer before invoking the fallback, without a separate cleanup-error guard. A throwing disposer can therefore interrupt that catch path. The signal service deliberately reports cleanup failures, so a stronger “fallback always renders” promise requires explicit recovery orchestration beyond this source. Do not conceal that assumption in documentation.

## Failure and acceptance scenarios

Invalid public configuration yields development diagnostics and a safe recovery surface without leaking the raw error into UI. A failing provider renders the independent screen. Expected network/domain errors stay within their feature. Reload is an explicit full-application restart; it is not a retry of an uncertain write and must not be described as rollback.

Review missing-root, cleanup-throws, reporting-adapter failure, and async rejection separately if changing recovery orchestration. Preserve useful diagnostics while keeping private payloads, cookies, and credentials out of user-facing text and production logs. A successful fallback does not establish that the original task completed.

## Avoid these shortcuts

Do not localize fallback through broken providers, dump stack traces into the page, treat every feature failure as fatal, or claim universal catch/cleanup guarantees from one boundary. Recovery must survive the dependencies it is meant to replace.

## Sources and provenance

- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/main.tsx` — guarded initialization and cleanup-before-fallback sequence.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/failure/AppRenderErrorBoundary.tsx` — render failure state and optional report callback.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/failure/FatalErrorScreen.tsx` — independent English recovery, focus, and reload.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/failure/renderFatalStartupError.tsx` — root validation and raw-error-free renderer.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/failure/reportStartupFailure.ts` — development-only diagnostics.
