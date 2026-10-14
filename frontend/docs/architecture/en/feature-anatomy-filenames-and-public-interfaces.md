# Feature anatomy, filenames, and public interfaces

Start compact, then expand when independent groups or repeated roles become
hard to scan.

## Grow from a compact owner

```text
src/features/development-guide/contacts/
├── index.ts
├── contacts.feature.ts
├── api/
├── components/
├── hooks/
└── models/
```

This is Contacts' shape, not a mandatory skeleton. Settings groups named
subcapabilities under `sections/`; a presentation-only feature needs no
`.feature.ts`; a feature without persisted or remote data needs no `api/`.

## Filename families

Common filename families are:

| Role                     | Convention                                                          |
| ------------------------ | ------------------------------------------------------------------- |
| React component/provider | `PascalCase.tsx`, providers end in `Provider.tsx`                   |
| Consumer hook            | `useName.ts` or `useName.tsx`                                       |
| API port                 | `<domain>.api.ts`                                                   |
| Adapter                  | `<domain>.api.<adapter>.ts`                                         |
| Query/mutation/keys      | `<domain>.query.ts`, `.mutation.ts`, `.querykeys.ts`                |
| Runtime factory          | `<feature>.feature.ts`                                              |
| Signal group             | `signals/<group>/sig<Group>{,.actions,.effects,.model,.service}.ts` |

## When a runtime factory is warranted

Add `<feature>.feature.ts` only when construction injects collaborators or
selects adapters for a stable feature runtime. Export the factory and runtime
type from `index.ts`, construct one frozen instance in `appFeatures.ts`, and
provide one feature-owned `hooks/use<Feature>Feature.ts` wrapper. Presentation
features do not acquire this machinery for symmetry.

## Keep the public interface deliberate

`index.ts` is the deliberate public interface. Export only what pages,
application composition, lifecycle registration, or an exceptional approved
feature dependency needs. Keep contexts and implementation helpers private.
Avoid aliases for the owned runtime hook because the checker verifies the
expected feature name and export.

Cross an owner with `@/features/<feature>` and stay relative within the feature.
If a public surface keeps growing, first ask whether callers are bypassing page
composition or whether the capability should be split.
