# Qualify exact evidence under the current procedure policy

Separate collecting a claim from accepting it as authority for a protected transition. Qualification must bind exact retained bytes, target facts, current procedure and an authorized verifier rather than trusting a checkbox or a well-shaped payload.

**Source-backed reference recipe.** Client Discovery's service operator/agreement and reconciliation owners demonstrate the protocol. Their commercial policy labels are source vocabulary, not legal advice or installed starter behavior. Adapt the mechanism to neutral completion/access evidence.

## Trigger, owner and invariant

Use when an external observation or manually supplied file can unlock a lifecycle transition. The evidence owner retains bytes/candidate facts. The procedure-policy owner defines accepted source/channel, scope and reviewer eligibility. The command owner qualifies the exact target and records the result transactionally.

The invariant is exact-source qualification under current policy. Parsed shape, a digest or a reviewer name alone does not authenticate the claimed real-world event.

## Keep intake, qualification and application distinct

```text
retained candidate + original evidence
                |
current procedure + exact target/facts + authorized verifier
                |
qualified observation/receipt with provenance
                |
separately guarded effective transition
```

The service operator resolves the candidate kind/line/version, locks its owners and checks the source procedure against target facts. Its source payload digest must be represented by retained proof. The policy validates source key/namespace/event identity, channel, artifact ownership and exact proof metadata.

Agreement qualification rechecks that the provenance's verifier is the current actor and its verification time is not future, validates current scoped procedure and requires the target proof to appear exactly in the retained proof list. It records target input in the observation rather than accepting a generic unrelated attachment as sufficient.

## Make independence a policy, not a slogan

| Rule                      | Observed reference meaning                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| Authorized operator       | May stage/acquire evidence for the selected procedure.                                      |
| Authorized verifier       | May qualify evidence through that current procedure.                                        |
| Independence required     | Verifier must differ from stager and relevant artifact creator in the checked service path. |
| Independence not required | The procedure does not impose that extra separation; other authority/scope checks remain.   |

The service procedure carries `independentVerificationRequired`. Reconciliation similarly checks uploader identity and relevant original/normalization artifact creators when its policy requires separation. There is no universal rule that every workflow needs two people or every file's uploader is always disqualified.

Independence is not established merely by two display names. Bind stable account identities and the specific roles/artifacts the procedure governs. Broader organizational separation, conflict-of-interest or institutional authenticity may require additional evidence; the source checks do not prove all of that.

## Bind current policy and precise time

The reference rejects expired/revoked/unreviewed procedures, mismatched resource/party/channel and ambiguous source procedures. Qualification provenance includes procedure review, acquisition reference/channel, source identities/digest, exact proofs, verifier and verification time.

A neutral evidence record might describe:

```text
target: <resource + immutable version/digest>
source: <namespace + event identity + retained byte digest>
procedure: <current reviewed scope>
verifier: <authorized account identity>
times: <claimed event/acquisition and recorded verification>
result: <qualified receipt identity and digest>
```

These are illustrative fields, not a starter DTO. Claimed event time, acquisition time and verification time mean different things; validating one does not establish the others. The business command applies its own allowed event window.

The service operator revalidates source authority before receipt replay, then checks request fingerprint/actor and current revision for new work. Replaying a result is not a general bypass around current authorization.

## Failure and decision table

| Observation                                                  | Decision                                                                             |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Uploaded file exists, qualification absent                   | Retained input only; protected transition remains gated.                             |
| Proof digest differs from retained artifact                  | Reject evidence binding.                                                             |
| Verifier is uploader and policy requires independence        | Reject and route to an authorized independent reviewer.                              |
| Procedure expired or scope changed                           | Requalify under an applicable current procedure; do not reuse old authority blindly. |
| Payload is structurally valid but origin unproven            | Keep authenticity gap visible.                                                       |
| Qualified receipt exists, application transition not applied | Report the distinct state rather than claiming full completion.                      |

## Adaptation and acceptance

Provide immutable evidence storage, current policy resolution, account roles, exact candidate/version linkage, transaction/locks and retained audit/receipts. Do not copy source legal/commercial rules into a generic app.

Inspect wrong proof, owner, procedure, reviewer, independence setting and time, including the permitted same-person case when policy allows it. Independent security/source review is required before integration of this recipe. The article qualifies no evidence and grants no privileged action.

## Source provenance

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceOperatorService.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceAgreementService.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServicePolicy.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BankReconciliationService.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/CustomerBillingPolicy.java`
