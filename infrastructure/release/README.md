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
  --env-file /etc/PROJECT/production/database.env \
  --env-file /etc/PROJECT/production/provision-user.env \
  ghcr.io/OWNER/PROJECT-backend@sha256:ACTUAL_DIGEST --provision-user
```

Do not enable `provision-user` on the long-running service or mount these
credentials into normal app containers. Do not use this command as a password
recovery shortcut. Verify real HTTPS login/session/logout separately after
provisioning. The operator command is implemented; no real deployed account
has been created by the template yet.

## Deployment and recovery inputs

The chosen targets are `starter-staging.vireocode.com` and
`starter.vireocode.com` on `46.224.72.162`; consumers substitute their own values.
User-selected production backups are protected **same-server** storage with
30-day retention and explicit server-loss limitation. A fresh verified dump must
precede every production backend migration/replacement. Staging has no scheduled
backups. Daily time/timezone and initialized restore evidence must be recorded
when provisioning.

Two manual whole-app workflow entrypoints, private GHCR publication, trusted
server execution, isolated environment Compose state, TLS, initial-account
installation, backup scheduling and restore acceptance are still pending.
PR workers must retain their existing production-access denial; deployment
credentials/execution need a distinct reviewed trust path before those
workflows can become operational.
