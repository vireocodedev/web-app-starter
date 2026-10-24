const frontendGuide = "frontend/docs/architecture/en/feature-anatomy-filenames-and-public-interfaces.md";
const backendGuide = "frontend/docs/development-guide/en/backend/foundation/http-service-persistence-boundaries.md";

// This catalog is also the machine interface. Runtime source stays in templates/.
export const generators = [
  {
    id: "frontend/api",
    target: "frontend",
    kind: "api",
    purpose: "Validated scalar HTTP read API, port, scoped Query keys/options and contract tests",
    visual: false,
    output: "models/<Name>.ts, api/<name>.api.ts, .api.http.ts, .query.ts, .querykeys.ts, index.ts, contract tests",
    inputs: { required: ["name"], optional: ["feature", "fields"] },
    guide: "frontend/docs/architecture/en/apis-models-queries-and-mutations.md",
    reference:
      "client-discovery-app@9fcbf2f17a09329333c3d53c7a3750c48fc1db52:frontend/src/features/paid-discovery/api/paidDiscovery.api.http.ts",
    limitations:
      "Read by UUID only; runtime wiring and auth cache cleanup remain caller-owned. Optional scalars accept explicit null; no write/paging policy inferred.",
  },
  ...[
    ["component", "Localized presentational component with a callback", "components/<Name>.tsx"],
    [
      "form",
      "Typed create/update text form, localized Zod validation and lifecycle",
      "components/<Name>Form.tsx, models/<Name>.ts",
    ],
    ["shell", "Responsive feature layout with header, sidebar and content slots", "components/<Name>Shell.tsx"],
    [
      "table",
      "Client-owned bounded collection, filtering and pagination",
      "components/<Name>Table.tsx, models/<Name>.ts",
    ],
    [
      "page",
      "Thin page adapter over a public presentational feature",
      "src/pages/<feature>/<Name>Page.tsx, components/<Name>.tsx",
    ],
    [
      "feature",
      "Composed form/table UI with caller-owned rows and writes",
      "components/<Name>Feature.tsx, form, table, models",
    ],
  ].map(([kind, purpose, output]) => ({
    id: `frontend/${kind}`,
    target: "frontend",
    kind,
    purpose,
    visual: true,
    output,
    inputs: { required: ["name"], optional: ["feature", "fields (text only)"] },
    guide: frontendGuide,
    reference:
      "client-discovery-app@9fcbf2f17a09329333c3d53c7a3750c48fc1db52:frontend/src/features/sales/components/LeadForm.tsx",
    limitations:
      "New feature owner only; visual preview auto-registered; no production route or persistence policy inferred.",
  })),
  ...[
    ["dto", "Validated request or typed response record", "<Name>Request.java or <Name>Response.java", []],
    [
      "domain",
      "JPA entity and matching forward Flyway migration",
      "<Name>.java, V<version>__create_<table>.sql",
      ["migration"],
    ],
    ["repository", "JpaRepository for an existing compatible feature entity", "<Name>Repository.java", []],
    [
      "service",
      "Read-only query service and explicit response mapping",
      "<Name>Service.java, <Name>Response.java, service tests",
      [],
    ],
    ["controller", "GET controller over an existing read-only query service", "<Name>Controller.java", []],
    [
      "feature",
      "Complete shared-authenticated read-only persistence/HTTP feature",
      "entity, migration, repository, service, response, controller, unit and HTTP/database tests",
      ["migration"],
    ],
  ].map(([kind, purpose, output, required]) => ({
    id: `backend/${kind}`,
    target: "backend",
    kind,
    purpose,
    visual: false,
    output,
    inputs: {
      required: ["name", ...required],
      optional: ["feature", "fields", ...(kind === "dto" ? ["variant"] : [])],
    },
    guide: backendGuide,
    reference:
      "client-discovery-app@9fcbf2f17a09329333c3d53c7a3750c48fc1db52:backend/src/main/java/com/vireocode/clientdiscovery/user/AppUser.java",
    limitations:
      "Flat feature package; scalars only; no generated write endpoints, tenant authorization or relationships. Repository/service/controller require compatible existing domain prerequisites.",
  })),
];

export function findGenerator(target, kind) {
  const generator = generators.find(item => item.target === target && item.kind === kind);
  if (!generator) throw new Error(`Unknown generator ${target}/${kind}. Run generate --list.`);
  return generator;
}
