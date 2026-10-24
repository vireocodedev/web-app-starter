# Runtime, providers, and lifetimes

Choose a lifetime before choosing Context, a Signal, or local state.

## Lifetime table

| Lifetime        | Owner and construction                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------- |
| Application     | Created once in `main.tsx` or startup modules; disposed on startup failure or HMR when applicable |
| Feature runtime | Created once by `createAppFeatures()` and exposed through one typed feature hook                  |
| Route           | Created by a route element or loader and discarded when that route leaves                         |
| Component       | Created by the closest component and cleaned up by its effect                                     |

## Application and feature runtimes

`createAppRuntime()` constructs stable infrastructure and freezes the returned
object. It creates one Query client, one configured Axios instance, the auth
runtime, and the feature registry. Contacts needs this construction seam because
its Query and mutation options depend on an injected API adapter and Query
client. Settings, Patterns, Architecture, and Handbook are presentation features and do
not receive factories or runtime hooks merely for uniformity.

## Provider order

The complete application-wide composition is:

```text
AppRenderErrorBoundary
└─ AppProviders
   └─ AppFixedSettingsProvider
      └─ AppLocalizationProvider
         └─ Localized AppThemeProvider
            └─ Localized RgoFeedbackProvider
               └─ AppRuntimeProvider
                  └─ QueryClientProvider
                     └─ AppAuthProvider
                        └─ RouterProvider
```

`App` owns the outer render-error boundary and delegates provider composition
to `AppProviders`. Provider order reflects consumption: localization and theme
read fixed deployment policy; theme needs the selected locale and direction;
feedback needs translations; auth needs the runtime and Query client. RGO
supports LTR only, so locale changes do not introduce an RTL provider mode.

## Provider placement and typed lookup

Place providers as close as possible to their consumers. Application-wide
services belong above the router only when most routes need them or their
lifetime must survive route changes. A feature- or route-specific provider
belongs within that feature or route. Component state should remain local.

Only a feature-owned `hooks/use<Feature>Feature.ts` wrapper may call the generic
`useAppFeature()` lookup, and that wrapper must be exported by the feature's
public index. This keeps the runtime key and failure behavior behind a typed
feature interface.

Do not use provider ordering to create hidden dependencies. Inject collaborators
at construction time or expose an explicit public hook at the correct owner.
