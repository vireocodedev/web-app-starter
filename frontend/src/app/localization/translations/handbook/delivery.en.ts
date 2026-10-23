export const englishDeliveryHandbookTranslations = {
  categories: {
    delivery: {
      title: "Delivery and operations",
      description: "Immutable releases, environment promotion, migrations, and recovery.",
    },
  },
  topics: {
    "delivery-artifacts": {
      title: "Runnable artifacts",
      description: "Build environment-neutral images and verify the actual artifacts under runtime restrictions.",
    },
    "delivery-releases": {
      title: "Releases and promotion",
      description: "Build one immutable pair and promote the accepted artifacts.",
    },
    "delivery-recovery": {
      title: "Migration and recovery",
      description: "Preserve data and reconcile the exact failure boundary.",
    },
  },
  articles: {
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
    "delivery-artifacts-frontend-image-contract": {
      title: "Build a frontend image that can move between environments",
      description:
        "Keep same-origin public configuration, SPA/API/asset failure semantics, immutable asset caching and restricted Nginx runtime in one image.",
    },
    "delivery-artifacts-backend-image-contract": {
      title: "Separate backend compilation from restricted runtime",
      description:
        "Compile with the declared JDK, run a non-root JRE jar and inject protected database configuration without conflating builds, tests or live acceptance.",
    },
    "delivery-artifacts-runtime-smoke-evidence": {
      title: "Verify the produced image under its runtime restrictions",
      description:
        "Exercise actual image startup, API and provisioning boundaries with disposable resources and exact-name cleanup, while stating evidence limits.",
    },
    "delivery-releases-build-publish-request-boundaries": {
      title: "Give build, publication and deployment request different authority",
      description:
        "Separate untrusted application builds, fresh-worker registry publication and encrypted fixed-contract host requests.",
    },
  },
} as const;
