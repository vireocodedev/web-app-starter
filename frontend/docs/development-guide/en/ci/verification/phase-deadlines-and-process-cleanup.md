# Keep original phase deadlines and own process cleanup

Consolidate compatible CI work without turning one early failure into hidden missing evidence or leaving its processes running into the next phase. Preserve original time budgets, failure outcomes and cleanup ownership.

**Source-backed consumer reference, not installed starter behavior.** This recipe comes from `client-discovery-app`'s `infrastructure/ci/utility_phase.py`, CI workflow and utility gate. The starter uses separate frontend static/build, backend image/test and foundation jobs selected by change detection. Do not import this helper as if the template already provides it, or replace its workflow without a reviewed migration.

## Trigger, owner and contract

Consider this when measured setup overhead justifies sequential compatible utility phases in one disposable worker. The CI maintainer owns workflow composition and the helper's foreground-process contract. The operator still owns the outer hostile-code isolation boundary.

The invariants are an original deadline that includes setup, retained outcomes for every required phase, and completed owned-process cleanup before another phase starts. This is workload cleanup inside Linux CI, not a security sandbox. A descendant deliberately escaping its process group is outside this mechanism's containment guarantee.

## Start the budget before setup

The consumer records phase, limit, monotonic start and `GITHUB_SHA`/run/attempt in job-local state. Exclusive file creation prevents an accidental retry from resetting the budget. Every subsequent `run` invocation validates the binding and subtracts elapsed time from that original start.

```text
phase start -> tool setup -> command A -> command B
                  all consume the same deadline
                               |
                   cleanup completes before next phase
```

If a command is invoked after the budget expires, the helper returns a timeout result instead of granting a new full limit. The consumer currently assigns ten minutes to portable work, twenty to frontend/static/build/backend work, fifteen to foundation and two-minute cleanup phases. Those are source-specific settings. The overall utility job has its own outer timeout; summing phase maxima does not promise they can all complete before it.

This distinction matters when an Action installs a runtime before a wrapped shell command. Starting the budget after setup would silently make the real phase longer than the policy intended.

## Keep ownership until the last signal

The wrapper starts its foreground command in a new session/process group. It observes the direct child with `waitid(... WNOWAIT)` instead of reaping it early. Retaining the leader, even as a zombie after normal exit, prevents its numeric PID/PGID from being reused for an unrelated group before cleanup signals finish.

It sends TERM, waits a bounded grace period, then sends KILL unconditionally while the ownership anchor is retained. The final KILL closes a membership-probe/fork race; it is not omitted merely because the foreground leader cooperated. The helper inspects live group members through Linux `/proc`, excluding zombies, and reaps the leader only after final group cleanup.

Cancellation handlers record a flag rather than raising reentrantly through spawn/wait code. Cleanup runs before prior handlers are restored. If membership inspection or termination cannot establish complete cleanup, a job-local marker blocks every later phase. Continuing after uncertain cleanup would let stale work consume the next phase's budget or interfere with its files.

## Continue independent work without hiding failure

The consumer's later selected phases use `always() && !cancelled()` eligibility plus their own prerequisites, rather than the default “only after all earlier steps succeeded.” This permits useful independent evidence after an earlier phase failed while respecting cancellation.

The final utility gate reads original step outcomes, requires every selected phase to succeed and every unselected phase to remain skipped. The outer aggregate gate checks utility success and agreement with the independent selection outputs. A later successful shell command never erases an earlier failure.

Job-private Docker image cleanup also has a phase and deadline. It targets the disposable daemon belonging to this job. A broad cleanup command against a shared/host daemon is not an equivalent adaptation.

## Failure and decision table

| Observation                                  | Decision                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------ |
| Retry creates a new phase start time         | Preserve original state or start a genuinely new workflow attempt.       |
| Foreground exits but descendant ignores TERM | Keep leader ownership, finish bounded KILL cleanup, then reap.           |
| Cleanup marker exists                        | Stop later phases and investigate; do not delete it to continue blindly. |
| Earlier phase fails, later phase succeeds    | Final utility gate still fails the required earlier outcome.             |
| Whole job is cancelled                       | Respect cancellation; independent-phase eligibility does not defeat it.  |
| Proposed use needs hostile-child containment | Use the actual worker isolation boundary; this wrapper is insufficient.  |

## Acceptance and inspection

For an authorized adoption, review exact phase starts, setup inclusion, state binding, exclusive creation, Linux process-group assumptions and cancellation paths. Inspect that no signal can target a reused PGID and that incomplete cleanup blocks subsequent work.

Retain each required phase outcome and verify final aggregation reflects all failures. Measure setup savings without dropping verification or merging publication authority into untrusted build work. The owning consumer source is a reference to adapt, not proof that a copied helper is installed, portable to every OS or safe against malicious descendants.

## Source provenance

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:infrastructure/ci/utility_phase.py`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:.github/workflows/ci.yml`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:infrastructure/ci/ci_scope.py`
