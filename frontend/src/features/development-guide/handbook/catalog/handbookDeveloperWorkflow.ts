import type { HandbookCategoryCatalog } from "../types/HandbookArticle.ts";

export const developerWorkflowHandbookCatalog = {
  category: {
    id: "developer-workflow",
    slug: "developer-workflow",
    titleKey: "handbook.categories.developer-workflow.title",
    descriptionKey: "handbook.categories.developer-workflow.description",
  },
  topics: [
    {
      id: "developer-workflow-local-development",
      categoryId: "developer-workflow",
      slug: "local-development",
      titleKey: "handbook.topics.developer-workflow-local-development.title",
      descriptionKey: "handbook.topics.developer-workflow-local-development.description",
    },
    {
      id: "developer-verification",
      categoryId: "developer-workflow",
      slug: "verification",
      titleKey: "handbook.topics.developer-verification.title",
      descriptionKey: "handbook.topics.developer-verification.description",
    },
    {
      id: "developer-template-evolution",
      categoryId: "developer-workflow",
      slug: "template-evolution",
      titleKey: "handbook.topics.developer-template-evolution.title",
      descriptionKey: "handbook.topics.developer-template-evolution.description",
    },
  ],
  articles: [
    {
      id: "developer-workflow-local-development-workspace-runtimes",
      topicId: "developer-workflow-local-development",
      slug: "workspace-runtimes",
      contentPath: "developer-workflow/local-development/workspace-runtimes",
      titleKey: "handbook.articles.developer-workflow-local-development-workspace-runtimes.title",
      descriptionKey: "handbook.articles.developer-workflow-local-development-workspace-runtimes.description",
      implementation: "starter",
      size: "large",
      sources: [
        {
          project: "vireocode-web-app-starter",
          revision: "7c2264746bd6d6c3fc00e373778831943666592b",
          path: "README.md",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "7c2264746bd6d6c3fc00e373778831943666592b",
          path: "backend/build.gradle",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "7c2264746bd6d6c3fc00e373778831943666592b",
          path: "frontend/.nvmrc",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "7c2264746bd6d6c3fc00e373778831943666592b",
          path: "frontend/package.json",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "7c2264746bd6d6c3fc00e373778831943666592b",
          path: ".vscode/launch.json",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "7c2264746bd6d6c3fc00e373778831943666592b",
          path: ".vscode/tasks.json",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "7c2264746bd6d6c3fc00e373778831943666592b",
          path: "backend/scripts/with-local-node.sh",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "7c2264746bd6d6c3fc00e373778831943666592b",
          path: "backend/scripts/setup-local.mjs",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "7c2264746bd6d6c3fc00e373778831943666592b",
          path: "backend/scripts/start-local.mjs",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "7c2264746bd6d6c3fc00e373778831943666592b",
          path: "backend/compose.yaml",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "7c2264746bd6d6c3fc00e373778831943666592b",
          path: "frontend/vite.config.ts",
        },
      ],
    },
    {
      id: "developer-workflow-local-development-vscode-launch-contract",
      topicId: "developer-workflow-local-development",
      slug: "vscode-launch-contract",
      contentPath: "developer-workflow/local-development/vscode-launch-contract",
      titleKey: "handbook.articles.developer-workflow-local-development-vscode-launch-contract.title",
      descriptionKey: "handbook.articles.developer-workflow-local-development-vscode-launch-contract.description",
      implementation: "starter",
      size: "medium",
      sources: [
        {
          project: "vireocode-web-app-starter",
          path: ".vscode/launch.json",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: ".vscode/tasks.json",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "backend/scripts/with-local-node.sh",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "backend/scripts/setup-local.mjs",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "backend/scripts/start-local.mjs",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "README.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: ".agents/skills/initialize-project/references/runbook.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
      ],
      relatedArticleIds: [
        "developer-workflow-local-development-workspace-runtimes",
        "developer-workflow-local-development-parallel-checkouts-and-database-identity",
      ],
    },
    {
      id: "developer-workflow-local-development-parallel-checkouts-and-database-identity",
      topicId: "developer-workflow-local-development",
      slug: "parallel-checkouts-and-database-identity",
      contentPath: "developer-workflow/local-development/parallel-checkouts-and-database-identity",
      titleKey: "handbook.articles.developer-workflow-local-development-parallel-checkouts-and-database-identity.title",
      descriptionKey:
        "handbook.articles.developer-workflow-local-development-parallel-checkouts-and-database-identity.description",
      implementation: "mixed",
      size: "medium",
      sources: [
        {
          project: "vireocode-web-app-starter",
          path: "backend/scripts/start-local.mjs",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "backend/compose.yaml",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "backend/src/main/resources/application-local.yaml",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "backend/src/main/java/com/vireocode/backend/user/LocalUserInitializer.java",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: ".vscode/launch.json",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/vite.config.ts",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "README.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
      ],
      relatedArticleIds: [
        "developer-workflow-local-development-vscode-launch-contract",
        "developer-workflow-local-development-same-origin-session-debugging",
      ],
    },
    {
      id: "developer-workflow-local-development-same-origin-session-debugging",
      topicId: "developer-workflow-local-development",
      slug: "same-origin-session-debugging",
      contentPath: "developer-workflow/local-development/same-origin-session-debugging",
      titleKey: "handbook.articles.developer-workflow-local-development-same-origin-session-debugging.title",
      descriptionKey:
        "handbook.articles.developer-workflow-local-development-same-origin-session-debugging.description",
      implementation: "mixed",
      size: "medium",
      sources: [
        {
          project: "vireocode-web-app-starter",
          path: "frontend/vite.config.ts",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/src/app/data/http/createAppAxios.ts",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/src/app/auth/api/appAuth.api.springSession.ts",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "backend/src/main/resources/application.yaml",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "backend/src/main/resources/application-local.yaml",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "backend/src/main/java/com/vireocode/backend/auth/SecurityConfiguration.java",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "README.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/README.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
      ],
      relatedArticleIds: [
        "backend-security-session-and-csrf-lifecycle",
        "developer-workflow-local-development-vscode-launch-contract",
      ],
    },
    {
      id: "developer-workflow-verification-verification-selection-and-evidence",
      topicId: "developer-verification",
      slug: "verification-selection-and-evidence",
      contentPath: "developer-workflow/verification/verification-selection-and-evidence",
      titleKey: "handbook.articles.developer-workflow-verification-verification-selection-and-evidence.title",
      descriptionKey:
        "handbook.articles.developer-workflow-verification-verification-selection-and-evidence.description",
      implementation: "mixed",
      size: "medium",
      sources: [
        {
          project: "vireocode-web-app-starter",
          path: "README.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/README.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/package.json",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "backend/build.gradle",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/AGENTS.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/docs/architecture/en/tests-mocks-stories-and-architecture-checks.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "docs/v1-workflow.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
      ],
      relatedArticleIds: [
        "ci-pipelines-owner-scoped-checks",
        "ci-verification-resource-budgets",
        "ci-verification-complete-shard-evidence",
      ],
    },
    {
      id: "developer-workflow-template-evolution-identify-the-installed-stack-profile",
      topicId: "developer-template-evolution",
      slug: "identify-the-installed-stack-profile",
      contentPath: "developer-workflow/template-evolution/identify-the-installed-stack-profile",
      titleKey: "handbook.articles.developer-workflow-template-evolution-identify-the-installed-stack-profile.title",
      descriptionKey:
        "handbook.articles.developer-workflow-template-evolution-identify-the-installed-stack-profile.description",
      implementation: "mixed",
      size: "medium",
      sources: [
        {
          project: "vireocode-web-app-starter",
          path: "frontend/package.json",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/package-lock.json",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "backend/build.gradle",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/AGENTS.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "rgo-frontend",
          path: "README.md",
          revision: "88c3f4cb18462cad8a2845b773406f4a1008db69",
        },
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
          project: "vireo-starter",
          path: "docs/ECOSYSTEM_CONTRACT.md",
          revision: "ab58e6a045894f1d3a855b41834e4b34c066d8c1",
        },
        {
          project: "vireo-starter",
          path: "docs/APPLICATION_PROJECTION.md",
          revision: "ab58e6a045894f1d3a855b41834e4b34c066d8c1",
        },
      ],
      relatedArticleIds: [
        "developer-workflow-template-evolution-application-and-library-responsibility",
        "developer-workflow-local-development-workspace-runtimes",
      ],
    },
    {
      id: "developer-workflow-template-evolution-application-and-library-responsibility",
      topicId: "developer-template-evolution",
      slug: "application-and-library-responsibility",
      contentPath: "developer-workflow/template-evolution/application-and-library-responsibility",
      titleKey: "handbook.articles.developer-workflow-template-evolution-application-and-library-responsibility.title",
      descriptionKey:
        "handbook.articles.developer-workflow-template-evolution-application-and-library-responsibility.description",
      implementation: "mixed",
      size: "medium",
      sources: [
        {
          project: "vireocode-web-app-starter",
          path: "frontend/AGENTS.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/docs/architecture/en/source-map-and-ownership.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/docs/architecture/en/dependency-boundaries-and-imports.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "rgo-frontend",
          path: "docs/platform/PUBLIC_MODULE_CONTRACT.md",
          revision: "88c3f4cb18462cad8a2845b773406f4a1008db69",
        },
        {
          project: "rgo-frontend",
          path: "src/index.ts",
          revision: "88c3f4cb18462cad8a2845b773406f4a1008db69",
        },
        {
          project: "rgo-frontend",
          path: "README.md",
          revision: "88c3f4cb18462cad8a2845b773406f4a1008db69",
        },
      ],
      relatedArticleIds: [
        "agent-workflow-implementation-capability-owners-and-review-boundaries",
        "developer-workflow-template-evolution-published-artifacts-and-local-overrides",
      ],
    },
    {
      id: "developer-workflow-template-evolution-published-artifacts-and-local-overrides",
      topicId: "developer-template-evolution",
      slug: "published-artifacts-and-local-overrides",
      contentPath: "developer-workflow/template-evolution/published-artifacts-and-local-overrides",
      titleKey: "handbook.articles.developer-workflow-template-evolution-published-artifacts-and-local-overrides.title",
      descriptionKey:
        "handbook.articles.developer-workflow-template-evolution-published-artifacts-and-local-overrides.description",
      implementation: "reference",
      size: "medium",
      sources: [
        {
          project: "vireocode-web-app-starter",
          path: "frontend/package.json",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/package-lock.json",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "rgo-frontend",
          path: "README.md",
          revision: "88c3f4cb18462cad8a2845b773406f4a1008db69",
        },
        {
          project: "rgo-frontend",
          path: "scripts/application-template/run-application-template.mjs",
          revision: "88c3f4cb18462cad8a2845b773406f4a1008db69",
        },
        {
          project: "rgo-frontend",
          path: "scripts/package/pack-release-artifact.mjs",
          revision: "88c3f4cb18462cad8a2845b773406f4a1008db69",
        },
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
          project: "vireo-starter",
          path: "docs/ANONYMOUS_CONSUMER_GAUNTLET.md",
          revision: "ab58e6a045894f1d3a855b41834e4b34c066d8c1",
        },
      ],
      relatedArticleIds: [
        "ci-package-verification-anonymous-consumer-artifact-checks",
        "ci-package-verification-type-resolution-and-runtime-entrypoints",
      ],
    },
    {
      id: "developer-workflow-template-evolution-generated-once-and-regenerated-ownership",
      topicId: "developer-template-evolution",
      slug: "generated-once-and-regenerated-ownership",
      contentPath: "developer-workflow/template-evolution/generated-once-and-regenerated-ownership",
      titleKey:
        "handbook.articles.developer-workflow-template-evolution-generated-once-and-regenerated-ownership.title",
      descriptionKey:
        "handbook.articles.developer-workflow-template-evolution-generated-once-and-regenerated-ownership.description",
      implementation: "reference",
      size: "medium",
      sources: [
        {
          project: "vireo-starter",
          path: "docs/architecture/generated-code-ownership.md",
          revision: "ab58e6a045894f1d3a855b41834e4b34c066d8c1",
        },
        {
          project: "vireo-starter",
          path: "packages/create-vireo/src/entity-generator.ts",
          revision: "ab58e6a045894f1d3a855b41834e4b34c066d8c1",
        },
        {
          project: "vireo-starter",
          path: "packages/create-vireo/src/project-upgrade.ts",
          revision: "ab58e6a045894f1d3a855b41834e4b34c066d8c1",
        },
      ],
      relatedArticleIds: [
        "developer-workflow-template-evolution-projection-boundaries-and-classified-paths",
        "backend-data-flyway-and-schema-ownership",
      ],
    },
    {
      id: "developer-workflow-template-evolution-projection-boundaries-and-classified-paths",
      topicId: "developer-template-evolution",
      slug: "projection-boundaries-and-classified-paths",
      contentPath: "developer-workflow/template-evolution/projection-boundaries-and-classified-paths",
      titleKey:
        "handbook.articles.developer-workflow-template-evolution-projection-boundaries-and-classified-paths.title",
      descriptionKey:
        "handbook.articles.developer-workflow-template-evolution-projection-boundaries-and-classified-paths.description",
      implementation: "reference",
      size: "medium",
      sources: [
        {
          project: "vireo-starter",
          path: "docs/APPLICATION_PROJECTION.md",
          revision: "ab58e6a045894f1d3a855b41834e4b34c066d8c1",
        },
        {
          project: "vireo-starter",
          path: "contracts/application-projection-contract.json",
          revision: "ab58e6a045894f1d3a855b41834e4b34c066d8c1",
        },
        {
          project: "vireo-starter",
          path: "packages/create-vireo/src/application-projection-contract.mjs",
          revision: "ab58e6a045894f1d3a855b41834e4b34c066d8c1",
        },
        {
          project: "vireo-starter",
          path: "packages/create-vireo/src/index.ts",
          revision: "ab58e6a045894f1d3a855b41834e4b34c066d8c1",
        },
        {
          project: "vireo-starter",
          path: "scripts/application-projection-policy.mjs",
          revision: "ab58e6a045894f1d3a855b41834e4b34c066d8c1",
        },
      ],
      relatedArticleIds: [
        "developer-workflow-template-evolution-three-way-template-adoption",
        "developer-workflow-template-evolution-generated-once-and-regenerated-ownership",
      ],
    },
    {
      id: "developer-workflow-template-evolution-three-way-template-adoption",
      topicId: "developer-template-evolution",
      slug: "three-way-template-adoption",
      contentPath: "developer-workflow/template-evolution/three-way-template-adoption",
      titleKey: "handbook.articles.developer-workflow-template-evolution-three-way-template-adoption.title",
      descriptionKey: "handbook.articles.developer-workflow-template-evolution-three-way-template-adoption.description",
      implementation: "reference",
      size: "medium",
      sources: [
        {
          project: "vireo-starter",
          path: "docs/TEMPLATE_RELEASE_ADOPTION.md",
          revision: "ab58e6a045894f1d3a855b41834e4b34c066d8c1",
        },
        {
          project: "vireo-starter",
          path: "docs/architecture/generated-code-ownership.md",
          revision: "ab58e6a045894f1d3a855b41834e4b34c066d8c1",
        },
        {
          project: "vireo-starter",
          path: "packages/create-vireo/src/project-upgrade.ts",
          revision: "ab58e6a045894f1d3a855b41834e4b34c066d8c1",
        },
        {
          project: "vireo-starter",
          path: "scripts/plan-template-adoption.mjs",
          revision: "ab58e6a045894f1d3a855b41834e4b34c066d8c1",
        },
        {
          project: "vireo-starter",
          path: "contracts/project-upgrade-policy.json",
          revision: "ab58e6a045894f1d3a855b41834e4b34c066d8c1",
        },
      ],
      relatedArticleIds: [
        "developer-workflow-template-evolution-identify-the-installed-stack-profile",
        "agent-workflow-implementation-source-bound-evidence-and-handoff",
      ],
    },
  ],
} as const satisfies HandbookCategoryCatalog;
