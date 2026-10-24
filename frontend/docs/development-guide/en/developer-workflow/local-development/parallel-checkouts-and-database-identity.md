# Give parallel checkouts explicit database identity

Keep multiple local worktrees from competing for one port or silently reusing one persistent database. Port binding, Compose project identity, volume state and application account passwords are separate inputs.

**Installed helper contract with a bounded workflow recipe.** `backend/scripts/start-local.mjs`, `backend/compose.yaml` and the local profile define database selection. The steps below apply those interfaces to parallel checkouts; the shipped debugger does not automatically allocate independent frontend/backend application ports.

## Trigger, owner and invariant

Use when a second generated app fails with a port allocation error, a healthy database rejects a new env password, or worktrees need independent data. The developer owns checkout-local ignored configuration and the decision to share or isolate existing state. Another project's data is not disposable because its port conflicts.

The invariant is explicit port plus explicit resource namespace for independence. A new host port alone does not create a new volume. A new password in env alone does not change an initialized database role.

## Follow the selection chain

The helper parses this backend's `.env`, merges values into its Docker process environment and deliberately chooses `COMPOSE_PROJECT_NAME` from that file or the starter default. It does not inherit another checkout's Compose project identity from a parent terminal.

The Compose service publishes container PostgreSQL port `5432` only on loopback, using `POSTGRES_PORT` or its default. Its named `postgres-data` volume is scoped by the selected Compose project. The local Java datasource uses the configured host port and database credentials.

```text
checkout-local .env
   +-> COMPOSE_PROJECT_NAME -> Compose resources / persistent volume
   +-> POSTGRES_PORT        -> host loopback binding
   +-> POSTGRES_*           -> authentication input, not volume reset
```

Neutral illustrative configuration:

```dotenv
COMPOSE_PROJECT_NAME=sample-feature-a-local
POSTGRES_PORT=55480
```

The example port is not promised free. Allocate and inspect an actually unused local binding. Preserve the other env settings and generated secrets; never replace the whole file with this excerpt.

## Decide whether data should be shared

If sharing is intentional, name it explicitly and account for simultaneous schema/application behavior. If independence is required, select both a different project name and a free port before first initialization. A reused project keeps its original data/password even after container recreation.

The start helper first waits for health, then performs a password-authenticated `SELECT 1` through the service interface using the supplied credentials. `pg_isready`, a Unix socket or container loopback can answer under different authentication rules. Healthy-but-rejected therefore means inspect credentials/volume identity, not weaken password verification.

Local initial-user credentials are another boundary: the initializer creates a missing username but does not reset an existing user's password. Database access and browser login can fail independently.

## Use a data-preserving debug flow

| Observation                                 | Interpretation                                  | Decision                                                            |
| ------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------- |
| Port already allocated                      | Existing service owns binding                   | Identify owner; choose another port for the new checkout.           |
| New port, old data still present            | Same Compose project/volume                     | Decide whether reuse was intended; change namespace for isolation.  |
| Healthy DB rejects env password             | Persisted role retains initialization secret    | Restore matching private env or choose a new isolated project/port. |
| DB authentication passes, login fails       | Existing application identity may differ        | Inspect intended account flow without resetting the volume.         |
| Foreign terminal project name has no effect | Helper intentionally ignores inherited identity | Put the chosen identity in this checkout's env.                     |
| Stopped debugger leaves DB running          | Independent persistent lifecycle                | Stop only the intended project's service when appropriate.          |

Do not use volume deletion as routine repair. Normal scoped stop/down preserves the named volume; removing a volume is a separate data-loss decision.

## Do not confuse database isolation with full app isolation

The shipped Java launch and Vite proxy use their configured backend/frontend ports. Changing `POSTGRES_PORT` does not allocate a second API server or rewrite proxy targets. Running complete app instances simultaneously needs a separately reviewed port/proxy arrangement consistent across those owners.

Cookies are scoped by host/path, not isolated merely by different frontend port numbers. Two local applications on the same host can interfere with browser cookie state even while their database volumes are separate. Use deliberate browser profiles/hostname arrangements when authorized, preserving same-origin routing and backend cookie policy rather than opening CORS broadly.

## Acceptance and inspection

Record chosen nonsecret Compose identity, actual free database port, expected data reuse/isolation and authenticated helper result. Verify that unrelated projects remain untouched. For full parallel apps, also record API/proxy/browser identity decisions and their limits.

Operational startup remains in the workspace README. This article does not alter env files, stop services, allocate ports or remove data.

## Source provenance

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:backend/scripts/start-local.mjs`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:backend/compose.yaml`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:backend/src/main/resources/application-local.yaml`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:backend/src/main/java/com/vireocode/backend/user/LocalUserInitializer.java`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.vscode/launch.json`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/vite.config.ts`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:README.md`
