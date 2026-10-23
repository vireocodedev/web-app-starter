import type { HandbookCategoryCatalog } from "../types/HandbookArticle.ts";

export const deliveryHandbookCatalog = {
  category: {
    id: "delivery",
    slug: "delivery",
    titleKey: "handbook.categories.delivery.title",
    descriptionKey: "handbook.categories.delivery.description",
  },
  topics: [
    {
      id: "delivery-artifacts",
      categoryId: "delivery",
      slug: "artifacts",
      titleKey: "handbook.topics.delivery-artifacts.title",
      descriptionKey: "handbook.topics.delivery-artifacts.description",
    },
    {
      id: "delivery-releases",
      categoryId: "delivery",
      slug: "releases",
      titleKey: "handbook.topics.delivery-releases.title",
      descriptionKey: "handbook.topics.delivery-releases.description",
    },
    {
      id: "delivery-recovery",
      categoryId: "delivery",
      slug: "recovery",
      titleKey: "handbook.topics.delivery-recovery.title",
      descriptionKey: "handbook.topics.delivery-recovery.description",
    },
  ],
  articles: [
    {
      id: "delivery-releases-immutable-image-pairs",
      topicId: "delivery-releases",
      slug: "immutable-image-pairs",
      contentPath: "delivery/releases/immutable-image-pairs",
      titleKey: "handbook.articles.delivery-releases-immutable-image-pairs.title",
      descriptionKey: "handbook.articles.delivery-releases-immutable-image-pairs.description",
      implementation: "starter",
      size: "large",
      sources: [
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "infrastructure/release/README.md",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "infrastructure/release/protocol.py",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "infrastructure/release/client.py",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "infrastructure/release/runtime.py",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "infrastructure/release/smoke_images.py",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "frontend/Dockerfile",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "backend/Dockerfile",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "frontend/nginx.conf",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "frontend/.dockerignore",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "backend/.dockerignore",
        },
      ],
    },
    {
      id: "delivery-releases-staging-and-production-promotion",
      topicId: "delivery-releases",
      slug: "staging-and-production-promotion",
      contentPath: "delivery/releases/staging-and-production-promotion",
      titleKey: "handbook.articles.delivery-releases-staging-and-production-promotion.title",
      descriptionKey: "handbook.articles.delivery-releases-staging-and-production-promotion.description",
      implementation: "starter",
      size: "large",
      sources: [
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: ".github/workflows/deploy-staging.yaml",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: ".github/workflows/deploy-production.yaml",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "infrastructure/release/client.py",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "infrastructure/release/controller.py",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "infrastructure/release/protocol.py",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "infrastructure/release/README.md",
        },
      ],
    },
    {
      id: "delivery-recovery-migration-failure-boundaries",
      topicId: "delivery-recovery",
      slug: "migration-failure-boundaries",
      contentPath: "delivery/recovery/migration-failure-boundaries",
      titleKey: "handbook.articles.delivery-recovery-migration-failure-boundaries.title",
      descriptionKey: "handbook.articles.delivery-recovery-migration-failure-boundaries.description",
      implementation: "starter",
      size: "large",
      sources: [
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "infrastructure/release/runtime.py",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "infrastructure/release/controller.py",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "infrastructure/release/README.md",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "backend/src/main/resources/application.yaml",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "backend/src/main/resources/db/migration/V1__create_users.sql",
        },
        {
          project: "vireocode-web-app-starter",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
          path: "backend/src/main/resources/db/migration/V2__create_sessions.sql",
        },
      ],
    },
    {
      id: "delivery-artifacts-frontend-image-contract",
      topicId: "delivery-artifacts",
      slug: "frontend-image-contract",
      contentPath: "delivery/artifacts/frontend-image-contract",
      titleKey: "handbook.articles.delivery-artifacts-frontend-image-contract.title",
      descriptionKey: "handbook.articles.delivery-artifacts-frontend-image-contract.description",
      implementation: "starter",
      size: "large",
      sources: [
        {
          project: "vireocode-web-app-starter",
          path: "frontend/Dockerfile",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/nginx.conf",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/.dockerignore",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/vite.config.ts",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/src/main.tsx",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/src/app/router/routeRegistry.tsx",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "infrastructure/release/runtime.py",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "infrastructure/release/README.md",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
      ],
      relatedArticleIds: ["delivery-artifacts-runtime-smoke-evidence", "delivery-releases-immutable-image-pairs"],
    },
    {
      id: "delivery-artifacts-backend-image-contract",
      topicId: "delivery-artifacts",
      slug: "backend-image-contract",
      contentPath: "delivery/artifacts/backend-image-contract",
      titleKey: "handbook.articles.delivery-artifacts-backend-image-contract.title",
      descriptionKey: "handbook.articles.delivery-artifacts-backend-image-contract.description",
      implementation: "starter",
      size: "large",
      sources: [
        {
          project: "vireocode-web-app-starter",
          path: "backend/Dockerfile",
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
          path: "backend/.dockerignore",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "backend/src/main/resources/application.yaml",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "infrastructure/release/runtime.py",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "infrastructure/release/smoke_images.py",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "infrastructure/release/README.md",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
      ],
      relatedArticleIds: ["delivery-artifacts-runtime-smoke-evidence", "backend-foundation-runtime-and-configuration"],
    },
    {
      id: "delivery-artifacts-runtime-smoke-evidence",
      topicId: "delivery-artifacts",
      slug: "runtime-smoke-evidence",
      contentPath: "delivery/artifacts/runtime-smoke-evidence",
      titleKey: "handbook.articles.delivery-artifacts-runtime-smoke-evidence.title",
      descriptionKey: "handbook.articles.delivery-artifacts-runtime-smoke-evidence.description",
      implementation: "starter",
      size: "large",
      sources: [
        {
          project: "vireocode-web-app-starter",
          path: "infrastructure/release/smoke_images.py",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "infrastructure/release/runtime.py",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "infrastructure/release/protocol.py",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "infrastructure/release/README.md",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "frontend/Dockerfile",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "backend/Dockerfile",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
      ],
      relatedArticleIds: [
        "delivery-artifacts-frontend-image-contract",
        "delivery-artifacts-backend-image-contract",
        "delivery-releases-build-publish-request-boundaries",
      ],
    },
    {
      id: "delivery-releases-build-publish-request-boundaries",
      topicId: "delivery-releases",
      slug: "build-publish-request-boundaries",
      contentPath: "delivery/releases/build-publish-request-boundaries",
      titleKey: "handbook.articles.delivery-releases-build-publish-request-boundaries.title",
      descriptionKey: "handbook.articles.delivery-releases-build-publish-request-boundaries.description",
      implementation: "starter",
      size: "large",
      sources: [
        {
          project: "vireocode-web-app-starter",
          path: ".github/workflows/deploy-staging.yaml",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: ".github/workflows/deploy-production.yaml",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "infrastructure/release/client.py",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "infrastructure/release/protocol.py",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "infrastructure/release/controller.py",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "infrastructure/release/runtime.py",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
        {
          project: "vireocode-web-app-starter",
          path: "infrastructure/release/README.md",
          revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        },
      ],
      relatedArticleIds: [
        "delivery-releases-staging-and-production-promotion",
        "ci-isolation-disposable-worker-boundary",
      ],
    },
  ],
} as const satisfies HandbookCategoryCatalog;
