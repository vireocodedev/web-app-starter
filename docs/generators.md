# Generate application structures

Use the bundled generators before writing standardized frontend or backend source. They target this starter's installed RGO/Spring stack. The [analysis and source map](generators-analysis.md) explains candidate selection, architectural precedence and the Client Discovery reference; [verification evidence](generators-verification.md) records executed checks.

## Run

Use the existing Node 24/npm 12 toolchain and install frontend dependencies with `npm ci` in `frontend/`. Generation uses that installed Prettier and the frontend formatting configuration. No additional generator package or global CLI is needed. From the workspace root:

```sh
npm run generate -- --help
npm run generate -- --list
npm run generate -- --list --json
npm run generate -- frontend form UserProfile --fields name,email --dry-run
npm run generate -- frontend form UserProfile --fields name,email
```

`npm --prefix frontend run generate -- ...` is equivalent. With an older desktop Node selected, use `bash backend/scripts/with-local-node.sh tools/generators/cli.mjs ...`.

`npm run generate` opens a colored, grouped menu: choose **Frontend** or **Backend**, then a generator such as **Component** or **Form**. Use ↑/↓ to move, Space or Enter to choose, Page Up/Down to move through the visible list, and Home/End to jump. Esc/← returns to the groups; Esc at the group menu or Ctrl+C cancels. The highlighted choice, description and scroll position adapt to terminal width and height; small terminals use a compact view. Set `NO_COLOR=1` to disable colors. Try `npm run generate -- --dry-run` to explore without writing files.

The [Inquirer terminal engine](https://github.com/SBoudrias/Inquirer.js/tree/main/packages/core) and Unicode width helper are installed with the existing frontend tooling dependencies; run `npm ci` in `frontend/` after pulling this update. After selection, enter the name, fields and any required migration version. Cancellation restores the terminal and exits without generating files. Automation supplies the complete command and can request `--json`. Errors return a nonzero status and never wait for interactive input when stdin is not a terminal.

Names accept PascalCase, lowerCamelCase, acronym words, and separated words. Output consistently uses PascalCase types/components, lowerCamelCase members, kebab-case feature directories and lowercase Java package segments. Paths, reserved identifiers and case aliases are rejected. `--feature Inventory` chooses the capability owner; its default is the supplied name. Fields use `--fields title,notes:string?,quantity:integer,active:boolean`; `?` means optional. Defaults: one required `name` field, maximum text length 120. Visual generators support bounded text fields. Backend and API generators also support signed int32 and boolean values. Identity is server-owned and is never a caller field.

## Rich layout recipes

The keyboard menu includes each recipe below. Existing `shell` and `page` invocations retain their simple output; `--variant simple` selects it explicitly.

```sh
npm run generate -- frontend shell Operations --variant workspace
npm run generate -- frontend page Overview --variant dashboard
npm run generate -- frontend page Record --variant detail
npm run generate -- frontend navigation Workspace
```

| Recipe          | Public composition surface                                                               | What its preview demonstrates                                                                       |
| --------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Workspace shell | Title, summary, actions, sidebar links, content and footer                               | Sticky left navigation and a mobile page selector using the installed `AppPageNavigation`           |
| Dashboard page  | Caller-supplied metrics, activity, actions, main and secondary content                   | Responsive metric cards, activity, loading, empty, error and retry states                           |
| Detail page     | Title, summary, metadata, status, actions, main and aside content                        | Record summary, complementary context, loading, empty, error and retry states                       |
| Deep navigation | Public workspace UI, thin page adapters and a router-owned `createRoutes(mount)` factory | Actual header tabs, left page navigation, nested Records/Details, default redirects and breadcrumbs |

These recipes use composition props rather than `--fields`. Callers own data, number/date formatting, actions, authorization and persistence. Layouts reuse application theme tokens and adapt to their available container width.

## Workflow recipes

The keyboard menu also offers these four recipes. They accept the same bounded text `--fields` as the base form/table generators; existing commands retain their simple output.

```sh
npm run generate -- frontend feature Customers --variant workspace --fields name,email,notes?
npm run generate -- frontend form Application --variant wizard --fields name,email,notes?
npm run generate -- frontend form Order --variant collection --fields description,reference?
npm run generate -- frontend page Activity --variant report --fields category,description?
```

| Recipe               | Reusable behavior                                                                      | Integration owner                                                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Record workspace     | Search, server sorting/paging, detail and guarded create/edit panels                   | Caller supplies the requested page, total, controlled request state and acknowledged writes. The preview simulates server processing over a complete fixture. |
| Multi-section editor | One retained form, section navigation, review and linked validation errors             | One final command validates and submits the complete form. Next changes section without saving or validating it.                                              |
| Child-item editor    | Aggregate title and repeatable text-field items, stable local IDs, staged Apply/Cancel | Applying a child updates only the parent draft. The final save submits the aggregate; the caller maps local and persisted identities.                         |
| Reports workspace    | Applied filters, result states, summaries and asynchronous scoped export               | Caller owns result identity, period meaning, authorized acquisition and download. Export explicitly names current-page or all-matches scope.                  |

The record and topic recipes adapt Client Discovery's collection and long-form interfaces. Child drafts follow the LMS/FRED nested-editor recipe; reports follow LMS's report/export presentation. Each catalog variant links its source and owning guide. Current RGO/TanStack controls, application form lifecycle and overlay guards replace the peers' historical UI wrappers.

The child-item recipe reserves `localId` and `serverId`; use other names for supplied fields. Its parent title is independent of any child field named `title`.

Every workflow includes a working Dev Guide preview with local sample data and interaction controls. Its callbacks exercise pending, failure and acknowledged completion without a backend. These are application-owned starting points: production route/access rules, persistence, business validation, concurrency/revision policy and export formats remain deliberate feature decisions.

The navigation factory at `frontend/src/app/router/generated/<feature>--<name>.routes.tsx` owns the route inventory. It creates Overview, Workspace and Settings header sections; Workspace contains Records and Activity, and Records contains an index and deeper Details page. It emits no second application header or router. In development the existing preview discovery mounts it automatically. For product integration, import its `createRoutes` into `routeRegistry.tsx`, spread a mount such as `createRoutes({ idPrefix: "operations", path: "operations" })`, and deliberately add its destination to application navigation. The factory creates authenticated routes; business-specific authority still needs its own implementation. Use a distinct mount prefix for each registration.

## Refresh the sample gallery after each iteration

After every generator change, remove the previous sample set and regenerate **every frontend generator and variant** through the repeatable command:

```sh
npm run generate:samples -- --dry-run
npm run generate:samples
```

Open `/dev-guide/frontend/generated` in the running development app. The sample inputs reuse the output rehearsal: `title,notes?` for text examples, and scalar title/quantity/active values for the API. Additional catalog variants receive their own names and owners automatically. API output stays nonvisual under `frontend/src/features/generator-catalog/`.

The command records sample paths and hashes in the untracked `.generator-samples.json`. It removes only unchanged files owned by that receipt, rejects edited or tracked samples, refuses symlinks and unexpected files inside sample owners, then rebuilds the mechanical locale index. It never recursively deletes an arbitrary feature directory or grants ordinary generators overwrite rights. A partial refresh retains a receipt for the files already generated; address the reported conflict before retrying. Previously created manual experiments without a receipt require deliberate removal or stashing first.

If a process is killed, inspect running generators before removing its stale `.generator-samples.lock` and retrying. Receipt-owned missing files and interrupted locale-pair removal can then be reconciled; unrelated locale damage still refuses before cleanup.

Leave the samples and receipt uncommitted for inspection. When finished, stash both tracked locale-index changes and untracked output:

```sh
git stash push -u -m "frontend generator samples"
```

## Catalog

Every visual command creates a new `src/features/<feature>/index.ts` public interface, paired typed English/Croatian resources and a working preview page. Existing owners require deliberate adaptation; the CLI refuses to replace their interface. `--help` after a target and kind and `--list --json` expose metadata. All paths below are relative to `frontend/` or `backend/`.

| Command after `generate --`              | Generated application files                                                                                             | Inputs and supported variation                                                                                                | Pattern owners                                                                                                                                                         |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend component UserCard`            | Feature component and public props/index                                                                                | name; optional feature; callback, disabled and content props                                                                  | [Ownership](../frontend/docs/architecture/en/source-map-and-ownership.md), Home page; CDA feature UI composition                                                       |
| `frontend form UserProfile`              | Form component, model and validation/behavior tests                                                                     | name; optional feature, text fields; `simple`, `wizard` or `collection`; explicit create/update and awaited submission        | [Entity forms](../frontend/docs/development-guide/en/frontend/forms/entity-modes-and-validation-policy.md), ContactForm; CDA LeadForm                                  |
| `frontend shell Dashboard`               | `components/DashboardShell.tsx`, public props/index                                                                     | name; optional feature; simple slots or `--variant workspace` with installed page navigation                                  | [Page composition](../frontend/docs/architecture/en/route-entries-and-feature-composition.md), AppShell ownership; CDA LifecyclePageLayout                             |
| `frontend table Orders`                  | `components/OrdersTable.tsx`, `models/Orders.ts`, public index                                                          | name; optional feature, text fields; bounded complete client collection, loading/error/empty, sort/pagination                 | [Collection ownership](../frontend/docs/development-guide/en/frontend/collections/client-and-server-table-ownership.md), ContactsTable; CDA SalesTable                 |
| `frontend page Orders`                   | Feature content and thin `src/pages/<feature>/OrdersPage.tsx`                                                           | name; optional feature; `simple`, `dashboard`, `detail` or `report` (report accepts text fields)                              | [Route entries](../frontend/docs/architecture/en/route-entries-and-feature-composition.md), ContactsPage; CDA thin lifecycle pages                                     |
| `frontend feature Orders`                | Form, table, model, composing feature/workspace, public interface and tests                                             | name; optional feature, text fields; `simple` or `workspace`; caller supplies collection data and acknowledged writes         | [Feature anatomy](../frontend/docs/architecture/en/feature-anatomy-filenames-and-public-interfaces.md), Contacts; CDA form/table composition                           |
| `frontend api Product --feature Catalog` | `models/Product.ts`, `api/product.api.ts`, `.api.http.ts`, `.querykeys.ts`, `.query.ts`, public index, HTTP/query tests | name; optional feature, scalar fields; UUID detail GET, explicit cache scope, abort signal, nullable optional producer fields | [API/Query boundaries](../frontend/docs/architecture/en/apis-models-queries-and-mutations.md), Contact API/query; CDA paidDiscovery HTTP adapter                       |
| `frontend navigation Workspace`          | Public workspace UI, thin pages, `app/router/generated/<feature>--<name>.routes.tsx`                                    | name; optional feature; real header sections, left page navigation and nested records                                         | [Route and shell ownership](../frontend/docs/architecture/en/router-and-shell-responsibilities.md), installed route hierarchy and page navigation                      |
| `backend dto CreateProduct`              | `<Name>Request.java` and validation tests                                                                               | name; optional feature, scalar fields, `--variant request` (default) or `response`                                            | [Validation](../frontend/docs/development-guide/en/backend/foundation/validation-and-error-contracts.md), AuthController records; CDA explicit input checks            |
| `backend domain Product --migration 3`   | JPA entity + matching `V3__create_<table>.sql`                                                                          | name and explicit migration version; optional feature, scalar fields                                                          | [Flyway](../frontend/docs/development-guide/en/backend/data/flyway-and-schema-ownership.md), starter/CDA AppUser                                                       |
| `backend repository Product`             | `<Name>Repository.java`                                                                                                 | existing same-owner entity; name and optional feature                                                                         | Starter/CDA AppUserRepository; [service/persistence boundaries](../frontend/docs/development-guide/en/backend/foundation/http-service-persistence-boundaries.md)       |
| `backend service Product`                | Response record, read-only service, mapping/missing tests                                                               | existing same-owner entity + repository; fields must match actual getters/types                                               | [Transactional service](../frontend/docs/development-guide/en/backend/application-services/transactional-commands.md), CDA service transactions adapted to starter JPA |
| `backend controller Product`             | Typed GET controller                                                                                                    | existing same-owner service `get(UUID)` + matching response                                                                   | Same service boundary; CDA thin controller delegation                                                                                                                  |
| `backend feature Product --migration 3`  | Entity + forward migration + repository + response + service + controller + unit/real HTTP/database tests               | name and explicit migration; optional feature, scalar fields                                                                  | All backend patterns above plus [real PostgreSQL/HTTP tests](../frontend/docs/development-guide/en/quality/backend/real-postgres-and-http-contracts.md)                |

The backend feature is a complete **read-only shared-authenticated record** pattern. It inherits the installed session boundary and exposes `GET /api/<feature>/<name>/{id}`. It creates no write endpoints, roles, private-data policy, tenant checks, relationships, generic mapper or unused request DTO. Use it only where all authenticated users may read the record. Private/tenant/mutation workflows require their approved authority contract first. Standalone service/controller generation checks prerequisite paths; a customized prerequisite still needs human/agent inspection and compilation. Prefer the composite when starting a complete selected-pattern slice.

The API bundle is nonvisual and needs no guide page. Wire its injected Axios adapter and query factory through the owning runtime; provide an actual actor/tenant cache partition and retain existing private-cache cleanup on authority changes. It neither registers itself in `appFeatures.ts` nor implements mutation semantics. A generated page gets its guide preview automatically; its production URL, access and navigation remain a separate deliberate router decision.

## Automatically inspect visual output

Open `/dev-guide/frontend/generated` in authenticated local mock mode. The existing Frontend section includes Generated examples, grouped by generator kind. Child pages also appear in the existing page search. For the first command above the route is:

```text
/dev-guide/frontend/generated/form/user-profile--user-profile
```

Examples are thin pages at `src/pages/development-guide/generated/<kind>/<feature>--<name>.example.tsx`, exporting `Component`. They import the actual generated public component. Page previews render the public content used by the generated thin page adapter, preserving the rule that only the router imports page entries; the adapter itself is covered by compilation. Navigation previews instead discover the router-owned `.routes.tsx` factories and mount their real hierarchy beneath the Generated examples index. The router's DEV-only file discovery derives route records and list entries; it uses the normal route hierarchy and authentication gate. No per-invocation registry edits or separate explorer are involved.

Forms demonstrate empty/populated values, submit-first validation, disabled controls, held pending submission, success and simulated rejection. Tables offer client filtering, sorting/pagination and populated/empty/loading/error states. Layouts toggle the sidebar slot and adapt to narrow viewports. Components and pages exercise their callback; feature examples add rows through a local callback. The existing application supplies theme, localization and router providers. These examples perform no HTTP writes or production persistence. API tests use an in-process Axios adapter; backend tests use disposable Testcontainers PostgreSQL.

Preview controls use the existing development-guide namespace, which is excluded from production. Actual component strings use the ordinary typed translation resources. The generator creates paired feature resource files and updates only `translations/generated/index.ts`; English defines keys and Croatian satisfies the same string-leaf shape. Customize business wording, including unfamiliar Croatian field labels, in those application-owned files. Production may include actual components/resources when used by product routes, but must exclude preview modules, fixtures and guide routes. The isolated production-build verification checks that distinction.

## Ownership, conflicts and lifecycle

Generation renders, formats and validates the complete plan before mutation. `--dry-run` performs the same validation and reports paths/actions/hashes without files, directories or locks. Case-insensitive aliases, symlink ancestors, unsafe paths, existing files and reused/out-of-order migrations are refused. A lock serializes writes. New files publish fully written bytes with exclusive no-replace semantics; the mechanical index checks its expected current bytes before updating. Handled failures clean up only matching files/directories created by the invocation and restore matching index updates. Concurrent human edits are preserved.

Application output is generated once and then belongs to the application. There is no force overwrite, regeneration of adopted migrations, source deletion or automatic rename command. Repeating an invocation refuses safely. For a different structure, choose another name/owner or adapt the adopted source. A process kill/power loss is not a transactional filesystem rollback: inspect the printed plan, current files and running processes before removing a stale `.generator.lock` and reconciling an interrupted operation.

Preview registration follows the files on every dev build. Removing a `.example.tsx` removes its route/navigation automatically. A supported preview-only rename changes its `<feature>--<name>` filename and updates its public imports; the next build derives the new URL and removes the old one. Business route redirects are separately owned by the router. Removing an entire generated capability requires reviewing its callers, page, tests and locale pair. Remove both locale files together, then regenerate the mechanical index from the remaining locale pairs using the maintenance command below; customize neither the mechanical imports nor its aggregates.

```sh
npm run generate -- index --dry-run
npm run generate -- index
```

## Generator-first agent policy

Before creating frontend/backend source, agents MUST:

1. Discover the live Development Guide and identify each architectural structure and owner.
2. Run `npm run generate -- --list --json`; inspect relevant generator metadata, source traceability and a dry-run. Evaluate each generator against its own output responsibility, not an entire feature.
3. Score suitability with evidence using the rubric below. Apply hard disqualifiers first. The default threshold is **80%**, configured in the root `generator-policy.json`.
4. Use every meaningful compatible generator at or above that threshold. Prefer a composite over overlapping invocations. Generate first, inspect, then customize business behavior. Add no unnecessary layers or files.
5. Implement manually only the unsupported portion or a below-threshold/disqualified structure, and record the reason. Repeated near-matches should trigger an improvement using the guide and Client Discovery reference. Preserving architecture is autonomous; changing approved standards requires explicit approval.
6. Verify actual output: owner checks, meaningful tests, representative compilation, guide navigation/interaction and production isolation. Report actual evidence and concise usage.

| Criterion                       | Weight | Evidence                                                        |
| ------------------------------- | -----: | --------------------------------------------------------------- |
| Architecture and file structure |    30% | Correct owner, dependencies, lifetime and public interface      |
| Libraries and conventions       |    25% | Installed APIs, form/data/style/test conventions                |
| Relevant output coverage        |    25% | Useful generated portion of the generator's own responsibility  |
| Workflow integration            |    20% | Runtime/caller seam, routing/localization/tests and preview fit |

Score each criterion 0–100 and calculate the weighted total. Hard disqualifiers are approved-architecture violations, behavior that cannot safely adapt, unsafe/destructive output and unacceptable loss of existing functionality. A filename match is insufficient evidence. No score overrides a disqualifier. The CLI can calculate a transparent assessment:

```json
{
  "architecture": {
    "score": 100,
    "evidence": "New feature owner and public interface match the requested form."
  },
  "conventions": {
    "score": 100,
    "evidence": "Installed RGO/TanStack form, localized Zod and AppEntityForm lifecycle."
  },
  "coverage": {
    "score": 85,
    "evidence": "All text fields generated; business-specific cross-field validation remains."
  },
  "workflow": {
    "score": 100,
    "evidence": "Parent callback and automatic DEV preview fit the intended editor."
  },
  "disqualifiers": []
}
```

```sh
npm run generate -- assess frontend/form --assessment /tmp/form-assessment.json --json
```

This reports 96.25 and mandatory usage under the default threshold. It calculates submitted evidence; it does not independently judge that evidence or mechanically guarantee future agent compliance. Static instruction tests and representative real generation validate the enforceable surface.

Report only meaningful coverage, for example `Order form | frontend/form | 96.25% with cited criteria | generated + customized`. For a specialized chart or tenant mutation, report the missing contract instead of inventing a compatible score.

## Extend and verify

`tools/generators/registry.mjs` owns metadata, `templates/` pure output, `core.mjs` complete planning and formatting, and `filesystem.mjs` safe application. `frontend-workspaces.mjs` owns record/report workflows; `frontend-editors.mjs` owns sectioned/child-item forms. Add a template and catalog entry, exact guide/starter/peer traceability, supported inputs/limitations and failure coverage. Compose pure renderers instead of spawning nested CLI runs. Keep generated business code separate from mechanical indexes; preserve applied Flyway bytes.

Run `npm run test:generators` for naming, catalog-wide output, options, determinism, dry-run, collision, cross-platform path, partial failure and policy tests. Use the isolated output rehearsal described in [verification evidence](generators-verification.md) for real frontend/backend compilation, emitted tests, browser interactions and production graph inspection. Follow the repository's existing full checks and serial resource budget; do not equate snapshots or source inspection with runtime success.
