# Storybook Development Guide

This is the source entry point for the Development Guide in Storybook. Its
architecture decisions and implementation patterns are mandatory frontend
guidance under the [workspace agent workflow](../../../AGENTS.md#mandatory-development-guide-workflow).
Read the Architecture section before planning, implementing or reviewing frontend
work, then read every tutorial relevant to the task. Apply all relevant contracts
and inspect the current application files named by each tutorial.

Read the MDX directly without starting Storybook. For interactive examples, run
`npm run storybook` from `frontend/` and open **Development Guide**. The wider
[development-guide workflow](../development-guide/README.md#mandatory-agent-workflow)
owns discovery, pattern reuse and conflict/approval handling. Existing architecture
articles retain ownership of their detailed contracts; tutorials apply them with
worked examples. A source conflict follows that workflow rather than being
silently resolved by choosing one document.

## Architecture — required for frontend work

- [Source ownership](architecture/SourceOwnership/SourceOwnership.mdx): folders, files, feature
  boundaries, thin pages and verification placement.
- [Dependency direction](architecture/DependencyDirection/DependencyDirection.mdx): public composition,
  router/shell boundaries, injected construction and exceptional dependencies.
- [Public module APIs](architecture/PublicModuleApis/PublicModuleApis.mdx): named exports, private
  implementation and approved application interfaces.
- [Runtime and state ownership](architecture/RuntimeAndState/RuntimeAndState.mdx): factories,
  typed runtime access, providers, state and lifetimes.

## Routing — pages, layouts, URLs or navigation

- [Pages with header tabs](routing/HeaderTabs/HeaderTabs.mdx).
- [Pages with left navigation](routing/LeftNavigation/LeftNavigation.mdx).
- [Standalone pages](routing/StandalonePages/StandalonePages.mdx).
- [Navigation chooser pages](routing/NavigationChooser/NavigationChooser.mdx).
- [URL-backed state](routing/UrlBackedState/UrlBackedState.mdx): scalar schemas and codecs,
  safe parsing, atomic changes, canonical URLs and deliberate Back/Forward history.

Read the matching layout tutorial and its current router/shell source examples.
Use the existing route and shell skills when triggered by the frontend agent guide.

## Forms — schemas, editors, validation or saving

- [Entity forms](forms/EntityForms/EntityForms.mdx): the actual ContactForm, translated Zod
  schema factory with context, `useRgoForm`, create/update modes, lifecycle,
  validation timing and awaited saving with failure/retry.
- [Draft and submit forms](forms/DraftAndSubmitForms/DraftAndSubmitForms.mdx): distinct
  validation intents, conditional fields, server validation, saved baselines and
  coherent navigation/unload/explicit-logout guards.

## Feedback — outcomes, decisions or unsaved changes

- [Notifications](feedback/Notifications/Notifications.mdx): acknowledged outcomes, actions,
  persistence, dismissal, queues and stable IDs.
- [Confirmations](feedback/Confirmations/Confirmations.mdx): explicit results, destructive
  actions, async commands, dirty-editor boundaries and cancellation.

## Data — loading, saving, cache identity or cancellation

- [Loading and saving feature data](data/FeatureData/FeatureData.mdx): domain schemas,
  API ports/adapters, query and mutation factories, runtime access, scoped invalidation,
  truthful result states, rejected saves, retry and obsolete-read cancellation.
- [Building a backend-connected feature](data/BackendConnectedFeature/BackendConnectedFeature.mdx):
  complete consumer schemas, injected HTTP, domain errors, Query options, public APIs
  and the runtime-registration changes required to connect them.

## Collections — tables, filtering, pagination or selection

- [Tables and collections](collections/TablesAndCollections/TablesAndCollections.mdx):
  complete client collections versus controlled server pages, typed columns, stable IDs,
  request ownership, scoped selection, bulk actions and recoverable result states.

## Localization — resources, messages or formatted values

- [Localization and formatting](localization/LocalizationAndFormatting/LocalizationAndFormatting.mdx):
  typed resources, interpolation/plurals, live translation hooks, explicit currencies and
  time zones, MUI integration and stable drafts. Preview copy remains English; formatting
  comparisons use a local locale without changing application preferences.

## State — synchronous domain values, hydration or persistence

- [Signals and persistence in practice](state/SignalsAndPersistence/SignalsAndPersistence.mdx):
  normalized actions, computed values, validated source-only persistence, hydration before
  effects, storage failure, disposal and restart.

## Settings — components that follow application preferences

- [Components that respect application settings](settings/SettingsAwareComponents/SettingsAwareComponents.mdx):
  semantic theme tokens, responsive presentation, density, editor layout, accessibility
  preferences and deployment-fixed policy without competing state owners.

## Authentication — sessions, HTTP and private cache lifetime

- [Authentication and HTTP integration](authentication/AuthenticationAndHttp/AuthenticationAndHttp.mdx):
  configured Axios, cookie sessions, fresh CSRF tokens, response/error parsing, auth
  consumers and cache isolation on identity changes.
- [Capability-aware pages and actions](authentication/CapabilityAwarePages/CapabilityAwarePages.mdx):
  server-derived page eligibility, router-owned navigation and entry gates, per-record
  actions, denied requests and authority changes during confirmation.

## Workflows — commands, conflicts and affected views

- [Workflow commands, conflicts and coordinated refresh](workflows/WorkflowCommands/WorkflowCommands.mdx):
  captured versions, explicit decisions, rejected/acknowledged/uncertain outcomes,
  targeted read-model reconciliation and independent refresh recovery.

## Notifications — durable inbox records and read state

- [Persisted inboxes versus feedback](notifications/PersistedInbox/PersistedInbox.mdx):
  recipient-owned server records, idempotent read markers, scoped queries and a
  client-remount demonstration distinct from toast lifetime and database durability.

These five advanced tutorials are complete consumer reference recipes, not installed
business endpoints, role models or new platform services. They state the exact
application/backend integration work needed and provide isolated runnable previews.
The installed owner paths remain authoritative; copying a recipe includes its
documented registration, validation, localization and contract checks.

## Testing — feature contracts and meaningful evidence

- [Testing a feature](testing/TestingAFeature/TestingAFeature.mdx): model, component, cache,
  HTTP and browser boundaries, fresh fixtures, rejection assertions, cleanup and actual
  verification commands. Live observations are distinct from running the test suite.

## Complete examples and reference readers

- [Contacts](examples/Contacts/Contacts.stories.tsx): Directory and Dashboard,
  using private memory data and a fresh Query client. Its tested browser-storage
  adapter is an inert reference, never selected by the live preview.
- [Patterns](patterns/): all focused legacy panels, grouped into capability
  categories; their gallery, translations and preview-owned state remain here.
- [Handbook](handbook/Handbook/Handbook.stories.tsx): English reader and metadata
  search over the canonical paired articles in `docs/development-guide/{en,hr}/`.
- [Architecture reference](architecture/ArchitectureReference/ArchitectureReference.stories.tsx):
  English reader over the canonical paired `docs/architecture/{en,hr}/` articles.

The actual app contains Home, Settings, auth and generic infrastructure. Its
feature and Signal registries are empty. It exposes no guide routes, redirects,
menu items, startup effects or translations, including in development builds.
Production source imports no `docs/` or `.storybook/` modules. Documentation may
reuse installed app APIs; private preview providers never become app registries.

## File placement and imports

```text
frontend/docs/storybook/
├── README.md
├── examples/Contacts/       complete injected reference feature
├── patterns/               capability-grouped panels and shared gallery
├── handbook/Handbook/       article catalog, metadata search and reader
├── shared/documentation/   reference-only Markdown rendering
├── architecture/
│   ├── ArchitectureReference/  reader for canonical architecture articles
│   ├── SourceOwnership/       SourceOwnership.mdx and .stories.tsx
│   ├── DependencyDirection/
│   ├── PublicModuleApis/
│   ├── RuntimeAndState/
│   └── shared/                walkthrough component and selected examples
├── routing/
│   ├── HeaderTabs/            MDX, CSF, example, preview and routes
│   ├── LeftNavigation/
│   ├── StandalonePages/
│   ├── NavigationChooser/
│   ├── UrlBackedState/
│   └── shared/                address bar and browser frame
├── forms/
│   ├── EntityForms/           MDX, CSF and form preview
│   └── DraftAndSubmitForms/
├── feedback/
│   ├── Notifications/         MDX, CSF and notification preview
│   └── Confirmations/         MDX, CSF and confirmation preview
├── data/
│   ├── FeatureData/           MDX, CSF and private in-memory API fixture
│   └── BackendConnectedFeature/
├── collections/
│   └── TablesAndCollections/  MDX, CSF and collection preview
├── localization/
│   └── LocalizationAndFormatting/  MDX, CSF and formatting preview
├── state/
│   └── SignalsAndPersistence/     MDX, CSF and private Signal/storage fixture
├── settings/
│   └── SettingsAwareComponents/   MDX, CSF and local presentation comparison
├── authentication/
│   ├── AuthenticationAndHttp/     MDX, CSF and private HTTP transport fixture
│   └── CapabilityAwarePages/
├── workflows/
│   └── WorkflowCommands/          MDX, CSF and command/reconciliation fixture
├── notifications/
│   └── PersistedInbox/            MDX, CSF and private retained server fixture
└── testing/
    └── TestingAFeature/           MDX, CSF and executable boundary observations
```

Keep same-name MDX and CSF `*.stories.ts(x)` files in their matching tutorial
folder, along with its preview support. Helpers used by several tutorials go in
the section's `shared/` folder. New sections get their own directory and an entry
here. Storybook configuration,
global providers and theme adapters stay in `frontend/.storybook/`; tests stay
under `frontend/tests/`. Stories and support files do not belong in `src/`.

Use relative imports between documentation fixtures and `@/` for actual source
modules. A documentation fixture may import the exact implementation it teaches,
such as the private ContactForm. This does not publish that member or authorize
production consumers to bypass feature public indices. Production source may
not import these fixtures or `.storybook/` support. Production also cannot import any other `docs/` content, including raw
architecture/handbook Markdown or globs. Reader rendering is documentation-owned.

Keep application paths and fenced application code separate from preview paths:
Contacts, Patterns, article readers, catalogs and guide translations are
documentation references outside `src/`. Application paths in consumer recipes
name modules to implement explicitly; they are not installed merely by appearing
in a tutorial.
Stories remain English and inherit the global theme/localization/feedback adapter.
Retain stable story titles and named exports when reorganizing files so existing
Storybook URLs and browser checks continue to work.

## Discovery and verification

From the workspace root:

```sh
npm --prefix frontend run guide:index
npm --prefix frontend run guide:index -- search "header tabs"
npm --prefix frontend run verify:architecture
npm --prefix frontend run verify:dev-guide
```

The live index reads every file in this tree without evaluating examples. Legacy
source discovery can expose misplaced stories; it does not permit placing them
there. Typechecking includes documentation TypeScript through
`tsconfig.storybook.json`. The architecture check rejects source-local story
artifacts and production dependencies on documentation fixtures.

After changes, select the owning repository checks and actual Storybook browser
coverage. With Storybook running, `npm --prefix frontend run test:browser:storybook`
checks routing, forms, feedback, architecture, data, collections, localization,
URL state, Signals, settings-aware presentation, authentication and testing examples.
The advanced reference recipes add capability gates, HTTP feature contracts,
dual-intent forms and guards, workflow conflict/refresh recovery, and inbox ownership.
The configured checks and their
limits are documented in
[Tests, mocks, stories, and architecture checks](../architecture/en/tests-mocks-stories-and-architecture-checks.md).
