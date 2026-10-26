# Persist intent separately from observed external state

**Support status: source-backed consumer recipe.** FRED prepares a durable session before external activity and advances it only from accepted observations. The starter does not contain its session registry, device transport or external-control feature. A consumer must supply its own operation model, authority and evidence adapter.

Use this pattern for remote provisioning, imports, exports or device operations where accepting a request is different from observing success. A local database commit proves that the application recorded intent; it cannot prove that another system completed the work.

## Give requested and observed facts separate owners

FRED's preparation service resolves a registered resource, validates its area/company and operator binding, and creates a PREPARED session with request ID, owner, resource/controller identity, media identity, request time, preparation deadline and baseline observation time. Reusing a request ID resolves the existing operation and verifies owner/resource rather than creating another intention.

The observation store separately accepts fresh resource evidence. A qualifying active observation advances PREPARED to ACTIVE and creates the stream bound to that session's retained media identity. A later qualifying inactive observation can end an active session. The command service does not simply mark the operation ACTIVE because preparation returned successfully.

| Fact                             | Owner                    | Safe UI claim                                |
| -------------------------------- | ------------------------ | -------------------------------------------- |
| Request accepted and retained    | Application command      | Preparation/request exists                   |
| External call returned           | Transport adapter        | Call outcome under its documented contract   |
| Fresh accepted active evidence   | Observation policy       | External activity observed                   |
| Fresh accepted inactive evidence | Observation policy       | Activity ended under the state rules         |
| No new evidence                  | Coverage/recovery policy | State remains unknown or previously observed |

A browser button finishing its loading animation is not an additional evidence source. Render requested state and last observed state honestly instead of deriving success from an HTTP 2xx alone.

## Match evidence to the right operation

The FRED store requires current session/resource/company agreement and an exact controller match. It checks event time against the request's bounded clock allowance, baseline watermark and last accepted session observation. The peer protocol can send an empty video identity; association then uses the sole open session and exact controller, not an invented timestamp folder. The stream retains the session's chosen media key.

Do not claim this source verifies every observation against a nonempty external media ID. Its association rule is explicit and protocol-specific. A new provider that supplies an authenticated operation correlation ID should define and verify that stronger relation instead of dropping it during normalization.

**Pseudocode recipe:** the operation repository, evidence verifier and transition policy below are consumer-owned. Implement trusted event authentication, scope mapping, monotonic position/time rules, DTOs and transactions before adapting this shape.

```java
@Transactional
public void observe(ExternalObservation input) {
    var evidence = verifier.requireTrusted(input);
    var operation = operations.lockByCorrelation(evidence.correlation());
    evidence.requireSameResourceAndOwner(operation);
    ordering.requireAcceptedPosition(operation, evidence);
    transitions.applyObservedFact(operation, evidence);
}
```

This recipe is not a claim that every peer protocol has the same correlation field. If correlation is ambiguous, fail or quarantine according to the domain policy; guessing the newest operation can attribute an old event to a new request.

## A stopped snapshot does not consume preparation

While an external start is being configured, a periodic inactive snapshot can legitimately arrive. In the source, an inactive observation during PREPARED updates remembered resource evidence but does not set the prepared session to ENDED. Otherwise a normal pre-start snapshot would destroy the intent before the active observation arrives.

The inverse matters too: a cached active flag from an earlier lifecycle cannot fabricate success for a newly prepared session. Baseline, request-time and strictly newer evidence checks distinguish earlier reality from the new operation. The source's clock-lag allowance is peer policy, not permission to accept arbitrary old events.

For a generic export, the analogous distinction is REQUESTED versus an authoritative artifact-ready receipt. “No artifact yet” during preparation is not cancellation; an old artifact at the same path is not proof of the new export. Retain an operation identity and exact artifact/version relationship when the domain requires it.

## Failure and recovery

If preparation commits but the external call fails or its response is lost, retain the intent and show its unresolved state. Use a bounded reconciliation/read path or the reviewed recovery workflow. Deleting the operation and immediately generating a new identity can duplicate remote work or lose evidence needed to resolve the original.

If evidence names another controller/company or is stale, it must not transition this operation. Keep diagnostics safe and retain conflict evidence when policy requires it. Missing evidence is not proof of inactivity; that belongs to an explicit lease/freshness recovery protocol.

Avoid a single boolean `started`, updating observed state from a client claim, inferring authority from an incoming resource ID, or marking an operation complete at transport submission. Each collapses distinct facts and makes recovery guesswork.

## Acceptance cases for a consumer

- A successful preparation creates durable intent without claiming observed activity.
- A repeated request ID returns only the same authorized operation or a conflict.
- Wrong-owner/resource/controller and stale observations cannot advance state.
- Inactive pre-start snapshots preserve valid preparation; old active evidence cannot activate it.
- An accepted active/inactive sequence advances only the documented transitions.
- Lost transport responses retain enough identity and evidence for reconciliation.
- UI labels distinguish requested, observed and unknown facts.

## Exact source references

- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/session/LivestreamSessionService.java` — durable preparation, request reuse, owner/resource checks and retained media identity.
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/persistence/DroneObservationStore.java` — evidence association, watermark checks and PREPARED/ACTIVE/ENDED transitions.
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/protocol/DroneMessageIngress.java` — normalized active observations and ambiguous association handling.
