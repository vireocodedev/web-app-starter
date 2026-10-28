# Frontend agent router

Follow [root policy](../AGENTS.md) and the
[task-scoped guide workflow](docs/development-guide/README.md#mandatory-agent-workflow).
This concise baseline applies before frontend planning, implementation or review.

## Architecture baseline

- Put stable infrastructure in `src/app`, product behavior in its feature, and
  thin public-interface composition in `src/pages`. Router composition owns URLs,
  access, titles and navigation policy; shell presentation receives that policy.
  Reused code still needs an owner; avoid global shared/common/utils buckets.
- Use `@/` across capability owners and relative imports inside one owner.
  Consume features through deliberate named `index.ts` exports; contexts and
  internals stay private. Keep approved app-leaf boundaries. An allowlist edit
  does not grant architectural approval.
- Production imports no docs, `.storybook`, tests or mocks. Teaching features,
  readers, catalogs and guide translations belong outside `src/`. Contacts is a
  reference recipe; Settings and app services are installed. Inspect actual
  interfaces before use.
- Give state and effects one responsible owner and an explicit lifetime. Keep
  product validation/data with its feature, async data with Query, and preferences
  with their app owner. Add factories/hooks/role folders only for a real duty;
  preserve hydration, session/cache isolation and disposal where affected.
- Reuse the installed component system and semantic presentation conventions.
  Preserve both application locales, keyboard/focus, accessibility and narrow
  screens where affected; inspect the exact component and current callers.

## Select deeper contracts

Use `guide:index -- route <keys...>` from the root (through the root Node launcher
or `npm --prefix frontend run guide:index -- route ...` with Node 24/npm 12).
Read each selected full article/tutorial and its applicable prerequisites before
deciding the affected change. The [Storybook router](docs/storybook/README.md)
provides human navigation; no full architecture bundle is required by default.

| Trigger                                                                         | Route keys and required subject reading                                                                                                          |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Existing isolated spacing/shape/color                                           | `styling`; exact owning component; add `settings`/`preferences` if effective preference behavior changes                                         |
| Create/move/remove files or owners                                              | `source-ownership`; source map, feature anatomy and change lifecycle                                                                             |
| Imports, public exports or cross-owner callers                                  | `public-api`; full dependency/public-interface contracts                                                                                         |
| Providers, runtime construction, state or effects                               | `runtime` or `state`; full lifetime, data/state and cleanup contracts                                                                            |
| Route/page lifecycle                                                            | `header-tabs`, `left-navigation`, `standalone` or `navigation-chooser` as applicable; [app-route-pages](.agents/skills/app-route-pages/SKILL.md) |
| Drawer, sections, breadcrumbs, sidebar or header navigation                     | `shell-navigation`; [app-shell-navigation](.agents/skills/app-shell-navigation/SKILL.md)                                                         |
| Defaults, persistence, fixed overrides, shell appearance or preference controls | `preferences`; [app-shell-preferences](.agents/skills/app-shell-preferences/SKILL.md)                                                            |
| Forms, feedback, data, tables, copy, URL state                                  | `forms`, `notifications`/`confirmations`, `data`, `collections`, `localization`, `url-state`, respectively                                       |
| Sessions/CSRF, authorization, workflows or inboxes                              | `session`, `capabilities`, `workflows`, `inbox`; include backend/security owners when affected                                                   |
| Existing check selection or test/mock placement                                 | `verification`; [testing/check contract](docs/architecture/en/tests-mocks-stories-and-architecture-checks.md) and actual scripts                 |
| Complete feature-test recipe, async fixtures or cleanup                         | `testing`; full test tutorial and its affected subject contracts                                                                                 |
| Tutorial, story, fixture, catalog or Storybook configuration                    | `storybook`; [authoring conventions](docs/storybook/CONTRIBUTING.md) plus subject contracts                                                      |

Combine keys and skills when concerns overlap. Other handbook concerns (overlays,
editing, access, localization, async commands and more) remain discoverable through
`route --list frontend`, explicit article/topic keys and free-text search. Reroute
before touching newly discovered owners. Read one complete language version.
Skills remain procedures; authoritative articles own contracts. For a bare skill
invocation use its Start menu; concrete tasks proceed directly. For skill edits,
read `writing-for-agents` skill mechanics and preserve Start → Workflow → Finish.
Keep generated secrets and `.env.local` outside version control.
