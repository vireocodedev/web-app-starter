import type {
  HandbookArticleDefinition,
  HandbookCategoryDefinition,
  HandbookTopicDefinition,
} from "../types/HandbookArticle";

/** Ordered content inventory; router composition owns destinations and route policy. */
export const handbookCategories = [
  {
    id: "backend",
    slug: "backend",
    titleKey: "handbook.categories.backend.title",
    descriptionKey: "handbook.categories.backend.description",
  },
  {
    id: "ci",
    slug: "ci",
    titleKey: "handbook.categories.ci.title",
    descriptionKey: "handbook.categories.ci.description",
  },
  {
    id: "delivery",
    slug: "delivery",
    titleKey: "handbook.categories.delivery.title",
    descriptionKey: "handbook.categories.delivery.description",
  },
  {
    id: "developer-workflow",
    slug: "developer-workflow",
    titleKey: "handbook.categories.developer-workflow.title",
    descriptionKey: "handbook.categories.developer-workflow.description",
  },
  {
    id: "agent-workflow",
    slug: "agent-workflow",
    titleKey: "handbook.categories.agent-workflow.title",
    descriptionKey: "handbook.categories.agent-workflow.description",
  },
] as const satisfies readonly HandbookCategoryDefinition[];

export const handbookTopics = [
  {
    id: "backend-foundation",
    categoryId: "backend",
    slug: "foundation",
    titleKey: "handbook.topics.backend-foundation.title",
    descriptionKey: "handbook.topics.backend-foundation.description",
  },
  {
    id: "backend-security",
    categoryId: "backend",
    slug: "security",
    titleKey: "handbook.topics.backend-security.title",
    descriptionKey: "handbook.topics.backend-security.description",
  },
  {
    id: "backend-data",
    categoryId: "backend",
    slug: "data",
    titleKey: "handbook.topics.backend-data.title",
    descriptionKey: "handbook.topics.backend-data.description",
  },
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
  {
    id: "developer-workflow-local-development",
    categoryId: "developer-workflow",
    slug: "local-development",
    titleKey: "handbook.topics.developer-workflow-local-development.title",
    descriptionKey: "handbook.topics.developer-workflow-local-development.description",
  },
  {
    id: "agent-workflow-implementation",
    categoryId: "agent-workflow",
    slug: "implementation",
    titleKey: "handbook.topics.agent-workflow-implementation.title",
    descriptionKey: "handbook.topics.agent-workflow-implementation.description",
  },
] as const satisfies readonly HandbookTopicDefinition[];

export const handbookArticles = [
  {
    id: "backend-foundation-runtime-and-configuration",
    topicId: "backend-foundation",
    slug: "runtime-and-configuration",
    contentPath: "backend/foundation/runtime-and-configuration",
    titleKey: "handbook.articles.backend-foundation-runtime-and-configuration.title",
    descriptionKey: "handbook.articles.backend-foundation-runtime-and-configuration.description",
    implementation: "starter",
    size: "medium",
    sources: [
      {
        project: "vireocode-web-app-starter",
        revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        path: "backend/build.gradle",
      },
      {
        project: "vireocode-web-app-starter",
        revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        path: "backend/src/main/resources/application.yaml",
      },
      {
        project: "vireocode-web-app-starter",
        revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        path: "backend/src/main/resources/application-local.yaml",
      },
      {
        project: "vireocode-web-app-starter",
        revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        path: "backend/src/main/resources/application-provision-user.yaml",
      },
      {
        project: "vireocode-web-app-starter",
        revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        path: "README.md",
      },
    ],
  },
  {
    id: "backend-foundation-http-service-persistence-boundaries",
    topicId: "backend-foundation",
    slug: "http-service-persistence-boundaries",
    contentPath: "backend/foundation/http-service-persistence-boundaries",
    titleKey: "handbook.articles.backend-foundation-http-service-persistence-boundaries.title",
    descriptionKey: "handbook.articles.backend-foundation-http-service-persistence-boundaries.description",
    implementation: "mixed",
    size: "large",
    sources: [
      {
        project: "vireocode-web-app-starter",
        revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        path: "backend/src/main/java/com/vireocode/backend/auth/AuthController.java",
      },
      {
        project: "vireocode-web-app-starter",
        revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        path: "backend/src/main/java/com/vireocode/backend/user/AppUser.java",
      },
      {
        project: "vireocode-web-app-starter",
        revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        path: "backend/src/main/java/com/vireocode/backend/user/AppUserRepository.java",
      },
      {
        project: "client-discovery-app",
        revision: "df1feaef58d52e7e07c12a736aed607e64d7918c",
        path: "backend/src/main/java/com/vireocode/clientdiscovery/discovery/DiscoveryService.java",
      },
      {
        project: "client-discovery-app",
        revision: "df1feaef58d52e7e07c12a736aed607e64d7918c",
        path: "backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectFilesService.java",
      },
    ],
  },
  {
    id: "backend-foundation-validation-and-error-contracts",
    topicId: "backend-foundation",
    slug: "validation-and-error-contracts",
    contentPath: "backend/foundation/validation-and-error-contracts",
    titleKey: "handbook.articles.backend-foundation-validation-and-error-contracts.title",
    descriptionKey: "handbook.articles.backend-foundation-validation-and-error-contracts.description",
    implementation: "mixed",
    size: "large",
    sources: [
      {
        project: "vireocode-web-app-starter",
        revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        path: "backend/src/main/java/com/vireocode/backend/auth/AuthController.java",
      },
      {
        project: "vireocode-web-app-starter",
        revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        path: "backend/src/main/java/com/vireocode/backend/auth/AuthExceptionHandler.java",
      },
      {
        project: "vireocode-web-app-starter",
        revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        path: "backend/src/main/java/com/vireocode/backend/auth/SecurityConfiguration.java",
      },
      {
        project: "vireocode-web-app-starter",
        revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        path: "backend/src/main/java/com/vireocode/backend/user/LocalUserProperties.java",
      },
      {
        project: "LMS/lms-back",
        revision: "6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee",
        path: "src/main/java/hr/rgo/lms/core/RestResponseEntityExceptionHandler.java",
      },
      {
        project: "LMS/lms-back",
        revision: "6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee",
        path: "src/main/java/hr/rgo/lms/core/ErrorResponse.java",
      },
    ],
  },
  {
    id: "backend-security-session-and-csrf-lifecycle",
    topicId: "backend-security",
    slug: "session-and-csrf-lifecycle",
    contentPath: "backend/security/session-and-csrf-lifecycle",
    titleKey: "handbook.articles.backend-security-session-and-csrf-lifecycle.title",
    descriptionKey: "handbook.articles.backend-security-session-and-csrf-lifecycle.description",
    implementation: "starter",
    size: "large",
    sources: [
      {
        project: "vireocode-web-app-starter",
        revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        path: "backend/src/main/java/com/vireocode/backend/auth/SecurityConfiguration.java",
      },
      {
        project: "vireocode-web-app-starter",
        revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        path: "backend/src/main/java/com/vireocode/backend/auth/AuthController.java",
      },
      {
        project: "vireocode-web-app-starter",
        revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        path: "backend/src/main/java/com/vireocode/backend/auth/AuthExceptionHandler.java",
      },
      {
        project: "vireocode-web-app-starter",
        revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        path: "backend/src/main/resources/application.yaml",
      },
      {
        project: "vireocode-web-app-starter",
        revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        path: "backend/src/main/resources/db/migration/V2__create_sessions.sql",
      },
    ],
  },
  {
    id: "backend-security-account-provisioning",
    topicId: "backend-security",
    slug: "account-provisioning",
    contentPath: "backend/security/account-provisioning",
    titleKey: "handbook.articles.backend-security-account-provisioning.title",
    descriptionKey: "handbook.articles.backend-security-account-provisioning.description",
    implementation: "starter",
    size: "large",
    sources: [
      {
        project: "vireocode-web-app-starter",
        revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        path: "backend/src/main/java/com/vireocode/backend/BackendApplication.java",
      },
      {
        project: "vireocode-web-app-starter",
        revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        path: "backend/src/main/java/com/vireocode/backend/user/ProvisionUserRunner.java",
      },
      {
        project: "vireocode-web-app-starter",
        revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        path: "backend/src/main/java/com/vireocode/backend/user/LocalUserInitializer.java",
      },
      {
        project: "vireocode-web-app-starter",
        revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        path: "backend/src/main/java/com/vireocode/backend/user/LocalUserProperties.java",
      },
      {
        project: "vireocode-web-app-starter",
        revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        path: "backend/scripts/setup-local.mjs",
      },
      {
        project: "vireocode-web-app-starter",
        revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        path: "infrastructure/release/README.md",
      },
    ],
  },
  {
    id: "backend-data-flyway-and-schema-ownership",
    topicId: "backend-data",
    slug: "flyway-and-schema-ownership",
    contentPath: "backend/data/flyway-and-schema-ownership",
    titleKey: "handbook.articles.backend-data-flyway-and-schema-ownership.title",
    descriptionKey: "handbook.articles.backend-data-flyway-and-schema-ownership.description",
    implementation: "mixed",
    size: "large",
    sources: [
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
      {
        project: "vireocode-web-app-starter",
        revision: "785de22420b7ec42c15373522b324f4319b4dfd8",
        path: "backend/src/main/java/com/vireocode/backend/user/AppUser.java",
      },
      {
        project: "client-discovery-app",
        revision: "df1feaef58d52e7e07c12a736aed607e64d7918c",
        path: "backend/src/main/resources/db/migration/V10__specification_development.sql",
      },
    ],
  },
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
] as const satisfies readonly HandbookArticleDefinition[];

export type HandbookCategoryId = (typeof handbookCategories)[number]["id"];
export type HandbookTopicId = (typeof handbookTopics)[number]["id"];
export type HandbookArticleId = (typeof handbookArticles)[number]["id"];

export function handbookArticle(id: HandbookArticleId): HandbookArticleDefinition {
  const article = handbookArticles.find(candidate => candidate.id === id);
  if (!article) throw new Error(`Unknown handbook article: ${id}`);
  return article;
}
