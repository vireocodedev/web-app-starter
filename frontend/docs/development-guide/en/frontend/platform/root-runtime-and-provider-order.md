# Keep runtime creation outside rendering and provider order dependency-driven

A provider tree is an ownership graph, not a list to reorder by taste. Localization supplies theme text/direction and feedback labels; authentication needs the shared query cache; pages consume the same runtime-created feature interfaces. Creating a second client or rebuilding runtime on a render splits those lifetimes.

This is **installed starter behavior**. Bootstrap creates runtime once after configuration/mock readiness and passes it to `App`. `createAppRuntime` builds QueryClient, HTTP/auth services, features, and fixed settings; `AppProviders` installs the ordered contexts around RouterProvider.

## Trigger and owner

Use the root seam when introducing an application-wide dependency or deciding whether a provider belongs at page scope. Runtime composition owns stable service instances. Providers adapt those owners to React and own their subscriptions/local presentation state. Features should consume their deliberate runtime interface rather than instantiate another cache or HTTP policy.

The runtime is returned in a frozen object, but freezing that object does not make QueryClient, stores, or service internals immutable. Their own interfaces retain controlled mutation. Nor does the return type imply a universal disposer for all services; lifecycle cleanup must be supplied by the owner that actually allocates work.

## Preserve dependency order

A simplified **map of the installed composition** is:

```text
render error boundary
  fixed settings
    localization
      localized theme (display/accessibility preferences inside)
        localized feedback
          runtime context
            shared QueryClient
              authentication
                router and route content
```

Fixed settings are available before locale/theme resolve deployment choices. Localization owns the current language and direction. The localized theme derives MUI locale options from that language. Feedback gets a translated close label. Authentication uses the runtime's auth service under its QueryClient provider. AppRuntimeProvider and QueryClientProvider point to the same runtime lifetime.

An extra provider can be added only where its dependency and disposal scope are clear. A page-local overlay owner belongs around that page's feature, not automatically around the entire application. A route-local draft should not become global merely because global composition is convenient.

| Change                  | Correct owner                       | Failure to avoid                         |
| ----------------------- | ----------------------------------- | ---------------------------------------- |
| API/client policy       | Runtime/data boundary               | One client per component                 |
| Locale switch           | Localization provider               | Recreate all runtime services            |
| MUI translated controls | Localized theme seam                | Independent conflicting theme root       |
| Page overlay sessions   | Page feature composition            | Survive unrelated page lifetime          |
| Auth query              | Shared runtime QueryClient          | Auth and page observing different caches |
| Render failure          | Outer provider-independent boundary | Recovery requiring failed contexts       |

## Failure and recovery

A provider that reads a missing required context should fail clearly; do not add a default fake runtime that conceals wrong composition. For standalone previews/tests, supply the deliberate minimal provider seam rather than reimplement production ownership invisibly.

Locale/theme changes should recompute presentation through memoized dependent values while preserving query/auth instances. Resetting the entire runtime to change language would lose cache, pending commands, and identity without an authorized lifecycle transition. Conversely, a true authenticated identity change has its own cache policy and should not be hidden as a visual rerender.

Bootstrap failure cleanup explicitly disposes initialized signal effects. The runtime factory shown here does not return a general teardown transaction for all resources. If adding sockets, workers, or long-lived listeners, define startup rollback and ordinary teardown rather than assume the provider tree will discover them.

## Acceptance scenarios

A feature and auth observe the intended shared QueryClient. Changing locale updates theme/feedback text without recreating API services. A page-local provider unmount ends its owned UI sessions. A missing provider is diagnosed instead of silently using a second singleton. A newly added dependency has an explicit owner, initialization prerequisite, and cleanup boundary. Provider-independent recovery still renders if a provider fails.

When reviewing composition, ask why each edge exists and which lifetime ends it. A short dependency explanation is more useful than a universal provider factory that makes the order opaque.

## Avoid these shortcuts

Do not create runtime in a component body, wrap every feature in another QueryClient, flatten provider order without reading dependencies, or promote local state globally. Stable owners and deliberate adaptation keep the root small.

## Sources and provenance

- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/main.tsx` — once-per-bootstrap runtime/router creation.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/runtime/createAppRuntime.ts` — service and feature composition.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/runtime/AppProviders.tsx` — dependency-ordered providers and localized adapters.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/App.tsx` — outer render boundary and RouterProvider.
