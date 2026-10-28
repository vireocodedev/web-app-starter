# Storybook Development Guide

Use this router to select full tutorials for the task's contracts, including
analysis and review. The [frontend baseline](../../AGENTS.md) applies to frontend
work; the [guide workflow](../development-guide/README.md#mandatory-agent-workflow)
owns classification, expansion and conflict handling. Read selected MDX and
its authoritative articles in full, then inspect the specific current examples.
Read one language version; Storybook tutorials themselves use English.

Architecture articles retain detailed contract ownership. Load an architecture
tutorial when its concern is involved; an existing component's spacing change
does not trigger all architecture tutorials. A full feature-installation recipe
may legitimately require all four.

For tutorial/CSF/fixture/reader/catalog/configuration edits or reorganization,
first read [authoring conventions](CONTRIBUTING.md). Production implementation
loads those conventions only if it also changes documentation examples.

Read MDX directly without starting Storybook. For interactive examples, run
`npm run storybook` from `frontend/` and open **Development Guide**. Compact
selection is available with `guide:index -- route <keys...>`; use
`guide:index -- route --list frontend` to discover keys.

## Architecture — select by changed contract

- [Source ownership](architecture/SourceOwnership/SourceOwnership.mdx): creating, moving or
  removing owners/files, feature anatomy, thin pages and verification placement.
- [Dependency direction](architecture/DependencyDirection/DependencyDirection.mdx): changing imports or public composition,
  router/shell boundaries, injected construction and exceptional dependencies.
- [Public module APIs](architecture/PublicModuleApis/PublicModuleApis.mdx): adding/changing exports or cross-owner callers, private
  implementation and approved application interfaces.
- [Runtime and state ownership](architecture/RuntimeAndState/RuntimeAndState.mdx): adding/changing factories,
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
