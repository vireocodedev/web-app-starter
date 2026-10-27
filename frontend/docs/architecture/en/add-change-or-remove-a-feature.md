# Add, change, or remove a feature

Use this order so ownership and cleanup remain visible.

## Add

1. Name the capability and its public consumers. Create
   `src/features/<feature>/index.ts` with only deliberate exports.
2. Add only needed role folders. Define models and schemas before adapters; keep
   transport types out of the API port.
3. If construction injects collaborators, add `<feature>.feature.ts`, export its
   factory/runtime type, register it in `appFeatures.ts`, and add the owned
   `use<Feature>Feature` hook. Otherwise do not add runtime scaffolding.
4. If Signals need application-lifetime hydration/effects, export one lifecycle
   module and register it in `signalModules.ts`.
5. Add thin pages, route records, navigation metadata, both locale translations,
   and any persistence schema/defaults.
6. Add mirrored tests and integration/browser coverage proportional to risk.
   Add stories for reusable visual states.
7. Update Architecture guidance when the change alters a convention or shipped
   inventory. Link to a Pattern rather than duplicating an interactive recipe.

## Change

Trace the public interface and every registration before moving files. Preserve
stable exports unless a migration is intentional. Change one owner at a time,
update adapters and tests with the contract, and run the architecture check
after import or naming changes.

## Remove

Delete the feature implementation and its mirrored tests, then remove pages,
routes, navigation metadata, translations, mocks, persistence keys, runtime
construction, Signal registration, stories, and documentation links. Search
for the public feature name and route ID after deletion. Keep generic
infrastructure that remaining features still use.

Documentation examples live only under `docs/storybook/`, with reference tests
under `tests/storybook/`. Removing a reference category affects its Storybook
readers, gallery, reference tests and guide links; it cannot remove an application
registration because none is installed. Keep shared docs rendering and canonical
article bodies when only one example is removed. After an application removal,
verify startup, direct URLs, navigation, Not Found behavior and both locales.
