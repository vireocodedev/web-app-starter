# RGO frontend application

This application was created from the RGO frontend template. It uses Node 24
and npm 12.0.2; run `npm ci` before development.

Copy `.env.example` to `.env.local`; this starter uses `/api` for the local
Spring Boot backend. See the [workspace setup guide](../README.md) to start
PostgreSQL and the backend and obtain the initial login credentials. Do not
commit `.env.local`, tokens, or an `.npmrc` containing credentials. The public
`@rgo-web/frontend` package installs from npm without authentication. GitHub
Actions runs `npm ci` and `npm run verify` for pull requests and pushes to `main`.
The workflow belongs to the workspace root and runs on the shared isolated
Hetzner pool. Frontend-only changes select frontend verification; unrelated
backend checks are skipped. See [CI and branch protection](../docs/github-ci.md)
for the consumer's required runner access and GitHub settings.

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
and links to Settings and the development-only guide. Replace its content
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

The canonical source-structure guide is available in the authenticated,
development-only **Development guide** menu under **Architecture**. Its same
Markdown sources are readable in the repository:

- [English architecture guide](docs/architecture/en/source-map-and-ownership.md)
- [Hrvatski vodič kroz arhitekturu](docs/architecture/hr/source-map-and-ownership.md)
- [Add, change, or remove a feature](docs/architecture/en/add-change-or-remove-a-feature.md)
- [Tests, mocks, stories, and architecture checks](docs/architecture/en/tests-mocks-stories-and-architecture-checks.md)

Those articles define ownership, dependency direction, startup and provider
lifetimes, feature shapes, pages and routing, state, persistence, and the
contribution runbook. `AGENTS.md` gives coding agents the short entrypoint.
Interactive implementation examples remain in the development-only
**Patterns** section.

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
top-level route context, quick actions, and account access. The development
guide demonstrates an optional second row for its immediate sections and a
separate page sidebar for deeper navigation. Deep pages retain local
breadcrumbs. On narrow screens, the second row keeps the active section visible and offers a More sections sheet, while
page navigation uses a separate “On this page” menu. Mobile theme and language controls
are available in Settings instead of a More button. App-provided `headerActions`
render inline on mobile, so applications should keep them compact.

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

## Open Pattern example source

Each Pattern preview has a source button immediately before Reload. Through a
development server on `localhost`, `127.0.0.1`, or `[::1]`, it opens the
implementation file in VSCode on the dev-server machine. Install VSCode's
`code` command in that process's `PATH` before `npm run dev`.

On a remote development server, the source button opens a repository link in a
new tab. Vite resolves the application's Git origin, exact HEAD, and checkout
directory. Automatic links support SSH and HTTP(S) origins on `git.rgo.hr`;
the revision must be pushed and the viewer needs access. Production builds and
local production previews omit the development-only Pattern routes, so they do
not expose this source button.

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
