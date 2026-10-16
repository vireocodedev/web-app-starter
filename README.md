# VireoCode Web App Starter

A single-repository starter with a Java Spring Boot backend and a Vite React
TypeScript frontend. Manual paired GHCR/Hetzner release workflows require the
explicit operator setup below; copying this template does not deploy an app.

## Create your project from this template

Use GitHub's **Use this template**, create your repository, and clone it locally.
Open the consumer as a trusted VS Code workspace. Before invoking the skill,
follow the [preparation guide](.github/skills/initialize-project/references/preparation.md)
and start its local browser wizard on Linux with Node 24 and Git:

```sh
node .github/skills/initialize-project/scripts/prepare.mjs
```

The wizard needs no frontend or npm installation. It saves private drafts and,
after explicit human review, the ignored Markdown workbook. Keep the server
terminal open while preparing. Then start a fresh agent chat and invoke the
repository-local skill with **no arguments**:

```text
/initialize-project
```

The [skill](.github/skills/initialize-project/SKILL.md) ships with the template;
no personal/global skill is required. It reads the saved workbook, verifies
live readiness and current written scope, then prepares and verifies local
development, shared CI, both real deployments and recovery. Missing inputs or
access produce a private readiness report, not another configuration interview.
Tool/provider approvals and out-of-scope decisions remain explicit boundaries.
Its status controls whether verified blocker lessons can update reusable guidance
automatically; it is not a simulation flag or additional infrastructure authority.

See the [initialization contract](docs/initialization-contract.md) for inputs,
operator profile, readiness, resume and acceptance, and the
[runbook](docs/template-initialization.md) for exact identity edits and setup
owners. There is no renaming generator. Existing credentials/data are preserved.
An explicitly requested personalization-only task can use the runbook without
authorizing remote publication or deployment.

The file-first workflow still needs a clean fresh-consumer rehearsal to prove
the complete no-follow-up experience. Template deployment
evidence below is not evidence that a new consumer has been initialized.

The [portable package](.github/skills/initialize-project/) contains the wizard,
generic procedures, documentation generator and tests. Its
[dashboard verification](.github/skills/initialize-project/references/runbook.md#project-documentation-dashboard)
is independent of frontend dependencies. The [project dashboard](docs/project.html)
shows only committed public documentation and evidence, never private preparation.

## Local development

Requirements: JDK 21, Docker with Compose, Node 24, and npm 12. The backend uses
Spring Boot 4.1.1 and the included Gradle 9.8.1 wrapper with Groovy build files;
a system Gradle installation is not required.

From the workspace root:

```sh
node backend/scripts/setup-local.mjs
cd backend
docker compose --env-file .env up --detach --wait postgres
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
Stop the local database with `cd backend && docker compose stop postgres`;
normal stop/down commands preserve its volume.

## VS Code

Open this root folder, install the recommended Java extensions, and allow the
Gradle project import to finish. Run and Debug has exactly two configurations:

- **Frontend: local dev** starts Vite in the integrated terminal and explicitly
  selects the real backend, even when an older `.env.local` still selects mocks.
  Run `npm ci` in `frontend` first.
- **Backend: local dev** creates local credentials if missing, starts PostgreSQL
  and waits for health, then launches Spring Boot with Java debugging and the
  `local` profile. Breakpoints work in backend Java code.

The two configurations run independently; start both for the complete app.
Stopping Java does not delete or stop the PostgreSQL service.

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

## Verification

```sh
cd backend
./gradlew test bootJar
```

Backend integration tests start isolated PostgreSQL containers using
Testcontainers. Docker must be running; tests do not use or reset your local
development database and do not require a local `.env`.

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
[initialization runbook](.github/skills/initialize-project/references/runbook.md#5-configure-shared-ci-access)
covers the required inputs and operator handoff.

The selected template host has been rebuilt, installed, and passed
[273 current-source isolation probes](infrastructure/ci/verification/host-acceptance.json).
The organization-owned App is authorized and the registered controller is active
for real-job acceptance. PR/main verification has passed and main protection is
enforced. Cross-repository shared-pool acceptance remains pending. Consumers register
for the verified shared pool rather than rebuilding the operator's host.

## PR CI and branch protection

The [root CI workflow](.github/workflows/ci.yml) selects backend/frontend checks
by changed folder, plus foundation checks for infrastructure changes. Every job
uses the shared Hetzner pool, and the aggregate `CI gate` always reports.
See [consumer CI/protection setup](docs/github-ci.md) for required repository
access, exact check names, and the main-branch policy. See
[live acceptance evidence](docs/acceptance/ci-acceptance.json); no GitHub settings are inherited automatically
when creating a repository from this template.

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

**Verified template activation:** [staging](https://starter-staging.vireocode.com)
and [production](https://starter.vireocode.com) run the same private immutable
frontend/backend pair. Both manual workflows, actual browser authentication,
production pre-migration backups, initialized backup retrieval/isolated restore,
and the enabled daily 03:00 Europe/Zagreb production timer are recorded in
[release acceptance](docs/acceptance/release-acceptance.json). These are the template's
instances, not settings or credentials inherited by a new consumer.
