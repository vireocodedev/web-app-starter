# Select verification by owner and always report the gate

Keep monorepo verification relevant to the change while preserving a required status that reports for every pull request. This pattern joins change classification, selected verification lanes and branch policy into one explicit contract.

**Installed template pattern.** The owning implementation is the root CI workflow and `infrastructure/ci/ci_scope.py`. This article describes the paired frontend/backend monorepo. Separate repositories and consumer-specific utility-job consolidation are optional variations, not implied defaults.

## Trigger, owner and invariant

Use this pattern when one repository contains independently changeable frontend and backend code plus shared infrastructure. A frontend-only change should not spend backend capacity, but an omitted backend job must be an intentional result of successful classification.

The application maintainer owns path-to-lane policy and application verification commands. The infrastructure operator owns available isolated runner capacity. The repository administrator owns effective main-branch protection. Editing a workflow does not configure the latter two systems.

The invariant is precise: successful classification is mandatory; every selected lane must succeed; every unrelated lane must be skipped. A failed, cancelled or missing selected job never counts as an acceptable skip.

## Keep workflow triggers unfiltered

The installed workflow runs for pull requests targeting `main`, pushes to `main` and manual dispatch. There is no workflow-level path filter. A path-filtered workflow can fail to create the required check at all, leaving a documentation-only PR waiting indefinitely.

The lightweight `changes` job computes three booleans without installing application dependencies. Application and foundation jobs depend on the classification outputs. Documentation-only changes outside application folders select no owner lanes. The final `CI gate` uses `if: always()` and receives change detection and all owner job results.

```text
PR / main push / manual dispatch
              |
           changes
              |
     selected owner lanes
              |
      CI gate: always report
```

This diagram describes ownership and dependency, not a proposed replacement workflow.

## Read the actual selection table

| Change                                                                    | Required owner lanes                                            |
| ------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `backend/**`                                                              | Backend image/smoke and backend test shards                     |
| `frontend/**`                                                             | Frontend static, Storybook/image/smoke and frontend test shards |
| Ordinary `infrastructure/ci/**`                                           | Foundation                                                      |
| `.github/**`, `.vscode/**`, `infrastructure/release/**`                   | All owner lanes                                                 |
| `docs/template-initialization/scripts/**`                                 | All owner lanes                                                 |
| `docs/template-initialization/.env.example`                               | All owner lanes                                                 |
| CI routing/shard helpers, timing configuration and designated shard tests | All owner lanes                                                 |
| Documentation outside application folders                                 | Change detection and aggregate gate                             |
| Manual dispatch or zero-base initial push                                 | All owner lanes                                                 |

Change detection and the aggregate gate run in every row. The explicit helper paths in `scope()` are authoritative; do not generalize them into “every documentation change is cheap.” A guide article under `frontend/` legitimately selects frontend work because its build/runtime owner is the frontend.

Normal comparison uses the event base and the checked-out commit. `git diff --name-only --no-renames` exposes both deleted and added paths when a file crosses owners. A missing or malformed comparison SHA is a classification error. Only explicit manual force-all or an all-zero initial base selects every owner without a comparison.

## Encode expected states, not absence of failure

A minimal policy illustration is:

```python
expected = "success" if owner_selected else "skipped"
if job_result != expected:
    reject_gate()
```

The installed helper also requires a successful `changes` job and validates that each selection output is exactly `true` or `false`. It evaluates every job named in the owner mapping. The workflow then verifies complete shard evidence for selected applications; lane success alone does not establish complete test membership.

The workflow uses read-only repository permissions and checkouts without persisted Git credentials. CI verifies artifacts but does not publish images or deploy applications. Normal CI concurrency cancels a superseded run for the same workflow/ref. Deployment concurrency deliberately follows a different policy.

## Failure and decision table

| Observation                              | Meaning and next decision                                                                              |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Required gate never appears              | Inspect workflow triggers and repository Actions policy before changing branch protection.             |
| `changes` fails                          | Repair comparison/source inputs; do not treat its absent outputs as false.                             |
| Selected lane is cancelled               | Gate fails; obtain a complete successful candidate run.                                                |
| Unrelated lane unexpectedly runs         | Policy and observed execution disagree; inspect selectors rather than accepting incidental green work. |
| Change detection fails on a docs-only PR | The gate fails; skipped application lanes cannot replace successful classification.                    |
| A new shared helper affects both apps    | Add its owner impact deliberately and review the gate mapping together.                                |

## Acceptance and inspection

Before accepting a policy change, inspect backend-only, frontend-only, both-owner, shared-infrastructure and documentation-only examples. Confirm exact selected/skipped states and the always-present final check. Inspect rename behavior and the initial/manual force-all cases.

Read back effective branch protection separately: require the observed `CI gate` bound to GitHub Actions, an up-to-date PR, administrator enforcement, and blocked force pushes/deletion. The template uses zero mandatory approving reviews; stronger compatible organization policy remains valid. New consumers do not inherit protection from template creation.

Keep source-bound run evidence and distinguish intended policy from observed GitHub behavior. This page is explanatory and performs no verification, repository-setting changes or workflow dispatch.

## Source provenance

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:.github/workflows/ci.yml`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/ci_scope.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:docs/github-ci.md`

Continue with **Complete shard evidence** for membership proof and **Disposable worker boundary** for the isolation beneath these jobs.
