# Authoring Storybook guidance

Read before adding, editing, moving or reviewing tutorials, CSF, preview fixtures,
readers, catalogs, translations, global adapters or Storybook configuration.
The [tutorial router](README.md) selects subject contracts; the
[guide maintenance contract](../development-guide/README.md#maintain-a-pattern)
owns handbook registration. Read the relevant full tutorials and inspect their
current MDX, CSF and support before changing them.

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
