# Find the owner before editing

**Support status: documented starter workflow, with a worked implementation recipe.** The repository's `AGENTS.md`, frontend guide, local route/navigation skills and architecture documents establish current ownership. The decision examples below apply those rules; they do not install new automation or grant deployment authority.

Use this workflow for a concrete requested change, especially when a small screen adjustment crosses routing, a feature and shared presentation. Start with the requested outcome, identify its owners and public seams, then make the bounded change. A file that is convenient to edit is not necessarily the owner of the behavior.

## 1. Establish outcome, instructions and evidence

Read the current applicable `AGENTS.md` files before modifying their area. Root guidance points to the frontend guide for frontend work and to the workspace README for local development and verification. A route/page lifecycle change triggers the local `app-route-pages` skill; drawer, tabs, breadcrumbs or sidebar work also triggers `app-shell-navigation`. Follow relevant pointers when their condition applies rather than loading every initialization or deployment workflow for an ordinary feature edit.

Write a checkable outcome in a few lines. For example: “Patterns shows one Application state group containing Signals, Server data and Routing and URLs; existing article URLs still resolve; both locales display the grouping.” The completion boundary includes the existing routes and localized content, not just a heading visible on one screenshot.

Keep evidence labels explicit:

| Label            | Meaning                                             | Required next step                                  |
| ---------------- | --------------------------------------------------- | --------------------------------------------------- |
| Source fact      | Implemented or documented at an identified revision | Inspect the generated consumer for drift            |
| Reference recipe | Adaptation demonstrated by another source           | Name missing collaborators, dependencies and policy |
| Proposal         | An unimplemented design choice                      | Resolve the decision before claiming the behavior   |

Record source project, commit and relative path for imported guidance. A peer project's successful design does not prove the starter contains its APIs, permissions or operational setup.

## 2. Map ownership and preserve the public seam

Frontend architecture organizes source by capability: `app` holds stable infrastructure, `features` owns behavior and feature UI, and thin `pages` compose public interfaces for a route. A feature's deliberate `index.ts` exports form its public seam. Use `@/` when crossing owners and relative imports within one owner; inspect existing exports before inventing new ones.

Route policy belongs to `routeRegistry.tsx`: URL, access, availability, localized titles, hierarchy, navigation and layout metadata. The shell presents supplied navigation; it does not read the route registry to discover product policy. A route adapter can interpret router metadata and pass plain data into presentation. A feature keeps its validation, data access and business state rather than moving them into the shell because two pages need similar visuals.

| Requested change                           | Likely owner and seam                                         |
| ------------------------------------------ | ------------------------------------------------------------- |
| Add a routed page or preserve an old URL   | Page composition plus registry and explicit redirect          |
| Reuse grouped navigation rows              | Shared presentation receiving labels, icons, links and groups |
| Interpret matched route handles            | Router adapter supplying presentation data                    |
| Add a Contacts mutation rule               | Contacts model/API/runtime boundary, exposed deliberately     |
| Add a consumer prerequisite or secret name | Owning source plus authoritative setup runbook                |

These decisions are starting points, not permission for a broad refactor. Inspect neighboring code and the architecture policy. An explicit allowlist is a reviewable boundary; a checker failure is not an invitation to exempt a whole directory.

## 3. Make a bounded change

For the grouping example, extend the existing presentation input to represent named groups and ungrouped entries, then pass translated data from its current caller. Preserve existing item behavior and URLs. Avoid importing router inventory into the reusable component or duplicating row markup in each page. If a public prop changes, update all callers intentionally and explain compatibility.

Before moving a feature, trace its exports, route records, translations, mocks, tests, runtime registrations and any Signal lifecycle registration. Add only the roles actually needed; a data-only presentation change does not justify a new feature factory or application-lifetime hook. Keep unrelated work intact, especially when another editor owns adjacent files.

An implementation step is complete when every affected caller and registration agrees with the chosen contract, not when one file compiles in isolation. If evidence reveals a larger migration, state its boundary instead of quietly changing public behavior.

## 4. Verify only what is authorized

Read the configured scripts and testing guide. Normal frontend `verify` includes formatting, lint, architecture, typechecking, tests and builds. The architecture checker catches mechanical import and lifecycle violations; review still decides whether the chosen owner and interface are appropriate. Select focused behavior coverage and broader gates according to risk and the current repository coordination rules.

Explicit session constraints can narrow execution. For example, when the user prohibits tests until requested, choose authorized non-test checks and report the gap. Such an exception applies to that task; it does not permanently disable repository verification or establish passing evidence for unexecuted tests. Existing test files can describe intended cases without authorizing execution.

Record check command, candidate revision or scope, result and material limits. Visual inspection establishes the observed layout; it does not prove authorization, persistence or concurrency. A build establishes compilation/bundling, not every behavior in a sample article.

## 5. Review, deliver and report the boundary

Seek independent review when required by the applicable repository rules or justified by public-contract and cross-owner risk. Resolve material findings before final verification. Delivery is a separate authorized action: commit, push, open a WIP PR, merge and deploy each have their own scope. For a timeboxed run that explicitly authorizes publication after each task, checkpoint the commit and push, check the supplied timezone and choose another task only within the agreed window. Another session may authorize local edits only; the guide does not grant standing publication authority.

A useful completion report states the resulting behavior, owning files, compatibility decisions, actual checks and remaining limits. Include the commit/PR when publication was authorized. Never translate a guide-writing task into permission to change infrastructure, activate a workflow, merge a branch or deploy an environment.

## Exact source references

- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:AGENTS.md` and `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/AGENTS.md` — current instruction pointers and owner-specific guidance.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/.agents/skills/app-route-pages/SKILL.md` and `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/.agents/skills/app-shell-navigation/SKILL.md` — route lifecycle and navigation workflows.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/docs/architecture/en/source-map-and-ownership.md` — capability owners and stable infrastructure.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/docs/architecture/en/dependency-boundaries-and-imports.md` — public interfaces and dependency direction.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/docs/architecture/en/route-entries-and-feature-composition.md` and `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/docs/architecture/en/add-change-or-remove-a-feature.md` — route composition and complete change ownership.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/docs/architecture/en/tests-mocks-stories-and-architecture-checks.md` and `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/package.json` — verification responsibilities and actual scripts.
