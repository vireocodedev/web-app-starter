# Decode transport separately from domain authority

**Support status: source-backed consumer recipe.** FRED separates MQTT wire decoding, presence observations and transactional domain persistence. MQTT, its publisher, device registry and observation classes are not installed starter dependencies. Adapt the boundary, not the peer's device model or imports.

Use this pattern for webhooks, message consumers, device input or partner feeds. A correctly parsed envelope proves only that input matches a supported syntax. It does not prove the sender is trusted, the named resource is registered, or the resulting domain mutation is permitted.

## Give each boundary a checkable responsibility

FRED `DroneMessageIngress` validates topic shape, resource-reference syntax, JSON object structure and supported payload shapes. It converts wire variants into telemetry/livestream observations and uses a separate publisher interface for protocol replies. The persistence store resolves approved resources and current company ownership inside transactions.

| Boundary             | Owns                                                   | Does not establish                               |
| -------------------- | ------------------------------------------------------ | ------------------------------------------------ |
| Transport connection | Broker/channel authentication and delivery behavior    | Domain permission merely from a topic            |
| Envelope decoder     | Supported topic, JSON shape, typed fields              | Registered resource or business eligibility      |
| Presence registry    | Recently observed topology and relationships           | Permanent ownership from an untrusted identifier |
| Domain store/service | Approved resource, locking, scope and state transition | That a protocol reply means commit               |
| Publisher adapter    | Wire response serialization and transport              | Business success merely from send completion     |

The source's envelope ceiling is a Java string-length check of 1,048,576 characters. It is not evidence of a one-mebibyte UTF-8 transport limit. A consumer needs its own byte and decoded-size boundaries at the actual HTTP/broker entry, plus nested collection limits where relevant.

## Normalize syntax without inventing meaning

The ingress accepts supported snake/camel field alternatives, requires object-shaped data and validates active status as boolean or integer 0/1. It aggregates multiple camera states so one inactive camera does not mark the entire resource inactive while another is active. Ambiguous resource association is rejected instead of selecting an arbitrary child.

These are concrete protocol rules, not universal conveniences. A webhook adapter should similarly distinguish missing, malformed and unsupported values before producing a typed observation. Do not use forgiving coercion to turn an unknown event into a legitimate domain state.

**Pseudocode recipe:** the channel verifier, bounded decoder, observation type and domain store below are consumer-owned seams. Implement external authentication, replay policy, schemas, resource mapping and persistence before using this shape.

```java
public void receive(TransportEnvelope envelope) {
    var trustedChannel = channels.verify(envelope.transportMetadata());
    var message = decoder.readBoundedObject(envelope.bytes());
    var observation = protocol.toObservation(trustedChannel, message);
    observations.recordApproved(observation);
}
```

Unlike a mere topic regex, `channels.verify` represents a required authentication design. It is not a helper supplied by the FRED ingress excerpt or the starter. For signed webhooks, the adapter must authenticate the original required bytes before trusting normalized claims; reconstructing JSON afterward can change the signed material.

## Resolve and refresh protected domain state

FRED's store maps a serial alias to the configured canonical resource, requires a registered row and locks it pessimistically. It refreshes the managed entity after acquiring the lock because an earlier approval lookup may have loaded stale state before waiting. It then requires current company ownership before linking observations to durable records.

Telemetry normalization also checks finite coordinates and valid ranges. Wire validation and domain checks overlap intentionally at different trust boundaries. A cached registry hit is not a permanent authorization grant, and a caller-provided company ID must not replace the stored resource's owner.

For a generic external asset feed, choose the canonical resource identifier and permitted external source explicitly. Store the source/event identity and event time separately from server receipt time. If no approved mapping exists, reject or quarantine according to the consumer's operational policy; automatic registration is a separate authorized command.

## Failure and recovery

Malformed syntax should fail before persistence. An unknown or no-longer-approved resource should not create a placeholder domain entity just to make ingestion succeed. Keep diagnostics bounded and avoid logging whole private envelopes. A transport retry can repeat valid input, so the next boundary needs durable deduplication and ordering rather than relying on decoder execution once.

The FRED ingress sends some protocol replies before domain storage. That timing is observed behavior, not proof that the database accepted the observation. Define what each acknowledgment means—received, syntactically accepted or durably committed—so an integration operator does not mistake one for another.

## Acceptance cases for a consumer

- Unsupported topics, malformed JSON, wrong root shapes and invalid state values never reach domain mutation.
- Byte, decoded-size and nested-cardinality limits are explicit; character count is not mislabeled as bytes.
- A valid resource reference cannot create or take ownership of an unapproved resource.
- Resource aliases resolve to one canonical locked identity, with current state refreshed when necessary.
- Ambiguous association fails instead of choosing a plausible child.
- Protocol replies have documented semantics independent of persistence success.
- Transport authentication, domain authority and repeat-delivery handling each have an identified owner.

## Exact source references

- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/protocol/DroneMessageIngress.java` — envelope/shape validation, normalization, association and reply ordering.
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/persistence/DroneObservationStore.java` — approved mapping, pessimistic lock/refresh, scope and domain persistence.
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/transport/DroneMessagePublisher.java` — separate transport publisher seam.
