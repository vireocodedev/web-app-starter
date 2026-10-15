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
Flyway/Hibernate, health, anonymous session and CSRF responses. It uses generated
temporary DB credentials outside source control, bounded probes, no redirects,
and task-unique resource names. Cleanup reconciles uncertain creation by exact
names and removes only its containers/network.

Both working-tree images passed these unchanged restrictions on the supported
Ubuntu 26.04 host. Local Docker rejected every executable with
`no-new-privileges`, including unrelated `id`/BusyBox; no host policy was weakened.
That platform limitation is distinct from application image behavior. Committed
source/image provenance and actual CI acceptance remain the authoritative
publication gate.

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
provisioning, backup scheduling and restore acceptance are still pending.
PR workers must retain their existing production-access denial; deployment
credentials/execution need a distinct reviewed trust path before those
workflows can become operational.
