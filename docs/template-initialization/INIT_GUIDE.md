# Initialize a project from this template

Follow this numbered guide to a working local application, real CI, staging and
production deployments, initial accounts, and verified recovery. This is the
numbered procedure for developers and agents. Each script performs one explicit
step; invoking a later script does not approve an earlier or unrelated action.

For short step descriptions and commands, use [INIT_GUIDE_COMPACT.md](INIT_GUIDE_COMPACT.md).
It follows the same procedure; this full guide owns explanations, recovery and
consumer-specific evidence.

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
section `X` and subsection `X.Y` below. The [script index](scripts/README.md) lists
private supporting modules; they are not standalone steps.

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

## Agent-assisted initialization

The template ships [template-initialization](../../.agents/skills/template-initialization/SKILL.md).
After creating/cloning/opening the consumer, invoke it with a project name, such
as `$template-initialization Inventory Portal`. The skill owns name-based
suggestions and the agreed maintainer/account defaults; this guide owns the
numbered procedure and its evidence. Inspect the actual consumer origin before
creating even private inputs; never initialize the canonical template.

The agent-assisted sequence deliberately moves DNS preparation and acceptance
ahead of personalization:

1. Run 1.1, fill valid project/account values, then run 1.2. The origin repository
   determines the slug. Preserve existing private files, progress and resources
   on resume. Values are literal data; quotation marks are not dotenv syntax here.
2. Check tools/access through 2.1–2.3, then run 2.4 with
   `--scope full --mode new --prepare-dns-intake` while both DNS names are unused.
   All normal checks must pass. Only private observation files are written;
   existing DNS and infrastructure remain untouched.
3. Use 1.1 `--show-values` to display all 22 validated nonsecret inputs and print
   both exact DNS A records pointing to `OPERATOR_IPV4`, TTL 300 where supported.
   Print protected credential paths only. Request one explicit confirmation that
   values are correct, DNS is configured and full initialization may proceed.
4. Disclose the scope before waiting: local verification, scoped GitHub/CI work,
   commits/pushes, clean PR merges after green checks and required review,
   staging/production, account provisioning, backup/retrieval/restore and the
   final handoff. The approved defaults retain artwork with branding deferred,
   accept same-server backup loss risk under the section 18 policy, and explicitly
   waive debugger acceptance while requiring real GUI journeys in all three
   environments. Missing credentials, policy rights or other human-only blockers
   require their exact intervention; DNS is not guaranteed to be the only one.
5. Record the actual confirmation and decisions in a protected `agent-decisions.json`
   beside the values, bound to repository name/numeric ID and exact input SHA-256.
   Include the actual reply/time, full execution scope, artwork deferral, backup
   policy/risk and debugger waiver. Preserve this authorization on interruption;
   a repeated name, changed input or elapsed time is not approval. These notes do
   not replace verification or acceptance evidence.
6. After confirmation, run fresh full 2.4 in resume mode and 13.2 early. The
   protected intake observation allows only exact matching records for previously
   checked names even after several days; readiness still expires after 24 hours.
   Follow sections 3–19 afterward, retaining lettered actions and all other gates.
   Section 13 rechecks existing owned DNS without another provider write.

Run each action separately in its real workstation/operator context. The agent
may perform supported lettered actions through GitHub, SSH and browser tooling
within the confirmed scope. Review requirements and shared-pool idle/ownership
checks still apply before activation. Use current protected state and the owning
recovery procedure after a partial result; never edit verification timestamps,
repository IDs or DNS claims by hand. Changed bound inputs stop for deliberate
reconciliation and renewed confirmation. Private notes/files must stay `0600`
beneath owned `0700` storage outside tracked content.

The skill uses terminal-started frontend/backend and real GUI login, navigation,
reload/session persistence and logout locally, then the same real journeys and
all HTTPS checks on staging/production. Mock or API-only checks are insufficient.
Section 9.1 still checks IDE configuration. The explicit debugger exception is
recorded as the IDE-only authorized waiver described in section 19.2. Completion
requires the validated marker and current consumer documentation delivered through
green CI; business acceptance and the first future scheduled backup remain distinct.

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

For a safe chat preview after editing and validation, print only parsed known
nonsecret fields; unknown or invalid input is rejected before anything prints:

```bash
python3 -B docs/template-initialization/scripts/1_1_prepare_values.py --show-values
```

### 1.2 Select available deployment ports

After editing the other values, run this on your **workstation** for full setup.
Python, Git and SSH with the existing attested operator host key/root access are
required here; local-only setup skips this remote step.

```bash
python3 -B docs/template-initialization/scripts/1_2_select_deployment_ports.py
```

It reads TCP listeners and all runtime port reservations, including stopped
projects, then saves four available ports in your protected values file. Available
selected ports are preserved. An existing deployment namespace or recorded
verification/progress blocks reassignment for deliberate reconciliation. Other
values and file permissions are preserved. This reserves nothing; step 2.4
rechecks availability.

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

Install Git, Bash, Python 3.11+, ripgrep (`rg`), GitHub CLI, JDK 21, Docker with Compose 5.x, and Node
24/npm 12 through your normal workstation tools. Use the included Gradle wrapper;
a system Gradle install is unnecessary. The `rg` command comes from the `ripgrep`
package. On Ubuntu/Debian, run `sudo apt update`, then `sudo apt install ripgrep`,
and confirm `rg --version` before step 2.2. For an existing nvm installation:

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

Docker Compose 5.x is required. Its version is independent of Docker Engine's
version. An `Unsupported Docker Compose version` error refers to the Compose
plugin; the check verifies Engine/daemon access separately.

Authenticate with the intended GitHub account; retain an existing working login.
The App repository inventory needs `read:user` in addition to `repo` and
`read:org`. If reported missing, rerun step 2.3 with `--login` and complete the
interactive authorization; the script verifies the same account afterward:

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

For the agent-assisted DNS-first intake, prepare its durable absence observation
before asking the developer to configure records:

```bash
python3 -B docs/template-initialization/scripts/2_4_verify_values.py --scope full --mode new --prepare-dns-intake
```

This option is valid only for full/new verification. It records `progress.dns_intake`
only after all normal probes succeed with unused names, bound to exact repository
numeric identity, input bytes, zone/hosts/IP, verifier code and the actual producer
and observation time. It reserves nothing. A matching historical claim is durable
across a multi-day wait and approved workstation changes; a fresh full resume
verification rechecks all live prerequisites and creates a normal 24-hour receipt.
Unclaimed/conflicting DNS, malformed/foreign claims, changed inputs and future
observations remain errors. Wildcards, delegation, aliases and unexpected AAAA
records remain rejected. The later 13.2 check still verifies every authoritative
server and public answers before recording normal `dns_hostnames` evidence.

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

The scripts apply the verified consumer identity to the fields listed below.
Keep physical `frontend/` and `backend/` folders, versions/dependencies, `/api`, auth contracts,
and Flyway migration filenames/SQL unchanged. Avoid global text replacement.

### 4.1 Apply the backend identity fields

```bash
python3 -B docs/template-initialization/scripts/4_1_edit_backend_identity.py
```

The personalization scripts apply values from the verified env automatically.
Each step checks every target before writing, accepts recognized template or
already-selected values, and preserves unrelated content. Missing, ambiguous or
foreign identity fields stop the step for inspection. A completed retry makes no
changes. Optional `--open` opens the affected files for inspection after applying
the changes; an editor is not required.

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
and `BackendApplication`. Run the package-refactoring step after applying the
backend identity:

### 4.2 Refactor the Java package roots

```bash
python3 -B docs/template-initialization/scripts/4_2_refactor_java_packages.py
```

The script moves both roots and updates Java code references. The test-only
`backend/src/test/java/referencefixtures` tree stays at its neutral path and
package. Within that tree, only explicit imports of these published production
types change to the selected namespace: `crud.BaseEntity`,
`crud.SoftDeletableEntity`, `crud.BaseService`, `crud.DeleteMode`,
`crud.ResourceNotFoundException`, `crud.VersionConflictException`,
`crud.ResourceInUseException` and `http.PageResponse`. Comments, string/text-block
literals, SQL and unrelated `architecturefixtures`/`httptestfixtures` stay
byte-identical. Older consumers without the reference tree do not acquire it.

All application and reference plans are checked before either application root
moves. Unexpected production imports, static/wildcard imports of those types,
foreign or mixed namespaces in one reference file, path/declaration mismatches,
symlinks and collisions stop for inspection. Correct already-selected imports are
preserved. A completed retry makes no changes; if both application roots already
moved but reference imports are pending, rerun 4.2 to complete those imports.
Mixed or partially moved application trees still stop for inspection. Moving
packages does not change schema/table names or authorization contracts.

For existing `.env`/database resources, resolve identity first. A changed Compose
name creates a different namespace; it does not migrate a volume. Changed DB
settings do not alter credentials inside an initialized volume. Preserve matching
configuration or deliberately allocate separate project/port resources; deletion
or password reset is not the repair.

**Done:** Java paths/imports, neutral reference imports, Gradle, Compose defaults
and debugger main class agree. Section 10.1 runs `test bootJar` in the actual
personalized consumer: the reference compiles and runs there, while isolation
tests verify it contributes no ordinary application mappings or packaged fixture
classes/resources. The identity audit alone does not prove compilation or runtime
isolation.

## 5. Personalize the frontend and documentation

### 5.1 Apply frontend metadata and names

```bash
python3 -B docs/template-initialization/scripts/5_1_edit_frontend_identity.py
```

| File                                                                | Change                                                                                                                                                             |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `frontend/package.json`                                             | `name` → `<slug>-frontend`.                                                                                                                                        |
| `frontend/package-lock.json`                                        | Top-level `name` and `packages[""].name` → same name. Preserve graph/integrity data.                                                                               |
| `frontend/index.html`                                               | `<title>` → HTML-escaped display name.                                                                                                                             |
| `frontend/public/manifest.json`                                     | `name`/`short_name` → selected names. Preserve `id`, `start_url`, `scope`, icon references.                                                                        |
| `frontend/src/app/localization/translations/translation.{en,hr}.ts` | `navigation.shellTitle` → selected display name; preserve translation keys and localized page labels.                                                              |
| Root/frontend README                                                | Consumer title/introduction; root **Project identity** with slug, display name, Java namespace and short name. Retain setup instructions and framework provenance. |

The script applies the listed metadata, translations and README identity fields
automatically while preserving dependency data, framework provenance and artwork.
It records retained branding for later visual review. Then update the actual title
assertion suffixes automatically, preserving page-title prefixes and mock credentials:

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

Verify the selected backend/frontend fields, title expectations and Java package
identity automatically, without reading secret or generated files:

### 6.1 Audit the identity changes

```bash
python3 -B docs/template-initialization/scripts/6_1_audit_identity.py
```

This read-only gate checks coherence and whitespace, including the scoped
production imports in any neutral `referencefixtures` tree. Pending imports name
4.2 as the repair step; foreign or ambiguous content remains an inspection error.
It classifies known retained
reference examples, fixtures, attribution and artwork automatically, and fails on
unexpected application-identity leftovers. It names the affected path/field and
repair step; routine initialization needs no manual reference classification.

**Done:** selected identity fields, Java packages and title expectations agree;
intentional neutral references remain preserved.

## 7. Set up the local environment

Generate credentials after personalization:

### 7.1 Prepare private backend configuration

```bash
python3 -B docs/template-initialization/scripts/7_1_prepare_backend_env.py
```

This creates ignored `backend/.env`, mode `0600`, with random passwords and
preserves an existing file. The script checks owner-only permissions, selected
project/database/account identity, password lengths (12 characters minimum,
72 UTF-8 bytes maximum), and the local PostgreSQL binding. A busy port is accepted
only for this checkout's exact running Compose PostgreSQL service; foreign or
ambiguous ownership stops setup. It prints a nonsecret result. No credentials or
volumes are reset. Actual database password authentication happens at step 8.1.

### 7.2 Prepare frontend dependencies and HTTP settings

```bash
python3 -B docs/template-initialization/scripts/7_2_prepare_frontend_env.py
```

After installing locked dependencies, this step automatically formats only the
frontend identity files with the installed pinned Prettier. Long or escaped names
need no manual formatting. Existing `.env.local` keeps unrelated values.

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

For the approved agent-assisted workflow, Bruno explicitly waived launching the
VS Code debugger and observing a breakpoint. Keep the real terminal-started GUI
acceptance from section 8, run 9.1, and record the authorized IDE waiver in 19.2.
Do not describe an unperformed debugger check as passed or inapplicable.

For manual initialization without an explicit waiver, open the repository root
as a trusted workspace, install recommended extensions
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

### 11.1 Verify GitHub App access and transfer the initialization state

On your **workstation**, this step grants the existing shared CI App access to the
exact verified consumer using your authenticated organization-owner account.
It preserves all selected repositories, verifies the App's identity and required
Actions/Administration/Metadata permissions, and reads access back before upload.
The installation remains limited to selected repositories. Its private key stays
on the host. Missing authority or policy conflicts stop before the controller is
stopped; no App permissions or organization policy are expanded. See the
[GitHub App reference](github-ci-app.md#register-and-verify-a-consumer).

Then, from your **workstation's consumer repository root**:

```bash
python3 -B docs/template-initialization/scripts/11_1_transfer_state.py
```

This reads `PROJECT_SLUG` and `OPERATOR_SSH` from the verified values, then copies
only `values.env`, `verification.json` and `progress.json` to
`/root/PROJECT_SLUG-initialization/` on the host. It preserves the exact bytes and
creates root-owned `0600` files under a `0700` directory. Referenced credential
files are not copied. The host's canonical reviewed `CI_SOURCE` checkout must
include this transfer helper and match the receipt's verifier code. Use the
existing verified SSH host key; resolve an SSH failure before continuing.

An identical upload retry changes nothing. A differing, incomplete or unsafe
existing destination stops the transfer for inspection; preserve its observations
and reconcile them before retrying. This upload is the initial section 11 handoff,
not a way to overwrite newer host progress during later setup.

The command prints all four operator commands for steps 11.2–11.5 with your exact
host `--env` path. Copy those printed commands; step 11.3 captures the configuration
hash used automatically by step 11.4. The examples below use
`PROJECT_SLUG` as a placeholder for your actual slug. On the **operator host**,
run from the canonical reviewed root-controlled `CI_SOURCE` checkout,
not a consumer fork. Keep private credentials in existing protected stores, and
independently inspect the actual host before any operator mutation.

### 11.2 Prepare this consumer registration

```bash
python3 -B docs/template-initialization/scripts/11_2_prepare_registration.py --env /root/PROJECT_SLUG-initialization/values.env
```

Inspect an existing registration file instead of overwriting it. Confirm current
installed-source/boot/isolation prerequisites, then:

### 11.3 Stop and inspect the shared controller

```bash
python3 -B docs/template-initialization/scripts/11_3_stop_and_inspect_ci.py --env /root/PROJECT_SLUG-initialization/values.env
```

Inspect service/worker/job/recovery state. Registration requires stopped,
disabled, idle execution, no jobs and no residual boundary mounts. Step 11.3 captures the current `configuration_sha256` in protected progress,
bound to this consumer, canonical source and host boot. Step 11.4 uses it
automatically; the canonical registration command still rejects a stale hash
under its lock. Reinspect after any configuration/source/boot change.

### 11.4 Register and validate the consumer

**Allow about 15–20 minutes for the current six-worker pool; host load can increase this.**
Registration is followed by full isolation and Docker validation for every worker,
then simultaneous cross-worker checks. The terminal can stay quiet during these
checks. Keep it open and wait for successful completion before activation.

```bash
python3 -B docs/template-initialization/scripts/11_4_register_and_validate_ci.py --env /root/PROJECT_SLUG-initialization/values.env
```

If registration commits but validation fails, is interrupted, or loses its
response, **rerun the same 11.4 command**. The protected `ci-registration.json`
journal and progress attempt identify the original configuration change. A retry
recognizes only that exact committed registration, preserves other projects, and
runs full validation again. Completion is recorded only after the installed
controller verifies current source/configuration/boot-bound worker and pool receipts.
The controller remains disabled until step 11.5.

On failure, read the printed operation, exit status, fresh worker-stage summary
and private `ci-registration-failure-*.json` report path. Reports retain only
fixed diagnostic fields; arbitrary subprocess output, API bodies and credentials
are suppressed. A report without a fresh worker receipt cannot identify the
underlying probe error. Keep these private reports and the journal for inspection.

Preserve the original step 11.3 observation on retry. Do not recapture its hash,
delete the journal, or edit completion flags to bypass a failure. Configuration,
source, boot or consumer changes require operator reconciliation. An existing
registration created before journaling support needs reviewed recovery; it is
not adopted automatically. An uncertain permission proof still requires the
[CI owner's recovery procedure](../../infrastructure/ci/README.md#register-a-private-monorepo).

After successful validation and operator review/approval:

### 11.5 Activate the reviewed CI controller

```bash
python3 -B docs/template-initialization/scripts/11_5_activate_ci.py --env /root/PROJECT_SLUG-initialization/values.env --reviewed
```

On interrupted registration preserve its recovery ledger and use the CI owner's
`recover-registration` procedure. A private-repository 404 does not prove runner
deletion. Required transport/isolation repairs must already be installed; upgrades
are separate reviewed work. The [CI operator guide](../../infrastructure/ci/README.md#register-a-private-monorepo)
owns detailed host acceptance and exceptional recovery.

Return to your **workstation** and run
`python3 -B docs/template-initialization/scripts/11_1_transfer_state.py --return-progress`
before continuing. Use the same local `--env` argument if you selected a custom
values location in step 11.1. This retrieves only the operator's updated
`progress.json`, verifies the matching env/receipt identity, and stops if any
local observations would be lost or changed. It preserves the local values and
verification files. When switching contexts again later, transfer the current
observations deliberately; the initial upload refuses differing host files.
Never copy provider tokens, App keys, provisioning credentials or dumps into
this state file.

**Done:** exact consumer registration and current host validation pass, and the
controller is deliberately active.

## 12. Prove CI and configure GitHub policy

Step 12.1 configures and reads back repository Actions permissions automatically:
it enables the checked-in pinned Actions, preserves compatible existing allowlists
and organization restrictions, sets read-only default tokens and disables token
PR approvals. Access/organization conflicts stop with an actionable error; no
organization policy is changed. Preserve runner labels
`[self-hosted, Linux, X64, web-app-ci]`. Keep deployment/registry credentials out
of PR CI. An idle disposable pool may show no online runners; verify real jobs.

On your **workstation**, open and watch the initialization PR:

### 12.1 Open and watch the initialization PR

```bash
python3 -B docs/template-initialization/scripts/12_1_open_initialization_pr.py
```

This step creates the PR only when no matching open PR exists; rerun the same
command to resume after an interruption or timeout. It waits up to five minutes
for GitHub to create the matching CI workflow run, then prints its URL and status
while waiting up to one hour for completion. An empty check list during startup
is expected. Only a successful complete run with its successful `CI gate` counts.
A changed PR source or workflow attempt stops observation; rerun to select the
current source/attempt. Authentication/API failures stop immediately. If no run
appears, inspect Actions policy, workflow triggers and access. A failed/cancelled
run remains failed: fix its cause and **rerun all jobs**, then resume this step.
The script prints a resume command with your selected `--env` path.

Observe the actual `CI gate` name/source App, run URL and Hetzner runner identity.
Exercise task-owned backend-only, frontend-only, both-owner and documentation-only
PR changes; record selected/skipped lanes. Remove temporary failure fixtures
before merging. After failure use **rerun all jobs**: complete shard proof must
come from one workflow attempt.

### 12.2 Configure and verify GitHub policy

On your **workstation**, run this after step 12.1 succeeds:

```bash
python3 -B docs/template-initialization/scripts/12_2_configure_github_policy.py --verify-protection
```

Use the same `--env /absolute/path/values.env` argument if you selected a custom
values location. The script uses your verified repository and selected release
branch, checks admin access and current successful App-bound CI, then configures
`main` protection plus **staging** and **production** according to the
[consumer CI policy](github-ci.md#protect-main-after-successful-ci).
It reads settings back, preserves stronger compatible rules, and stops on access,
plan or policy conflicts instead of weakening protection.

Allow several minutes for two additional CI runs. The script opens one temporary
validation PR, proves a real failing gate blocks merging, removes its failing
fixture, and requires corrected green CI with the allowed merge state. It closes
that PR and removes only its owned branch; it never merges the fixture. Rerun the
same command after an interruption: protected progress records its exact owned
resources and evidence. Do not edit or merge the temporary validation branch.
Resolve any reported stronger-policy conflict before continuing.

Merge the clean green **initialization PR** normally after this step completes.
Then preserve an exact release commit on a branch that will remain unchanged
through promotion:

### 12.3 Preserve the exact release source

```bash
python3 -B docs/template-initialization/scripts/12_3_prepare_release_branch.py
```

**Done:** real consumer CI and merge policy are proved, environments exist, and
an exact release source is selected.

## 13. Configure DNS for both environments

Agent-assisted intake has already configured and verified these exact records.
Reinspect/recheck them here; preserve matching DNS and do not request another UI
write. The manual sequence configures DNS for the first time below.

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

### 14.A Transfer the release observations to the operator host

On your **workstation**, after steps 12.3 and 14.1, run:

```bash
python3 -B docs/template-initialization/scripts/11_1_transfer_state.py --release-context
```

Use the same local `--env /absolute/path/values.env` argument if you selected a
custom values location. First update the operator's reviewed `CI_SOURCE` checkout
to include `--release-context` support; the receiver runs only canonical
root-controlled code.
The command uses the verified slug and operator SSH target, requires the recorded
release SHA/branch and actual workflow IDs, and combines nonconflicting progress
from both contexts. Values and verification bytes must match. It preserves
private backups of the original three files before replacing progress, with
`0700` directories and `0600` files; referenced credentials are never copied.

Conflicting observations stop the transfer without choosing one copy over the
other. Reconcile those fields deliberately and rerun the command; do not erase
host state or repeat the strict initial section 11 upload. The command prints the
exact next operator command, including its `--env` path and selected `--source-sha`.

Transfer the exact clean committed source, including Git identity, to a **new
root-controlled checkout**. Use authorized private GitHub SSH access on the
**operator host** and copy the command printed by 14.A:

### 14.2 Prepare the protected exact source checkout

```bash
python3 -B docs/template-initialization/scripts/14_2_prepare_release_source.py --env /root/PROJECT_SLUG-initialization/values.env --source-sha EXACT_OBSERVED_RELEASE_COMMIT
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

The state transferred in 14.A supplies the observed numeric IDs and exact source
selection. Installation uses those IDs and the selected names/ports/account
identity directly. Run from the protected `RELEASE_SOURCE` checkout:

### 14.4 Install the project release configuration

```bash
python3 -B docs/template-initialization/scripts/14_4_install_release.py
```

### 14.5 Prepare the separate databases and proxy routes

The installed release runtime fixes `SPRINGDOC_APIDOCS_ENABLED` and
`SPRINGDOC_SWAGGERUI_ENABLED` to `true` on staging and `false` on production.
The local profile enables documentation separately; provisioning keeps it off.
No extra values-file input is required. Existing installed helpers and immutable
snapshots need the [reviewed runtime update](../../infrastructure/release/README.md#api-documentation-visibility)
before a later deployment can apply this policy; do not rerun fresh installation
over an existing project. See [Swagger usage](../../README.md#generated-api-documentation)
for paths and the unchanged CSRF flow.

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

The watch step identifies the unique run matching the recorded repository, source
SHA, branch, actor, workflow and bounded dispatch time automatically. It records
the exact run/attempt before watching. Multiple matches stop for inspection;
`--run-id ACTUAL_RUN_ID` remains available for deliberate reconciliation.

### 15.3 Watch the exact staging run

```bash
python3 -B docs/template-initialization/scripts/15_3_watch_staging.py
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
`--reconcile-only` to identify and record the exact run's current state
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

The watch step selects the exact production run automatically using the same
source-bound dispatch identity and ambiguity guards as staging.

### 17.2 Watch and verify the exact production run

```bash
python3 -B docs/template-initialization/scripts/17_2_watch_production.py
```

Production uses the same dispatch-intent protection as staging. After a lost
response, use step 17.2 with `--reconcile-only` to identify, inspect
and record the original run before deciding whether another dispatch is allowed.
For ambiguous or older intents without a bounded window, inspect the exact run
and add `--run-id ACTUAL_RUN_ID`; never redispatch an uncertain request.

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

The script verifies reviewed installed source/configuration, the effective
**03:00 Europe/Zagreb** daily timer, persistence, exact production backup service
and 30-day retention implementation, with staging unscheduled. It enables the
timer, reads back active/enabled state and the next firing, and records those
immediate observations. Observe the first actual scheduled result later; that
future execution remains explicitly pending. Changing the
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

### 19.2 Validate and record full completion

Plain `result.json` is a partial observation report. It cannot authorize the
project-deletion workflow. Full completion requires the actual source-bound
staging and production controller receipts, provisioning receipts, HTTPS checks,
restored-copy checksum and active production backup schedule. Reconcile the final
operator progress into the workstation copy first, preserving its existing local
observations and protected modes.

Create this nonsecret acceptance template beside the protected values file. The
command refuses to replace an existing file. Its unverified defaults deliberately
cannot pass completion. These fields constitute schema version 1; do not add
secrets, raw logs, cookie/CSRF values or provisioning credentials.

```bash
python3 -B docs/template-initialization/scripts/19_2_finalize_initialization.py --prepare-acceptance
```

Review both environments' actual protected controller
`/var/lib/web-app-deploy/PROJECT_SLUG/requests/RUN_ID-RUN_ATTEMPT.json` records.
Project only `state`, `environment`, `run_id`, `run_attempt` and `pair` into
`deployment_receipt`; each must be `success` and match that environment's recorded
run and the exact same immutable staging pair. Production uses its request journal,
not the staging-only `receipts` directory. From each successful
`/var/lib/web-app-deploy/PROJECT_SLUG/ENVIRONMENT/provision-*.json` record, project
only `state` and `backend` into `provisioning_receipt`. A successful section 16/17
provisioning record proves both initial creation and its matching repeat.

Set each HTTPS flag to `true` only after its real check at that environment origin
and recorded run/attempt. Record the actual observation time with timezone.
`login`, `session_persistence` and `logout` represent real account behavior;
`secure_cookie`, `http_only_cookie` and `fresh_csrf` represent the actual session
cookie flags and fresh CSRF handling. Never copy the underlying values.

For `manual`, use `local_application.status: passed`; `ide.status: passed`,
`not-applicable`, or explicitly authorized `waived`; and `artwork.status: accepted`
or `deferred`. Every entry requires an explanatory `evidence` string of 1–800
characters. For an IDE waiver only, also require exact boolean `user_authorized: true`.
For example, use `manual.ide` equal to `{"status":"waived","evidence":"Bruno explicitly waived debugger acceptance; actual terminal-started GUI acceptance is recorded separately.","user_authorized":true}`.
Record the actual instruction; a missing or false authorization cannot waive it.
Other items retain their exact two-field shape and cannot be waived. State the
reason for an exception or deferral. Earlier local/IDE observations can be carried forward only
with their actual scope stated; this does not claim they were rerun at a later
release SHA. An unresolved local application check cannot pass completion.
Keep `acceptance.json` mode `0600` within its existing `0700` private directory.

After completing the checklist from actual evidence, run this on the workstation.
Use the absolute path printed by preparation if the private directory differs:

```bash
python3 -B docs/template-initialization/scripts/19_2_finalize_initialization.py --acceptance-file "$PWD/.template-initialization/acceptance.json"
```

The validated `result.completion` marker records schema version 1, state
`complete`, the exact source SHA, the SHA-256 of the current **progress file
bytes**, and the bounded acceptance input. Missing checks, mixed image pairs,
wrong runs, mismatched restoration or a different backup schedule stop without
replacing the prior result. The scheduled policy must be daily 03:00
Europe/Zagreb, persistent, with 30-day production retention and staging
unscheduled. A future scheduled execution may remain explicitly pending.

Later progress changes invalidate completion for deletion; deliberately rerun
19.2 after reconciling and reviewing those changes. Completion is an explicit
operator evidence assertion checked against its archived inputs, not a signature
or proof of business acceptance. Archive the protected values, verification,
progress and validated result through the [project-deletion workflow](../project-deletion/DELETE_GUIDE.md)
before removing a project.

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
- [ ] Real local GUI login/reload/logout works; terminal launch verified and IDE acceptance observed, genuinely inapplicable or explicitly waived with authorization.
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

This file owns initialization, including its agent-assisted ordering. The [workspace README](../../README.md) owns
ongoing local commands; the [CI operator guide](../../infrastructure/ci/README.md),
[consumer CI contract](github-ci.md) and [release operator guide](../../infrastructure/release/README.md)
own technical interfaces/exceptional recovery. Inspect their current source
before adapting infrastructure procedures.

Preserve accepted setup, credentials and data when resuming this guide.
Documentation checks do not prove a real fresh-consumer initialization; actual
local/provider/release/recovery evidence is required.
