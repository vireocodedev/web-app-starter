import type { HandbookCategoryCatalog } from "../types/HandbookArticle.ts";

export const qualityHandbookCatalog = {
  category: {
    id: "quality",
    slug: "quality",
    titleKey: "handbook.categories.quality.title",
    descriptionKey: "handbook.categories.quality.description",
  },
  topics: [
    {
      id: "quality-test-design",
      categoryId: "quality",
      slug: "test-design",
      titleKey: "handbook.topics.quality-test-design.title",
      descriptionKey: "handbook.topics.quality-test-design.description",
    },
    {
      id: "quality-frontend",
      categoryId: "quality",
      slug: "frontend",
      titleKey: "handbook.topics.quality-frontend.title",
      descriptionKey: "handbook.topics.quality-frontend.description",
    },
    {
      id: "quality-backend",
      categoryId: "quality",
      slug: "backend",
      titleKey: "handbook.topics.quality-backend.title",
      descriptionKey: "handbook.topics.quality-backend.description",
    },
    {
      id: "quality-browser",
      categoryId: "quality",
      slug: "browser",
      titleKey: "handbook.topics.quality-browser.title",
      descriptionKey: "handbook.topics.quality-browser.description",
    },
  ],
  articles: [
    {
      id: "quality-test-design-architecture-invariants-and-checks",
      topicId: "quality-test-design",
      slug: "architecture-invariants-and-checks",
      contentPath: "quality/test-design/architecture-invariants-and-checks",
      titleKey: "handbook.articles.quality-test-design-architecture-invariants-and-checks.title",
      descriptionKey: "handbook.articles.quality-test-design-architecture-invariants-and-checks.description",
      implementation: "starter",
      size: "large",
      sources: [
        {
          project: "vireocode-web-app-starter",
          path: "frontend/scripts/application-architecture-policy.mjs",
          revision: "a7defb9e45dc418036d4d62af742fadf42ffde05",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/scripts/verify-application-architecture.mjs",
          revision: "a7defb9e45dc418036d4d62af742fadf42ffde05",
        },
      ],
      relatedArticleIds: [
        "backend-foundation-http-service-persistence-boundaries",
        "quality-test-design-assert-boundary-outcomes",
        "quality-frontend-http-contract-mocks-and-handler-lifetimes",
        "quality-backend-real-postgres-and-http-contracts",
      ],
    },
    {
      id: "quality-test-design-assert-boundary-outcomes",
      topicId: "quality-test-design",
      slug: "assert-boundary-outcomes",
      contentPath: "quality/test-design/assert-boundary-outcomes",
      titleKey: "handbook.articles.quality-test-design-assert-boundary-outcomes.title",
      descriptionKey: "handbook.articles.quality-test-design-assert-boundary-outcomes.description",
      implementation: "mixed",
      size: "medium",
      sources: [
        {
          project: "vireocode-web-app-starter",
          path: "frontend/tests/features/development-guide/contacts/api/contact.mutation.test.ts",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/tests/integration/auth/api/appAuth.api.springSession.test.ts",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "client-discovery-app",
          path: "backend/src/test/java/com/vireocode/clientdiscovery/SpecificationIntegrationTests.java",
          revision: "df1feaef58d52e7e07c12a736aed607e64d7918c",
        },
      ],
      relatedArticleIds: [
        "quality-frontend-fresh-runtime-and-query-fixtures",
        "quality-backend-real-postgres-and-http-contracts",
      ],
    },
    {
      id: "quality-frontend-fresh-runtime-and-query-fixtures",
      topicId: "quality-frontend",
      slug: "fresh-runtime-and-query-fixtures",
      contentPath: "quality/frontend/fresh-runtime-and-query-fixtures",
      titleKey: "handbook.articles.quality-frontend-fresh-runtime-and-query-fixtures.title",
      descriptionKey: "handbook.articles.quality-frontend-fresh-runtime-and-query-fixtures.description",
      implementation: "starter",
      size: "medium",
      sources: [
        {
          project: "vireocode-web-app-starter",
          path: "frontend/tests/renderApp.tsx",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/tests/integration/auth/createAppAuthRuntime.test.ts",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/tests/app/data/query/createAppQueryClient.test.ts",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
      ],
      relatedArticleIds: [
        "quality-frontend-http-contract-mocks-and-handler-lifetimes",
        "quality-frontend-signal-effect-disposal-and-storage-failures",
      ],
    },
    {
      id: "quality-frontend-http-contract-mocks-and-handler-lifetimes",
      topicId: "quality-frontend",
      slug: "http-contract-mocks-and-handler-lifetimes",
      contentPath: "quality/frontend/http-contract-mocks-and-handler-lifetimes",
      titleKey: "handbook.articles.quality-frontend-http-contract-mocks-and-handler-lifetimes.title",
      descriptionKey: "handbook.articles.quality-frontend-http-contract-mocks-and-handler-lifetimes.description",
      implementation: "starter",
      size: "medium",
      sources: [
        {
          project: "vireocode-web-app-starter",
          path: "frontend/tests/server.ts",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/tests/setup.ts",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/tests/integration/auth/api/appAuth.api.springSession.test.ts",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
      ],
      relatedArticleIds: [
        "backend-security-session-and-csrf-lifecycle",
        "quality-backend-real-postgres-and-http-contracts",
      ],
    },
    {
      id: "quality-frontend-async-generation-and-stale-result-scenarios",
      topicId: "quality-frontend",
      slug: "async-generation-and-stale-result-scenarios",
      contentPath: "quality/frontend/async-generation-and-stale-result-scenarios",
      titleKey: "handbook.articles.quality-frontend-async-generation-and-stale-result-scenarios.title",
      descriptionKey: "handbook.articles.quality-frontend-async-generation-and-stale-result-scenarios.description",
      implementation: "mixed",
      size: "large",
      sources: [
        {
          project: "vireocode-web-app-starter",
          path: "frontend/tests/features/development-guide/patterns/forms/components/AsyncLookupsPanel/useAsyncLookup.test.tsx",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/tests/integration/auth/createAppAuthRuntime.test.ts",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "client-discovery-app",
          path: "frontend/tests/features/specifications/hooks/useSpecificationEditor.test.tsx",
          revision: "df1feaef58d52e7e07c12a736aed607e64d7918c",
        },
      ],
      relatedArticleIds: [
        "frontend-async-commands-generation-guards-after-await",
        "frontend-async-commands-committed-writes-and-observer-failures",
      ],
    },
    {
      id: "quality-frontend-signal-effect-disposal-and-storage-failures",
      topicId: "quality-frontend",
      slug: "signal-effect-disposal-and-storage-failures",
      contentPath: "quality/frontend/signal-effect-disposal-and-storage-failures",
      titleKey: "handbook.articles.quality-frontend-signal-effect-disposal-and-storage-failures.title",
      descriptionKey: "handbook.articles.quality-frontend-signal-effect-disposal-and-storage-failures.description",
      implementation: "starter",
      size: "medium",
      sources: [
        {
          project: "vireocode-web-app-starter",
          path: "frontend/tests/integration/applicationState/signals/estimate/sigEstimate.test.ts",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/tests/app/bootstrap/signals/initSignalEffects.test.ts",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
      ],
      relatedArticleIds: [
        "frontend-state-versioned-persisted-preferences",
        "quality-test-design-deterministic-fixtures-and-clock-ownership",
      ],
    },
    {
      id: "quality-backend-real-postgres-and-http-contracts",
      topicId: "quality-backend",
      slug: "real-postgres-and-http-contracts",
      contentPath: "quality/backend/real-postgres-and-http-contracts",
      titleKey: "handbook.articles.quality-backend-real-postgres-and-http-contracts.title",
      descriptionKey: "handbook.articles.quality-backend-real-postgres-and-http-contracts.description",
      implementation: "starter",
      size: "large",
      sources: [
        {
          project: "vireocode-web-app-starter",
          path: "backend/src/test/java/com/vireocode/backend/AuthIntegrationTests.java",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "backend/src/test/java/com/vireocode/backend/TestcontainersConfiguration.java",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
      ],
      relatedArticleIds: [
        "backend-security-session-and-csrf-lifecycle",
        "quality-backend-transaction-conflicts-and-lock-scenarios",
      ],
    },
    {
      id: "quality-backend-transaction-conflicts-and-lock-scenarios",
      topicId: "quality-backend",
      slug: "transaction-conflicts-and-lock-scenarios",
      contentPath: "quality/backend/transaction-conflicts-and-lock-scenarios",
      titleKey: "handbook.articles.quality-backend-transaction-conflicts-and-lock-scenarios.title",
      descriptionKey: "handbook.articles.quality-backend-transaction-conflicts-and-lock-scenarios.description",
      implementation: "reference",
      size: "large",
      sources: [
        {
          project: "client-discovery-app",
          path: "backend/src/test/java/com/vireocode/clientdiscovery/SpecificationIntegrationTests.java",
          revision: "df1feaef58d52e7e07c12a736aed607e64d7918c",
        },
        {
          project: "client-discovery-app",
          path: "backend/src/test/java/com/vireocode/clientdiscovery/LC03IntegrationSupport.java",
          revision: "df1feaef58d52e7e07c12a736aed607e64d7918c",
        },
      ],
      relatedArticleIds: [
        "backend-data-revision-conflicts-and-shared-locks",
        "backend-data-lock-order-and-fresh-transaction-retries",
      ],
    },
    {
      id: "quality-browser-assembled-routes-and-development-profiles",
      topicId: "quality-browser",
      slug: "assembled-routes-and-development-profiles",
      contentPath: "quality/browser/assembled-routes-and-development-profiles",
      titleKey: "handbook.articles.quality-browser-assembled-routes-and-development-profiles.title",
      descriptionKey: "handbook.articles.quality-browser-assembled-routes-and-development-profiles.description",
      implementation: "starter",
      size: "medium",
      sources: [
        {
          project: "vireocode-web-app-starter",
          path: "frontend/playwright.config.ts",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/playwright.development.config.ts",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/tests/browser/documentation.development.spec.ts",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/tests/browser/application.spec.ts",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
      ],
      relatedArticleIds: [
        "frontend-routing-typed-route-contracts",
        "quality-browser-keyboard-responsive-and-accessibility-evidence",
      ],
    },
    {
      id: "quality-browser-keyboard-responsive-and-accessibility-evidence",
      topicId: "quality-browser",
      slug: "keyboard-responsive-and-accessibility-evidence",
      contentPath: "quality/browser/keyboard-responsive-and-accessibility-evidence",
      titleKey: "handbook.articles.quality-browser-keyboard-responsive-and-accessibility-evidence.title",
      descriptionKey: "handbook.articles.quality-browser-keyboard-responsive-and-accessibility-evidence.description",
      implementation: "starter",
      size: "medium",
      sources: [
        {
          project: "vireocode-web-app-starter",
          path: "frontend/tests/browser/application.spec.ts",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/tests/browser/documentation.development.spec.ts",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
      ],
      relatedArticleIds: [
        "frontend-editing-complete-navigation-guards",
        "quality-browser-assembled-routes-and-development-profiles",
      ],
    },
    {
      id: "quality-test-design-deterministic-fixtures-and-clock-ownership",
      topicId: "quality-test-design",
      slug: "deterministic-fixtures-and-clock-ownership",
      contentPath: "quality/test-design/deterministic-fixtures-and-clock-ownership",
      titleKey: "handbook.articles.quality-test-design-deterministic-fixtures-and-clock-ownership.title",
      descriptionKey: "handbook.articles.quality-test-design-deterministic-fixtures-and-clock-ownership.description",
      implementation: "mixed",
      size: "medium",
      sources: [
        {
          project: "vireocode-web-app-starter",
          path: "frontend/tests/features/development-guide/patterns/forms/api/asyncLookup.api.test.ts",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/tests/app/localization/formatters.test.ts",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "client-discovery-app",
          path: "backend/src/test/java/com/vireocode/clientdiscovery/discovery/AttentionServiceTests.java",
          revision: "df1feaef58d52e7e07c12a736aed607e64d7918c",
        },
        {
          project: "client-discovery-app",
          path: "backend/src/test/java/com/vireocode/clientdiscovery/discovery/ServiceCalendarTests.java",
          revision: "df1feaef58d52e7e07c12a736aed607e64d7918c",
        },
      ],
      relatedArticleIds: [
        "quality-frontend-async-generation-and-stale-result-scenarios",
        "quality-frontend-fresh-runtime-and-query-fixtures",
      ],
    },
  ],
} as const satisfies HandbookCategoryCatalog;
