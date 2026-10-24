# Cross-owner acknowledgments

Use a retained acknowledgment when one owner commits a source fact and another owner must independently accept its consequence. For example, a fulfilled work item may become eligible for a resource-accounting entry. The producer must not mark the consequence complete merely because it called the receiver, and the receiver must not trust a mutable producer view as its source.

This is a reference recipe from Client Discovery's `ServiceOperatorService.reconcile` and `ApplicationServiceBillingOwner`. These consumer services are not installed starter APIs. The source handoff is an in-process service call across transaction boundaries, not evidence of a deployed message broker or a universal exactly-once delivery protocol.

## Keep three commits distinct

The producer's period owner retains immutable charge evidence and a pending outbox row. That is durable intent to cross an ownership boundary. The reconciliation method validates the scoped evidence ID and digest, locks the outbox, and claims it with a random lease owner and expiry. An unexpired claim returns a pending result rather than starting another receiver call.

After that producer transaction commits, the receiver is invoked. `acceptServiceCharge` explicitly rejects an already active transaction and starts its own `REQUIRES_NEW` transaction. It reads the committed source, requires the expected digest, validates its own owner facts, and obtains its own ordered locks. The receiver does not lock service rows as part of its accounting phase.

Inside its transaction, the receiver reads an existing acknowledgment for that source and rejects a mismatched digest. Otherwise it creates the owned consequence and acknowledgment together. The acknowledgment retains the source identity and digest alongside the result identities and accepted values. Its content is checked through the retained-fact helpers.

Finally, the producer opens another transaction, reads the receiver's retained acknowledgment, requires canonical equality with the returned acknowledgment, and marks the outbox acknowledged. A return value without that retained receiver evidence cannot complete the bridge.

See [transactional commands](transactional-commands.md) for the local atomicity boundary and [digests and reviewed artifact versions](../data/digests-and-reviewed-artifact-versions.md) for exact source binding.

## A neutral handoff

Conceptual protocol pseudocode; these are not starter method names:

```text
producer transaction:
  verify immutable source and expected digest
  claim pending bridge row
receiver call outside producer transaction:
  receiver transaction:
    verify source and receiver-owned prerequisites
    read matching acknowledgment or create consequence + acknowledgment
producer transaction:
  compare returned acknowledgment with retained receiver evidence
  mark bridge acknowledged
```

A source key must include its owning scope. The request cannot substitute a different digest under the same key. The receiver owns consequence uniqueness; the lease only reduces overlapping attempts. Neither a stable request ID nor a lease substitutes for the receiver's retained idempotency evidence. For the broader retry boundary, use [durable ingestion deduplication](../integrations/durable-ingestion-deduplication.md).

## Failure and recovery

| Interruption                                                           | Durable interpretation and recovery                                                                                 |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Producer claim cannot be acquired                                      | Return pending; another claim may still be active.                                                                  |
| Receiver rejects a domain prerequisite with the handled conflict       | Record a blocked reason and release the matching claim; repair the prerequisite explicitly.                         |
| Receiver fails unexpectedly                                            | Do not infer non-execution; the claim may remain until expiry and the receiver's acknowledgment must be reconciled. |
| Receiver commits, then the producer loses its response or final commit | Re-enter with the same source ID/digest; read the retained acknowledgment rather than duplicate the consequence.    |
| Returned acknowledgment differs from the retained one                  | Block reconciliation; do not mark the producer complete.                                                            |

The inspected source handles expected conflict responses separately from unexpected exceptions. It does not prove delivery-gap replay, distributed fencing for every possible stale worker, or an atomic transaction spanning both owners. Its successful final update is based on confirmed receiver evidence; do not advertise the lease as universal fencing. If the call becomes remote, define transport authentication, timeout/unknown-outcome reconciliation, bounded retries, acknowledgment lookup and cleanup of stranded claims. Follow [uncertain provider outcomes](../integrations/uncertain-provider-outcomes.md).

## Acceptance scenarios and anti-patterns

Require one receiver consequence for repeated matching source attempts, rejection of a changed source digest, correct pending behavior while a claim is active, and recovery after a receiver commit with a lost producer response. Require producer completion to fail when retained acknowledgment evidence is absent or different. A blocked prerequisite must remain distinguishable from unknown execution. These are design acceptance scenarios, not claims that checks were executed.

Avoid calling the receiver while holding the producer transaction, sharing mutable ORM entities across owners, treating a timeout as rollback, or marking the bridge complete after a successful method return alone. “Acknowledged” means the exact receiving owner retained the exact source-to-result relationship; it does not mean every subsequent consumer has completed its own work.

## Sources

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceOperatorService.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ApplicationServiceBillingOwner.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServicePeriodService.java`
