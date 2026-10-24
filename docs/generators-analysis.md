# Generator analysis and pattern traceability

This report records why the generator catalog uses its selected patterns. Read the
[machine-readable catalog](../tools/generators/registry.mjs) for current generator
metadata. This report is source analysis, not a record of successful runtime
checks; compilation, browser and database evidence belongs to the implementation
verification report.

## Baseline and architectural precedence

The analysis inspected these available local source repositories:

| Source                      | Inspected revision                         | Scope                                                                                                          |
| --------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `vireocode-web-app-starter` | `a7defb9e45dc418036d4d62af742fadf42ffde05` | Frontend, backend, guides, tests, tooling and agent instructions, including pre-existing working-tree changes. |
| `client-discovery-app`      | `9fcbf2f17a09329333c3d53c7a3750c48fc1db52` | Actual frontend and backend in one repository; its working tree was clean during inspection.                   |

Client Discovery paths below identify files at its pinned revision. Starter paths
identify the inspected working tree based on its listed revision, including
pre-existing additions such as the shared HTTP error owner; those additions are
not claimed to exist in the baseline commit. Guide links describe that working-tree
contract; older revisions inside those articles retain their original provenance.
The new generator implementation is a separate change from these baselines.

Precedence is: explicitly approved decisions, Development Guide requirements,
installed starter conventions, then reusable Client Discovery patterns. The
[installed-stack guide](../frontend/docs/development-guide/en/developer-workflow/template-evolution/identify-the-installed-stack-profile.md)
is consequential: despite the project name, this checkout uses
`@rgo-web/frontend` 1.0.3 and application-owned Spring Boot source. Its toolchains
are Node 24/npm 12 and Java 21/Spring Boot 4.1.1. The separate Vireo framework,
multi-package exports, JVM artifacts, projection metadata and `create-vireo`
commands are reference material. This work does not migrate the installed stack.

Discovery used the live Development Guide index, full-text/source searches and
actual implementations. The initial inventory contained 627 files across frontend,
backend, quality, CI, delivery, developer and agent workflow owners. There was no
installed unified application-source generator. Existing initialization and
specification tooling has a different responsibility; the installed frontend
library publishes its package-root API, not its maintainer-only scripts.

## Installed frontend patterns and Client Discovery adaptations

### Approved workflow recipe iteration

The follow-up based on starter `61051c79f212fa6f5197bb70a91debc67ee1f645` selects four additional frontend workflows after read-only inspection of Client Discovery, LMS and FRED and Bruno's approval of the recommended batch. They extend existing kinds as variants, retaining default output and automatic preview discovery. The base generators already supply useful bounded forms/tables but do not cover these complete workflows; the new pure renderers reuse their installed controls and ownership conventions.

| Variant             | Source pattern                                                                                                             | Current implementation boundary                                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `feature/workspace` | Client Discovery `frontend/src/features/sales/components/LeadList.tsx`; LMS `src/pages/vessels/LmsPageVessels.tsx`         | Controlled server collection and caller-owned writes; current Contacts overlay controller supplies guarded, session-aware detail/edit presentation. |
| `form/wizard`       | Client Discovery `frontend/src/app/forms/components/AppTopicEditor.tsx`                                                    | One current RGO/TanStack form, retained section values, review, error focus and final acknowledged submission. Navigation is not a partial command. |
| `form/collection`   | FRED `src/features/navigation/features/flight-log/components/FlightLogForm/FlightLogForm.tsx`; LMS aggregate-editor recipe | Stable local/persisted child identities, isolated staged child draft and one complete parent save. No historical form/table wrapper is copied.      |
| `page/report`       | LMS `src/features/statistics/components/StatisticsReportTableCard/StatisticsReportTableCard.tsx`                           | Explicit applied request/result scope, state presentation and delegated asynchronous export. The preview owns a bounded in-memory download example. |

Client Discovery provenance remains `9fcbf2f17a09329333c3d53c7a3750c48fc1db52`. Peer references use LMS `09a8ea2fc438652a90e4400c088c282b81845443` and FRED `7a78e4f624e4b51ce1cdb9334036f2fb6119f62a`, as identified by the source-backed guide. Their older UI dependencies are interaction references, not dependencies for generated applications. Persistence, production route policy, authorization, revision/conflict semantics and export delivery protocols remain with the adopting feature.

The historical candidate matrix below describes the initial catalog. Its deferred server collection/overlay boundary is now covered by the explicitly selected workspace variant; it is not a new generic persistence or authorization contract. Execution evidence for this iteration belongs in [generator verification](generators-verification.md).

The governing owners are the architecture articles for
[source placement](../frontend/docs/architecture/en/source-map-and-ownership.md),
[feature interfaces](../frontend/docs/architecture/en/feature-anatomy-filenames-and-public-interfaces.md),
[feature lifecycle](../frontend/docs/architecture/en/add-change-or-remove-a-feature.md),
[API/query boundaries](../frontend/docs/architecture/en/apis-models-queries-and-mutations.md),
[route composition](../frontend/docs/architecture/en/route-entries-and-feature-composition.md),
and [verification](../frontend/docs/architecture/en/tests-mocks-stories-and-architecture-checks.md).

| Pattern                                     | Starter source paths                                                                                                                                                                                                                                                                                                      | Client Discovery source paths                                                                                                      | Generator and adaptation                                                                                                                                                                                                                                                                   |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Component ownership and composition         | `frontend/src/features/development-guide/contacts/index.ts`; `frontend/src/features/development-guide/contacts/components/ContactForm.tsx`                                                                                                                                                                                | `frontend/src/features/sales/components/LeadForm.tsx`                                                                              | `frontend/component`, `frontend/page`, `frontend/feature`: deliberate feature exports, relative internal imports and public cross-owner imports. A presentational owner gets no empty runtime, API or Signal scaffolding.                                                                  |
| Typed form and validation lifecycle         | `frontend/src/app/forms/types/AppEntityForm.ts`; `frontend/src/app/forms/utils/buildAppEntityFormOptions.ts`; `frontend/src/app/forms/hooks/useFormStateReporter.ts`; `frontend/src/features/development-guide/contacts/components/ContactForm.tsx`; `frontend/src/features/development-guide/contacts/models/Contact.ts` | `frontend/src/features/sales/components/LeadForm.tsx`; `frontend/src/features/sales/models/leadForms.ts`                           | `frontend/form`, `frontend/feature`: reuse `useRgoForm`, explicit create/update mode, localized Zod validation, pending/disabled state and awaited caller-owned submission. Generate bounded text fields; retain business choices, relationships and command normalization in the feature. |
| Layout slots and responsive presentation    | `frontend/src/app/shell/components/AppShell.tsx`; `frontend/src/app/shell/components/AppPageNavigation.tsx`; `frontend/src/app/shell/documentation/DocumentationPageLayout.tsx`                                                                                                                                           | `frontend/src/features/lifecycle/components/LifecyclePageLayout.tsx`                                                               | `frontend/shell`: feature-local header/sidebar/content composition. Reuse MUI/theme breakpoints. Do not duplicate the global authenticated shell or copy consumer-specific route/navigation helpers.                                                                                       |
| Table presentation and collection ownership | `frontend/src/features/development-guide/contacts/components/ContactsTable.tsx`; `frontend/src/features/development-guide/contacts/hooks/useContactTableColumns.tsx`; `frontend/src/features/development-guide/patterns/tablesAndCollections/components/SortingAndPaginationPanel/LocalPaginationPreview.tsx`             | `frontend/src/features/sales/components/SalesTable.tsx`                                                                            | `frontend/table`, `frontend/feature`: current `RgoDesktopTable`, stable row identity, localized pagination, density preferences and caller-owned data. Generated local filtering/sorting/paging requires the complete bounded collection. No invented server paging contract.              |
| HTTP adapters and schema validation         | `frontend/src/app/data/http/createAppAxios.ts`; `frontend/src/features/development-guide/contacts/api/contact.api.ts`; `frontend/src/features/development-guide/contacts/api/contact.api.browser-storage.ts`                                                                                                              | `frontend/src/features/sales/api/sales.api.http.ts`; `frontend/src/features/specifications/api/specifications.api.http.ts`         | `frontend/api`: explicit API port and injected Axios adapter, encoded identifier, forwarded abort signal and Zod response parsing. Use a read-by-UUID contract compatible with the backend read slice. Do not introduce another global HTTP client.                                        |
| Query identity and options                  | `frontend/src/features/development-guide/contacts/api/contact.querykeys.ts`; `frontend/src/features/development-guide/contacts/api/contact.query.ts`; `frontend/src/features/development-guide/contacts/contacts.feature.ts`                                                                                              | `frontend/src/features/specifications/api/specifications.api.http.ts`; `frontend/src/features/sales/components/SalesWorkspace.tsx` | `frontend/api`: compose key/options with the API bundle. Caller supplies actual identity and runtime wiring. Private cache disposal remains an explicit application/session responsibility; query data is not mirrored into Signals.                                                       |
| Route and page ownership                    | `frontend/src/app/router/routeRegistry.tsx`; `frontend/src/app/router/routeHierarchy.tsx`; `frontend/src/app/router/types/AppRoute.ts`; `frontend/src/pages/development-guide`                                                                                                                                            | `frontend/src/app/router/routes.tsx`; `frontend/src/features/sales/components/SalesWorkspace.tsx`                                  | `frontend/page` makes a thin page over the feature interface. Every visual generator gets a development-only example through the existing route registry. Production product-route and permission decisions remain application-owned.                                                      |
| State ownership                             | `frontend/src/features/development-guide/contacts/hooks/useContactsWorkspace.ts`; `frontend/src/features/development-guide/patterns/applicationState/signals`                                                                                                                                                             | `frontend/src/features/sales/components/SalesWorkspace.tsx`; `frontend/src/app/bootstrap/signals/initSignalEffects.ts`             | Generated visual components use local state for local interactions. Remote state stays in Query. No Signal lifecycle registration is generated without an actual application-lifetime responsibility.                                                                                      |
| Localization and theme                      | `frontend/src/app/localization/translations/translation.en.ts`; `frontend/src/app/localization/translations/translation.hr.ts`; `frontend/src/app/theme/preferences/useAppDisplayPreferences.ts`                                                                                                                          | `frontend/src/features/sales/content/copy.ts`; `frontend/src/features/lifecycle/content/pageCopy.ts`                               | Visual output uses starter typed bilingual resources and established MUI tokens/preferences. Consumer-local copy objects inform labels but do not replace installed translation ownership. Custom domain translations remain reviewable developer input.                                   |
| Boundary tests and fixtures                 | `frontend/tests/setup.ts`; `frontend/tests/server.ts`; `frontend/tests/features/development-guide`; `frontend/tests/integration`                                                                                                                                                                                          | `frontend/tests/features/sales/models/leadForms.test.ts`; `frontend/tests/features/sales/components/SalesWorkspace.test.tsx`       | Form/schema and API contract tests accompany applicable generators. Generator integration verification must compile actual emitted output and exercise real preview routes. Source inspection alone does not satisfy those checks.                                                         |

The [form mode guide](../frontend/docs/development-guide/en/frontend/forms/entity-modes-and-validation-policy.md)
owns submit timing and acknowledgement. The
[structured-fields recipe](../frontend/docs/development-guide/en/frontend/forms/schema-driven-fields-and-explicit-choices.md)
does not install Client Discovery's renderer. The
[table ownership guide](../frontend/docs/development-guide/en/frontend/collections/client-and-server-table-ownership.md)
and [query identity guide](../frontend/docs/development-guide/en/frontend/collections/query-key-scope-and-invalidation.md)
explain the deliberate collection and cache scope limits.

## Installed backend patterns and Client Discovery adaptations

The authoritative backend contracts are
[feature boundaries](../frontend/docs/development-guide/en/backend/foundation/http-service-persistence-boundaries.md),
[safe HTTP errors](../frontend/docs/development-guide/en/backend/foundation/validation-and-error-contracts.md),
[Flyway ownership](../frontend/docs/development-guide/en/backend/data/flyway-and-schema-ownership.md),
[transaction boundaries](../frontend/docs/development-guide/en/backend/application-services/transactional-commands.md),
and [real PostgreSQL/HTTP tests](../frontend/docs/development-guide/en/quality/backend/real-postgres-and-http-contracts.md).

| Pattern                                  | Starter source paths                                                                                                                                                                                                                        | Client Discovery source paths                                                                                                                                                               | Generator and adaptation                                                                                                                                                                                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Feature package and layer direction      | `backend/src/main/java/com/vireocode/backend/auth/AuthController.java`; `backend/src/main/java/com/vireocode/backend/user/AppUserRepository.java`; `backend/src/test/java/com/vireocode/backend/architecture/BackendArchitectureRules.java` | `backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectPreparationController.java`; `backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectFilesService.java` | All backend generators keep a small feature flat, with transport → service → own persistence. No global role packages or empty layers.                                                                                                                                  |
| Request/response records and validation  | `backend/src/main/java/com/vireocode/backend/auth/AuthController.java`                                                                                                                                                                      | `backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectPreparationModel.java`                                                                                                | `backend/dto`: request validation and separate explicit response projection. Preserve typed starter records; do not copy consumer map transport or application-specific workbook validation.                                                                            |
| Entity and repository                    | `backend/src/main/java/com/vireocode/backend/user/AppUser.java`; `backend/src/main/java/com/vireocode/backend/user/AppUserRepository.java`                                                                                                  | `backend/src/main/java/com/vireocode/clientdiscovery/user/AppUser.java`; `backend/src/main/java/com/vireocode/clientdiscovery/user/AppUserRepository.java`                                  | `backend/domain`, `backend/repository`, `backend/feature`: protected JPA constructor, UUID identity, mapped bounded scalar fields and typed repository. Client Discovery's business discovery feature uses JDBC; a generic business JPA repository was not found there. |
| Service transaction and explicit mapping | `backend/build.gradle`; `backend/src/main/resources/application.yaml`                                                                                                                                                                       | `backend/src/main/java/com/vireocode/clientdiscovery/discovery/DiscoveryService.java`; `backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectFilesService.java`             | `backend/service`, `backend/feature`: constructor injection, read-only transaction and selected entity-to-response mapping before leaving the transaction. No generic mapper/service base class.                                                                        |
| HTTP delegation and authentication       | `backend/src/main/java/com/vireocode/backend/auth/SecurityConfiguration.java`; `backend/src/main/java/com/vireocode/backend/auth/AuthController.java`                                                                                       | `backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectPreparationController.java`                                                                                           | `backend/controller`, `backend/feature`: typed read-by-UUID endpoint delegates to its own service. Existing global authenticated-session policy applies; no generated write permission, account lookup or tenant policy.                                                |
| Validation and safe failure translation  | `backend/src/main/java/com/vireocode/backend/http/ApiErrors.java`; `backend/src/main/java/com/vireocode/backend/http/ApiExceptionHandler.java`; `backend/src/main/java/com/vireocode/backend/auth/AuthExceptionHandler.java`                | `backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectPreparationController.java`                                                                                           | DTO validation and ordinary framework exceptions reuse global starter advice. Do not copy consumer exception-reason responses or call the narrowly published authentication error factories from a new feature.                                                         |
| Database migrations and constraints      | `backend/src/main/resources/db/migration/V1__create_users.sql`; `backend/src/main/resources/db/migration/V2__create_sessions.sql`; `backend/src/main/resources/application.yaml`                                                            | `backend/src/main/resources/db/migration/V3__discovery.sql`; `backend/src/main/resources/db/migration/V10__specification_development.sql`                                                   | `backend/domain`, `backend/feature`: entity and new forward Flyway migration together; Hibernate validates, Flyway performs DDL. Scalars only; no inferred cascades, memberships, audit or relationship lifecycle.                                                      |
| Unit testing                             | `backend/src/test/java/com/vireocode/backend/user/ProvisionUserRunnerTests.java`                                                                                                                                                            | `backend/src/test/java/com/vireocode/clientdiscovery/discovery/ProjectLifecyclePolicyTests.java`                                                                                            | Generated service tests use JUnit/AssertJ/Mockito for actual mapping and not-found outcomes.                                                                                                                                                                            |
| Real HTTP, migrations and fixtures       | `backend/src/test/java/com/vireocode/backend/AuthIntegrationTests.java`; `backend/src/test/java/com/vireocode/backend/TestcontainersConfiguration.java`                                                                                     | `backend/src/test/java/com/vireocode/clientdiscovery/DiscoveryIntegrationTests.java`; `backend/src/test/java/com/vireocode/clientdiscovery/TestcontainersConfiguration.java`                | `backend/feature` composes disposable PostgreSQL, fresh cookie client, real session login and repository-seeded synthetic records. Fixture sharing and migration-count checks must allow added feature migrations without weakening original-schema assertions.         |

Backend scalars are `string`, `integer` and `boolean`, represented with `String`,
`Integer` and `Boolean`. Optional values retain nullability. Request constraints,
JPA column bounds and SQL must agree. UUID identity is server-owned; relationships,
decimal arithmetic, temporal semantics, optimistic revisions and PATCH presence
semantics need separately justified patterns.

The complete backend composite is a **read-only shared-authenticated record
feature**. It includes only layers needed by that pattern. A request DTO is
available independently, but a read endpoint does not acquire an unused create
request. Existing session authentication does not guarantee newly disabled
account checks on every business action, row ownership, tenant isolation or
administrator permission. Generated code must not advertise those guarantees.

## Candidate inventory and prioritization

Ratings are qualitative engineering assessments from the inspected code, not
usage telemetry. `H/M/L` mean high/medium/low. Frequency estimates expected
recurrence in ordinary feature work; repetition measures boilerplate; consistency
measures available source-backed shape. Coverage is useful output coverage within
the stated bounded pattern. Composition and compile fit assess feasibility, not
executed verification. Maintenance is expected effort: lower is preferable.

| Frontend candidate category                       | Frequency | Repetition | Consistency | Coverage | Composition | Compile fit | Maintenance | Decision                                                                                                                            |
| ------------------------------------------------- | --------- | ---------- | ----------- | -------- | ----------- | ----------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| React components and component composition        | H         | H          | H           | H        | H           | H           | L           | `component`; small localized presentation with explicit callbacks.                                                                  |
| Form components                                   | H         | H          | H           | H        | H           | H           | M           | `form`; typed text fields, lifecycle and examples.                                                                                  |
| Reusable form fields                              | M         | M          | H           | M        | H           | H           | L           | Reuse existing library/app controls. Field emission is composed into forms; no duplicate standalone control system.                 |
| Validation schemas                                | H         | H          | H           | H        | H           | H           | L           | Compose into form/feature and API models; domain cross-field rules remain custom.                                                   |
| Shell and layout components                       | M         | H          | M           | H        | H           | H           | M           | `shell` provides feature layout slots; global shell replacement is excluded.                                                        |
| Pages and route modules                           | H         | M          | H           | M        | H           | H           | M           | `page` emits thin adapter and automatic guide route; production route policy remains explicit.                                      |
| Feature modules and complete frontend scaffolding | H         | H          | H           | H        | H           | H           | M           | `feature` composes form/table/model/example output with caller-owned rows and writes.                                               |
| Data tables                                       | H         | H          | H           | H        | H           | H           | M           | `table`; current RGO API and complete bounded client collection.                                                                    |
| List views with filtering, sorting and pagination | H         | H          | H           | M        | H           | H           | M           | Covered by table/feature locally. Server request/totals/selection policy remains deferred.                                          |
| Dialogs and drawers                               | M         | M          | H           | M        | H           | M           | H           | Reuse installed overlays and guard/result examples. Dedicated generator deferred until the command/session contract is selected.    |
| API clients and TanStack Query hooks/options      | H         | H          | H           | H        | H           | H           | M           | `api` bundles port, HTTP adapter, schema, keys/options and contract tests. Runtime composition/cache cleanup stay with their owner. |
| TypeScript types and interfaces                   | H         | M          | H           | H        | H           | H           | L           | Generated with the structure that owns them; no standalone empty type file.                                                         |
| Localization resources                            | H         | H          | H           | H        | H           | H           | L           | Paired typed resources accompany visual output; custom domain wording remains input/review.                                         |
| Reusable hooks and state management               | M         | L          | M           | L        | M           | M           | H           | Query options are covered; arbitrary hooks/Signal lifetimes depend on real responsibilities and are deferred.                       |
| Unit/component tests                              | H         | M          | H           | M        | H           | H           | M           | Generate relevant schema/API tests and verify actual UI examples. Arbitrary assertion-free test scaffolds are excluded.             |
| Other reusable structures: guide demos            | H         | H          | H           | H        | H           | H           | M           | Mandatory part of every visual generator, using existing providers/router.                                                          |

| Backend candidate category                                              | Frequency | Repetition | Consistency | Coverage | Composition | Compile fit | Maintenance | Decision                                                                                                        |
| ----------------------------------------------------------------------- | --------- | ---------- | ----------- | -------- | ----------- | ----------- | ----------- | --------------------------------------------------------------------------------------------------------------- |
| Domain entities and models                                              | H         | H          | H           | H        | H           | H           | M           | `domain`; bounded scalar entity plus migration. Rich aggregates/relationships deferred.                         |
| Request and response DTOs                                               | H         | H          | H           | H        | H           | H           | L           | `dto` variants; separate read/write shapes and scalar validation.                                               |
| Controllers and REST endpoints                                          | H         | H          | H           | H        | H           | H           | L           | `controller`; GET over compatible existing read service, or feature composition.                                |
| Services                                                                | H         | M          | H           | H        | H           | H           | M           | `service`; feature-local read and mapping, no empty universal service base.                                     |
| Repositories                                                            | H         | H          | H           | H        | H           | H           | L           | `repository`; existing compatible same-feature JPA entity required.                                             |
| DTO/domain mappers                                                      | M         | M          | M           | M        | H           | H           | L           | Explicit read projection inside generated service; no unnecessary mapper file/dependency.                       |
| Validation components                                                   | M         | M          | H           | M        | H           | H           | M           | Jakarta constraints in request DTOs. Custom cross-field validators need concrete reusable semantics.            |
| Exception-handling structures                                           | L         | L          | H           | H        | H           | H           | L           | Reuse installed global safe envelope; do not generate competing advice or new domain codes.                     |
| Database migrations                                                     | H         | H          | H           | H        | H           | H           | M           | Generated with domain/feature and explicit fresh version. Arbitrary schema evolution/backfill is not inferable. |
| Unit tests, integration tests and fixtures                              | H         | H          | H           | H        | H           | H           | M           | Relevant service tests and real HTTP/database feature tests; synthetic fixture data.                            |
| Complete backend feature scaffolding                                    | H         | H          | H           | H        | H           | H           | M           | `feature`; complete read-only selected pattern, no automatic write authority.                                   |
| Other structures: audit, revision, tenant, provider and batch protocols | M         | M          | L           | L        | M           | L           | H           | Useful documented recipes, deferred until concrete authority/invariant/lifecycle contracts exist.               |

Standalone categories are deliberately consolidated where one composite produces
equivalent complete output. A generated form already owns its model, schema,
labels and example; invoking overlapping generators would create duplication.
Repository/service/controller fragments require compatible prerequisites rather
than emitting unresolved type references. Frontend fields are deliberately text
only: numeric empty/null/zero and date/instant semantics need their own design.

## Development Guide integration and existing coverage

The richer layout recipes extend the installed composition surfaces at baseline
`a8d8632086a26c33d6a2d8f15f9aa8446daef95a`: `frontend/src/app/shell/components/AppPageNavigation.tsx`
owns the responsive page rail and mobile sheet; `frontend/src/app/router/routeHierarchy.tsx`
owns nested routes and header sections; `frontend/src/app/router/handbookRoutes.tsx`
establishes router-owned factories. The workspace shell composes that existing
page navigation. Dashboard/detail pages expose data and content props rather than
choosing transport or write policy. The navigation composite emits a factory
under `app/router/generated/`; the existing preview owner mounts it in development
and product composition can mount it explicitly elsewhere. No consumer-specific
navigation framework or duplicate application header is copied.

The installed guide already contains interactive Forms, Overlays, Tables and
collections, Server data, Application state, Routing and URLs, Localization and
Feedback examples, plus complete Contacts dashboard/CRUD pages. Its router,
hierarchy, navigation metadata, authenticated providers and development-only
branch are the integration owners. No separate preview application is required.

Generated visual output adds a real component-consuming example beneath
`frontend/src/pages/development-guide/generated/<kind>/`; the navigation composite
instead emits a router-owned factory so its preview exercises the actual nested
route hierarchy. Router-owned discovery uses these files to supply ordinary route definitions and an index under
`/dev-guide/frontend/generated`. Example removal is reflected by discovery; no
independent registration manifest or manual per-example route edit is needed.
Generated demonstration writes are in-memory callbacks, not production requests.
Nonvisual API output has no dedicated visual page.

This is a source-based coverage plan, not an exhaustive runtime audit:

| Priority | Existing surface                                          | Evidence and next useful example                                                                                                                                                                                                                                     |
| -------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1        | `src/app/forms/components/AppSingleChoiceToggleGroup.tsx` | No direct usage was found in the inspected guide feature/page sources. Add a focused controlled-choice example covering selection, required choice and keyboard behavior before creating another reusable field abstraction.                                         |
| 1        | Authentication form                                       | `src/app/auth/components/LoginForm.tsx` belongs to the actual login flow; existing auth integration tests exercise it. A dedicated isolated guide demonstration of safe validation/failure/submitting states would improve discoverability without real credentials. |
| 2        | Shell controls and responsive navigation                  | Locale/color controls and page navigation are exercised within the assembled shell/documentation UI. Add focused state examples only where the assembled route does not make a behavior inspectable; preserve the existing navigation owners.                        |
| 2        | Generated visual families                                 | Each generated component/form/shell/table/page/feature must receive its own actual-component example and meaningful supported interaction states automatically.                                                                                                      |
| 3        | Contacts, Forms, Overlays and Tables patterns             | Existing dedicated examples already cover these owners. Extend missing scenarios rather than rewriting their source merely to produce another demonstration.                                                                                                         |

## Valuable consumer patterns retained as references

Client Discovery demonstrates richer patterns that should remain available for
future feature design without becoming generic boilerplate:

- `frontend/src/features/sales/models/leadForms.ts`: explicit current choices,
  conditional conversion branches, nullable wire normalization and date handling.
  These carry business meaning beyond a scalar form generator.
- `frontend/src/features/sales/components/SalesWorkspace.tsx`: actor-scoped
  admission, cache cancellation/removal, route-owned editing lifetime and denied
  state. Generated presentation must not claim those security guarantees.
- `frontend/src/features/lifecycle/components/LifecyclePageLayout.tsx`: task-aware
  navigation and responsive container ownership. Its consumer-specific helpers
  are not installed starter APIs.
- `backend/src/main/java/com/vireocode/clientdiscovery/discovery/DiscoveryService.java`:
  enabled actors, administrator policy, scoped locks, expected revision and
  transactionally retained audit. Its direct user persistence dependency and
  ADMIN/CLIENT roles do not satisfy the starter's published feature boundaries.
- `backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectFilesService.java`:
  bounded uploads, shared quota locks and metadata/content separation. A file
  scaffold cannot infer storage, privacy or retention obligations.
- `backend/src/main/resources/db/migration/V10__specification_development.sql`:
  scoped relationships and retained immutable versions. These are domain-specific
  constraints, not defaults for every generated entity.

## Decisions, limits and follow-up guidance

The selected generators preserve the documented stack, feature interfaces,
existing providers and lifecycle conventions. The user's request authorizes the
unified CLI, composable templates, automatic examples and generator-first policy;
no architectural migration is required for that implementation.

Future CRUD authority, tenant/private record access, live account validation,
cross-feature collaborations, PATCH presence, relationship deletion, domain error
codes and server collection protocols need explicit decisions before their
affected generators are extended. The existing guides already identify these
seams. Keep unrelated generation available while those choices are deferred.

Improve guidance by documenting the installed CLI separately from older Vireo
reference commands, linking generator discovery from each agent entry point,
describing generated-once ownership and safe conflict handling, and publishing
the selected-pattern limits beside each catalog entry. Preserve the
[generated ownership distinction](../frontend/docs/development-guide/en/developer-workflow/template-evolution/generated-once-and-regenerated-ownership.md):
application source and applied migrations are adopted code; only explicitly
mechanical indexes may be regenerated after validating their current contents.

The compatibility rubric is evidence about the specific structure: architecture
30%, libraries/patterns 25%, output coverage 25%, workflow integration 20%; the
default threshold is 80%. Architectural violations and unsafe/destructive output
disqualify regardless of score. Static policy and representative execution can
verify instructions and tooling; they cannot guarantee all future agent behavior.
