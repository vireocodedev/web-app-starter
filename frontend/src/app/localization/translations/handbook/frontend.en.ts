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
  },
} as const;
