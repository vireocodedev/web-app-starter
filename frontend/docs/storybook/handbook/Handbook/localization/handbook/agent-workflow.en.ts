export const englishAgentWorkflowHandbookTranslations = {
  categories: {
    "agent-workflow": {
      title: "AI-agent workflow",
      description: "Find the owner, implement a bounded task, and deliver evidence.",
    },
  },
  topics: {
    "agent-workflow-implementation": {
      title: "Implementation workflow",
      description: "Choose the owner and public seam before changing behavior.",
    },
  },
  articles: {
    "agent-workflow-implementation-owner-first-change": {
      title: "Find the owner before editing",
      description:
        "Turn a requested outcome into an owner-aware bounded change with explicit evidence labels, public seams, authorized verification and separately authorized delivery.",
    },
    "agent-workflow-implementation-bounded-task-and-decision-contract": {
      title: "Claim one bounded outcome and preserve its decision gates",
      description:
        "Define acceptance, ownership and source-backed decision blockers for one coherent task without treating proposals or review readiness as coding approval.",
    },
    "agent-workflow-implementation-capability-owners-and-review-boundaries": {
      title: "Put each change behind the capability that owns its contract",
      description:
        "Choose public seams and review scope by behavior, lifetime and dependency direction while keeping shared integration ownership explicit.",
    },
    "agent-workflow-implementation-incremental-reviewable-delivery": {
      title: "Deliver a coherent increment with a truthful review record",
      description:
        "Preserve task-owned source and evidence through scoped checkpoints, keeping commit, push, PR, merge and deployment as distinct outcomes.",
    },
    "agent-workflow-implementation-source-bound-evidence-and-handoff": {
      title: "Bind each completion claim to its source and evidence layer",
      description:
        "Separate source hashes, run/attempt proof, immutable artifacts, live acceptance and implementation state in an honest resumable handoff.",
    },
    "agent-workflow-implementation-initialization-to-business-acceptance": {
      title: "Separate setup readiness from accepted business V1",
      description:
        "Follow numbered manual setup steps, then establish business scope, implementation and acceptance of the exact deployed image pair.",
    },
  },
} as const;
