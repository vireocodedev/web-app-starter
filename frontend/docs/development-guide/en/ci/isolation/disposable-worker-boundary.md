# Treat the disposable worker as a verified trust boundary

Run repository code in a fresh, bounded environment that cannot mutate the deployment host or inherit another job's state. A runner label selects a queue; it does not prove authorization, isolation or cleanup.

**Installed template pattern.** The permanent CI foundation belongs to `infrastructure/ci/README.md` and the fixed lifecycle interface in `infrastructure/ci/manage.py`. Application workflows consume it. This page explains the boundary; it does not install, register, activate or upgrade infrastructure.

## Trigger, owner and contract

Use this pattern for pull-request code, dependency installation, build scripts, browser tooling and Testcontainers. These are executable inputs, including when an apparently harmless source change triggers package lifecycle scripts.

The protected operator owns installation, selected private repository registrations, controller credentials, capacity and source-bound acceptance. The application maintainer owns ordinary workflow commands and toolchain declarations. A consumer asks for registration in the shared pool rather than provisioning another permanent runner from its copied infrastructure directory.

The invariant is fresh job state plus bounded authority: one repository-scoped just-in-time runner, new filesystem and namespaces, a private rootless Docker daemon, resource ceilings and complete owned-resource cleanup. No job receives the host Docker socket, host SSH/deployment credentials, application state or writable cache shared with another job.

```text
registered private repository
            |
protected CI controller -- repository-scoped JIT registration
            |
    disposable worker boundary
    filesystem / processes / network / Docker / resource limits
            |
      checkout and PR commands

protected deployment executor -- host Docker and deployed app state
             separate authority and lifecycle
```

## Follow the lifecycle instead of trusting the label

The installed controller serves an explicit protected repository map and bounded pool. `[self-hosted, Linux, X64, web-app-ci]` routes jobs to that mechanism. The controller's App key and controller tokens remain outside the job. A one-job JIT configuration is consumed by the runner listener; the startup helper removes its file and replaces its parent shell to avoid retaining extra inherited secret copies.

Before creating a normal JIT registration, the controller durably records creation intent with a unique nonsecret name. It records the returned runner ID before branch code starts. A lost response is therefore an uncertain mutation to reconcile, not permission to create another runner blindly.

On interruption, cleanup reconciles exact owned names and IDs through an authenticated complete inventory. Inaccessible repository access, ambiguous creation or a mismatched surviving runner preserves recovery state. An inventory `404` does not establish absence. Only explicit rejection known to create nothing can clear an intent without reconciliation.

After work ends, worker files, containers, processes, namespaces and registrations must disappear. Idle ephemeral capacity can legitimately show no online runners. An actual successful GitHub job and cleanup observations are stronger evidence than a static runner list.

## Resource limits are part of the boundary

The source example defines memory high/max, swap, CPU quota, task count, job storage, lifetime and host reserve. Pool configuration also bounds aggregate capacity. These are selected deployment settings, not universal application recommendations.

Application tools must cooperate: the frontend shard uses one Vitest worker; the backend shard uses bounded Gradle/JVM settings and one test fork. Increasing both matrix size and nested process pools can exhaust the host while every individual YAML value looks reasonable.

Application toolchains are selected in disposable storage. The worker validation baseline and application target are distinct: the starter backend remains Java 21 even when the baseline contains a newer JDK. `RUNNER_TOOL_CACHE` belongs beneath runner temporary storage; workflow changes must not request writes to the host's `/opt/jdk`.

## Registration and activation are separate operations

Registration requires a stopped, disabled and genuinely idle controller, plus the expected current configuration hash. Successful registration preserves other projects, invalidates the old validation receipt and leaves execution disabled. An uncertain proof registration blocks a fresh attempt until its exact ledger is reconciled.

Admission after activation requires a full receipt matching the current boot, protected configuration and isolation sources. Rebooting or changing boundary code invalidates earlier evidence. General in-place upgrade is intentionally unsupported; reviewed narrow migrations and repairs have their own exact predecessor guards.

Validation exercises positive controls as well as denials: a reachable host-side listener makes job-side network denial meaningful. It checks filesystem/process/network/cgroup/device boundaries, rootless Docker and real application prerequisites, abandoned-child cleanup and a second fresh job. Pool validation additionally examines concurrent cross-slot boundaries and cleanup while peers remain healthy. A source unit test alone cannot certify these host properties.

## Failure and decision table

| Observation                                            | Decision                                                                                           |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Workflow has the expected label                        | Routing is configured; still establish private registration and actual worker execution.           |
| Job can access host Docker socket                      | Isolation contract is violated; stop admission and investigate before running more untrusted code. |
| Validation predates reboot/config change               | Obtain fresh source/config/boot-bound evidence under operator safeguards.                          |
| Cleanup inventory is unavailable                       | Preserve ledger and restore intended access; do not declare deletion.                              |
| Next job sees a previous file/container                | Freshness failed; investigate boundary teardown, not application cleanup scripts.                  |
| PR asks for privileged `pull_request_target` execution | Keep branch code outside privileged context; redesign the authority boundary.                      |

## Acceptance and inspection

Inspect explicit repository selection, read-only PR token permissions, nonpersisted checkout credentials and job-local toolchain/cache paths. Review actual child/parent resource limits and absence of host credentials/socket exposure. Require genuine source-bound workflow evidence and complete cleanup, including cancellation and interrupted-job cases.

Privileged lifecycle or isolation changes require independent review and fresh-host validation before activation. Those are operator actions governed by the owning guide, not a side effect of adding documentation or updating an application workflow. Historical template acceptance applies only to its source/configuration/boot and does not certify a generated consumer.

## Source provenance

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/README.md`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/manage.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/ci-runner/controller.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/ci-runner/start-job.sh`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/ci-runner/validation.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/ci-runner/config.example.json`
