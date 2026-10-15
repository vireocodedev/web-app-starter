# Monorepo CI and main-branch protection

GitHub runs [.github/workflows/ci.yml](../.github/workflows/ci.yml) on pull
requests targeting `main`, pushes to `main`, and manual dispatch. Every job uses
`[self-hosted, Linux, X64, web-app-ci]`; none uses GitHub-hosted runners.
The shared App installation and protected host registration are prerequisites,
not settings inherited by **Use this template**.

## Verification selection

| Changed paths                                          | Jobs selected                     |
| ------------------------------------------------------ | --------------------------------- |
| `backend/**`                                           | Backend verification              |
| `frontend/**`                                          | Frontend verification             |
| Both app folders                                       | Both app verifications            |
| `infrastructure/ci/**`                                 | Foundation verification           |
| `infrastructure/release/**`                            | All verifications                 |
| `.github/**`, `.vscode/**`, or the CI selection helper | All verifications                 |
| Documentation outside the app folders                  | Detection and aggregate gate only |
| Manual dispatch or the first branch push               | All verifications                 |

The change job compares the checked-out prospective PR merge commit against
the event's base commit. Renames are treated as deletion/addition so a move
between owners selects both. Main pushes compare the event's prior commit.
CI configuration changes force all relevant checks.

Backend verification selects Java 21 in the disposable job tool cache and runs
the Gradle wrapper's tests/boot JAR build, including isolated PostgreSQL and auth
integration tests. Frontend verification selects the repo's Node version and
installs its declared npm version into a disposable prefix before `npm ci`
and `npm run verify`. Each selected app then builds its pinned Dockerfile and
smoke-tests its non-root read-only image; backend uses fresh disposable
PostgreSQL, never the application database. See the
[image contract](../infrastructure/release/README.md).
Neither job changes the host baseline or uses application
databases/credentials. Foundation verification runs the source-local lifecycle,
App, recovery, routing/gate, and image-smoke helper tests.

`CI gate` always reports, even for documentation-only PRs. It succeeds only when
change detection succeeded, every selected job succeeded, and unselected jobs
were skipped as expected. Failed/cancelled or unexpectedly skipped jobs cannot
be hidden behind a successful aggregate. Keep the workflow itself unfiltered;
workflow-level path filters can leave required checks pending forever.

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
[source-bound acceptance](ci-acceptance.json) for runs and policy observations.
This documents the template repository, not inherited settings for a consumer.
The documentation-only run also passed with all app/foundation jobs skipped and
`CI gate` reported successfully. Cross-repository shared-pool acceptance remains
a separate pending gate.
