# Router and shell responsibilities

The router owns **what can be reached**. The shell owns **how supplied
navigation and routed content are presented**.

## Registry and route policy

`src/app/router/routeRegistry.tsx` is the route authority. A route definition
connects a path, access level, page component or lazy module, title,
breadcrumbs, navigation metadata, optional documentation group, content layout,
and scroll behavior. The router-owned `handbookRoutes.tsx` factory derives
concrete records from the public content manifest and merges them into this
registry; it does not introduce a second route matcher. `routes.tsx` converts enabled records into React Router
objects and adds access gates and layouts. The router-owned hierarchy builder
validates every declared record before environment and access filtering, then
recursively composes nested records without a depth limit.

Use `parentId` for route hierarchy independently of documentation `groupId`.
Path-bearing children retain complete application paths and must fall below the
declared parent's path; composition derives the relative React Router path. A
child must use the same access class as its parent. Development-only exclusion
is inherited through every ancestor, so an excluded layout cannot leak a
descendant route, navigation entry, or redirect target into production.

Development-only sections such as Patterns and Architecture are enabled only
for development builds. Their navigation entries disappear in production and
their URLs resolve through normal Not Found handling. Do not hide only the
navigation item while leaving a production route registered.

`/dev-guide` is a category landing page without section tabs. Frontend opens
Example pages, Patterns, Workflow patterns, and Architecture under `/dev-guide/frontend`.
Example pages lists Contacts dashboard and Contacts CRUD. Patterns lists i18n,
Signals, Server data, Routing and URLs, Overlays, Tables and collections, Forms,
and Feedback; each category opens its first example and supplies that category's
page navigation. Workflow patterns mounts the Handbook collection under
`/dev-guide/frontend/workflow-patterns` while its source files retain portable
`frontend/<topic>/<article>.md` paths. Backend, Continuous integration, Delivery
and operations, Developer workflow and AI-agent workflow each open real topic
indexes; topics open article indexes and shared sidebar navigation. Nested
Frontend workflows keep the first-row identity Development guide > Frontend.
Previous Home/Contacts URLs redirect to the corresponding Example page, while
old Patterns/Architecture URLs redirect beneath Frontend. Redirects preserve
query parameters and fragments. The whole guide remains development-only.

Generated examples appears under Frontend at `/dev-guide/frontend/generated`.
The router-owned `generatedExampleRoutes.tsx` discovers lazy visual preview pages
by filename in development and derives their records and grouped index links.
Generation requires no per-example registry edits. Actual generated components
retain ordinary feature ownership; previews use local fixtures and the existing
providers. Removing a preview file removes its registration on the next build.

The navigation generator emits a router-owned factory under
`app/router/generated/<feature>--<name>.routes.tsx`. Its `createRoutes(mount)`
returns ordinary authenticated registry records: header sections, nested layouts,
default children and deep pages. Development-only eager discovery mounts these
factories beneath Generated examples, with isolated route IDs and validated paths.
Product registration imports the same factory deliberately with a separate mount;
features still receive sidebar destinations through props and reuse
`AppPageNavigation`. The generated module never imports the preview discovery
owner, and the production branch excludes automatic preview imports entirely.

Guide routes inherit `contentMaxWidth: "xl"`. The shell places local breadcrumbs
and routed content inside the same container. The deepest explicitly supplied
width wins; descendants without an override retain their ancestor's width.

## Shell presentation receives navigation

Router composition derives top-level destinations, route context, and optional
section navigation and passes them to `AuthenticatedAppShell`. The shell
presents a first header row in the content column with the menu button, desktop RGO brand,
top-level route identity, quick actions, and account access. It may read
matched-route handles, but must not import the registry, pages, or
authentication implementation.

A parent route opts into the second header row with
`headerNavigation: true`. The router derives immediate-child tabs in
`AppRouteHandle.sectionNavigation`; the active child remains selected on
deeper descendants. When nested route groups both declare header sections, the
nearest matched group supplies the row; descendants without their own sections
inherit the nearest ancestor's sections. The desktop row puts overflowing sections in a More menu
while keeping the active section visible. The active indicator overlays the bottom edge of
the shared divider and is twice its thickness. On mobile, the row keeps the active section visible and shows up to one more tab on wider mobile rows. A separate More sections button opens a bottom sheet containing every immediate section, so a growing route group does not require horizontal scrolling. The first row omits the More quick-action button. A deepest matched route may provide `HeaderContext`, a component that
receives route params and extends the first-row identity with dynamic content.
The existing project-parameter guide route demonstrates this. The first-row
identity is the semantic heading for simple pages; deep guide pages retain
local breadcrumbs and article titles.

A matched route with `headerBreadcrumb: true` adds its localized title to the
first-row trail after the top-level route. Category routes use this to show
Development guide → Frontend or Development guide → Backend. Ancestors link to
their matched paths, so the guide title returns to the category list. This
explicit opt-in keeps individual tab and article titles out of that header trail;
the deepest `HeaderContext` still extends it with dynamic route content.

The starter main drawer lists Home; applications may add top-level destinations. It is a temporary overlay by default on
desktop and always temporary below 1024px. Desktop users may choose a
permanent drawer instead. The permanent drawer spans the browser height and
shifts the entire header and content column.
Its bottom button collapses it to an icon rail or expands its labels with an
opacity transition. The header button hides or restores it; both states persist.
The first desktop header row sticks by default; preferences can instead keep
both rows or neither row sticky. On mobile, only the first row sticks. The
development guide's optional page sidebar is separate from the main drawer;
its deep links become an “On this page” menu on narrow screens. Both desktop
sidebars may appear together at wide widths. Pages choose their content width
through route metadata rather than through drawer mode.

Desktop header quick actions provide System/Light/Dark and language selection.
On mobile, these preferences remain available in Settings, while app-provided
`headerActions` render inline without a More button. Applications should keep
those actions compact. The username avatar opens an account menu with the displayed name, Settings,
Development Guide in development builds, and Sign out. The color and language controls use their existing application
preference owners and fixed-setting policy. The account menu uses the same modal
interaction: an outside click dismisses it without activating the page beneath.
Arrow keys move between actions, and dismissal restores the account trigger;
ordinary route selection releases the menu before navigating. A fixed value removes
the corresponding editable control from the header and Settings.

A fixed bottom bar shows Home and Settings, plus Contacts dashboard in
development builds. That shortcut opens `/dev-guide/frontend/example-pages/contacts-dashboard`; the complete
Development Guide is available from the account menu. A route may set
`mobileBottomNavigation: false` to hide the bar. Omitted or `true` shows it;
the deepest matched route decides. The shell reserves bottom space, including
device safe-area inset, only while the bar is visible.
Icons occupy a fixed vertical slot. Labels shrink within a bounded font-size range
when space is tight, then use at most two lines without moving the icons. Each
link retains its complete accessible name.

A route may set `mobileSurface: "flush"` to remove only the shell's horizontal
gutters below 1024px; omitted or `"inset"` keeps the default. The deepest
matched route decides. Settings and Contacts use the flush mode while
preserving their internal spacing and desktop presentation.

A navigation item's `to` is always its link destination. Use `activePath`
only when a different React Router pattern should determine active state.
The pattern is matched completely: include a trailing `/*` when child paths
should remain active. Search parameters and fragments do not affect active
state.

## Page search

Set `commandPalette: true` on a registry entry to include it in the authenticated
header's page search. This is independent of drawer, section, and bottom
navigation placement, and membership does not inherit. Select content pages
rather than layout-only wrappers or error routes. Home and the three Settings
sections are searchable in production; guide destinations remain development-only.

The router derives entries from enabled authenticated routes, resolves concrete
destinations, and supplies translated labels and parent context to the shell
through `AuthenticatedAppShell` and `headerActions`. A parameterized route needs
a concrete `navigation.to`; unresolved parameters, catch-all routes, and external
destinations are excluded. Duplicate destinations produce one result in stable
registry order. The shell renders the dialog and handles searching and selection
without importing the registry or pages. Result titles carry the primary emphasis;
smaller muted context gives their place in the application. The bounded result
list scrolls independently above the keyboard guidance.

The launcher works on desktop and mobile, with Ctrl+K/Cmd+K keyboard access.
Search text stays local to the dialog. Choosing the current page preserves its
query parameters and fragment. Other choices use normal router navigation after
the palette releases its modal focus, so existing route blockers still run.
Escape or dismissal restores the previous focus; successful pathname navigation
uses the shell's normal main-content focus. The shortcut respects active modal
surfaces and text composition. This does not add route-blocking policy to features
that only guard their own overlay close or view-switch actions.

## Nested application layouts

A layout page renders an `Outlet`, while its children remain ordinary registry
records. For example, an application can add these records without changing
the route builder or the shipped menu:

```tsx
workspace: {
  Component: WorkspaceLayout,
  access: 'authenticated',
  defaultChildId: 'workspaceOverview',
  path: '/workspace',
  title: () => 'Workspace',
},
workspaceOverview: {
  Component: WorkspaceOverviewPage,
  access: 'authenticated',
  parentId: 'workspace',
  path: '/workspace/overview',
  title: () => 'Overview',
},
workspaceActivity: {
  Component: WorkspaceActivityPage,
  access: 'authenticated',
  parentId: 'workspace',
  path: '/workspace/activity',
  title: () => 'Activity',
},
```

`defaultChildId` creates a replacement index redirect to an enabled direct
child. Alternatively, register one child with `index: true` and no `path` to
render it at `/workspace`:

```tsx
workspaceIndex: {
  Component: WorkspaceOverviewPage,
  access: 'authenticated',
  index: true,
  parentId: 'workspace',
  title: () => 'Overview',
},
```

Do not combine an index child with `defaultChildId`. A parent with neither
configuration renders its own layout at its URL without redirecting. Nested
route handles use the deepest match for title, layout, and scroll behavior;
breadcrumbs contain every ancestor, explicit breadcrumb, and current title.
An index with the same title as its immediate parent shows that label once;
distinct parent and index titles remain separate. Ancestor destinations resolve named parameters from the current match, encode
their values, omit absent optional segments, and preserve encoded splat path
segments. An ancestor with a missing required parameter remains text instead of
becoming a misleading link.

## Nested documentation and page adapters

Settings and Patterns categories share `AppPageNavigation`, supplied with links
and translated labels. It owns the selected sidebar item, the mobile page sheet,
focus restoration, and deferred route changes. `SettingsPageNavigation` adapts
Settings labels; `PatternCategoryLayout` supplies a single category's examples.
Both use a 240px sidebar above a 900px content-container width and a page selector
below it. Pattern contents appear beneath the page links in the sidebar or mobile
sheet; fragment navigation waits until the sheet closes. The layout supplies a
`DocumentationRailProvider`, and galleries send their contents to its active
target rather than repeating them above the examples.

The guide's category lists use `AppCategoryList`. Its ordered `items` accept plain
links and named groups (`id`, `label`, optional `description`, and `items` of links)
in any combination. Patterns groups Signals, Server data, and Routing and URLs
under Application state; other categories remain individual links.

Nested documentation sections each provide their own group ordering. Their
default child is derived from the first retained item in that same ordered
navigation. Previous/Next navigation stays within the active Patterns category,
Architecture section or Handbook topic. Explicit related reading can cross topic
boundaries; pagination must not select an unrelated category or redirect.

Pages remain thin adapters. They import public feature interfaces, supply
route-specific composition, and do not reproduce feature behavior. Route
registration, page composition, and shell presentation are three distinct
responsibilities even when a screen looks simple.

For viewport behavior during those transitions, use the
[window scroll policy](router-and-shell-responsibilities.md#window-scroll-policy).

## Window scroll policy

The router owns window scrolling through `RouteScrollRestoration`. Each router
history entry is identified by its public location key and complete route URL,
plus the browser's public Navigation API entry key when available. The browser
key distinguishes repeated native-fragment visits without rewriting history;
browsers without that API retain ownership of ambiguous native sequences. Two
visits to the same URL can therefore retain different reading positions.
Back and Forward restore an exact recorded entry. Query-only push and replace
updates preserve the viewport; a new pathname starts at the top; and an initial
or newly selected fragment scrolls to its decoded element ID after route
content is ready. A recorded history position takes priority over a fragment.

A delayed route leaf can call `useRouteScrollReady(ready)` to hold its complete entry’s existing scroll action until content or a local error commits. Claims belong to one entry and owner; cleanup cannot release another claim. The branch default remains sufficient when no leaf claims exist. The scheduled frame rechecks current branch and leaf readiness before consuming the action, including native hash traversal. Settled actions do not replay for later retries or locale changes.

Public routes signal readiness as soon as their branch commits. Authenticated
routes signal only below `AppAuthGate`, after protected content is available;
lazy route modules are already resolved when their branch commits. Missing or
malformed fragments fall back to the top only across pathname changes and
otherwise preserve the current viewport. A newer navigation cancels pending
work, and the helper never moves focus.

Native anchors and skip links keep their browser behavior. The router does not
prevent their default action, rewrite history, or assign keys to their entries.
It owns `history.scrollRestoration` only while mounted and restores the previous
setting during page lifecycle transitions and cleanup. Feature-owned scroll
containers remain the feature's responsibility.

## Add a route

When adding a route, update the registry and its translations, then verify deep
links, document titles, complete ancestor breadcrumbs, drawer and section navigation,
access equality, development exclusion, and deliberate parent index behavior.
