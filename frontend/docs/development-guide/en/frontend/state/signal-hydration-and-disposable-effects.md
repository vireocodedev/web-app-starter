# Hydrate all signal groups before starting disposable effects

A persistence effect can overwrite saved data with defaults if it starts before hydration. Application signal effects also need one restartable lifetime so HMR or repeated initialization cannot leave duplicate subscriptions. Register synchronous modules and let the lifecycle owner coordinate their order and disposal.

This is **installed starter integration with the RGO lifecycle contract**. The starter delegates to `createRgoSignalEffectsService`; its registry currently includes development examples only in DEV. The library implementation at the cited pin supplies explicit startup, rollback, and generation-scoped disposal semantics.

## Trigger and owner

Use this lifecycle for synchronous application-wide signal groups, not arbitrary async jobs or component-only effects. A module owns its source state, hydration, effect acquisition, and returned cleanup. The registry owns which modules belong to the application. Bootstrap starts the lifecycle and registers its disposer with HMR.

The factory validates and snapshots callback references without running hydration/effects. Initialization first calls every hydrate callback in registry order, then starts every effect in the same order. This prevents an early group's effect from observing another group's unhydrated defaults.

## Respect the synchronous contract

This **minimal contract illustration** uses the installed factory shape:

```ts
const lifecycle = createRgoSignalEffectsService([
  { hydrate: restorePreferences, initEffects: startPreferencePersistence },
]);
const dispose = lifecycle.initialize();
// startPreferencePersistence returns a synchronous cleanup function.
// Async loading belongs to another explicitly owned boundary.
```

Hydrate, initialize, and cleanup must be synchronous. Thenables are rejected; `initEffects` must return undefined or a cleanup function. Rejecting an async callback does not magically cancel work that callback already launched. Do not start fire-and-forget requests in hydration and claim the registry awaited them.

Initialization while active returns the existing disposer instead of starting effects twice. Initialization during startup or disposal throws. The returned disposer is idempotent and tied to its generation: an old disposer cannot stop a later restarted generation. Those are library guarantees at this source pin, not properties to recreate with page-level refs.

| Failure or transition       | Lifecycle behavior                       | Module responsibility                                                |
| --------------------------- | ---------------------------------------- | -------------------------------------------------------------------- |
| Hydration fails             | No effects start                         | Previously hydrated state is not automatically rolled back           |
| Effect startup fails        | Earlier returned cleanups run in reverse | Clean up resources acquired before the failing callback could return |
| Explicit disposal           | Every cleanup attempted in reverse       | Synchronous release of owned resources                               |
| One cleanup fails           | Failure reported after cleanup attempts  | Caller decides recovery/reporting                                    |
| Several cleanups fail       | AggregateError                           | Preserve actionable diagnostics                                      |
| Reinitialize after disposal | New generation may start                 | State/hydration remains valid for restart                            |

## Startup rollback is not universal rollback

The service can dispose only cleanup functions that modules successfully returned. If a module acquires a listener and throws before returning its disposer, that module needs its own failure-safe acquisition logic. Likewise, hydration mutates source state; the service does not restore a previous snapshot after a later hydration fails.

When both startup and rollback cleanup fail, the library aggregates the failures. Bootstrap must therefore handle cleanup errors deliberately if it promises a visible fallback. Do not swallow them silently or assume every caller is protected automatically.

The starter's Estimate module demonstrates a bounded effect: it reads source signals, writes the typed storage value, and reports saved/unavailable status without reverting valid live changes. It persists source values rather than a second stored computed total.

## Lifetime and acceptance scenarios

The entrypoint initializes outside React rendering, saves the disposer, registers it with HMR, and calls it on a caught startup failure. A component render boundary does not automatically own that application lifetime. Component subscriptions should stay with their component owner instead of being promoted to this registry.

Verify all hydration precedes any persistence. Repeated active initialization must not duplicate writes. Disposal stops later persistence, attempts every cleanup, and cannot affect a later generation when called again. A failing starter rolls back prior effects, while the failing module releases its own partially acquired work. Development-only examples stay conditional; production modules are added deliberately through their feature interface.

## Avoid these shortcuts

Do not initialize effects during render, mix async hydration into a synchronous registry, assume hydration is rolled back, or ignore disposers because the page reloads eventually. Lifecycle guarantees are useful only when every module honors its acquisition boundary.

## Sources and provenance

- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/signals/initSignalEffects.ts` — delegation and application initializer.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/signals/signalModules.ts` — DEV registry ownership.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/main.tsx` — bootstrap/HMR disposal boundary.
- `RGO/frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:src/services/RgoSignalEffectsService/RgoSignalEffectsService.ts` — synchronous lifecycle, rollback, errors, and generation semantics.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/features/development-guide/patterns/applicationState/signals/estimate/sigEstimate.effects.ts` — bounded source-value persistence and saved/unavailable effect.
