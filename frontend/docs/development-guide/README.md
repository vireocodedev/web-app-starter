# Development guide

Use this index before implementing a web-app change. It links focused patterns for the frontend, backend, CI, delivery, local development and AI-agent workflow. The same articles are available in the authenticated development-only `/dev-guide` UI.

## Choose the smallest relevant pattern

1. Read the applicable `AGENTS.md` and the owner of the affected source.
2. Find the category and topic below; read the pattern and its failure cases.
3. Distinguish an **installed pattern** from a **reference recipe**. A recipe names seams to implement; its illustrative classes are not imports already provided by this template. Mixed articles identify both parts explicitly.
4. Confirm examples against the current application source. Pinned peer snapshots explain provenance, while the current owner defines the contract for your change.
5. Implement one observable outcome and collect the authorized acceptance evidence. Repository scripts define verification; explicit session constraints decide which commands may run. Publication, deployment and data changes require their own authorization.

Each topic has a browser index, article sidebar, local breadcrumbs and an article contents menu. English and Croatian content use the same stable paths. Code samples are inert documentation; reading a command does not run it.

## Pattern index

### Frontend workflow patterns

These source-backed recipes complement the installed interactive Patterns and Architecture tabs. Consumer-only helpers are identified explicitly; adapt the protocol in the correct owner rather than assuming those helpers are installed.

#### Access and authority

- [Capability-aware pages](en/frontend/access/capability-aware-pages.md) · [Hrvatski](hr/frontend/access/capability-aware-pages.md)
- [Revocation and private cache](en/frontend/access/revocation-and-private-cache.md) · [Hrvatski](hr/frontend/access/revocation-and-private-cache.md)

#### Route contracts

- [Typed route contracts](en/frontend/routing/typed-route-contracts.md) · [Hrvatski](hr/frontend/routing/typed-route-contracts.md)
- [Data-aware scroll restoration](en/frontend/routing/data-aware-scroll-restoration.md) · [Hrvatski](hr/frontend/routing/data-aware-scroll-restoration.md)

#### Editing sessions

- [Pinned values and revisions](en/frontend/editing/pinned-values-and-revisions.md) · [Hrvatski](hr/frontend/editing/pinned-values-and-revisions.md)
- [Drafts across routes](en/frontend/editing/drafts-across-routes.md) · [Hrvatski](hr/frontend/editing/drafts-across-routes.md)
- [Complete navigation guards](en/frontend/editing/complete-navigation-guards.md) · [Hrvatski](hr/frontend/editing/complete-navigation-guards.md)

#### Asynchronous commands

- [Owned reads and shared subscriptions](en/frontend/async-commands/owned-reads-and-shared-subscriptions.md) · [Hrvatski](hr/frontend/async-commands/owned-reads-and-shared-subscriptions.md)
- [Generation guards after await](en/frontend/async-commands/generation-guards-after-await.md) · [Hrvatski](hr/frontend/async-commands/generation-guards-after-await.md)
- [Stable retry identity](en/frontend/async-commands/stable-retry-identity.md) · [Hrvatski](hr/frontend/async-commands/stable-retry-identity.md)
- [Committed writes and observer failures](en/frontend/async-commands/committed-writes-and-observer-failures.md) · [Hrvatski](hr/frontend/async-commands/committed-writes-and-observer-failures.md)

#### Collections and query ownership

- [Client and server table ownership](en/frontend/collections/client-and-server-table-ownership.md) · [Hrvatski](hr/frontend/collections/client-and-server-table-ownership.md)
- [Query-key scope and invalidation](en/frontend/collections/query-key-scope-and-invalidation.md) · [Hrvatski](hr/frontend/collections/query-key-scope-and-invalidation.md)

#### Task interfaces

- [Topic navigation keeps one form and one owner](en/frontend/task-interfaces/topic-editors-and-error-focus.md) · [Hrvatski](hr/frontend/task-interfaces/topic-editors-and-error-focus.md)
- [Show readable evidence before an exact decision](en/frontend/task-interfaces/readable-review-and-exact-decisions.md) · [Hrvatski](hr/frontend/task-interfaces/readable-review-and-exact-decisions.md)
- [Prerequisites report evidence; receipts report acknowledged outcomes](en/frontend/task-interfaces/prerequisites-and-confirmed-receipts.md) · [Hrvatski](hr/frontend/task-interfaces/prerequisites-and-confirmed-receipts.md)

### Backend

#### Foundation

- [Runtime and configuration ownership](en/backend/foundation/runtime-and-configuration.md) · [Hrvatski](hr/backend/foundation/runtime-and-configuration.md)
- [HTTP, application service and persistence boundaries](en/backend/foundation/http-service-persistence-boundaries.md) · [Hrvatski](hr/backend/foundation/http-service-persistence-boundaries.md)
- [Validation and public error contracts](en/backend/foundation/validation-and-error-contracts.md) · [Hrvatski](hr/backend/foundation/validation-and-error-contracts.md)
- [PATCH tri-state and deliberate write DTOs](en/backend/foundation/patch-tristate-and-write-dtos.md) · [Hrvatski](hr/backend/foundation/patch-tristate-and-write-dtos.md)

#### Security

- [Session authentication and CSRF are one lifecycle](en/backend/security/session-and-csrf-lifecycle.md) · [Hrvatski](hr/backend/security/session-and-csrf-lifecycle.md)
- [Local seeding and one-time account provisioning](en/backend/security/account-provisioning.md) · [Hrvatski](hr/backend/security/account-provisioning.md)
- [Enforce resource scope in authority, queries and keys](en/backend/security/resource-scope-and-composite-keys.md) · [Hrvatski](hr/backend/security/resource-scope-and-composite-keys.md)

#### Application services

- [One transaction for one complete business command](en/backend/application-services/transactional-commands.md) · [Hrvatski](hr/backend/application-services/transactional-commands.md)
- [Notify clients after commit, and state delivery limits](en/backend/application-services/commit-aware-notifications.md) · [Hrvatski](hr/backend/application-services/commit-aware-notifications.md)

#### Data and schema

- [Flyway owns application and session schema](en/backend/data/flyway-and-schema-ownership.md) · [Hrvatski](hr/backend/data/flyway-and-schema-ownership.md)
- [Revision conflicts and shared invariant locks](en/backend/data/revision-conflicts-and-shared-locks.md) · [Hrvatski](hr/backend/data/revision-conflicts-and-shared-locks.md)
- [Stable lock order and retries in a fresh transaction](en/backend/data/lock-order-and-fresh-transaction-retries.md) · [Hrvatski](hr/backend/data/lock-order-and-fresh-transaction-retries.md)
- [Audit fields, events and immutable versions answer different questions](en/backend/data/audit-fields-events-and-versions.md) · [Hrvatski](hr/backend/data/audit-fields-events-and-versions.md)

#### Queries and read models

- [Apply visibility before search, facets and counts](en/backend/queries/visibility-before-search-and-facets.md) · [Hrvatski](hr/backend/queries/visibility-before-search-and-facets.md)
- [Bounded pagination and deliberate sort contracts](en/backend/queries/bounded-pagination-and-sort-contracts.md) · [Hrvatski](hr/backend/queries/bounded-pagination-and-sort-contracts.md)
- [One snapshot for page rows and metadata](en/backend/queries/snapshot-consistent-page-metadata.md) · [Hrvatski](hr/backend/queries/snapshot-consistent-page-metadata.md)
- [Signed cursors bind paging to semantic scope](en/backend/queries/signed-cursors-and-scope.md) · [Hrvatski](hr/backend/queries/signed-cursors-and-scope.md)
- [Bound read work and report unknown coverage honestly](en/backend/queries/read-budgets-and-unknown-coverage.md) · [Hrvatski](hr/backend/queries/read-budgets-and-unknown-coverage.md)

### Continuous integration

#### Pipelines and gates

- [Select verification by owner and always report the gate](en/ci/pipelines/owner-scoped-checks.md) · [Hrvatski](hr/ci/pipelines/owner-scoped-checks.md)
- [Bind the required gate to the policy that produced it](en/ci/pipelines/required-gates-and-main-protection.md) · [Hrvatski](hr/ci/pipelines/required-gates-and-main-protection.md)
- [Select declared application toolchains inside the job](en/ci/pipelines/pinned-toolchains-and-actions.md) · [Hrvatski](hr/ci/pipelines/pinned-toolchains-and-actions.md)

#### Verification evidence

- [Prove complete execution across test shards](en/ci/verification/complete-shard-evidence.md) · [Hrvatski](hr/ci/verification/complete-shard-evidence.md)
- [Budget concurrency at every execution layer](en/ci/verification/resource-budgets.md) · [Hrvatski](hr/ci/verification/resource-budgets.md)
- [Keep original phase deadlines and own process cleanup](en/ci/verification/phase-deadlines-and-process-cleanup.md) · [Hrvatski](hr/ci/verification/phase-deadlines-and-process-cleanup.md)

#### Worker isolation

- [Treat the disposable worker as a verified trust boundary](en/ci/isolation/disposable-worker-boundary.md) · [Hrvatski](hr/ci/isolation/disposable-worker-boundary.md)

### Delivery and operations

#### Runnable artifacts

- [Build a frontend image that can move between environments](en/delivery/artifacts/frontend-image-contract.md) · [Hrvatski](hr/delivery/artifacts/frontend-image-contract.md)
- [Separate backend compilation from restricted runtime](en/delivery/artifacts/backend-image-contract.md) · [Hrvatski](hr/delivery/artifacts/backend-image-contract.md)
- [Verify the produced image under its runtime restrictions](en/delivery/artifacts/runtime-smoke-evidence.md) · [Hrvatski](hr/delivery/artifacts/runtime-smoke-evidence.md)

#### Releases and promotion

- [Release one immutable frontend/backend image pair](en/delivery/releases/immutable-image-pairs.md) · [Hrvatski](hr/delivery/releases/immutable-image-pairs.md)
- [Stage a verified pair and promote exactly what was accepted](en/delivery/releases/staging-and-production-promotion.md) · [Hrvatski](hr/delivery/releases/staging-and-production-promotion.md)
- [Give build, publication and deployment request different authority](en/delivery/releases/build-publish-request-boundaries.md) · [Hrvatski](hr/delivery/releases/build-publish-request-boundaries.md)

#### Migration and recovery

- [Recover at the correct migration failure boundary](en/delivery/recovery/migration-failure-boundaries.md) · [Hrvatski](hr/delivery/recovery/migration-failure-boundaries.md)

### Developer workflow

#### Local development

- [One workspace, two runtimes](en/developer-workflow/local-development/workspace-runtimes.md) · [Hrvatski](hr/developer-workflow/local-development/workspace-runtimes.md)

### AI-agent workflow

#### Implementation workflow

- [Find the owner before editing](en/agent-workflow/implementation/owner-first-change.md) · [Hrvatski](hr/agent-workflow/implementation/owner-first-change.md)

## Existing frontend guidance

- Interactive Patterns: use `/dev-guide/frontend/patterns` for i18n, Signals, Server data, Routing and URLs, Overlays, Tables and collections, Forms, and Feedback.
- [Frontend ownership and architecture](../architecture/en/source-map-and-ownership.md) · [Hrvatski](../architecture/hr/source-map-and-ownership.md).
- Contacts dashboard and CRUD provide complete example pages under `/dev-guide/frontend/example-pages`.

## Maintain a pattern

Add paired `en/<category>/<topic>/<slug>.md` and `hr/...` files, one article entry in `src/features/development-guide/handbook/catalog/handbookManifest.ts`, and matching labels in `src/app/localization/translations/development-guide-handbook.{en,hr}.ts`. The manifest generates indexes, routes, breadcrumbs, command-palette entries, sidebar links and related reading. Route policy stays in `src/app/router/handbookRoutes.tsx`; shared rendering stays in `src/app/shell/documentation`. The Frontend collection keeps portable `frontend/<topic>/<article>` source paths while the router mounts it under `/dev-guide/frontend/workflow-patterns`. Explicit related article IDs can link across topics; siblings are the default when no related list is declared.

A useful article states its trigger, ownership and lifetime, actual contract, minimal example, failure/recovery decisions, acceptance evidence and exact `project@revision:relative/path` sources. Keep identifiers and examples neutral. Explain a source limitation beside the recipe that depends on it.

Run `npm --prefix frontend run verify:dev-guide` to statically check paired content, labels, hierarchy, provenance and Markdown links. This is a content validator; it executes no code samples or tests. Select other authorized checks from the repository instructions and scripts.

Source references name repositories and pinned revisions rather than machine-specific paths. Generated applications can use the guidance without possessing the peer workspaces. Operational runbooks remain authoritative for actual provisioning and deployments.
