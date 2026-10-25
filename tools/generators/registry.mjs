const frontendGuide = "frontend/docs/architecture/en/feature-anatomy-filenames-and-public-interfaces.md";
const backendGuide = "frontend/docs/development-guide/en/backend/foundation/http-service-persistence-boundaries.md";
const richFieldTypes = ["string", "multiline", "integer", "number", "boolean", "date", "select", "autocomplete"];
const richSampleFields =
  "title,notes:multiline?,quantity:integer?,budget:number?,active:boolean,dueOn:date?,status:select,owner:autocomplete?";
const componentRecipes = [
  [
    "entity-picker",
    "Entity picker",
    "Searchable remote relationships with selected-value hydration, cancellation and retry",
    "frontend/docs/development-guide/en/frontend/async-commands/owned-reads-and-shared-subscriptions.md",
    "LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/vessel/components/VesselInputSearch/VesselInputSearch.tsx",
  ],
  [
    "quick-create",
    "Quick-create relationship",
    "Choose or create a related record without losing the parent draft",
    "frontend/docs/development-guide/en/frontend/overlays/guarded-command-results-and-session-identity.md",
    "LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/convoy/components/ConvoyForm/ConvoyForm.tsx",
  ],
  [
    "filter-bar",
    "Search and filter bar",
    "Staged Apply/Cancel filters, active chips, clear and canonical URL state",
    "frontend/docs/architecture/en/route-entries-and-feature-composition.md",
    "LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/vessel/components/VesselFilters/VesselFilters.tsx",
  ],
  [
    "dependent-fields",
    "Dependent form section",
    "Parent-owned conditional fields, compatible selections and complete relational validation",
    "frontend/docs/development-guide/en/frontend/forms/cross-field-constraints-and-reset.md",
    "vireocode-web-app-starter@163552b7a0cfc1091506e6d4b003fa13879993fe:frontend/src/features/development-guide/patterns/forms/components/DependentFieldsPanel/DepartmentAssigneePreview.tsx",
  ],
  [
    "save-controls",
    "Save/discard controls",
    "Acknowledged saves, explicit discard and abortable dirty/busy route and unload guards",
    "frontend/docs/development-guide/en/frontend/editing/complete-navigation-guards.md",
    "client-discovery-app@9fcbf2f17a09329333c3d53c7a3750c48fc1db52:frontend/src/app/forms/hooks/useFormNavigationGuard.ts",
  ],
  [
    "related-records",
    "Related records section",
    "Parent-scoped server collection with independent filtering, paging and record actions",
    "frontend/docs/development-guide/en/frontend/collections/client-and-server-table-ownership.md",
    "LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/vessel/components/VesselDetails/VesselDetails.tsx",
  ],
  [
    "bulk-actions",
    "Selection and bulk actions",
    "Explicit selected IDs, page selection, confirmation and captured asynchronous actions",
    "frontend/docs/development-guide/en/frontend/collections/client-and-server-table-ownership.md",
    "vireocode-web-app-starter@163552b7a0cfc1091506e6d4b003fa13879993fe:frontend/src/features/development-guide/contacts/components/ContactsBulkActions.tsx",
  ],
].map(([value, label, purpose, guide, reference]) => ({
  value,
  label,
  purpose,
  guide,
  reference,
  acceptsFields: false,
}));

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
    inputs: {
      required: ["name"],
      optional: [
        "feature",
        ["form", "feature"].includes(kind)
          ? "fields (rich types for wizard/workspace; text otherwise)"
          : "fields (text only)",
        ...(["component", "shell", "page", "form", "feature"].includes(kind) ? ["variant"] : []),
      ],
    },
    ...(kind === "component"
      ? {
          variants: [
            {
              value: "simple",
              label: "Component",
              purpose,
              acceptsFields: true,
            },
            ...componentRecipes,
          ],
        }
      : kind === "shell"
        ? {
            variants: [
              { value: "simple", label: "Shell", purpose, acceptsFields: true },
              {
                value: "workspace",
                label: "Workspace shell",
                purpose: "Responsive workspace with sticky page navigation, mobile page selector and composition slots",
                acceptsFields: false,
              },
            ],
          }
        : kind === "page"
          ? {
              variants: [
                {
                  value: "simple",
                  label: "Page",
                  purpose,
                  acceptsFields: true,
                },
                {
                  value: "dashboard",
                  label: "Dashboard page",
                  purpose:
                    "Data-driven metrics, activity and secondary content with loading, empty and recovery states",
                  acceptsFields: false,
                },
                {
                  value: "detail",
                  label: "Detail page",
                  purpose: "Record summary, metadata, status, actions and complementary content with recovery states",
                  acceptsFields: false,
                },
                {
                  value: "report",
                  label: "Reports workspace",
                  purpose:
                    "Applied report filters, result states, summaries and explicitly scoped asynchronous exports",
                  acceptsFields: true,
                  guide: "frontend/docs/development-guide/en/frontend/collections/reporting-and-export-scope.md",
                  reference:
                    "LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/statistics/components/StatisticsReportTableCard/StatisticsReportTableCard.tsx",
                },
              ],
            }
          : kind === "form"
            ? {
                variants: [
                  {
                    value: "simple",
                    label: "Form",
                    purpose,
                    acceptsFields: true,
                  },
                  {
                    value: "wizard",
                    label: "Multi-section editor",
                    purpose:
                      "One retained form across sections, review, linked validation errors and acknowledged submission",
                    acceptsFields: true,
                    fieldTypes: richFieldTypes,
                    sampleFields: richSampleFields,
                    guide:
                      "frontend/docs/development-guide/en/frontend/task-interfaces/topic-editors-and-error-focus.md",
                    reference:
                      "client-discovery-app@9fcbf2f17a09329333c3d53c7a3750c48fc1db52:frontend/src/app/forms/components/AppTopicEditor.tsx",
                  },
                  {
                    value: "collection",
                    label: "Child-item editor",
                    purpose: "Aggregate form with stable child identities, staged Apply/Cancel and one final save",
                    acceptsFields: true,
                    guide:
                      "frontend/docs/development-guide/en/frontend/collections/hierarchical-rows-and-nested-editors.md",
                    reference:
                      "FRED/FRED-front@7a78e4f624e4b51ce1cdb9334036f2fb6119f62a:src/features/navigation/features/flight-log/components/FlightLogForm/FlightLogForm.tsx",
                  },
                ],
              }
            : kind === "feature"
              ? {
                  variants: [
                    {
                      value: "simple",
                      label: "Feature",
                      purpose,
                      acceptsFields: true,
                    },
                    {
                      value: "workspace",
                      label: "Record workspace",
                      purpose:
                        "Controlled server collection with search, sorting, pagination and guarded record editors",
                      acceptsFields: true,
                      fieldTypes: richFieldTypes,
                      sampleFields: richSampleFields,
                      guide:
                        "frontend/docs/development-guide/en/frontend/overlays/guarded-command-results-and-session-identity.md",
                      reference:
                        "client-discovery-app@9fcbf2f17a09329333c3d53c7a3750c48fc1db52:frontend/src/features/sales/components/LeadList.tsx",
                    },
                  ],
                }
              : {}),
    guide: frontendGuide,
    reference:
      "client-discovery-app@9fcbf2f17a09329333c3d53c7a3750c48fc1db52:frontend/src/features/sales/components/LeadForm.tsx",
    limitations:
      "New feature owner only; visual preview auto-registered; no production route or persistence policy inferred.",
  })),
  {
    id: "frontend/navigation",
    target: "frontend",
    kind: "navigation",
    purpose: "Deep routed workspace with real header tabs, page sidebar, breadcrumbs and nested records",
    visual: true,
    acceptsFields: false,
    output: "public workspace UI, thin pages, app/router/generated/<feature>--<name>.routes.tsx",
    inputs: { required: ["name"], optional: ["feature"] },
    guide: "frontend/docs/architecture/en/router-and-shell-responsibilities.md",
    reference:
      "vireocode-web-app-starter@a8d8632086a26c33d6a2d8f15f9aa8446daef95a:frontend/src/app/router/handbookRoutes.tsx",
    limitations:
      "Editable authenticated route scaffold. Preview mounts in development only; product mount and drawer registration remain explicit. No backend, permissions or application preferences inferred.",
  },
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
