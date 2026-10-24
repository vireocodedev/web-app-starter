export const englishCiHandbookTranslations = {
  categories: {
    ci: {
      title: "Continuous integration",
      description: "Owner-scoped verification, complete evidence, and isolated workers.",
    },
  },
  topics: {
    "ci-pipelines": {
      title: "Pipelines and gates",
      description: "Select relevant lanes while preserving the required result.",
    },
    "ci-verification": {
      title: "Verification evidence",
      description: "Prove complete execution against the correct source and run.",
    },
    "ci-isolation": {
      title: "Worker isolation",
      description: "Separate untrusted job execution from privileged host ownership.",
    },
    "ci-package-verification": {
      title: "Package verification",
      description: "Verify published artifact boundaries and actual consumer type/runtime resolution.",
    },
  },
  articles: {
    "ci-pipelines-owner-scoped-checks": {
      title: "Select verification by owner and always report the gate",
      description:
        "Route monorepo checks by owner while preserving portable verification and an always-reporting required gate.",
    },
    "ci-verification-complete-shard-evidence": {
      title: "Prove complete execution across test shards",
      description:
        "Prove complete frontend file and backend class membership with SHA/run/attempt-bound reports; independently compare backend testcase inventory and validate frontend reported assertions/counts.",
    },
    "ci-isolation-disposable-worker-boundary": {
      title: "Treat the disposable worker as a verified trust boundary",
      description:
        "Separate PR execution from host authority with fresh workers, bounded resources and source-bound lifecycle evidence.",
    },
    "ci-pipelines-required-gates-and-main-protection": {
      title: "Bind the required gate to the policy that produced it",
      description:
        "Bind CI gate to its trusted source App and verify effective, current main protection separately from workflow source.",
    },
    "ci-pipelines-pinned-toolchains-and-actions": {
      title: "Select declared application toolchains inside the job",
      description:
        "Separate application toolchain declarations, exact package-manager selection, dependency locks, Action commits and disposable worker baselines.",
    },
    "ci-verification-resource-budgets": {
      title: "Budget concurrency at every execution layer",
      description:
        "Coordinate pool slots, parent job limits, nested tool workers, storage and deadlines while preserving verification coverage.",
    },
    "ci-verification-phase-deadlines-and-process-cleanup": {
      title: "Keep original phase deadlines and own process cleanup",
      description:
        "Reference recipe for setup-inclusive phase budgets, retained PGID ownership, bounded cleanup and failure-preserving utility aggregation.",
    },
    "ci-package-verification-anonymous-consumer-artifact-checks": {
      title: "Prove public consumption without maintainer credentials or workspace links",
      description:
        "Separate packed local-peer checks from exact anonymous public installs and isolate privileged attestation verification from consumer execution.",
    },
    "ci-package-verification-type-resolution-and-runtime-entrypoints": {
      title: "Verify emitted types and runtime entrypoints from the consumer side",
      description:
        "Validate packed exports, declaration resolution and runtime behavior while distinguishing RGO skipLibCheck limits from the Vireo strict-dist reference.",
    },
  },
} as const;
