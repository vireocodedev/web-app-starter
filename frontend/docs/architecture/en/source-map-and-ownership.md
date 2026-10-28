# Source map and ownership

The application is organized by **owner**, not by file type. Start with the
capability responsible for a change, then choose the smallest role folder that
makes that capability easy to scan.

## Source roots

```text
src/
├── app/          stable application infrastructure and composition
├── features/     installed product capabilities (currently Settings)
├── pages/        route entries that compose public interfaces
├── main.tsx      startup and the application composition root
└── vite-env.d.ts Vite types and application build-time declarations
```

`src/app` owns infrastructure shared by the application: startup, validated
configuration, HTTP and Query setup, authentication, localization, routing,
shell presentation, theme, overlay view coordination, and browser-storage services. `src/features` owns
business behavior and feature UI. `src/pages` is deliberately thin: a page
assembles public feature or application interfaces for one route.

`src/app/forms` owns reusable form contracts, lifecycle helpers, and input
controls under `components/`. `AppSingleChoiceToggleGroup` renders controlled
single-choice options. Features supply values, translated labels, and layout,
and retain ownership of validation and persistence.

`src/app/overlays` coordinates views within a page-local overlay. Its controller
and `RgoOverlayProvider` must unmount together so no panel outlives its guard.
The isolated Contacts and overlay references in Storybook demonstrate the
provider's bottom drawer policy below the shell's 1024px breakpoint. The provider captures that
policy when each session opens, so resizing does not remount an active editor;
its saved presentation preference still applies to new desktop sessions.
Bottom drawers expose a grab handle that owns downward dragging; body scrolling
stays native. The private application handle also serves shell and Settings
navigation drawers. Published overlay drawers use their provider's private
mechanics and existing guarded close lifecycle. Temporary panels and bottom
drawers fill one raised surface; the table workspace gutter belongs only to
docked panels.

All teaching implementations and readers live outside the application:

```text
docs/storybook/examples/Contacts/
docs/storybook/patterns/<Category>/
docs/storybook/architecture/ArchitectureReference/
docs/storybook/handbook/Handbook/
docs/storybook/shared/documentation/
tests/storybook/
```

The Handbook catalog owns metadata and paired Markdown lookup for canonical
articles under `docs/development-guide/{en,hr}/`. Architecture reads the canonical
`docs/architecture/{en,hr}/` articles. Storybook owns their English readers and
shared Markdown presentation; production imports neither catalogs nor bodies.
There are no development-guide routes, redirects, navigation entries, namespaces
or example registrations in `src/`, even in development builds.

## Package, test, and mock owners

The reusable `@rgo-web/frontend` package is a separate owner. It supplies general
components and services; this application chooses their configuration and
combines them into product behavior. Do not move application policy into the
package merely because more than one application file uses it.

Top-level `tests/` mirrors production ownership for focused tests and contains
explicit `integration/` and `browser/` areas. Top-level `mocks/` contains the
development MSW boundary and deterministic auth fixtures. Neither belongs in
production `src/`.

Storybook tutorials, CSF stories and preview support live outside `src/`, under
`docs/storybook/<section>/<Tutorial>/`; each tutorial has a same-name folder and
section-wide helpers use `shared/`. The `docs/storybook/README.md` entry point
routes architecture and tutorial reading by the task's affected contracts. Documentation grouping
does not merge the production capabilities it demonstrates.

## References and stable infrastructure

Contacts is a complete documentation reference, not an installed product feature.
Its live preview selects an injected memory adapter and private Query client; its
browser-storage adapter is inert unless a test explicitly constructs it. Settings
presents application preferences. Production `appFeatures.ts` and
`signalModules.ts` registries are empty until a consumer deliberately installs a
feature or lifecycle module. Stable infrastructure remains in `src/app/`.

Production source must not import or re-export anything under `docs/` or
`.storybook/`, including raw Markdown and literal dynamic imports or globs.
Documentation and tests may consume installed source through its allowed APIs.

## Avoid ownerless code

Do not create `src/shared`, `src/common`, or `src/utils`. A reused helper still
needs a responsible capability and a narrow interface. If ownership is unclear,
name the behavior and its lifecycle before adding a directory.
