# Receive requests before qualified decisions

Separate intake from adjudication when a valid request must remain visible even though evidence, review or a future effective date is unresolved. A user asking to end a generic managed service should receive an acknowledgment of that request without the application pretending the requested state change has already been approved or applied.

This is a reference lifecycle from Client Discovery's `ServiceCancellationService`, not an installed starter API or a reusable legal policy. The transferable pattern is a sequence of separately retained facts: received request, verified source evidence, qualified decision, and effective application. The consumer's particular clauses, notice periods and commercial eligibility rules must not become defaults for another project.

## Intake has its own prerequisites and result

`receive` is independent of later debt/policy/provider decision gates, but it is not universally unconditional. Account intake requires a current scoped grant and supported request shape. External intake requires privileged authority, a suitable source artifact and a claimed receipt time that is not in the future. Both require the relevant line and accepted version. Invalid or unauthorized input is still rejected.

The retained request captures its line, version, exact package digest, requested effect, statement, channel, actor-related grant or external source, recorded time and any claimed receipt time. Its canonical content is digested. Account requests are received through the authenticated channel; externally recorded requests initially wait for source verification. Intake records a claim and its provenance, not a completed business decision.

This distinction matters after a timeout. A client should reconcile the command's retained request receipt before creating a second request. The request helper itself is not the whole idempotency protocol; the caller owns the command transaction and receipt contract. Follow [transactional commands](transactional-commands.md) and [durable ingestion deduplication](../integrations/durable-ingestion-deduplication.md).

## Qualify evidence, then qualify a decision

For external requests, `qualifyReceipt` binds the exact retained source artifact and owner line, validates the proposed received time against allowed temporal boundaries, and retains an independently qualified source observation. A supplied claimed timestamp does not become verified merely because it parsed successfully. The source distinguishes the request's recorded time, claimed received time and qualified verified received time.

`qualifyDecision` binds the exact request version and package digest, reviewed policy evidence and proof, a known received time, an allowed outcome and supporting source provenance. The neutral lesson is to decide from qualified evidence for this request and version, not from the current mutable policy screen. Review-required and effective-end outcomes are different facts. Adaptation must define its own authority, review independence, permitted outcomes, timing rules and decision-correction policy.

Conceptual lifecycle, not a starter enum or method family:

```text
receivedRequest = retainAuthorizedIntake(exactSourceVersion, request)
verifiedEvidence = qualifySource(receivedRequest, retainedObservation)
decision = qualifyDecision(receivedRequest, verifiedEvidence, reviewedPolicy)
if decision authorizes an effect:
  retainEffect(decision.id, decision.digest, effectiveAt)
when effectiveAt is observed as due:
  retainAppliedMarker(effect.id)
```

The source's `apply` requires the exact decision ID, expected digest and matching request, and only accepts its effect-authorizing outcome. It retains an effective-end record with conflict avoidance by decision identity. `applyEnds` refuses a future observation horizon and records due applications idempotently by effective-end identity. Scheduling an effect is therefore distinct from retaining that it has become effective.

## Failure and recovery

| State                                                 | Meaning and next step                                                                |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Intake accepted; external source not verified         | Keep the request visible and waiting for evidence qualification.                     |
| Claimed receipt time conflicts with retained evidence | Reject qualification; preserve the original intake and review the source.            |
| Review outcome requires further assessment            | Show review required; do not apply the requested state change.                       |
| Decision digest or request identity differs           | Reject application and resolve the exact qualified decision.                         |
| Authorized effect is dated in the future              | Retain the schedule; do not claim it is already applied.                             |
| Applying a known effect is retried                    | Reuse its retained identity and application marker rather than duplicate the effect. |

The helper is not an annotated transaction boundary on its own. Its caller must provide coherent authorization, locks, revision handling and atomicity for each transition. A crash between separate transitions should leave an explainable retained state, not cause the application to invent missing evidence. For digest binding, see [digests and reviewed artifact versions](../data/digests-and-reviewed-artifact-versions.md).

## Acceptance scenarios and anti-patterns

Require authorized intake to remain retained when later qualification is blocked. Cover an external claim awaiting verification, an invalid claimed time, an exact-version mismatch, a review-required decision, an authorized future effect and repeated due application. Public projections should expose only the fields needed to explain progress, not private qualification artifacts. These are future acceptance scenarios, not execution evidence.

Avoid a single boolean such as `cancelled`, deleting rejected or unresolved requests, equating recorded time with verified receipt, and using today's policy to rewrite a past decision silently. Do not copy this consumer's domain rules as universal legal obligations. The reusable guarantee is that each stage says precisely what was received, proven, decided and applied, with a responsible owner for every transition.

## Source

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceCancellationService.java`
