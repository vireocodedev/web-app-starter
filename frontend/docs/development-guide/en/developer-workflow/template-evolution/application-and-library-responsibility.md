# Keep application policy outside reusable library mechanics

Decide whether a behavior belongs in a published runtime module, a template convention or the application itself before extracting code. Similar JSX or multiple callers is not sufficient admission evidence for a new platform API.

**Installed RGO boundary with reference classification guidance.** The current app's feature/shell instructions define consumer ownership. The RGO `PUBLIC_MODULE_CONTRACT` governs changes inside the separate library repository. Vireo projection concepts are related reference vocabulary, not a replacement application API.

## Trigger, owner and invariant

Use when two pages share a visual pattern, a feature wants to move logic into the package or a generator duplicates application conventions. The application owner retains domain values, validation, localization and persistence. The library owner owns admitted application-neutral mechanics and their public lifecycle/accessibility contract.

The invariant is a meaningful smaller interface that hides real complexity without taking over product decisions. A pass-through wrapper, shorter import or speculative future reuse does not justify a new published module.

## Classify the candidate first

The RGO contract offers four outcomes:

| Classification             | Appropriate responsibility                                                |
| -------------------------- | ------------------------------------------------------------------------- |
| Published runtime module   | Reusable mechanics with admission evidence and a stable public interface. |
| Recipe/template convention | Composition or source organization that applications adapt.               |
| Consumer-owned feature     | Business rules, domain state, permissions and workflow.                   |
| Rejected extraction        | Existing React/MUI/platform composition is sufficient.                    |

A published module needs a real use plus a concrete second consumer or platform-wide policy. It must pass leverage and deletion tests: callers receive meaningfully simpler behavior, and deleting it would redistribute substantive complexity rather than merely remove a wrapper.

That admission process applies to library changes, not every local component extraction. The normative library contract requires an explicitly approved public-module proposal before implementation and renewed approval for material public changes. Reading this article is not that approval or authority to edit another repository.

## Work through one concrete boundary

A reusable grouped navigation list can own row interaction, semantic structure, focus behavior and visual grouping. The application supplies labels, icons, destinations, group names and availability. It should not learn product routes or business permissions by importing a registry.

A form capability can own field mechanics and submission presentation while the application owns its Zod schema, translated messages, mutations and transport conversion. A storage service can validate data through an injected complete schema without deciding which business fields should persist.

```text
application: values / rules / translations / configured collaborators
                           |
                  narrow public library input
                           |
library: mechanics / accessibility / lifecycle / stable customization
```

## Public contracts include behavior, not only types

RGO consumers import through the package root. Public owners have deliberate named runtime/type exports and matching metadata; private internals are not supported entrypoints. Visible labels and accessible names normally come from consumers. A narrowly recorded legacy fallback exception does not authorize new package-owned product copy.

Defaults, callback ordering, cancellation, cleanup, error behavior, environment limits and customization precedence are public obligations. A supposedly private rewrite that changes one of these can still break consumers.

The library uses MUI-based composition under its own styling/slot contract. Do not apply a different peer framework's authoring convention without checking this owner's source. The app's broader architecture and feature state remain separate concerns.

## Failure and decision table

| Observation                                     | Decision                                                          |
| ----------------------------------------------- | ----------------------------------------------------------------- |
| Helper only renames a MUI prop                  | Prefer existing composition unless substantive behavior is owned. |
| Shared module needs product route inventory     | Keep policy in app composition; pass narrow data.                 |
| Package wants domain validation rules           | Inject the schema or keep behavior with the feature.              |
| Public types compile but callback order changed | Review compatibility as a behavioral API change.                  |
| Proposed new runtime dependency                 | Separate explicit library approval is required by its contract.   |
| Peer module looks reusable but absent here      | Treat as reference and map collaborators before adoption.         |

## Acceptance and inspection

Record classification, real consumers/policy, hidden complexity, public exports, state owner and lifecycle/failure behavior. Check both library proof and an application consumer when a public API is intentionally changed, under the relevant authorization.

Current owner guidance remains authoritative. This page creates no public module, dependency, proposal approval or cross-repository change.

## Source provenance

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/AGENTS.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/docs/architecture/en/source-map-and-ownership.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/docs/architecture/en/dependency-boundaries-and-imports.md`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:docs/platform/PUBLIC_MODULE_CONTRACT.md`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:src/index.ts`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:README.md`
