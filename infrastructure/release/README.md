# Paired whole-app releases

A release contains a separately runnable frontend image and backend image,
both built from one verified source commit. Staging and production will deploy
the matched pair rather than expose component-only deployment options.
Database containers/volumes are environment infrastructure, never part of an
application image replacement.

## Image contract

- Build from [frontend/Dockerfile](../../frontend/Dockerfile) and
  [backend/Dockerfile](../../backend/Dockerfile), using their own context roots.
- Set `SOURCE_SHA` to the exact 40-character checked-out commit and `SOURCE_URL`
  to the consumer repository's canonical GitHub URL. Both images carry those
  OCI labels. Deployment will use registry digests, not mutable tags.
- Base manifests are pinned to real amd64-capable digests. Updating a tag without
  reviewing its digest does not update the image.
- The frontend uses a production Vite build with same-origin `/api`, HTTP API
  mode, credentials enabled, and no baked environment hostnames. This allows the
  same image to be promoted from staging to production. Local environment files
  and dependencies/build outputs are excluded from contexts.
- Frontend runs as UID/GID `101`; backend as `10001`. Both expose private port
  `8080`, support read-only filesystems, dropped capabilities and
  `no-new-privileges`, and use a bounded writable `/tmp`.
- Frontend serves SPA history routes while unknown `/api` and missing hashed
  assets remain `404`. The host proxy owns backend routing and public TLS.
- Backend starts against protected external PostgreSQL configuration; no
  production account/password or database data is embedded in its image.

From the root, after the ordinary repo verification commands:

```sh
SOURCE_SHA=$(git rev-parse HEAD)
SOURCE_URL=https://github.com/YOUR-OWNER/YOUR-REPOSITORY
docker build --platform linux/amd64 --build-arg SOURCE_SHA="$SOURCE_SHA" \
  --build-arg SOURCE_URL="$SOURCE_URL" -t starter-backend:verified backend
docker build --platform linux/amd64 --build-arg SOURCE_SHA="$SOURCE_SHA" \
  --build-arg SOURCE_URL="$SOURCE_URL" -t starter-frontend:verified frontend
python3 -B infrastructure/release/smoke_images.py \
  --backend starter-backend:verified --frontend starter-frontend:verified \
  --source-sha "$SOURCE_SHA"
```

The Docker build compiles the app; the workflow must separately run the existing
meaningful tests before building/publishing. Backend image builds do not run
Testcontainers inside BuildKit.

## Runtime verification

[smoke_images.py](smoke_images.py) checks only allowlisted image metadata, starts
temporary restricted containers, validates frontend HTML/SPA/API-error handling,
and starts the backend against fresh disposable PostgreSQL to exercise
Flyway/Hibernate, health, anonymous session and CSRF responses. It also checks
normal startup ignores provisioning settings, the explicit one-time command
terminates, matching repeats preserve the user, and mismatched credentials fail
without altering the row. It uses generated
temporary DB credentials outside source control, bounded probes, no redirects,
and task-unique resource names. Cleanup reconciles uncertain creation by exact
names and removes only its containers/network.

Both working-tree images passed these unchanged restrictions on the supported
Ubuntu 26.04 host. Local Docker rejected every executable with
`no-new-privileges`, including unrelated `id`/BusyBox; no host policy was weakened.
That platform limitation is distinct from application image behavior. Committed
source/image provenance and actual CI acceptance remain the authoritative
publication gate.

## One-time deployed user provisioning

Normal backend startup creates no users, even if provisioning settings are
present. The operator-only `--provision-user` command activates a separate
profile, connects to PostgreSQL, runs Flyway migrations and Hibernate validation,
creates one BCrypt-hashed enabled user, and closes the application context.
It binds a temporary server only on loopback with an ephemeral port and must
not publish a container port. It refuses the `local` profile.

Supply these values through a separate protected mode `0600` environment file,
under a root-only directory on the host, never command arguments or Actions
variables:

- `PROVISION_USER_USERNAME`
- `PROVISION_USER_PASSWORD` (12 or more characters, at most 72 UTF-8 bytes)
- `PROVISION_USER_DISPLAY_NAME`
- `PROVISION_USER_EMAIL`

Generate different credentials for staging and production and store the files
separately. Repeated provisioning succeeds only when the existing enabled user,
display name, email and password match. It never resets credentials, enables a
disabled account, or updates an existing identity; conflicts fail explicitly.
Validation errors report field names, not input values. This starter currently
has only the `USER` authority; an initial account named `admin` does not add an
unimplemented administrator authorization model.

After environment provisioning, under its operator lock, use the **currently
deployed backend digest**, existing database network and protected database env
file. Obtain a fresh verified production backup first, especially if using an
image that could contain new migrations. For example (substitute the actual
installed paths/network/digest, which are not provisioned yet):

```sh
docker run --rm --network PROJECT-production-db --read-only --cap-drop ALL \
  --security-opt no-new-privileges --memory 512m --pids-limit 256 \
  --tmpfs /tmp:rw,size=64m,mode=1777 \
  --env-file /etc/web-app-deploy/PROJECT/production/database.env \
  --env-file /etc/web-app-deploy/PROJECT/production/provision-user.env \
  ghcr.io/OWNER/PROJECT-backend@sha256:ACTUAL_DIGEST --provision-user
```

Do not enable `provision-user` on the long-running service or mount these
credentials into normal app containers. Do not use this command as a password
recovery shortcut. Verify real HTTPS login/session/logout separately after
provisioning. The template's real accounts were installed as explicit one-time
operator actions; template copies receive no accounts or credentials.

## Deployment and recovery inputs

The chosen targets are `starter-staging.vireocode.com` and
`starter.vireocode.com` on `46.224.72.162`; consumers substitute their own values.
User-selected production backups are protected **same-server** storage with
30-day retention and explicit server-loss limitation. A fresh verified dump must
precede every production backend migration/replacement. Staging has no scheduled
backups. Daily time/timezone and initialized restore evidence must be recorded
when provisioning.

The two manual workflows and host controller are implemented below. Their live
activation, first GHCR publication, real deployments/TLS/accounts and initialized
restore acceptance require the operator gates below; source alone is not evidence.
The template's completed activation and exact digests/run IDs are recorded in
[release acceptance](../../docs/release-acceptance.json).

## Deploy an initialized project

From GitHub Actions choose **Deploy staging**, select the desired source branch,
and dispatch. Wait for the complete workflow, not just image publication.
Then choose **Deploy production**, select a branch still pointing to that exact
tested source SHA, and enter the successful staging run ID.

```sh
gh workflow run deploy-staging.yaml --repo OWNER/REPOSITORY --ref SOURCE_BRANCH
gh workflow run deploy-production.yaml --repo OWNER/REPOSITORY \
  --ref SAME_SOURCE_BRANCH -f staging_run_id=SUCCESSFUL_STAGING_RUN_ID
```

If the original branch moved, preserve/use a release branch at the verified
commit; do not change a pair's source SHA to match a newer branch tip.
The first real promotion used `release/initial-starter-966e551` to demonstrate
non-main branch selection and avoid rebuilding the already verified images.
The app source and installed host-executor source can differ: an explicitly
reviewed operator fix to backup durability does not rebuild application images
or silently alter their source identity.

Initial username is `admin` for the template only. Passwords are distinct and
remain in `/etc/web-app-deploy/web-app-starter/<environment>/provision-user.env`
on the host, root-owned `0600` beneath root-only directories. Read the selected
file through authorized SSH, not through chat, logs, screenshots or GitHub.
Consumers choose their own identity and receive new generated credentials.

## Manual workflow contract

- [Deploy staging](../../.github/workflows/deploy-staging.yaml) uses GitHub's
  native branch selector, verifies the exact checkout and both applications,
  builds candidate images in a read-only-token worker, then independently
  smoke-tests/publishes them in a fresh worker which has not executed branch
  Gradle/npm code. It records
  `release-pair-<attempt>` with both immutable digests.
- [Deploy production](../../.github/workflows/deploy-production.yaml) takes a
  successful staging run ID. Select the same source commit with the branch
  selector; a moved branch or a different commit fails. It promotes the exact
  recorded pair without rebuilding. A successful host-side staging receipt is
  also required; a fabricated artifact or unrelated green workflow cannot
  authorize promotion.
- Both use only the disposable Hetzner pool, one concurrency group per
  environment, and `cancel-in-progress: false`. No component selector, automatic
  production promotion, GitHub-hosted runner, or required approving review.
- Only staging's fresh verification/publication job has package-write permission.
  All privileged workflow helpers use isolated Python (`-I -S`); the client
  loads only its explicitly pinned transport file without adding the checkout
  to Python's import path. Branch-added sibling modules cannot shadow standard
  library imports, and build processes cannot rewrite another worker's helpers.
  The request/wait jobs have
  only contents/actions/package read and deployment-status write. PR CI remains
  read-only, without deployment credentials or host access.

The jobs never SSH to the host. [client.py](client.py) encrypts their short-lived
request-job `GITHUB_TOKEN` and release ticket to the host's public certificate
using OpenSSL CMS (AES-256-GCM, RSA-OAEP/SHA-256). Only ciphertext is uploaded as
the one-day `deploy-request-<attempt>` artifact. The private key stays on the
host. This avoids a permanent GHCR password/PAT: the controller pulls while the
job is still alive, uses a root-only temporary Docker login directory, and
removes that directory afterwards. The job waits for the host's GitHub
Deployment status; image upload alone never produces success.

[controller.py](controller.py) polls GitHub using a repository-scoped
**Actions-read-only** installation token from the existing reviewed CI App
signer. Its App configuration/permissions are not expanded; the CI service,
worker filesystem/network policy and isolation receipt are not changed.
The deployment service has its own code, state, locks and per-project unit.
It verifies:

1. The actual active `workflow_dispatch` run/attempt, exact repository numeric
   IDs, expected workflow ID/path, and allowlisted original/triggering actors.
   Runner labels and the CI controller's observed candidate job are never
   deployment authorization.
2. The artifact inventory, compressed SHA-256 digest, bounded single zip member,
   allowlisted Azure HTTPS download host, and authenticated CMS decryption.
   Signed artifact downloads receive no GitHub Authorization header.
3. The request-job token's private repository access, exact Deployment payload
   and environment/source identity.
4. Installed SHA-256 pins of both workflows and the workflow client, transport
   and smoke helper at the selected source commit, plus the actual in-progress
   request job. Branches may change application code, not bypass the trusted
   verification/handoff implementation.
5. For production, successful staging workflow and a matching durable host
   receipt for that exact staging run attempt and image pair.

No repository code, shell command, Compose file, mount or server path is accepted
from an artifact. [runtime.py](runtime.py) generates the fixed app services from
protected host configuration. It pulls/inspects exact digests before mutation,
locks the environment, reconciles prior active state, preserves the separate
PostgreSQL project/volume, and validates actual container image IDs, health and
public routes/environment headers. Production stops the old backend and verifies
a fresh persisted dump/TOC/checksum before the candidate can start Flyway.
A backup failure starts the old backend again; a failure after replacement
leaves explicit transaction evidence and requires operator reconciliation.
There is no automatic database restore or unproven application rollback.

## Operator installation and activation

Consumers require an operator-approved host, exact repository/numeric IDs,
authorized maintainer logins, two hostnames, four unused loopback ports, initial
account identity, and protected CI App metadata/key references. Extend the
App's selected-repository access and register CI first; do not copy the
template's repository/workflow IDs, hostnames, ports or generated credentials.
The current target uses `18080/18081` for staging frontend/backend and
`18180/18181` for production. Other projects must allocate unused ports.

1. Merge the reviewed implementation with green CI. Obtain actual workflow IDs
   from GitHub. Transfer a **clean exact committed checkout**, including its Git
   identity, into an operator-controlled root-owned directory. Independent
   review and real supported-host validation are required before activation.
2. Run [install.py](install.py) as root from that protected checkout. It accepts
   `--repository`, `--repository-id`, `--slug`, repeatable `--actor`,
   `--staging-workflow-id`, `--production-workflow-id`, `--staging-hostname`,
   `--production-hostname`, the four `--<environment>-<component>-port` arguments,
   `--username`, `--display-name`, and `--email`. Optional `--app-settings` and
   `--app-key` are protected **paths**, not secret values.
   It refuses an existing project installation rather than overwrite it.
3. Installation creates these project-scoped, root-only paths:
   - `/etc/web-app-deploy/<slug>/`: protected controller/runtime configuration,
     source receipt, CMS private key/public certificate, separate environment
     DB and provisioning credentials.
   - `/usr/local/lib/web-app-deploy/<slug>/`: reviewed installed controller,
     runtime, transport and unchanged shared App signer.
   - `/var/lib/web-app-deploy/<slug>/`: request journals, staging receipts,
     environment locks, immutable app snapshots, active/transaction records,
     and production backups.
   - Disabled `web-app-deploy-<slug>.service`,
     `web-app-backup-<slug>.service` and `web-app-backup-<slug>.timer`.
   Unit hardening includes a read-only host filesystem and only the project's
   state writable; access to the host Docker socket is privileged and confined
   to this reviewed host process, never a runner.
4. Publish **only** the generated public `controller.crt` as the repository
   Actions variable `DEPLOY_CONTROLLER_CERT`. No server private key, SSH key,
   DB password, App key, registry password, or plaintext workflow token belongs
   in an Actions variable/artifact.
5. Run [prepare.py](prepare.py) with `--config` pointing to the protected
   `controller.json`. It checks free ports and absent project resources,
   records creation intent, provisions separate labeled networks/volumes and
   pinned PostgreSQL instances without public DB ports, and adds only
   `/etc/caddy/sites/<slug>.caddy`. It validates the full Caddy configuration
   before reload, preserves `/api`, and adds `X-Vireo-Environment`.
   Interrupted preparation must be inspected, not blindly rerun or erased.
6. Verify installed source hashes, root-only paths, DB readiness/isolation,
   App Actions-read access and rejected untrusted requests on the actual host.
   Retain source/configuration/host-bound evidence. Enable the project controller
   only after review and validation, then run **Deploy staging** manually.
   Verify private GHCR visibility/access and exact pair/source/container/public
   identities. Follow with **Deploy production** using that successful staging
   run ID and the same selected source commit.
7. Run explicit one-time user provisioning using the active backend digest,
   separate protected credential file and DB network under the environment
   lock; production needs another fresh verified backup. Verify real HTTPS
   login/session/logout without exposing credentials. Ordinary app containers
   must not receive provisioning credentials.
8. Verify a real initialized production dump, retrieve it to a protected
   operator destination, and restore it into an isolated temporary database.
   Only after recovery evidence exists, enable the production backup timer.
   Its approved schedule is **03:00 Europe/Zagreb daily**, 30-day retention,
   same-server storage with acknowledged server-loss limitation. No staging
   backup timer exists.

GitHub Environments need no required reviewers or main-only restrictions.
Template-created repositories inherit none of these remote settings or host
registrations. The controller's workflow source pins intentionally require an
explicit reviewed stopped/idle operator update when trusted workflow/helper
bytes change; there is no generic live-upgrade command. Adding another project
uses separate paths/units/ports and leaves existing consumers untouched.

## Failure and recovery

Do not retry a timed-out mutation, rerun installation, delete a volume, change
an active pointer, or restore PostgreSQL merely to turn a workflow green.
Inspect `requests/<run>-<attempt>.json`, `<environment>/transaction.json`,
`active.json`, the referenced immutable snapshot, exact running image IDs,
database health/migration history and the GitHub run first.

A started request journal is never replayed automatically after a controller
restart. A non-successful replacement transaction blocks subsequent mutations.
Resolve it explicitly under the environment lock, preserving the evidence;
after data migrations, prefer a reviewed forward fix. The old image's presence
does not prove rollback compatibility. A lost final GitHub status can leave a
verified server deployment with a failing/waiting workflow: reconcile actual
state and report honestly rather than deploy twice.

Rejected runs and inventory failures are isolated per run/environment; one
unauthorized staging request cannot prevent production polling. Backup dumps
remain `.partial` until verification and durable metadata exist. Failed partials
are removed; retention handles legacy orphan dumps/metadata and interrupted
pruning without poisoning future verified backups.
The finalized backup filename is also directory-fsynced before the production
gate returns, so verification is not limited to the contents of an inode whose
final name could be lost on a crash.

Use `journalctl -u web-app-deploy-<slug>.service` for fixed credential-free
categories. Never dump container environments, resolved secret-bearing Compose,
CMS plaintext, Docker login files, database contents, or raw application logs.
Scheduled/manual backups use the same environment lock; the backup CLI is
`runtime.py backup --config <protected-runtime.json>`.

## Rehearse recovery without touching a live database

1. Run the installed backup CLI as root (or start the project's backup service).
   Those entrypoints enforce `umask 0077`; do not bypass their credential/file
   safeguards with an ad-hoc imported helper. Record the exact completed dump
   and its `.dump.json`, not a `.partial` or a pre-initialization empty archive.
2. Retrieve both files over verified SSH into an operator-owned `0700` directory
   **outside Git**, preserving file mode `0600`. Check bytes and SHA-256 against
   metadata, and require `initialized: true` plus the expected user/data counts.
   Never put dumps, credentials or restored application data in workflow artifacts.
3. Restore the **retrieved copy**, not merely the original server file, on a
   supported recovery host. The first rehearsal downloaded to protected local
   storage, verified it, then uploaded that same checksum-matched copy to a
   root-only temporary directory on the supported host.
4. Create a task-unique PostgreSQL container from the pinned image above with
   `--network none`, no published ports, no bind mounts/persistent volumes,
   UID/GID `999:999`, read-only root, dropped capabilities, `no-new-privileges`,
   memory/PID limits, and bounded tmpfs at `/var/lib/postgresql`,
   `/var/run/postgresql` and `/tmp`. Generate unrelated scratch DB credentials
   in a temporary protected env file; never reuse production credentials.
   PostgreSQL 18 uses the parent `/var/lib/postgresql` volume boundary.
5. After bounded `pg_isready`, stream the archive into the exact scratch name:

   ```sh
   docker exec -i EXACT_SCRATCH_NAME pg_restore -U restore -d restore \
     --exit-on-error --no-owner --no-privileges < PROTECTED_RETRIEVED_DUMP
   ```

   Capture errors privately; do not print restored data or credential-bearing
   diagnostics. Verify expected initialized user rows/enabled BCrypt hashes,
   successful Flyway versions and the session tables. The initial rehearsal
   restored one enabled user, two migrations and queryable session data.
6. Verify the scratch container's task-specific ownership label before removing
   only that exact container and temporary credential/copy files. Preserve the
   original backups and protected retrieved operator copy. If local Docker
   rejects restricted runtimes, use a supported host; do not drop restrictions
   or weaken global Docker/AppArmor policy to obtain a passing test.

This is a recovery rehearsal, not authorization to restore production. A real
data-loss recovery needs a separate explicit decision naming the backup,
environment, exact destination volume and data-loss/retention consequences.
Never automatically restore over the live database or infer image rollback
compatibility from the existence of an old digest.

**Current operational limits:** both manual releases and real browser flows
passed, and the production timer is enabled only after the initialized restore
passed. Its first scheduled firing is still future evidence. Shared CI
cross-repository acceptance and a separate observed controller-memory OOM remain
follow-ups. Ubuntu unattended security updates were identified as the cause of
the interrupted initial CI run; updates were not disabled or protections relaxed.
