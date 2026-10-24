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
    "delivery-operations": {
      title: "Host operations",
      description:
        "Keep trusted host handoff, environment isolation, diagnostics, and explicit provisioning tied to source-bound evidence.",
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
    "delivery-operations-encrypted-host-handoff": {
      title: "Send an encrypted ticket to fixed trusted host code",
      description:
        "Authenticate a ciphertext-only fixed-contract request independently of encryption, then execute protected installed host code.",
    },
    "delivery-operations-environment-and-database-isolation": {
      title: "Separate environment identity from application replacement",
      description:
        "Give each environment distinct protected configuration and persistent database resources while app releases replace only their immutable pair.",
    },
    "delivery-recovery-durable-backup-artifacts": {
      title: "A backup is complete only after durable verification",
      description:
        "Publish a protected dump and metadata only through archive, checksum and directory-durability checks; state retention and server-loss limits.",
    },
    "delivery-recovery-isolated-restore-rehearsal": {
      title: "Rehearse recovery from the retrieved copy in isolation",
      description:
        "Restore the exact retrieved verified backup into task-owned isolated PostgreSQL and inspect initialized evidence without touching live data.",
    },
    "delivery-recovery-reconcile-uncertain-releases": {
      title: "Reconcile an uncertain release before retrying mutation",
      description:
        "Relate exact request and transaction evidence to actual images, schema and public state before any retry or data-loss decision.",
    },
    "delivery-operations-health-and-diagnostic-evidence": {
      title: "Diagnose availability, identity and behavior as separate evidence",
      description:
        "Use layered health and identity probes with targeted credential-free diagnostics without conflating infrastructure health and business acceptance.",
    },
    "delivery-operations-provisioning-after-deployment": {
      title: "Provision the initial identity as a separate post-deployment command",
      description:
        "Use the accepted backend digest and separate protected inputs for explicit account creation that preserves matching repeats and rejects conflicts.",
    },
  },
} as const;
