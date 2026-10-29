# Pattern catalog

Full bilingual handbook navigation for humans and inventory audits. For task
selection use the [live route/search workflow](README.md#mandatory-agent-workflow);
reading this entire catalog is unnecessary for ordinary work. Catalog modules
remain the metadata owner, and `verify:dev-guide` checks every paired link here.

### Frontend workflow patterns

These source-backed recipes complement the isolated Storybook Patterns and Architecture references. Consumer-only helpers are identified explicitly; adapt the protocol in the correct owner rather than assuming those helpers are installed.

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
- [Filter prerequisites and result states](en/frontend/collections/filter-prerequisites-and-result-states.md) · [Hrvatski](hr/frontend/collections/filter-prerequisites-and-result-states.md)
- [Hierarchical rows and nested editors](en/frontend/collections/hierarchical-rows-and-nested-editors.md) · [Hrvatski](hr/frontend/collections/hierarchical-rows-and-nested-editors.md)
- [Reporting and export scope](en/frontend/collections/reporting-and-export-scope.md) · [Hrvatski](hr/frontend/collections/reporting-and-export-scope.md)

#### Task interfaces

- [Topic navigation keeps one form and one owner](en/frontend/task-interfaces/topic-editors-and-error-focus.md) · [Hrvatski](hr/frontend/task-interfaces/topic-editors-and-error-focus.md)
- [Show readable evidence before an exact decision](en/frontend/task-interfaces/readable-review-and-exact-decisions.md) · [Hrvatski](hr/frontend/task-interfaces/readable-review-and-exact-decisions.md)
- [Prerequisites report evidence; receipts report acknowledged outcomes](en/frontend/task-interfaces/prerequisites-and-confirmed-receipts.md) · [Hrvatski](hr/frontend/task-interfaces/prerequisites-and-confirmed-receipts.md)

#### Realtime events

- [Authenticated event lifetimes](en/frontend/real-time/authenticated-event-lifetimes.md) · [Hrvatski](hr/frontend/real-time/authenticated-event-lifetimes.md)
- [Event-to-cache reconciliation](en/frontend/real-time/event-to-cache-reconciliation.md) · [Hrvatski](hr/frontend/real-time/event-to-cache-reconciliation.md)

#### Offline workflows

- [Capability-scoped offline adapters](en/frontend/offline/capability-scoped-offline-adapters.md) · [Hrvatski](hr/frontend/offline/capability-scoped-offline-adapters.md)
- [Durable command queues](en/frontend/offline/durable-command-queues.md) · [Hrvatski](hr/frontend/offline/durable-command-queues.md)
- [Synchronization state machines](en/frontend/offline/synchronization-state-machines.md) · [Hrvatski](hr/frontend/offline/synchronization-state-machines.md)
- [Worker snapshots and last-good data](en/frontend/offline/worker-snapshots-and-last-good-data.md) · [Hrvatski](hr/frontend/offline/worker-snapshots-and-last-good-data.md)

#### Persisted state

- [Versioned persisted preferences](en/frontend/state/versioned-persisted-preferences.md) · [Hrvatski](hr/frontend/state/versioned-persisted-preferences.md)
- [Signal hydration and disposable effects](en/frontend/state/signal-hydration-and-disposable-effects.md) · [Hrvatski](hr/frontend/state/signal-hydration-and-disposable-effects.md)

#### Forms and commands

- [Schema-driven fields and explicit choices](en/frontend/forms/schema-driven-fields-and-explicit-choices.md) · [Hrvatski](hr/frontend/forms/schema-driven-fields-and-explicit-choices.md)
- [Entity modes and validation policy](en/frontend/forms/entity-modes-and-validation-policy.md) · [Hrvatski](hr/frontend/forms/entity-modes-and-validation-policy.md)
- [Cross-field constraints and reset](en/frontend/forms/cross-field-constraints-and-reset.md) · [Hrvatski](hr/frontend/forms/cross-field-constraints-and-reset.md)
- [File import command results](en/frontend/forms/file-import-command-results.md) · [Hrvatski](hr/frontend/forms/file-import-command-results.md)

#### Specialized interfaces

- [Imperative SDK lifetimes](en/frontend/specialized/imperative-sdk-lifetimes.md) · [Hrvatski](hr/frontend/specialized/imperative-sdk-lifetimes.md)
- [Draft and visualization synchronization](en/frontend/specialized/draft-and-visualization-synchronization.md) · [Hrvatski](hr/frontend/specialized/draft-and-visualization-synchronization.md)

#### Application startup

- [Validated public configuration](en/frontend/platform/validated-public-configuration.md) · [Hrvatski](hr/frontend/platform/validated-public-configuration.md)
- [Mock boundary before runtime](en/frontend/platform/mock-boundary-before-runtime.md) · [Hrvatski](hr/frontend/platform/mock-boundary-before-runtime.md)
- [Root runtime and provider order](en/frontend/platform/root-runtime-and-provider-order.md) · [Hrvatski](hr/frontend/platform/root-runtime-and-provider-order.md)
- [Startup and render recovery](en/frontend/platform/startup-and-render-recovery.md) · [Hrvatski](hr/frontend/platform/startup-and-render-recovery.md)

#### Preferences and storage

- [Fixed settings and user precedence](en/frontend/preferences/fixed-settings-and-user-precedence.md) · [Hrvatski](hr/frontend/preferences/fixed-settings-and-user-precedence.md)
- [Storage failure and cross-tab updates](en/frontend/preferences/storage-failure-and-cross-tab-updates.md) · [Hrvatski](hr/frontend/preferences/storage-failure-and-cross-tab-updates.md)

#### Localization resources

- [Typed resource shapes and locale switching](en/frontend/localization/typed-resource-shapes-and-locale-switching.md) · [Hrvatski](hr/frontend/localization/typed-resource-shapes-and-locale-switching.md)

#### Focus and presentation

- [Focus ownership across portals and routes](en/frontend/accessibility/focus-ownership-across-portals-and-routes.md) · [Hrvatski](hr/frontend/accessibility/focus-ownership-across-portals-and-routes.md)
- [Motion, contrast and control size](en/frontend/accessibility/motion-contrast-and-control-size.md) · [Hrvatski](hr/frontend/accessibility/motion-contrast-and-control-size.md)

#### Overlay protocols

- [Guarded command results and session identity](en/frontend/overlays/guarded-command-results-and-session-identity.md) · [Hrvatski](hr/frontend/overlays/guarded-command-results-and-session-identity.md)

### Backend

- [CRUD foundation and class conventions](en/backend/foundation/crud-foundation-and-class-conventions.md) · [Hrvatski](hr/backend/foundation/crud-foundation-and-class-conventions.md)
- [JPA entities and relationships](en/backend/data/jpa-entities-and-relationships.md) · [Hrvatski](hr/backend/data/jpa-entities-and-relationships.md)
- [JPA repositories, fetch plans and projections](en/backend/queries/jpa-repositories-fetch-plans-and-projections.md) · [Hrvatski](hr/backend/queries/jpa-repositories-fetch-plans-and-projections.md)
- [Configurable hard and soft deletion](en/backend/data/configurable-hard-and-soft-deletion.md) · [Hrvatski](hr/backend/data/configurable-hard-and-soft-deletion.md)
- [Executable reference feature and isolation](en/backend/foundation/executable-reference-feature-and-isolation.md) · [Hrvatski](hr/backend/foundation/executable-reference-feature-and-isolation.md)

#### Foundation

- [Runtime and configuration ownership](en/backend/foundation/runtime-and-configuration.md) · [Hrvatski](hr/backend/foundation/runtime-and-configuration.md)
- [HTTP, application service and persistence boundaries](en/backend/foundation/http-service-persistence-boundaries.md) · [Hrvatski](hr/backend/foundation/http-service-persistence-boundaries.md)
- [Validation and public error contracts](en/backend/foundation/validation-and-error-contracts.md) · [Hrvatski](hr/backend/foundation/validation-and-error-contracts.md)
- [PATCH tri-state and deliberate write DTOs](en/backend/foundation/patch-tristate-and-write-dtos.md) · [Hrvatski](hr/backend/foundation/patch-tristate-and-write-dtos.md)

#### Security

- [Session authentication and CSRF are one lifecycle](en/backend/security/session-and-csrf-lifecycle.md) · [Hrvatski](hr/backend/security/session-and-csrf-lifecycle.md)
- [Local seeding and one-time account provisioning](en/backend/security/account-provisioning.md) · [Hrvatski](hr/backend/security/account-provisioning.md)
- [Enforce resource scope in authority, queries and keys](en/backend/security/resource-scope-and-composite-keys.md) · [Hrvatski](hr/backend/security/resource-scope-and-composite-keys.md)
- [Resolve live authority instead of trusting stale session claims](en/backend/security/live-authority-and-session-claims.md) · [Hrvatski](hr/backend/security/live-authority-and-session-claims.md)
- [API keys: public selector and one-time secret](en/backend/security/api-key-selectors-and-one-time-secrets.md) · [Hrvatski](hr/backend/security/api-key-selectors-and-one-time-secrets.md)
- [Remembered credentials have their own expiry and account binding](en/backend/security/remembered-credentials-and-fixed-expiry.md) · [Hrvatski](hr/backend/security/remembered-credentials-and-fixed-expiry.md)
- [Revalidate delegated authority against the current principal binding](en/backend/security/scoped-grants-and-principal-rebinding.md) · [Hrvatski](hr/backend/security/scoped-grants-and-principal-rebinding.md)
- [Qualify exact evidence under the current procedure policy](en/backend/security/qualified-evidence-and-independent-review.md) · [Hrvatski](hr/backend/security/qualified-evidence-and-independent-review.md)
- [Admit privileged file commands through a narrow protected entrypoint](en/backend/security/protected-operator-file-commands.md) · [Hrvatski](hr/backend/security/protected-operator-file-commands.md)

#### Application services

- [One transaction for one complete business command](en/backend/application-services/transactional-commands.md) · [Hrvatski](hr/backend/application-services/transactional-commands.md)
- [Notify clients after commit, and state delivery limits](en/backend/application-services/commit-aware-notifications.md) · [Hrvatski](hr/backend/application-services/commit-aware-notifications.md)
- [Give each state transition a deliberate command handler](en/backend/application-services/transition-specific-command-handlers.md) · [Hrvatski](hr/backend/application-services/transition-specific-command-handlers.md)
- [Reconcile an owned child collection by stable identity](en/backend/application-services/reconcile-owned-child-collections.md) · [Hrvatski](hr/backend/application-services/reconcile-owned-child-collections.md)
- [Move children between aggregates as one authorized graph change](en/backend/application-services/move-children-between-aggregates.md) · [Hrvatski](hr/backend/application-services/move-children-between-aggregates.md)
- [Repair the affected suffix of a dependent sequence](en/backend/application-services/repair-dependent-sequences.md) · [Hrvatski](hr/backend/application-services/repair-dependent-sequences.md)
- [Cross-owner acknowledgments](en/backend/application-services/cross-owner-acknowledgments.md) · [Hrvatski](hr/backend/application-services/cross-owner-acknowledgments.md)
- [Resumable batches and item receipts](en/backend/application-services/resumable-batches-and-item-receipts.md) · [Hrvatski](hr/backend/application-services/resumable-batches-and-item-receipts.md)
- [Receive requests before qualified decisions](en/backend/application-services/receive-requests-before-qualified-decisions.md) · [Hrvatski](hr/backend/application-services/receive-requests-before-qualified-decisions.md)
- [Keep reservations while an external outcome is uncertain](en/backend/application-services/reservations-under-uncertain-outcomes.md) · [Hrvatski](hr/backend/application-services/reservations-under-uncertain-outcomes.md)

#### Data and schema

- [Flyway owns application and session schema](en/backend/data/flyway-and-schema-ownership.md) · [Hrvatski](hr/backend/data/flyway-and-schema-ownership.md)
- [Revision conflicts and shared invariant locks](en/backend/data/revision-conflicts-and-shared-locks.md) · [Hrvatski](hr/backend/data/revision-conflicts-and-shared-locks.md)
- [Stable lock order and retries in a fresh transaction](en/backend/data/lock-order-and-fresh-transaction-retries.md) · [Hrvatski](hr/backend/data/lock-order-and-fresh-transaction-retries.md)
- [Audit fields, events and immutable versions answer different questions](en/backend/data/audit-fields-events-and-versions.md) · [Hrvatski](hr/backend/data/audit-fields-events-and-versions.md)
- [Keep exact decimals separate from rounding and display policy](en/backend/data/exact-decimals-and-rounding-policy.md) · [Hrvatski](hr/backend/data/exact-decimals-and-rounding-policy.md)
- [Bind review and export to exact retained artifact versions](en/backend/data/digests-and-reviewed-artifact-versions.md) · [Hrvatski](hr/backend/data/digests-and-reviewed-artifact-versions.md)
- [Namespaced deterministic identities](en/backend/data/namespaced-deterministic-identities.md) · [Hrvatski](hr/backend/data/namespaced-deterministic-identities.md)
- [Replacement lineage and cycle rejection](en/backend/data/replacement-lineage-and-cycle-rejection.md) · [Hrvatski](hr/backend/data/replacement-lineage-and-cycle-rejection.md)
- [Preserve capacity across allocations and compensating events](en/backend/data/conservation-across-allocations-and-reversals.md) · [Hrvatski](hr/backend/data/conservation-across-allocations-and-reversals.md)

#### Queries and read models

- [Apply visibility before search, facets and counts](en/backend/queries/visibility-before-search-and-facets.md) · [Hrvatski](hr/backend/queries/visibility-before-search-and-facets.md)
- [Bounded pagination and deliberate sort contracts](en/backend/queries/bounded-pagination-and-sort-contracts.md) · [Hrvatski](hr/backend/queries/bounded-pagination-and-sort-contracts.md)
- [One snapshot for page rows and metadata](en/backend/queries/snapshot-consistent-page-metadata.md) · [Hrvatski](hr/backend/queries/snapshot-consistent-page-metadata.md)
- [Signed cursors bind paging to semantic scope](en/backend/queries/signed-cursors-and-scope.md) · [Hrvatski](hr/backend/queries/signed-cursors-and-scope.md)
- [Bound read work and report unknown coverage honestly](en/backend/queries/read-budgets-and-unknown-coverage.md) · [Hrvatski](hr/backend/queries/read-budgets-and-unknown-coverage.md)

#### External integrations

- [Decode transport separately from domain authority](en/backend/integrations/transport-and-domain-boundaries.md) · [Hrvatski](hr/backend/integrations/transport-and-domain-boundaries.md)
- [Deduplicate durable effects, not only received messages](en/backend/integrations/durable-ingestion-deduplication.md) · [Hrvatski](hr/backend/integrations/durable-ingestion-deduplication.md)
- [Persist intent separately from observed external state](en/backend/integrations/intent-and-observed-state.md) · [Hrvatski](hr/backend/integrations/intent-and-observed-state.md)
- [Lease expiry means uncertainty until fresh evidence resolves it](en/backend/integrations/lease-expiry-and-fresh-evidence.md) · [Hrvatski](hr/backend/integrations/lease-expiry-and-fresh-evidence.md)
- [Model provider uncertainty and fail closed when unconfigured](en/backend/integrations/uncertain-provider-outcomes.md) · [Hrvatski](hr/backend/integrations/uncertain-provider-outcomes.md)
- [Claim, call outside the transaction, then reconcile](en/backend/integrations/claim-call-reconcile.md) · [Hrvatski](hr/backend/integrations/claim-call-reconcile.md)
- [Keep scheduled work bounded and ownership explicit](en/backend/integrations/bounded-scheduled-work.md) · [Hrvatski](hr/backend/integrations/bounded-scheduled-work.md)
- [Treat a subprocess as a bounded integration adapter](en/backend/integrations/process-adapter-boundaries.md) · [Hrvatski](hr/backend/integrations/process-adapter-boundaries.md)
- [Preserve the approved destination and revalidate the recipient before use](en/backend/integrations/captured-destinations-and-recipient-revalidation.md) · [Hrvatski](hr/backend/integrations/captured-destinations-and-recipient-revalidation.md)
- [Render a small allowlisted plain-text language, not arbitrary templates](en/backend/integrations/restricted-message-template-rendering.md) · [Hrvatski](hr/backend/integrations/restricted-message-template-rendering.md)
- [Keep parsed imports separate from qualified observations](en/backend/integrations/parsed-imports-and-qualified-observations.md) · [Hrvatski](hr/backend/integrations/parsed-imports-and-qualified-observations.md)
- [Align time series by timestamps before resampling](en/backend/integrations/time-series-alignment-and-resampling.md) · [Hrvatski](hr/backend/integrations/time-series-alignment-and-resampling.md)

#### Private files

- [Bound actual upload bytes under a shared quota lock](en/backend/files/bounded-uploads-and-shared-quotas.md) · [Hrvatski](hr/backend/files/bounded-uploads-and-shared-quotas.md)
- [Separate private file downloads from metadata projections](en/backend/files/private-downloads-and-metadata-projections.md) · [Hrvatski](hr/backend/files/private-downloads-and-metadata-projections.md)
- [Treat CSV as a bounded interchange language](en/backend/files/bounded-csv-interchange-contracts.md) · [Hrvatski](hr/backend/files/bounded-csv-interchange-contracts.md)
- [Publish a multipart export only when every component is complete](en/backend/files/complete-multipart-export-artifacts.md) · [Hrvatski](hr/backend/files/complete-multipart-export-artifacts.md)

#### Data lifecycle

- [Classify and redact before persistence](en/backend/lifecycle/redaction-before-persistence.md) · [Hrvatski](hr/backend/lifecycle/redaction-before-persistence.md)
- [Partition retention and quota by trusted tenant scope](en/backend/lifecycle/tenant-partitioned-retention-and-quota.md) · [Hrvatski](hr/backend/lifecycle/tenant-partitioned-retention-and-quota.md)
- [Scope erasure and holds in the same database predicate](en/backend/lifecycle/scoped-erasure-and-legal-holds.md) · [Hrvatski](hr/backend/lifecycle/scoped-erasure-and-legal-holds.md)

#### Operational observations

- [Emit neutral events and keep metric dimensions bounded](en/backend/observability/bounded-metrics-and-neutral-events.md) · [Hrvatski](hr/backend/observability/bounded-metrics-and-neutral-events.md)
- [Keep operational telemetry failure outside the business result](en/backend/observability/telemetry-failure-isolation.md) · [Hrvatski](hr/backend/observability/telemetry-failure-isolation.md)

#### Temporal values

- [Keep calendar values distinct from event instants](en/backend/time/canonical-calendar-values-and-instants.md) · [Hrvatski](hr/backend/time/canonical-calendar-values-and-instants.md)
- [Effective versions and resumable period generation](en/backend/time/effective-version-period-generation.md) · [Hrvatski](hr/backend/time/effective-version-period-generation.md)

#### Cross-stack contracts

- [API evolution and compatibility](en/backend/contracts/api-evolution-and-compatibility.md) · [Hrvatski](hr/backend/contracts/api-evolution-and-compatibility.md)
- [Generate wire contracts without hiding compatibility decisions](en/backend/contracts/generated-wire-contracts-and-schema-compatibility.md) · [Hrvatski](hr/backend/contracts/generated-wire-contracts-and-schema-compatibility.md)
- [Tolerate additive response fields without weakening write intent](en/backend/contracts/tolerant-readers-and-exact-write-intent.md) · [Hrvatski](hr/backend/contracts/tolerant-readers-and-exact-write-intent.md)
- [Make coordinate order and geometry units explicit](en/backend/contracts/geospatial-units-and-coordinate-order.md) · [Hrvatski](hr/backend/contracts/geospatial-units-and-coordinate-order.md)

### Quality and verification

#### Test design

- [Architecture invariants and checks](en/quality/test-design/architecture-invariants-and-checks.md) · [Hrvatski](hr/quality/test-design/architecture-invariants-and-checks.md)
- [Assert boundary outcomes](en/quality/test-design/assert-boundary-outcomes.md) · [Hrvatski](hr/quality/test-design/assert-boundary-outcomes.md)
- [Deterministic fixtures and clock ownership](en/quality/test-design/deterministic-fixtures-and-clock-ownership.md) · [Hrvatski](hr/quality/test-design/deterministic-fixtures-and-clock-ownership.md)

#### Frontend verification

- [Fresh runtime and query fixtures](en/quality/frontend/fresh-runtime-and-query-fixtures.md) · [Hrvatski](hr/quality/frontend/fresh-runtime-and-query-fixtures.md)
- [HTTP contract mocks and handler lifetimes](en/quality/frontend/http-contract-mocks-and-handler-lifetimes.md) · [Hrvatski](hr/quality/frontend/http-contract-mocks-and-handler-lifetimes.md)
- [Async generation and stale-result scenarios](en/quality/frontend/async-generation-and-stale-result-scenarios.md) · [Hrvatski](hr/quality/frontend/async-generation-and-stale-result-scenarios.md)
- [Signal effect disposal and storage failures](en/quality/frontend/signal-effect-disposal-and-storage-failures.md) · [Hrvatski](hr/quality/frontend/signal-effect-disposal-and-storage-failures.md)

#### Backend verification

- [Real PostgreSQL and HTTP contracts](en/quality/backend/real-postgres-and-http-contracts.md) · [Hrvatski](hr/quality/backend/real-postgres-and-http-contracts.md)
- [Transaction conflicts and lock scenarios](en/quality/backend/transaction-conflicts-and-lock-scenarios.md) · [Hrvatski](hr/quality/backend/transaction-conflicts-and-lock-scenarios.md)

#### Browser and accessibility

- [Assembled routes and development profiles](en/quality/browser/assembled-routes-and-development-profiles.md) · [Hrvatski](hr/quality/browser/assembled-routes-and-development-profiles.md)
- [Keyboard, responsive and accessibility evidence](en/quality/browser/keyboard-responsive-and-accessibility-evidence.md) · [Hrvatski](hr/quality/browser/keyboard-responsive-and-accessibility-evidence.md)

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

#### Package verification

- [Prove public consumption without maintainer credentials or workspace links](en/ci/package-verification/anonymous-consumer-artifact-checks.md) · [Hrvatski](hr/ci/package-verification/anonymous-consumer-artifact-checks.md)
- [Verify emitted types and runtime entrypoints from the consumer side](en/ci/package-verification/type-resolution-and-runtime-entrypoints.md) · [Hrvatski](hr/ci/package-verification/type-resolution-and-runtime-entrypoints.md)

### Delivery and operations

#### Runnable artifacts

- [Build a frontend image that can move between environments](en/delivery/artifacts/frontend-image-contract.md) · [Hrvatski](hr/delivery/artifacts/frontend-image-contract.md)
- [Separate backend compilation from restricted runtime](en/delivery/artifacts/backend-image-contract.md) · [Hrvatski](hr/delivery/artifacts/backend-image-contract.md)
- [Verify the produced image under its runtime restrictions](en/delivery/artifacts/runtime-smoke-evidence.md) · [Hrvatski](hr/delivery/artifacts/runtime-smoke-evidence.md)

#### Releases and promotion

- [Release one immutable frontend/backend image pair](en/delivery/releases/immutable-image-pairs.md) · [Hrvatski](hr/delivery/releases/immutable-image-pairs.md)
- [Stage a verified pair and promote exactly what was accepted](en/delivery/releases/staging-and-production-promotion.md) · [Hrvatski](hr/delivery/releases/staging-and-production-promotion.md)
- [Give build, publication and deployment request different authority](en/delivery/releases/build-publish-request-boundaries.md) · [Hrvatski](hr/delivery/releases/build-publish-request-boundaries.md)

#### Host operations

- [Send an encrypted ticket to fixed trusted host code](en/delivery/operations/encrypted-host-handoff.md) · [Hrvatski](hr/delivery/operations/encrypted-host-handoff.md)
- [Separate environment identity from application replacement](en/delivery/operations/environment-and-database-isolation.md) · [Hrvatski](hr/delivery/operations/environment-and-database-isolation.md)
- [Diagnose availability, identity and behavior as separate evidence](en/delivery/operations/health-and-diagnostic-evidence.md) · [Hrvatski](hr/delivery/operations/health-and-diagnostic-evidence.md)
- [Provision the initial identity as a separate post-deployment command](en/delivery/operations/provisioning-after-deployment.md) · [Hrvatski](hr/delivery/operations/provisioning-after-deployment.md)

#### Migration and recovery

- [Recover at the correct migration failure boundary](en/delivery/recovery/migration-failure-boundaries.md) · [Hrvatski](hr/delivery/recovery/migration-failure-boundaries.md)
- [A backup is complete only after durable verification](en/delivery/recovery/durable-backup-artifacts.md) · [Hrvatski](hr/delivery/recovery/durable-backup-artifacts.md)
- [Rehearse recovery from the retrieved copy in isolation](en/delivery/recovery/isolated-restore-rehearsal.md) · [Hrvatski](hr/delivery/recovery/isolated-restore-rehearsal.md)
- [Reconcile an uncertain release before retrying mutation](en/delivery/recovery/reconcile-uncertain-releases.md) · [Hrvatski](hr/delivery/recovery/reconcile-uncertain-releases.md)

### Developer workflow

#### Local development

- [One workspace, two runtimes](en/developer-workflow/local-development/workspace-runtimes.md) · [Hrvatski](hr/developer-workflow/local-development/workspace-runtimes.md)
- [Diagnose the VS Code launch contract in dependency order](en/developer-workflow/local-development/vscode-launch-contract.md) · [Hrvatski](hr/developer-workflow/local-development/vscode-launch-contract.md)
- [Give parallel checkouts explicit database identity](en/developer-workflow/local-development/parallel-checkouts-and-database-identity.md) · [Hrvatski](hr/developer-workflow/local-development/parallel-checkouts-and-database-identity.md)
- [Debug the session through one browser origin](en/developer-workflow/local-development/same-origin-session-debugging.md) · [Hrvatski](hr/developer-workflow/local-development/same-origin-session-debugging.md)

#### Verification workflow

- [Select verification by changed contract and report its limits](en/developer-workflow/verification/verification-selection-and-evidence.md) · [Hrvatski](hr/developer-workflow/verification/verification-selection-and-evidence.md)

#### Template and package evolution

- [Identify the installed stack before applying a platform recipe](en/developer-workflow/template-evolution/identify-the-installed-stack-profile.md) · [Hrvatski](hr/developer-workflow/template-evolution/identify-the-installed-stack-profile.md)
- [Keep application policy outside reusable library mechanics](en/developer-workflow/template-evolution/application-and-library-responsibility.md) · [Hrvatski](hr/developer-workflow/template-evolution/application-and-library-responsibility.md)
- [Distinguish published dependencies from local candidate overrides](en/developer-workflow/template-evolution/published-artifacts-and-local-overrides.md) · [Hrvatski](hr/developer-workflow/template-evolution/published-artifacts-and-local-overrides.md)
- [Give generated application code a different lifetime from indexes](en/developer-workflow/template-evolution/generated-once-and-regenerated-ownership.md) · [Hrvatski](hr/developer-workflow/template-evolution/generated-once-and-regenerated-ownership.md)
- [Classify every template path before projecting an application](en/developer-workflow/template-evolution/projection-boundaries-and-classified-paths.md) · [Hrvatski](hr/developer-workflow/template-evolution/projection-boundaries-and-classified-paths.md)
- [Compare immutable baseline, local changes and upstream target](en/developer-workflow/template-evolution/three-way-template-adoption.md) · [Hrvatski](hr/developer-workflow/template-evolution/three-way-template-adoption.md)

### AI-agent workflow

#### Implementation workflow

- [Find the owner before editing](en/agent-workflow/implementation/owner-first-change.md) · [Hrvatski](hr/agent-workflow/implementation/owner-first-change.md)
- [Claim one bounded outcome and preserve its decision gates](en/agent-workflow/implementation/bounded-task-and-decision-contract.md) · [Hrvatski](hr/agent-workflow/implementation/bounded-task-and-decision-contract.md)
- [Put each change behind the capability that owns its contract](en/agent-workflow/implementation/capability-owners-and-review-boundaries.md) · [Hrvatski](hr/agent-workflow/implementation/capability-owners-and-review-boundaries.md)
- [Deliver a coherent increment with a truthful review record](en/agent-workflow/implementation/incremental-reviewable-delivery.md) · [Hrvatski](hr/agent-workflow/implementation/incremental-reviewable-delivery.md)
- [Bind each completion claim to its source and evidence layer](en/agent-workflow/implementation/source-bound-evidence-and-handoff.md) · [Hrvatski](hr/agent-workflow/implementation/source-bound-evidence-and-handoff.md)
- [Separate setup readiness from accepted business V1](en/agent-workflow/implementation/initialization-to-business-acceptance.md) · [Hrvatski](hr/agent-workflow/implementation/initialization-to-business-acceptance.md)

## Storybook tutorial links

These existing tutorial destinations moved here from the guide entry point.
Use the [Storybook router](../storybook/README.md) and task metadata to select
applicable full tutorials; this human navigation list adds no blanket reading
requirement. Stable source links also support the Storybook reader link checks.

- [Navigation chooser pages tutorial](../storybook/routing/NavigationChooser/NavigationChooser.mdx).
- [Standalone pages tutorial](../storybook/routing/StandalonePages/StandalonePages.mdx).
- [Pages with header tabs tutorial](../storybook/routing/HeaderTabs/HeaderTabs.mdx).
- [Pages with left navigation tutorial](../storybook/routing/LeftNavigation/LeftNavigation.mdx).
- [Entity forms tutorial](../storybook/forms/EntityForms/EntityForms.mdx).
- [Loading and saving feature data](../storybook/data/FeatureData/FeatureData.mdx).
- [Tables and collections](../storybook/collections/TablesAndCollections/TablesAndCollections.mdx).
- [Localization and formatting](../storybook/localization/LocalizationAndFormatting/LocalizationAndFormatting.mdx).
- [URL-backed state](../storybook/routing/UrlBackedState/UrlBackedState.mdx).
- [Signals and persistence in practice](../storybook/state/SignalsAndPersistence/SignalsAndPersistence.mdx).
- [Components that respect application settings](../storybook/settings/SettingsAwareComponents/SettingsAwareComponents.mdx).
- [Authentication and HTTP integration](../storybook/authentication/AuthenticationAndHttp/AuthenticationAndHttp.mdx).
- [Testing a feature](../storybook/testing/TestingAFeature/TestingAFeature.mdx).
- [Capability-aware pages and actions](../storybook/authentication/CapabilityAwarePages/CapabilityAwarePages.mdx).
- [Building a backend-connected feature](../storybook/data/BackendConnectedFeature/BackendConnectedFeature.mdx).
- [Draft and submit forms](../storybook/forms/DraftAndSubmitForms/DraftAndSubmitForms.mdx).
- [Workflow commands, conflicts and coordinated refresh](../storybook/workflows/WorkflowCommands/WorkflowCommands.mdx).
- [Persisted inboxes versus feedback](../storybook/notifications/PersistedInbox/PersistedInbox.mdx).
- [Notifications tutorial](../storybook/feedback/Notifications/Notifications.mdx).
- [Confirmations tutorial](../storybook/feedback/Confirmations/Confirmations.mdx).
- [Source ownership tutorial](../storybook/architecture/SourceOwnership/SourceOwnership.mdx).
- [Dependency direction tutorial](../storybook/architecture/DependencyDirection/DependencyDirection.mdx).
- [Public module APIs tutorial](../storybook/architecture/PublicModuleApis/PublicModuleApis.mdx).
- [Runtime and state ownership tutorial](../storybook/architecture/RuntimeAndState/RuntimeAndState.mdx).
