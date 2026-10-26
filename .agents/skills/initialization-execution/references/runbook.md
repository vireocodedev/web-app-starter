# Initialize a project from this template

This is the authoritative application identity replacement map and setup-owner
guide. The [execution skill](../SKILL.md) runs the approved phases; the
[contract](contract.md) owns readiness, scope, resume and acceptance. Complete
the sibling [intake skill](../../initialization-intake/SKILL.md) first.
Its private answers and confirmed scope replace external preparation workbooks.

Full setup includes local development, shared CI/main protection, DNS, private
images, two paired deployments and verified recovery. Local-only scope remains
local. Keep existing infrastructure and application owners; new foundation
installation, privileged upgrades and data replacement are separate work.

## 1. Confirm the target and identity

Before any initialization/readiness work, run:

```sh
node .agents/skills/initialization-intake/scripts/intake.mjs require-complete
```

A failed or unavailable gate means **STOP** and tell the user to finish
`$initialization-intake` before `$initialization-execution`. Do not substitute
legacy state or collect missing answers during execution. Read the passed
private state and record its revision/digest; recheck on resume and before writes.

Read root/scoped guides, inspect the actual Git worktree and preserve unrelated
changes. Confirm this is the intended private consumer rather than the canonical
template. Resolve approved operator/account references and recheck readiness
against live resources. Intake completion does not prove post-personalization
runtime acceptance. Keep execution reports in `.template-initialization/`.

Validate the completed intake identity answers against these constraints:

| Input             | Example              | Rule                                                                                                                                                                                          |
| ----------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project slug      | `inventory-portal`   | 3-40 lowercase ASCII letters/digits separated by single hyphens; start with a letter. This satisfies both application names and deployed project paths.                                       |
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

**Done when:** the completed intake authorizes the validated identity, the live target
is this private consumer rather than the canonical template, and current
confirmed scope/readiness covers the resolved plan.

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
explicit user decision recorded in intake before changing identity or starting another database. Preserve
existing passwords, volumes, and data. Data migration, volume deletion, and
password resets are outside this runbook.
Resolve known mismatches during preparation/readiness. A newly discovered mismatch
during execution blocks the affected phase until safely reconciled within the
approved scope; it is not permission to reset data.

**Done when:** initialization can proceed without replacing an existing identity
or hiding an existing database behind newly generated resource names.

Inspect both repository-derived GHCR package names before authorizing writes.
An existing package owned by another repository is a preserve/block boundary,
not an implicit takeover. Preserve conflicting packages and stop; registry replacement is separate
explicitly authorized work, not a normal initialization action. Preserve repositories, credentials and data.

## 3. Replace application-owned values

The following is the current replacement map. Read each field before editing;
if the layout differs, locate its owner and report the difference. Use exact
fields and package-prefix changes, not a global replacement of `RGO`, `backend`,
or `vireocode`.

### Backend and local infrastructure

Paths in this table are relative to the workspace root.

| File or surface                                                                                                                                                                       | Template value                                                                                             | Consumer change                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [backend/settings.gradle](../../../../backend/settings.gradle)                                                                                                                        | `rootProject.name = 'backend'`                                                                             | Set `<slug>-backend`. Keep the physical `backend/` folder.                                                                                                                                                                                     |
| [backend/build.gradle](../../../../backend/build.gradle)                                                                                                                              | `group = 'com.vireocode'`; description `VireoCode Web App Starter backend`                                 | Set group to the approved Java base package and description to `<display name> backend`. Preserve versions, plugins, and dependencies.                                                                                                         |
| [backend/src/main/resources/application.yaml](../../../../backend/src/main/resources/application.yaml)                                                                                | `spring.application.name: vireocode-backend`                                                               | Set `<slug>-backend`. Preserve `/api`, profiles, datasource placeholders, session/security settings, and Hibernate validation.                                                                                                                 |
| [backend/compose.yaml](../../../../backend/compose.yaml)                                                                                                                              | `name: vireocode-web-app-starter-local`                                                                    | Set `<slug>-local`. Keep the `postgres` service and `postgres-data` volume key; Compose scopes their resources by project.                                                                                                                     |
| [backend/.env.example](../../../../backend/.env.example)                                                                                                                              | `COMPOSE_PROJECT_NAME=vireocode-web-app-starter-local`; `POSTGRES_DB=vireocode`; `POSTGRES_USER=vireocode` | Set the Compose project to `<slug>-local` and database/user to the underscore-form slug. Keep passwords empty and retain initial-user defaults unless requested otherwise.                                                                     |
| [backend/scripts/start-local.mjs](../../../../backend/scripts/start-local.mjs)                                                                                                        | Fallback `COMPOSE_PROJECT_NAME`: `vireocode-web-app-starter-local`                                         | Set the fallback to the same `<slug>-local` as `compose.yaml` and `.env.example`, including when preserving an existing `.env` without that key.                                                                                               |
| [backend/src/main/java/](../../../../backend/src/main/java/) and [backend/src/test/java/](../../../../backend/src/test/java/), each with the template suffix `com/vireocode/backend/` | Package prefix `com.vireocode.backend`                                                                     | Move all owned Java files into the approved package's directory under each source root; update package declarations, imports, and qualified references. Retain relative `auth` and `user` subpackages and the `BackendApplication` class name. |
| [`.vscode/launch.json`](../../../../.vscode/launch.json)                                                                                                                              | `mainClass: com.vireocode.backend.BackendApplication`                                                      | Set the qualified main class. Omit the optional `projectName` for this single backend: the IDE import name can differ from Gradle's root name. Preserve both configurations, tasks, working directories and `local` profile.                   |

Keep the physical `frontend/` and `backend/` folders, Flyway migration filenames
and SQL schema, database table names, and authentication endpoint/DTO contracts
unchanged. Delete only empty old Java package directories after all their owned
files have moved.

Preserve local ports unless there is a confirmed collision. If a port change is
needed, keep its launch/task/proxy and documented references consistent.

### Frontend identity

| File or surface                                                                                                                                                                                                                                                                                                                                                                                                    | Template value                                                         | Consumer change                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [frontend/package.json](../../../../frontend/package.json)                                                                                                                                                                                                                                                                                                                                                         | `name: rgo-frontend-template`                                          | Set `<slug>-frontend`; retain dependency names and versions.                                                                                                                                 |
| [frontend/package-lock.json](../../../../frontend/package-lock.json)                                                                                                                                                                                                                                                                                                                                               | Top-level `name` and `packages[""].name` are `rgo-frontend-template`   | Align both with the frontend package name. Keep the dependency graph and integrity data unchanged; if using npm to refresh the lockfile, inspect and discard unrelated task-generated churn. |
| [frontend/index.html](../../../../frontend/index.html)                                                                                                                                                                                                                                                                                                                                                             | `<title>RGO application</title>`                                       | Set the display name; retain the app entry point and asset references.                                                                                                                       |
| [frontend/public/manifest.json](../../../../frontend/public/manifest.json)                                                                                                                                                                                                                                                                                                                                         | `name: RGO application`; `short_name: RGO`                             | Set the display and approved short names. Preserve `id`, `start_url`, `scope`, and icon entries; naming is not a routing change.                                                             |
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

### Local backend debugger

The backend tasks in [`.vscode/tasks.json`](../../../../.vscode/tasks.json) use
[`with-local-node.sh`](../../../../backend/scripts/with-local-node.sh) before
credential preparation and database startup. Keep Bash and the Node major from
`frontend/.nvmrc` installed. The launcher uses a matching Node on PATH or loads
an existing `${NVM_DIR:-$HOME/.nvm}/nvm.sh` to select that installed version. It
installs nothing and leaves the nvm default unchanged. A desktop-launched VS Code
may inherit an old system Node even when an interactive terminal uses nvm;
`Unexpected reserved word` at `setup-local.mjs`'s top-level `await` indicates that
runtime mismatch. Retry **Backend: local dev** after installing the required Node.

The tasks preserve `backend/.env`, start only its configured Compose project,
and verify PostgreSQL password authentication before Java launches. Container
health alone can pass for a reused volume with different credentials. Restore
matching credentials or use a separate `COMPOSE_PROJECT_NAME` and free
`POSTGRES_PORT`; preserve the existing volume. Keep the Compose identity aligned
across the files in the replacement map above, and use the same `.env` for
manual stop/start commands.

Verify runtime selection with
`python3 -B -m unittest discover -s infrastructure/ci/tests -p test_local_node.py -v`
and shell syntax with `bash -n backend/scripts/with-local-node.sh`. With Docker
available, run
`bash backend/scripts/with-local-node.sh --test --test-concurrency=1 backend/scripts/start-local.test.mjs`.
The persistent-volume regression creates a unique test project, rejects a
changed password despite healthy PostgreSQL, restores the original credentials
and checks that stored data survives. Cleanup removes only that test's resources.
Actual VS Code debugger acceptance still requires the imported Java project.

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
Use the intake's deliberate consumer account decision and separately generated
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

Business requirements and specification are subsequent work. The former
Client Discovery integration is not part of these initialization skills.
Do not require its account, project ID or exports to complete setup.

Return the approved identity, changed surfaces, commands and outcomes, and any
blocked checks or deferred artwork. Point to local setup instructions without
revealing credentials. For personalization-only scope, leave changes uncommitted
unless a commit is requested; publication/deployment need separate approval.
For full `/initialization-execution` scope, perform the approved commits/PRs and remote
actions, and require every acceptance phase in the
[contract](./contract.md#completion-and-rehearsal) before reporting
ready. Record consumer-specific evidence, not copied template receipts.
Include the shared CI registration/verification state without treating a
template copy as inherited GitHub access.

**Done when:** the consumer can distinguish completed personalization, verified
full initialization, and blocked/remaining work without relying on a generic
"setup complete" claim. Unverified required checks cannot be waived by reporting.

## Codex skill registration

Both complete sibling packages ship under `.agents/skills/`:
`initialization-intake/` and `initialization-execution/`. Their `agents/openai.yaml`
files provide picker labels and preserve explicit invocation. No personal/global
skill or external app account is required.

In the trusted consumer workspace, use `$initialization-intake` to select intake,
resume, status or explanation. A concrete intake request proceeds directly.
Once complete, explicitly use `$initialization-execution` to select execution,
resume or readiness; it must check the intake gate before any setup work.
Agents with skill slash commands use the same names with `/`.

If the picker is stale, reload the editor window and start a fresh chat. When
adopting elsewhere, copy both entire packages, excluding `node_modules`, intake
`state/` and execution evidence. Reconcile existing consumer evidence deliberately.
Never copy another consumer's answers or completion into a new project.

## Project documentation dashboard

Public references live in each skill's `references/` directory. Consumer setup
belongs in `docs/template-initialization.md` and sanitized acceptance records
under `docs/acceptance/`. Private intake is stored only in
`.agents/skills/initialization-intake/state/`; private execution evidence stays
in `.template-initialization/`. Neither is a dashboard input.

The execution package owns documentation dependencies and lockfile:

```sh
npm --prefix .agents/skills/initialization-execution ci
npm --prefix .agents/skills/initialization-execution run browser:install
npm --prefix .agents/skills/initialization-execution run docs:build
npm --prefix .agents/skills/initialization-execution run verify
npm --prefix .agents/skills/initialization-execution run test:portable-install
```

The intake helper uses Node core only and can resume without application
dependencies. The execution package's verification runs its sibling intake
behavior tests, public documentation/contract checks and offline Chromium
desktop/mobile checks sequentially. The portable check installs both packages
in an isolated Git consumer without frontend/backend or another skill.

After changing public docs or either skill's public references, regenerate
and commit `docs/project.html` and `web/reference.html`, then run `docs:check`.
The source loader selects only top-level `docs/*.md`, documentation acceptance
JSON and explicitly listed public reference directories, excluding all private
state and nested client artifacts. The bundled view contains references only;
the project view separates current consumer acceptance from historical receipts.
These offline pages are derived documentation, not live status or authority.

Automated checks prove the local state/gate and documentation contracts. Only
an authorized fresh consumer run can establish real local/CI/deployment/recovery
acceptance and a no-follow-up initialization experience.
