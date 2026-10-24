# Prove conflicting commands serialize around the shared invariant

Two individually valid commands can violate a rule when they race. A concurrency scenario must establish overlapping transactions, control when the first commits, and inspect the final allowed outcome and persisted absence of the forbidden one. Launching two threads without a schedule is weak evidence.

This is a **consumer reference pattern** from CDA's PostgreSQL-backed specification tests. They call real Spring services and use explicit TransactionTemplate/latches for a shared-contact race. This is a service/database boundary, not an HTTP security-filter scenario. The tests were inspected, not executed for this article.

## Trigger and ownership

Use this design for shared quotas, parent/child ownership, active grants, revision checks, receipts, and other invariants crossing more than one command owner. The production services own locking/authorization. The test owns transaction participants, independent threads, barriers, bounded waits, and failure-safe release.

The reference fixture builds synthetic actors, related projects, retained evidence, and actual service transitions. It does not bypass the relevant approved/locked source lifecycle by inserting a fake final row. Large product fixtures are not generic starter APIs; build only the necessary legitimate preconditions for a neutral invariant.

## Hold the invariant-changing transaction

This is **inert schedule pseudocode**, not an installed test helper:

```text
writer transaction:
  change shared contact/principal
  signal "change staged"
  wait for "allow commit"

test:
  await change staged
  start command that depends on current contact authority
  observe command has not completed within bounded observation
  release writer commit in finally
  await both workers
  assert command rechecks authority and no forbidden row exists
```

CDA's concrete scenario relinks a contact through another project sharing that party while an exact review depends on the contact. The writer stays open with TransactionTemplate. After release, the review rejects with 403 and its review-row count remains zero. This establishes the business consequence of the shared serialization boundary.

The bounded incomplete-future observation is useful but does not alone prove a database lock caused the wait; thread scheduling can also delay a task. When stronger lock evidence is needed, add a participant-start barrier or database wait-state observation under a deliberate test design. Do not overstate a timeout assertion as a complete lock proof.

## Assert both stale intent and persisted facts

| Scenario                                            | Expected contract                   | Extra evidence                   |
| --------------------------------------------------- | ----------------------------------- | -------------------------------- |
| Old revision/token                                  | Reject stale command                | No forbidden mutation or receipt |
| Authority changed before dependent command proceeds | Recheck current authority           | Forbidden row absent             |
| Same request replayed                               | Return documented replay            | One business effect              |
| Same ID, different namespace/payload                | Reject collision                    | Existing receipt unchanged       |
| Concurrent accepted commands share quota            | Preserve invariant                  | Final totals/rows within rule    |
| Failed participant                                  | Release barriers and finish workers | No hidden hanging transaction    |

The cited suite has exact replay, namespace collision, stale/cross-scope token, and immutable-byte assertions as well as the contact race. The quota row is a design extension for features with that invariant, not a claim that this file covers every quota protocol.

A rejection status alone is insufficient when partial writes would be harmful. Inspect authoritative rows, receipts, audit, retained bytes, or totals that the command promises to keep atomic. Conversely, SQL-count assertions alone do not prove public response mapping; use an HTTP test for that boundary.

## Failure and cleanup

Release latches in `finally`, bound every wait/future, and stop executors even when assertions fail. Do not use a test-wide transaction that hides commits between worker connections. Ensure each worker reaches the real transactional service boundary rather than bypassing Spring proxy semantics.

A successful concurrency case proves its specific schedule and invariant. It does not exhaustively prove deadlock freedom, production load, every lock order, or all isolation anomalies. Add distinct schedules for reverse operation order and rollback where the risk warrants them. Avoid weakening domain policy or disabling authorization merely to create convenient fixtures.

## Acceptance scenarios

The dependent command cannot commit against an authority transition that should serialize with it. After writer commit, the current decision is used and forbidden persisted effects remain absent. Identical replay creates no duplicate; altered request identity conflicts without corrupting the receipt. Failure releases every participant. A missing production lock should make the intended scenario fail, rather than still pass because the test accidentally executes sequentially.

## Avoid these shortcuts

Do not rely on sleeps, two fast thread submissions, mocked repositories, status-only assertions, or transactions never committed outside the test thread. Control overlap and assert the shared invariant's actual outcome.

## Sources and provenance

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/test/java/com/vireocode/clientdiscovery/SpecificationIntegrationTests.java` — latch-held contact relink/review, persisted denial, token conflicts, replay, and receipt collision.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/test/java/com/vireocode/clientdiscovery/LC03IntegrationSupport.java` — real Spring/PostgreSQL fixture, synthetic identities, and service-owned prerequisite lifecycle.
