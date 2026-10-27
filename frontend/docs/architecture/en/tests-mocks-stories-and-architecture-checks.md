# Tests, mocks, stories, and architecture checks

## Focused and integration test placement

Focused tests mirror source ownership:

```text
src/app/router/queryParams.ts
tests/app/router/queryParams.test.ts

docs/storybook/examples/Contacts/api/contact.mutation.ts
tests/storybook/contacts/api/contact.mutation.test.ts
```

Place cross-owner scenarios under `tests/integration/<area>` and browser flows
under `tests/browser`. Tests import production code through `@/`; reusable test
support uses `@test/`. Production `src/` must not import tests, stories, mocks,
or example-only modules.

## Test and development mocks

`vitest.config.ts` selects the jsdom test environment. `tests/setup.ts`
installs DOM matchers and the empty MSW server lifecycle. Individual tests add
only the handlers their scenario needs; handlers reset after each test.
Top-level `mocks/` is different: it supports the running development
application and is dynamically loaded before runtime construction.

## Stories and browser coverage

Stories document reusable components and important visual states. Keep tutorials,
CSF stories and preview support under `docs/storybook/<section>/<Tutorial>/`,
outside `src/`; same-name MDX and CSF files share their matching folder, and
section-wide helpers use `shared/`. Production behavior must not depend on these
fixtures. Global Storybook configuration and adapters stay in `.storybook/`.
Browser tests cover assembled routing,
interaction, responsive behavior, and automated accessibility. They complement,
not replace, the manual checklist in `docs/manual-accessibility-checklist.md`.

Stories and Storybook tutorials use English; they do not need translated variants.
Routing tutorials supply working main-menu entries for their preview routes;
keep those entries and the documented menu setup aligned.
The ordinary-flow routing previews share `StorybookBrowserFrame` so the address
bar and shell fit one viewport. Keep short examples free of extra iframe/Canvas
scrollbars while longer content retains normal window scrolling. Review sizing
separately for fixed workspace pages.
The global providers in `.storybook/preview.ts` supply English localization and
the application theme. Use the global Theme toolbar's System, Light, Dark and
Soft dark choices instead of installing a per-story theme provider or fixed mode.
The same global adapter supplies the real localized feedback provider inside the
theme provider. Its key is the story ID: theme/argument updates preserve feedback,
while selecting another story ends its notification/confirmation session. Each
Docs iframe has its own provider. Feature demos still cancel their own pending
work; ending feedback presentation does not roll back business commands.
The manager, Docs and preview adapters reuse `src/app/theme/themeSetup.ts` tokens.
The Storybook-only iframe bridge synchronizes embedded Docs examples, including
when storage is unavailable; it validates same-origin parent/child messages and
keeps preference storage separate from the application's keys.

With Storybook running, `npm run test:browser:storybook` checks this layout and
the ContactForm tutorial's validation, awaited saves, retry, and theme-preserved
drafts, plus notification/confirmation interactions and isolation, and architecture
walkthrough selection, theme preservation and narrow Docs, in installed
Chrome with one worker. `RGO_STORYBOOK_URL` selects another
existing server; the check does not start a build or server. Its dedicated
Playwright configuration keeps these stories separate from application browser
scenarios.

The data/collections/localization checks also cover isolated query/mutation
flows, rejected saves and retry, obsolete-read cancellation, client and controlled
server table processing/selection, formatting inputs, English interpolation and
plurals, preserved drafts, theme transitions, narrow Docs and representative
automated accessibility. These previews neither prove remote API behavior nor
change application storage or the document's language.

The URL/state/settings/auth/testing tutorials add browser scenarios for atomic
query updates and history, malformed URL recovery, Signal hydration and effect
disposal, storage failure, real preference consumers and fixed setter guards,
session/CSRF sequencing, distinct login failures, private-cache expiry, and
schema/mutation boundary observations. These checks also inspect global theme
preservation, narrow Docs, scrolling, app-storage isolation and representative
automated accessibility. The private auth transport sends no HTTP request; it
cannot establish backend cookie, authorization or database behavior. The testing
preview displays actual boundary observations and does not execute Vitest.

Advanced consumer-reference tutorials cover capability-aware entry/actions,
injected feature HTTP and response/error contracts, draft/submit validation and
leave guards, versioned commands and coordinated refresh, and recipient-owned
inbox records. Their browser scenarios verify denied writes, authority changes,
CSRF sequencing, preserved drafts, rejected/uncertain command outcomes, targeted
refresh recovery and cold client remounts. Private transports and retained memory
servers are fixtures: they do not install production roles/endpoints or prove
real database persistence, backend authorization or transaction rollback.
The form checks exercise SPA/logout guards and cancellation of a dispatched
`beforeunload` event; the browser's native unload warning remains a manual check.

The architecture check rejects guide owners and source-local story artifacts
under `src/`, including empty `stories/` directories and `*.stories.ts(x)` files.
Every production import and re-export into any `docs/` or `.storybook/` path is
rejected, including missing targets, raw queries, literal dynamic imports and
`import.meta.glob` patterns that can select documentation. No raw architecture or
Handbook import exception remains. Documentation TypeScript is checked by
`tsconfig.storybook.json`. Reference unit tests live under `tests/storybook/`;
application browser checks prove that retired guide URLs are Not Found in both
locales and that app navigation exposes only installed destinations.

## Automated checks and review judgment

Use [Architecture invariants and checks](../../development-guide/en/quality/test-design/architecture-invariants-and-checks.md)
for the complete installed frontend/backend guard-to-check map, proof owners,
commands and explicit automation limits.

`npm run verify:architecture` enforces mechanical rules including allowed source
roots, test placement, owner-crossing imports, feature public interfaces,
private contexts, runtime-hook wrappers, declared cross-feature hook edges,
Signal filenames and lifecycle imports, provider/hook naming, storage access,
shell/router separation, and dependency cycles.

It cannot decide whether a capability name is good, an interface is minimal, a
factory is necessary, a test meaningfully proves behavior, documentation is
accurate, or a cross-feature exception is wise. Those remain review decisions.
Run the checker after moves and boundary changes, then run focused behavior
tests and the repository's complete verification before delivery.
