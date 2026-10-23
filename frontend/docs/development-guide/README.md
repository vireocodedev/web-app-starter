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

These source-backed recipes complement the installed interactive Patterns and Architecture tabs. Consumer-only helpers are identified explicitly; copy the protocol into the correct owner rather than assuming those helpers are installed.

- [Pinned values and revisions](en/frontend/editing/pinned-values-and-revisions.md) · [Hrvatski](hr/frontend/editing/pinned-values-and-revisions.md)
- [Owned reads and shared subscriptions](en/frontend/async-commands/owned-reads-and-shared-subscriptions.md) · [Hrvatski](hr/frontend/async-commands/owned-reads-and-shared-subscriptions.md)
- [Generation guards after await](en/frontend/async-commands/generation-guards-after-await.md) · [Hrvatski](hr/frontend/async-commands/generation-guards-after-await.md)
- [Stable retry identity](en/frontend/async-commands/stable-retry-identity.md) · [Hrvatski](hr/frontend/async-commands/stable-retry-identity.md)
- [Committed writes and observer failures](en/frontend/async-commands/committed-writes-and-observer-failures.md) · [Hrvatski](hr/frontend/async-commands/committed-writes-and-observer-failures.md)
- [Drafts across routes](en/frontend/editing/drafts-across-routes.md) · [Hrvatski](hr/frontend/editing/drafts-across-routes.md)
- [Topic navigation keeps one form and one owner](en/frontend/task-interfaces/topic-editors-and-error-focus.md) · [Hrvatski](hr/frontend/task-interfaces/topic-editors-and-error-focus.md)
- [Show readable evidence before an exact decision](en/frontend/task-interfaces/readable-review-and-exact-decisions.md) · [Hrvatski](hr/frontend/task-interfaces/readable-review-and-exact-decisions.md)
- [Prerequisites report evidence; receipts report acknowledged outcomes](en/frontend/task-interfaces/prerequisites-and-confirmed-receipts.md) · [Hrvatski](hr/frontend/task-interfaces/prerequisites-and-confirmed-receipts.md)

### Backend

- [Runtime and configuration ownership](en/backend/foundation/runtime-and-configuration.md) · [Hrvatski](hr/backend/foundation/runtime-and-configuration.md)
- [HTTP, application service and persistence boundaries](en/backend/foundation/http-service-persistence-boundaries.md) · [Hrvatski](hr/backend/foundation/http-service-persistence-boundaries.md)
- [Validation and public error contracts](en/backend/foundation/validation-and-error-contracts.md) · [Hrvatski](hr/backend/foundation/validation-and-error-contracts.md)
- [Session authentication and CSRF are one lifecycle](en/backend/security/session-and-csrf-lifecycle.md) · [Hrvatski](hr/backend/security/session-and-csrf-lifecycle.md)
- [Local seeding and one-time account provisioning](en/backend/security/account-provisioning.md) · [Hrvatski](hr/backend/security/account-provisioning.md)
- [Flyway owns application and session schema](en/backend/data/flyway-and-schema-ownership.md) · [Hrvatski](hr/backend/data/flyway-and-schema-ownership.md)

### Continuous integration

- [Select verification by owner and always report the gate](en/ci/pipelines/owner-scoped-checks.md) · [Hrvatski](hr/ci/pipelines/owner-scoped-checks.md)
- [Prove complete execution across test shards](en/ci/verification/complete-shard-evidence.md) · [Hrvatski](hr/ci/verification/complete-shard-evidence.md)
- [Treat the disposable worker as a verified trust boundary](en/ci/isolation/disposable-worker-boundary.md) · [Hrvatski](hr/ci/isolation/disposable-worker-boundary.md)

### Delivery and operations

- [Release one immutable frontend/backend image pair](en/delivery/releases/immutable-image-pairs.md) · [Hrvatski](hr/delivery/releases/immutable-image-pairs.md)
- [Stage a verified pair and promote exactly what was accepted](en/delivery/releases/staging-and-production-promotion.md) · [Hrvatski](hr/delivery/releases/staging-and-production-promotion.md)
- [Recover at the correct migration failure boundary](en/delivery/recovery/migration-failure-boundaries.md) · [Hrvatski](hr/delivery/recovery/migration-failure-boundaries.md)

### Developer workflow

- [One workspace, two runtimes](en/developer-workflow/local-development/workspace-runtimes.md) · [Hrvatski](hr/developer-workflow/local-development/workspace-runtimes.md)

### AI-agent workflow

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
