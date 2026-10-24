# Replacement lineage and cycle rejection

Use an explicit lineage graph when a replacement preserves some identities from an earlier source while introducing new local identifiers. A renamed row, a copied document or the latest version number cannot prove ancestry. A command that consumes historical evidence must resolve the exact origin and establish whether every intervening replacement permits that use.

This reference recipe describes Client Discovery's `DeliveryTimeLineage`; it is not installed in the starter. Its time-based and fixed-amount branches are domain-specific examples of retained replacement edges. Adapt their graph contract rather than copying their commercial eligibility rules.

## Resolve edges instead of guessing ancestry

The time-based `resolve` reads an authorization within the project, requires the selected line's supported calculation kind, and tracks visited authorization UUIDs. Revisiting an authorization rejects the traversal. A missing continuation is a legitimate first root only when the source is the permitted root kind and does not declare a replacement. Missing evidence for a declared replacement is a conflict, not permission to invent a new root.

For a replacement, there must be exactly one retained continuation and exactly one mapping for the replacement line. The retained replacement reference must canonically equal the supplied reference. The resolver follows the mapped predecessor line, derives its root, and requires the edge's retained root key to match. Existing retained lineage facts must also agree on root key, origin line and canonical origin agreement.

`fixedOrigin` follows the same broad ancestry idea but compares original line and original agreement instead of producing the same time-line root key. Do not assume every validation is identical between these two methods. `historicalAllowed` walks forward through replacements and requires an explicit permission on each selected mapping and a matching root. It returns false for its detected cycles, missing/ambiguous mappings or disallowed historical use; other source-read failures can still propagate.

The important separation is identity versus admissibility. Knowing the original source does not establish that a new command may still use it.

## Bound the work and own the snapshot

The inspected resolver has visited-set cycle rejection but no explicit maximum acyclic depth or read budget. A long valid chain can still exhaust stack, time or database capacity. An adaptation should add a bounded iterative traversal, a maximum number of source reads and a clear reconciliation outcome when the budget is exceeded. Exceeding a budget is not proof of a cycle or invalid ancestry.

Conceptual pseudocode, not an installed helper:

```text
while source declares a predecessor:
  require remainingBudget > 0
  require authorizationId not in visited
  remember authorizationId; consume one budget unit
  edge = requireExactlyOneScopedRetainedEdge(source)
  mapping = requireExactlyOneLineMapping(edge, selectedLine)
  require mapping agrees with retained root evidence
  source, selectedLine = mapping.predecessor
return validatedOrigin
```

The caller owns a consistent read/write boundary and any locks needed while retaining a result. The helper's `retain` re-resolves the origin, checks that its evidence ID names exactly one recognized evidence type, then uses scoped conflict avoidance for insertion. These steps alone do not establish the transaction isolation of every caller. Follow [transactional commands](../application-services/transactional-commands.md) and [shared revision locks](revision-conflicts-and-shared-locks.md).

## Failure and recovery

| Finding                                    | Response                                                        |
| ------------------------------------------ | --------------------------------------------------------------- |
| Declared replacement has no retained edge  | Block and reconcile source evidence; do not treat it as a root. |
| Two edges or two mappings match            | Reject ambiguity; never choose the newest or first row.         |
| A visited authorization appears again      | Reject the cycle and preserve evidence for repair.              |
| Root key or original agreement disagrees   | Reject the command without overwriting the old origin.          |
| Historical use lacks permission on one hop | Deny that use even if the root can be resolved.                 |
| Acyclic traversal exceeds its work budget  | Report incomplete resolution and use an explicit repair path.   |

Retain prior facts during repair. A corrected edge should have attributable evidence and an explicit policy for consumers that already referenced the old chain. Rewriting all lineage rows to make the current command pass destroys the audit relationship the graph exists to preserve.

## Acceptance scenarios and anti-patterns

Cover a valid root, a multi-hop replacement, a self-cycle, a longer cycle, an absent edge, duplicate mappings, a cross-project reference and a retained-root mismatch. Separately cover a valid origin whose historical use is denied, and an over-budget acyclic chain. These describe desired outcomes; reading the source does not establish that these scenarios were executed.

Avoid ancestry inferred from labels, “first matching row” resolution, recursive traversal without a budget, and treating replacement as blanket authorization to reuse all old evidence. Use [namespaced deterministic identities](namespaced-deterministic-identities.md) only to name the proven root; deterministic naming cannot repair missing lineage.

## Source

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/DeliveryTimeLineage.java`
