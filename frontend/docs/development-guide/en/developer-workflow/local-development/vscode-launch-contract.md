# Diagnose the VS Code launch contract in dependency order

Make the checked-in debugger configuration the reproducible entrypoint for local work, then diagnose its first failed dependency. A Java launch, a database task and a frontend terminal have different prerequisites and lifetimes.

**Installed starter workflow.** `.vscode/launch.json`, `.vscode/tasks.json` and the backend local helpers define the behavior. The workspace README and initializer runbook own setup prerequisites. This article narrows the broader **One workspace, two runtimes** introduction into a debugging decision flow.

## Trigger, owner and contract

Use when Run and Debug fails before Java starts, when a desktop-launched VS Code sees an old Node, or when a breakpoint never becomes active. The workspace owns launch/task composition. Backend code owns application startup; installed Java extensions and Gradle import belong to IDE preparation.

The invariant is prepare credentials, start and authenticate this checkout's database, then launch Java from the backend directory with the local profile. The frontend launch is independent and explicitly selects real HTTP. Neither configuration silently starts the other application.

## Read the actual backend chain

```text
Backend: local dev
  -> Backend: prepare local credentials
     -> with-local-node.sh -> setup-local.mjs
  -> Backend: start local PostgreSQL
     -> with-local-node.sh -> start-local.mjs
     -> Compose readiness + password-authenticated SELECT 1
  -> Java BackendApplication, backend cwd, backend/.env, local profile
```

Process tasks pass workspace-based absolute script paths, avoiding shell argument/cwd assumptions. Setup uses exclusive creation and leaves an existing env file unchanged. “Keeping the existing backend/.env unchanged” is a successful preservation result, not a stalled prompt or proof that its credentials still match the volume.

The start helper chooses explicit Compose file/env paths and password-checks through service DNS. Readiness alone does not prove authentication. A pre-launch failure correctly prevents Java from starting against a database with unknown identity or rejected credentials.

## Separate desktop PATH from installed runtimes

Backend tasks read the required major from `frontend/.nvmrc`. If PATH lacks it, `with-local-node.sh` tries an existing nvm installation, selects an already installed matching Node and verifies again. It never downloads a runtime. A clear missing-runtime error means prepare that prerequisite, not weaken the script to accept an older Node.

The frontend node-terminal configuration runs npm directly from `frontend/`; it does not use the backend Node wrapper. Install the declared Node/npm and locked frontend dependencies before launching it. Fixing backend task PATH does not prove the frontend terminal's own tools are available.

Java debug uses the real main class, backend working directory, env file and `--spring.profiles.active=local`. Open the repository root, trust the intended workspace and finish the recommended Java extension/Gradle import before evaluating breakpoint behavior. Do not add a different hard-coded main class from a consumer project.

## Follow the first failure

| First observed failure                        | Decision                                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Node major unavailable                        | Prepare the declared installed runtime/nvm path and retry the same task.                    |
| Docker unavailable or Compose denied          | Resolve local Docker access; Java configuration is not the failing layer.                   |
| Loopback database port allocated              | Identify owner and select a free checkout-specific database port.                           |
| Database healthy but password check fails     | Reconcile env/volume identity without deleting data.                                        |
| Java launch cannot resolve project/main class | Inspect IDE import/extensions and current package identity.                                 |
| Java starts but breakpoint is unbound         | Confirm the imported project/source and actual launched class before editing task behavior. |
| Browser shows mock responses                  | Confirm which frontend process was launched and its explicit API mode.                      |

## Preserve lifetimes and inputs

The frontend configuration fixes `/api`, HTTP mode, credentials enabled and development label for its process, overriding a stale local mock-mode setting. A separately started Vite process still uses its own configuration. Strict loopback port selection prevents silently opening a second frontend at another port.

Stopping the Java debugger does not stop/delete PostgreSQL. That persistent lifecycle is deliberate. Use the documented project-scoped Compose stop operation when finished; do not add volume teardown to the debugger's normal stop path.

The local profile permits HTTP cookies only for local development. Do not repair deployed HTTPS behavior by reusing this launch profile or putting production credentials in the local env file.

## Acceptance and inspection

For an authorized setup task, record actual launch labels, runtime selection, successful pre-launch authentication, Java startup/breakpoint and whether the browser used real HTTP. Keep env contents and login secrets private.

If blocked, name the failed layer precisely and preserve existing data. A successful debug session proves local startup, not full regression coverage, CI readiness or deployment authority. Detailed prerequisites remain in the runbook; this article executes no task or debugger.

## Source provenance

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.vscode/launch.json`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.vscode/tasks.json`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:backend/scripts/with-local-node.sh`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:backend/scripts/setup-local.mjs`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:backend/scripts/start-local.mjs`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:README.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/initialize-project/references/runbook.md`
