# Budget concurrency at every execution layer

Keep CI throughput predictable by bounding the whole process tree, rather than counting matrix entries or test workers in isolation. Capacity, deadlines and coverage are separate constraints that must remain visible together.

**Installed template pattern.** The root CI workflow, `infrastructure/ci/test_shards.py`, backend Gradle configuration and frontend Vitest configuration own application execution. `infrastructure/ci/README.md` owns pool capacity and host reserve. Values here describe the pinned implementation, not universal tuning advice.

## Trigger, owner and contract

Use when a build is killed, jobs queue, suite duration grows or someone proposes adding shards. The application maintainer owns nested tool behavior and indivisible workloads. The operator owns total CI capacity and reserve for deployed applications. Local workspace instructions separately govern how developers coordinate verification.

The invariant is bounded concurrency at each layer without shrinking verification membership. More shard jobs do not create more physical CPU or memory. A smaller worker count is not a reason to drop tests or required production builds.

```text
host capacity minus protected reserve
                 |
      bounded concurrent worker slots
                 |
         per-job resource ceilings
                 |
    Gradle / browser / test process limits
                 |
       indivisible file or build step
```

When workspace instructions require one heavy verification at a time, a coordinating agent serializes builds, typechecks and browser work even if independent editors can work concurrently. That local scheduling policy does not limit concurrency constructs inside production application code.

## Read the actual nested limits

The installed workflow has three frontend and three backend test shards, with matrix fail-fast disabled. Shared pool slots control simultaneous jobs; matrix size controls the number of queued units. Every frontend shard explicitly runs Vitest with one worker. Frontend configuration itself uses one worker in CI and two locally at the pinned snapshot.

Frontend static verification limits Node's old-space heap to 1536 MiB. Storybook and the production Docker build use the same heap bound and set both `ROLLDOWN_WORKER_THREADS=2` and `RAYON_NUM_THREADS=2`. Rolldown's runtime and Rayon are separate native thread pools; limiting the JavaScript heap alone does not bound their memory. These build-only settings leave room for native allocations, the runner and sibling processes within the worker's memory budget. They do not change the deployed application's environment. See [Rolldown's thread-pool documentation](https://rolldown.rs/guide/troubleshooting).

Inspect `memory.events` and memory pressure as well as OOM counters. Sustained reclaim above `memory.high` can stall a build and its runner heartbeat without an OOM kill. Measure the actual build with its heap and native pools bounded before proposing a larger host limit; local process RSS is supporting evidence, while the complete CI run must also fit the worker cgroup.

Backend tests compile the complete source set. The Gradle inventory and real test tasks use a single fork; test JVMs see two processors. Spring's test-context cache is bounded to two because each cached context owns a server, pool and PostgreSQL resources. Fixtures sharing a database are not made concurrent just because classes can be assigned to different jobs.

The build JVM has a separate ceiling:

```properties
org.gradle.workers.max=2
org.gradle.jvmargs=-Xms256m -Xmx512m -XX:MaxMetaspaceSize=384m -XX:ActiveProcessorCount=2 -Dfile.encoding=UTF-8
```

These are current selected settings. The Dockerfile copies `gradle.properties`, preserving the bound during image compilation. A JVM heap limit alone does not cover metaspace, native memory, sibling processes or container overhead. A per-process bound therefore cannot substitute for the outer job memory limit.

## Budget more than CPU

The operator configuration controls per-worker memory high/max, swap, CPU quota, tasks, job disk, lifetime and host reserve. A multi-slot pool additionally requires explicit aggregate CPU and memory budgets. Testcontainers and Docker image layers consume disk and memory even when the test runner has a single worker.

Network access and host authority are isolation concerns, not throughput knobs. Do not expose the host Docker daemon or a writable shared cache to recover performance. Similarly, raising a task ceiling cannot repair a leaked browser tree.

Queue time, tool installation, dependency installation, compilation, image build, runtime checks and actual assertion execution should be measured separately. A slower end-to-end run may reflect capacity contention rather than slower application tests. Successful source-bound reports provide timings for assignment tuning; initial timing weights are planning values, not benchmarks.

## Tune the bottleneck that can actually move

Start by identifying the slowest required indivisible file or build step. Splitting a matrix cannot divide one long file. Preserve affinity where shared fixture lifecycle requires it. Update timing weights from successful complete reports to balance placement, then inspect queue pressure before increasing parallel capacity.

Additional capacity is an operator change with reserve and acceptance requirements. Increasing both slot count and nested workers at once makes attribution difficult and can remove the application reserve. Measure one reviewed change at a time.

The original performance aspiration is not a reason to invent a new hard elapsed-time gate or replace required checks with nightly-only work. The owning CI documentation records current acceptance policy and measured evidence.

## Failure and decision table

| Symptom                                  | Inspection and decision                                                      |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| OOM while tests use one worker           | Inspect JVM/native memory, contexts, containers and parent cgroup usage.     |
| Many queued shards, short execution      | Measure pool occupancy and approved reserve before adding a larger matrix.   |
| One file dominates every run             | Refactor its lifecycle or review test granularity; weights cannot divide it. |
| Host application latency rises during CI | Preserve/restore operator reserve and inspect aggregate limits.              |
| Disk fills despite low heap              | Inspect owned Docker layers, job filesystem limits and cleanup evidence.     |
| Repeated tool setup dominates            | Evaluate measured job composition without merging privilege boundaries.      |

## Acceptance and inspection

Record source revision, full inventory proof, job overlap, queue/setup/execution durations and observed aggregate resource behavior. Confirm single-worker/fork settings and the Docker build's Gradle bounds. Keep meaningful verification coverage unchanged.

A fast partial run is not acceptance. A green complete run with bounded resources is evidence for that source and workload envelope, not every future suite size. Related reading: **Complete shard evidence**, **Phase deadlines and process cleanup**, and the pool operator guide for actual capacity changes.

## Source provenance

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:.github/workflows/ci.yml`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/test_shards.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/test-timings.json`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/ci-runner/controller.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/README.md`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/gradle.properties`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/build.gradle`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/Dockerfile`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/vitest.config.ts`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:docs/github-ci.md`
