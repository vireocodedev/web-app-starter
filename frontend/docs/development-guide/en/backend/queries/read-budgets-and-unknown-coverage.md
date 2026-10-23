# Bound read work and report unknown coverage honestly

**Support status: source-backed reference recipe.** Client Discovery's attention service composes domain-owned read facts under explicit budgets and coverage states. It is not a starter-installed dashboard framework. Its numerical limits are peer policies that a consumer must size for its own domains and query costs.

Use this pattern when a dashboard reads several domains, nested historical data can grow, or one slow source should not make every other fact disappear. A budgeted result can be useful while incomplete; it must never turn “not checked” into “nothing requires attention.”

## Facts and coverage are separate outputs

The source registers one contributor per known source, validates declared actions and checks returned task scope/destination consistency. Domain owners remain responsible for authority, eligibility and facts. The aggregator composes reads; it does not execute the commands suggested by its cards or initialize missing domain state.

| Coverage state  | Meaning in the source contract                                      |
| --------------- | ------------------------------------------------------------------- |
| COMPLETE        | The defined source projection was checked completely                |
| PARTIAL         | Some verified rows may be shown, with an explicit incomplete reason |
| NOT_IMPLEMENTED | No contributor supplies this source                                 |
| NOT_APPLICABLE  | The source is explicitly outside the current case                   |
| UNAVAILABLE     | The source read failed                                              |
| WITHHELD        | The source intentionally withholds this information                 |
| UNKNOWN         | Completeness cannot be established, including exhausted budget      |

The overall response is complete only when all sources meet the contract's completeness rule; NOT_APPLICABLE can count as complete, whereas unknown and unavailable cannot. An empty row array with unknown coverage is not a green dashboard. Keep its explanation visible rather than hiding the source card as if no work existed.

## Use more than a page-size limit

The inspected service creates a monotonic overall budget using `System.nanoTime`, with a ten-second deadline. Each source read uses a fresh read-only REPEATABLE READ transaction with a two-second timeout. It also caps source rows at 1000 and total rows at 10000, marking truncation explicitly. These are observed choices, not starter defaults.

The deadline is cooperative, not a guarantee that all arbitrary work is preempted exactly at ten seconds. Contributors must check it inside loops; JDBC transaction timeout and cancellation behavior still depend on the configured execution path. Separate source transactions provide per-source consistency, not a single global snapshot across the entire dashboard.

`ServiceAttentionReadBudget` adds earlier sentinels: it checks whether relevant collections extend beyond a bounded offset, probes nested JSON array sizes before deeper parsing, and limits traversed related receipts. Without those guards, “return at most 20 cards” could still require parsing an unbounded ledger or giant nested metadata object.

## Preserve verified partial facts without certifying the tail

The source checks cancellation before each contributor and after its read. If the deadline is exhausted, it normally records UNKNOWN rather than retaining a late COMPLETE claim. It has an explicit path for a contributor's verified PARTIAL result with budget-exhausted reason, so already checked facts can survive while the unvisited tail remains uncertified. Returned rows still pass source/action/scope/destination validation.

**Pseudocode recipe:** the budget, contributor result, coverage encoder, recovery classifier and transaction helper below must be implemented by the consumer. They are not importable starter APIs.

```java
for (var source : sources) {
    budget.checkCancellation();
    if (budget.exhausted()) {
        coverage.add(unknown(source, "READ_BUDGET_EXHAUSTED"));
        continue;
    }
    try {
        var result = reads.inFreshBoundedTransaction(() -> source.read(context));
        budget.checkCancellation();
        results.retainVerified(result, budget);
    } catch (RecoverableSourceFailure failure) {
        failures.rethrowCancellationOrAuthority(failure);
        coverage.add(unavailable(source));
    }
}
```

The catch belongs outside the transaction execution: a failed PostgreSQL transaction should finish rollback before the aggregator continues. A contributor cannot declare arbitrary URLs or actions just to make a card navigable; use typed destinations that agree with the fact's scope.

## Cancellation and authority must survive degradation

Discovery walks wrapped causes before classifying recoverable failures. It rethrows cancellation, restores the thread interrupt flag when it encounters `InterruptedException`, and propagates authentication, access-denied and HTTP status exceptions. A 403 cannot be converted into a harmless missing dashboard section. A caller cancellation cannot become UNAVAILABLE followed by more expensive background reads.

The source catches defined data-access, timeout and source-read failures, plus contract violations as unavailable source results. This is not a recommendation to catch every `Throwable` and continue. Unexpected programming errors need diagnostics and deliberate handling; raw exception messages are not public coverage explanations.

## Failure, recovery and anti-patterns

When a source exceeds its budget, return reasoned unknown/partial coverage and let the user open the owning bounded view or retry through a defined action. Do not manufacture zero totals, silently remove an unavailable source or execute a repair command from the read path. A fresh retry is a new observation, not proof that the previous partial result had been complete.

Avoid unbounded nested traversal, wall-clock arithmetic for elapsed budgets, catching interruption without restoring it, and reducing every source failure to empty rows. Also avoid declaring COMPLETE before validating all required rows: coverage is evidence, not optimistic presentation.

## Acceptance cases to carry into an implementation

- A missing contributor, failed source and exhausted budget yield different documented coverage.
- No-data/COMPLETE differs visibly from no-data/UNKNOWN or UNAVAILABLE.
- Nested collection guards stop expensive work before unbounded parsing/traversal.
- Cancellation and wrapped interrupts stop further work; authority failures remain authority failures.
- Verified partial facts can be retained only with truthful incomplete coverage and validated destinations.
- Per-source transaction failures roll back before the next source begins.
- Limits and deadlines are explicit consumer policy, with no unsupported global-snapshot or hard-preemption claim.

## Exact source references

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/AttentionService.java` — contributor validation, bounded independent reads, partial handling and failure classification.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/AttentionModel.java` — coverage vocabulary, row caps and monotonic/cancellation budget.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/AttentionContributor.java` — source-owned authority/facts and explicit recoverable failure.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceAttentionReadBudget.java` — count and nested-array sentinels before deeper traversal.
