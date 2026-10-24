# Keep parsed imports separate from qualified observations

**Support: reference recipe.** Client Discovery demonstrates retained source parsing followed by an explicit provenance decision. Neither service nor its policy APIs are installed in the starter. Use the pattern when an imported record may later justify an allocation, inventory movement or another consequential operation. A plausible row is not proof of who produced it.

## Preserve four different identities

The source owner distinguishes original artifact bytes, a parsed source, individual entries and a verification record. `parse` requires an artifact with the expected classification and source-group owner. The command's seller and account must match that group. Only one parser key and version are accepted. It parses the retained original, then calculates a source digest from the original SHA-256, account key, parser identity and canonical entries. Each entry also receives its own canonical payload digest.

This binds the interpretation to retained input. It does not establish that the uploaded file was acquired from the named institution. An attacker can produce syntactically excellent CSV. Parsing creates a source record and entries; it does not directly create qualified receipts. The original is not overwritten by a normalization result. [Bounded CSV contracts](../files/bounded-csv-interchange-contracts.md) own grammar, while [digests and reviewed artifact versions](../data/digests-and-reviewed-artifact-versions.md) explain identity boundaries.

The neutral analogue is a capacity observation imported from a supplier: retain the original measurement bundle, parser version, normalized observations and a separate acquisition review. A checksum detects changed bytes, not dishonest acquisition claims.

## Qualification binds current policy to exact evidence

`verify` compares the submitted source digest to the retained source and rejects an already qualified or empty source. `currentReview` checks current review policy for every entry currency and the selected account, including the source creator for independence decisions. It also checks independence of original and optional normalization artifacts. The reviewed procedure must match the requested institution, parser version and allowed acquisition kind. Every amount must fit the reviewed currency scale.

Acquisition time cannot be in the future. Optional normalization requires explicit permission, matching classification and source group. Verification evidence is scoped to that group. The retained provenance records original and normalization identities and hashes, acquisition claim, procedure review, verifier, times and verification statement. Those fields explain a human/policy qualification; they are not a cryptographic institution signature or independent proof that each claim is true. No private review rule here should become an unconditional rule for every consumer.

Only after that qualification does the implementation consider booked inbound entries for receipts or reversed entries for pending reversal evidence. A pending reversal remains a further decision, not an automatic completed reversal. Existing account/transaction identity is checked across qualified imports. Conflicting amount, currency, direction, status, original reference or counterparty account yields retained conflict evidence and blocks normal use rather than silently replacing facts.

## Implement an explicit consumer seam

The following **pseudocode** requires consumer-owned import storage, policy qualification, authorization, conflict resolution and transactional command services. It is not a proposal to install banking APIs into a generic starter.

```text
parseSource(actor, originalId, formatVersion):
    original = requireScopedOriginal(actor, originalId)
    observations = parseBounded(original.bytes, formatVersion)
    return retainParsed(original.digest, formatVersion, observations)

qualifySource(actor, sourceId, expectedDigest, evidence):
    source = reloadUnderCommandLocks(sourceId)
    requireCurrentAuthority(actor, source.scope)
    requireExactDigest(source, expectedDigest)
    review = requireCurrentProcedure(source, actor, evidence)
    retainQualification(source, review, evidence)
    reconcileQualifiedObservations(source)
```

The public Client Discovery command owner supplies the transaction, affected-project handling, shared mutex, policy locking, revision and retained request receipt. These package-level helpers do not independently establish that boundary. Reuse [transactional commands](../application-services/transactional-commands.md) and [lock ordering](../data/lock-order-and-fresh-transaction-retries.md) rather than calling parse/verify helpers directly from another controller.

## Failure and recovery

Digest mismatch requires reloading the exact source, not accepting a newer digest from the client without review. An expired or mismatched procedure remains unqualified until current authorized evidence is supplied. A source may be parsable but empty; qualification rejects it. A repeated transaction with different retained facts is a reconciliation problem. Do not deduplicate it away or turn conflict into a green status.

For recovery, preserve the original source and failed decision context, obtain the required evidence and submit a new bounded command. Avoid logging original financial or supplier payloads. If an application needs automatic provider-authenticated acquisition, introduce that adapter and evidence contract explicitly; the source's manual review mechanism does not supply it.

Acceptance cases should distinguish a valid file from a qualified source, changed original/parser digest, mismatched account group, stale policy, disallowed normalization, future acquisition, conflicted repeat identity and a pending reversal. Show that a qualification failure rolls back its downstream effects, and that a retained conflict cannot be bypassed by reimporting the same transaction under another source ID.

## Sources

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BankReconciliationService.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BankStatementV1.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/CustomerBillingService.java`
