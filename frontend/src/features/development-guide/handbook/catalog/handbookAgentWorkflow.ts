import type { HandbookCategoryCatalog } from "../types/HandbookArticle.ts";

export const agentWorkflowHandbookCatalog = {
  category: {
    id: "agent-workflow",
    slug: "agent-workflow",
    titleKey: "handbook.categories.agent-workflow.title",
    descriptionKey: "handbook.categories.agent-workflow.description",
  },
  topics: [
    {
      id: "agent-workflow-implementation",
      categoryId: "agent-workflow",
      slug: "implementation",
      titleKey: "handbook.topics.agent-workflow-implementation.title",
      descriptionKey: "handbook.topics.agent-workflow-implementation.description",
    },
  ],
  articles: [
    {
      id: "agent-workflow-implementation-owner-first-change",
      topicId: "agent-workflow-implementation",
      slug: "owner-first-change",
      contentPath: "agent-workflow/implementation/owner-first-change",
      titleKey: "handbook.articles.agent-workflow-implementation-owner-first-change.title",
      descriptionKey: "handbook.articles.agent-workflow-implementation-owner-first-change.description",
      implementation: "mixed",
      size: "large",
      sources: [
        {
          project: "vireocode-web-app-starter",
          revision: "7c2264746bd6d6c3fc00e373778831943666592b",
          path: "AGENTS.md",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "7c2264746bd6d6c3fc00e373778831943666592b",
          path: "frontend/AGENTS.md",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "7c2264746bd6d6c3fc00e373778831943666592b",
          path: "frontend/.agents/skills/app-route-pages/SKILL.md",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "7c2264746bd6d6c3fc00e373778831943666592b",
          path: "frontend/.agents/skills/app-shell-navigation/SKILL.md",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "7c2264746bd6d6c3fc00e373778831943666592b",
          path: "frontend/docs/architecture/en/source-map-and-ownership.md",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "7c2264746bd6d6c3fc00e373778831943666592b",
          path: "frontend/docs/architecture/en/dependency-boundaries-and-imports.md",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "7c2264746bd6d6c3fc00e373778831943666592b",
          path: "frontend/docs/architecture/en/route-entries-and-feature-composition.md",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "7c2264746bd6d6c3fc00e373778831943666592b",
          path: "frontend/docs/architecture/en/add-change-or-remove-a-feature.md",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "7c2264746bd6d6c3fc00e373778831943666592b",
          path: "frontend/docs/architecture/en/tests-mocks-stories-and-architecture-checks.md",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "7c2264746bd6d6c3fc00e373778831943666592b",
          path: "frontend/package.json",
        },
      ],
    },
    {
      id: "agent-workflow-implementation-bounded-task-and-decision-contract",
      topicId: "agent-workflow-implementation",
      slug: "bounded-task-and-decision-contract",
      contentPath: "agent-workflow/implementation/bounded-task-and-decision-contract",
      titleKey: "handbook.articles.agent-workflow-implementation-bounded-task-and-decision-contract.title",
      descriptionKey: "handbook.articles.agent-workflow-implementation-bounded-task-and-decision-contract.description",
      implementation: "mixed",
      size: "medium",
      sources: [
        {
          project: "vireocode-web-app-starter",
          path: "docs/v1-workflow.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: ".agents/skills/discovery-specification/references/specification-contract.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: ".agents/skills/discovery-specification/SKILL.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: ".agents/skills/discovery-specification/scripts/validate-package.mjs",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "AGENTS.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
      ],
      relatedArticleIds: [
        "agent-workflow-implementation-owner-first-change",
        "agent-workflow-implementation-initialization-to-business-acceptance",
      ],
    },
    {
      id: "agent-workflow-implementation-capability-owners-and-review-boundaries",
      topicId: "agent-workflow-implementation",
      slug: "capability-owners-and-review-boundaries",
      contentPath: "agent-workflow/implementation/capability-owners-and-review-boundaries",
      titleKey: "handbook.articles.agent-workflow-implementation-capability-owners-and-review-boundaries.title",
      descriptionKey:
        "handbook.articles.agent-workflow-implementation-capability-owners-and-review-boundaries.description",
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
          project: "vireocode-web-app-starter",
          path: "frontend/docs/architecture/en/add-change-or-remove-a-feature.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/docs/architecture/en/tests-mocks-stories-and-architecture-checks.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/.agents/skills/app-route-pages/SKILL.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/.agents/skills/app-shell-navigation/SKILL.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
      ],
      relatedArticleIds: [
        "agent-workflow-implementation-owner-first-change",
        "agent-workflow-implementation-incremental-reviewable-delivery",
      ],
    },
    {
      id: "agent-workflow-implementation-incremental-reviewable-delivery",
      topicId: "agent-workflow-implementation",
      slug: "incremental-reviewable-delivery",
      contentPath: "agent-workflow/implementation/incremental-reviewable-delivery",
      titleKey: "handbook.articles.agent-workflow-implementation-incremental-reviewable-delivery.title",
      descriptionKey: "handbook.articles.agent-workflow-implementation-incremental-reviewable-delivery.description",
      implementation: "mixed",
      size: "medium",
      sources: [
        {
          project: "vireocode-web-app-starter",
          path: "docs/v1-workflow.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: ".agents/skills/discovery-specification/references/specification-contract.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/docs/architecture/en/add-change-or-remove-a-feature.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/docs/architecture/en/tests-mocks-stories-and-architecture-checks.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "infrastructure/release/README.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "AGENTS.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
      ],
      relatedArticleIds: [
        "agent-workflow-implementation-source-bound-evidence-and-handoff",
        "ci-pipelines-required-gates-and-main-protection",
      ],
    },
    {
      id: "agent-workflow-implementation-source-bound-evidence-and-handoff",
      topicId: "agent-workflow-implementation",
      slug: "source-bound-evidence-and-handoff",
      contentPath: "agent-workflow/implementation/source-bound-evidence-and-handoff",
      titleKey: "handbook.articles.agent-workflow-implementation-source-bound-evidence-and-handoff.title",
      descriptionKey: "handbook.articles.agent-workflow-implementation-source-bound-evidence-and-handoff.description",
      implementation: "mixed",
      size: "medium",
      sources: [
        {
          project: "vireocode-web-app-starter",
          path: "docs/v1-workflow.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: ".agents/skills/discovery-specification/references/export-contract.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: ".agents/skills/discovery-specification/references/specification-contract.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: ".agents/skills/discovery-specification/scripts/prepare-output.mjs",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "infrastructure/ci/test_shards.py",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "infrastructure/release/README.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/docs/architecture/en/tests-mocks-stories-and-architecture-checks.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
      ],
      relatedArticleIds: [
        "developer-workflow-verification-verification-selection-and-evidence",
        "delivery-releases-staging-and-production-promotion",
      ],
    },
    {
      id: "agent-workflow-implementation-initialization-to-business-acceptance",
      topicId: "agent-workflow-implementation",
      slug: "initialization-to-business-acceptance",
      contentPath: "agent-workflow/implementation/initialization-to-business-acceptance",
      titleKey: "handbook.articles.agent-workflow-implementation-initialization-to-business-acceptance.title",
      descriptionKey:
        "handbook.articles.agent-workflow-implementation-initialization-to-business-acceptance.description",
      implementation: "mixed",
      size: "large",
      sources: [
        {
          project: "vireocode-web-app-starter",
          path: "docs/v1-workflow.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "AGENTS.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: ".agents/skills/initialize-project/references/contract.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: ".agents/skills/initialize-project/references/project-status.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: ".agents/skills/discovery-specification/references/export-contract.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: ".agents/skills/discovery-specification/references/specification-contract.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: ".agents/skills/discovery-specification/SKILL.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
        {
          project: "vireocode-web-app-starter",
          path: "infrastructure/release/README.md",
          revision: "ffa585acff758020fc7e82e501e35e50876b5316",
        },
      ],
      relatedArticleIds: [
        "agent-workflow-implementation-bounded-task-and-decision-contract",
        "backend-security-account-provisioning",
        "delivery-releases-staging-and-production-promotion",
      ],
    },
  ],
} as const satisfies HandbookCategoryCatalog;
