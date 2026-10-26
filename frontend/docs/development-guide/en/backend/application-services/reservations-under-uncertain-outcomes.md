# Keep reservations while an external outcome is uncertain

**Support: reference recipe.** Client Discovery's credit owner distinguishes reserving capacity, consuming it in a confirmed original and restoring it using qualified correction evidence. These APIs are not installed starter behavior. Use the pattern for a finite entitlement that must not be reused while an external system may already have acted.

## Reservation is a retained claim, not completed consumption

`BillingCreditService` calculates available entitlement as original amount minus applied amounts plus restored amounts minus currently reserved amounts. A reservation without events is `RESERVED`; later retained events determine its state. Source qualification, reviewed interpretation digest, eligibility and target compatibility are rechecked when reserving. The target must match the permitted owner, counterparty, currency, treatment and offering.

There are two capacity checks. The requested amount cannot exceed available entitlement, and requested amount plus other target reservations, applied credit and allocated cash cannot exceed the target amount. This is a shared conservation decision, not a client-side availability hint. It relies on the public command transaction and mutex; helper calls on their own do not serialize contenders. Use [conservation across allocations](../data/conservation-across-allocations-and-reversals.md) and [lock order](../data/lock-order-and-fresh-transaction-retries.md).

Source expiry prevents a new reservation and changes the entitlement view to expired with zero displayed availability. It does not establish that a previously submitted provider operation failed or automatically free its reservation. Business eligibility time and external execution knowledge are different axes.

## Pending and uncertain operations keep their hold

Release requires a reservation still in `RESERVED`, current policy, scoped non-consumption evidence and a reason. It also scans provider operations on the target project in `QUEUED`, `DISPATCHING` or `UNCERTAIN`. If their retained input references the reservation, release is rejected. A timeout, lease expiry or worker restart therefore does not itself restore capacity.

Document validation rejects a duplicate reservation reference, wrong target/currency/treatment and use by another queued, dispatching or uncertain operation. On confirmation, `applyDocument` revalidates the mapping and appends `APPLIED` for the reserved amount, linked to the confirmed original. This source has specific treatment rules: some corrections must equal their actual line amount; an allowance cannot exceed the line. Do not copy those commercial meanings into unrelated capacity domains.

The safety principle is reusable: once dispatch may have happened, keep the capacity claim until authoritative evidence distinguishes rejection from confirmation. See [uncertain provider outcomes](../integrations/uncertain-provider-outcomes.md) and [claim, call, reconcile](../integrations/claim-call-reconcile.md). This article does not claim an automatic provider-side cancel or transactional revocation across systems.

## Restoration has its own bounded proof

Restoration is not release with a different label. It concerns already consumed capacity. The source requires a reviewed restoration interpretation and scoped evidence. The requested restoration cannot exceed applied minus previously restored consumption. It must also fit retained qualifying correction lines against the confirmed document, after accounting for restorations already attributed to that document.

Thus a generic reason string does not mint capacity. Both the consumed reservation and the correction that reverses it constrain the amount. The retained source stores compensation events instead of editing the original application. A consumer must explicitly define which evidence means non-consumption and which means reversal of actual consumption; those decisions are domain-specific and may require different reviewers.

## Neutral consumer scenario

The following **pseudocode** requires consumer-owned entitlement storage, scoped authority, common locks, retained operations and qualified provider/correction evidence. No named helper below is installed.

```text
reserve(command):
    requireEligibleNowAndCompatibleTarget()
    requireSourceAndTargetCapacity()
    retainReservation()

release(command):
    requireState(RESERVED)
    requireQualifiedNonConsumptionEvidence()
    requireNoReferencedOperationIn(QUEUED, DISPATCHING, UNCERTAIN)
    appendRelease()

restore(command):
    requireQualifiedReversalOfConfirmedConsumption()
    requireAmountWithinConsumptionAndUnusedCorrection()
    appendRestoration()
```

Keep all three local decisions inside the authoritative command owner. Provider I/O and reconciliation have separate boundaries. New adapters must preserve stable operation identity and link evidence to the exact reserved claim; they must not generate another reservation merely because a previous response was lost.

## Failure, recovery and acceptance

An uncertain operation should lead to a visible reconciliation task. Reload the operation and obtain authoritative evidence through its existing identity. A confirmed result consumes the existing reservation; a proven non-execution decision can permit release; a proven later correction can permit bounded restoration. Time passing alone chooses none of those outcomes.

Acceptance cases include competing reservations against source and target capacity; expired entitlement with an existing hold; queued/dispatching/uncertain references preventing release; another document trying to reuse the hold; repeated references within one document; restoration exceeding net consumption; and a correction already fully consumed by earlier restoration. Check that rejection leaves the hold intact. General idempotency, durable delivery and worker leasing must be established by their owners, not inferred from the state names here.

## Sources

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BillingCreditService.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/CustomerBillingService.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BillingLedgerService.java`
