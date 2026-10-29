export const englishBackendHandbookTranslations = {
  categories: {
    backend: {
      title: "Backend",
      description: "Runtime, security, application services, and persistent data.",
    },
  },
  topics: {
    "backend-foundation": {
      title: "Foundation",
      description: "Configuration, application boundaries, validation, and errors.",
    },
    "backend-security": {
      title: "Security",
      description: "Session authority, CSRF, and deliberate identity provisioning.",
    },
    "backend-application-services": {
      title: "Application services",
      description: "Own complete commands, transaction boundaries, transitions, and committed outcomes.",
    },
    "backend-data": {
      title: "Data and schema",
      description: "Persistent invariants, migration history, and schema ownership.",
    },
    "backend-queries": {
      title: "Queries and read models",
      description:
        "Project authorized visibility, bound results and cost, and describe snapshot and coverage guarantees.",
    },
    "backend-integrations": {
      title: "External integrations",
      description: "Separate ingress identity, observed state, provider uncertainty, reconciliation, and bounded work.",
    },
    "backend-files": {
      title: "Private files",
      description:
        "Bound uploaded bytes and shared quotas, separate metadata projections, and authorize each private download.",
    },
    "backend-lifecycle": {
      title: "Data lifecycle",
      description:
        "Classify persisted values, partition retention, and make erasure, quota, and hold boundaries explicit.",
    },
    "backend-observability": {
      title: "Operational observations",
      description: "Use bounded neutral events and define how diagnostic failures affect the primary operation.",
    },
    "backend-time": {
      title: "Temporal values",
      description: "Separate canonical calendar values, instants, timezone decisions, and localized presentation.",
    },
    "backend-contracts": {
      title: "Cross-stack contracts",
      description: "Keep generated wire semantics, read compatibility, and exact write intent explicit.",
    },
  },
  articles: {
    "backend-foundation-crud-foundation-and-class-conventions": {
      title: "CRUD foundation and class conventions",
      description:
        "Use the installed foundation, exact current sources and explicit behavioral verification boundaries.",
    },
    "backend-data-jpa-entities-and-relationships": {
      title: "JPA entities and relationships",
      description:
        "Use the installed foundation, exact current sources and explicit behavioral verification boundaries.",
    },
    "backend-queries-jpa-repositories-fetch-plans-and-projections": {
      title: "JPA repositories, fetch plans and projections",
      description:
        "Use the installed foundation, exact current sources and explicit behavioral verification boundaries.",
    },
    "backend-data-configurable-hard-and-soft-deletion": {
      title: "Configurable hard and soft deletion",
      description:
        "Use the installed foundation, exact current sources and explicit behavioral verification boundaries.",
    },
    "backend-foundation-executable-reference-feature-and-isolation": {
      title: "Executable reference feature and isolation",
      description:
        "Use the installed foundation, exact current sources and explicit behavioral verification boundaries.",
    },
    "backend-foundation-runtime-and-configuration": {
      title: "Runtime and configuration ownership",
      description:
        "Identify the owners of Java, Spring profiles, database configuration, cookie transport and schema policy without duplicating operator setup.",
    },
    "backend-foundation-http-service-persistence-boundaries": {
      title: "HTTP, application service and persistence boundaries",
      description:
        "Define backend package and role ownership; enforce static dependencies, exact authentication lookups and the published shared-error Interface with ArchUnit.",
    },
    "backend-foundation-validation-and-error-contracts": {
      title: "Validation and public error contracts",
      description:
        "Use the installed safe code/message/fieldErrors contract across MVC, authentication and servlet errors, with bounded frontend decoding and local translations; extend domain codes deliberately.",
    },
    "backend-security-session-and-csrf-lifecycle": {
      title: "Session authentication and CSRF are one lifecycle",
      description:
        "Preserve CSRF acquisition, session rotation, explicit context persistence, post-login token refresh and logout as one security contract.",
    },
    "backend-security-account-provisioning": {
      title: "Local seeding and one-time account provisioning",
      description:
        "Keep insert-only local seeding separate from exact-match operator provisioning, including profile safeguards, BCrypt byte limits and recovery boundaries.",
    },
    "backend-data-flyway-and-schema-ownership": {
      title: "Flyway owns application and session schema",
      description:
        "Version schema changes through one DDL owner, preserve migration history and enforce scoped relationships through constraints as well as authorization.",
    },
    "backend-application-services-transactional-commands": {
      title: "One transaction for one complete business command",
      description:
        "Make related mutation, protected invariants and mandatory audit one transaction, while distinguishing proxy entry, flush, commit and external effects.",
    },
    "backend-data-revision-conflicts-and-shared-locks": {
      title: "Revision conflicts and shared invariant locks",
      description:
        "Protect stale editor intent with expected revisions and serialize aggregate quotas and lifecycle changes through a shared, explicitly ordered lock protocol.",
    },
    "backend-data-lock-order-and-fresh-transaction-retries": {
      title: "Stable lock order and retries in a fresh transaction",
      description:
        "Order canonical resource identities, let constraints settle insertion races and recover only after the failed transaction ends, with bounded ownership-aware retries.",
    },
    "backend-security-resource-scope-and-composite-keys": {
      title: "Enforce resource scope in authority, queries and keys",
      description:
        "Keep live authority, child lookups and cross-resource relationships inside one permitted scope, backed by composite foreign keys without mistaking integrity for authorization.",
    },
    "backend-foundation-patch-tristate-and-write-dtos": {
      title: "PATCH tri-state and deliberate write DTOs",
      description:
        "Preserve absent, explicit-null and present-value semantics through decoding, validation and mapping while keeping identity, audit and derived response fields server-owned.",
    },
    "backend-data-audit-fields-events-and-versions": {
      title: "Audit fields, events and immutable versions answer different questions",
      description:
        "Choose last-modified metadata, transactional action history and retained versions deliberately, with explicit actor, privacy, projection and immutable correction ownership.",
    },
    "backend-queries-visibility-before-search-and-facets": {
      title: "Apply visibility before search, facets and counts",
      description:
        "Build search, filters, options and totals from a permission-aware projected collection, so private related identity cannot leak through metadata or matching.",
    },
    "backend-queries-bounded-pagination-and-sort-contracts": {
      title: "Bounded pagination and deliberate sort contracts",
      description:
        "Validate paging values, allowlist structural sort choices and define a stable tie-breaker while accounting for count, facet and deep-offset query cost.",
    },
    "backend-queries-snapshot-consistent-page-metadata": {
      title: "One snapshot for page rows and metadata",
      description:
        "Use an explicit short transaction/isolation boundary when one response promises coherent rows, totals, options and checked-at evidence.",
    },
    "backend-queries-signed-cursors-and-scope": {
      title: "Signed cursors bind paging to semantic scope",
      description:
        "Authenticate continuation against actor, scope, ordering, expiry and visible projection while exposing process-local key and in-memory paging limitations.",
    },
    "backend-queries-read-budgets-and-unknown-coverage": {
      title: "Bound read work and report unknown coverage honestly",
      description:
        "Compose bounded source facts with truthful complete, partial, unavailable and unknown coverage while preserving cancellation and authority failures.",
    },
    "backend-application-services-commit-aware-notifications": {
      title: "Notify clients after commit, and state delivery limits",
      description:
        "Separate committed-change hints from durable delivery, with explicit fallback behavior, ThreadLocal cleanup, subscriber authority and reconnect reconciliation.",
    },
    "backend-integrations-transport-and-domain-boundaries": {
      title: "Decode transport separately from domain authority",
      description:
        "Separate bounded wire decoding and protocol replies from trusted source authentication, approved resource mapping, current ownership and transactional domain persistence.",
    },
    "backend-integrations-durable-ingestion-deduplication": {
      title: "Deduplicate durable effects, not only received messages",
      description:
        "Use durable observation identity, resource locks and ordering watermarks for restart-safe effects, keeping a bounded ingress cache and transport acknowledgments in their limited roles.",
    },
    "backend-integrations-intent-and-observed-state": {
      title: "Persist intent separately from observed external state",
      description:
        "Retain requested operations independently of fresh trusted observations, with explicit correlation, scope and state transitions instead of equating request acceptance with remote success.",
    },
    "backend-integrations-lease-expiry-and-fresh-evidence": {
      title: "Lease expiry means uncertainty until fresh evidence resolves it",
      description:
        "Recover expired preparation only through current ownership and explicit fresh inactive evidence, with named skew and age policy rather than a timer-based takeover assumption.",
    },
    "backend-integrations-uncertain-provider-outcomes": {
      title: "Model provider uncertainty and fail closed when unconfigured",
      description:
        "Expose configured capabilities and typed confirmed, rejected and uncertain outcomes, validating trusted evidence without manufacturing success for unconfigured adapters or lost responses.",
    },
    "backend-integrations-claim-call-reconcile": {
      title: "Claim, call outside the transaction, then reconcile",
      description:
        "Commit immutable intent and lease-owned claims, perform external I/O without a database transaction and reconcile the same operation identity under explicit worker and evidence authority.",
    },
    "backend-integrations-bounded-scheduled-work": {
      title: "Keep scheduled work bounded and ownership explicit",
      description:
        "Separate timer cadence, event time, bounded selection and per-item transactions, with durable claims for overlap and explicit capacity, cancellation and multi-replica limitations.",
    },
    "backend-integrations-process-adapter-boundaries": {
      title: "Treat a subprocess as a bounded integration adapter",
      description:
        "Adapt a typed legacy process protocol while adding missing deadlines, cancellation, bounded output, explicit failure outcomes and guaranteed owned-process cleanup.",
    },
    "backend-security-live-authority-and-session-claims": {
      title: "Resolve live authority instead of trusting stale session claims",
      description:
        "Distinguish installed session identity checks from current account, role, membership and operational binding policies required by each protected action.",
    },
    "backend-security-api-key-selectors-and-one-time-secrets": {
      title: "API keys: public selector and one-time secret",
      description:
        "Separate public credential lookup from hashed high-entropy bearer verification, with one-time disclosure, current lifecycle, machine authority and deliberate rotation.",
    },
    "backend-security-remembered-credentials-and-fixed-expiry": {
      title: "Remembered credentials have their own expiry and account binding",
      description:
        "Restore account identity through a high-entropy cookie and stored digest/fingerprint, with fixed-expiry concurrency tradeoffs and no implicit operational binding.",
    },
    "backend-files-bounded-uploads-and-shared-quotas": {
      title: "Bound actual upload bytes under a shared quota lock",
      description:
        "Enforce transport, domain and database limits while serializing count/byte quota and checking actual content rather than trusting upload metadata.",
    },
    "backend-files-private-downloads-and-metadata-projections": {
      title: "Separate private file downloads from metadata projections",
      description:
        "Keep blobs out of lists and quotas, authorize parent/child-scoped download and use deliberate attachment headers without claiming unimplemented scanning or streaming.",
    },
    "backend-data-exact-decimals-and-rounding-policy": {
      title: "Keep exact decimals separate from rounding and display policy",
      description:
        "Preserve bounded decimal strings and BigDecimal arithmetic while making sign, unit, precision and reviewed rounding stage/mode explicit and separate from display.",
    },
    "backend-data-digests-and-reviewed-artifact-versions": {
      title: "Bind review and export to exact retained artifact versions",
      description:
        "Retain reviewed bytes, revision and generating-input digests, distinguishing historical export from current execution evidence and hashing from canonicalization or authority.",
    },
    "backend-lifecycle-redaction-before-persistence": {
      title: "Classify and redact before persistence",
      description:
        "Choose minimum retained snapshots/body/headers before storage, preserve event presence semantics and review destructive legacy redaction as an explicit data migration.",
    },
    "backend-lifecycle-tenant-partitioned-retention-and-quota": {
      title: "Partition retention and quota by trusted tenant scope",
      description:
        "Define trusted tenant partitions, expiry and eviction policy while preserving held data and identifying concurrency, byte-budget and purge-cadence guarantees still to implement.",
    },
    "backend-lifecycle-scoped-erasure-and-legal-holds": {
      title: "Scope erasure and holds in the same database predicate",
      description:
        "Bind partition and subject/record scope into each mutation, distinguish held leftovers from complete erasure and retain explicit administrative and concurrency ownership.",
    },
    "backend-observability-bounded-metrics-and-neutral-events": {
      title: "Emit neutral events and keep metric dimensions bounded",
      description:
        "Use bounded enum/boolean categories and numeric measurements without private enrichment, separating original event duration from optional bridge callback observations.",
    },
    "backend-observability-telemetry-failure-isolation": {
      title: "Keep operational telemetry failure outside the business result",
      description:
        "Preserve authoritative query/replay/SSE outcomes across optional listener failures while treating blocking, asynchronous and mandatory transactional lifecycle events separately.",
    },
    "backend-time-canonical-calendar-values-and-instants": {
      title: "Keep calendar values distinct from event instants",
      description:
        "Preserve timezone-free calendar shapes, explicit offset instants and application-owned timezone/DST conversion without inferring business meaning from picker internals.",
    },
    "backend-contracts-api-evolution-and-compatibility": {
      title: "API evolution and compatibility",
      description:
        "Classify API changes, preserve deliberate read/write contracts, review old/new combinations and use independent consumer fixtures with an approved expand/deploy/contract procedure.",
    },
    "backend-contracts-generated-wire-contracts-and-schema-compatibility": {
      title: "Generate wire contracts without hiding compatibility decisions",
      description:
        "Use target-aware schema/contracts and managed-file drift evidence while retaining explicit scalar precision, error, migration and mixed-version rollout decisions.",
    },
    "backend-contracts-tolerant-readers-and-exact-write-intent": {
      title: "Tolerate additive response fields without weakening write intent",
      description:
        "Strip unfamiliar response additions while validating known shape and preserving separate create/patch intent, explicit null semantics and backend authority.",
    },
    "backend-application-services-transition-specific-command-handlers": {
      title: "Give each state transition a deliberate command handler",
      description:
        "Separate named lifecycle actions and their prerequisites, while distinguishing local transition success from legacy best-effort outbound work and unproven transition matrices.",
    },
    "backend-application-services-reconcile-owned-child-collections": {
      title: "Reconcile an owned child collection by stable identity",
      description:
        "Define complete-set create/update/omit semantics, reject unknown, foreign and duplicate child IDs explicitly and preserve inverse relationships under one transactional replacement.",
    },
    "backend-application-services-move-children-between-aggregates": {
      title: "Move children between aggregates as one authorized graph change",
      description:
        "Authorize both source and destination, revalidate locked assignments and dependent layouts, and roll back the complete transfer when either side cannot accept it.",
    },
    "backend-application-services-repair-dependent-sequences": {
      title: "Repair the affected suffix of a dependent sequence",
      description:
        "Walk predecessor-dependent work from the changed point, preserve protected choices or reject the edit, and distinguish derived maintenance from durable distributed planning.",
    },
    "backend-data-namespaced-deterministic-identities": {
      title: "Namespaced deterministic identities",
      description:
        "Define stable source identities through a versioned namespace and exact byte framing without confusing naming with authority.",
    },
    "backend-data-replacement-lineage-and-cycle-rejection": {
      title: "Replacement lineage and cycle rejection",
      description:
        "Resolve exact replacement mappings, preserve root evidence and bound traversal while separating ancestry from historical-use permission.",
    },
    "backend-time-effective-version-period-generation": {
      title: "Effective versions and resumable period generation",
      description:
        "Select applicable accepted terms per index and materialize immutable period evidence through bounded, resumable generation.",
    },
    "backend-application-services-cross-owner-acknowledgments": {
      title: "Cross-owner acknowledgments",
      description:
        "Bridge independently committed owners through exact source digests and retained receiver acknowledgments rather than method-return assumptions.",
    },
    "backend-application-services-resumable-batches-and-item-receipts": {
      title: "Resumable batches and item receipts",
      description:
        "Freeze actor-bound batch intent, retain ordered item outcomes and distinguish durable completion from successful effects.",
    },
    "backend-application-services-receive-requests-before-qualified-decisions": {
      title: "Receive requests before qualified decisions",
      description:
        "Keep authorized intake, verified source evidence, qualified decisions and effective application as separately retained lifecycle facts.",
    },
    "backend-security-scoped-grants-and-principal-rebinding": {
      title: "Revalidate delegated authority against the current principal binding",
      description:
        "Bind retained grants to current principal, action, purpose, scope and half-open validity while keeping trusted noninteractive channels explicit.",
    },
    "backend-security-qualified-evidence-and-independent-review": {
      title: "Qualify exact evidence under the current procedure policy",
      description:
        "Separate retained candidates from qualified facts and apply exact proof, current procedure and policy-specific verifier independence.",
    },
    "backend-security-protected-operator-file-commands": {
      title: "Admit privileged file commands through a narrow protected entrypoint",
      description:
        "Separate one-shot operator modes, bounded POSIX file admission and application authorization while stating race and UTF-8 limits.",
    },
    "backend-integrations-captured-destinations-and-recipient-revalidation": {
      title: "Preserve the approved destination and revalidate the recipient before use",
      description:
        "Retain message/destination identity, revalidate current grant and binding, and preserve uncertainty across the remote dispatch race.",
    },
    "backend-integrations-restricted-message-template-rendering": {
      title: "Render a small allowlisted plain-text language, not arbitrary templates",
      description:
        "Use explicit placeholders, strict template bytes and retained plain-text artifacts without mistaking tag regexes or post-render limits for general safety.",
    },
    "backend-files-bounded-csv-interchange-contracts": {
      title: "Treat CSV as a bounded interchange language",
      description:
        "Define exact UTF-8, quoting, header, row and field limits without confusing software interchange with spreadsheet safety or authenticated provenance.",
    },
    "backend-integrations-parsed-imports-and-qualified-observations": {
      title: "Keep parsed imports separate from qualified observations",
      description:
        "Retain original bytes and parser digests, then bind explicit current provenance qualification before consequential effects or conflict reconciliation.",
    },
    "backend-data-conservation-across-allocations-and-reversals": {
      title: "Preserve capacity across allocations and compensating events",
      description:
        "Aggregate source, target and pair capacity across the whole command, preserve releases and reversals as evidence and keep isolation at the command owner.",
    },
    "backend-application-services-reservations-under-uncertain-outcomes": {
      title: "Keep reservations while an external outcome is uncertain",
      description:
        "Separate reservation, confirmed consumption and bounded evidence-backed restoration; expiry or a lost response never proves non-execution.",
    },
    "backend-contracts-geospatial-units-and-coordinate-order": {
      title: "Make coordinate order and geometry units explicit",
      description:
        "Name longitude/latitude order, CRS and physical units, while distinguishing source variant validation from missing finite, range and topology guarantees.",
    },
    "backend-files-complete-multipart-export-artifacts": {
      title: "Publish a multipart export only when every component is complete",
      description:
        "Finish and release format writers, require every sidecar, bound the archive and own cleanup on every failure before advertising a complete artifact.",
    },
    "backend-integrations-time-series-alignment-and-resampling": {
      title: "Align time series by timestamps before resampling",
      description:
        "Normalize parallel vectors, units and zones before merging; distinguish carry-forward from interpolation and choose bounded measure-specific resampling.",
    },
  },
} as const;
