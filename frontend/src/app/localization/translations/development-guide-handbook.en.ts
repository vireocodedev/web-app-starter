export const englishHandbookTranslations = {
  navigation: {
    index: "{{category}} topics",
    choosePage: "Choose an article, current article: {{page}}",
    closePages: "Close articles",
    pageNavigation: "Article navigation",
    contents: "Article contents",
    related: "Related reading",
  },
  implementation: {
    starter: "Installed pattern",
    reference: "Reference recipe",
    mixed: "Installed + reference recipe",
  },
  size: {
    small: "Small pattern",
    medium: "Medium pattern",
    large: "Large pattern",
  },
  categories: {
    backend: {
      title: "Backend",
      description: "Runtime, security, application services, and persistent data.",
    },
    ci: {
      title: "Continuous integration",
      description: "Owner-scoped verification, complete evidence, and isolated workers.",
    },
    delivery: {
      title: "Delivery and operations",
      description: "Immutable releases, environment promotion, migrations, and recovery.",
    },
    "developer-workflow": {
      title: "Developer workflow",
      description: "Local runtimes, debugging, verification, and everyday implementation.",
    },
    "agent-workflow": {
      title: "AI-agent workflow",
      description: "Find the owner, implement a bounded task, and deliver evidence.",
    },
    "frontend-workflows": {
      title: "Workflow patterns",
      description: "Source-backed frontend workflows with explicit ownership, lifetimes, and failure recovery.",
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
    "backend-data": {
      title: "Data and schema",
      description: "Persistent invariants, migration history, and schema ownership.",
    },
    "ci-pipelines": {
      title: "Pipelines and gates",
      description: "Select relevant lanes while preserving the required result.",
    },
    "ci-verification": {
      title: "Verification evidence",
      description: "Prove complete execution against the correct source and run.",
    },
    "ci-isolation": {
      title: "Worker isolation",
      description: "Separate untrusted job execution from privileged host ownership.",
    },
    "delivery-releases": {
      title: "Releases and promotion",
      description: "Build one immutable pair and promote the accepted artifacts.",
    },
    "delivery-recovery": {
      title: "Migration and recovery",
      description: "Preserve data and reconcile the exact failure boundary.",
    },
    "developer-workflow-local-development": {
      title: "Local development",
      description: "Start the intended runtimes and preserve existing local state.",
    },
    "agent-workflow-implementation": {
      title: "Implementation workflow",
      description: "Choose the owner and public seam before changing behavior.",
    },
    "frontend-editing": {
      title: "Editing sessions",
      description: "Keep values, revisions, ownership, and route-spanning drafts consistent.",
    },
    "frontend-async-commands": {
      title: "Asynchronous commands",
      description: "Own requests, re-check authority after awaits, and separate commits from observers.",
    },
    "frontend-task-interfaces": {
      title: "Task interfaces",
      description: "Compose long forms, exact reviews, prerequisite evidence, and acknowledged outcomes.",
    },
    "backend-application-services": {
      title: "Application services",
      description: "Own complete commands, transaction boundaries, transitions, and committed outcomes.",
    },
    "delivery-artifacts": {
      title: "Runnable artifacts",
      description: "Build environment-neutral images and verify the actual artifacts under runtime restrictions.",
    },
    "frontend-access": {
      title: "Access and authority",
      description: "Use current server capabilities and invalidate restricted drafts, actions, and private caches.",
    },
    "frontend-routing": {
      title: "Route contracts",
      description: "Keep URL construction pure and coordinate navigation and scrolling with the committed page.",
    },
    "frontend-collections": {
      title: "Collections and query ownership",
      description: "Separate table presentation from result ownership, scoped query identity, and invalidation.",
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
    "ci-pipelines-owner-scoped-checks": {
      title: "Select verification by owner and always report the gate",
      description:
        "Route monorepo checks by owner while preserving portable verification and an always-reporting required gate.",
    },
    "ci-verification-complete-shard-evidence": {
      title: "Prove complete execution across test shards",
      description:
        "Prove complete frontend file and backend class membership with SHA/run/attempt-bound reports; independently compare backend testcase inventory and validate frontend reported assertions/counts.",
    },
    "ci-isolation-disposable-worker-boundary": {
      title: "Treat the disposable worker as a verified trust boundary",
      description:
        "Separate PR execution from host authority with fresh workers, bounded resources and source-bound lifecycle evidence.",
    },
    "delivery-releases-immutable-image-pairs": {
      title: "Release one immutable frontend/backend image pair",
      description:
        "Package both applications from one exact source and preserve the accepted digest pair across environments.",
    },
    "delivery-releases-staging-and-production-promotion": {
      title: "Stage a verified pair and promote exactly what was accepted",
      description:
        "Separate build, fresh-worker publication and encrypted host requests; promote the exact host-accepted pair without rebuilding.",
    },
    "delivery-recovery-migration-failure-boundaries": {
      title: "Recover at the correct migration failure boundary",
      description:
        "Gate production startup on a durable backup and reconcile post-mutation failures without an automatic database rollback.",
    },
    "developer-workflow-local-development-workspace-runtimes": {
      title: "One workspace, two runtimes",
      description:
        "Launch the Java and Node sides through their declared runtimes and ordered VS Code helpers while preserving database identity, credentials, volumes and same-origin sessions.",
    },
    "agent-workflow-implementation-owner-first-change": {
      title: "Find the owner before editing",
      description:
        "Turn a requested outcome into an owner-aware bounded change with explicit evidence labels, public seams, authorized verification and separately authorized delivery.",
    },
    "frontend-editing-pinned-values-and-revisions": {
      title: "Pinned values and revisions",
      description:
        "Preserve one editing basis while background reads, stale data and explicit reload change the surrounding authority.",
    },
    "frontend-async-commands-owned-reads-and-shared-subscriptions": {
      title: "Owned reads and shared subscriptions",
      description: "Cancel obsolete editor reads without interrupting shared query observers or hiding real failures.",
    },
    "frontend-async-commands-generation-guards-after-await": {
      title: "Generation guards after await",
      description:
        "Invalidate stale confirmations and late completions when the record, session or observed authority changes.",
    },
    "frontend-async-commands-stable-retry-identity": {
      title: "Stable retry identity",
      description:
        "Pair an immutable client command with authorized transactional server receipts before retrying an uncertain write.",
    },
    "frontend-async-commands-committed-writes-and-observer-failures": {
      title: "Committed writes and observer failures",
      description:
        "Keep acknowledged persistence distinct from failed cache refreshes, callbacks and uncertain responses.",
    },
    "frontend-editing-drafts-across-routes": {
      title: "Drafts across routes",
      description:
        "Retain an owner-scoped draft through a permitted detour, refresh choices on return and preserve explicit user selection.",
    },
    "frontend-task-interfaces-topic-editors-and-error-focus": {
      title: "Topic navigation keeps one form and one owner",
      description:
        "Preserve field state across topics, keep submission with the form owner, and make error links reveal and focus their targets.",
    },
    "frontend-task-interfaces-readable-review-and-exact-decisions": {
      title: "Show readable evidence before an exact decision",
      description:
        "Present complete versioned evidence and an explicitly named decision without inventing reading gates or freezing authority.",
    },
    "frontend-task-interfaces-prerequisites-and-confirmed-receipts": {
      title: "Prerequisites report evidence; receipts report acknowledged outcomes",
      description:
        "Explain source-owned blockers, partial coverage, precise remedies and the difference between accepted work and completed effects.",
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
    "ci-pipelines-required-gates-and-main-protection": {
      title: "Bind the required gate to the policy that produced it",
      description:
        "Bind CI gate to its trusted source App and verify effective, current main protection separately from workflow source.",
    },
    "ci-pipelines-pinned-toolchains-and-actions": {
      title: "Select declared application toolchains inside the job",
      description:
        "Separate application toolchain declarations, exact package-manager selection, dependency locks, Action commits and disposable worker baselines.",
    },
    "ci-verification-resource-budgets": {
      title: "Budget concurrency at every execution layer",
      description:
        "Coordinate pool slots, parent job limits, nested tool workers, storage and deadlines while preserving verification coverage.",
    },
    "ci-verification-phase-deadlines-and-process-cleanup": {
      title: "Keep original phase deadlines and own process cleanup",
      description:
        "Reference recipe for setup-inclusive phase budgets, retained PGID ownership, bounded cleanup and failure-preserving utility aggregation.",
    },
    "delivery-artifacts-frontend-image-contract": {
      title: "Build a frontend image that can move between environments",
      description:
        "Keep same-origin public configuration, SPA/API/asset failure semantics, immutable asset caching and restricted Nginx runtime in one image.",
    },
    "delivery-artifacts-backend-image-contract": {
      title: "Separate backend compilation from restricted runtime",
      description:
        "Compile with the declared JDK, run a non-root JRE jar and inject protected database configuration without conflating builds, tests or live acceptance.",
    },
    "delivery-artifacts-runtime-smoke-evidence": {
      title: "Verify the produced image under its runtime restrictions",
      description:
        "Exercise actual image startup, API and provisioning boundaries with disposable resources and exact-name cleanup, while stating evidence limits.",
    },
    "delivery-releases-build-publish-request-boundaries": {
      title: "Give build, publication and deployment request different authority",
      description:
        "Separate untrusted application builds, fresh-worker registry publication and encrypted fixed-contract host requests.",
    },
    "frontend-access-capability-aware-pages": {
      title: "Capability-aware pages",
      description:
        "Use one explicit presentation vocabulary across menus, deep links and record actions while the backend enforces live authorization.",
    },
    "frontend-access-revocation-and-private-cache": {
      title: "Revocation and private cache",
      description:
        "Invalidate obsolete operations, restricted drafts and affected private query projections together when observed authority changes.",
    },
    "frontend-editing-complete-navigation-guards": {
      title: "Complete navigation guards",
      description:
        "Compose route/search changes, browser unload, explicit logout and busy-state rechecks around one form lifecycle.",
    },
    "frontend-routing-typed-route-contracts": {
      title: "Typed route contracts",
      description:
        "Build and parse stable view and exact-task identities through a pure contract with deliberate invalid and compatibility behavior.",
    },
    "frontend-routing-data-aware-scroll-restoration": {
      title: "Data-aware scroll restoration",
      description:
        "Let the committed leaf coordinate entry readiness while the router retains history, fragment and one-time scroll ownership.",
    },
    "frontend-collections-client-and-server-table-ownership": {
      title: "Client and server table ownership",
      description:
        "Share table presentation while the feature owns remote filtering, sorting, paging, selection scope and result recovery.",
    },
    "frontend-collections-query-key-scope-and-invalidation": {
      title: "Query-key scope and invalidation",
      description:
        "Include every result-defining input and keep mutation refreshes scoped to the read models the feature can change.",
    },
  },
} as const;
