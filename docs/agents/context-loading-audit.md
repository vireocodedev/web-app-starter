# Agent context-loading audit

Candidate: `chore/agent-context-loading`, based on
`2a8014d4d8fea6f3edc8612788326d0f204c1cba` (`main`). Audit date: 2026-10-28.
Scope: local instruction/documentation routing and its existing index/verifier;
application architecture and behavior remain intact. No commit, push, merge,
deployment, infrastructure activation or data change is part of this task.

## Inventory and loading topology

The working tree has three repository instruction files: root, frontend and
backend `AGENTS.md`. Only three repository skills are present, all under
`frontend/.agents/skills`: route/page lifecycle, shell navigation and preferences.
The supplied root `.agents/skills` observation is stale in this checkout; there
are no root skill files to rewrite. Session/global instructions and external
skills are outside this repository's byte measurements and edit scope.

The baseline index inventories 718 files. The existing catalogs own 158 paired
handbook articles across seven categories: backend 64, frontend 43, quality 11,
CI 9, delivery 14, developer workflow 11 and agent workflow 6. There are also
15 paired architecture articles and 16 Storybook sections, including all layouts,
URL state, authentication, workflows, notifications, testing and legacy patterns.

Before, every task was directed through the full 46,334-byte guide README and
all owner groups. Frontend tasks additionally required the Storybook README,
all four architecture tutorials and source map before concern-specific reading.
Those nine directly required files total 113,618 bytes, before further linked
contracts/examples. Root guidance alone was 20,899 bytes; it is now 7,784 bytes (62.8% smaller). Repeated requirements
in root, frontend, guide and Storybook created competing broad loading edges.

After, automatically supplied root/area instructions route through the compact
guide workflow and explicit concern metadata. Bounded tasks keep universal
policy and the area baseline, then load full applicable contracts/examples.
Consequential planning, delegation and review also load engineering procedures.
The catalog and Storybook authoring conventions load for their stated tasks.
An article's applicable prerequisites remain mandatory, including all four
architecture tutorials for complete feature-installation recipes. Reading links
is conditional on their contract, not recursive ingestion of every linked index.

```text
root policy + applicable area baseline
  -> guide classify/select/expand protocol
  -> route explicit concerns + declared prerequisites (metadata only)
     -> full authoritative articles / applicable MDX / skills
        -> exact current source, callers and relevant examples
  -> broader live search / overview when uncertain or scope expands
```

## Rule and source owners

| Owner                                                                                                                                               | Responsibility after this change                                                                             |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [Root](../../AGENTS.md)                                                                                                                             | Universal approval, authorization, review, resource, routing and completion gates                            |
| [Frontend](../../frontend/AGENTS.md), [backend](../../backend/AGENTS.md)                                                                            | Concise area baseline and explicit concern triggers                                                          |
| [Guide workflow](../../frontend/docs/development-guide/README.md)                                                                                   | Classify, select, read, expand, resolve gaps and verify; maintenance owner                                   |
| [Engineering coordination](engineering-workflow.md)                                                                                                 | Preserved specialist knowledge, dispatch, sequencing and handoffs                                            |
| [Catalog](../../frontend/docs/development-guide/CATALOG.md)                                                                                         | Relocated full bilingual links; original handbook metadata stays authoritative                               |
| [Storybook router](../../frontend/docs/storybook/README.md) and [authoring](../../frontend/docs/storybook/CONTRIBUTING.md)                          | All tutorial categories and conditional authoring/fixture/ID conventions                                     |
| [Existing index](../../frontend/scripts/development-guide-index.mjs) and [supplemental routes](../../frontend/scripts/development-guide-routes.mjs) | One scanner/search plus opt-in selector/dependency retrieval; handbook metadata derives existing catalogs    |
| [Tests](../../frontend/scripts/tests/development-guide-index.test.mjs), [verifier](../../frontend/scripts/verify-development-guide.mjs)             | Preserved discovery tests, route scenarios/integrity, complete paired catalog links and router links/anchors |

The paired source-map articles now describe concern-scoped architecture reading.
PersistedInbox names its four architecture prerequisites explicitly for that
complete installation. No tutorial body, CSF title/export, application registry,
translated catalog, lockfile or production source is redesigned. Source examples
inspected include Settings public exports/page composition, installed form inputs,
empty runtime/Signal registries and the injected documentation-only Contacts
factory. Historical peer provenance remains distinct from current local paths.

## CLI and failure behavior

Run from the root with the declared Node 24 launcher (or the equivalent existing
`npm --prefix frontend run guide:index -- ...` with Node 24/npm 12 active):

```sh
bash backend/scripts/with-local-node.sh frontend/scripts/development-guide-index.mjs route styling
bash backend/scripts/with-local-node.sh frontend/scripts/development-guide-index.mjs route forms notifications
bash backend/scripts/with-local-node.sh frontend/scripts/development-guide-index.mjs route header-tabs backend-feature migration localization
bash backend/scripts/with-local-node.sh frontend/scripts/development-guide-index.mjs route --list backend
bash backend/scripts/with-local-node.sh frontend/scripts/development-guide-index.mjs search session csrf --limit 10
bash backend/scripts/with-local-node.sh frontend/scripts/development-guide-index.mjs
```

Selectors are explicit IDs/aliases, not inferred natural-language keywords.
`topic:<catalog-topic-id>`, `category:<catalog-category-id>` and exact article IDs
cover all handbook owners; broad topic/category loads are opt-in. Multiple keys
union prerequisites without truncation. Unknown/ambiguous selectors, including
one unknown in a mixed selection, fail visibly. A miss requires broader discovery
and the existing approval gate for a confirmed gap, conflict or departure.

The old search remains AND substring matching across title/path/metadata/body,
with deterministic weighted ranking, `--limit`, total counts and truncation.
Paired Croatian copies stay inventoried and ordinary search deduplicates them;
`rg -n` over inventoried trees supports translation/fixture audits. Route returns
canonical metadata without scanning article/fixture/source bodies. No-argument
inventory and full-text diagnostics retain their existing coverage, unfollowed
symlink and nonexecuting-example boundaries.

## Scenario selections and limits

Every scenario includes root policy, the guide protocol and applicable area
baseline. Lists below identify selected documents/procedures; `route <keys>`
prints their complete canonical prerequisite lists. New concerns discovered by
source tracing must be selected before changing that owner. Source inspection
pointers do not authorize broad source ingestion or implementation execution.

| Scenario                                    | Selectors / selected document examples                                                                                                                                                                                                                             | Selection reason and excluded automatic work                                                                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1. Isolated button spacing/shape            | `styling`: frontend baseline + exact installed component/callers                                                                                                                                                                                                   | No owner/import/state/preference change; no four-tutorial bundle or unrelated Contacts feature                                      |
| 2. Existing form validation                 | `forms`: EntityForms, schema/choice, entity-mode, cross-field/reset contracts; add `notifications`, `confirmations` or `data` when affected                                                                                                                        | Validation and command/feedback concerns compose; no page-layout tutorials by default                                               |
| 3. CRUD across UI/API/schema/locales        | `header-tabs forms notifications backend-feature migration localization agent`: route/page and shell skills, HeaderTabs, EntityForms, HTTP feature/data/auth/testing recipes, package/errors/API, Flyway/resource scope, localization and engineering coordination | New registration/public/runtime, authority and persistence obligations remain; unrelated layouts are excluded                       |
| 4. Layout alternatives                      | `left-navigation` vs `standalone` vs `navigation-chooser`: matching MDX + route skill and route/page contracts; sidebar adds shell skill                                                                                                                           | One requested layout; other layout MDX is not automatically selected                                                                |
| 5. Session/CSRF bug                         | `session`: client AuthenticationAndHttp, frontend auth/data contracts, backend lifecycle/package baseline and HTTP/real-Postgres verification guidance                                                                                                             | Both authority producers/consumers and negative paths; execution still follows security review and root checks                      |
| 6. Provider/runtime or public export        | `runtime public-api`: RuntimeAndState, PublicModuleApis, dependency, interface, lifetime, Query/state contracts and actual construction/callers                                                                                                                    | Full applicable architecture; approval still required for departures                                                                |
| 7. Tutorial authoring/reorganization        | `storybook` plus subject key: CONTRIBUTING, maintenance workflow, subject MDX/CSF/fixtures, catalog/locale/ID conventions                                                                                                                                          | Authoring conventions triggered; story IDs, isolated providers and production boundaries retained                                   |
| 8. Runner or deployment backup              | `ci` vs `backup`: CI operator/consumer contract/engineering coordination vs release/setup/durable backup/restore/migration recovery                                                                                                                                | Shared-pool privilege/fresh-host and artifact/recovery gates preserved; no frontend architecture bundle                             |
| 9. Read-only route explanation              | `header-tabs` or exact existing layout: route/page contracts, matching MDX/skill and current registry/page/callers                                                                                                                                                 | Read-only skill branch; check pointers do not require an implementation suite                                                       |
| 10. Ambiguous/novel task                    | `route --list <owner>`, broader separate searches and current source                                                                                                                                                                                               | No plausible selector means broaden first; confirmed missing/conflicting pattern stops affected implementation for Bruno's approval |
| 11. New owner found mid-task                | Initial `header-tabs`, then union with `session`, `endpoint`, `migration` or other discovered concern                                                                                                                                                              | Prior applicable reading retained; new owner read before edits; independent approved work can continue                              |
| 12. Canonical/translation/fixture collision | Canonical selector, e.g. `forms`; existing search and `rg` inspect full matches separately                                                                                                                                                                         | Canonical route unaffected by fixture text or Croatian hits; full audit coverage retained                                           |

Routine check selection uses `verification`; the complete feature-test recipe
uses `testing` and retains its full architecture prerequisites. A regression
asserts that routine verification does not reintroduce that bundle. Draft-form
routing includes its full auth/testing/pinned-value/uncertain-write prerequisites.

Automated tests assert minimal styling/forms, each layout individually, CRUD
unions, security/runtime, Storybook/operations, read-only/expansion and negative
selection, alongside the pre-existing translation/fixture/discovery tests. The
verifier validates all current article/topic/category metadata, architecture
articles, actual tutorial MDX, skill paths, canonical-owner uniqueness,
allowed metadata values, prerequisites/cycles and local examples/check pointers.
It also retains full bilingual link completeness after the catalog move and
checks instruction/router local links and anchors.

## Measured reading footprint

These are **unique document byte counts**, not observed model usage or exact
token counts. Before uses tracked Git blob sizes at the baseline revision; after
uses current file bytes and `routeGuide(keys).routes.filter(r => r.path)` plus
root policy/guide. For every frontend scenario, before additionally includes the
old mandatory frontend/Storybook/source-map/four-tutorial chain. Moved coordination,
authoring and catalog documents map back to their original owner for before.
Both sets include the same selected unchanged concern contracts. Source-code
reads, CLI output, global instructions, further task-specific conditional reads
and model tokenizer effects are excluded. These conservative representative sets
measure removed loading edges, not every possible recursive read.

| Scenario (keys)                                                                              | Before bytes | After bytes | Reduction | After documents |
| -------------------------------------------------------------------------------------------- | -----------: | ----------: | --------: | --------------: |
| tiny-frontend (`styling verification`)                                                       |      120,871 |      31,442 |     74.0% |               4 |
| form-validation (`forms verification agent`)                                                 |      159,873 |      87,127 |     45.5% |               9 |
| cross-stack (`header-tabs forms notifications backend-feature migration localization agent`) |      451,260 |     410,502 |      9.0% |              43 |
| backend-endpoint (`endpoint agent`)                                                          |      123,435 |      92,514 |     25.1% |               7 |
| ci-runner (`ci`)                                                                             |      119,252 |      86,923 |     27.1% |               5 |
| backup (`backup`)                                                                            |      195,296 |     162,967 |     16.6% |               9 |

Reproduce the byte method with `git ls-tree -r -l <baseline>` for tracked blob
sizes, current file sizes and the index's exported `routeGuide` API. Deduplicate
paths, add root policy/guide, apply the old frontend chain above and map moved
files to their original owner. Classification remains an agent responsibility.
Large cross-stack tasks retain a large necessary reading set rather than
claiming savings by dropping security, schema or runtime contracts.

## Review and verification evidence

Independent instruction/routing review completed with no material findings left.
Review found and confirmed fixes for the routine-verification routing loop and
missing draft-form prerequisites; regression assertions cover both. A subsequent
unit failure exposed the relocated tutorial navigation links. All 24 original
MDX destinations now live in the on-demand catalog; independent review confirmed
their paths and selection semantics. The existing coverage test stayed intact.

Toolchain: Node 24.22.1, npm 12.0.2. Commands ran sequentially through the local
`repo-verification` helper against this uncommitted working-tree candidate at
baseline `2a8014d4d8fea6f3edc8612788326d0f204c1cba`. Receipts' Git status fingerprints
identify status snapshots only, not file-content hashes or reusable proof.

| Command (from workspace root)                                                                                                  | Result                                                                                                        | Seconds | Private log                                       |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ------: | ------------------------------------------------- |
| `npm --prefix frontend run verify`                                                                                             | Initial run: format, lint, architecture, guide and types passed; unit 616 passed / 1 failed; builds unreached | 109.622 | `/tmp/repo-verification-1000-tiatc_3p/output.log` |
| `bash backend/scripts/with-local-node.sh --test --test-isolation=none frontend/scripts/tests/development-guide-index.test.mjs` | Passed: 23 explicit index/routing assertions                                                                  |   0.312 | `/tmp/repo-verification-1000-teq54lfo/output.log` |
| `npm --prefix frontend run verify:dev-guide`                                                                                   | Passed after catalog fix: paired articles/labels/provenance/links plus route integrity and discovery suite    |   3.599 | `/tmp/repo-verification-1000-ear2ilpt/output.log` |
| `npm --prefix frontend run test -- tests/storybook/handbook/referenceCatalog.test.ts`                                          | Passed: all 7 affected tests; resolves the sole initial unit failure                                          |   4.319 | `/tmp/repo-verification-1000-w7_6fg3m/output.log` |
| `npm --prefix frontend run build`                                                                                              | Passed: TypeScript and production bundle                                                                      |  18.380 | `/tmp/repo-verification-1000-na2su3xj/output.log` |
| `npm --prefix frontend run build-storybook`                                                                                    | Passed: documentation/MDX bundle                                                                              |  18.356 | `/tmp/repo-verification-1000-aiterzrp/output.log` |

Final candidate evidence combines the initial unaffected passing checks with the
catalog-dependent reruns and previously unreached builds. The verification
coordinator confirmed that the focused reader suite covers the catalog-only fix;
the entire unit suite was not repeated. Default Node process-isolated output
summarized one test file; the separate in-process invocation above exposed all
23 passing assertions. Final changed-file formatting and `git diff --check` are
recorded with the completion handoff.

Browser/backend suites, remote CI and live acceptance were not run: production
behavior, fixtures, story IDs and data/security contracts were unchanged. A
Storybook build validates compilation, not browser interactions or backend
security. No merge, deployment or external publication occurred.

## Remaining limits

Links and routing tests cannot prove an agent classified every concern, read the
selected text or understood a semantic contract. Explicit triggers, baseline
rules, negative-case expansion and independent review remain necessary.
Metadata integrity detects absent/moved local targets and unrouted articles,
tutorials/skills; it cannot establish whether every prerequisite condition is
semantically sufficient. Advanced full-feature recipes intentionally retain
their full prerequisites. No rendered story or application behavior changes;
browser/manual accessibility, backend integration, remote CI and live acceptance
remain separate evidence when their owners are affected. No architectural
departure was required or self-approved for this optimization.
