# Claim, call outside the transaction, then reconcile

**Support status: source-backed consumer recipe.** Client Discovery persists operation intent, claims work in a transaction, performs provider I/O outside it and reconciles in a later transaction. It is not an installed starter job/outbox framework, and the shipped provider adapters remain unconfigured.

Use this pattern when database state and an external side effect must remain explainable across timeouts, crashes and competing workers. A single transaction cannot atomically commit PostgreSQL and an unrelated provider. Replace that illusion with retained intent, stable identity and evidence-driven reconciliation.

## Commit an immutable meaning before calling

The document request path retains an operation key, immutable payload, payload digest, draft version and reviewed policy references. The notice path likewise retains message/destination meaning and an idempotency key. A later dispatch must not reconstruct today's mutable form and pretend it is the original request.

Claiming rechecks current prerequisites under the relevant resource/registry/operation locks. It chooses submit versus lookup, stores claim ownership and deadline, updates state and commits before transport begins. The source notice path marks uncertainty at claim time; a crash after the claim therefore does not leave a false unattempted-success story.

| Phase         | Database boundary            | Durable fact                                          |
| ------------- | ---------------------------- | ----------------------------------------------------- |
| Request       | Business transaction         | Authorized immutable intent exists                    |
| Claim         | Short locked transaction     | One worker owns this attempt under the lease protocol |
| Provider call | Outside database transaction | Outcome may be confirmed, rejected or uncertain       |
| Reconcile     | New locked transaction       | Validated evidence updates operation/receipt state    |

The original operation/idempotency key persists across these phases. A new attempt token identifies a worker claim; it is not a replacement business identity.

## Keep I/O outside every outer transaction

Both inspected orchestration paths reject an already active outer database transaction. Their programmatic transaction executions end before calling submit/lookup. An inner `REQUIRES_NEW` alone would not mean “no database locks exist”: a suspended caller can retain its own locks. The explicit outside-transaction contract makes that risk visible.

**Pseudocode recipe:** implement operation schema, locking repository, current authority/policy checks, provider adapter, bounded timeouts, claim tokens and evidence validation. None of the helpers below is a starter import.

```java
public void dispatch(UUID operationId) {
    transactions.requireNoOuterTransaction();
    var claim = transactions.write(() -> operations.claim(operationId));
    if (claim == null) return;
    var outcome = provider.submitOrLookup(claim.operationKey(), claim.payload());
    transactions.write(() -> operations.reconcile(claim, outcome));
}
```

Real code must normalize thrown transport failures into uncertainty and handle failure persisting the result. The pseudocode exposes the three phases; it does not implement exception, retry or shutdown handling.

## Fence worker updates without discarding authoritative reality

The notice reconciler locks state again and checks that the stored lease owner still matches the claim, and that no receipt has already completed the notice. A late worker cannot overwrite a newer owner's ordinary outcome. It also rechecks current binding before choosing the next reason/state. Its immediate results remain conservative: unconfigured becomes manual-verification-required; other immediate outcomes remain uncertain rather than directly creating a delivered receipt.

The document path has a deliberate nuance: its persistence code normally rejects a stale claim token, but allows a confirmed result into stronger original/evidence validation. An authoritative late confirmation may describe a real external effect that must not be erased merely because the worker lease expired. The code checks retained authorization, source/event identity, original content and conflicts before qualifying it. Do not generalize either source into “ignore every late response” or “accept every successful late HTTP response.”

Design two policies explicitly: which worker may mutate scheduling/uncertainty state, and which authenticated source evidence may establish external reality. They are related but not identical authority boundaries.

## Reconcile with the same operation identity

After an ambiguous submission, lookup uses the retained operation key. Generating a new key can create a second remote effect and makes the first harder to investigate. The document dispatcher submits only the initial queued attempt and requires authoritative lookup for later reconciliation; an idempotent-submit capability does not prove every subsequent mode is available.

If the process crashes after remote success but before receipt commit, the operation remains recoverable through that identity and the evidence protocol. If result persistence fails, the inspected document orchestrator attempts a separate bounded state update to uncertainty rather than inventing confirmation. A durable receipt must be saved atomically with its accepted state transition.

## Failure and recovery

An active lease can defer a competing worker; an expired lease permits a new claim under the protocol, not a claim that no external effect occurred. Lost responses, invalid normalized data, changed policy and conflicting source identities each need safe reason codes and retained protected diagnostics.

Avoid holding row locks across remote calls, rebuilding mutable payloads, changing idempotency keys on retry, trusting a caller's confirmation flag or allowing late workers to clear newer receipts. Manual verification can be a reviewed separate route, not a shortcut that labels an unknown outcome successful.

## Acceptance cases for a consumer

- No provider call runs while the orchestrator or its caller owns a database transaction.
- Crash before/after each phase leaves a retained operation with a recoverable meaning.
- Competing claims serialize and late ordinary worker updates cannot overwrite a newer owner.
- Authoritative late evidence follows the explicit validation/conflict policy.
- Retry and lookup reuse original operation identity and immutable payload meaning.
- Duplicate or conflicting provider events produce idempotent receipt handling or an explicit conflict.
- Unconfigured/uncertain results never manufacture a final delivery receipt.

## Exact source references

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceNoticeService.java` — claim/call/reconcile, no outer transaction, lease-owner fence and conservative receipt handling.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BillingDocumentService.java` — immutable operation payload, digest and key at request time.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BillingProviderOperations.java` — separate transactions, submit/lookup modes, claim-token nuance, evidence validation and persistence uncertainty.
