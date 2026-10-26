# Release one immutable frontend/backend image pair

Treat a fullstack application release as two runnable images from one exact source commit, then promote the same registry digests between environments. This prevents a frontend/backend mismatch and separates artifact identity from branch movement.

**Installed template pattern.** The paired monorepo release contract belongs to `infrastructure/release/README.md`, `protocol.py`, `client.py` and the two application Dockerfiles. Independent component releases from split-repository infrastructure are a different optional architecture, not the default here.

## Trigger, owner and invariant

Use this pattern whenever a frontend and API are delivered together from this template. The application maintainer owns both image definitions and compatibility. The release workflow produces the pair. A protected host executor validates and runs it; it does not accept repository-supplied shell or Compose instructions.

The invariant is one repository, one exact 40-character source SHA, one frontend digest and one backend digest. Staging verifies that pair. Production promotes exactly the accepted pair without rebuilding. PostgreSQL containers and volumes have an independent environment lifecycle and never become replaceable application images.

```text
exact checked-out source SHA
          |
     +----+----+
     |         |
 frontend   backend
     |         |
     +----+----+
       digest pair
          |
  staging verification + durable receipt
          |
  production: same pair, no rebuild
```

## Keep the pair schema deliberately small

The actual parser accepts exactly four keys. This sample is schematic: replace every placeholder with a validated value before any operational use.

```json
{
  "source_sha": "<40-lowercase-hex-characters>",
  "repository": "owner/repository",
  "frontend": "ghcr.io/owner/repository-frontend@sha256:<64-lowercase-hex-characters>",
  "backend": "ghcr.io/owner/repository-backend@sha256:<64-lowercase-hex-characters>"
}
```

`pair()` rejects unknown/missing fields, repository/source mismatch, a mutable tag and an unexpected registry path. Each image reference must use its component-specific GHCR path and a complete digest. The protocol also rejects duplicate JSON keys when decoding, avoiding ambiguous interpretation of the same document.

Publishing temporarily tags images by workflow run and attempt, pushes them, reads their registry digest references, validates the pair and checks private container-package visibility. The tags are publication handles; the recorded digests are deployment identity. A Git SHA label is useful provenance but cannot replace digest selection.

## Build images that remain valid in both environments

The frontend Dockerfile creates a production Vite build with same-origin `/api`, HTTP mode and credentials enabled. It does not bake a staging API hostname into JavaScript. Public routing and TLS belong to the host proxy, so the same image can move to production unchanged. Browser-visible `VITE_*` settings must not contain secrets.

The frontend runtime is an unprivileged Nginx image running as `101:101` on private port `8080`. It supports a read-only filesystem and a bounded writable `/tmp`. Its configuration distinguishes SPA history routes from missing hashed assets and unknown API paths; returning the SPA HTML for those failures would hide integration errors.

The backend compiles with Java 21 in a JDK build stage, then runs the jar with a JRE as `10001:10001`, also on private `8080`. Protected external database configuration is injected at runtime. The jar is read-only; the runtime has dropped capabilities, no-new-privileges and bounded temporary storage in the fixed host configuration. Production credentials and database contents never enter image layers.

Both Dockerfiles validate the source SHA and set OCI source/revision labels. Base images are pinned by digest. Updating a readable tag without changing/reviewing the digest does not update the selected base artifact. `.dockerignore` rules keep local environment files and inappropriate generated inputs outside build contexts.

## Build proof and runtime proof are different

A Docker build proves compilation and packaging under its build contract. It does not prove the ordinary test suite ran. The release build phase separately verifies both applications before packaging; backend image compilation does not run Testcontainers inside BuildKit.

The smoke helper inspects allowlisted image metadata and starts task-unique restricted containers. Frontend checks cover health/HTML/history/API-error/asset behavior. Backend checks use fresh temporary PostgreSQL for migrations, schema validation, health and authentication boundaries. These checks concern the produced artifact rather than a local development server.

The host later verifies pulled provenance, exact running image IDs, container health and expected public routes/environment markers. Artifact production, staging acceptance and live-state verification remain separate evidence claims.

## Failure and decision table

| Observation                                     | Decision                                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Frontend and backend name different source SHAs | Reject the pair; produce a coherent release.                                                |
| Reference is `:latest` or another tag           | Resolve and record validated digest identity through the release protocol.                  |
| Production needs a staging-specific rebuild     | Remove baked environment assumptions before accepting build-once promotion.                 |
| Image has expected labels but wrong digest      | Labels do not establish accepted artifact identity; reject it.                              |
| New image starts against a persistent database  | Treat migration compatibility separately; previous images do not guarantee rollback safety. |
| Host rejects restricted container execution     | Diagnose the supported runtime boundary; do not silently weaken restrictions.               |

## Acceptance and inspection

Inspect that both images use the same exact source, expected component repositories and immutable digests. Confirm private registry visibility, source/revision labels, runtime users, pinned bases and absence of embedded environment secrets. Review frontend history/API/asset boundaries and external backend configuration.

Retain the pair record together with staging run/attempt and successful host receipt. Production evidence must reference those same digests, not a newly built equivalent-looking release. The owning release README provides operational procedures; this page executes no build, publication, workflow dispatch or deployment.

## Source provenance

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/protocol.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/client.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/runtime.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/smoke_images.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/Dockerfile`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/Dockerfile`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/nginx.conf`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/.dockerignore`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/.dockerignore`
