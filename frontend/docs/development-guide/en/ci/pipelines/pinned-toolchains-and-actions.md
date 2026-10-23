# Select declared application toolchains inside the job

Make a disposable worker reproduce the application's declared tools without changing the host installation. Keep application targets, worker validation baselines, dependency locks and third-party Action pins as distinct layers of identity.

**Installed template pattern.** The owning files are `.github/workflows/ci.yml`, frontend `.nvmrc`/`package.json`/lockfile, backend Gradle configuration/Dockerfile and `infrastructure/ci/README.md`. The versions below describe the pinned source snapshot; current owner declarations win when deliberately upgraded.

## Trigger, owner and contract

Use when adding a generated consumer to CI, upgrading Node/npm/Java, updating an Action or diagnosing a job that succeeds only on one developer machine. The application owner chooses language/runtime targets. The pool operator chooses the immutable worker baseline. A baseline upgrade must not accidentally become an application migration.

The contract is explicit job-local selection: CI reads application declarations, selects compatible tools in disposable storage, installs locked dependencies and checks out without retained Git credentials. An ambient desktop PATH or host JDK is not an application interface.

## Separate four different kinds of pin

| Layer                    | Installed owner and meaning                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| Frontend runtime family  | `.nvmrc` selects Node 24; `devEngines` requires 24.x.                                           |
| Package manager          | `packageManager` selects exact npm 12.0.2 at this snapshot; `devEngines` rejects another major. |
| Backend language/runtime | Gradle toolchain and image stages select Java 21.                                               |
| Workflow implementation  | Actions use reviewed full commit SHAs rather than mutable release tags.                         |

The worker guide separately records its own validation pins. A worker containing a newer JDK does not change the backend's Java 21 contract. Frontend `.nvmrc` selects a major, while Docker base digests select particular artifacts; neither should be described as the same kind of exact lock.

## Select tools in disposable storage

The workflow passes `frontend/.nvmrc` to the SHA-pinned setup-node Action and disables package-manager caching. It reads `packageManager`, validates the exact `npm@x.y.z` shape and installs that npm beneath runner temporary storage. Adding its `bin` to `GITHUB_PATH` affects subsequent job steps, not the host's permanent toolchain.

A schematic selection fragment is:

```yaml
# Illustration of scope, not a complete workflow.
env:
  RUNNER_TOOL_CACHE: ${{ runner.temp }}/toolcache
# setup-node: node-version-file: frontend/.nvmrc
# setup-java: distribution: temurin, java-version: "21"
# npm installation prefix: $RUNNER_TEMP/npm
```

The tool cache is inside the disposable job. Backend jobs explicitly select Java 21 with setup-java. Do not request writes to `/opt/jdk` or change deployment-host Java to satisfy a CI compile. These are separate owners with separate activation procedures.

Dependencies are installed with `npm ci` from the application lockfile. Dependency ranges in `package.json` document accepted updates; the lockfile determines the installed graph for a locked run. Changing a range without reviewing the lockfile is not a completed dependency upgrade.

## Pin Actions and preserve checkout boundaries

A full Action commit binds the downloaded implementation rather than trusting a moving tag. Readable comments such as a major version are context, not the pin. Review an update as an implementation change with permissions, inputs and generated side effects, rather than replacing a hash solely to match a newer label.

Checkouts set `persist-credentials: false`, reducing credential residue available to later source scripts. Global workflow permissions are read-only in normal CI. Package publishing authority belongs to the separate fresh release job, not to tool installation or ordinary PR verification.

A pinned Action still downloads runtime artifacts; genuine runner acceptance needs to observe the actual selection/cache location and Gradle target for a new host or consumer. Source configuration describes intent; successful supported execution establishes compatibility.

## Failure and decision table

| Observation                                        | Decision                                                                                      |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Runner has Java 25, app expects 21                 | Select the declared application JDK locally to the job.                                       |
| npm major matches but exact packageManager differs | Select the declared exact version; major compatibility is not the full installation contract. |
| Desktop VS Code sees an older Node                 | Use the project's local toolchain wrapper; do not edit CI pins to match the desktop PATH.     |
| Action tag moved                                   | Review/pin its new commit rather than trusting the tag as immutable.                          |
| Job requests a writable shared cache               | Evaluate freshness/isolation explicitly; the current default is disposable job storage.       |
| Lockfile installation fails                        | Resolve manifest/lock agreement instead of switching to an unconstrained install.             |

## Acceptance and inspection

Inspect application declarations, lockfiles, selected runtime output, job-local installation paths and exact Action commits. Confirm Java compilation and runtime stages remain compatible. Check that no global host install or retained checkout credential was introduced.

Record the source revision and actual tools observed in authorized CI evidence. Link operational setup to `docs/github-ci.md` and the pool guide rather than duplicating host installation commands here. The related **Resource budgets** pattern explains why selecting the right version still requires bounded worker behavior.

## Source provenance

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:.github/workflows/ci.yml`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/.nvmrc`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/package.json`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/package-lock.json`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/build.gradle`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/Dockerfile`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/README.md`
