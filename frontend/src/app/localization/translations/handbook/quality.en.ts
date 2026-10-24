export const englishQualityHandbookTranslations = {
  categories: {
    quality: {
      title: "Quality and verification",
      description:
        "Choose observable boundaries, isolated fixtures, race scenarios, real integration evidence, and accessible browser journeys.",
    },
  },
  topics: {
    "quality-test-design": {
      title: "Test design",
      description: "Assert meaningful boundary outcomes and keep fixtures, clocks, and evidence deterministic.",
    },
    "quality-frontend": {
      title: "Frontend verification",
      description: "Isolate runtime/cache state, HTTP scenarios, asynchronous ownership, and disposable effects.",
    },
    "quality-backend": {
      title: "Backend verification",
      description: "Use actual database and HTTP boundaries, and make transaction/concurrency proof limits explicit.",
    },
    "quality-browser": {
      title: "Browser and accessibility",
      description:
        "Verify assembled routes, keyboard/focus behavior, responsive layouts, and complementary accessibility evidence.",
    },
  },
  articles: {
    "quality-test-design-architecture-invariants-and-checks": {
      title: "Architecture invariants and checks",
      description:
        "Map installed frontend source guards and backend bytecode invariants to commands, implementations and proof fixtures while separating behavior checks and human review.",
    },
    "quality-test-design-assert-boundary-outcomes": {
      title: "Assert boundary outcomes",
      description:
        "Choose the smallest real boundary that proves intended changes, forbidden effects and unrelated-owner isolation.",
    },
    "quality-frontend-fresh-runtime-and-query-fixtures": {
      title: "Fresh runtime and query fixtures",
      description:
        "Build isolated runtime, cache and service owners while keeping production retry policy separate from deterministic fixture behavior.",
    },
    "quality-frontend-http-contract-mocks-and-handler-lifetimes": {
      title: "HTTP contract mocks and handler lifetimes",
      description:
        "Keep real client serialization and parsing while scenario-owned MSW handlers expose headers, counts, errors and cleanup.",
    },
    "quality-frontend-async-generation-and-stale-result-scenarios": {
      title: "Async generation and stale-result scenarios",
      description:
        "Hold and release responses to prove current authority survives obsolete reads, confirmations and late acknowledgements.",
    },
    "quality-frontend-signal-effect-disposal-and-storage-failures": {
      title: "Signal effect disposal and storage failures",
      description: "Assert normalized live state, persistence status and absence of later writes after effect cleanup.",
    },
    "quality-backend-real-postgres-and-http-contracts": {
      title: "Real PostgreSQL and HTTP contracts",
      description:
        "Use disposable PostgreSQL and actual random-port HTTP for session, cookie, CSRF, JSON and persisted negative outcomes.",
    },
    "quality-backend-transaction-conflicts-and-lock-scenarios": {
      title: "Transaction conflicts and lock scenarios",
      description:
        "Control overlapping transactions and verify current authority, replay and persisted invariant outcomes without overstating timeout evidence.",
    },
    "quality-browser-assembled-routes-and-development-profiles": {
      title: "Assembled routes and development profiles",
      description:
        "Match browser route evidence to DEV or built application profiles, explicit scenario admission and bounded frontend mocks.",
    },
    "quality-browser-keyboard-responsive-and-accessibility-evidence": {
      title: "Keyboard, responsive and accessibility evidence",
      description:
        "Combine semantic keyboard/focus paths, narrow/localized geometry and scoped axe evidence while stating their limits.",
    },
    "quality-test-design-deterministic-fixtures-and-clock-ownership": {
      title: "Deterministic fixtures and clock ownership",
      description:
        "Own failure counters, response gates, timers, fixed business time, locale and calendar semantics independently.",
    },
  },
} as const;
