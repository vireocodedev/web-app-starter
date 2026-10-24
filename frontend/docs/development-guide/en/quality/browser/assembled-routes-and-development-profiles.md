# Verify assembled routes in the profile that can actually contain them

A route registry can look correct while the browser renders the wrong shell, header trail, outlet, redirect, or build-specific destination. Exercise representative routes through the assembled application, and distinguish a development-only guide from the built application's intentionally smaller public surface.

This is an **installed starter browser-test pattern**. Separate Playwright configurations select built-application and development-guide scenarios. The built config runs a Vite build/preview with test environment inputs; the guide config runs the development server with mock API mode. The files were read only; no build, browser, or test execution is reported.

## Trigger and ownership

Use assembled-route scenarios when changing public addresses, navigation composition, authentication entry, breadcrumbs, development gating, or responsive page navigation. Router metadata and route-object tests remain useful for pure composition rules, but they cannot establish actual browser layout, focus, or destination rendering.

The built configuration excludes the development documentation spec and filters Contacts example scenarios. The development configuration explicitly selects documentation and Contacts projects. This separation matters because `import.meta.env.DEV` controls whether the guide exists; changing only a custom app environment label does not make built output equivalent to a development server.

## Capture the profile and boundary

This is **inert scenario design**, not an installed helper:

```text
Development profile:
  enter guide directly and through navigation
  assert URL, title, category context, outlet and active links

Built profile:
  enter normal application route
  assert guide links absent
  navigate directly to guide URL -> explicit not-found state
```

The source development spec checks root categories without header tabs, category breadcrumbs, frontend section links, localized narrow layouts, and legacy redirects preserving query/fragment. The built spec checks missing guide links and direct guide paths returning not-found without documentation rails or header tabs. This is stronger than merely hiding a menu item.

| Change                 | Useful browser evidence                                  |
| ---------------------- | -------------------------------------------------------- |
| New address            | Direct entry renders intended page and title             |
| Parent/category layout | Correct context, tabs, breadcrumbs, and outlet           |
| Redirect               | Canonical URL plus intended query/fragment preservation  |
| Active navigation      | Correct `aria-current`, including descendants            |
| Development-only route | Exists in DEV; absent and not-found when built           |
| Authentication flow    | Protected route follows intended session/return contract |

## Keep mock scope explicit

The built browser fixture intercepts its synthetic API origin and implements authentication request/response behavior. The development server uses application mock mode. Both exercise the assembled frontend; neither proves a deployed backend, real browser session cookies across a production proxy, or production data authorization.

Avoid importing a mocked router or replacing the route page when the composition is the subject. Conversely, do not require real business systems just to establish header/outlet behavior. Choose a stable synthetic boundary and label the resulting claim accurately.

## Failure and maintenance

Configuration selection is part of coverage. A renamed test can fall outside a grep-based project selection even though the file still exists. Keep test admission rules aligned with scenario names or adopt an explicit project/tag scheme deliberately. Do not assume a development-only spec ran under the default built config.

Existing-server reuse also needs care: the configured server must match the intended profile and origin. A browser connected to an already-running wrong-mode server can produce misleading failures or accidental success. Record the configuration and server mode with execution evidence when checks are authorized.

As the guide grows, category counts, labels, route IDs, and examples evolve. Assert the deliberate contract and update its fixture together; avoid treating a pinned historical count as a permanent template rule. Preserve public old-address migration behavior explicitly rather than silently removing coverage.

## Acceptance scenarios

A direct deep link renders the same destination as navigation. Legacy query/fragment identity survives the intended redirect. A category page has correct header and normal breadcrumbs. Narrow/localized navigation stays usable. Built output exposes no guide links and direct guide addresses fail safely. Scenario selection demonstrably includes the intended files under the right profile; frontend mocks are not described as end-to-end backend evidence.

## Avoid these shortcuts

Do not test only route-object shape, hide development links without excluding destinations, conflate build environment labels with DEV, or report default-config execution as development-guide coverage. The assembled profile is part of the route contract.

## Sources and provenance

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/playwright.config.ts` — built preview profile, selection, and server boundary.
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/playwright.development.config.ts` — DEV/mock projects and guide-specific server.
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/browser/documentation.development.spec.ts` — assembled categories, breadcrumbs, redirects, and localization.
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/browser/application.spec.ts` — built route exclusion and frontend HTTP fixture.
