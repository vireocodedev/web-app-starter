# Preserve capacity across allocations and compensating events

**Support: reference recipe.** Client Discovery's ledger is a source-backed example of exact, append-only capacity accounting. It is not an installed starter ledger or a general financial product. Use its structure for neutral source pools allocated to targets, with evidence-backed release, reversal and externally completed return operations.

## State the conservation equation before the endpoint

`BillingLedgerService` derives active allocation from original allocation minus retained releases. Usable source amount is the original amount minus qualified reversals, confirmed refunds, reserved refunds and active allocations. Target capacity also subtracts applied noncash credit, with restorations reversing that consumption. These categories are deliberately distinct: requested return, confirmed external return and released allocation are not the same event.

For a neutral capacity source, write the invariant as:

```text
usable = original - reversed - returned - returnReserved - activeAllocations
activeAllocation = allocated - sum(releases)
targetUsed = activeAllocationsToTarget + appliedCredit - restoredCredit
```

Choose the meaning of each term in the consumer domain. Do not combine incompatible units or treat a display clamp as an invariant repair. The source's receipt view clamps negative unapplied display to zero, while separate recovery/pending checks block normal use. The underlying evidence is not edited to make the display look balanced.

## Validate the entire request, including repeated targets

Allocation validates source qualification, current policy, matched party, seller/buyer/currency and correct owner. It does not check each line against the same starting balance independently. It accumulates the whole request per target, per document/target pair and across the source. Two individually acceptable lines can exceed a shared target together, so `requested.merge` and `requestedDocuments.merge` participate in the check before any inserts.

The pair bound matters when a target appears in multiple artifacts: target capacity and artifact-specific collectible capacity are separate ceilings. The source may permit allocation without a document only under a reviewed rule. That is domain policy, not a generic default. [Exact decimals and rounding policy](./exact-decimals-and-rounding-policy.md) owns numeric representation; do not replace `BigDecimal` with floating point or rounded UI totals.

Release appends a compensating row and cannot exceed an allocation's currently active amount. Its helper assumes the caller already parsed a positive amount; the helper itself only checks the upper bound. Keep scalar validation at every new public entry point. Never expose an internal method with weaker preconditions as if it were a complete API.

## Reversal consumes evidence and repairs dependent usage atomically

Reversal requires a qualified reversed source entry, retained pending evidence and an exact source amount. An already consumed transaction can return as an identical retained effect; a different target, kind, amount or currency conflicts. Releases in a reversal must reference allocations on that same source, be unique and not exceed each active amount. After the proposed releases, remaining allocations must fit what remains after reversal, completed returns and outstanding return reservations.

It then appends releases, a reversed event and a consumed-source effect. This records why capacity changed rather than rewriting original observations. A late reversal after external returns can create a recovery obligation; the model preserves and exposes that condition. It does not pretend funds or capacity can always be recovered locally.

## The caller owns isolation and authority

These helper methods are not independently transactional or locking. The public `CustomerBillingService.command` supplies the transaction, sorted affected-project access, shared ledger mutex, policy lock, revision and request receipt. Bypassing it can make two requests both observe the same usable capacity. Read [transactional commands](../application-services/transactional-commands.md) and [lock ordering and fresh retries](./lock-order-and-fresh-transaction-retries.md) for that boundary.

The following **pseudocode** requires a consumer-owned scoped command service, locks, decimal validator, aggregate reads and retained events:

```text
withinAuthorizedCommand(scope, requestIdentity, expectedRevision):
    lockCapacityOwnersInCanonicalOrder()
    current = reloadCapacityAndRetainedEffects()
    proposed = aggregateRequestBySourceTargetAndPair(command)
    requireAllConservationBounds(current, proposed)
    appendAllocationsOrCompensations(proposed)
    retainReceiptAndAdvanceRevision()
```

A database transaction alone does not serialize independent capacity readers under every isolation level. All mutation paths, including workers and operator commands, must use the same lock protocol. Any smaller-lock redesign must preserve the cross-source/target invariants rather than copying only the arithmetic.

## Failure, recovery and acceptance

If a reversal needs more allocation releases than supplied, reject the complete command and let the caller reload the dependent allocation set. An unresolved source conflict or recovery amount blocks normal allocation/return. A return request reserves capacity until evidence confirms execution or non-execution; a timeout is not release evidence.

Acceptance cases include two request lines sharing one target; two sharing one artifact/target pair; two concurrent requests spending one source; a release beyond active amount; duplicate reversal releases; identical versus changed consumed-source evidence; reversal with outstanding returns; and a late reversal that exposes recovery. Show that failure leaves all compensating records unapplied, while a committed correction retains the original and its compensation. Do not infer general exactly-once behavior from one idempotent effect path.

## Sources

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BillingLedgerService.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/CustomerBillingService.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BillingData.java`
