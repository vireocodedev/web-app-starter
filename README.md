# VireoCode Web App Starter

A single-repository starter with a Java Spring Boot backend and a Vite React
TypeScript frontend. GHCR publishing and Hetzner staging/production deployment
will be added separately; this skeleton does not configure or deploy them.

## Create your project from this template

Use GitHub's **Use this template**, create your repository, and clone it locally.
Before starting the local database, ask your AI coding agent to follow the
[template initialization runbook](docs/template-initialization.md). For example:

```text
Follow docs/template-initialization.md to initialize this template consumer.
Project slug: inventory-portal
Display name: Inventory Portal
Java base package: com.acme.inventory
PWA short name: Inventory
Keep the existing artwork for now and report branding as deferred.
Apply the documented naming changes and verify the app.
Do not commit, publish, or deploy.
```

The runbook maps application-owned names to their files and covers Java package
moves, frontend titles, Gradle/VS Code identity, local database isolation, and
test expectations. The agent makes ordinary scoped edits; there is no project
renaming script. Missing inputs are clarified before editing, and existing local
credentials or database volumes are preserved.

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

## Future staging and production

Do not enable the `local` profile outside local development. Without it, startup
requires `DATABASE_URL` (a JDBC PostgreSQL URL), `DATABASE_USERNAME`, and
`DATABASE_PASSWORD`, uses Secure cookies, and never creates an initial user.
Deploy frontend and `/api` under one HTTPS origin using a reverse proxy; the
Vite development proxy is not part of a production build. User provisioning,
container builds, exact GHCR image versions, CI, server configuration, and manual
staging/production deployment are intentionally not implemented yet.
