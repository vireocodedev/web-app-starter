import type { HandbookCategoryCatalog } from "../types/HandbookArticle.ts";

export const ciHandbookCatalog = {
  category: {
    id: "ci",
    slug: "ci",
    titleKey: "handbook.categories.ci.title",
    descriptionKey: "handbook.categories.ci.description",
  },
  topics: [
    {
      id: "ci-pipelines",
      categoryId: "ci",
      slug: "pipelines",
      titleKey: "handbook.topics.ci-pipelines.title",
      descriptionKey: "handbook.topics.ci-pipelines.description",
    },
    {
      id: "ci-verification",
      categoryId: "ci",
      slug: "verification",
      titleKey: "handbook.topics.ci-verification.title",
      descriptionKey: "handbook.topics.ci-verification.description",
    },
    {
      id: "ci-isolation",
      categoryId: "ci",
      slug: "isolation",
      titleKey: "handbook.topics.ci-isolation.title",
      descriptionKey: "handbook.topics.ci-isolation.description",
    },
    {
      id: "ci-package-verification",
      categoryId: "ci",
      slug: "package-verification",
      titleKey: "handbook.topics.ci-package-verification.title",
      descriptionKey: "handbook.topics.ci-package-verification.description",
    },
  ],
  articles: [
    {
      id: "ci-pipelines-owner-scoped-checks",
      topicId: "ci-pipelines",
      slug: "owner-scoped-checks",
      contentPath: "ci/pipelines/owner-scoped-checks",
      titleKey: "handbook.articles.ci-pipelines-owner-scoped-checks.title",
      descriptionKey: "handbook.articles.ci-pipelines-owner-scoped-checks.description",
      implementation: "starter",
      size: "medium",
      sources: [
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: ".github/workflows/ci.yml",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "infrastructure/ci/ci_scope.py",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "docs/github-ci.md",
        },
      ],
    },
    {
      id: "ci-verification-complete-shard-evidence",
      topicId: "ci-verification",
      slug: "complete-shard-evidence",
      contentPath: "ci/verification/complete-shard-evidence",
      titleKey: "handbook.articles.ci-verification-complete-shard-evidence.title",
      descriptionKey: "handbook.articles.ci-verification-complete-shard-evidence.description",
      implementation: "starter",
      size: "large",
      sources: [
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "infrastructure/ci/test_shards.py",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "infrastructure/ci/test-timings.json",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "backend/build.gradle",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: ".github/workflows/ci.yml",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "docs/github-ci.md",
        },
      ],
    },
    {
      id: "ci-isolation-disposable-worker-boundary",
      topicId: "ci-isolation",
      slug: "disposable-worker-boundary",
      contentPath: "ci/isolation/disposable-worker-boundary",
      titleKey: "handbook.articles.ci-isolation-disposable-worker-boundary.title",
      descriptionKey: "handbook.articles.ci-isolation-disposable-worker-boundary.description",
      implementation: "starter",
      size: "large",
      sources: [
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "infrastructure/ci/README.md",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "infrastructure/ci/manage.py",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "infrastructure/ci/ci-runner/controller.py",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "infrastructure/ci/ci-runner/start-job.sh",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "infrastructure/ci/ci-runner/validation.py",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "infrastructure/ci/ci-runner/config.example.json",
        },
      ],
    },
    {
      id: "ci-pipelines-required-gates-and-main-protection",
      topicId: "ci-pipelines",
      slug: "required-gates-and-main-protection",
      contentPath: "ci/pipelines/required-gates-and-main-protection",
      titleKey: "handbook.articles.ci-pipelines-required-gates-and-main-protection.title",
      descriptionKey: "handbook.articles.ci-pipelines-required-gates-and-main-protection.description",
      implementation: "starter",
      size: "medium",
      sources: [
        {
          project: "vireocode-web-app-starter",
          path: "docs/github-ci.md",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "infrastructure/ci/ci_scope.py",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: ".github/workflows/ci.yml",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
      ],
      relatedArticleIds: ["ci-pipelines-owner-scoped-checks", "ci-verification-complete-shard-evidence"],
    },
    {
      id: "ci-pipelines-pinned-toolchains-and-actions",
      topicId: "ci-pipelines",
      slug: "pinned-toolchains-and-actions",
      contentPath: "ci/pipelines/pinned-toolchains-and-actions",
      titleKey: "handbook.articles.ci-pipelines-pinned-toolchains-and-actions.title",
      descriptionKey: "handbook.articles.ci-pipelines-pinned-toolchains-and-actions.description",
      implementation: "starter",
      size: "medium",
      sources: [
        {
          project: "vireocode-web-app-starter",
          path: ".github/workflows/ci.yml",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/.nvmrc",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/package.json",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/package-lock.json",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "backend/build.gradle",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "backend/Dockerfile",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "infrastructure/ci/README.md",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
      ],
      relatedArticleIds: [
        "ci-isolation-disposable-worker-boundary",
        "developer-workflow-local-development-workspace-runtimes",
      ],
    },
    {
      id: "ci-verification-resource-budgets",
      topicId: "ci-verification",
      slug: "resource-budgets",
      contentPath: "ci/verification/resource-budgets",
      titleKey: "handbook.articles.ci-verification-resource-budgets.title",
      descriptionKey: "handbook.articles.ci-verification-resource-budgets.description",
      implementation: "starter",
      size: "large",
      sources: [
        {
          project: "vireocode-web-app-starter",
          path: ".github/workflows/ci.yml",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "infrastructure/ci/test_shards.py",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "infrastructure/ci/test-timings.json",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "infrastructure/ci/ci-runner/controller.py",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "infrastructure/ci/README.md",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "backend/gradle.properties",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "backend/build.gradle",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "backend/Dockerfile",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/vitest.config.ts",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "docs/github-ci.md",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
      ],
      relatedArticleIds: [
        "ci-verification-phase-deadlines-and-process-cleanup",
        "ci-isolation-disposable-worker-boundary",
      ],
    },
    {
      id: "ci-verification-phase-deadlines-and-process-cleanup",
      topicId: "ci-verification",
      slug: "phase-deadlines-and-process-cleanup",
      contentPath: "ci/verification/phase-deadlines-and-process-cleanup",
      titleKey: "handbook.articles.ci-verification-phase-deadlines-and-process-cleanup.title",
      descriptionKey: "handbook.articles.ci-verification-phase-deadlines-and-process-cleanup.description",
      implementation: "reference",
      size: "large",
      sources: [
        {
          project: "client-discovery-app",
          path: "infrastructure/ci/utility_phase.py",
          revision: "df1feaef58d52e7e07c12a736aed607e64d7918c",
        },
        {
          project: "client-discovery-app",
          path: ".github/workflows/ci.yml",
          revision: "df1feaef58d52e7e07c12a736aed607e64d7918c",
        },
        {
          project: "client-discovery-app",
          path: "infrastructure/ci/ci_scope.py",
          revision: "df1feaef58d52e7e07c12a736aed607e64d7918c",
        },
      ],
      relatedArticleIds: ["ci-verification-resource-budgets", "ci-pipelines-owner-scoped-checks"],
    },
    {
      id: "ci-package-verification-anonymous-consumer-artifact-checks",
      topicId: "ci-package-verification",
      slug: "anonymous-consumer-artifact-checks",
      contentPath: "ci/package-verification/anonymous-consumer-artifact-checks",
      titleKey: "handbook.articles.ci-package-verification-anonymous-consumer-artifact-checks.title",
      descriptionKey: "handbook.articles.ci-package-verification-anonymous-consumer-artifact-checks.description",
      implementation: "reference",
      size: "medium",
      sources: [
        {
          project: "rgo-frontend",
          path: "scripts/package/verify-package.mjs",
          revision: "88c3f4cb18462cad8a2845b773406f4a1008db69",
        },
        {
          project: "rgo-frontend",
          path: "scripts/application-template/verify-published-application-template.mjs",
          revision: "88c3f4cb18462cad8a2845b773406f4a1008db69",
        },
        {
          project: "rgo-frontend",
          path: "README.md",
          revision: "88c3f4cb18462cad8a2845b773406f4a1008db69",
        },
        {
          project: "vireo-starter",
          path: "docs/ANONYMOUS_CONSUMER_GAUNTLET.md",
          revision: "ab58e6a045894f1d3a855b41834e4b34c066d8c1",
        },
        {
          project: "vireo-starter",
          path: "scripts/anonymous-consumer-gauntlet.mjs",
          revision: "ab58e6a045894f1d3a855b41834e4b34c066d8c1",
        },
        {
          project: "vireo-starter",
          path: "scripts/lib/anonymous-consumer-environment.mjs",
          revision: "ab58e6a045894f1d3a855b41834e4b34c066d8c1",
        },
        {
          project: "vireo-starter",
          path: "scripts/verify-anonymous-consumer-signed-sboms.mjs",
          revision: "ab58e6a045894f1d3a855b41834e4b34c066d8c1",
        },
      ],
      relatedArticleIds: [
        "ci-package-verification-type-resolution-and-runtime-entrypoints",
        "delivery-artifacts-runtime-smoke-evidence",
      ],
    },
    {
      id: "ci-package-verification-type-resolution-and-runtime-entrypoints",
      topicId: "ci-package-verification",
      slug: "type-resolution-and-runtime-entrypoints",
      contentPath: "ci/package-verification/type-resolution-and-runtime-entrypoints",
      titleKey: "handbook.articles.ci-package-verification-type-resolution-and-runtime-entrypoints.title",
      descriptionKey: "handbook.articles.ci-package-verification-type-resolution-and-runtime-entrypoints.description",
      implementation: "reference",
      size: "medium",
      sources: [
        {
          project: "rgo-frontend",
          path: "package.json",
          revision: "88c3f4cb18462cad8a2845b773406f4a1008db69",
        },
        {
          project: "rgo-frontend",
          path: "docs/platform/PUBLIC_MODULE_CONTRACT.md",
          revision: "88c3f4cb18462cad8a2845b773406f4a1008db69",
        },
        {
          project: "rgo-frontend",
          path: "scripts/package/verify-package.mjs",
          revision: "88c3f4cb18462cad8a2845b773406f4a1008db69",
        },
        {
          project: "rgo-frontend",
          path: "scripts/package/verify-typecheck-resolution.mjs",
          revision: "88c3f4cb18462cad8a2845b773406f4a1008db69",
        },
        {
          project: "rgo-frontend",
          path: "scripts/package/declaration-graph.mjs",
          revision: "88c3f4cb18462cad8a2845b773406f4a1008db69",
        },
        {
          project: "vireo-starter",
          path: "scripts/strict-consumer-types.mjs",
          revision: "ab58e6a045894f1d3a855b41834e4b34c066d8c1",
        },
        {
          project: "vireo-starter",
          path: "scripts/strict-consumer-types-worker.mjs",
          revision: "ab58e6a045894f1d3a855b41834e4b34c066d8c1",
        },
      ],
      relatedArticleIds: [
        "developer-workflow-template-evolution-published-artifacts-and-local-overrides",
        "ci-pipelines-pinned-toolchains-and-actions",
      ],
    },
  ],
} as const satisfies HandbookCategoryCatalog;
