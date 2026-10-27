export const englishFrontendHandbookTranslations = {
  categories: {
    "frontend-workflows": {
      title: "Workflow patterns",
      description: "Source-backed frontend workflows with explicit ownership, lifetimes, and failure recovery.",
    },
  },
  topics: {
    "frontend-access": {
      title: "Access and authority",
      description: "Use current server capabilities and invalidate restricted drafts, actions, and private caches.",
    },
    "frontend-routing": {
      title: "Route contracts",
      description: "Keep URL construction pure and coordinate navigation and scrolling with the committed page.",
    },
    "frontend-editing": {
      title: "Editing sessions",
      description: "Keep values, revisions, ownership, and route-spanning drafts consistent.",
    },
    "frontend-async-commands": {
      title: "Asynchronous commands",
      description: "Own requests, re-check authority after awaits, and separate commits from observers.",
    },
    "frontend-collections": {
      title: "Collections and query ownership",
      description: "Separate table presentation from result ownership, scoped query identity, and invalidation.",
    },
    "frontend-task-interfaces": {
      title: "Task interfaces",
      description: "Compose long forms, exact reviews, prerequisite evidence, and acknowledged outcomes.",
    },
    "frontend-real-time": {
      title: "Realtime events",
      description:
        "Own authenticated stream lifetimes and reconcile event-driven reads with authoritative server state.",
    },
    "frontend-offline": {
      title: "Offline workflows",
      description: "Separate capability, durable local intent, synchronization receipts, and last-good snapshots.",
    },
    "frontend-state": {
      title: "Persisted state",
      description: "Version local preference schemas and keep storage ownership separate from server authority.",
    },
    "frontend-forms": {
      title: "Forms and commands",
      description: "Model explicit field meaning, entity modes, cross-field validation, and import result ownership.",
    },
    "frontend-specialized": {
      title: "Specialized interfaces",
      description: "Contain imperative SDK lifetimes and synchronize drafts with external visual representations.",
    },
    "frontend-platform": {
      title: "Application startup",
      description:
        "Validate public configuration, await transport readiness, own runtime/provider order, and recover from startup/render failures.",
    },
    "frontend-preferences": {
      title: "Preferences and storage",
      description:
        "Apply fixed settings, user precedence, resilient storage and deliberately scoped cross-tab subscriptions.",
    },
    "frontend-localization": {
      title: "Localization resources",
      description: "Keep typed resource keys and locale-dependent formatting aligned with stable domain state.",
    },
    "frontend-accessibility": {
      title: "Focus and presentation",
      description:
        "Own route/portal focus, reduced motion, contrast and control size through the actual application contracts.",
    },
    "frontend-overlays": {
      title: "Overlay protocols",
      description: "Await guarded closure and keep command outcomes tied to the exact mounted presentation session.",
    },
  },
  articles: {
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
    "frontend-real-time-authenticated-event-lifetimes": {
      title: "Authenticated event lifetimes",
      description:
        "Own event connections, listeners and recovery by viewer/session scope without confusing connectivity with authority.",
    },
    "frontend-real-time-event-to-cache-reconciliation": {
      title: "Event-to-cache reconciliation",
      description:
        "Validate envelopes and entities before scoped application, and require explicit ordering, replay and gap-recovery contracts.",
    },
    "frontend-offline-capability-scoped-offline-adapters": {
      title: "Capability-scoped offline adapters",
      description:
        "Define allowed offline operations, owner-scoped data and recognized transport fallback without queuing around denial or conflict.",
    },
    "frontend-offline-durable-command-queues": {
      title: "Durable command queues",
      description:
        "Persist stable owned intent with atomic local durability, dependency order, identity mapping and explicit replay recovery.",
    },
    "frontend-offline-synchronization-state-machines": {
      title: "Synchronization state machines",
      description:
        "Separate local queue, sending, server acceptance, processing and final outcomes with durable receipts and bounded recovery.",
    },
    "frontend-offline-worker-snapshots-and-last-good-data": {
      title: "Worker snapshots and last-good data",
      description:
        "Keep a coherent prior cache through partial refresh failure and distinguish download completeness from validation and atomic promotion.",
    },
    "frontend-state-versioned-persisted-preferences": {
      title: "Versioned persisted preferences",
      description:
        "Validate stored values, preserve live preferences on storage failure and migrate semantic meaning without erasing unrelated data.",
    },
    "frontend-forms-schema-driven-fields-and-explicit-choices": {
      title: "Schema-driven fields and explicit choices",
      description:
        "Reuse field mechanics without letting initialization invent meaningful union choices or hide domain validation.",
    },
    "frontend-collections-filter-prerequisites-and-result-states": {
      title: "Filter prerequisites and result states",
      description:
        "Distinguish missing prerequisites, first load, empty success, retained refresh, failure and denial.",
    },
    "frontend-collections-hierarchical-rows-and-nested-editors": {
      title: "Hierarchical rows and nested editors",
      description:
        "Separate expansion, selection, child editing and aggregate submission with stable local identities.",
    },
    "frontend-forms-entity-modes-and-validation-policy": {
      title: "Entity modes and validation policy",
      description:
        "Keep create/update explicit while sharing localized validation timing and awaited submission mechanics.",
    },
    "frontend-forms-cross-field-constraints-and-reset": {
      title: "Cross-field constraints and reset",
      description:
        "Validate complete relationships and clear only incompatible downstream choices through deliberate transitions.",
    },
    "frontend-specialized-imperative-sdk-lifetimes": {
      title: "Imperative SDK lifetimes",
      description:
        "Own mounted targets, instances, subscriptions and asynchronous initialization with deterministic cleanup.",
    },
    "frontend-specialized-draft-and-visualization-synchronization": {
      title: "Draft and visualization synchronization",
      description:
        "Keep one canonical draft with explicit visual mapping, interaction updates and a separate persistence command.",
    },
    "frontend-collections-reporting-and-export-scope": {
      title: "Reporting and export scope",
      description:
        "Make filtered data, period semantics, selection, output format and generation outcomes explicit across screen and file.",
    },
    "frontend-forms-file-import-command-results": {
      title: "File import command results",
      description:
        "Separate file transport, accepted processing, applied records and recovery while preserving safe retry and download ownership.",
    },
    "frontend-platform-validated-public-configuration": {
      title: "Validated public configuration",
      description:
        "Reject unknown public keys and invalid values before runtime while separating browser inputs from secrets and build-mode policy.",
    },
    "frontend-platform-mock-boundary-before-runtime": {
      title: "Mock boundary before runtime",
      description:
        "Await development transport readiness before creating request owners and keep fixture scope distinct from backend evidence.",
    },
    "frontend-platform-root-runtime-and-provider-order": {
      title: "Root runtime and provider order",
      description:
        "Create stable services once and order React providers by dependency without splitting cache or promoting page lifetimes globally.",
    },
    "frontend-platform-startup-and-render-recovery": {
      title: "Startup and render recovery",
      description:
        "Separate bootstrap, render and command failures with provider-independent recovery and honest reporting/cleanup limits.",
    },
    "frontend-state-signal-hydration-and-disposable-effects": {
      title: "Signal hydration and disposable effects",
      description:
        "Hydrate every group before synchronous effects and preserve rollback, reverse cleanup and generation-scoped HMR lifetimes.",
    },
    "frontend-preferences-fixed-settings-and-user-precedence": {
      title: "Fixed settings and user precedence",
      description:
        "Apply deployment-fixed choices through values, controls and guarded setters without overwriting saved user preferences.",
    },
    "frontend-preferences-storage-failure-and-cross-tab-updates": {
      title: "Storage failure and cross-tab updates",
      description:
        "Separate validated resilient reads, fallible writes, live provider state and the exact preferences with external-tab subscriptions.",
    },
    "frontend-localization-typed-resource-shapes-and-locale-switching": {
      title: "Typed resource shapes and locale switching",
      description:
        "Align structural keys, plural/interpolation review and active-locale recomputation over stable business state.",
    },
    "frontend-accessibility-focus-ownership-across-portals-and-routes": {
      title: "Focus ownership across portals and routes",
      description:
        "Release modal traps before navigation or fragment scrolling and distinguish opener restoration from new-route focus.",
    },
    "frontend-accessibility-motion-contrast-and-control-size": {
      title: "Motion, contrast and control size",
      description:
        "Consume semantic theme preferences while preserving progress feedback and verifying real custom-control and animation limits.",
    },
    "frontend-overlays-guarded-command-results-and-session-identity": {
      title: "Guarded command results and session identity",
      description:
        "Keep UI outcome, acknowledged command, guarded exit and captured presentation tied to their exact mount/view session.",
    },
  },
} as const;
