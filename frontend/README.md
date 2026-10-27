# RGO frontend application

This application was created from the RGO frontend template. It uses Node 24
and npm 12.0.2; run `npm ci` before development.

Copy `.env.example` to `.env.local`; this starter uses `/api` for the local
Spring Boot backend. See the [workspace setup guide](../README.md) to start
PostgreSQL and the backend and obtain the initial login credentials. Do not
commit `.env.local`, tokens, or an `.npmrc` containing credentials. The public
`@rgo-web/frontend` package installs from npm without authentication. For pull
requests and pushes to `main`, GitHub Actions distributes the frontend checks
across required lanes: formatting, lint, architecture and typechecks; four
complete-suite test shards; and Storybook, production image build and smoke
verification. Each Node lane installs the locked dependencies with `npm ci`;
local `npm run verify` still runs the complete frontend checks sequentially.
The workflow belongs to the workspace root and runs on the shared isolated
Hetzner pool. Frontend-only changes select the frontend lanes; unrelated
backend checks are skipped. See [CI and branch protection](../docs/template-initialization/github-ci.md)
for the consumer's required runner access and GitHub settings.

## Storybook development recipes

The source-readable [Storybook Development Guide](docs/storybook/README.md) lives
outside `src`, grouped into `architecture/`, `routing/`, `forms/`, `feedback/`,
`data/`, `collections/`, `localization/`, `state/`, `settings/`, `authentication/`,
`workflows/`, `notifications/`
and `testing/`.
Each tutorial has a same-name folder containing its MDX, CSF and preview support;
helpers used by several tutorials live in the section's `shared/` folder.

Run `npm run storybook` and open **Development Guide** for English tutorials
with complete application code and interactive examples:

- **Architecture → Source ownership → Docs** explains source roots, feature
  folders, thin pages, and test/story placement.
- **Architecture → Dependency direction → Docs** traces page, router, shell,
  and runtime composition boundaries.
- **Architecture → Public module APIs → Docs** covers deliberate named exports,
  private implementation, and approved application leaves.
- **Architecture → Runtime and state ownership → Docs** covers construction,
  typed runtime access, provider lifetimes, and choosing one state owner.
- **Feedback → Notifications → Docs** covers acknowledged command results,
  success/errors, actions, persistence, dismissal, and stable notification IDs.
- **Feedback → Confirmations → Docs** covers explicit decisions, destructive
  actions, failure, dirty-editor guards, and cancellation by owner lifetime.
- **Forms → Entity forms → Docs** covers the actual ContactForm, a translated Zod
  schema factory with validation context, explicit create/update modes,
  `useRgoForm`, shared validation timing, lifecycle reporting, and awaited saving
  with failure/retry examples.
- **Data → Loading and saving feature data → Docs** covers API ports/adapters,
  query/mutation factories, runtime access, cache invalidation, result states,
  rejected saves, retry and cancellation using isolated demo data.
- **Collections → Tables and collections → Docs** covers typed table columns,
  client and controlled server processing, filters, pagination, stable selection,
  local bulk actions and recoverable result states.
- **Localization → Localization and formatting → Docs** covers typed resources,
  interpolation/plurals, reactive translation, explicit currencies/time zones and
  MUI integration. Formatting comparisons do not change application preferences.

- **Navigation chooser pages → Docs** covers full-width category links and named
  groups, an index chooser, real child destinations and a working main menu.
- **Standalone pages → Docs** covers independent pages with a shell title,
  normal content spacing, internal links and optional main-drawer destinations.
- **Pages with header tabs → Docs** covers a shared page layout, default-child
  redirect, header links, descendant selection and mobile section navigation.
- **Pages with left navigation → Docs** covers the Settings-style layout with
  three page links, a measured content container, nested routes and a mobile
  page picker.

- **Routing → URL-backed state → Docs** covers typed query codecs, atomic updates,
  malformed input, canonical defaults and Back/Forward history.
- **State → Signals and persistence in practice → Docs** covers normalized actions,
  derived values, hydration/effect ordering, storage failure and disposal.
- **Settings → Components that respect application settings → Docs** covers live
  preference owners, semantic tokens, density/editor presentation and fixed policy.
- **Authentication → Authentication and HTTP integration → Docs** covers actual
  client/session/CSRF factories, errors and identity/cache transitions through a
  private simulated transport.
- **Testing → Testing a feature → Docs** covers test boundary selection, copyable
  model/form/cache/HTTP recipes, fresh fixtures, cleanup and verification evidence.
- **Authentication → Capability-aware pages and actions → Docs** covers separate
  page eligibility and record actions, navigation/entry gates and revocation.
- **Data → Building a backend-connected feature → Docs** connects schemas, the
  shared HTTP client, domain errors, query options and explicit runtime registration.
- **Forms → Draft and submit forms → Docs** covers incomplete draft saves, strict
  submission, conditional fields, server errors and leave protection.
- **Workflows → Workflow commands, conflicts and coordinated refresh → Docs**
  covers versions, conflict recovery, acknowledged writes and failed refreshes.
- **Notifications → Persisted inboxes versus feedback → Docs** covers server
  records, recipient ownership and read state separately from feedback toasts.

These advanced recipes define consumer integration work explicitly. Their private
previews do not install business roles/endpoints or demonstrate real database durability.

These recipes need no running backend. Use `npm run build-storybook` to produce
the static site.
Storybook retains `mockServiceWorker.js` for its preview loader; the production
application build continues to omit that development worker.

With Storybook running, use `npm run test:browser:storybook` to check architecture
walkthrough selection, theme preservation, narrow Docs, notifications,
confirmations, form validation/save/retry, data loading/saving/cancellation,
collection ownership/selection, localization/formatting, URL state/history,
Signals/persistence, settings-aware presentation, auth/CSRF/private-cache lifetime,
testing examples, and all four routing layouts for extra
scrollbars. The check also confirms longer content stays reachable.
It uses installed Chrome and runs serially. Set `RGO_STORYBOOK_URL` to check an
existing server at another address; the default is `http://127.0.0.1:6006`.

The global **Theme** toolbar uses the same System, Light, Dark, and Soft dark
choices as application Settings. It themes Storybook navigation, panels, Docs
and all story previews, including embedded examples. System follows the OS;
the selection is saved separately from application preferences. Stories use
English and inherit the global providers instead of fixing their own theme.

The [routing contract](docs/architecture/en/router-and-shell-responsibilities.md)
remains the source of application policy. Story-only code lives under
`docs/storybook/<section>/<Tutorial>/` (or section `shared/`) and is never imported
by production source.

## Start locally

The development environment defaults to `VITE_API_MODE=http`. Vite forwards
`/api` to `http://127.0.0.1:8080`, so session cookies remain same-origin.
For frontend-only development, set `VITE_API_MODE=mock` and use the demo
credentials `demo` / `demo-password`; they exist only in the MSW fixture.
Both modes exercise the same authentication and CSRF endpoints.

```sh
npm ci
npm run dev
```

Production application startup rejects mock mode. Set `VITE_API_MODE=http`
before running the built application. The production bundle omits the MSW
bootstrap and worker while retaining normal files from `public/`; the build
command itself does not execute application configuration validation.
`VITE_APP_ENV` is an application label and cannot override that build-mode
policy. The login form handles submitted credentials transiently and the auth
adapter serializes them for the request. Application code does not read or
manage authentication cookies or tokens, and it never persists credentials or
authentication tokens in browser storage.
The Spring-session adapter obtains a fresh session-bound CSRF token from
`/auth/csrf` and attaches it to every unsafe HTTP request; it is not an
authentication token and is not persisted.

## Replace the starter Home page

`src/pages/HomePage.tsx` is a disposable starting point with a React counter
and a link to Settings. Replace its content
with your product's Home page; the shell and route setup live elsewhere.

## Fix Settings values at build time

Every Appearance, Navigation, and Accessibility option is user-configurable
by default. A deployment can fix an option by defining its typed
`VITE_SETTINGS_NOCFG_*` variable. The fixed
value wins over saved user preferences, its Settings row and any matching header
control are removed, and Reset leaves the saved preference untouched. Removing
the variable in a later build makes that saved preference active again.

Appearance includes **Increased contrast**, off by default. Turning it on
strengthens text and interface boundaries across Light, Dark, and Soft dark
without changing the selected color theme. A deployment can set
`VITE_SETTINGS_NOCFG_INCREASED_CONTRAST=true` or `false` to fix this choice.

See `.env.example` for the supported variables and accepted values. For example,
`VITE_SETTINGS_NOCFG_EDITOR_PRESENTATION=overlay` always uses the overlay
editor and removes that input from Settings. These are public, non-secret Vite
inputs bundled at build time, so changing one requires rebuilding the app.

## Architecture and contribution guide

Start with the [fullstack development guide](docs/development-guide/README.md)
for focused frontend, backend, CI, delivery and agent-workflow patterns. Paired
English/Croatian Markdown remains readable by agents without a browser. The
Storybook Handbook reader exposes the same articles through category and topic indexes;
source-backed recipes are labeled separately from installed template behavior.

The canonical source-structure guide is available in Storybook under
**Development Guide → Architecture → Architecture reference**. Its same
Markdown sources are readable in the repository:

- [English architecture guide](docs/architecture/en/source-map-and-ownership.md)
- [Hrvatski vodič kroz arhitekturu](docs/architecture/hr/source-map-and-ownership.md)
- [Add, change, or remove a feature](docs/architecture/en/add-change-or-remove-a-feature.md)
- [Tests, mocks, stories, and architecture checks](docs/architecture/en/tests-mocks-stories-and-architecture-checks.md)

Those articles define ownership, dependency direction, startup and provider
lifetimes, feature shapes, pages and routing, state, persistence, and the
contribution runbook. `AGENTS.md` gives coding agents the short entrypoint.
Interactive implementation references live under Storybook **Development Guide →
Patterns** and **Examples → Contacts**. The application contains no development
guide in any build. All guide catalogs, readers, fixtures and translations live
under `docs/storybook/`; paired canonical Markdown remains in `docs/architecture/`
and `docs/development-guide/`.

## Agent skills for shell changes

The application includes three agent skills: [routes and pages](.agents/skills/app-route-pages/SKILL.md), [navigation and header](.agents/skills/app-shell-navigation/SKILL.md), and [shell preferences](.agents/skills/app-shell-preferences/SKILL.md). They accept plain-language requests and can be invoked by name or selected for matching work. Invoke a skill by name alone to choose from its task menu; include the task in the same prompt to begin directly.

For an application generated before these skills were bundled, point the agent to the corresponding skill file in a current RGO template checkout, or copy that skill directory into the application's `.agents/skills/`. The skills assume the current shell; when an older app lacks an expected extension point, ask for an upgrade or separate migration rather than applying the recipe blindly.

## Install as an app

The application can be installed using a supporting browser's installation
menu. On iOS, use Share → Add to Home Screen. Installation requires HTTPS in
production; `localhost` or `127.0.0.1` also works for local checks.

To adopt the template's installed-app identity:

1. Edit `public/manifest.json`: set `name`, `short_name`, `theme_color`, and
   `background_color`. This is the only PWA configuration file.
2. Replace `public/brand/app-icon-192.png` and
   `public/brand/app-icon-512.png` with your own PNG images at those dimensions.
   Keep their filenames; HTML and manifest links already point to them.
3. Build and deploy the app over HTTPS, install it from the browser, and launch
   it from the device's app launcher. Check its name, icon, and login flow.

The manifest also owns `id`, `start_url`, and `scope`. Their `/` defaults suit
deployment at the origin root. Keep `id` stable after users install the app.
Changing these values alone does not configure routing under a subpath.

Installed apps need an internet connection; the template does not add offline
caching. Browser install prompts vary and may depend on user engagement.

## Shell and navigation

The first header row contains the main menu button, RGO brand,
top-level route context, quick actions, and account access. The application
registers Home, Settings and authentication/error boundaries; the account menu
contains Settings and Sign out. Bottom shortcuts are Home and Settings, and
Ctrl/Cmd+K searches Home plus the three Settings sections. Retired guide URLs
resolve to Not Found in development and production.

The generic shell still supports route-owned header tabs, dynamic identity,
breadcrumbs, page navigation and full-page choosers. Their complete tutorials and
isolated examples live in [Storybook](docs/storybook/README.md). On narrow screens,
header sections keep the active section visible and offer a More sections sheet;
page layouts own their separate responsive navigation. Theme and language controls
are available in Settings on mobile. App-provided `headerActions` render inline,
so applications should keep them compact.

The main drawer is a temporary overlay by default on desktop. Users may choose a
permanent drawer that spans the browser height beside the entire header and
content column. Its bottom button collapses it to an icon rail or expands it
with an opacity transition; the header button hides or restores it. Both
permanent-drawer states persist. The drawer lists top-level destinations. Mobile always
uses a temporary drawer and retains the bottom shortcuts. A route may set
`mobileBottomNavigation: false` to hide the bottom bar or
`mobileSurface: "flush"` to remove horizontal shell gutters below 1024px.

Desktop header stickiness is a saved preference: first row (default), both
rows, or neither row. Fresh apps start with Medium font and table sizes and
8px corner roundness. The first mobile row always sticks. Settings also
controls Normal (100%), Medium (112.5%), or Big (125%) text and corner roundness.
A previously saved Big text choice migrates to Medium to retain its size. The header offers a
System/Light/Dark/Soft dark menu and language selection; both remain in Settings. A
username avatar opens the account menu with Settings and Sign out. Defaults live in `src/app/shell/appShellConfig.ts`. Typed
`VITE_SETTINGS_NOCFG_DRAWER_MODE` and
`VITE_SETTINGS_NOCFG_HEADER_STICKINESS` values can fix those preferences.

## Search pages

Use the header's **Search pages** button on desktop or mobile, or press
**Ctrl+K** / **Cmd+K**. Type a page name or its parent section, use the arrow
keys to choose a result, and press Enter to navigate. Escape closes the search
and restores focus. Selecting the current page preserves its filters and fragment.

To include a page, set `commandPalette: true` on its entry in
`src/app/router/routeRegistry.tsx`. Membership is independent of menu placement
and does not inherit from a parent. The search uses the route's translated
navigation label or static title, with parent context. Parameterized routes
need a concrete `navigation.to` destination. Development-only destinations
are available only in development builds.

## Connect a Spring Boot session backend

Set `VITE_API_MODE=http`, configure `VITE_API_BASE_URL`, and set
`VITE_API_WITH_CREDENTIALS=true` when frontend and API use different origins.
Configure Spring's credentialed CORS policy for the frontend origin. Then adapt
`src/app/auth/api/appAuth.api.springSession.ts`: it is the single place for
login serialization, session normalization, endpoint paths, and `401` behavior.
Add CSRF handling there only when the confirmed backend contract requires it.
The mock-only demo notice disappears automatically in HTTP mode.

## Open Storybook Pattern example source

Each migrated Pattern preview in Storybook has a source button immediately before
Reload. Through the Storybook development server on `localhost`, `127.0.0.1`, or `[::1]`, it opens the
implementation file in VSCode on the dev-server machine. Install VSCode's
`code` command in that process's `PATH` before `npm run storybook`.

On a remote Storybook development server, the source button opens a repository link in a
new tab. Vite resolves the application's Git origin, exact HEAD, and checkout
directory. Automatic links support SSH and HTTP(S) origins on `git.rgo.hr`;
the revision must be pushed and the viewer needs access. The plugin is installed only by `.storybook/main.ts`; the application Vite
server and production app contain neither this endpoint nor any Pattern routes.
Its allowlist contains only declared `docs/storybook/patterns/` examples. Static
Storybook builds use repository source links rather than the local editor endpoint.

For GitHub origins or builds without usable Git metadata, set
`RGO_EXAMPLE_SOURCE_BASE_URL` in
the build environment or `.env.local`. Include the revision and application
directory prefix, ending with `/`:

```dotenv
RGO_EXAMPLE_SOURCE_BASE_URL=https://github.com/ORG/REPOSITORY/blob/REVISION/apps/web/
```

The value must be an HTTP(S) URL without credentials, query, or fragment. It is
public browser configuration. Restart the dev server or rebuild after changing
Git revisions or configuration. `VITE_APP_ENV` does not select editor versus
repository behavior.

## Checks

Use focused checks while changing code and the complete configured suite before
delivery. Important entrypoints include:

```sh
npm run verify:architecture
npm test
npm run typecheck
npm run lint
npm run test:browser
```

The browser suite requires an installed Google Chrome. It checks production
routing, keyboard and narrow-layout behavior, and automated accessibility.
Complete `docs/manual-accessibility-checklist.md` for material UI changes;
browser automation does not replace human review.
