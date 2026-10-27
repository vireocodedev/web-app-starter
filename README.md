# VireoCode Web App Starter

A single-repository starter with a Java Spring Boot backend and a Vite React
TypeScript frontend. Manual paired GHCR/Hetzner release workflows require the
explicit operator setup below; copying this template does not deploy an app.

The [project lifecycle](#project-lifecycle) below connects initialization,
business implementation and acceptance to their procedure owners.

## Create your project from this template

Create a private consumer through GitHub's template UI, clone it and open that
consumer folder in VS Code. Then follow the
[complete manual initialization guide](docs/template-initialization/INIT_GUIDE.md).
It provides numbered steps and copy-paste commands for project identity, local
development, shared CI, staging, production, accounts and recovery. Start with
its project values and access checklist, then work through the steps in order.
The [compact guide](docs/template-initialization/INIT_GUIDE_COMPACT.md) follows the
same steps with short descriptions, commands and separate manual actions.

The [initialization folder index](docs/template-initialization/README.md) lists
the companion references and operator setup tools.

Preserve existing credentials, data and verified setup evidence when resuming.
Completing only the local-development steps establishes local setup; use the
guide's completion checklist before reporting full initialization.

A clean fresh-consumer rehearsal is still required to prove the complete
experience without follow-up intervention. Historical template deployment
evidence below does not prove initialization of a new consumer.

## Project lifecycle

| Stage                                | Completion evidence                                                                         | Procedure owner                                                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Create and open the consumer         | Private repository created through GitHub's template UI, cloned and opened in VS Code       | [Initialization prerequisites](docs/template-initialization/INIT_GUIDE.md#prerequisite-create-and-open-the-consumer-repository) |
| Initialize the project               | Actual local, CI, deployment and recovery evidence within the authorized scope              | [Initialization checklist](docs/template-initialization/INIT_GUIDE.md#completion-checklist)                                     |
| Agree requirements and specification | Reviewed business scope, decisions and observable acceptance criteria                       | Product/client owners; requirements workflow remains to be defined separately                                                   |
| Implement bounded outcomes           | Reviewed changes, relevant passing checks and actual delivery evidence                      | [Agent instructions](AGENTS.md) and [Development Guide](frontend/docs/development-guide/README.md)                              |
| Accept business V1 on staging        | Agreed journeys, roles, integrations and failures accepted on the exact candidate           | Product/client owners and [release procedure](infrastructure/release/README.md#deploy-an-initialized-project)                   |
| Promote and hand over                | Exact accepted image pair in production, smoke/recovery evidence and operating instructions | [Release operator guide](infrastructure/release/README.md)                                                                      |

Initialization delivers a verified foundation. Business V1 requires implemented
and accepted business journeys. Before implementation, agree scope, exclusions,
users, permissions, journeys, data rules, integrations, dependencies and acceptance
criteria. Record unresolved product decisions with an owner and affected work.

Track implementation in issue/PR records. Report local verification, remote CI,
delivery and business acceptance separately. Record acceptance against the exact
staging candidate; promote that frontend/backend image pair without rebuilding.
Finish with production business smoke, current access/operating documentation,
backup retrieval, isolated restore, the agreed backup schedule and known limits.
Keep consumer setup evidence in the [initialization guide](docs/template-initialization/INIT_GUIDE.md#consumer-specific-setup).
Each stage retains the task's actual execution and delivery authorization.

## Local development

Requirements: JDK 21, Docker with Compose, Node 24, and npm 12. The backend uses
Spring Boot 4.1.1 and the included Gradle 9.8.1 wrapper with Groovy build files;
a system Gradle installation is not required.

From the workspace root:

```sh
bash backend/scripts/with-local-node.sh backend/scripts/setup-local.mjs
bash backend/scripts/with-local-node.sh backend/scripts/start-local.mjs
cd backend
./gradlew bootRun --args='--spring.profiles.active=local'
```

The setup command creates an ignored `backend/.env` with random passwords and
never overwrites an existing file. Read `INITIAL_USER_USERNAME` and
`INITIAL_USER_PASSWORD` there to sign in. You can edit the initial identity before
the first backend startup. Passwords must contain at least 12 characters and at
most 72 UTF-8 bytes. The local initializer hashes the password with BCrypt and
creates the user only when that username is absent; it never resets an existing
user's password on restart. Editing the `.env` password after creation does not
change the database password or an existing user's password.

In a second terminal:

```sh
cd frontend
npm ci
cp .env.example .env.local
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

If `.env.local` already exists, update its API settings instead of overwriting
other settings: `VITE_API_BASE_URL=/api`, `VITE_API_MODE=http`, and
`VITE_API_WITH_CREDENTIALS=true`.

Open <http://127.0.0.1:5173>. Vite proxies `/api` to the backend at
<http://127.0.0.1:8080>, keeping cookies same-origin without permissive CORS.
Use one hostname consistently; `localhost` and `127.0.0.1` have separate cookies.
PostgreSQL is bound only to `127.0.0.1:55436` by default, with a persistent Docker
volume. Set `POSTGRES_PORT` in `backend/.env` if that port is already occupied.
Startup also verifies password authentication. A reused volume retains its
original password; restore the matching `.env` credentials or select a separate
`COMPOSE_PROJECT_NAME` and free `POSTGRES_PORT` to preserve existing data.
Stop the local database with `cd backend && docker compose stop postgres`;
normal stop/down commands preserve its volume.

## VS Code

Open this root folder, install the recommended Java extensions, and allow the
Gradle project import to finish. Run and Debug has exactly two configurations:

- **Frontend: local dev** starts Vite in the integrated terminal and explicitly
  selects the real backend, even when an older `.env.local` still selects mocks.
  Run `npm ci` in `frontend` first.
- **Backend: local dev** creates local credentials if missing, starts PostgreSQL
  and verifies password authentication, then launches Spring Boot with Java
  debugging and the `local` profile. Breakpoints work in backend Java code.

The two configurations run independently; start both for the complete app.
Stopping Java does not delete or stop the PostgreSQL service.

Backend tasks select the Node version declared in `frontend/.nvmrc`, using an
existing nvm installation if VS Code's desktop PATH has an older Node. See the
[local debugger setup](docs/template-initialization/INIT_GUIDE.md#9-use-the-vs-code-launchers)
for prerequisites and troubleshooting.

## Backend and authentication

- JPA/Hibernate owns user persistence; Flyway owns schema creation and upgrades.
  Hibernate validates the schema instead of modifying it.
- Spring Security authenticates username/password against hashed database
  credentials. Spring Session JDBC stores opaque sessions in PostgreSQL, so
  authentication is not limited to one backend process.
- The session cookie is HttpOnly and SameSite=Lax. Secure cookies are the default;
  only the loopback-bound `local` profile permits HTTP cookies.
- Login changes the session ID and rotates CSRF protection. The frontend obtains
  a fresh session-bound CSRF token before every unsafe HTTP request. Neither
  authentication credentials nor tokens are persisted in browser storage.
- All endpoints other than login, CSRF, health, and error handling require
  authentication. No public registration endpoint is included.

The frontend adapter uses these endpoints under the `/api` context:

| Method | Endpoint               | Result                                                                                           |
| ------ | ---------------------- | ------------------------------------------------------------------------------------------------ |
| GET    | `/api/auth/csrf`       | `200` with `{ "headerName": "X-CSRF-TOKEN", "token": "..." }`                                    |
| POST   | `/api/auth/login`      | JSON `{ "username": "...", "password": "..." }`; `204` on success, `401` for invalid credentials |
| GET    | `/api/auth/session`    | `200` with `{ "id": "...", "displayName": "...", "email": "..." }`; `401` when anonymous         |
| POST   | `/api/auth/logout`     | `204`, invalidates the session                                                                   |
| GET    | `/api/actuator/health` | Public health status without internal details                                                    |

POST and other unsafe requests require the CSRF response's header and the session
cookie. Missing or invalid CSRF is `403`; malformed login JSON or missing fields
is `400`. A session expires after 30 minutes of inactivity.

Backend API errors use JSON `{ "code": "...", "message": "...", "fieldErrors": [] }`
across MVC, authentication and servlet error handling; `fieldErrors` is always an
array. The frontend renders local messages from stable codes and explicitly
allowed field metadata, never the server's message text. See the
[public error contract](frontend/docs/development-guide/en/backend/foundation/validation-and-error-contracts.md)
for status/code mappings, validation limits and recovery behavior.

Before changing that API, follow the
[API evolution and compatibility policy](frontend/docs/development-guide/en/backend/contracts/api-evolution-and-compatibility.md)
for old/new reader and writer review, independent consumer fixtures, rollout and
explicit approval of breaking changes or removals.

## Verification

Follow the [Development Guide](frontend/docs/development-guide/README.md) and
current source examples when implementing frontend or backend changes. The
[Storybook guide](frontend/docs/storybook/README.md) owns all interactive teaching
examples and article readers; application source contains no development guide.

```sh
cd backend
./gradlew --no-daemon --console=plain test bootJar
```

Backend integration tests start isolated PostgreSQL containers using
Testcontainers. Docker must be running; tests do not use or reset your local
development database and do not require a local `.env`.

ArchUnit architecture checks run as ordinary JUnit tests within that command and
the existing CI test shards. They inspect compiled production bytecode and
intentional violation fixtures without starting Spring or PostgreSQL. For a
focused architecture iteration, run from `backend/`:

```sh
./gradlew --no-daemon --console=plain test --tests '*.architecture.*'
```

The [backend guide](frontend/docs/development-guide/en/backend/foundation/http-service-persistence-boundaries.md#automated-architecture-checks)
owns the enforced contracts and remaining review obligations. New approved
collaborations must keep that contract, its rules and violation proofs aligned.

The [architecture invariant map](frontend/docs/development-guide/en/quality/test-design/architecture-invariants-and-checks.md)
links all installed frontend/backend architecture guards to their executable
checks, proof fixtures and remaining review obligations.

```sh
cd frontend
npm run test -- tests/integration/auth
npm run verify
```

See the [frontend guide](frontend/README.md) for architecture and mock-mode
development. Mock `demo` credentials are fixtures, not real backend credentials.

## Shared Hetzner CI foundation

This repository owns the [shared CI foundation](infrastructure/ci/README.md):
one isolated, disposable worker pool for explicitly registered private monorepos.
Template consumers register their repository for that pool rather than install
another permanent runner. The
[initialization guide](docs/template-initialization/INIT_GUIDE.md#11-register-the-repository-with-shared-ci)
covers the required inputs and operator handoff.

Confirm current pool capacity, repository registration and installation validation
with the operator. The [historical host validation record](infrastructure/ci/verification/host-acceptance.json)
describes its recorded source, configuration and boot; each consumer needs its own
current CI and branch-protection evidence.

## PR CI and branch protection

The [root CI workflow](.github/workflows/ci.yml) selects backend/frontend checks
by changed folder, plus foundation checks for infrastructure changes. Every job
uses the shared Hetzner pool, and the aggregate `CI gate` always reports.
See [consumer CI/protection setup](docs/template-initialization/github-ci.md) for required repository
access, exact check names, and the main-branch policy. Configure those settings
explicitly for each consumer repository.

## Staging and production

Production frontend/backend images and their restricted runtime smoke tests
are defined in [paired releases](infrastructure/release/README.md). CI verifies
each selected image. Manual **Deploy staging** and **Deploy production** use a
host-side controller, private immutable GHCR pairs and staging-to-production
promotion. Follow the
[operator setup](infrastructure/release/README.md#operator-installation-and-activation)
before dispatch; the controller never grants PR workers host access.

Deployed accounts require
[explicit one-time operator provisioning](infrastructure/release/README.md#one-time-deployed-user-provisioning).
Normal startup never seeds them or resets existing credentials.

Do not enable the `local` profile outside local development. Without it, startup
requires `DATABASE_URL` (a JDBC PostgreSQL URL), `DATABASE_USERNAME`, and
`DATABASE_PASSWORD`, uses Secure cookies, and never creates an initial user.
Deploy frontend and `/api` under one HTTPS origin using a reverse proxy; the
Vite development proxy is not part of a production build.
