# Model provider uncertainty and fail closed when unconfigured

**Support status: source-backed consumer recipe.** Client Discovery defines private provider interfaces with explicit capabilities and outcome types. Its shipped notification and document adapters are unconfigured and perform no successful external delivery. The starter has no installed provider, credentials or domain integration API from these examples.

Use this pattern for email, document issuance, remote provisioning or any request whose response can be lost after the remote side acts. A transport exception and an authoritative rejection are different facts. Your application state and retry policy must preserve that difference.

## Make configuration and assurance explicit

The document provider advertises configured state, source key, contract version, idempotent-submit capability and authoritative-lookup capability. The request service refuses an unconfigured provider and also refuses one lacking both idempotent submit and authoritative lookup: at least one is required by that source gate, not necessarily both. Provider identity/version must match the reviewed procedure.

That minimum gate does not mean every recovery path is available. The operation dispatcher specifically requires authoritative lookup for later reconciliation. A consumer must define what happens when an adapter can submit idempotently but cannot establish the current remote result. Do not infer a safe retry algorithm merely from one capability flag.

| Outcome              | Evidence meaning                                  | Application behavior                                                    |
| -------------------- | ------------------------------------------------- | ----------------------------------------------------------------------- |
| Unconfigured         | No selected operational adapter                   | Block automatic work or show reviewed manual path                       |
| Confirmed/Observed   | Normalized source evidence under its contract     | Validate identity, payload, stage and authority before state change     |
| DefinitivelyRejected | Authoritative negative result with required proof | Apply the documented failure/release policy                             |
| Unknown/Uncertain    | Effect may or may not have occurred               | Retain intent and reconcile; never invent success or definitive failure |

The notification interface names an `Observed` result with source/message/destination digests and stage. A stage observation is not automatically proof of final delivery. In the inspected notice reconciler, non-unconfigured immediate results remain uncertain rather than directly qualifying a delivered receipt; separate evidence qualification owns that decision.

## Use a typed adapter seam

The following is a **recipe type**, not the exact peer interface and not a starter API. Implement transport authentication, source normalization, capability configuration, persisted operation/evidence and safe error mapping before using it.

```java
sealed interface SubmissionResult permits Confirmed, Rejected, Uncertain {}
record Confirmed(String sourceObjectId, String sourceEventId)
    implements SubmissionResult {}
record Rejected(String reasonCode, SourceProof proof)
    implements SubmissionResult {}
record Uncertain(String reasonCode) implements SubmissionResult {}
```

`SourceProof` is an additional consumer-owned type. Its contents must be bounded and authorized. The interface prevents a generic success boolean from erasing uncertainty, but it does not authenticate a result by itself. The adapter owns external authentication and decoding; the application service owns domain state and evidence acceptance.

Client Discovery's document normalization requires retained proof for definitive rejection and validates confirmed originals/artifacts against the immutable request. It freezes/clones bounded result data before persistence. A provider returning HTTP 200 with an unrelated object or malformed artifact set is not entitled to advance the domain state.

## Keep the unconfigured path honest

The default notification implementation returns `Unconfigured` from submit and lookup without network, credentials or a provider claim. The default document implementation advertises no configured capability and returns unknown/not-configured results. Its trusted-event path rejects rather than accepting arbitrary external assertions.

This is a useful development/runtime state. The UI can show unavailable or manual verification required without pretending that a message was sent or an official artifact exists. A demo fixture must not replace this behavior on the real adapter path. Adding an adapter requires explicit dependency, secret/setup, authority, operational and verification work in the consumer.

The document interface's default authenticated-envelope hook rejects with 403. That is not evidence that a public webhook route is installed. A future route must authenticate the required transport bytes and correlate its operation under the adapter's contract; naming a field `sourceEventId` does not make it trusted.

## Failure and recovery

A timeout after submission leaves uncertainty because the remote effect may have completed. Preserve the original operation identity and immutable payload digest. Lookup/reconciliation must use that same meaning rather than generating a fresh operation key or resubmitting an altered payload.

A definitive rejection can permit a new reviewed draft/operation under the domain policy. An uncertain result must not release reservations merely because the caller wants another try. A later authoritative confirmation can still arrive; retain evidence and resolve conflicts deliberately instead of overwriting whichever result was stored first.

Keep public reason codes stable and safe. Raw transport messages, provider bodies, credential headers or private destinations are not suitable generic UI errors. Operators need enough protected diagnostics to distinguish configuration, authentication, contract mismatch and ambiguous transport outcome.

## Acceptance cases for a consumer

- Unconfigured adapters make no network success claim and cannot advance final state.
- Capability and source-contract mismatch blocks unsafe submission/reconciliation.
- Timeout/connection loss becomes uncertainty, not a fabricated rejection.
- Confirmed data must match resource/request identity, stage, payload and required evidence.
- Definitive rejection requires the documented source proof.
- Retries/reconciliation retain operation identity and payload meaning.
- Trusted-event ingestion is authenticated and separately wired; reading this interface does not imply an exposed webhook.

## Exact source references

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BillingDocumentProvider.java` — capabilities, typed outcomes and rejecting trusted-envelope default.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/UnconfiguredBillingDocumentProvider.java` — no configured external success path.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/NotificationDeliveryProvider.java` — unconfigured/uncertain/observed outcomes and no-network default.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BillingDocumentService.java` — configured capability and reviewed-contract gate.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BillingProviderOperations.java` — bounded normalized evidence, later lookup requirements and uncertainty.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceNoticeService.java` — conservative immediate outcome handling and separate receipt qualification.
