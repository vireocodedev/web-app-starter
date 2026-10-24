# Generator implementation evidence

The implementation targets the current working tree based on `a7defb9e45dc418036d4d62af742fadf42ffde05`, preserving pre-existing changes. The [catalog and policy](generators.md) and [source analysis](generators-analysis.md) describe its contract and provenance.

## Reproduce

```sh
npm run test:generators
npm run verify:generated
npm run verify:generated -- --frontend --browser
```

The rehearsal copies current source into a fresh `/tmp/starter-generator-rehearsal-*` workspace, shares installed package bytes, and owns its compiler/bundler caches. It generates all supported kinds and records actual paths and command outcomes in `rehearsal.json`. No disposable feature source is committed. It runs commands sequentially. Docker/Testcontainers and JDK 21 are required for backend tests; installed Chrome is used by the existing browser workflow.

## Execution record

Source: working tree based on `a7defb9e45dc418036d4d62af742fadf42ffde05`, with existing work preserved. Client Discovery frontend/backend analysis used `9fcbf2f17a09329333c3d53c7a3750c48fc1db52`. Execution used Node 24.18.1, pinned npm 12, Java 21.0.2, Docker 29.8.0 and installed Chrome on Linux. Checks ran sequentially through the repository verification helper; logs retain complete command output.

| Check                                                                                                              | Actual result                                                                                                                      | Evidence log under `/tmp/`                                                                         |
| ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Generator CLI, all kinds, safety, determinism, lifecycle and policy                                                | 24 tests passed                                                                                                                    | `repo-verification-1000-1cox5u_3/output.log`                                                       |
| Actual generated frontend formatting, lint, architecture and TypeScript                                            | Passed                                                                                                                             | `repo-verification-1000-3m7aczbk/output.log` (completed stages before interrupted browser harness) |
| Emitted form/schema/API/Query and router tests                                                                     | 16 tests passed in 5 files                                                                                                         | Same generated-output log                                                                          |
| Generated production build and preview-isolation assertions                                                        | Passed; preview modules/fixture markers absent from manifest/chunks                                                                | Same generated-output log                                                                          |
| Browser navigation/component, form lifecycle, responsive layout, page-content/composite and locale/draft scenarios | 5 passed in corrected run                                                                                                          | `repo-verification-1000-_utyz_em/output.log`                                                       |
| Table browser scenario after its loading-status assertion was corrected                                            | 1 passed                                                                                                                           | `repo-verification-1000-9plihn0x/output.log`                                                       |
| Generated backend compilation, tests and bootJar                                                                   | 44 tests passed: 10 generated cases plus 34 architecture/proof cases; no failures/errors/skips                                     | `repo-verification-1000-ou15u281/output.log`                                                       |
| Full source frontend `verify`                                                                                      | Passed: generator 24, live-index 5, Vitest 615 in 91 files, all static gates, 159 paired articles, production and Storybook builds | `repo-verification-1000-jxt2gzdz/output.log`                                                       |
| Full source backend `test bootJar`                                                                                 | 62 tests passed across 6 suites, no failures/errors/skips; bootJar passed                                                          | `repo-verification-1000-g9qt8udb/output.log`                                                       |
| CI owner selection                                                                                                 | 4 unittest methods passed, including generator-only paths                                                                          | `repo-verification-1000-8gb8dlck/output.log`                                                       |

The six intended browser scenarios have passing evidence across the corrected five-case run and focused table retry. This is not a claim that the earlier interrupted aggregate run passed. The final generated fixture is `/tmp/starter-generator-rehearsal-Di9rTm`; its inventory and original stage receipt remain in `rehearsal.json`, with later browser/backend outcomes in the separate logs above.

Documentation verification also passed:

| Check                                | Actual result                                                                                                                                                    | Evidence log under `/tmp/`                   |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Initialization/documentation package | Preparation 35 passed + 1 optional skip, docs 7 passed, Python contract 15 passed, offline desktop/mobile browser 1 passed, generated-document freshness passed  | `repo-verification-1000-nxwzxtjz/output.log` |
| Portable installation rehearsal      | Passed with its own lockfile/dependencies and fresh docs; optional cross-repository and template-only checks are explicitly inapplicable in the isolated package | `repo-verification-1000-e00lrzij/output.log` |

Verification caught and corrected a MUI 9 Stack prop mismatch, two preview import-boundary violations, migration-directory validation and input-name collisions. Browser harness corrections used accessible textbox/combobox/status locators and copied font assets into the isolated Vite filesystem boundary. The earlier sandbox subprocess attempt failed with `EPERM`; permitted external execution resolved it. A rejected npm 11 startup was retried through the pinned npm 12 Corepack launcher before source gates executed. These failed/interrupted attempts are not reported as passing checks.

Public dashboards were regenerated before the documentation checks (`repo-verification-1000-_uhjy8t2/output.log`). This final evidence-only prose update is followed by another documentation build/freshness check; unchanged application suites are not repeated. CI's final owner-scoped refinement was independently reviewed: frontend output is checked for frontend work, and generated backend output is checked there only when both application owners are selected.

## Scope and remaining limits

- Visual forms generate bounded text fields. Specialized controls, cross-field business choices, relations and command normalization stay with the feature.
- Backend composites are shared-authenticated read-only records. Mutation, private/tenant authority and role semantics need their specific approved contract; they are not inferred from a name.
- API runtime wiring, cache authority cleanup and product route/access policy remain explicit application composition. The frontend composite receives caller-owned rows and submission callbacks.
- Existing frontend owners are not rewritten. Adopted source/migrations are not regenerated or deleted. Preview file discovery supports preview removal/rename; paired locale maintenance is explicit.
- Page previews render the actual generated public UI used by the thin adapter. The adapter compiles but was not mounted through a production route in these browser checks.
- Verification ran on Linux. Windows path/device-name behavior has regression coverage; a native Windows execution was not performed. The full existing production/development browser suites and a manual accessibility audit were not run; focused generated scenarios cover this change.
- Generator discovery/compatibility instructions and the calculator establish an explainable workflow, not a mechanical guarantee of future agent behavior.
- CI source was updated and independently reviewed. Evidence here is local; no remote CI run or deployed-product acceptance is claimed.

Independent source review found no unresolved material finding after the documented fixes. No architectural departure was needed for the selected catalog. Deferred candidates and their approval-dependent contracts are recorded in the analysis rather than silently copied from Client Discovery.

## Per-generator verification

| Generator            | Emitted-code evidence                                | Interaction/behavior evidence                                                                                   |
| -------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `frontend/component` | TypeScript, lint, architecture, production isolation | Real component callback and discovered navigation                                                               |
| `frontend/form`      | Same static checks; emitted schema tests             | Required validation, populated/update, held submission, success, rejection, disabled, locale-preserved draft    |
| `frontend/shell`     | Same static checks                                   | Sidebar slot toggle and mobile overflow check                                                                   |
| `frontend/table`     | Same static checks                                   | Filtering, pagination, empty/loading/error and retry                                                            |
| `frontend/page`      | Thin adapter and public content compiled             | Actual public content callback rendered; the thin production adapter was not browser-mounted                    |
| `frontend/feature`   | Same static checks; emitted schema tests             | Actual form adds caller-owned rows to actual table                                                              |
| `frontend/api`       | Same static checks; HTTP/Query tests                 | Encoded IDs, signal forwarding/cancellation, additive fields, malformed input, transport failure, scoped caches |
| `backend/dto`        | Both variants compiled; request validation tests     | Required/null and bounded-text transport checks                                                                 |
| `backend/domain`     | Java/JPA compile and Flyway schema validation        | Paired forward migrations apply in fresh PostgreSQL                                                             |
| `backend/repository` | Complete separate-layer composition compiled         | Actual JPA save/read in the feature integration fixture                                                         |
| `backend/service`    | Separate and composite services compiled; unit tests | Explicit projection and 404 behavior                                                                            |
| `backend/controller` | Separate and composite controllers compiled          | Authenticated HTTP read, anonymous denial, missing/malformed IDs                                                |
| `backend/feature`    | Complete slice, migration, architecture and bootJar  | Real session/CSRF login and HTTP/PostgreSQL integration                                                         |

## Agent workflow replay

The initial repository inventory contained no compatible source generator, so the generator infrastructure itself required manual implementation. The rehearsal then discovered the new catalog and generated every supported structure. A separate actual CLI compatibility assessment of the required-title/optional-notes form returned **100 / threshold 80 / mandatory true**. Its four criteria cited the passing architecture check, installed form/schema/lifecycle interfaces, exact selected text-field coverage and actual DEV/locale/pending/error browser behavior. The assessment applies to that bounded fixture, not an arbitrary product feature.

The CLI tests additionally execute real form creation from a subprocess and verify the returned route and actual helper-based implementation. Root/frontend/backend agent instructions link the same mandatory policy. These tests validate discoverability and execution; future evidence scoring and agent compliance still require judgment.

## Practical generated structures

The rehearsal invokes the actual CLI planning/application API for component, form, shell, table, page, feature and API output, request/response DTOs, separate domain/repository/service/controller composition and the backend feature composite. Generated frontend API `GeneratorProduct` and backend `GeneratorProduct` share `/api/generator-catalog/generator-product/{id}` and declared scalar fields. API tests exercise the wire boundary without a live production backend; backend HTTP tests exercise the producer against isolated PostgreSQL. This is cross-stack contract evidence, not a claim that a deployed end-to-end product feature was accepted.

Browser-verified examples from this rehearsal use these routes:

- `/dev-guide/frontend/generated/form/generator-profile--generator-profile`
- `/dev-guide/frontend/generated/shell/generator-dashboard--generator-dashboard`
- `/dev-guide/frontend/generated/table/generator-orders--generator-orders`
- `/dev-guide/frontend/generated/feature/generator-workspace--generator-workspace`

The full file trees are in each fixture's `rehearsal.json`; the permanent catalog documents every supported file role. Runtime wiring, business routes, consumer authorization, relationships and specialized field semantics remain deliberately caller-owned.

## Rehearsal commands and actual output tree

These are the implemented CLI equivalents of the rehearsal's planning/application invocations. The isolated workspace emitted 65 distinct files across 14 invocations covering all 13 generator kinds, including both DTO variants. Versions 3 and 4 were the next versions after the inspected V1/V2 baseline. Choose the next actual version in another consumer.

```sh
npm run generate -- frontend component GeneratorCard --fields 'title,notes?'
npm run generate -- frontend form GeneratorProfile --fields 'title,notes?'
npm run generate -- frontend shell GeneratorDashboard
npm run generate -- frontend table GeneratorOrders --fields 'title,notes?'
npm run generate -- frontend page GeneratorOverview
npm run generate -- frontend feature GeneratorWorkspace --fields 'title,notes?'
npm run generate -- frontend api GeneratorProduct --feature GeneratorCatalog --fields 'title,quantity:integer?,active:boolean'
npm run generate -- backend dto GeneratorCreateProduct --fields 'title,quantity:integer,active:boolean?'
npm run generate -- backend dto GeneratorSummary --variant response --fields title
npm run generate -- backend domain GeneratorPart --fields 'title,quantity:integer?,active:boolean' --migration 3
npm run generate -- backend repository GeneratorPart
npm run generate -- backend service GeneratorPart --fields 'title,quantity:integer?,active:boolean'
npm run generate -- backend controller GeneratorPart
npm run generate -- backend feature GeneratorProduct --feature GeneratorCatalog --fields 'title,quantity:integer?,active:boolean' --migration 4
```

For a manual reproduction, supply `--root <isolated-checkout>` on each command. The CLI subprocess tests also execute actual creation of a text form, verify its emitted helper usage and returned preview route, and test dry-run/assessment/error behavior. The interactive terminal workflow was exercised separately with a no-write form plan.

The API and backend Product outputs share the same UUID detail endpoint and scalar contract. The generated Query factory accepts the injected read port and an explicit actor/tenant result scope; application runtime composition owns that injection and authority cleanup. The UI feature accepts caller-owned rows and an acknowledged write callback; no backend mutation authority is invented.

The following tree is derived from the actual rehearsal file inventory, including the mandatory locale/index/example sidecars:

```text
├── backend
│   └── src
│       ├── main
│       │   ├── java
│       │   │   └── com
│       │   │       └── vireocode
│       │   │           └── backend
│       │   │               ├── generatorcatalog
│       │   │               │   ├── GeneratorProduct.java
│       │   │               │   ├── GeneratorProductController.java
│       │   │               │   ├── GeneratorProductRepository.java
│       │   │               │   ├── GeneratorProductResponse.java
│       │   │               │   └── GeneratorProductService.java
│       │   │               ├── generatorcreateproduct
│       │   │               │   └── GeneratorCreateProductRequest.java
│       │   │               ├── generatorpart
│       │   │               │   ├── GeneratorPart.java
│       │   │               │   ├── GeneratorPartController.java
│       │   │               │   ├── GeneratorPartRepository.java
│       │   │               │   ├── GeneratorPartResponse.java
│       │   │               │   └── GeneratorPartService.java
│       │   │               └── generatorsummary
│       │   │                   └── GeneratorSummaryResponse.java
│       │   └── resources
│       │       └── db
│       │           └── migration
│       │               ├── V3__create_generatorpart_generator_part.sql
│       │               └── V4__create_generatorcatalog_generator_product.sql
│       └── test
│           └── java
│               └── com
│                   └── vireocode
│                       └── backend
│                           ├── GeneratorCatalogGeneratorProductIntegrationTests.java
│                           ├── generatorcatalog
│                           │   └── GeneratorProductServiceTests.java
│                           ├── generatorcreateproduct
│                           │   └── GeneratorCreateProductRequestTests.java
│                           └── generatorpart
│                               └── GeneratorPartServiceTests.java
└── frontend
    ├── src
    │   ├── app
    │   │   └── localization
    │   │       └── translations
    │   │           └── generated
    │   │               ├── generatorCard_component_generatorCard.en.ts
    │   │               ├── generatorCard_component_generatorCard.hr.ts
    │   │               ├── generatorDashboard_shell_generatorDashboard.en.ts
    │   │               ├── generatorDashboard_shell_generatorDashboard.hr.ts
    │   │               ├── generatorOrders_table_generatorOrders.en.ts
    │   │               ├── generatorOrders_table_generatorOrders.hr.ts
    │   │               ├── generatorOverview_page_generatorOverview.en.ts
    │   │               ├── generatorOverview_page_generatorOverview.hr.ts
    │   │               ├── generatorProfile_form_generatorProfile.en.ts
    │   │               ├── generatorProfile_form_generatorProfile.hr.ts
    │   │               ├── generatorWorkspace_feature_generatorWorkspace.en.ts
    │   │               ├── generatorWorkspace_feature_generatorWorkspace.hr.ts
    │   │               └── index.ts
    │   ├── features
    │   │   ├── generator-card
    │   │   │   ├── components
    │   │   │   │   └── GeneratorCard.tsx
    │   │   │   └── index.ts
    │   │   ├── generator-catalog
    │   │   │   ├── api
    │   │   │   │   ├── generatorProduct.api.http.ts
    │   │   │   │   ├── generatorProduct.api.ts
    │   │   │   │   ├── generatorProduct.query.ts
    │   │   │   │   └── generatorProduct.querykeys.ts
    │   │   │   ├── index.ts
    │   │   │   └── models
    │   │   │       └── GeneratorProduct.ts
    │   │   ├── generator-dashboard
    │   │   │   ├── components
    │   │   │   │   └── GeneratorDashboardShell.tsx
    │   │   │   └── index.ts
    │   │   ├── generator-orders
    │   │   │   ├── components
    │   │   │   │   └── GeneratorOrdersTable.tsx
    │   │   │   ├── index.ts
    │   │   │   └── models
    │   │   │       └── GeneratorOrders.ts
    │   │   ├── generator-overview
    │   │   │   ├── components
    │   │   │   │   └── GeneratorOverviewContent.tsx
    │   │   │   └── index.ts
    │   │   ├── generator-profile
    │   │   │   ├── components
    │   │   │   │   └── GeneratorProfileForm.tsx
    │   │   │   ├── index.ts
    │   │   │   └── models
    │   │   │       └── GeneratorProfile.ts
    │   │   └── generator-workspace
    │   │       ├── components
    │   │       │   ├── GeneratorWorkspaceFeature.tsx
    │   │       │   ├── GeneratorWorkspaceForm.tsx
    │   │       │   └── GeneratorWorkspaceTable.tsx
    │   │       ├── index.ts
    │   │       └── models
    │   │           └── GeneratorWorkspace.ts
    │   └── pages
    │       ├── development-guide
    │       │   └── generated
    │       │       ├── component
    │       │       │   └── generator-card--generator-card.example.tsx
    │       │       ├── feature
    │       │       │   └── generator-workspace--generator-workspace.example.tsx
    │       │       ├── form
    │       │       │   └── generator-profile--generator-profile.example.tsx
    │       │       ├── page
    │       │       │   └── generator-overview--generator-overview.example.tsx
    │       │       ├── shell
    │       │       │   └── generator-dashboard--generator-dashboard.example.tsx
    │       │       └── table
    │       │           └── generator-orders--generator-orders.example.tsx
    │       └── generator-overview
    │           └── GeneratorOverviewPage.tsx
    └── tests
        └── features
            ├── generator-catalog
            │   └── api
            │       ├── generatorProduct.api.http.test.ts
            │       └── generatorProduct.query.test.ts
            ├── generator-profile
            │   └── models
            │       └── GeneratorProfile.test.ts
            └── generator-workspace
                └── models
                    └── GeneratorWorkspace.test.ts
```
