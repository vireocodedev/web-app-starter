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
      description: "Editor sessions, asynchronous authority, reliable commands, and multi-route drafts.",
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
  },
} as const;
