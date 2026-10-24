# Give generated application code a different lifetime from indexes

Separate code a developer adopts from mechanical artifacts a generator can reproduce. A generated marker is provenance, not unlimited permission to overwrite customization or an already-applied database migration.

**Vireo reference recipe, not an installed generator in this RGO starter.** Vireo's generated-code ownership article and `entity-generator.ts` implement this distinction. Apply the ownership idea only through a separately designed integration; the commands and `.vireo` metadata are not existing starter capabilities.

## Trigger, owner and invariant

Use when designing a generator, adopting generated feature code or deciding whether regeneration may change a file. The application owns adopted business code and forward schema evolution. The generator owns reproducible indexes/contracts and the manifest that records its emitted surface.

The invariant is explicit ownership plus drift detection. Identical input produces no writes. Customized or unmanaged content is not silently replaced. Generation does not rewrite an adopted production migration to make source match a new schema.

## Distinguish the two classes

| Class in the Vireo reference | Responsibility                                                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `generated-once`             | Migration, backend/frontend vertical slice, translations, stories/tests and capability docs become ordinary application-owned code. |
| `regenerated`                | Schemas, contracts, generation manifests and capability indexes contain mechanical data, not business logic.                        |

This is a regeneration lifetime classification, distinct from Template projection categories such as managed/application-owned/optional. One label cannot substitute for the other contract.

The generator records path, ownership, role and SHA-256 alongside schema/wire-contract digests. It classifies current files before writing, includes obsolete generated paths in its plan and detects changes against prior manifest evidence. A generated-once comment does not prove the current bytes remain unchanged.

```text
schema + prior manifest + current files
                |
       render and classify complete plan
                |
  unchanged / create / update / customized / obsolete
                |
     refusal or explicitly reviewed write plan
```

## Treat refusal as useful evidence

The source rejects unmanaged collisions (`VIR-GEN-003`), changed schema/removal without force (`VIR-GEN-004`) and customized managed content without the combined overwrite path (`VIR-GEN-005`). Safe path checks reject escapes and symlinked managed locations.

Dry-run/diff and standalone output are inspection modes. The force/accept-overwrite combination is an explicitly destructive path for unadopted local generation, not a recommended upgrade technique for an applied migration. Do not include those switches in a routine “fix generator” recipe.

For adopted features, edit application code and add a new forward Flyway migration. If the canonical generation contract no longer describes the feature, the reference's ejection path retains generated-once code while removing generator registration/manifest ownership and changing markers.

Ejection is not deletion of application behavior. It also does not imply an automatic data rollback. Application routes, persistence and business acceptance remain the consumer's responsibility after the generator leaves.

## Keep upgrade and regeneration separate

A supported Vireo project upgrade can admit declared existing manifests without regenerating them, preserving applied code/migration bytes. A later generation with the current generator is a new reviewed change subject to its schema rules.

That narrow declared-edge behavior must not become “any old manifest is supported.” Version allowlists, contract-critical hashes and raw schema/wire digests are checked by the actual reference tooling. This starter has no such guarantees merely because the guide describes them.

## Failure and decision table

| Observation                                       | Decision                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------- |
| Business logic appears in a regenerated index     | Move it to application-owned source before regeneration.                |
| Generated-once file was customized                | Preserve it; inspect drift and choose adaptation/ejection deliberately. |
| Schema changed after migration applied            | Add forward migration, never rewrite history through regeneration.      |
| Identical rerun changes files                     | Investigate determinism/formatting/manifest input.                      |
| Unmanaged path collides                           | Refuse and inspect separate output rather than overwrite.               |
| Upgrade claims every historical generator version | Require exact declared-edge/manifest evidence.                          |

## Acceptance and inspection

Record schema/contract identity, complete path classification, current hashes, proposed writes/deletions and application-owned adaptations. Confirm no business logic lives in reproducible metadata and no applied migration is rewritten.

This is design guidance grounded in a peer implementation. No generator, ejection, overwrite or upgrade command executes here.

## Source provenance

- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:docs/architecture/generated-code-ownership.md`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:packages/create-vireo/src/entity-generator.ts`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:packages/create-vireo/src/project-upgrade.ts`
