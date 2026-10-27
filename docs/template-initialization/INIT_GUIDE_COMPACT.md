# Initialize a project — compact guide

Follow steps in order. Numbers match [INIT_GUIDE.md](INIT_GUIDE.md); lettered steps
are manual. Use the full guide for explanations, conflicts and recovery.

## Before section 1

### A. Create the consumer repository — manual

Use **vireocodedev/web-app-starter → Use this template → Create a new repository**;
choose the existing organization, **Private**, default branch **main** and a slug
of 3–40 lowercase letters/digits separated by single hyphens, starting with a letter.

### B. Clone and open the consumer — manual

Clone the new repository and open its root in VS Code. Run workstation commands
there; never run consumer initialization in the canonical template checkout.

### C. Follow execution and preservation rules — manual

Run commands separately and stop on failure. Preserve existing files, credentials,
volumes and observations; use the full guide to reconcile interrupted work.
Keep secrets and dumps outside Git, chat and logs.

### D. Select scope and command inputs — manual

For local-only work, use local parts of sections 1–10 and record section 19.
Replace uppercase command placeholders with actual values. Custom workstation
values paths require `--env /absolute/path/values.env` on later Python initialization
commands; the Bash Node helper takes no `--env`.

## 1. Choose project values and access

### 1.A Confirm access, resources and backup risk — manual

Confirm the [access checklist](INIT_GUIDE.md#1-choose-project-values-and-access):
organization-owner/admin login, private protection/package access, shared CI
operator window, existing release host, DNS credentials, private storage and
free local ports 5173/8080/55436. Accept same-server backup loss risk or arrange
reviewed off-server recovery before claiming readiness.

### 1.1 Create the private values file — workstation

Create the protected file without overwriting an existing one.

```bash
python3 -B docs/template-initialization/scripts/1_1_prepare_values.py
```

### 1.B Edit the project values — manual, workstation

Edit `.template-initialization/values.env`: existing owner/slug, display name,
Java package, PWA short name, maintainer/account identity, two unused hostnames
and protected DNS credential-file path. Keep credentials outside this file.

### 1.2 Select available deployment ports — workstation

After editing values, use existing attested SSH/root access to check listeners
and reservations and save four free ports. Skip for local-only setup.

```bash
python3 -B docs/template-initialization/scripts/1_2_select_deployment_ports.py
```

## 2. Prepare your workstation

### 2.A Install workstation prerequisites — manual

Install Git, Bash, Python 3.11+, ripgrep (`rg`), GitHub CLI, JDK 21, Docker with
Compose **5.x**, Node 24/npm 12 and `dig`; allow your user to use Docker.
On Ubuntu/Debian, install the `ripgrep` package for `rg`.

### 2.1 Prepare Node with existing nvm — workstation

Select the required Node version using the existing nvm installation.

```bash
bash docs/template-initialization/scripts/2_1_prepare_node.sh
```

### 2.2 Check required tools — workstation

Verify versions and Docker daemon access.

```bash
python3 -B docs/template-initialization/scripts/2_2_check_tools.py
```

### 2.3 Authenticate the intended GitHub account — workstation

Use the configured organization-owner account with repository admin rights.

```bash
python3 -B docs/template-initialization/scripts/2_3_authenticate_github.py
```

### 2.4 Verify selected values — workstation

Use `--scope local` for local-only setup; use `--mode resume` for recorded setup.
Repeat verification after input changes or the receipt's 24-hour expiry.

```bash
python3 -B docs/template-initialization/scripts/2_4_verify_values.py --scope full --mode new
```

## 3. Inspect the consumer and begin initialization

### 3.1 Inspect the actual consumer checkout — workstation

Check origin, branch, changes and the recorded consumer identity.

```bash
python3 -B docs/template-initialization/scripts/3_1_inspect_checkout.py
```

### 3.2 Begin the initialization branch — workstation

Create or resume the consumer's initialization branch.

```bash
python3 -B docs/template-initialization/scripts/3_2_begin_initialization.py
```

## 4. Personalize the backend

### 4.1 Apply backend identity — workstation

Apply the verified Gradle, application, Compose, env-example, startup-fallback and
VS Code main-class values. Recognized template/already-selected fields are safe
to retry; unrelated content is preserved. Add `--open` only for optional inspection.

```bash
python3 -B docs/template-initialization/scripts/4_1_edit_backend_identity.py
```

### 4.2 Refactor both Java package roots — workstation

Move main/test application packages and code references, preserving SQL, fixtures
and comments. Completed retries are no-ops; mixed/partial trees stop for inspection.

```bash
python3 -B docs/template-initialization/scripts/4_2_refactor_java_packages.py
```

## 5. Personalize the frontend and documentation

### 5.1 Apply frontend and documentation identity — workstation

Update package/lock names, HTML/manifest titles, both shell-title locales and
README identity automatically; preserve dependencies, framework provenance and artwork.

```bash
python3 -B docs/template-initialization/scripts/5_1_edit_frontend_identity.py
```

### 5.2 Update title expectations — workstation

Apply the selected title suffix to actual assertions, preserving page-title
prefixes and mock credentials.

```bash
python3 -B docs/template-initialization/scripts/5_2_edit_title_expectations.py
```

### 5.A Review artwork — manual

Replace shell/favicon/PWA artwork with supplied assets or retain the recorded
branding deferral. Check light/dark readability and keep accurate RGO alt text,
framework attribution and licenses for retained artwork.

## 6. Audit personalization

### 6.1 Verify selected identity automatically — workstation

Check all owned identity fields, Java packages, title expectations and whitespace.
Known neutral references are classified automatically; unexpected leftovers fail
with a named path/field and repair step.

```bash
python3 -B docs/template-initialization/scripts/6_1_audit_identity.py
```

## 7. Prepare local configuration

### 7.1 Prepare private backend configuration — workstation

Generate `backend/.env` credentials while preserving an existing file.

```bash
python3 -B docs/template-initialization/scripts/7_1_prepare_backend_env.py
```

### 7.A Confirm private backend identity — manual

Privately check project/database names, initial user and free local database port
in `backend/.env`. Preserve matching existing credentials/data; keep generated
passwords (12 characters minimum, 72 UTF-8 bytes maximum).

### 7.2 Prepare frontend dependencies and HTTP settings — workstation

Install locked dependencies, format the frontend identity files automatically
and prepare public HTTP-mode configuration.

```bash
python3 -B docs/template-initialization/scripts/7_2_prepare_frontend_env.py
```

### 7.3 Verify private configuration is ignored — workstation

Confirm private local files are excluded from Git.

```bash
python3 -B docs/template-initialization/scripts/7_3_verify_ignored_env.py
```

## 8. Exercise the real local application

### 8.1 Start backend and PostgreSQL — workstation, backend terminal

Start the local database/backend; initialized volumes keep their existing credentials.

```bash
python3 -B docs/template-initialization/scripts/8_1_start_backend.py
```

### 8.2 Start frontend — workstation, second terminal

Run from the same consumer root in another terminal.

```bash
python3 -B docs/template-initialization/scripts/8_2_start_frontend.py
```

### 8.A Verify local login and names — manual

Open `http://127.0.0.1:5173`; use initial-user credentials from `backend/.env`.
Verify login, navigation, reload/session persistence, logout and both locales'
names/titles. Keep this hostname consistent; mock credentials are unrelated.

### 8.3 Check backend health — workstation

Verify the running local backend's health.

```bash
python3 -B docs/template-initialization/scripts/8_3_check_local_health.py
```

### 8.B Stop terminal application processes — manual

Stop your frontend/backend with Ctrl+C before IDE launches or heavy verification.

### 8.4 Stop this database — workstation

Stop this checkout's PostgreSQL while preserving its volume.

```bash
python3 -B docs/template-initialization/scripts/8_4_stop_database.py
```

## 9. Verify VS Code launchers

### 9.A Exercise the debugger — manual

Trust the workspace, install `.vscode/extensions.json` recommendations and wait
for Java/Gradle import. Start **Backend: local dev**, then **Frontend: local dev**;
verify login and a backend breakpoint, then stop both sessions. Record this check
as inapplicable if using another editor.

### 9.1 Inspect IDE configuration — workstation

Check configuration; actual debugger acceptance remains the preceding manual step.

```bash
python3 -B docs/template-initialization/scripts/9_1_check_ide_configuration.py
```

## 10. Verify and publish

### 10.1 Run local verification sequentially — workstation

Stop your development processes first; keep Docker available. Use installed Google
Chrome or add `--install-browser` to install the configured browser channel.

```bash
python3 -B docs/template-initialization/scripts/10_1_verify_local.py
```

### 10.2 Review intended changes — workstation

Inspect status and the diff; this script stages nothing.

```bash
python3 -B docs/template-initialization/scripts/10_2_review_changes.py
```

### 10.A Finish staging and choose delivery scope — manual

Stage intended tracked changes with `git add -p` or selected paths; add new/moved
files with explicit `git add PATH`. Inspect the staged diff for secrets/dumps.
Local-only scope stops here and records section 19; skip publication and
remote/operator steps unless full setup is intended.

### 10.3 Publish reviewed changes — workstation

Commit and push the reviewed initialization branch.

```bash
python3 -B docs/template-initialization/scripts/10_3_publish_changes.py
```

## 11. Register shared CI

### 11.A Verify GitHub App repository access — manual

Open the [existing CI App installation](https://github.com/organizations/vireocodedev/settings/installations/171464279).
Keep **Only select repositories**; add/verify this exact consumer and save without
removing existing selections. Confirm **Actions: Read-only**, **Administration:
Read and write**, **Metadata: Read-only**; the private key stays on the host.

### 11.B Agree the maintenance window and source — manual

Coordinate shared-pool downtime with its operator. Verify the host's canonical,
reviewed `CI_SOURCE` checkout includes these scripts and matches the receipt's
verifier code; preserve other consumers and use the verified SSH host key.

### 11.1 Transfer initialization state — workstation

Upload the three protected state files; copy the printed operator commands with
your actual host `--env` path. Replace `PROJECT_SLUG` below with your configured slug.

```bash
python3 -B docs/template-initialization/scripts/11_1_transfer_state.py
```

### 11.C Open the operator session — manual

Connect to the configured `OPERATOR_SSH` as the authorized root operator and
enter the reviewed `CI_SOURCE` checkout. Run steps 11.2–11.5 there, never locally
with sudo or inside CI workers.

### 11.2 Prepare consumer registration — operator host

Create the protected registration file; inspect an existing file before resuming.

```bash
python3 -B docs/template-initialization/scripts/11_2_prepare_registration.py --env /root/PROJECT_SLUG-initialization/values.env
```

### 11.3 Stop and inspect the shared controller — operator host

Stop the controller and print current state and `configuration_sha256`.

```bash
python3 -B docs/template-initialization/scripts/11_3_stop_and_inspect_ci.py --env /root/PROJECT_SLUG-initialization/values.env
```

### 11.D Review stopped/idle state — manual

Confirm stopped/disabled controller, idle workers, no jobs or residual boundary
mounts and current source/boot/isolation prerequisites. Copy the observed
configuration hash into step 11.4.

### 11.4 Register and validate — operator host

Allow several quiet minutes; wait for full worker/isolation/Docker validation.
If interrupted, reconcile registration using the full guide before retrying.

```bash
python3 -B docs/template-initialization/scripts/11_4_register_and_validate_ci.py --env /root/PROJECT_SLUG-initialization/values.env --expected-config-sha256 CURRENT_OBSERVED_CONFIG_SHA256
```

### 11.E Review validation evidence — manual

Require fresh source/configuration/boot-bound successful validation and operator
approval before activating the shared controller.

### 11.5 Activate reviewed CI — operator host

Activate only after the preceding review.

```bash
python3 -B docs/template-initialization/scripts/11_5_activate_ci.py --env /root/PROJECT_SLUG-initialization/values.env --reviewed
```

### 11.1 Return updated progress — workstation

Retrieve matching operator progress without losing local observations; use your
original local `--env` path if customized.

```bash
python3 -B docs/template-initialization/scripts/11_1_transfer_state.py --return-progress
```

## 12. Prove CI and configure GitHub policy

### 12.A Permit checked-in Actions — manual

In consumer **Settings → Actions → General**, permit pinned checked-in Actions
and read-only tokens. Preserve runner labels `[self-hosted, Linux, X64, web-app-ci]`;
keep deployment/registry credentials out of PR CI.

### 12.1 Open and watch initialization PR — workstation

Create/resume the matching PR and wait for its exact successful CI run/gate.
After fixing a failed run, rerun **all jobs**, then resume this command.

```bash
python3 -B docs/template-initialization/scripts/12_1_open_initialization_pr.py
```

### 12.B Verify owner selection — manual

Use task-owned backend-only, frontend-only, both-owner and documentation-only PR
changes to observe selected/skipped lanes and the real gate/App/run/runner.
Remove temporary fixtures, rerun all jobs and complete step 12.1 before continuing.

### 12.2 Configure and verify GitHub policy — workstation

Configure/read back main protection and staging/production environments; allow
several minutes for failing-then-green validation PR CI. Rerun this command to
resume; never edit or merge its temporary validation branch.

```bash
python3 -B docs/template-initialization/scripts/12_2_configure_github_policy.py --verify-protection
```

### 12.C Merge the initialization PR — manual

After policy verification, merge the clean green initialization PR normally.
Resolve reported access/plan/policy conflicts without weakening protection.

### 12.3 Preserve exact release source — workstation

Create the selected release branch and retain its exact observed commit SHA;
keep that branch unchanged through production promotion.

```bash
python3 -B docs/template-initialization/scripts/12_3_prepare_release_branch.py
```

## 13. Configure DNS

### 13.1 Inspect existing DNS — workstation

Inspect the existing authoritative zone and records using the DNS-project credential.

```bash
python3 -B docs/template-initialization/scripts/13_1_inspect_dns.py
```

### 13.A Create or reconcile the two A records — manual

In the existing DNS zone, point staging/production names to the operator-confirmed
IPv4, TTL 300 where supported. Preserve matching/unrelated records and delegation;
reconcile conflicting A/AAAA/CNAME records without duplicating them.

### 13.2 Verify authoritative and public answers — workstation

Check both names on every authoritative server and public resolvers; wait for caches.

```bash
python3 -B docs/template-initialization/scripts/13_2_verify_dns.py
```

## 14. Prepare isolated release environments

### 14.1 Observe repository and workflow IDs — workstation

Record actual IDs bound to this consumer.

```bash
python3 -B docs/template-initialization/scripts/14_1_observe_repository_ids.py
```

### 14.A Reconcile state on the operator host — manual

Transfer current `values.env`, `verification.json` and `progress.json` to the
protected operator directory, preserving bytes and observations: root-owned
0600 files in a 0700 directory. Reconcile differing progress first; the initial
11.1 upload intentionally refuses to overwrite newer host state.

### 14.2 Prepare exact release source — operator host, reviewed CI_SOURCE checkout

Use authorized private GitHub SSH access and the exact SHA from step 12.3;
create a new root-controlled consumer source checkout without credentials in URLs.

```bash
python3 -B docs/template-initialization/scripts/14_2_prepare_release_source.py --env /root/PROJECT_SLUG-initialization/values.env --source-sha EXACT_OBSERVED_RELEASE_COMMIT
```

### 14.B Inspect and enter the release source — manual

Review the exact clean checkout and shared App signer; verify root-controlled,
non-writable-by-others ancestors. Enter the printed `RELEASE_SOURCE` checkout
for subsequent operator steps; do not recursively chown unrelated paths.

### 14.3 Check project collisions — operator host, RELEASE_SOURCE checkout

Check selected ports, paths, loaded/on-disk units, networks, volumes and all
containers, including stopped ones. Reconcile existing/partial resources.

```bash
python3 -B docs/template-initialization/scripts/14_3_check_release_collisions.py --env /root/PROJECT_SLUG-initialization/values.env
```

### 14.4 Install release configuration — operator host, RELEASE_SOURCE checkout

Install project-scoped protected configuration and disabled units.

```bash
python3 -B docs/template-initialization/scripts/14_4_install_release.py --env /root/PROJECT_SLUG-initialization/values.env
```

### 14.5 Prepare databases and proxy — operator host, RELEASE_SOURCE checkout

Prepare separate private PostgreSQL instances and this project's Caddy routes;
inspect retained `preparation.json` after interruption before retrying.

```bash
python3 -B docs/template-initialization/scripts/14_5_prepare_release.py --env /root/PROJECT_SLUG-initialization/values.env
```

### 14.C Accept the installed release configuration — manual

Verify source/file hashes, repository/workflow IDs, actors, trusted pins, hostnames,
ports, unit hardening, DB isolation/health, Caddy routing, root-only 0700/0600
storage, App Actions-read access and rejection of untrusted requests; record
source/configuration/host-bound evidence before activation.

### 14.6 Publish only the public certificate — workstation

Retrieve and configure the public certificate; leave all private keys and
database/provisioning credentials on the host.

```bash
python3 -B docs/template-initialization/scripts/14_6_publish_certificate.py
```

### 14.D Reconcile observations before activation — manual

Preserve current workstation/operator progress across the context switch,
including observed source/workflow IDs. Keep the production backup timer
disabled until initialized restore acceptance in section 18.

### 14.7 Activate reviewed project controller — operator host, RELEASE_SOURCE checkout

Activate only after release configuration acceptance.

```bash
python3 -B docs/template-initialization/scripts/14_7_activate_controller.py --env /root/PROJECT_SLUG-initialization/values.env --reviewed
```

## 15. Deploy staging

### 15.1 Inspect registry package names — workstation

Repeat immediately before first publication; require private packages linked
to this exact consumer, never another repository's packages.

```bash
python3 -B docs/template-initialization/scripts/15_1_inspect_packages.py
```

### 15.A Resolve absent or inaccessible packages — manual, if needed

Use the organization's package inventory with proper access to confirm absence
and creation permission. A 403/404 alone is insufficient. Preserve conflicting
packages; continue below only after absence and creation permission are confirmed.

### 15.1 Record confirmed package absence — workstation, only if needed

After the preceding inventory review, repeat the package check with confirmation.

```bash
python3 -B docs/template-initialization/scripts/15_1_inspect_packages.py --absence-confirmed
```

### 15.2 Dispatch staging — workstation

Dispatch the exact selected release source after package checks succeed.

```bash
python3 -B docs/template-initialization/scripts/15_2_dispatch_staging.py
```

### 15.B Select the exact staging run — manual

Match source SHA, branch, actor and dispatch time; put its observed run ID below.
After an uncertain dispatch, inspect/reconcile that run before dispatching again.

### 15.3 Watch the exact staging run — workstation

Require complete workflow and actual host deployment success; use
`--reconcile-only` after a lost response to record the selected run without redispatch.

```bash
python3 -B docs/template-initialization/scripts/15_3_watch_staging.py --run-id ACTUAL_RUN_ID
```

### 15.4 Verify staging TLS and health — workstation

Verify public TLS, staging environment identity, health, SPA and API behavior.

```bash
python3 -B docs/template-initialization/scripts/15_4_verify_staging.py
```

### 15.C Compare host and published release evidence — manual

Require private packages owned by this repository; compare active source/pair,
container image IDs, workflow run/attempt and durable staging receipt. Record
the source SHA and both immutable digests; publication alone is incomplete.

## 16. Provision staging account

### 16.A Transfer current observations — manual

Reconcile current workstation/operator progress before provisioning. Retain
source/pair/run evidence and matching protected env/receipt files.

### 16.1 Provision and repeat-check staging account — operator host, RELEASE_SOURCE checkout

Provision using the active backend digest and existing environment lock;
do not wrap this script in another lock or use it as a password reset.

```bash
python3 -B docs/template-initialization/scripts/16_1_provision_staging.py --env /root/PROJECT_SLUG-initialization/values.env
```

### 16.B Verify real staging authentication — manual

Privately obtain staging credentials from its `provision-user.env`; test HTTPS
login, navigation, reload/session persistence and logout. Confirm Secure/HttpOnly
cookies and fresh CSRF without recording credential/token values.

## 17. Promote production

### 17.A Confirm the accepted source — manual

Verify the release branch still points to staging's accepted source SHA;
reconcile current progress back to the workstation without losing observations.

### 17.1 Promote the accepted staging pair — workstation

Promote the exact immutable pair without rebuilding.

```bash
python3 -B docs/template-initialization/scripts/17_1_promote_production.py
```

### 17.B Select the exact production run — manual

Match source SHA, branch, actor and dispatch time; put its observed run ID below.

### 17.2 Watch and verify production — workstation

Wait for actual promotion success; use `--reconcile-only` after a lost response
before considering another dispatch.

```bash
python3 -B docs/template-initialization/scripts/17_2_watch_production.py --run-id ACTUAL_RUN_ID
```

### 17.C Transfer production observations — manual

Reconcile current state onto the operator host, preserving source/pair/run evidence
and matching protected env/receipt files.

### 17.3 Provision and repeat-check production account — operator host, RELEASE_SOURCE checkout

Provision with the active digest and a fresh verified backup under the script's
single lock; never invoke another lock-taking backup inside it.

```bash
python3 -B docs/template-initialization/scripts/17_3_provision_production.py --env /root/PROJECT_SLUG-initialization/values.env
```

### 17.D Verify production acceptance — manual

Privately obtain separate production credentials; test real HTTPS login/reload/logout.
Verify production environment identity, health and exact staging pair/container
images; record source SHA and both release run/attempt IDs.

## 18. Verify initialized recovery and schedule backups

### 18.1 Create verified initialized backup — operator host, RELEASE_SOURCE checkout

After account provisioning, create the finalized production dump and metadata;
require `initialized: true`, expected nonzero users, bytes and checksum.

```bash
python3 -B docs/template-initialization/scripts/18_1_create_initialized_backup.py --env /root/PROJECT_SLUG-initialization/values.env
```

### 18.A Retain the exact finalized backup path — manual

Use the printed `.dump` path and adjacent `.dump.json`, never `.partial`.
Reconcile operator progress to the workstation before retrieval; keep backups
in protected storage outside Git and workflow artifacts.

### 18.2 Retrieve and verify backup — workstation

Retrieve the exact observed initialized dump and verify matching metadata/checksum.

```bash
python3 -B docs/template-initialization/scripts/18_2_retrieve_backup.py --remote-dump EXACT_OBSERVED_DUMP_PATH
```

### 18.3 Transfer the retrieved recovery copy — workstation

Transfer that checksum-matched retrieved copy to a new root-only recovery directory
on the supported operator recovery host.

```bash
python3 -B docs/template-initialization/scripts/18_3_transfer_recovery_copy.py
```

### 18.B Transfer retrieved-copy evidence — manual

Reconcile current protected state onto the recovery host, including the workstation's
`retrieved_backup_sha256`. Use the supported host; never restore into a live database
or weaken Docker/AppArmor restrictions.

### 18.4 Restore the retrieved copy in isolation — operator recovery host, RELEASE_SOURCE checkout

Run the bounded scratch restore; preserve original/retrieved backups and inspect
retained task intent on failure before cleanup or retry.

```bash
python3 -B docs/template-initialization/scripts/18_4_restore_rehearsal.py --env /root/PROJECT_SLUG-initialization/values.env
```

### 18.C Approve the backup schedule — manual

After initialized restore acceptance, review **03:00 Europe/Zagreb daily**, 30-day
production retention and same-server loss risk; staging remains unscheduled.
Arrange reviewed changes if these defaults are insufficient.

### 18.5 Enable reviewed backup schedule — operator host, RELEASE_SOURCE checkout

Enable only after the preceding recovery/risk review.

```bash
python3 -B docs/template-initialization/scripts/18_5_enable_backup_schedule.py --env /root/PROJECT_SLUG-initialization/values.env --reviewed
```

### 18.D Record timer state and observe its first result — manual

Confirm persistent scheduling, retention and the next firing. Record the first
scheduled outcome when it actually occurs; leave that observation pending until then.

## 19. Record the result

### 19.A Reconcile final progress — manual

Bring final operator observations back to the workstation, preserving all local
evidence, matching env/receipt identity and protected file modes.

### 19.1 Record nonsecret observations — workstation

Write the private source-bound result; manual acceptance remains separately recorded.

```bash
python3 -B docs/template-initialization/scripts/19_1_record_result.py
```

### 19.B Maintain the consumer handoff — manual

Update [Consumer-specific setup](INIT_GUIDE.md#consumer-specific-setup) with actual
identity, checks, source/config/CI/release receipts, immutable digests, authentication,
recovery checksum/timer state, artwork decisions and limits. Include only protected
credential references; publish intended documentation through normal green CI.

### 19.C Check completion — manual

Complete the full guide's [completion checklist](INIT_GUIDE.md#completion-checklist)
using observed consumer evidence. Record local-only scope, deferred work and pending
scheduled-backup observations; business requirements/acceptance follow initialization.
