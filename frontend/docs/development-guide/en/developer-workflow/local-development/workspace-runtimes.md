# One workspace, two runtimes

**Support status: installed starter workflow.** The workspace combines a Java 21 / Spring Boot backend with a Node 24 / npm 12 frontend toolchain. Node also executes the backend's local database helpers. These contracts come from the checked-in configuration; inspect them again in a generated consumer before changing a runtime or copying another project's launch command.

Use this guide when preparing a checkout, launching both sides through VS Code, diagnosing a database port or password failure, or separating a real-backend session problem from mock-mode behavior. The canonical setup procedure remains the workspace `README.md`, identified in the source references below; a source path here is a repository lookup, not an assumed browser URL.

## Establish the runtime contract before launching

Java is selected through the Java 21 toolchain in `backend/build.gradle`; use the included Gradle wrapper. Node's required major is recorded in `frontend/.nvmrc`. `frontend/package.json` declares Node 24.x and npm 12.x as required development engines, with a package-manager declaration of npm 12.0.2 at this snapshot.

An integrated terminal and a desktop-launched VS Code process can inherit different PATH values. `with-local-node.sh` checks the required major from `.nvmrc`, attempts to select an already installed matching runtime through nvm, then fails clearly if it cannot. It does not install Node or upgrade a developer's global tools. Java debugging still requires the recommended Java extensions and completion of the Gradle project import.

Preparation is complete when the checkout's declared Java, Node and npm requirements are available and the operator can distinguish the root workspace from either package directory. Changing a project command to accommodate an unrelated old shell runtime hides the actual prerequisite.

## Follow the backend pre-launch order

The installed VS Code **Backend: local dev** configuration runs a dependency chain before launching Java:

```text
Backend: prepare local credentials
  -> with-local-node.sh setup-local.mjs
Backend: start local PostgreSQL
  -> with-local-node.sh start-local.mjs
  -> Compose up --detach --wait postgres
  -> password-authenticated SELECT 1 through service DNS
BackendApplication with the local profile and backend working directory
```

The Java launch reads the checkout's ignored backend environment file and uses the `local` profile. Setup creates missing local credentials using exclusive file creation and preserves an existing file. The database helper combines that file with the process environment and deliberately selects the Compose identity from the file or the starter's local default, avoiding another checkout's inherited `COMPOSE_PROJECT_NAME`.

Compose health alone is insufficient evidence that Java can authenticate. A loopback or socket probe can succeed under a different authentication rule. The helper performs a separate password check against the database service interface using the same supplied credentials. A successful pre-launch therefore establishes more than an accepting TCP socket.

## Treat port, identity and volume as separate decisions

The installed PostgreSQL service binds only to loopback, with default host port 55436 and container port 5432. `POSTGRES_PORT` selects a different host port. `COMPOSE_PROJECT_NAME` selects the Compose project and associated resource namespace. The named database volume persists independently of a Java debug session.

| Symptom                                     | Interpretation                                                     | Recovery that preserves existing work                                                               |
| ------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Host port already allocated                 | Another service owns the selected binding                          | Identify it; choose a free `POSTGRES_PORT` for this checkout                                        |
| Healthy database rejects supplied password  | A reused volume can retain its original initialization credentials | Restore the matching configuration or deliberately choose a separate project identity and free port |
| Java stopped but database still running     | Debugger lifecycle differs from Compose lifecycle                  | Stop this project's service through the documented Compose workflow                                 |
| Changed initial-user password has no effect | Local seeding leaves an existing username unchanged                | Use the intended account workflow; environment edits are not password reset                         |

Changing only the host port does not create a fresh database. Changing only an environment password does not rewrite a reused volume's password. Preserve credentials and volumes while diagnosing; deletion is not the default repair. The normal documented stop/down operations preserve the database volume. Another project's healthy database is not disposable just because its port conflicts with this checkout.

## Keep the browser on one origin

**Frontend: local dev** launches Vite on loopback port 5173 with a strict port and explicitly selects `/api`, HTTP mode, credentialed requests and the development environment. Install the frontend's locked dependencies first. This launch overrides an older local mock-mode choice for that process; a separately started frontend must still use its intended configuration.

The Vite proxy forwards `/api` to the loopback backend at port 8080. The browser addresses one frontend origin, so session cookies work without adding permissive CORS. Use one hostname consistently: `localhost` and `127.0.0.1` are distinct cookie hosts. The local Spring profile permits HTTP cookies; the base deployed configuration retains secure cookies.

The two VS Code configurations are independent. Start both to use the real backend. Mock fixture credentials are not database credentials, and a responsive mock screen is not evidence that PostgreSQL or backend authentication works. The Vite development proxy is not part of a production build; deployed same-origin HTTPS routing has its own operator-owned configuration.

## Finish with scoped evidence

For a future local setup task, record the declared runtimes, selected launch modes, database identity/port decision and observed startup result without publishing credential values. Record whether authentication was checked against real HTTP or mocks. If a failure remains, identify whether it concerns runtime selection, Compose ownership, password authentication, Java startup or browser cookie routing.

Repository verification normally includes tests. An explicit task instruction can restrict execution; select only authorized checks and report omissions without changing the template's verification policy. A successful local launch is likewise not permission to deploy, alter infrastructure or publish a release.

## Exact source references

- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:README.md` — authoritative local setup, debugger, authentication and verification procedure.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:backend/build.gradle` — Java toolchain and backend dependencies.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/.nvmrc` and `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/package.json` — Node/npm contracts.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:.vscode/launch.json` and `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:.vscode/tasks.json` — independent launch configurations and ordered preparation.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:backend/scripts/with-local-node.sh` — desktop PATH recovery through an installed Node runtime.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:backend/scripts/setup-local.mjs` and `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:backend/scripts/start-local.mjs` — preserved credentials, explicit Compose identity and password verification.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:backend/compose.yaml` and `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/vite.config.ts` — loopback database binding, persistent volume and API proxy.
