# From entry point to rendered application

`src/main.tsx` is the composition root. Its order is intentional because later
steps rely on earlier ones:

## Startup order

```text
validate environment
  → start development mocks when mock mode is enabled
  → hydrate Signals and start application effects
  → construct the immutable runtime
  → create the browser router
  → render App
```

## Configuration and development mocks

`loadAppConfig()` validates `import.meta.env` and production policy before
services are created. In development mock mode, `main.tsx` dynamically imports
`mocks/browser.ts` and awaits MSW startup. This prevents initial requests from
racing the mock worker and keeps mock code out of production startup.

## Signals, runtime, router, and render

`initSignalEffects()` hydrates all registered Signal modules before starting
any application-lifetime effects. Its disposer is registered with Vite hot
module replacement. Runtime construction then creates the Query client, Axios
instance, auth runtime, and any constructed feature runtimes. Router creation
happens once, outside React.

`App` receives the already-created router and runtime. It installs the render
error boundary and the ordered provider tree, then renders `RouterProvider`.
React components should not repeat startup work or recreate application-lived
services during rendering.

## Failure handling

The entire startup is guarded. A synchronous error or rejected top-level await
is reported through `reportStartupFailure()`, initialized Signal effects are
disposed, and `renderFatalStartupError()` replaces the root with a minimal
failure screen. Render-time failures are handled separately by
`AppRenderErrorBoundary` after React has started.

When adding startup work, decide whether it must finish before the first request
or render. Keep that work explicit and disposable; do not hide it in a provider
effect when ordering matters.
