# Repair the affected suffix of a dependent sequence

**Support status: LMS reference recipe with planning limits.** LMS recalculates dependent operational choices and times after an earlier item changes. The starter has no installed sequence planner or aggregate dependency graph. A consumer must implement its own compatibility function, protected states, stable ordering and concurrency owner.

Use this pattern for a queue, timetable or workflow where a successor's valid configuration depends on its predecessor. Editing one item is not isolated CRUD: it may require repairing later tentative work or rejecting the edit to preserve a protected commitment.

## Distinguish compatibility repair from maintenance

The source `updateUsage` allows edits only to planned/fixed items, verifies compatibility with the previous item, marks the edited item fixed and walks later confirmed/fixed/planned items in time order. If a successor is compatible, it becomes the predecessor for the next comparison. If incompatible and confirmed, the command fails. Otherwise the service derives a next default from the preceding item's state and updates that successor.

This protects confirmed successors' direction/usage choices in that path. It does not establish that every property of every confirmed item is immutable. The separate maintenance method can renumber pending work and adjust planned times, including items in the pending collection. Do not collapse those two responsibilities into a blanket guarantee that confirmed records never change.

| Concern                   | Owner                                                    |
| ------------------------- | -------------------------------------------------------- |
| Adjacent compatibility    | Pure domain rule over predecessor/successor              |
| Default repair            | Domain choice when a tentative successor is incompatible |
| Protected commitment      | State policy deciding when edit must fail                |
| Timing/number maintenance | Separate derived schedule policy                         |
| Concurrency/order         | Sequence aggregate/revision and database protocol        |

## Walk from the changed point, preserving protected intent

**Pseudocode recipe:** implement an authorized sequence loader/lock, expected revision, deterministic position order, compatibility/default policy, layout validation and audit. These helpers are not starter APIs.

```java
@Transactional
public SequenceView change(ChangeStep command, Authentication auth) {
    var sequence = sequences.lockAuthorized(command.sequenceId(), actors.current(auth));
    revisions.requireExpected(sequence.revision(), command.expectedRevision());
    var changed = sequence.requireEditable(command.stepId());
    changed.apply(command);
    var previous = changed;
    for (var next : sequence.orderedSuffixAfter(changed)) {
        if (!compatibility.allowed(previous, next)) {
            if (next.isProtected()) throw new ProtectedSuccessorConflict();
            next.apply(defaults.after(previous));
        }
        previous = next;
    }
    sequence.requireValidAffectedLayouts();
    sequence.advanceRevision();
    return views.sequence(sequence);
}
```

Validate the changed item's predecessor too; it is omitted from the abbreviated sample's loop, not from the required implementation. A local pure function analogous to the source `calculateNextDefault` makes domain choices reviewable without importing a generic optimizer. Its particular split/direction rules are peer business policy.

Use [revision/shared-lock handling](../data/revision-conflicts-and-shared-locks.md) and [lock ordering](../data/lock-order-and-fresh-transaction-retries.md) for coordination. The source's derived suffix query orders by planned time; it does not demonstrate a comprehensive equal-time tie protocol or ordered row locks. A consumer needs stable positions/IDs and revalidation before claiming deterministic concurrent repair.

## Recompute derived data without erasing commitments

Maintenance renumbers pending slots, recalculates planned times from predecessor readiness and child arrival estimates, fills a configured minimum of future empty work and checks completion-related conditions. Its tolerance and default-count values belong to that operational model, not a universal scheduler setting.

The source also catches broad external-state failures and falls back to a default observed-state assumption for later maintenance. A consumer must decide whether missing evidence permits planning or requires unknown/blocked state; do not promote the fallback into trusted external reality.

Changed layouts are passed to repositioning. A consumer must inspect unsuccessful structured results for every affected item; calling the method is not proof all failures are propagated. Distinguish tentative repair from moving already protected work or issuing irreversible external commands.

## Failure and recovery

If a later protected step would become incompatible, roll back the earlier edit and all tentative repairs. Return a safe conflict explaining the dependency without silently modifying the commitment. Preserve the editor's intended change for review rather than forcing a new revision onto it.

The source schedules further planning through process-local collections. That is not a durable multi-replica planner or an atomic post-commit work queue. If follow-up repair must survive crashes, implement durable intent and worker ownership; otherwise document eventual recalculation/recovery limits.

Avoid recomputing the entire schedule unnecessarily, ignoring protected successors, sorting only by display time, or treating “planning queued” as “the plan is committed and verified.”

## Acceptance and implementation checklist

- Changed item and predecessor are compatible under current authority/revision.
- Repair walks a deterministic suffix and preserves compatible successors.
- Incompatible protected work rejects the entire edit without partial repair.
- Defaults and time/number maintenance have explicit separate policies.
- Every affected layout result is checked.
- Missing external evidence and concurrent edits have deliberate handling.
- Follow-up planning's local/durable and single/multi-replica guarantees are stated accurately.

## Exact source references

- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/lockage/LockageService.java` — predecessor check, suffix repair and confirmed-successor rejection in updateUsage.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/lockage/LockageLifecycleService.java` — default function, renumber/time maintenance and external-state fallback.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/lockage/LockageRepository.java` — pending and planned-time neighbor/suffix ordering.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/lockage/Lockage.java` — adjacent compatibility rule.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/planning/PlanningScheduler.java` — process-local queued follow-up planning.
