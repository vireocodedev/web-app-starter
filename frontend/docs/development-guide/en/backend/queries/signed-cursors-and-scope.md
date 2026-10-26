# Signed cursors bind paging to semantic scope

**Support status: source-backed reference recipe with explicit scaling limits.** Client Discovery's `DeliveryPaging` authenticates a cursor against actor, project, collection context and visible projection. Its current implementation materializes the visible collection before slicing it. It is not a starter-installed cursor API or evidence of scalable SQL keyset paging.

Use this pattern when a continuation token must not be swapped across users or collections, or when paging must reject a changed visible projection rather than quietly continue through a different result. Authentication, freshness and query efficiency are separate parts of the contract.

## Bind meaning, not only the last ID

The source cursor includes domain, actor, project, kind, context, filter slot, last sort key, expiry and projection fingerprint. The filter slot is currently an empty string in this helper; do not claim it already implements arbitrary search/filter binding. A consumer adding such filters must include their canonical meaning deliberately.

The payload is canonicalized, base64url encoded and authenticated with HMAC-SHA256. On read, the helper checks its two-part shape, compares the expected signature using `MessageDigest.isEqual`, decodes the payload and validates all expected fields before applying the continuation. It checks expiry and compares the fingerprint of the current visible projection.

| Binding                             | Failure it prevents                                     |
| ----------------------------------- | ------------------------------------------------------- |
| Actor and project                   | Reusing a token in another account/scope                |
| Domain, collection kind and context | Applying one list's position to another                 |
| Canonical filters                   | Changing query meaning while keeping continuation       |
| Last complete sort key              | Ambiguous continuation at tied timestamps/labels        |
| Projection fingerprint              | Continuing after the defined visible collection changed |
| Expiry                              | Treating old paging state as indefinitely current       |

A valid signature is not authorization. Recompute current domain visibility before paging; the token does not grant the account a right it has since lost.

## Signed is not encrypted

Anyone holding the cursor can base64-decode its payload. HMAC protects integrity and authenticity under the key, not confidentiality. Keep private counters, secret labels, credentials and hidden fields out of the token. A fingerprint can help bind state without publishing that state's content, but it still needs a deliberate definition over the permitted projection.

**Pseudocode recipe:** `cursorCodec`, `authority`, `projection` and `Page` below are proposed consumer seams. Implement a canonical payload schema, key management, typed failures, permitted query and stable order before adapting it.

```java
public Page next(Query request, Authentication auth) {
    var actor = authority.requireCurrent(auth);
    var visible = projection.forActor(actor, request.scope(), request.filters());
    var token = cursorCodec.verify(request.cursor());
    token.requireScope(actor.id(), request.scope(), request.filters());
    token.requireFresh(visible.fingerprint());
    return visible.after(token.lastSortKey(), request.limit());
}
```

This does not imply `visible` should materialize every row. A scalable implementation must push authorized filtering and a seek predicate into bounded database queries, while defining how its freshness guarantee is computed without an unbounded full scan.

## Expose the actual ordering and freshness tradeoff

The observed helper sorts retained records by chronology plus identity (and recipient identity when relevant), descending; options use label plus identity in ascending order. It retains enough tuple meaning to break ties. Projection changes return 409; malformed/tampered/scope-mismatched tokens become 400; expired cursors return a distinct 409 reason. Its limit ceiling of 100 and expiry of 900 seconds are peer policy choices, not universal defaults.

The fingerprint covers the complete visible sorted payload collection. That deliberately detects more than insertion before the cursor: changes in the visible projection can invalidate it. The UI should offer a fresh first page while preserving the user's filter intent, rather than silently discarding the failure or treating the collection as empty.

The cost is important: the helper obtains visible rows, fetches retained chronology, sorts and hashes the collection, then filters the tail and takes the limit in memory. A small page does not bound that preceding work. Calling it logical keyset continuation is different from claiming database-level keyset efficiency.

## Key lifetime and recovery are design requirements

The source generates a random 32-byte key for the component's lifetime. There is no configured shared key ring or key identifier in this helper. Restarting the process invalidates earlier cursors; independent application replicas produce incompatible signatures. Do not deploy a copied implementation across replicas and assume tokens survive routing changes.

A consumer that needs cross-replica continuity must design shared protected key ownership, rotation, old-key acceptance, expiry and incident invalidation. Those are missing implementation decisions, not settings already supplied by the starter. Key changes must not become an excuse to accept unsigned cursors or skip actor/scope checks.

## Acceptance cases to carry into an implementation

- Tampering and actor/project/collection/context/filter swaps fail without exposing private details.
- Expiry and changed-projection conflicts are distinct from a malformed token and offer first-page recovery.
- Equal primary sort values continue without duplicate or skipped identities under the defined snapshot/freshness contract.
- Token payloads contain no confidential fields; authorization is recomputed every request.
- Restart and replica behavior match documented key ownership rather than accidental process-local behavior.
- A scaling claim includes query-side bounds and measured fingerprint cost, not only a small returned page.

## Exact source references

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/DeliveryPaging.java` — authenticated payload, scope fields, constant-time signature comparison, expiry, visible-projection fingerprint, process-local key and in-memory slicing.
