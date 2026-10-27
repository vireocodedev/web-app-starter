# Application agent guide

For every task, follow the root
[mandatory development-guide workflow](../AGENTS.md#mandatory-development-guide-workflow),
including its pattern-reuse and approval gate.

Use the [Storybook Development Guide](docs/storybook/README.md) for the mandatory
Architecture reading and task-specific routing, form and feedback tutorials.
Read their MDX sources before planning or editing; apply every relevant rule and
reuse the installed application interfaces and isolated Storybook references. The
application source contains no development guide; teaching implementations,
article readers, catalogs and guide translations belong under `docs/storybook/`.
Keep production imports independent of `docs/` and `.storybook/`. Stories and their support files belong
under `docs/storybook/<section>/<Tutorial>/`, outside `src/`; section-wide helpers
belong in that section's `shared/` folder.

For route and page lifecycle changes, use [app-route-pages](.agents/skills/app-route-pages/SKILL.md). For drawer, section, header, breadcrumb, and page-sidebar navigation, use [app-shell-navigation](.agents/skills/app-shell-navigation/SKILL.md). For shell appearance and preferences, use [app-shell-preferences](.agents/skills/app-shell-preferences/SKILL.md). Load the related skill when one request crosses these owners.

When creating or updating a skill under `.agents/skills/`, use Start → Workflow → Finish. A bare `$skill-name` asks one short action menu with free-text input and waits; a prompt with a concrete task proceeds directly.

Read [Architecture: source map and ownership](docs/architecture/en/source-map-and-ownership.md)
before changing `src/`. Follow the linked dependency, lifecycle, feature, route,
state, and contribution articles; their Croatian counterparts live in
`docs/architecture/hr/` with matching filenames.

Use `@/` across capability owners and relative imports within one owner. Consume
features through their deliberate `index.ts` interfaces. Do not add empty role
folders, a feature factory, or a runtime hook unless the feature owns that
responsibility.

Before delivery, follow [the testing and architecture-check guide](docs/architecture/en/tests-mocks-stories-and-architecture-checks.md)
and the repository's configured verification workflow. Keep generated secrets
and `.env.local` out of version control.
