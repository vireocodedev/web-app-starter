# Development guide

Repository contracts cover frontend, backend, quality, CI, delivery, local
workflow and agents. The [bilingual catalog](CATALOG.md) is full human navigation;
compact task discovery uses the existing live index. Canonical articles and
Storybook readers remain outside production. Retired app guide URLs are Not Found.

## Mandatory agent workflow

Every task starts here, including read-only explanation, review, docs and
operations. Reading depth follows affected contracts, risk and scope, not line
count. Metadata selects full reading; it cannot certify the selection is complete.

1. **Classify.** Inspect applicable `AGENTS.md`, outcome, operation and affected
   owners. Include indirect dependencies and cross-cutting concerns: access and
   secrets; API/error contracts; transactions/concurrency; data/cache/effect
   lifetimes; accessibility/locales; verification/review; CI/release authority.
   An editorial/read-only task loads the contracts needed for its claims and
   subject, without automatically executing implementation procedures or suites.
2. **Retrieve metadata.** Use explicit concern keys with `route <keys...>` below;
   discover the relevant owner with `route --list <scope>`. Combine all plausible
   concerns rather than accepting a top hit. Derived handbook article/topic keys
   expose every category without reading TypeScript catalogs. The full inventory
   and text search remain available for audits, uncertain classification, missing
   routes or novel concerns; ordinary tasks need no complete catalog dump.
3. **Select and read.** Read the concise area baseline and **every applicable full
   authoritative article, tutorial, skill and prerequisite**, then inspect exact
   current owners/interfaces/callers and relevant examples before consequential
   planning or edits. Route output is an initial mandatory set for its declared
   trigger, not an exhaustive natural-language classifier. Apply conditional
   expansions stated in documents even if metadata does not infer them. Related
   reading is a selection aid, not an automatic prerequisite bundle. Read English
   or Croatian once; both represent one contract. Installed patterns and reference
   recipes have different status: recipes name collaborators to implement, not
   existing APIs. Pinned provenance is distinct from current local source.
4. **Expand.** Reroute and read before touching another owner when source tracing
   reveals a new dependency, the task grows, or ownership changes. Broaden search
   terms and inspect owner/topic groups after ambiguous, truncated or empty
   results. A miss is not evidence that guidance is absent. Inspect actual source
   selectively; avoid ingesting unrelated trees or executing documentation code.
5. **Resolve gaps.** The [root approval gate](../../../AGENTS.md#mandatory-development-guide-workflow)
   applies when a pattern is missing, docs conflict with code or an approach
   departs from a contract. Present searched evidence, owners, alternatives,
   tradeoffs and recommendation; obtain Bruno's explicit approval for that
   affected implementation. Updating docs or checks cannot grant approval.
6. **Verify and hand off.** Before editing, briefly name reused guide paths and
   current patterns. Finish affected callers, docs/locales and required review;
   run owner-appropriate checks under root resource controls. Report actual
   candidate, contracts, approvals, checks and omissions. Publication/deployment
   remain separately authorized. Read-only explanations report source evidence.

### Live inventory and full-text search

From the root with the repository's installed Node 24 launcher:

```sh
bash backend/scripts/with-local-node.sh frontend/scripts/development-guide-index.mjs route forms notifications
bash backend/scripts/with-local-node.sh frontend/scripts/development-guide-index.mjs route --list backend
bash backend/scripts/with-local-node.sh frontend/scripts/development-guide-index.mjs search session csrf --limit 10
bash backend/scripts/with-local-node.sh frontend/scripts/development-guide-index.mjs
```

With Node 24/npm 12 selected, `npm --prefix frontend run guide:index -- route forms`
is equivalent. `route` accepts explicit stable selectors/aliases, unions concerns
and prerequisites, and fails on unknown/ambiguous selectors rather than losing
scope. It reads routing metadata, not article or production-source bodies.
`route --list` inventories selectors; `--help` describes syntax. These interfaces
extend the scanner; no second full-text index or generated cache exists.

The no-argument overview and `search <terms...> [--limit N]` retain live full-corpus
discovery, exact paths, line excerpts, status/provenance and explicit truncation.
Search combines terms with AND; split different concerns into separate searches.
Refine truncated results. Paired Croatian text is inventoried but ordinary search
returns English/unique copies. To audit paired translations or fixture matches,
use `rg -n` over the inventoried trees; route returns canonical reading paths.

Scan coverage includes all files under `docs/development-guide`, `docs/architecture`
and `docs/storybook`, catalogs/support/translations included, plus legacy MDX/CSF
and `stories/` support under `frontend/src`. Legacy discovery diagnoses misplaced
artifacts; it does not authorize their location. Scan reads bytes without
executing examples/configuration and inventories symlinks without following them.
If Node 24 is unavailable, use `rg --files` and `rg -n` over these trees plus the
root/area routers for equivalent discovery, and report the fallback.

### Reading owners

- [Frontend baseline](../../AGENTS.md) and [tutorial router](../storybook/README.md)
  select UI, architecture and skills by concern. Deep architecture articles remain
  mandatory when their contract is involved; all four tutorials are not a default
  prerequisite for every frontend task.
- [Backend router](../../../backend/AGENTS.md), [CI operator](../../../infrastructure/ci/README.md)
  and [release operator](../../../infrastructure/release/README.md) select their
  respective contracts. Every handbook category/topic remains in live metadata
  and the [full catalog](CATALOG.md).
- [Engineering coordination](../../../docs/agents/engineering-workflow.md) loads
  before consequential planning, dispatch and independent review. A task-specific
  context pack names mandatory paths/current examples; receivers reclassify when
  scope changes without reloading unrelated indexes.
- [Storybook authoring](../storybook/CONTRIBUTING.md) loads for tutorial, story,
  fixture, reader, catalog, translation and configuration edits. Skills are
  procedures, articles are contracts; overlapping skill triggers compose.

### Browser navigation

Run `npm --prefix frontend run storybook`; open **Development Guide → Handbook →
Handbook** or **Development Guide → Architecture → Architecture reference**.
These English readers use canonical paired articles with selected-body lazy
loading, retry and local metadata navigation. Production has no guide routes,
imports, namespaces or startup registrations. Samples are inert documentation;
Storybook observation is distinct from executing repository tests.

## Maintain a pattern

Storybook tutorials, stories and support live outside `src/`, grouped by section under `frontend/docs/storybook/`, and use English. Each tutorial's same-name folder contains its MDX, CSF and fixtures; section-wide helpers live in `shared/`. Follow [Storybook authoring conventions](../storybook/CONTRIBUTING.md), add tutorials to the [Storybook guide entry point](../storybook/README.md) and register their conditional route metadata in `frontend/scripts/development-guide-routes.mjs`. Keep implementation steps readable as MDX source, identify application files separately from preview fixtures, and include failure cases and verification. The live index reads every file in this tree; they need no bilingual handbook catalog entry.

For an existing category:

1. Add paired `en/<category>/<topic>/<slug>.md` and `hr/...` files.
2. Add the article to its private [category catalog](../storybook/handbook/Handbook/catalog), such as `handbookBackend.ts`. The category owns topic and article order.
3. Add matching labels to its paired [category resources](../storybook/handbook/Handbook/localization/handbook), such as `backend.{en,hr}.ts`, and link both articles in the [bilingual catalog](CATALOG.md).

Keep catalog and locale modules as literal data without getters or side effects; they are documentation-only and production must never import them. Existing-category additions leave the central aggregators unchanged. A new category also needs one bundle in `orderedHandbookCatalog`, explicit resource spreads in `development-guide-handbook.{en,hr}.ts`, and Storybook reader placement.

The manifest supplies the isolated Storybook reader indexes, category/topic/article
memory navigation, sidebars and related reading. Shared rendering lives under
`docs/storybook/shared/documentation/`. Canonical articles keep portable
`frontend/<topic>/<article>` source paths. Explicit related IDs link across topics;
siblings are the default when no list is declared. Add no application route,
namespace, startup registration or production import when maintaining guidance.

A useful article states its trigger, ownership and lifetime, actual contract, minimal example, failure/recovery decisions, acceptance evidence and exact `project@revision:relative/path` sources. Keep identifiers and examples neutral. Explain a source limitation beside the recipe that depends on it.

The agent index discovers files directly from the working tree; adding or moving guidance needs no separate index-generation step. Keep the existing UI catalogs, paired articles and source references current through the procedure above.

Run `npm --prefix frontend run verify:dev-guide` to validate paired content, labels, hierarchy, provenance and Markdown links, and test the live index's discovery/search contract. It executes no guide examples. Select other authorized checks from the repository instructions and scripts.

Source references name repositories and pinned revisions rather than machine-specific paths. Generated applications can use the guidance without possessing the peer workspaces. Operational runbooks remain authoritative for actual provisioning and deployments.
