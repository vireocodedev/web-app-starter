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
  ],
} as const satisfies HandbookCategoryCatalog;
