# Feature inventory and responsibilities

The template ships four kinds of feature owners. They demonstrate different
shapes; they are not requirements for every application.

## Shipped feature shapes

| Feature      | Responsibility                                                                               | Runtime factory? | Optional example?                |
| ------------ | -------------------------------------------------------------------------------------------- | ---------------- | -------------------------------- |
| Contacts     | End-to-end contact UI, domain model, Query options, mutations, and async browser persistence | Yes              | Yes                              |
| Settings     | Presents preferences owned by app localization, theme, and shell                             | No               | Usually retained, but adaptable  |
| Patterns     | Development-only interactive recipes grouped by capability                                   | No               | Yes, by category or as a section |
| Architecture | Development-only source guide rendered from these Markdown articles                          | No               | Yes                              |

## Constructed and presentation features

Contacts has `contacts.feature.ts`, registration in
`src/app/bootstrap/runtime/appFeatures.ts`, and
`hooks/useContactsFeature.ts` because it constructs an adapter-backed runtime.
It is not evidence that every feature needs those files.

Settings is presentation and composition. Patterns categories contain
independent teaching implementations, while
`src/features/development-guide/patterns/gallery` owns the shared
preview/navigation presentation. Architecture owns the article renderer under
`src/features/development-guide/architecture`; Contacts lives under
`src/features/development-guide/contacts`. Shared documentation framing belongs
to the application shell documentation capability. Neither guidance section
should import a removable example implementation merely to describe it.

## Patterns categories

The shipped Patterns categories are Feedback, Overlays, Localization and
formatting, Application state, Server data, Routing and URL state, Forms, and
Tables and collections. Each category owns its pages, implementation, tests,
route-group metadata, and translations. The Application state category also
owns its development-only Signal registration and persisted example value.
Categories may be removed independently while the shared gallery and remaining
categories continue to work.

## Conditional folders and removal

Folders are conditional. A feature gains `api/`, `models/`, `signals/`,
`hooks/`, `components/`, `types/`, or `stories/` only when it owns that role.
A compact feature may need only `index.ts` and one implementation file. Empty
role folders and placeholder factories create misleading contracts. For
example, place that implementation at `components/FeatureSummary.tsx` rather
than at the feature root.

Before removing a teaching feature, trace its public export, pages, route and
navigation records, translations, tests, mocks, persistence keys, runtime or
Signal registration, and documentation links. Architecture remains usable
when Contacts or a Patterns category is removed; links to optional destinations
must be conditional rather than hard runtime dependencies.
