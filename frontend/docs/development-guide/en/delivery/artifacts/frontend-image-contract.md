# Build a frontend image that can move between environments

Produce static browser assets once, serve them with explicit HTTP boundaries and let the environment proxy own API routing. A frontend image is a production artifact with cache, privilege and route contracts, not a development server in a container.

**Installed template pattern.** The owners are `frontend/Dockerfile`, `frontend/nginx.conf`, frontend build configuration and `frontend/.dockerignore`. The release runtime supplies restrictions and public routing. Read **Immutable image pairs** for the larger frontend/backend identity contract.

## Trigger, owner and invariant

Use when changing frontend build arguments, API configuration, SPA routing, asset caching or image runtime. The frontend owner controls compiled public configuration and Nginx behavior. The host operator controls public TLS, backend proxying and environment allocation.

The invariant is one image for staging and production, with no baked environment hostname or secret. Both environments use same-origin `/api`; the proxy sends those requests to the backend. The frontend server must not turn a missing API or hashed asset into a successful HTML response.

## Understand build-time public configuration

The build stage selects the package manager declared in `package.json`, installs locked dependencies and copies the frontend context. It then sets the production configuration before `npm run build`:

```dockerfile
ENV VITE_API_BASE_URL=/api \
    VITE_API_WITH_CREDENTIALS=true \
    VITE_API_MODE=http \
    VITE_APP_ENV=production
```

This is an excerpt of the current owner, not an environment provisioning recipe. These values are compiled into browser assets. Adding a container environment variable after the image is built does not rewrite those assets. If future requirements need runtime public configuration, design and verify an explicit loader contract rather than assuming arbitrary `docker run -e VITE_*` changes the application.

Anything compiled into browser JavaScript is public. A `VITE_*` value is not a secret store. Database credentials, registry tokens and private API keys belong outside the frontend context and image.

`.dockerignore` excludes local env files, dependencies, built outputs, reports and other local state. The build uses the frontend directory as its context, so the ignore rules and copied paths are evaluated there. A successful local Vite dev session does not exercise this production packaging path.

## Keep HTTP failure semantics visible

| Request class                             | Installed behavior                                    |
| ----------------------------------------- | ----------------------------------------------------- |
| `/healthz`                                | Small independent 200 readiness response.             |
| `/api` or `/api/...` reaching Nginx       | 404; public proxy is responsible for backend routing. |
| `/assets/...` that exists                 | Static asset with one-year immutable cache policy.    |
| Missing `/assets/...`                     | 404 instead of SPA fallback.                          |
| `/index.html`                             | `Cache-Control: no-store`.                            |
| Client-side history path such as `/login` | Existing file/directory, otherwise `/index.html`.     |

The exact asset lifetime is `31536000` seconds in this snapshot. Hashed filenames let changed assets get new URLs, while a fresh index points to the accepted release's files. Do not apply immutable caching to the index. Conversely, a missing old hash must remain a visible failure, not a 200 HTML body that later causes a confusing JavaScript parser error.

API 404 here does not replace backend authorization or routing. It reveals proxy misconfiguration instead of swallowing it. The frontend image has no production backend proxy target embedded in Nginx.

## Run with the intended runtime boundary

The runtime uses a digest-pinned unprivileged Nginx base and `101:101`, serves private port `8080` and stores its PID/temp files beneath `/tmp`. Static files are copied read-only. The fixed runtime adds read-only root, dropped capabilities, no-new-privileges, memory/PID bounds and bounded tmpfs.

Public TLS and environment markers belong to the host proxy; the image does not request host certificates or a Docker socket. A health response proves this server is reachable, not that the right application pair, public routing or user journey is accepted.

Development-only routing and mock setup remain governed by the frontend environment policy. The source excludes development routes from production availability and removes the MSW worker from build output. Do not enable mock mode in the production image to make a demo look complete.

## Failure and decision table

| Observation                            | Decision                                                                           |
| -------------------------------------- | ---------------------------------------------------------------------------------- |
| Staging API hostname appears in JS     | Restore same-origin configuration before accepting build-once promotion.           |
| API failure returns HTML with 200      | Fix proxy/Nginx boundary; do not compensate in every caller.                       |
| Missing asset returns index HTML       | Restore explicit asset 404 behavior.                                               |
| Old index survives deployment          | Inspect no-store headers and intermediary caches.                                  |
| Runtime env change has no effect on JS | It was build-time configuration; rebuild coherently or design an explicit loader.  |
| Nginx needs writable system paths      | Align temp/PID paths with the restricted runtime instead of granting broad writes. |

## Acceptance and inspection

Inspect the built image's source label, non-root user and static config. Authorized artifact verification should exercise real history routes, unknown API and missing assets under runtime restrictions. Inspect cache headers separately: the smoke helper's status probes do not by themselves certify every caching rule.

Confirm no development worker or secret entered the output and that public proxy identity matches the expected environment. Operational commands remain in `infrastructure/release/README.md`; this article is inert documentation and does not build or run a container.

## Source provenance

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/Dockerfile`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/nginx.conf`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/.dockerignore`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/vite.config.ts`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/src/main.tsx`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/src/app/router/routeRegistry.tsx`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/runtime.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md`
