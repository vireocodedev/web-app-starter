# Monorepo CI and main-branch protection

GitHub runs [.github/workflows/ci.yml](../.github/workflows/ci.yml) on pull
requests targeting `main`, pushes to `main`, and manual dispatch. Every job uses
`[self-hosted, Linux, X64, web-app-ci]`; none uses GitHub-hosted runners.
The shared App installation and protected host registration are prerequisites,
not settings inherited by **Use this template**.

## Verification selection

| Changed paths | Jobs selected |
| --- | --- |
| `backend/**` | Backend image/smoke lane and three backend test shards |
| `frontend/**` | Frontend static, Storybook/image/smoke and three frontend test shards |
| Both app folders | All application lanes |
| Other `infrastructure/ci/**` | Foundation verification |
| `infrastructure/release/**`, `.github/**`, `.vscode/**`, routing or shard helper/config/tests | All lanes |
| Documentation outside the app folders | Portable initialization/docs and aggregate gate |
| Manual dispatch or the first branch push | All lanes |

The template also treats `.agents/skills/initialize-project/**` as shared setup
changes. The change job only detects owners; it does not install Node, browsers
or application dependencies. It compares the prospective PR merge commit with
the event's base, or a main push with its preceding commit. Renames select both
owners. Keep the workflow itself unfiltered so required checks always report.

The independent **Portable initialization and documentation** lane always runs,
including for documentation-only changes. It selects the skill's pinned Node/npm,
installs that package's lockfile, verifies preparation/contract/documentation and
Chromium desktop/mobile flows, checks generated pages and repeats verification
in an isolated skill-only consumer. Browser binaries and dependencies remain in
the disposable job. Template-only assertions remain required in a real checkout.

Selected frontend work has separate static, build and test lanes. Static checks
retain formatting, lint, architecture and every TypeScript project. The build
lane retains Storybook and the real pinned Dockerfile's production build and
image smoke checks. Three deterministic test shards each use **one** Vitest
worker; local `npm run test` and `npm run verify` still execute the full suite.

Selected backend work has a separate pinned Dockerfile/JAR/image smoke lane and
three test shards. Every shard compiles the **complete** test source set, including
fixtures referenced across test classes. Gradle's `ciTestInventory` task discovers
the entire JUnit suite in dry-run mode into a separate XML directory, then the
standard `test` task executes only assigned classes in a single fork. Test JVMs
retain two visible processors and Spring's context-cache limit of two, including
the actual eviction/PostgreSQL lifecycle test. Shared inherited Spring fixtures
can have explicit assignment affinity; test methods never run concurrently against
a shared database. Each worker owns its own Docker/PostgreSQL resources.

Foundation verification retains lifecycle, authentication, routing/gate, shard
proof, release helper and shell checks. No lane uses application credentials,
production databases, a host Docker daemon or a writable cache shared with
another job. CI does not publish or deploy images; release authorization remains
in its separate workflow.

## Complete-suite proof and performance

[infrastructure/ci/test_shards.py](../infrastructure/ci/test_shards.py) assigns
collected files/classes with stable longest-weight-first balancing. The source
[timing configuration](../infrastructure/ci/test-timings.json) explicitly labels
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
detection, the always-run portable lane, every selected static/build/test/foundation
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
reserves remain operator controls. An under-ten-minute total is an acceptance
target, **not a result established by these configuration changes**. Record cold
and warm commit-to-gate time, queue/startup time, peak memory, CPU pressure, full
inventory counts and two simultaneous PRs before declaring the target met. The
[shared-pool operator guide](../infrastructure/ci/README.md) owns provisioning,
isolation, fresh-host validation and activation.

## Configure a consumer

1. Keep `main` as the integration branch, or deliberately update the workflow's
   branch triggers and branch-policy target together.
2. Have the operator authorize/register the exact private consumer repository
   using [the CI App](github-ci-app.md) and
   [shared pool](../infrastructure/ci/README.md).
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

GitHub template creation does not copy branch policy. In **Settings -> Branches**
configure protection for the exact integration branch, or use the repository
branch-protection API with equivalent settings:

- Require a pull request before merging.
- Required approving reviews: **0**.
- No required code-owner review or last-push approval.
- Require the successful **CI gate** check, bound to GitHub Actions.
- Require the branch to be up to date before merging.
- Enforce protection for administrators; no routine bypass actors.
- Block force pushes and deletion.

Preserve stronger compatible organization policies and report conflicting
inherited rules explicitly. A private repository needs the corresponding plan
entitlement; never make it public or remove checks to bypass a limitation.

Read back the effective policy. Use a task-owned harmless validation PR to prove
a failing/missing required check blocks merging, then show that corrected green
checks permit merging with zero approvals. Do not merge a failing fixture or
weaken protection to demonstrate it.

**Current activation:** the template's PR and main CI passed on genuine
disposable Hetzner runners. Effective main protection requires the observed
`CI gate` from GitHub Actions (App ID `15368`) with strict up-to-date checks,
administrator enforcement, zero reviews, and blocked force pushes/deletion.
A controlled backend-only failure selected no frontend/foundation work and
blocked merging; the fixture was removed, a frontend-only green result skipped
backend/foundation and became mergeable with no approving review. See
[source-bound acceptance](acceptance/ci-acceptance.json) for runs and policy observations.
This documents the template repository, not inherited settings for a consumer.
The historical documentation-only run also passed with all app/foundation jobs
skipped and `CI gate` reported successfully; it predates the always-run package
checks described above. Cross-repository shared-pool acceptance remains
a separate pending gate.
