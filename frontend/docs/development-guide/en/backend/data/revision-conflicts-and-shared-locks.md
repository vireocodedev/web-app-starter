# Revision conflicts and shared invariant locks

**Support status: source-backed reference recipe.** Client Discovery demonstrates expected revisions checked under a project row lock, plus a shared parent lock for file quotas and lifecycle changes. The starter does not provide a universal revision field, lock helper or conflict DTO. Those are consumer-owned contracts.

Use revisions when an edit must detect that the user's view is stale. Use shared locks when several commands can violate one invariant even while editing different child rows. These solve related but different problems: an edit conflict protects user intent; serialization protects the aggregate's valid state.

## Match the actual revision protocol

Discovery requests carry `expectedRevision`. Its parser requires a numeric, nonnegative integer rather than accepting strings, negative values or fractional values. The service compares that value with the stored project's revision and returns 409 when they differ. A successful metadata mutation increments the revision inside the same transaction as its updates and audit.

The inspected source checks the revision after taking a `FOR UPDATE OF p` lock on the project. It does not demonstrate a generic JPA `@Version` module or an atomic compare-and-swap `UPDATE ... WHERE revision = ?` helper. Those can be separate designs, but must not be described as the installed mechanism. A new consumer should use a DTO integer type and a deliberate numeric range so serialization does not silently lose precision.

| Situation                                     | Correct outcome                                             |
| --------------------------------------------- | ----------------------------------------------------------- |
| Current revision equals request               | Continue other state/authority checks and mutate atomically |
| Current revision is newer                     | Return conflict; preserve the caller's draft                |
| Missing, negative or fractional revision      | Reject malformed command before mutation                    |
| Same revision but domain state forbids action | Return the documented state conflict                        |

For two editors starting at revision 7, the first save commits revision 8. The second submission with 7 must not be silently rebound to 8. The UI should retain its draft and offer reload/reconciliation. An automatic retry with the latest revision would disable the protection precisely when the user needs it.

## Lock the invariant shared by competing commands

An upload quota is not protected by locking only the new file: it has no row yet. Discovery locks the parent project before counting files or summing bytes. The same parent protocol is used by competing uploads, membership revocation and deletion. This prevents two uploads from each observing spare capacity and both exceeding the total after commit.

Its order is source-specific: resolve the enabled actor first; the resource lookup may acquire the project row lock; membership checks then hide unauthorized resources with 404. Administrator-only actions can require that authority before the lookup. Do not summarize this as either “all permission checks happen before any lock” or “locking grants authority.” The lock orders access to state; the membership policy still decides permission.

**Recipe pseudocode** below requires a scoped repository, actor policy, quota policy, content reader, audit writer and error mapping. These collaborators are not starter imports.

```java
@Transactional
public AssetView add(UUID workspaceId, Upload command, Authentication auth) {
    var actor = actors.requireEnabled(auth);
    var workspace = workspaces.lockAndRequireVisible(workspaceId, actor);
    workspace.requireMutable();
    var usage = assets.usage(workspace.id());
    quota.requireCapacity(usage, command.declaredLength());
    var bytes = content.readAtMost(command.stream(), quota.fileLimit() + 1);
    quota.requireActualCapacity(usage, bytes.length);
    var asset = assets.insert(workspace.id(), bytes);
    audit.append(actor.id(), asset.id(), "ASSET_ADDED");
    return views.asset(asset);
}
```

The actual upload source rechecks bytes after a bounded read, so correctness does not rest solely on multipart size metadata. The lock remains held while that bounded content is read; this is an observed tradeoff for small bounded files, not a recommendation to hold locks while streaming arbitrary content or making remote calls.

## Keep lock scope proportional and consistent

Discovery also has a finance mutex acquired after administrator authentication and before resource locks inside the caller's transaction. That global domain lock serializes a specific invariant spanning resources. It is not the default lock to put around every endpoint. Document which invariant requires broad serialization and which commands participate before introducing such a mutex.

Adding a new writer means updating the protocol, not just calling a convenient repository method. A background cleanup, membership revoke or delete path that bypasses the parent lock can reopen the race even if the upload endpoint is correct. A read-only transaction alone provides neither this mutual exclusion nor a documented snapshot guarantee.

## Failure and recovery

If a stale save fails with 409, keep the user's proposed values distinct from the refreshed server view. If a lock wait times out or the database aborts a transaction, return the defined failure and retry only under a separate bounded retry policy. Never reuse in-memory “available quota” calculated before the transaction acquired its protecting lock.

Avoid long external I/O under row locks, inconsistent acquisition order, and catching a database exception merely to continue in the same failed transaction. Each is a different failure mode requiring its own boundary. A shared parent lock is helpful only when the protected invariant and all participating writers are explicit.

## Acceptance cases to carry into an implementation

- Two stale editors produce one accepted next revision and one conflict without losing either local draft.
- Invalid revision shapes are distinguished from a legitimate stale-state conflict.
- Concurrent uploads that would exceed a shared quota cannot both commit.
- Membership revocation and deletion participate in the same parent-lock protocol as upload.
- Authorization remains enforced even when the resource lock is acquired first.
- A global mutex appears only with an identified cross-resource invariant and documented order.
- Failed lock acquisition or transaction abort leaves no partial asset or audit success.

## Exact source references

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/DiscoveryService.java` — revision parser, conflict, actor/resource/membership order and metadata increment.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectFilesService.java` — shared parent lock and actual byte/quota rechecks.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectPreparationService.java` — revision-aware draft/review/export under the same parent boundary.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectFinanceLock.java` — explicitly ordered domain-wide mutex.
