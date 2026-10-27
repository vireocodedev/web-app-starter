# Feature inventory and responsibilities

The application ships Home, Settings, authentication and generic infrastructure.
All teaching features and article readers live in Storybook, outside `src/`.

## Installed and reference owners

| Owner                         | Location                                             | Responsibility                                                  | Production runtime factory? |
| ----------------------------- | ---------------------------------------------------- | --------------------------------------------------------------- | --------------------------- |
| Settings                      | `src/features/settings/`                             | Presents app-owned localization, theme and shell preferences    | No                          |
| Home and authentication pages | `src/pages/`, `src/app/auth/`                        | Application entry and session boundaries                        | Auth is app infrastructure  |
| Contacts                      | `docs/storybook/examples/Contacts/`                  | Complete reference UI, domain model, API port and Query options | No production registration  |
| Patterns                      | `docs/storybook/patterns/<Category>/`                | Focused interactive examples and shared gallery                 | No                          |
| Architecture reference        | `docs/storybook/architecture/ArchitectureReference/` | Reader/catalog for canonical architecture Markdown              | No                          |
| Handbook                      | `docs/storybook/handbook/Handbook/`                  | English reader/catalog for paired fullstack articles            | No                          |

## Constructed and presentation features

The production registry `src/app/bootstrap/runtime/appFeatures.ts` is empty.
Settings composes owner hooks and requires no factory, API or runtime lookup.
Contacts demonstrates a real factory with injected API and Query dependencies,
constructed only by its isolated preview. Its hook reads a private reference
Context, not a production `useAppFeature("contacts")` member. The live preview
selects memory data; its browser-storage adapter is retained as an inert tested
reference. Installing a consumer feature requires explicit implementation,
adapter choice, runtime registration and a canonical typed lookup wrapper.

The Patterns categories are Feedback, Overlays, Localization and formatting,
Application state, Server data, Routing and URL state, Forms, and Tables and
collections. Each owns its reference panels and tests. Application state creates
private Signals and memory storage with preview-owned cleanup; the production
Signal registry is empty. Shared Markdown rendering belongs to
`docs/storybook/shared/documentation/`, and shared gallery presentation remains
under `docs/storybook/patterns/shared/`. No reader or catalog is an app dependency.

## Conditional folders and removal

Folders are conditional. A feature gains `api/`, `models/`, `signals/`, `hooks/`,
`components/` or `types/` only when it owns that role. A compact feature may need
only `index.ts` and `components/FeatureSummary.tsx`; empty role folders and
placeholder factories create misleading contracts.

Tutorials and preview support use section and same-name folders under
`docs/storybook/`, with section-wide helpers in `shared/`. Production source may
not import docs or Storybook configuration, even through raw imports or globs.

Before removing an installed feature, trace public exports, pages, routes,
navigation, translations, tests, mocks, persistence keys, runtime construction and
Signal registration. Removing a documentation example instead affects only its
Storybook consumers, reference tests and guidance. Keep canonical article bodies
and immutable pinned source provenance when reorganizing their readers.
