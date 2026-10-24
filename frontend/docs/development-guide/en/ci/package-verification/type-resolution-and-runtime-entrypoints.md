# Verify emitted types and runtime entrypoints from the consumer side

Check what TypeScript and Node resolve from the packaged artifact, not only what the library's own compiler accepts. Source aliases, nested peer installs and ambient declarations can hide defects that appear immediately in a real consumer.

**RGO package checks plus Vireo declaration-check reference.** The starter consumes RGO's single root API. The peer Vireo source exposes its own declared package subpaths and a separate strict emitted-declaration gate. Their export and compiler policies are not interchangeable.

## Trigger, owner and invariant

Use when types work in the library but fail in an app, a runtime import is missing or package augmentation depends on a maintainer tsconfig. The library owner owns exports, emitted declarations, peers and environment promises. The application owns its compiler/configured dependency graph.

The invariant is alignment among supported runtime exports, type exports and the files actually shipped. Consumer checks must not resolve back into source through a private alias to make a defective artifact pass.

## Inspect the actual export map

The RGO snapshot is ESM-only with one `.` export: types at `dist/index.d.ts` and runtime import at `dist/index.js`. It has no supported deep imports or runtime default export. The package verifier checks root namespace equality against explicit source export inventory and requires deep imports to fail for the correct reason.

```text
consumer package specifier
       -> package exports
       -> emitted .d.ts for TypeScript
       -> emitted ESM for Node/bundler
       -> public behavior / documented environment limits
```

A filename under `dist` does not make a deep path public. Conversely, Vireo's packages may intentionally declare subpaths; applying RGO's root-only rule to that reference would reject valid APIs.

## Prevent resolution from lying

The RGO maintainer typecheck-resolution helper resolves imports from template source and asserts selected dependencies land at the intended root declarations rather than nested template installs. This is maintainer configuration evidence, not a path map consumers should copy.

Its packed verifier walks reachable declarations, rejects leaked internal `@/` references, checks the shipped inventory and compiles a strict NodeNext consumer. Importantly, that consumer uses `skipLibCheck: true` at this snapshot. “Strict consumer” therefore does not mean every emitted declaration is fully checked with library checking enabled.

It also executes package-root runtime/SSR checks and browser-specific fixtures where meaningful. A passing type program alone cannot establish safe Node import, lazy browser access or runtime export presence.

## Add the stronger declaration layer deliberately

The Vireo reference reads every declared export's `types` target from built `dist`, then uses separate package-level TypeScript programs with `strict: true` and `skipLibCheck: false`. Its worker reports package-dist diagnostics plus compiler-level failures, preventing another package's ambient declarations from masking that package's output errors.

A schematic compiler intent is:

```json
{
  "strict": true,
  "skipLibCheck": false,
  "noEmit": true
}
```

This is reference guidance, not the current RGO verifier setting. The worker's diagnostic scope is its package output; it is not a proof of every external dependency's declarations or every consumer compiler/resolution mode.

Common failures include an emitted reference to an unshipped augmentation, an expanded private unique-symbol brand or an `@ts-expect-error` that only suppressed a source problem. Building source under a permissive app config can leave these invisible.

## Keep peer and runtime evidence separate

One compatible React/MUI instance avoids identity/type duplication; declared lower peer bounds need their own admitted evidence rather than assumptions from the maintainer's latest installed version. RGO checks its peer support contract and externalizes shared runtime dependencies.

Package-root SSR safety means imports avoid eager browser globals. Browser-specific calls still need their documented unavailable-facility/cleanup behavior. A Node import pass does not prove interactions, and a browser story pass does not prove an external strict type consumer.

These are complementary checks with different input identities. Use the packed/published artifact, record actual compiler mode and keep local linked-peer limitations visible.

## Failure and decision table

| Observation                                       | Decision                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------------ |
| Consumer needs a private alias                    | Fix emitted declarations/exports rather than patch every app.            |
| Runtime symbol absent but type export exists      | Repair public inventory/runtime alignment.                               |
| Source compiles, emitted `.d.ts` fails            | Inspect build output and augmentation/brand ownership.                   |
| Verification says strict but skipLibCheck is true | Report the actual limitation; add a reviewed stronger layer if required. |
| Deep import happens to exist                      | Use only admitted export-map paths.                                      |
| Node import touches window eagerly                | Move environment access behind the documented lazy boundary.             |

## Acceptance and inspection

Record packed identity, export inventory, resolved declaration paths, compiler options, peer graph and actual runtime/SSR/browser scenarios. State which declaration diagnostics and environments were covered.

The article executes no typecheck, import smoke, package build or peer upgrade. Maintainer owners define the actual gates and their release authority.

## Source provenance

- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:package.json`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:docs/platform/PUBLIC_MODULE_CONTRACT.md`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:scripts/package/verify-package.mjs`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:scripts/package/verify-typecheck-resolution.mjs`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:scripts/package/declaration-graph.mjs`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:scripts/strict-consumer-types.mjs`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:scripts/strict-consumer-types-worker.mjs`
