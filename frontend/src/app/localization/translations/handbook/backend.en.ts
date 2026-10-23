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
  },
  articles: {
    "backend-foundation-runtime-and-configuration": {
      title: "Runtime and configuration ownership",
      description:
        "Identify the owners of Java, Spring profiles, database configuration, cookie transport and schema policy without duplicating operator setup.",
    },
    "backend-foundation-http-service-persistence-boundaries": {
      title: "HTTP, application service and persistence boundaries",
      description:
        "Separate transport DTOs, live authority, complete transactional actions and persistence, with a clearly marked revision-aware mutation recipe.",
    },
    "backend-foundation-validation-and-error-contracts": {
      title: "Validation and public error contracts",
      description:
        "Distinguish installed authentication responses from a deliberate domain-error protocol, safe validation detail and draft-preserving recovery.",
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
  },
} as const;
