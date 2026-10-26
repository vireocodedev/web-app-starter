# Namespaced deterministic identities

Use a deterministic identity when separate commands must recognize the same immutable origin without generating a new identity on every retry. An identity for a source line is different from the identity of a request, a replacement version, or a processing attempt. Define which fact remains the same before selecting a hash or UUID helper.

This is a reference recipe from Client Discovery, not an installed starter API. `DeliveryTimeLineage.nameBytes` and `derive` identify an original line from an exact source tuple. The reusable pattern is the byte contract and its lifetime; the consumer's namespace, domain label and domain-specific eligibility rules are not defaults for new projects.

## Own the identity contract

The source includes a versioned domain label, project identity, source kind, source version, package digest, authorization group and original line. Every field has an ordered position. Each field becomes UTF-8 bytes preceded by a four-byte big-endian byte length. Thus `["ab", "c"]` and `["a", "bc"]` cannot accidentally produce the same concatenation. Counting Java characters instead of UTF-8 bytes would define a different protocol for non-ASCII input.

The helper requires canonical UUID text for the source UUID fields, validates the digest through the source digest helper, rejects the wrong root kind, and requires a nonempty line. It does not demonstrate Unicode normalization or arbitrary line-length limits. An adopter must decide those input rules explicitly and preserve them across languages.

`derive` hashes the fixed namespace's 16 bytes followed by that encoded tuple using SHA-1, then sets UUID version 5 and variant bits. This is deterministic naming, not proof that the source is authentic or that the caller is authorized. A UUID is also not a substitute for retained source evidence. Follow [digests and reviewed artifact versions](digests-and-reviewed-artifact-versions.md) for the separate integrity and version-selection contract.

## A small adaptation

The following is protocol pseudocode, not an importable starter helper:

```text
name = encodeLengthPrefixedUtf8([
  "SOURCE_LINE_IDENTITY_V1", scopeId, sourceKind,
  sourceVersionId, sourceDigest, sourceGroupId, originalLineId
])
identity = uuidV5(STABLE_APPLICATION_NAMESPACE, name)
```

Choose an application-owned namespace once. Persist the protocol version with facts that depend on it. Changing field order, namespace, normalization, or the domain label creates a new identity scheme even when the business label stays the same. A migration must describe how old and new identities relate; silently re-deriving all retained facts is unsafe.

Keep mutable display names, current approval status, current actor and attempt time out of the origin tuple. Those belong to other facts. Conversely, including a source digest deliberately distinguishes two source packages with the same human-readable name. Do not remove it simply to obtain stable IDs across changed content.

## Failure and recovery

| Situation                                         | Decision                                                                                     |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Same validated tuple is supplied again            | Derive the same identity; separately authorize access to the retained fact.                  |
| Same source label now refers to changed bytes     | Resolve the exact source version and digest; do not reuse an identity based on the label.    |
| UUID text is noncanonical                         | Reject before deriving; do not silently create another naming representation.                |
| Another implementation derives a different result | Compare namespace bytes, ordered UTF-8 fields and length framing before changing stored IDs. |
| A namespace or encoding change is required        | Introduce an explicit version and compatibility mapping rather than overwriting origins.     |

A deterministic calculation does not serialize writes. Retaining a derived identity still needs scoped uniqueness, appropriate transaction ownership and a rule for conflicting evidence. Use [transactional commands](../application-services/transactional-commands.md) for that boundary. A failed write can be retried with the same origin; changed business intent needs a different command contract rather than a random salt.

## Acceptance scenarios and anti-patterns

Require identical output for repeated canonical tuples, distinct framing for ambiguous concatenations, correct UTF-8 byte lengths, and an explicit rejection for unsupported source kinds. Require the consuming command to reject an otherwise valid identity from another scope. A compatibility fixture should detect accidental namespace or byte-order changes; these are future verification scenarios, not claims of executed checks.

Avoid delimiter-only concatenation, locale-sensitive formatting, platform-default encodings and random namespaces created at process startup. Do not call this a signature, use it as a bearer credential, or infer permission from possession of a derived ID. The owner of the original immutable source defines identity; the owner of each command still decides authority and allowed transitions.

## Source

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/DeliveryTimeLineage.java`
