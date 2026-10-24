# Lease expiry means uncertainty until fresh evidence resolves it

**Support status: source-backed consumer recipe.** FRED permits recovery of an expired preparation only after recent accepted inactive evidence and ownership checks. The starter has no installed lease registry, device freshness policy or takeover API. The numerical allowances below explain the peer source, not defaults for every integration.

Use this pattern when an operator prepares remote work, a lease can expire while the external system continues acting, or a new worker must decide whether it may take over. A local timer ending proves elapsed time; it does not prove remote inactivity or revoke an old external effect.

## Identify what the lease actually owns

FRED's PREPARED session reserves a resource/controller/operator relationship before activity is observed. Preparation lasts 300 seconds in that source and can be renewed for the same authorized owner. ACTIVE sessions are a different state and are not ended by the preparation-expiry rule.

The current operator can reuse its existing prepared session after exact resource/controller checks; another operator cannot simply claim it because a timestamp is old. The service checks current resource/area/company and unmanaged active state as part of creating a new preparation. Lease time is only one predicate in a larger authority and state protocol.

| Question                                       | Required evidence                                     |
| ---------------------------------------------- | ----------------------------------------------------- |
| Has the preparation deadline passed?           | Server-owned clock/deadline comparison                |
| Is the remote resource inactive?               | Accepted explicit inactive observation                |
| Does the observation follow the expired lease? | Source/event timestamp beyond the allowed skew window |
| Is that observation still fresh now?           | Bounded age and future-skew checks                    |
| May this actor create a replacement?           | Current authority and resource binding                |

Unknown or missing activity is not equivalent to explicit false.

## Read the peer predicates together

The recovery method requires state PREPARED, matching current company, current time after deadline plus five seconds, and an explicit false activity flag. The accepted observation must itself be after that cutoff, no older than 90 seconds and no more than five seconds ahead of server time. Only then does the old preparation become ENDED with its observed time retained.

These exact values are peer policy. The extra cutoff excludes the source clock's permitted future window; the age check prevents ancient inactive evidence from certifying a resource's present state. A consumer must derive its own skew, evidence age, lease duration and source-assurance requirements from its transport/domain behavior.

Renewal changes the relevant deadline. Evidence from before a renewed lease's expiry cannot suddenly justify takeover just because it would have passed the original deadline. Keep the effective deadline explicit, not recomputed independently in several callers.

## A recovery policy recipe

The following is **pseudocode**, not a starter helper. Implement a trusted evidence store, current authority, locked operation/resource repository, clock injection and the reviewed policy constants. A manual escalation path, if needed, is separate implementation and authorization.

```java
boolean mayRetirePreparation(Operation prior, Evidence latest, Instant now) {
    var cutoff = prior.preparationDeadline().plus(policy.allowedFutureSkew());
    return prior.isPrepared()
        && latest.sameResourceAndScope(prior)
        && latest.isExplicitlyInactive()
        && now.isAfter(cutoff)
        && latest.observedAt().isAfter(cutoff)
        && !latest.observedAt().isBefore(now.minus(policy.maxEvidenceAge()))
        && !latest.observedAt().isAfter(now.plus(policy.allowedFutureSkew()));
}
```

Evaluate this under the same protected state boundary as retirement/replacement. A UI's cached deadline and activity indicator are not authoritative. Inject a `Clock` into time-dependent domain logic, as the source preparation service does, so boundary decisions have a clear owner and can be reasoned about without workstation time assumptions.

## A lease is not a universal fencing token

This recipe governs preparation recovery from observation. It does not demonstrate that the external system rejects commands from a previous lease holder. If old workers can still issue remote effects, a new design may require an external fencing generation, idempotency contract or explicit operator recovery. Do not call a timestamp check a complete distributed ownership guarantee.

Keep evidence association equally strict: a fresh inactive observation for another company/controller/resource cannot certify this operation. In FRED, the observation store checks scope/controller relationships before updating session reality, while the recovery method checks the current stored company again. The predicates cooperate; copying only the deadline line loses the safety argument.

## Failure and recovery

When the lease expires but no sufficiently new inactive evidence arrives, retain the unresolved state and explain that recovery is blocked by evidence, not by a broken countdown. Offer the domain's authorized reconciliation or escalation route when implemented. Do not clear ownership automatically or label missing telemetry as “stopped.”

Future-dated evidence beyond allowance, stale evidence or changed scope must fail the takeover condition. A network outage can make recovery slower precisely because inactivity is unknown. That is an honest availability tradeoff, not a reason to fabricate success.

## Acceptance cases for a consumer

- Expiry alone never transfers ownership or marks an ACTIVE operation ended.
- Missing, unknown, stale, pre-cutoff or wrong-scope evidence cannot authorize recovery.
- Fresh explicit inactive evidence after the effective cutoff permits only the defined retirement/replacement flow.
- Same-owner renewal preserves identity and invalidates old cutoff assumptions.
- Clock-skew boundary decisions follow named consumer policy and one injected time owner.
- The UI distinguishes expired preparation from proven inactive state.
- Documentation states whether external fencing exists instead of inferring it from a database lease.

## Exact source references

- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/session/LivestreamSessionService.java` — preparation duration, same-owner renewal, expiry/freshness predicates and clock injection.
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/persistence/DroneObservationStore.java` — accepted scope/controller evidence and remembered inactive state.
