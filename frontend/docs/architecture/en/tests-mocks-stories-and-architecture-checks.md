# Tests, mocks, stories, and architecture checks

## Focused and integration test placement

Focused tests mirror source ownership:

```text
src/app/router/queryParams.ts
tests/app/router/queryParams.test.ts

src/features/development-guide/contacts/api/contact.mutation.ts
tests/features/development-guide/contacts/api/contact.mutation.test.ts
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

Stories document reusable components and important visual states. Keep them
with the owning feature or catalog recipe, but do not make production behavior
depend on Storybook fixtures. Browser tests cover assembled routing,
interaction, responsive behavior, and automated accessibility. They complement,
not replace, the manual checklist in `docs/manual-accessibility-checklist.md`.

## Automated checks and review judgment

Use [Architecture invariants and checks](/dev-guide/quality/test-design/architecture-invariants-and-checks)
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
