# Monorepo CI and main-branch protection

GitHub runs [.github/workflows/ci.yml](../../.github/workflows/ci.yml) on pull
requests targeting `main`, pushes to `main`, and manual dispatch. Every job uses
`[self-hosted, Linux, X64, web-app-ci]`; none uses GitHub-hosted runners.
The shared App installation and protected host registration are prerequisites,
not settings inherited by **Use this template**.

## Verification selection

| Changed paths                                                                                 | Jobs selected                                                         |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `backend/**`                                                                                  | Backend image/smoke lane and three backend test shards                |
| `frontend/**`                                                                                 | Frontend static, Storybook/image/smoke and three frontend test shards |
| Both app folders                                                                              | All application lanes                                                 |
| Other `infrastructure/ci/**`                                                                  | Foundation verification                                               |
| `infrastructure/release/**`, `.github/**`, `.vscode/**`, routing or shard helper/config/tests | All lanes                                                             |
| `docs/template-initialization/scripts/**`                                                     | All lanes                                                             |
| `docs/template-initialization/.env.example`                                                   | All lanes                                                             |
| Documentation outside the app folders                                                         | Change detection and aggregate gate                                   |
| Manual dispatch or the first branch push                                                      | All lanes                                                             |

The change job only detects owners; it does not install Node, browsers or application
dependencies. It compares the prospective PR merge commit with
the event's base, or a main push with its preceding commit. Renames select both
owners. Keep the workflow itself unfiltered so required checks always report.

Documentation-only changes outside the app folders run change detection and
the aggregate gate. Their application and foundation jobs are deliberately
skipped; the gate still requires successful classification.

Selected frontend work has separate static, build and test lanes. Static checks
retain formatting, lint, architecture and every TypeScript project. The build
lane retains Storybook and the real pinned Dockerfile's production build and
image smoke checks. Three deterministic test shards each use **one** Vitest
worker; local `npm run test` and `npm run verify` still execute the full suite.

Static verification and frontend builds bound Node's old-space heap to 1536 MiB.
Storybook and the Docker build also bound Rolldown and Rayon to two threads each.
These application build settings preserve headroom for native memory and the runner;
the shared pool's resource limits remain operator-owned. See the
[resource-budget guide](../../frontend/docs/development-guide/en/ci/verification/resource-budgets.md)
for diagnosis, including reclaim stalls without an OOM kill.

Selected backend work has a separate pinned Dockerfile/JAR/image smoke lane and
three test shards. Every shard compiles the **complete** test source set, including
fixtures referenced across test classes. Gradle's `ciTestInventory` task discovers
the entire JUnit suite in dry-run mode into a separate XML directory, then the
standard `test` task executes only assigned classes in a single fork. Test JVMs
retain two visible processors and Spring's context-cache limit of two, including
the actual eviction/PostgreSQL lifecycle test. Shared inherited Spring fixtures
can have explicit assignment affinity; test methods never run concurrently against
a shared database. Each worker owns its own Docker/PostgreSQL resources.

A failed backend test shard retains its JUnit XML and the last 1 MiB of the
job-local Docker daemon log for seven days in a separate `backend-diagnostics-*`
artifact. Full Gradle exception output preserves container-startup causes in the
job log. These diagnostics are failure evidence; they cannot replace the
successful source-bound shard reports required by the gate.

Foundation verification retains lifecycle, authentication, routing/gate, shard
proof, release helper and shell checks. No lane uses application credentials,
production databases, a host Docker daemon or a writable cache shared with
another job. CI does not publish or deploy images; release authorization remains
in its separate workflow.

## Complete-suite proof and performance

[infrastructure/ci/test_shards.py](../../infrastructure/ci/test_shards.py) assigns
collected files/classes with stable longest-weight-first balancing. The source
[timing configuration](../../infrastructure/ci/test-timings.json) explicitly labels
its initial values as **planning weights, not benchmark measurements**. New tests
are included automatically. Weights change placement only, never membership.
Use successful reports' `durationsMs` to refresh weights after measuring; preserve
context affinity and review slow indivisible files rather than increasing nested
worker pools.

Every successful shard uploads a JSON proof bound to the exact checkout SHA,
workflow run and attempt. Frontend collection is compared with all configured
source test files, and executed JSON assertion reports must contain every assigned
file with all assertions passing. Backend XML testcase identities are compared
as multisets with complete dry-run collection, retaining repeated display names.
Unexpected skips, pending/todo tests, duplicate or missing assignments, empty
selected shards, missing reports or mixed-source/run reports fail verification.
There are currently no declared non-browser suite skips; adding one requires an
explicit reviewed policy rather than silently weakening the gate.

**CI gate** keeps its existing required check name. It requires successful change
detection, every selected static/build/test/foundation
lane, expected skips for unrelated owners, and complete source-bound execution
proofs. Matrix fail-fast is disabled so one failure does not silently cancel other
shards. Reports come only from the current attempt; **rerun all jobs** after a failed
attempt, rather than reusing old artifacts from successful jobs in a previous
attempt. Test reports are retained for seven days and contain synthetic test data,
not application databases or deployment secrets.

The real Dockerfiles still build from this exact checkout. Backend image
compilation copies `gradle.properties`, retaining the same bounded build JVM and
Gradle worker settings as host-side CI compilation. Host-side duplicate
application builds were removed; Docker retains its own typecheck/build safeguards.
No unverified cross-job build artifact replaces a trusted production build. The
remaining frontend typecheck duplication is intentional until measured reuse can
preserve that contract.

Concurrency is bounded by the shared pool's configured slots, not the number of
matrix entries. Each test lane uses one worker/fork; aggregate CPU/memory/application
reserves remain operator controls. Complete green CI with unchanged coverage and
safeguards is the acceptance requirement. The original ten-minute performance
target was relaxed on 2026-10-21; elapsed time is recorded rather than enforced as
a new gate. Queue/startup time, resource pressure and the complete test inventory
remain useful diagnostics. Extra cold/warm or simultaneous-PR benchmarks are not
required for this delivery. The [shared-pool operator guide](../../infrastructure/ci/README.md)
owns provisioning, isolation, fresh-host validation and activation.
Record source-bound measurements, failed experiments and workload limitations
with their CI run references in the [consumer-specific setup notes](INIT_GUIDE.md#consumer-specific-setup).
Refresh timing weights from successful complete reports as the suite grows.
When the slowest indivisible test or required build exceeds the budget, shorten
that work or add reviewed capacity; additional matrix entries alone do not add
server capacity. Concurrent workflows need their own queue-time measurement.

## Configure a consumer

1. Keep `main` as the integration branch, or deliberately update the workflow's
   branch triggers and branch-policy target together.
2. Have the operator authorize/register the exact private consumer repository
   using [the CI App](github-ci-app.md) and
   [shared pool](../../infrastructure/ci/README.md).
3. Check GitHub **Settings -> Actions -> General** permits the pinned Actions
   and read-only repository tokens used here. No deploy/registry secrets belong
   in PR CI.
4. Exercise backend-only, frontend-only, both-owner, and documentation-only PRs.
   Record job results and actual Hetzner runner identity. An idle ephemeral pool
   may show no online runner; an observed successful job proves access.
5. Read the actual `CI gate` check-run name and source App before protecting
   `main`. Bind the required check to GitHub Actions, not just an untrusted
   status with a matching text name.

The old nested frontend workflow was removed: only root workflows execute in
this monorepo.

## Protect main after successful CI

GitHub template creation does not copy branch policy. After genuine consumer CI
succeeds, run the numbered [GitHub policy step](INIT_GUIDE.md#122-configure-and-verify-github-policy).
It uses the authenticated workstation CLI to configure and read back protection
and deployment environments; selected-repository runner registration remains a
separate operator prerequisite.

The policy step requires a PR, the observed GitHub Actions `CI gate`, an up-to-date
branch, administrator enforcement, and blocked force pushes/deletion. Its default
review count is zero without code-owner or last-push approval. It preserves
compatible stronger classic and inherited rules, and reports conflicts or private
plan limitations instead of weakening protection or changing visibility.

The guide invokes `--verify-protection` to exercise one task-owned temporary PR:
real failing gate plus blocked merge, then corrected green CI and the allowed
merge state. The script journals ownership and exact source/run/attempt evidence,
resumes interrupted work, and closes the temporary PR without merging it. Settings
read-back alone does not count as this enforcement proof. Resolve any stronger
approval requirements reported by that proof deliberately.
