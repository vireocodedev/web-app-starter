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
  ],
} as const satisfies HandbookCategoryCatalog;
