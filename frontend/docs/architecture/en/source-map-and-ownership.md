# Source map and ownership

The application is organized by **owner**, not by file type. Start with the
capability responsible for a change, then choose the smallest role folder that
makes that capability easy to scan.

## Source roots

```text
src/
├── app/          stable application infrastructure and composition
├── features/     product capabilities and removable teaching examples
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
The Contacts and Development Guide overlay hosts enable the provider's bottom
drawer policy below the shell's 1024px breakpoint. The provider captures that
policy when each session opens, so resizing does not remount an active editor;
its saved presentation preference still applies to new desktop sessions.
Bottom drawers expose a grab handle that owns downward dragging; body scrolling
stays native. The private application handle also serves shell and Settings
navigation drawers. Published overlay drawers use their provider's private
mechanics and existing guarded close lifecycle. Temporary panels and bottom
drawers fill one raised surface; the table workspace gutter belongs only to
docked panels.

The removable development guidance is grouped without merging its owners:

```text
src/features/development-guide/{architecture,contacts,patterns/<category>}
src/pages/development-guide/{architecture,contacts,patterns}
tests/features/development-guide/{architecture,contacts,patterns/<category>}
```

Architecture, Contacts, and every Patterns category still have separate public
interfaces and dependency boundaries. `development-guide` is a physical
grouping for code omitted from production, not one broad feature boundary.

## Package, test, and mock owners

The reusable `@rgo-web/frontend` package is a separate owner. It supplies general
components and services; this application chooses their configuration and
combines them into product behavior. Do not move application policy into the
package merely because more than one application file uses it.

Top-level `tests/` mirrors production ownership for focused tests and contains
explicit `integration/` and `browser/` areas. Top-level `mocks/` contains the
development MSW boundary and deterministic auth fixtures. Neither belongs in
production `src/`.

## Optional examples and stable infrastructure

Some shipped examples are optional. Contacts is the complete feature example;
Settings is an application-preference presentation feature; Patterns and
Architecture are development guidance. Removing an example can remove its
feature, pages, tests, routes, translations, and registrations. Stable owners
such as `src/app/data`, `src/app/router`, and the shell remain unless the
application no longer needs that capability.

## Avoid ownerless code

Do not create `src/shared`, `src/common`, or `src/utils`. A reused helper still
needs a responsible capability and a narrow interface. If ownership is unclear,
name the behavior and its lifecycle before adding a directory.
