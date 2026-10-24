export const englishDeveloperWorkflowHandbookTranslations = {
  categories: {
    "developer-workflow": {
      title: "Developer workflow",
      description: "Local runtimes, debugging, verification, and everyday implementation.",
    },
  },
  topics: {
    "developer-workflow-local-development": {
      title: "Local development",
      description: "Start the intended runtimes and preserve existing local state.",
    },
    "developer-verification": {
      title: "Verification workflow",
      description:
        "Select authorized checks, serialize expensive work, and report source-bound evidence and omissions.",
    },
  },
  articles: {
    "developer-workflow-local-development-workspace-runtimes": {
      title: "One workspace, two runtimes",
      description:
        "Launch the Java and Node sides through their declared runtimes and ordered VS Code helpers while preserving database identity, credentials, volumes and same-origin sessions.",
    },
    "developer-workflow-local-development-vscode-launch-contract": {
      title: "Diagnose the VS Code launch contract in dependency order",
      description:
        "Trace the real pre-launch chain, desktop toolchain selection and independent debugger/database lifetimes before changing configuration.",
    },
    "developer-workflow-local-development-parallel-checkouts-and-database-identity": {
      title: "Give parallel checkouts explicit database identity",
      description:
        "Separate free loopback ports, Compose namespace, persistent credentials and browser identity without deleting another checkout's data.",
    },
    "developer-workflow-local-development-same-origin-session-debugging": {
      title: "Debug the session through one browser origin",
      description:
        "Locate proxy, cookie, account and CSRF failures through the installed real HTTP session sequence while preserving security boundaries.",
    },
    "developer-workflow-verification-verification-selection-and-evidence": {
      title: "Select verification by changed contract and report its limits",
      description:
        "Read actual scripts, select authorized contract-relevant evidence and report candidate identity, failures and omissions honestly.",
    },
  },
} as const;
