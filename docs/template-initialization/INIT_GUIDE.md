# Initialize a project from this template

Follow this numbered guide to a working local application, real CI, staging and
production deployments, initial accounts, and verified recovery. This is the
numbered procedure for developers and agents. Each script performs one explicit
step; invoking a later script does not approve an earlier or unrelated action.

## Prerequisite: create and open the consumer repository

Complete these steps before starting section 1:

1. On GitHub, open `vireocodedev/web-app-starter` and choose **Use this template →
   Create a new repository**. Create the consumer in the existing organization
   with **Private** visibility and `main` as its default branch. Choose its name
   using the project-slug rules in section 1.
2. Clone that newly created consumer repository to your local workstation, using
   the clone URL from its **Code** menu.
3. Open the cloned consumer folder in **VS Code**. Its integrated terminal must
   start at that repository's root.
4. Open `docs/template-initialization/INIT_GUIDE.md` in that checkout and start
   section 1 below.

You do not need a local checkout of `web-app-starter`. All initialization scripts
are already included in the consumer. Creating the GitHub repository and cloning
it to your workstation are prerequisites to initialization.

The supported full path uses **one private, organization-owned GitHub repository**,
the existing shared CI pool/GitHub App, and an existing operator-managed deployment
host. All template consumers use this same infrastructure. Its concrete App
installation, host and provider values remain in the
[CI App reference](github-ci-app.md) and
[provider-access reference](hetzner-provider-access.md).
Companion references and setup-only release entrypoints live under
`docs/template-initialization/`. They use the shared runtime modules under
`infrastructure/`; everyday local-development tools remain with their app owners.
Keep the Java/Spring and React/Vite stack. New servers, host rebuilds, a
second CI foundation, existing-consumer renames, password resets and live database
restores are separate work.

Use Python 3.11+ and Bash. Each public script is named `X_Y_name.ext`, matching
section `X` and subsection `X.Y` below. Private `_shared.py`, `_local.py` and
`_operations.py` modules support those entrypoints; they are not standalone steps.

The selected values live in ignored `.template-initialization/values.env`, copied
from [.env.example](.env.example). Scripts parse this file as data and never source
or evaluate it. Every script loads it independently; exported shell variables are
not required. Use `--env /absolute/path/values.env` when using a different location.

Commands run from the **consumer repository root** unless marked
otherwise. **Operator host** scripts run in the verified SSH session as the authorized
host operator, usually root; never run them in CI workers. Replace example values
first, run scripts separately, and stop on failure. `--help` describes each
script without performing its action. Do not run the mutating setup scripts in
the canonical template checkout.

For local-only setup, use an existing consumer checkout and follow the applicable
local parts of sections 1–10; skip remote authentication,
publishing and all operator actions. Record that scope in section 19. Full
initialization requires every applicable step and the completion checklist.
When resuming, verify the same repository/identity and continue at the first
unfinished step. Preserve existing environment files, databases and evidence.

## 1. Choose project values and access

Create the private values file, then edit every project-specific input there.
The env template retains the existing organization, SSH host, DNS zone and public
installation identifiers. Set `GH_ORG` and `PROJECT_SLUG` to the owner and name of
the consumer repository you already created and cloned. Choose unused, distinct
staging and production hostnames and the intended maintainer/account identity. Configure the
four candidate application ports and protected DNS credential-file reference in
that same file. Never add passwords or tokens; credentials stay in protected stores.
`REPOSITORY`, database/Compose names and the release branch are derived from these
inputs rather than repeated in later commands:

### 1.1 Create and edit the project values

```bash
python3 -B docs/template-initialization/scripts/1_1_prepare_values.py
```

Use a slug of 3–40 lowercase ASCII letters/digits separated by single hyphens,
starting with a letter. The Java application namespace must contain dotted,
lowercase, valid non-keyword identifiers. Keep the PWA short name at most 12
characters. Use the same display name across locales unless you deliberately
supply localized names. A username such as `admin` still has only the starter's
installed `USER` authority.

Settle the following before remote work:

| Prerequisite     | What to obtain                                                                                                                                                                                                                                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub           | The existing private consumer checkout, the intended organization-owner account with repository admin rights, Actions access, private branch-protection entitlement, selected-repository access to the existing CI App, and package publish/read access. Personal repositories are outside the current organization-based App/GHCR path. |
| CI operator      | Existing pool, canonical reviewed CI source/revision, current isolation acceptance, capacity and an idle maintenance window for registration.                                                                                                                                                                                            |
| Release operator | Existing supported Docker/Python/OpenSSL/systemd/Caddy host, verified SSH identity/host key, public IPv4 and four unused loopback ports. Caddy must already import `/etc/caddy/sites/*.caddy`.                                                                                                                                           |
| DNS              | Access to the existing authoritative zone for two distinct environment hostnames. A Cloud-server credential may not access the DNS project.                                                                                                                                                                                              |
| Private storage  | Password manager and protected operator storage outside Git. Local/staging/production passwords will be generated separately.                                                                                                                                                                                                            |
| Local resources  | Tools in step 2, free default ports 5173/8080/55436, and a preservation decision for any existing `.env` or database volume.                                                                                                                                                                                                             |
| Artwork          | Supplied shell/favicon/PWA artwork, or a deliberate deferral retaining current artwork. Keep the theme unless changing it is separately intended.                                                                                                                                                                                        |
| Recovery         | Current implementation: same-server production backups, 30-day retention, **03:00 Europe/Zagreb daily**, staging unscheduled. Explicitly accept server-loss risk or arrange a reviewed backup extension before claiming full readiness.                                                                                                  |

`GH_ORG` must match the existing pool's configured organization. An App installation
in another organization is not sufficient for this operator's adapter; arrange a
separately supported operator setup before choosing a different owner.

Keep private progress notes containing decisions, protected-file references,
completed steps and blockers. The ignored `.template-initialization/` directory
holds the private values and observations used by these scripts, plus optional progress notes. Keep passwords, keys, session cookies,
tokens and dumps out of tracked files, chat and screenshots.

The preparation script creates a mode `0600` file beneath a mode `0700`
directory and preserves an existing file. The GitHub login placeholder must be
replaced. Keep the env file and its companion observations outside tracked files.
Step 2.4 performs functional verification after the tools are installed.

**Done:** values, access owners and preservation/backup decisions are clear.

## 2. Prepare your workstation

Install Git, Bash, Python 3.11+, ripgrep (`rg`), GitHub CLI, JDK 21, Docker with Compose v2, and Node
24/npm 12 through your normal workstation tools. Use the included Gradle wrapper;
a system Gradle install is unnecessary. For an existing nvm installation:

### 2.1 Prepare Node with an existing nvm installation

```bash
bash docs/template-initialization/scripts/2_1_prepare_node.sh
```

Check versions and Docker access:

### 2.2 Check required tools

```bash
python3 -B docs/template-initialization/scripts/2_2_check_tools.py
```

Expected development majors: Java 21, Node 24, npm 12. Check current pins in
`backend/build.gradle`, `frontend/.nvmrc` and `frontend/package.json`. Docker must
be usable by your user for PostgreSQL, Testcontainers and image checks. Install
`dig` for DNS inspection. For VS Code use the recommended extensions later.

Authenticate with the intended GitHub account; retain an existing working login:

### 2.3 Authenticate the intended GitHub account

```bash
python3 -B docs/template-initialization/scripts/2_3_authenticate_github.py
```

### 2.4 Mechanically verify the selected values

```bash
python3 -B docs/template-initialization/scripts/2_4_verify_values.py --scope full --mode new
```

Both scopes require the local Git origin to match the configured consumer.
For local-only setup, call the same script with `--scope local`. It checks local
inputs and tools without requiring SSH, GitHub or DNS access. Text fields such as display names and emails receive syntax/length checks; the checker does not claim email delivery or business acceptance.
`--mode new` means first-time initialization of the existing repository with unused
deployment resources. It does not require an unused GitHub repository name.
When resuming recorded setup, use `--mode resume`; existing resources must match
the exact consumer identity and evidence rather than being treated as unused names.

Full verification checks value syntax, the authenticated GitHub identity and
access to the exact existing private consumer, read-only SSH connectivity with strict host-key checking,
the configured DNS credential's access to the exact zone, authoritative DNS and
hostname conflicts. `DNS_PROJECT_ID` identifies the existing Console project;
the zone API proves credential access through the zone ID/name and nameservers,
not through a returned Cloud project ID.
An absent, inaccessible or mismatched private repository, failed SSH connection,
DNS error, wildcard or conflicting record stops verification; a failed lookup is
never reported as an available name. Provider token contents are read only from
the protected file referenced by the values.

After every full check passes, the script records the observed numeric GitHub
repository ID in private `progress.json` and writes an env-hash-bound
`verification.json` beside the values file. Every later full verification checks
that same ID, including retries in `new` mode; resume cannot adopt an unrecorded
repository. Local-only verification writes no remote identity observation.
The observation expires after 24 hours; rerun verification for the
actual new/resume stage when it expires. Changed inputs invalidate that observation. Later scripts require
matching verified inputs, while installation operations retain their own
fresh collision checks. This is an observation, not a reservation or permission
to mutate the infrastructure. Selected-repository App grants and branch protection remain
an explicit requirement of its later stage.

**Done:** matching tools, Docker and intended GitHub access work.

## 3. Inspect the consumer checkout and begin initialization

Continue in the consumer folder already open in VS Code. Inspect its Git origin,
current branch and local changes before personalizing any application files. Full
scope also rechecks the private repository against the ID recorded by step 2.4:

### 3.1 Inspect the actual consumer checkout

```bash
python3 -B docs/template-initialization/scripts/3_1_inspect_checkout.py
```

Keep `main` as integration branch, or deliberately align GitHub's default and the
workflow triggers. Never initialize the canonical template itself. On resume,
check the recorded Project identity; an established different identity requires a
separate rename. Preserve unrelated changes and existing data.

### 3.2 Begin the initialization branch

```bash
python3 -B docs/template-initialization/scripts/3_2_begin_initialization.py
```

Read applicable `AGENTS.md` files and discovered guide articles before delegating
edits. The inventory command needs Node 24 but no application dependencies.

**Done:** the checkout is the intended private consumer and existing work is safe.

## 4. Personalize the backend before starting PostgreSQL

There is no installed personalization CLI. Edit these exact fields. Keep physical
`frontend/` and `backend/` folders, versions/dependencies, `/api`, auth contracts,
and Flyway migration filenames/SQL unchanged. Avoid global text replacement.

### 4.1 Edit the backend identity fields

```bash
python3 -B docs/template-initialization/scripts/4_1_edit_backend_identity.py
```

The edit scripts list the exact values from the verified env and open the
existing files when an editor is available. Use another editor if needed; review
the same fields below. They do not perform a global replacement. Add `--open` to the edit-script invocation to open the listed files in VS Code.

| File                                          | Value using the example identity                                                                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `backend/settings.gradle`                     | `rootProject.name = 'inventory-portal-backend'`                                                                                        |
| `backend/build.gradle`                        | `group = 'com.acme.inventory'`; description `Inventory Portal backend`                                                                 |
| `backend/src/main/resources/application.yaml` | `spring.application.name: inventory-portal-backend`                                                                                    |
| `backend/compose.yaml`                        | Top-level `name: inventory-portal-local`                                                                                               |
| `backend/.env.example`                        | `COMPOSE_PROJECT_NAME=inventory-portal-local`, `POSTGRES_DB=inventory_portal`, `POSTGRES_USER=inventory_portal`; keep passwords empty. |
| `backend/scripts/start-local.mjs`             | Fallback Compose project → `inventory-portal-local`.                                                                                   |
| `.vscode/launch.json`                         | Backend `mainClass` → `com.acme.inventory.BackendApplication`; keep the existing tasks, environment file and `local` profile.          |

Derive your names as `<slug>-backend`, `<slug>-local`, and database/user equal to
the slug with hyphens replaced by underscores. Escape text for each destination's
syntax. Preserve datasource placeholders and security/session configuration.

Refactor **both** main/test Java package roots from `com.vireocode.backend` to
`$JAVA_PACKAGE`, preserving all relative subpackages (`auth`, `user`, `http`, etc.)
and `BackendApplication`. Use IDE package refactoring or this command for a fresh,
still-template-named consumer:

### 4.2 Refactor the Java package roots

```bash
python3 -B docs/template-initialization/scripts/4_2_refactor_java_packages.py
```

Inspect the diff; do not rerun over a partially moved tree. Moving packages does
not change schema/table names or authorization contracts.

For existing `.env`/database resources, resolve identity first. A changed Compose
name creates a different namespace; it does not migrate a volume. Changed DB
settings do not alter credentials inside an initialized volume. Preserve matching
configuration or deliberately allocate separate project/port resources; deletion
or password reset is not the repair.

**Done:** Java paths/imports, Gradle, Compose defaults and debugger main class agree.

## 5. Personalize the frontend and documentation

### 5.1 Edit frontend metadata and names

```bash
python3 -B docs/template-initialization/scripts/5_1_edit_frontend_identity.py
```

| File                                     | Change                                                                                                                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `frontend/package.json`                  | `name` → `<slug>-frontend`.                                                                                                                                                          |
| `frontend/package-lock.json`             | Top-level `name` and `packages[""].name` → same name. Preserve graph/integrity data.                                                                                                 |
| `frontend/index.html`                    | `<title>` → HTML-escaped display name.                                                                                                                                               |
| `frontend/public/manifest.json`          | `name`/`short_name` → selected names. Preserve `id`, `start_url`, `scope`, icon references.                                                                                          |
| Both application translation files above | `navigation.shellTitle` → selected display name; preserve translation keys and localized page labels.                                                                                |
| Root/frontend README                     | Consumer title/introduction; root **Project identity** with slug, display name, Java namespace and short name. Update identity-dependent JAR examples, retaining setup instructions. |

Update title suffix expectations in these tests, preserving translated page
titles and mock credentials:

### 5.2 Update the title expectations

```bash
python3 -B docs/template-initialization/scripts/5_2_edit_title_expectations.py
```

Supplied artwork must cover the shell assets/accessibility name referenced by
`frontend/src/app/shell/components/AppShell.tsx`, favicon and both PWA icons,
including light/dark readability. Inspect current references first. For retained
RGO artwork keep accurate `alt="RGO"`, record deferred branding, and preserve
framework attribution/licenses.

**Done:** package metadata, visible names, title tests and documented identity agree.

## 6. Audit the personalization

Search owned source/config without reading secret or generated files:

### 6.1 Audit the identity changes

```bash
python3 -B docs/template-initialization/scripts/6_1_audit_identity.py
```

No matches is `rg` exit status 1, which is expected. Classify remaining matches:
reference examples, fixtures, attribution and retained artwork can be intentional.
Unexplained application-identity leftovers are unfinished. Preserve mock identities.

**Done:** intended diff only, with every residual identity reference explained.

## 7. Set up the local environment

Generate credentials after personalization:

### 7.1 Prepare private backend configuration

```bash
python3 -B docs/template-initialization/scripts/7_1_prepare_backend_env.py
```

This creates ignored `backend/.env`, mode `0600`, with random passwords and
preserves an existing file. Open it privately. Before the first backend startup,
confirm project/database names and local initial-user identity. Keep the generated
passwords (minimum 12 characters, maximum 72 UTF-8 bytes).

### 7.2 Prepare frontend dependencies and HTTP settings

```bash
python3 -B docs/template-initialization/scripts/7_2_prepare_frontend_env.py
```

For existing `.env.local`, the frontend setup script merges the known settings and preserves unrelated values:

The frontend setup script merges these public settings into `.env.local`: `VITE_API_BASE_URL=/api`, `VITE_API_MODE=http`, `VITE_API_WITH_CREDENTIALS=true` and `VITE_APP_ENV=development`.

Vite variables are public configuration. Keep secrets out. Confirm ignored files:

### 7.3 Verify private configuration is ignored

```bash
python3 -B docs/template-initialization/scripts/7_3_verify_ignored_env.py
```

**Done:** private local configuration has this checkout's identity; frontend uses HTTP.

## 8. Start and exercise the real local application

In the **backend terminal**, from repository root:

### 8.1 Start the backend and its database

```bash
python3 -B docs/template-initialization/scripts/8_1_start_backend.py
```

The helper starts loopback PostgreSQL (default 55436) and checks actual password
authentication. The `local` backend profile runs migrations and seeds the initial
user only when that username is absent. Editing `.env` later does not reset an
existing database or user's password.

In a **second terminal**, from repository root:

### 8.2 Start the frontend in a second terminal

```bash
python3 -B docs/template-initialization/scripts/8_2_start_frontend.py
```

Open `http://127.0.0.1:5173`. Privately read `INITIAL_USER_USERNAME` and
`INITIAL_USER_PASSWORD` from backend `.env`; verify login, navigation, reload/
session persistence and logout. Check both locales' names/titles. Mock credentials
are unrelated to this database. Optional nonsecret backend probe:

### 8.3 Check backend health

```bash
python3 -B docs/template-initialization/scripts/8_3_check_local_health.py
```

Use one hostname consistently: `localhost` and `127.0.0.1` have distinct cookies.
Vite proxies `/api` to 8080; deployed apps use HTTPS reverse proxying instead.
Never deploy the `local` profile or weaken CSRF/cookie policy to repair routing.

| Failure                           | Recovery                                                                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Occupied port                     | Identify its owner. Change this checkout's `POSTGRES_PORT`, or deliberately align frontend/backend launch/proxy ports if those collide. |
| Healthy database rejects password | Restore matching credentials or choose a separate Compose project **and** free port; preserve the old volume.                           |
| Old Node in desktop editor        | Install/select Node 24; launcher can select an existing nvm version but installs nothing.                                               |
| Vite watcher `ENOSPC`             | Retry affected command with `CHOKIDAR_USEPOLLING=true`; record the verified workaround.                                                 |
| Session/CSRF failure              | Check actual HTTP mode, hostname, proxy and fresh CSRF first.                                                                           |

Stop your frontend/backend with Ctrl+C. Stop this checkout's database without
removing its volume when needed:

### 8.4 Stop this database without deleting its volume

```bash
python3 -B docs/template-initialization/scripts/8_4_stop_database.py
```

**Done:** real PostgreSQL/backend/frontend login, reload and logout work.

## 9. Use the VS Code launchers

Open the repository root as a trusted workspace, install recommended extensions
from `.vscode/extensions.json`, and wait for Java/Gradle import. Stop terminal
instances that occupy the same ports first.

1. Start **Backend: local dev** in Run and Debug. Its tasks prepare missing
   credentials, start this project's PostgreSQL and check password auth before Java.
2. Separately start **Frontend: local dev**, which explicitly selects HTTP `/api`.
3. Verify login and a backend breakpoint. Stop debug sessions; PostgreSQL persists.

A desktop editor can inherit a different Node PATH; `with-local-node.sh` selects
an already installed Node 24 through nvm when necessary. JSON inspection alone is
not debugger acceptance. For another editor, record IDE checks as inapplicable
and keep the verified terminal procedure.

### 9.1 Inspect the checked-in IDE configuration

```bash
python3 -B docs/template-initialization/scripts/9_1_check_ide_configuration.py
```

This check does not launch the IDE or prove the breakpoint/login observations
above; record those actual human observations separately.

**Done:** the intended launch method works, with any IDE limits recorded.

## 10. Verify and publish the initialization changes

Stop development processes you started before heavy checks. Run these
**sequentially** with Docker available. Backend tests use isolated Testcontainers.

### 10.1 Run the local verification sequentially

```bash
python3 -B docs/template-initialization/scripts/10_1_verify_local.py
```

These frontend Playwright configurations select the Google Chrome channel. Use
an already installed compatible Chrome, or call `10_1_verify_local.py` with `--install-browser` and your workstation's
normal privilege handling. Bundled Chromium alone does not
satisfy that channel. Install missing browser OS libraries if reported.
Frontend `verify` includes format, lint, boundaries, guide validation,
types, tests, production and Storybook builds. Fix identity expectations rather
than weakening checks. Review and stage only intended changes:

### 10.2 Review and stage the intended changes

```bash
python3 -B docs/template-initialization/scripts/10_2_review_changes.py
```

For local-only scope, stop after verification and record the local result in step 19. Commit/push only if you also intend to publish these changes; remote setup is
outside local-only scope.

Use explicit `git add PATH` for new/moved files; `git add -p` does not add untracked
files. Ensure no secrets/dumps are staged, then:

### 10.3 Publish the reviewed initialization changes

```bash
python3 -B docs/template-initialization/scripts/10_3_publish_changes.py
```

Remote CI may wait for step 11. Local success is not remote CI evidence. Retain
failed checks and the exact tested source identity.

**Done:** local checks pass and the intended consumer commit is available remotely.

## 11. Register the repository with shared CI

The existing shared-pool operator performs this at an agreed idle maintenance
point. Registration affects the shared controller; coordinate other consumers.
Do not install a new pool or app-specific permanent runner.

In the organization's existing GitHub App installation, add this exact repository
to **selected repositories**, preserving existing selections. The App retains
Actions read, Administration write and automatic Metadata read. Its private key
stays on the controller host, never in this checkout or Actions secrets.

**Operator host:** use the canonical reviewed root-controlled CI source checkout,
not a consumer fork. `CI_SOURCE` comes from the verified values file. On the
operator host, place the same mode `0600` `values.env`, `verification.json` and
`progress.json` files in a root-only directory; use `--env` to name that copy.
Preserve the env bytes so its hash still matches. Use root ownership and mode `0600` for all three files, under a mode `0700` directory. Keep private credentials in
existing protected stores, and independently inspect the actual host before any
operator mutation:

### 11.1 Prepare this consumer registration

```bash
python3 -B docs/template-initialization/scripts/11_1_prepare_registration.py
```

Inspect an existing registration file instead of overwriting it. Confirm current
installed-source/boot/isolation prerequisites, then:

### 11.2 Stop and inspect the shared controller

```bash
python3 -B docs/template-initialization/scripts/11_2_stop_and_inspect_ci.py
```

Inspect service/worker/job/recovery state. Registration requires stopped,
disabled, idle execution, no jobs and no residual boundary mounts. Supply the reported current `configuration_sha256` as the argument below:

### 11.3 Register and validate the consumer

```bash
python3 -B docs/template-initialization/scripts/11_3_register_and_validate_ci.py --expected-config-sha256 CURRENT_OBSERVED_CONFIG_SHA256
```

Registration preserves other projects and leaves the controller disabled.
Validation must establish a fresh source/configuration/boot-bound receipt. After
operator review/approval:

### 11.4 Activate the reviewed CI controller

```bash
python3 -B docs/template-initialization/scripts/11_4_activate_ci.py --reviewed
```

On interrupted registration preserve its recovery ledger and use the CI owner's
`recover-registration` procedure. A private-repository 404 does not prove runner
deletion. Required transport/isolation repairs must already be installed; upgrades
are separate reviewed work. The [CI operator guide](../../infrastructure/ci/README.md#register-a-private-monorepo)
owns detailed host acceptance and exceptional recovery.

Return the operator's updated `progress.json` to the workstation's protected
values directory before continuing; preserve the matching env/receipt identity.
When switching contexts again later, copy the current observations in the same
way. Never copy provider tokens, App keys, provisioning credentials or dumps into
this state file.

**Done:** exact consumer registration and current host validation pass, and the
controller is deliberately active.

## 12. Prove CI and configure GitHub policy

In consumer **Settings → Actions → General**, permit the checked-in pinned Actions
and read-only repository tokens. Preserve runner labels
`[self-hosted, Linux, X64, web-app-ci]`. Keep deployment/registry credentials out
of PR CI. An idle disposable pool may show no online runners; verify real jobs.

On your **workstation**, open and watch the initialization PR:

### 12.1 Open and watch the initialization PR

```bash
python3 -B docs/template-initialization/scripts/12_1_open_initialization_pr.py
```

Observe the actual `CI gate` name/source App, run URL and Hetzner runner identity.
Exercise task-owned backend-only, frontend-only, both-owner and documentation-only
PR changes; record selected/skipped lanes. Remove temporary failure fixtures
before merging. After failure use **rerun all jobs**: complete shard proof must
come from one workflow attempt.

Once genuine `CI gate` succeeds, configure **Settings → Branches → protection for
main** (or the organization-approved equivalent):

1. Require a PR; required approving reviews **0**; no code-owner/last-push approval
   unless stronger organization policy applies.
2. Require observed **CI gate**, bound to its observed **GitHub Actions** source.
3. Require up-to-date branches and enforce protection for administrators.
4. Block force pushes/deletion; preserve stronger compatible organization rules.

Read back effective policy. Use a task-owned validation PR to prove a missing/
failing check blocks merging and corrected green permits it with zero approvals.
Never merge the failing fixture. Resolve private-plan/access limitations directly;
do not make the repository public or weaken checks as a workaround.

Create **staging** and **production** in **Settings → Environments**. Leave required
reviewers/wait timers unset and allow the selected release branch; main-only
restriction is not required. When using an API, omit unused reviewer/wait fields
rather than submitting an empty reviewers list that can request paid protection.

Merge the clean green initialization PR normally. Then preserve an exact release
commit on a branch that will remain unchanged through promotion:

### 12.2 Preserve the exact release source

```bash
python3 -B docs/template-initialization/scripts/12_2_prepare_release_branch.py
```

**Done:** real consumer CI and merge policy are proved, environments exist, and
an exact release source is selected.

## 13. Configure DNS for both environments

Obtain the actual host IPv4 from the operator. Inspect the existing authoritative
zone and records:

### 13.1 Inspect the existing DNS records

```bash
python3 -B docs/template-initialization/scripts/13_1_inspect_dns.py
```

In the DNS provider's **existing zone → Records**, create staging/production **A**
records pointing to that IPv4, TTL **300** where supported. Use zone-relative names
when requested: `inventory` and `inventory-staging` within `vireocode.com`. Preserve
matching records; reconcile conflicting A/AAAA/CNAME records deliberately. Keep
unrelated DNS and nameserver delegation intact.

For Hetzner, use the actual **DNS project's** zone/credential; a server-project
token may not see it. No server rebuild/Cloud token is needed just to register a
consumer. There is no maintained generic DNS write CLI here, so these two record
writes use the provider UI.

Verify **each** authoritative server from the NS result, then public recursion:

### 13.2 Verify authoritative and recursive answers

```bash
python3 -B docs/template-initialization/scripts/13_2_verify_dns.py
```

The verification script queries each authoritative server and public resolvers. Wait for negative caches if authoritative answers are
correct; duplicate records do not fix cache lag. The existing host must permit
public HTTP/HTTPS for Caddy while keeping databases private.

**Done:** both owned hostnames resolve to the intended host without conflicts.
DNS alone is not TLS/deployment acceptance.

## 14. Install and prepare isolated release environments

The existing release-host operator installs project-scoped paths/disabled units,
then prepares separate databases/proxy routes. Preserve other consumers.

On your **workstation**, obtain actual numeric consumer IDs:

### 14.1 Observe the actual repository and workflow IDs

```bash
python3 -B docs/template-initialization/scripts/14_1_observe_repository_ids.py
```

The repository ID must still match step 2.4 before workflow IDs are recorded.
If the repository was replaced, preserve the existing observations and reconcile
its identity before continuing.

Transfer the exact clean committed source, including Git identity, to a **new
root-controlled checkout**. For an operator who already has authorized private
GitHub SSH access, this is one option on the **operator host**:

### 14.2 Prepare the protected exact source checkout

```bash
python3 -B docs/template-initialization/scripts/14_2_prepare_release_source.py --source-sha EXACT_OBSERVED_RELEASE_COMMIT
```

Use the approved GitHub SSH host identity. Do not put tokens in clone URLs. An
existing approved checkout needs inspection first. All source ancestors must be
root-owned and not group/other writable; do not recursively chown unrelated trees.
The installer rejects dirty/unprotected source. Review the exact operator source
and shared App signer independently before running as root.

Allocate four **unused** loopback ports with the operator in the values file.

The four selected ports come from the project values file. The collision check below verifies them on the operator host.

Before installation inspect **both loaded and on-disk** units, all project paths,
Caddy site, networks/volumes, **all containers including stopped ones**, and ports:

### 14.3 Check ports and project resource collisions

```bash
python3 -B docs/template-initialization/scripts/14_3_check_release_collisions.py
```

The following must be free for a fresh installation:

- `/etc/web-app-deploy/<slug>`, `/usr/local/lib/web-app-deploy/<slug>`,
  `/var/lib/web-app-deploy/<slug>`, `/etc/caddy/sites/<slug>.caddy`.
- Loaded units and unit files/symlinks for `web-app-deploy-<slug>.service`,
  `web-app-backup-<slug>.service`, `web-app-backup-<slug>.timer`, including
  `/etc/systemd/system/` paths.
- Each environment's `<slug>-<environment>-db` network and
  `<slug>-<environment>-postgres` volume/container; the
  `<slug>-<environment>-app` Compose container namespace.

The installer does not replace this collision inspection. Existing/partial
resources require reconciliation; never erase them to force fresh installation.

The workstation observation script saves actual numeric IDs into the private
`progress.json`. Copy that observation file with the env and verification receipt
to the protected operator directory. Installation uses those observed IDs and
the selected names/ports/account identity directly. Run from the protected
`RELEASE_SOURCE` checkout:

### 14.4 Install the project release configuration

```bash
python3 -B docs/template-initialization/scripts/14_4_install_release.py
```

### 14.5 Prepare the separate databases and proxy routes

```bash
python3 -B docs/template-initialization/scripts/14_5_prepare_release.py
```

The selected maintainer is the initial actor. The scripts reference protected
`/etc/web-app-ci/github-app.json` and `github-app.pem`; optional `--app-settings`
and `--app-key` take **paths**, not secret values. The installer generates distinct
DB/account passwords for both environments; no users or services are activated.

Preparation creates two private PostgreSQL instances/volumes, writes only this
project's Caddy site, validates full Caddy config and reloads. `14_5_prepare_release.py` stays
in the protected source checkout. Interrupted preparation leaves
`preparation.json`; inspect it before any retry.

Before activation independently verify on the actual supported host:

1. `installation.json` source/file hashes match reviewed source and installed code;
   `controller.json` has the exact repo/workflow IDs, actors and trusted hashes;
   `runtime.json` has selected hostnames, ports and project paths.
2. Protected directories are root-only `0700`, credential files `0600`, and App
   key references stay on host. Inspect metadata/modes without dumping secrets.
3. Unit bytes/hardening/limits, DB image/network/volume/mount/health and Caddy
   routing match the reviewed generated configuration.
4. The App has Actions-read access and untrusted release requests are rejected;
   retain source/configuration/host-bound acceptance evidence.

There is no deployment-controller `validate` CLI; these are explicit operator
acceptance checks, distinct from the CI controller's validation command.

On your **workstation**, retrieve **only the public certificate** and publish it:

### 14.6 Publish only the controller public certificate

```bash
python3 -B docs/template-initialization/scripts/14_6_publish_certificate.py
```

Use the approved privilege method; root SSH can omit `sudo`. Never retrieve the
private `controller.key`, App/SSH keys or DB passwords into Actions. After review,
**operator host**:

### 14.7 Activate the reviewed project controller

```bash
python3 -B docs/template-initialization/scripts/14_7_activate_controller.py --reviewed
```

Trusted pins cover both deploy workflows, `infrastructure/release/client.py`,
`protocol.py`, `smoke_images.py`, and `infrastructure/ci/ci-runner/github_app.py`.
Changing these later needs a reviewed stopped/idle operator update; no generic
live-upgrade command exists. Keep the production backup timer disabled for now.

**Done:** isolated DB/proxy/source/config acceptance is recorded, the public
certificate is configured, and the reviewed deployment controller is active.

## 15. Deploy and verify staging

Before the **first publication**, inspect both derived GHCR names. Repeat this
preflight immediately before dispatch; publication can write package tags before
its later privacy checks run. On your **workstation**, with package-read access:

### 15.1 Verify the intended registry package names

```bash
python3 -B docs/template-initialization/scripts/15_1_inspect_packages.py
```

For each existing package require private visibility and a repository link to
this **exact consumer**, plus appropriate Actions package access. Preserve a
different repository's package and stop. An absent package is acceptable only
after an operator with the proper organization/package access confirms absence
and permission to create it. A forbidden response or ambiguous `404` is not proof
of absence: resolve it through the organization's package inventory/settings
before continuing. Only after that inventory review may step 15.1 be rerun with `--absence-confirmed`. Do not delete, replace or take over a conflicting package.

Once both names are clear, dispatch from your **workstation**:

### 15.2 Dispatch the staging release

```bash
python3 -B docs/template-initialization/scripts/15_2_dispatch_staging.py
```

Choose the actual run matching source SHA, branch, actor and dispatch time;
newest does not necessarily mean yours. Pass the exact observed ID, inspect and wait:

### 15.3 Watch the exact staging run

```bash
python3 -B docs/template-initialization/scripts/15_3_watch_staging.py --run-id ACTUAL_RUN_ID
```

The workflow verifies both apps, builds/smoke-tests the pair, publishes private
GHCR images and waits for actual host deployment. Image publication is not
completion. Record the `release-pair-<attempt>` source SHA and both immutable
digests. Verify private package visibility and ownership by this repository;
a package owned by another repo is a preserve/reconcile boundary.

### 15.4 Verify staging TLS, environment and health

```bash
python3 -B docs/template-initialization/scripts/15_4_verify_staging.py
```

Expect valid public TLS, `X-Vireo-Environment: staging`, health `UP`, working
`/login` SPA and `/api`. The operator compares active pair/source/container image
IDs with workflow and durable staging receipt. Preserve TLS verification.

On failure/timeout inspect exact run/attempt, request journal, transaction and
active state before retrying. A mutation may have completed despite a timeout;
never restore a database/edit active pointers merely to make a workflow green.
The dispatch script records its intent before contacting GitHub and blocks a
second dispatch while that outcome is unresolved. Use step 15.3 with
`--run-id ACTUAL_RUN_ID --reconcile-only` to record the exact run's current state
without waiting or dispatching again. Only an explicitly reconciled, completed
unsuccessful run permits a deliberate new dispatch; successful runs remain recorded.
Use the [release failure procedure](../../infrastructure/release/README.md#failure-and-recovery)
for exceptional reconciliation.

**Done:** complete workflow success and host/public identity match the exact pair.

## 16. Provision the staging account and verify authentication

Normal deployed startup creates no users. Installation created separate protected
`provision-user.env` files with selected identity and different random passwords.
Use the **active backend digest**, existing DB network, and environment lock.
Production additionally needs a fresh verified backup within that same lock.

This **operator-host** transaction provisions staging now and production in step 17. It uses reviewed installed helpers, persists exact task names/ownership before
creation, checks successful termination and matching-repeat safety, and retains
uncertain failures. Do not wrap it in another lock.

### 16.1 Provision and repeat-check the staging account

```bash
python3 -B docs/template-initialization/scripts/16_1_provision_staging.py
```

Container output/passwords are captured rather than printed. On uncertain Docker
responses inspect the persisted intent and **both exact names**, even after a
lost creation response. Reconcile ownership, exit status and DB outcome before
cleanup/resume. Preserve unrelated resources. Existing mismatched/disabled users
fail explicitly; this is not a password-reset mechanism.

Privately access the staging `provision-user.env` through the operator/password
manager. Keep credentials out of terminal recordings, chat, screenshots and run
evidence. In a browser on the **staging HTTPS origin**, verify login, navigation,
reload/session persistence and logout. Confirm Secure/HttpOnly cookies and fresh
CSRF without recording token values. Provisioning credentials stay out of normal
application containers.

**Done:** creation and matching repeat pass, and real staging HTTPS auth works.

## 17. Promote the exact pair and initialize production

On your **workstation**, verify the selected branch still points to staging's
source SHA from step 15 before dispatching:

### 17.1 Promote the accepted staging pair

```bash
python3 -B docs/template-initialization/scripts/17_1_promote_production.py
```

Select the matching run ID, inspect and wait:

### 17.2 Watch and verify the exact production run

```bash
python3 -B docs/template-initialization/scripts/17_2_watch_production.py --run-id ACTUAL_RUN_ID
```

Production uses the same dispatch-intent protection as staging. After a lost
response, use step 17.2 with `--run-id ACTUAL_RUN_ID --reconcile-only` to inspect
and record the original run before deciding whether another dispatch is allowed.

Production promotes the exact staging frontend/backend digests without rebuilding,
requires its durable host receipt, and takes a verified backup before backend
replacement/migrations. The first pre-migration backup can be empty; it does not
satisfy initialized recovery acceptance.

**Operator host:** provision production through the separate numbered entrypoint:

### 17.3 Provision and repeat-check the production account

```bash
python3 -B docs/template-initialization/scripts/17_3_provision_production.py
```

It reuses step 16's transaction. Active-digest resolution, the fresh backup,
provisioning/repeat and postchecks remain under the single environment lock.
Do not call the lock-taking backup CLI inside that transaction.

Verify separate production credentials through real HTTPS login/reload/logout.
Confirm `X-Vireo-Environment: production`, health and exact pair/container image
IDs. Record source SHA and both workflow run/attempt IDs.

**Done:** the exact staging pair is in production with working real authentication.
A deployed starter is setup, not accepted business V1.

## 18. Retrieve an initialized backup, restore it in isolation, then schedule

**Operator host**, after account provisioning:

### 18.1 Create a verified initialized backup

```bash
python3 -B docs/template-initialization/scripts/18_1_create_initialized_backup.py
```

Use the printed finalized `.dump` path and adjacent `.dump.json`, never a
`.partial`. Require `initialized: true`, the expected **nonzero** `users` count,
bytes and SHA-256. Here `initialized` means the table exists; check users separately.

On your **workstation**, retrieve to a protected directory **outside Git**:

### 18.2 Retrieve and verify the initialized backup

```bash
python3 -B docs/template-initialization/scripts/18_2_retrieve_backup.py --remote-dump EXACT_OBSERVED_DUMP_PATH
```

Pass the exact observed dump path; the script derives the slug and SSH target from the values file and verifies the checksum-matched copy. Keep the
archive/metadata in protected operator storage, never workflow artifacts.

Restore the **retrieved copy**, not merely the original server file. If local
Docker cannot run restricted containers, transfer that same checksum-matched copy
to a **new** root-only directory on the supported host and recheck there:

### 18.3 Transfer the retrieved copy for isolated rehearsal

```bash
python3 -B docs/template-initialization/scripts/18_3_transfer_recovery_copy.py
```

Run this rehearsal on the **supported operator recovery host**. It uses a unique
container, no production network, no published ports, no bind mounts/persistent
volumes, unrelated scratch credentials and bounded tmpfs. On success only the
ownership-verified scratch container/credentials are removed; failures retain
intent for inspection.

### 18.4 Restore the retrieved copy in isolation

```bash
python3 -B docs/template-initialization/scripts/18_4_restore_rehearsal.py
```

The 256 MiB scratch data limit is for the fresh starter database; allocate more
isolated capacity deliberately for a larger consumer. On failure inspect the
exact recorded name/label, confirm ownership, then remove only that scratch
container/temporary credentials. Preserve original and retrieved backups. Never
weaken Docker/AppArmor restrictions to make this pass, or restore over a live DB.

After initialized restore acceptance and the deliberate backup risk/schedule
decision, **operator host**:

### 18.5 Enable the deliberate backup schedule

```bash
python3 -B docs/template-initialization/scripts/18_5_enable_backup_schedule.py --reviewed
```

Confirm **03:00 Europe/Zagreb**, persistent scheduling and 30-day production
retention. Staging stays unscheduled. Record the next firing and observe its
actual result later; do not claim a future scheduled run passed. Changing the
time/timezone/destination requires reviewed operator work, not an installer flag.
Same-server backups do not survive server loss.

**Done:** an initialized production archive was retrieved, checked and restored
in isolation, and the deliberate production schedule is active.

## 19. Record the result

Update **Consumer-specific setup** below with nonsecret actual values/evidence:
source SHA, local check results, CI runs/policy, operator source/config receipts,
DNS, release run/attempt IDs and immutable digests, auth acceptance, recovery
checksum/result and timer state. Link credentials only by protected purpose/path.
Historical template receipts remain historical, never consumer acceptance.

Check affected documentation links and commands, then deliver final docs through
normal green CI. Record deferred artwork, pending scheduled-backup observation and other limits.
A working foundation is initialization; business requirements, implementation and
acceptance follow the [project lifecycle](../../README.md#project-lifecycle).

### 19.1 Record the nonsecret setup observations

```bash
python3 -B docs/template-initialization/scripts/19_1_record_result.py
```

The report collects source-bound observations without declaring unobserved
human acceptance or future scheduled runs complete. Maintain the actual evidence
and remaining limitations below.

## Consumer-specific setup

This template has no consumer-specific initialization evidence. In your consumer,
replace this paragraph with a maintained record of:

- Identity, repository, namespace, display/short names and artwork decision.
- Local runtimes/ports, credential/data ownership and actual launch/auth checks.
- CI registration/current validation, real run URLs and effective main protection.
- DNS/host/project namespace/ports and protected configuration references.
- Release source SHA, staging/production run attempts and immutable image pair.
- Account identity/private credential location and HTTPS authentication results.
- Backup checksum/retrieval, isolated restore, risk decision, timer activation and
  first observed scheduled result.
- Remaining work, owner and next action; local-only versus full scope.

Keep fictional examples intact as reference. Consumer facts/evidence belong here
and in source-bound acceptance records. Retain shared infrastructure IDs from
the operator references; record fresh evidence for this consumer's repository,
CI runs, releases and recovery. Keep credentials in protected stores.

## Completion checklist

- [ ] Identity agrees across Java, Gradle, Compose, frontend metadata, titles and docs.
- [ ] Existing resources preserved; credential/data/artwork decisions recorded.
- [ ] Real local login/reload/logout works; intended terminal/IDE launch verified.
- [ ] Required local checks pass for the recorded candidate; omissions visible.
- [ ] Shared CI registration/current validation and genuine consumer jobs pass.
- [ ] Effective main policy read back; missing/failing versus green behavior proved.
- [ ] DNS, public TLS, separate DB/proxy and protected configuration verified.
- [ ] Staging and production completed with the exact same immutable image pair.
- [ ] Separate accounts explicitly provisioned and HTTPS authentication verified.
- [ ] Initialized backup retrieved and its copy restored in isolated scratch DB.
- [ ] Deliberate production backup risk/schedule recorded, timer active; staging unscheduled.
- [ ] Consumer evidence, limitations, credential references and operating handoff current.

## Procedure owners

This file owns manual initialization. The [workspace README](../../README.md) owns
ongoing local commands; the [CI operator guide](../../infrastructure/ci/README.md),
[consumer CI contract](github-ci.md) and [release operator guide](../../infrastructure/release/README.md)
own technical interfaces/exceptional recovery. Inspect their current source
before adapting infrastructure procedures.

Preserve accepted setup, credentials and data when resuming this guide.
Documentation checks do not prove a real fresh-consumer initialization; actual
local/provider/release/recovery evidence is required.
