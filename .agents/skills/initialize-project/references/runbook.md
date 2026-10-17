# Initialize a project from this template

This is the authoritative map of application identity edits and setup owners.
The repository-local
[initialize-project skill](../SKILL.md) owns
execution and maturity/learning behavior. Its
[initialization contract](./contract.md) owns written preparation,
protected operator inputs, readiness, approval, local resume state and full
acceptance. Before fresh initialization, use the
[preparation guide](./preparation.md) to complete and review developer preparation
in Client Discovery. Supply the production project ID to the skill; it captures
the reviewed private workbook automatically. Existing manual workbooks remain
valid. Browser drafts are not authority; the skill reads the reviewed workbook.

Full setup includes local development, shared CI/main protection, DNS, private
images, two real paired deployments and verified recovery under one approved
consumer scope. An explicitly requested personalization-only task stays local.
Make scoped edits directly; no renaming generator or runtime identity framework
is required. Shared host rebuilds, foundation installation/upgrades and data
replacement remain separately approved operator work, not initialization effects.

## 1. Confirm the target and identity

### Advisory phase inspection

Before a task is selected on a bare skill invocation, run the standalone
`scripts/project-status.mjs` from this package. The
[status contract](./project-status.md) owns its production profile, remembered
project association, preparation and scope classifications, and next-action
report. No provider probes or project mutations run during inspection.
`--remember` records only the explicitly supplied project/source/repository in
ignored `.template-initialization/discovery-project.json` (0700 directory,
0600 file), preserving prior captures and setup evidence. Missing credentials,
API/schema incompatibility and identity conflicts are distinct unknown/error
states. Verify with the package's preparation and contract tests, portable
installation, then dashboard generation/freshness. Consumer initialization below
starts only after that task has been selected.

Read the root and scoped agent guides. Inspect the actual files listed below,
the working tree, and the consumer's Git remote. GitHub copies template files
unchanged; the new repository name is only a suggested slug, not approval to
rename the project. Missing Git metadata or an unverified repository blocks
readiness; report it instead of guessing the target. Preserve unrelated changes.

Read the complete private preparation workbook and resolve the account/operator
references from its selected protected profile. Verify identity, permissions,
credentials and current operator source/receipt. Missing answers or access
produce a private readiness report, not a configuration interview. Prefer scoped
authentication so another project's global CLI account stays unchanged.

Validate the written identity answers against these constraints:

| Input             | Example              | Rule                                                                                                                                                                                          |
| ----------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project slug      | `inventory-portal`   | 3-40 lowercase ASCII letters/digits separated by single hyphens; start with a letter. This satisfies both application names and deployed project paths.                                                                                       |
| Display name      | `Inventory Portal`   | Nonempty human-readable product name. Keep it the same across locales unless localized names are supplied.                                                                                    |
| Java base package | `com.acme.inventory` | Explicit dotted namespace of lowercase ASCII Java identifiers; each segment starts with a letter; exclude Java keywords. This is the application's package, not just its organization prefix. |
| PWA short name    | `Inventory`          | Use the display name if it is at most 12 characters; otherwise obtain an approved short name.                                                                                                 |

Derive these values consistently:

| Setting                                    | Derivation                                  | Example                                 |
| ------------------------------------------ | ------------------------------------------- | --------------------------------------- |
| Frontend package                           | `<slug>-frontend`                           | `inventory-portal-frontend`             |
| Gradle root project and Spring application | `<slug>-backend`                            | `inventory-portal-backend`              |
| Gradle group                               | Java base package                           | `com.acme.inventory`                    |
| Local Compose project                      | `<slug>-local`                              | `inventory-portal-local`                |
| Default local database and database user   | Slug with hyphens replaced by underscores   | `inventory_portal`                      |
| Java source directory suffix               | Java base package with dots replaced by `/` | `com/acme/inventory`                    |
| Java main class                            | `<java-base-package>.BackendApplication`    | `com.acme.inventory.BackendApplication` |

Escape supplied display names for each destination's JSON, HTML, TypeScript,
Groovy, or Markdown syntax rather than interpolating unescaped text.

**Done when:** the workbook authorizes the validated identity, the live target
is this private consumer rather than the canonical template, and current
written authority/readiness covers the resolved plan.

## 2. Establish the data and resume boundary

Check whether the consumer already has an identity recorded in its README or
configured in the application. If requested values already match, verify them
instead of rewriting. For an incomplete initialization with that same identity,
finish only the missing changes. A different existing consumer identity is a
later rename: report the boundary and require separately authorized scope.
Completed consumers retain their accepted setup; a missing new preparation
file does not authorize reinitialization or invalidate existing acceptance.

Check for existing local environment files and Docker resources using names and
labels, without printing environment values. Changing the Compose project name
changes its generated volume/network names; it does not rename or migrate a
database. New database/user settings also do not change an initialized PostgreSQL
volume.

For a fresh clone, update the committed environment example before generating
local credentials or starting PostgreSQL. If a local database or an existing
environment file uses the old identity, report the mismatch and require a
written decision before changing identity or starting another database. Preserve
existing passwords, volumes, and data. Data migration, volume deletion, and
password resets are outside this runbook.
Resolve known mismatches during preparation/readiness. A newly discovered mismatch
during execution blocks the affected phase until safely reconciled within the
approved scope; it is not permission to reset data.

**Done when:** initialization can proceed without replacing an existing identity
or hiding an existing database behind newly generated resource names.

Inspect both repository-derived GHCR package names before authorizing writes.
An existing package owned by another repository is a preserve/block boundary,
not an implicit takeover. Follow the preparation guide's exact replacement rows,
version counts, digest-loss acknowledgement and conditional CLI authorization
before any approved deletion. Preserve repositories, credentials and data.

## 3. Replace application-owned values

The following is the current replacement map. Read each field before editing;
if the layout differs, locate its owner and report the difference. Use exact
fields and package-prefix changes, not a global replacement of `RGO`, `backend`,
or `vireocode`.

### Backend and local infrastructure

Paths in this table are relative to the workspace root.

| File or surface                                                                                                                                                     | Template value                                                                | Consumer change                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [backend/settings.gradle](../../../../backend/settings.gradle)                                                                                                               | `rootProject.name = 'backend'`                                                | Set `<slug>-backend`. Keep the physical `backend/` folder.                                                                                                                                                                                     |
| [backend/build.gradle](../../../../backend/build.gradle)                                                                                                                     | `group = 'com.vireocode'`; description `VireoCode Web App Starter backend`    | Set group to the approved Java base package and description to `<display name> backend`. Preserve versions, plugins, and dependencies.                                                                                                         |
| [backend/src/main/resources/application.yaml](../../../../backend/src/main/resources/application.yaml)                                                                       | `spring.application.name: vireocode-backend`                                  | Set `<slug>-backend`. Preserve `/api`, profiles, datasource placeholders, session/security settings, and Hibernate validation.                                                                                                                 |
| [backend/compose.yaml](../../../../backend/compose.yaml)                                                                                                                     | `name: vireocode-web-app-starter-local`                                       | Set `<slug>-local`. Keep the `postgres` service and `postgres-data` volume key; Compose scopes their resources by project.                                                                                                                     |
| [backend/.env.example](../../../../backend/.env.example)                                                                                                                     | `POSTGRES_DB=vireocode`; `POSTGRES_USER=vireocode`                            | Set both to the underscore-form slug. Keep passwords empty and retain the initial-user defaults unless the user requests different local account details.                                                                                      |
| [backend/src/main/java/](../../../../backend/src/main/java/) and [backend/src/test/java/](../../../../backend/src/test/java/), each with the template suffix `com/vireocode/backend/` | Package prefix `com.vireocode.backend`                                        | Move all owned Java files into the approved package's directory under each source root; update package declarations, imports, and qualified references. Retain relative `auth` and `user` subpackages and the `BackendApplication` class name. |
| [`.vscode/launch.json`](../../../../.vscode/launch.json) | `mainClass: com.vireocode.backend.BackendApplication` | Set the qualified main class. Omit the optional `projectName` for this single backend: the IDE import name can differ from Gradle's root name. Preserve both configurations, tasks, working directories and `local` profile. |

Keep the physical `frontend/` and `backend/` folders, Flyway migration filenames
and SQL schema, database table names, and authentication endpoint/DTO contracts
unchanged. Delete only empty old Java package directories after all their owned
files have moved.

Preserve local ports unless there is a confirmed collision. If a port change is
needed, keep its launch/task/proxy and documented references consistent.

### Frontend identity

| File or surface                                                                                                                                                                                                                                                                                                                                                                | Template value                                                         | Consumer change                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [frontend/package.json](../../../../frontend/package.json)                                                                                                                                                                                                                                                                                                                              | `name: rgo-frontend-template`                                          | Set `<slug>-frontend`; retain dependency names and versions.                                                                                                                                 |
| [frontend/package-lock.json](../../../../frontend/package-lock.json)                                                                                                                                                                                                                                                                                                                    | Top-level `name` and `packages[""].name` are `rgo-frontend-template`   | Align both with the frontend package name. Keep the dependency graph and integrity data unchanged; if using npm to refresh the lockfile, inspect and discard unrelated task-generated churn. |
| [frontend/index.html](../../../../frontend/index.html)                                                                                                                                                                                                                                                                                                                                  | `<title>RGO application</title>`                                       | Set the display name; retain the app entry point and asset references.                                                                                                                       |
| [frontend/public/manifest.json](../../../../frontend/public/manifest.json)                                                                                                                                                                                                                                                                                                              | `name: RGO application`; `short_name: RGO`                             | Set the display and approved short names. Preserve `id`, `start_url`, `scope`, and icon entries; naming is not a routing change.                                                             |
| [translation.en.ts](../../../../frontend/src/app/localization/translations/translation.en.ts), [translation.hr.ts](../../../../frontend/src/app/localization/translations/translation.hr.ts), [development-guide.en.ts](../../../../frontend/src/app/localization/translations/development-guide.en.ts), [development-guide.hr.ts](../../../../frontend/src/app/localization/translations/development-guide.hr.ts) | `navigation.shellTitle` contains `RGO application` or `RGO aplikacija` | Set the approved display name in all four catalogs. Keep translation keys and localized page labels.                                                                                         |

### Brand assets

The header's `Brand` in
[AppShell.tsx](../../../../frontend/src/app/shell/components/AppShell.tsx) uses `alt="RGO"`
and the bundled RGO symbol assets. The favicon and PWA icons also contain template
branding. A new display name alone does not provide new artwork.

If replacement artwork is supplied, update its accessible name, header symbols,
favicon, and both installed-app icons together, retaining light/dark readability
and valid asset references. If it is not supplied, retain the existing artwork
and its accurate alternative text and report branding as deferred. Preserve
framework attribution and license notices in either case.

### Tests and documentation

Update only identity-dependent expectations in:

- [AppAuthFlow.test.tsx](../../../../frontend/tests/integration/auth/components/AppAuthFlow.test.tsx):
  document-title suffix.
- [application.spec.ts](../../../../frontend/tests/browser/application.spec.ts):
  document-title suffix.
- [documentation.development.spec.ts](../../../../frontend/tests/browser/documentation.development.spec.ts):
  English and Croatian document-title suffixes; retain localized page titles.

Search the remaining owned tests for additional identity-dependent expectations.
Keep mock identities and demo credentials unchanged: they are authentication
fixtures, not project branding.

Update the [root README](../../../../README.md) title and introduction for the consumer.
Add a compact **Project identity** section recording the approved slug, display
name, Java base package, and PWA short name. Update the
[frontend README](../../../../frontend/README.md) application heading and any
consumer-specific build/JAR examples to match the new Gradle artifact name.
Keep working setup and verification instructions and retain a link to this
runbook. This runbook's template values and example consumer remain reference
material; they are not leftovers to replace.

**Done when:** every mapped surface matches the approved identity or has a
specifically reported deferral, and source directories, Java declarations,
Gradle identity, launch configuration, and tests agree.

## 4. Verify the consumer

Use existing tooling and the repository's configured checks. Run commands from
the indicated directories; Docker must be available for backend tests.

From `backend/`:

```sh
./gradlew test bootJar
```

From `frontend/`:

```sh
npm run verify
npm run test:browser -- tests/browser/application.spec.ts --grep 'supports keyboard navigation|offers the account menu' --reporter=list
npm run test:browser:development -- tests/browser/documentation.development.spec.ts --reporter=list
```

Restore dependencies only when a chosen check reports them missing. Use `npm ci`
for the existing lockfile; keep dependency upgrades outside initialization.

On Linux, inspect available inotify capacity during local readiness. If Vite
exits before startup with an `ENOSPC` file-watcher error, retry that exact check
with `CHOKIDAR_USEPOLLING=true`. After verifying the retry, carry polling into the
consumer's frontend launch environment and local command when needed. Preserve
other projects and host limits; record the failed check and verified workaround
in private run evidence.

Search tracked/owned application files for the old Java package, package name,
Spring/Compose names, and application-title strings. Exclude dependencies,
generated build/test output, environment secrets, and Git internals. Classify
every residual match: retained runbook examples, framework references,
attribution, mock fixtures, or deferred artwork are legitimate. Unexplained
application-identity leftovers are incomplete work.

Validate that the Java launch configuration points to the new main class and
owned source; keep the frontend launch configuration usable. With VS Code Java
tools available, launch through them after project import. If they are unavailable,
report the IDE launch check as unverified rather than claiming JSON inspection
proves it.

For a fresh local setup, follow the root README's existing credential/database
steps. The local credential helper is unrelated to renaming and stays unchanged.
Check that the frontend runs in HTTP mode against `/api`; an existing
`.env.local` may still select mocks. Exercise initial login, refresh, and logout
through the real backend, and confirm the visible document/installed-app names.
Handle credentials through local files or secret interfaces, not committed
documents or the final report. Stop only processes started for verification and
retain the local database volume.

**Done when:** builds/tests pass, the replacement audit has no unexplained
leftovers, and local runtime/IDE results are recorded. Missing prerequisites or
failed checks are explicit blockers, not successful verification.

## 5. Configure shared CI access

GitHub's template creation copies repository files, not runner access, variables,
secrets, branch protections, or environment settings. Obtain the consumer's exact
GitHub `owner/repository`, approved project slug, and selected shared CI operator.
For the organization maintained here, the permanent foundation source belongs to
`vireocodedev/web-app-starter`; experimental repositories are not dependencies.

The detailed install-once and registration procedures live in the
[shared CI operator guide](../../../../infrastructure/ci/README.md). Read it before any
runner operation. Consumers inherit its source files but **register for the
existing pool**, rather than reinstall it or create an app-specific permanent
runner.

Give the operator this nonsecret registration input, substituting the consumer's
values:

```json
{
  "slug": "inventory-portal",
  "repository": "your-org/inventory-portal"
}
```

If the shared host does not yet exist, the operator follows
[Hetzner provider access](../../../../docs/hetzner-provider-access.md) to establish a protected
project API credential, verified server/image/SSH identity, and exact rebuild
scope. This is an install-once bootstrap prerequisite, not a cloud credential
requirement for every consumer. Apply those instructions to the selected host;
the current template host identifiers in that guide must not be reused blindly.

The operator must verify private repository identity, extend the protected
GitHub App installation's selected-repository access, register while the
controller is stopped/disabled/idle, and establish a fresh current-boot isolation
receipt before an approved activation. The single-repository format is
intentional: separate `frontend`/`backend` repository fields are not supported.
Keep the credential on the controller host, never in the consumer checkout or
workflow secrets. Do not request its value in chat.
The operator's installed source must already satisfy the reviewed transport,
isolation and activation prerequisites. A missing repair or privileged-source
upgrade blocks consumer readiness and belongs to a separately approved operator
change. Preserve certificate verification, memory limits, isolated Python imports
and the worker trust boundary. Historical template receipts do not establish
current source/configuration/boot-bound consumer readiness.
Follow [GitHub CI App setup](../../../../docs/github-ci-app.md) for the organization-owned App,
minimal permissions, protected PEM/metadata, automatic token renewal, and guarded
credential-free adapter preparation. Do not substitute a personal token into
the permanent controller interface.
If credential rotation removes repository access, preserve any registration/job
recovery evidence; an authorization-related `404` does not prove a runner was
removed. Follow the operator guide's interrupted-job recovery procedure.

Workflows route to `[self-hosted, Linux, X64, web-app-ci]`, with read-only PR token
permissions and no production/registry-write credentials. Labels select jobs;
the protected allowlist and repository-scoped JIT runners authorize repository
access. An empty GitHub runner inventory while idle is expected for this
disposable pool; verify a genuine job instead of installing a permanent runner
just to make that page nonempty.

Keep this app's Java 21 toolchain. The immutable worker baseline also contains
Node/npm and a validation JDK; select Java 21 inside the backend job using the
job-local tool cache described in the operator guide. Backend commands must run
from `backend/`, frontend commands from `frontend/`. Only root
`.github/workflows/` files execute in this monorepo; nested frontend workflow
examples do not establish active CI.

Verify the operator's current boot/source/configuration receipt, register this
consumer and repeat required validation. Record actual consumer workflow/check
names, run URLs and GitHub settings in its setup documentation rather than
treating configured labels or historical template acceptance as working CI.

**Done when:** the consumer's runner access is registered and current host
acceptance plus genuine repository CI are verified, or the precise pending
operator/workflow prerequisites are reported. Do not rebuild a host, enable
services, publish, or deploy as a side effect of identity personalization.
Full-mode registration/activation and deployments follow their explicit
approved contract and operator gates instead.

## 6. Configure GitHub CI and main protection

Follow [Monorepo CI and main protection](../../../../docs/github-ci.md) for root workflow paths,
change-selection rules, exact required-check naming, and the settings that
GitHub does not copy from a template. Keep the shared Hetzner runner selection;
changing a custom label also requires its operator registration and the
[actionlint label configuration](../../../../.github/actionlint.yaml).

Verify actual consumer backend-only, frontend-only, both-owner, and unrelated
PR results before claiming CI is working. Protect the selected integration
branch after the real `CI gate` check succeeds: require PRs with zero approving
reviews, bind the required check to GitHub Actions, require up-to-date branches,
enforce for administrators, and block force pushes/deletion. Record observed
run URLs, runner identity, effective policy, and a blocked/green mergeability
test. Keep publication/deployment credentials separate from PR jobs.
Omit unused reviewer and wait-timer fields when creating the default GitHub
environments; an explicit empty reviewer list can request unsupported private-plan
protection. Verify the resulting empty rules without an implicit paid upgrade.

**Done when:** the correct checks run on the consumer's authorized Hetzner pool
and the effective main policy is verified, or a concrete access/plan/run blocker
is reported. Copied workflow files alone are not activation evidence.

## 7. Establish environment DNS access

Obtain the consumer's exact production and staging hostnames and inspect their
authoritative nameservers and existing A/AAAA/CNAME records. Keep one HTTPS
origin per environment and the backend at `/api`. Consumers supply their own
names and selected host addresses; template hostnames are not defaults.

Follow [DNS project access](../../../../docs/hetzner-provider-access.md#dns-project-access-for-staging-and-production)
for the exact existing zone, provider credential boundary, guarded record writes,
and authoritative/recursive checks. A Cloud server token is not automatically
authorized for a zone in another project. Obtain the correct protected
credential rather than creating a duplicate zone or changing delegation.

**Current gate:** both template A records were created and verified against all
authoritative nameservers and two public recursive resolvers using the correct
DNS-project credential. [DNS acceptance](../../../../docs/acceptance/dns-acceptance.json) records the exact
changes. Local recursive `NXDOMAIN` was still observed at inspection time;
resolver/cache readiness is separate from successful authoritative writes.
The template's later container, routing, public TLS and backup activation is
recorded separately in [release acceptance](../../../../docs/acceptance/release-acceptance.json); DNS alone
did not certify those outcomes.

**Done when:** the intended records are verified at the selected existing
authoritative zone, with conflicts resolved and access/negative-cache blockers
reported. DNS success alone does not certify HTTPS or a deployed application.

## 8. Prepare whole-app release images

Follow [paired release setup](../../../../infrastructure/release/README.md). Keep separate
frontend/backend image boundaries but one matched release from the selected
tested commit. Supply the actual repository URL/source SHA, build both pinned
Dockerfiles, and run the restricted image smoke tests before publication.
Preserve the frontend's same-origin `/api` build configuration so staging and
production can use the same immutable image pair. Environment hostnames, DB
credentials, and production users belong in protected deployment provisioning,
not Docker contexts/images.

The current CI builds/smoke-tests each selected owner image independently.
The two manual entrypoints are
[Deploy staging](../../../../.github/workflows/deploy-staging.yaml) and
[Deploy production](../../../../.github/workflows/deploy-production.yaml), without a
component dropdown. Staging verifies/builds/publishes the pair; production
promotes the exact successful staging pair without rebuilding and requires
the same selected source SHA. Follow
[operator installation and activation](../../../../infrastructure/release/README.md#operator-installation-and-activation)
for all affected host files, workflow IDs, maintainer allowlist, public
`DEPLOY_CONTROLLER_CERT` variable, protected App/DB/account credentials,
port allocation, Caddy, backup schedule, source pins and recovery safeguards.
Do not place server credentials in PR CI or widen its host/private-network
access. Root execution validates actual manual run identity, not runner labels.

Before installation, reject collisions at every generated systemd unit path
and loaded unit name, including the deployment service, backup service and
backup timer. Check all containers, including stopped ones, for exact generated
names, as well as networks, volumes, ports and project directories. Compare the
shared App signer and release helpers with the approved operator source pin.
After preparation, verify exact configuration identities, unit bytes/hardening,
running database image/mount/isolation and protected account fields; retain
configuration, unit and proxy hashes before independent activation review.

For initial deployed accounts, follow
[one-time operator provisioning](../../../../infrastructure/release/README.md#one-time-deployed-user-provisioning).
Use the workbook's deliberate consumer account decision and separately generated
protected credentials rather than automatically seeding deployed users.
Use the current backend digest,
existing DB network, separate `PROVISION_USER_*` settings and explicit
`--provision-user` command under the environment lock; verify termination,
repeat safety and real HTTPS login. Keep provisioning credentials out of normal
app containers and preserve conflicts rather than resetting users.

Resolve the active digest under the environment lock and hold that lock through
the fresh production backup, provisioning, matching-repeat and postchecks.
Avoid nested locks; an operator transaction using the reviewed backup helper
must preserve its root, protected-path and `umask 0077` safeguards. Persist
exact task container names and ownership labels before creation, and reconcile
uncertain Docker responses before releasing the lock or retrying. Recovery
cleanup must inspect the exact owned scratch name even after a lost creation
response; retain its intent and stop on uncertain ownership.

Use the consumer's explicit backup destination/risk decision and daily
time/timezone rather than inheriting a template exception or schedule.
Retention stays 30 days and staging remains unscheduled. Deployment, public
TLS, account installation, and initialized backup restoration require the
linked operator steps and actual acceptance; source implementation is not proof
that the corresponding host/remote settings exist.

**Done when:** the exact committed image pair passes real restricted runtime
checks and its immutable provenance is known, or the precise build/platform
blocker is reported. Working containers alone are not GHCR/deployment evidence.

Follow
[deployment operation](../../../../infrastructure/release/README.md#deploy-an-initialized-project)
and [recovery rehearsal](../../../../infrastructure/release/README.md#rehearse-recovery-without-touching-a-live-database)
for ongoing actions. Accounts, protected secret files, public certificate
variables, remote settings, host registration and backup evidence are specific
to each consumer, not inherited from historical template receipts.

## 9. Report the result

After initialization, a consumer with locked Client Discovery scope can use
[the specification handoff](../../../../docs/discovery-specification.md).
Its package owns the source profile, output contract and verification procedure;
credentials are developer-local and independent of this consumer's admin account.
Keep generated client data outside the public dashboard's source directories.
This optional next step does not add requirements to completed initialization.

Return the approved identity, changed surfaces, commands and outcomes, and any
blocked checks or deferred artwork. Point to local setup instructions without
revealing credentials. For personalization-only scope, leave changes uncommitted
unless a commit is requested; publication/deployment need separate approval.
For full `/initialize-project` scope, perform the approved commits/PRs and remote
actions, and require every acceptance phase in the
[contract](./contract.md#completion-and-rehearsal) before reporting
ready. Record consumer-specific evidence, not copied template receipts.
Include the shared CI registration/verification state without treating a
template copy as inherited GitHub access.

**Done when:** the consumer can distinguish completed personalization, verified
full initialization, and blocked/remaining work without relying on a generic
"setup complete" claim. Unverified required checks cannot be waived by reporting.

## Codex skill registration

Codex in VS Code discovers the complete [project skill](../SKILL.md) under
`.agents/skills/initialize-project/`. Its `agents/openai.yaml` provides the picker
label and explicit invocation policy. The workflow, references, capture helper and tests
all live in this one package; no global skill installation or credentials are
required for discovery.

Open this repository as the VS Code workspace and type `$initialize-project` in
Codex chat. A bare invocation reports the associated project's phase and offers
initialization/resume, readiness, specification generation or refreshed status.
It asks for a production project ID when no association is known. Including a
concrete task proceeds directly. `/initialize-project` applies to agents with
skill slash commands and uses the same status and task selection.
If Codex's skill picker is stale, run **Developer: Reload Window** and start a
new Codex chat. Verify that typing `$initialize` offers **Initialize project**,
and that selecting it refers to this repository's
`.agents/skills/initialize-project/SKILL.md`. A readiness-only request follows
the preparation checks and reports missing inputs without initializing the
consumer.

When installing elsewhere, copy this entire package, including `agents/`, into
`.agents/skills/initialize-project/`, excluding `node_modules`. Verify bare
invocation reports status before waiting for task selection, a concrete
initialization request reaches the saved-workbook gate, and readiness only stops
after the private report. A status request creates no workbook or readiness
report and makes no scope-export request.

## Project documentation dashboard

The skill owns the generic preparation, contract, runbook and
[rehearsal lessons](./rehearsal-lessons.md). Keep consumer identity, operating
instructions and sanitized acceptance under `docs/`; keep private inputs and
readiness reports under ignored `.template-initialization/`. The short
`docs/template-initialization.md` entry point links here instead of duplicating
the generic procedure. Add consumer-specific setup decisions there when needed.

Documentation generation has its own dependency graph and lockfile:

```sh
npm --prefix .agents/skills/initialize-project ci
npm --prefix .agents/skills/initialize-project run browser:install
npm --prefix .agents/skills/initialize-project run docs:build
npm --prefix .agents/skills/initialize-project run verify
npm --prefix .agents/skills/initialize-project run test:portable-install
```

Browser tests use the skill's pinned Playwright and Chromium for the offline
reference dashboard, including navigation, filters, mobile and accessibility.
Browser installation is a test prerequisite only; capture itself needs neither Playwright nor npm.
CI installs the browser under its disposable runner temporary directory.
The portable-install check copies only the skill into a temporary Git worktree,
installs its own lockfile and verifies generated docs and browser flows.
Template-only application/CI/receipt/pointer tests are explicitly inapplicable
there; the full template verification still requires them.

After editing any bundled reference, top-level `docs/*.md` or
`docs/acceptance/*-acceptance.json`, regenerate and commit both derived pages:
`docs/project.html` combines public consumer sources and skill references;
`web/reference.html` in the skill includes only bundled references. Neither
loads private state or remote assets. The reference page remains unrecorded/not
ready, even when a consumer's dashboard reports completion.

The capture helper needs no npm dependencies. A portable installation copies
only this skill directory (excluding `node_modules`) into `.agents/skills/` of
a consumer and ignores `/.template-initialization/`. Its affected files are
`scripts/fetch-preparation.mjs`, `scripts/preparation/model.mjs`, the pinned
`references/preparation-contract.json` and blank `references/preparation.md`.
Required inputs are the production project ID, protected administrator profile,
reviewed revision and verified consumer Git remote. The agent captures the
workbook and provenance automatically before readiness; explicit refresh is
required for changed pinned input, and initialized acceptance is preserved.
Verify with synthetic HTTP/profile/private-file tests and the complete/plan
render/hash fixtures mirrored in Client Discovery's backend. Runtime capture
never depends on the sibling Discovery specification package. Full initialization
still requires the template application, infrastructure and operator prerequisites.

**Done when:** isolated skill tests and documentation freshness checks pass;
private inputs are excluded, reference links work, and consumer status comes
only from that consumer's acceptance evidence.
