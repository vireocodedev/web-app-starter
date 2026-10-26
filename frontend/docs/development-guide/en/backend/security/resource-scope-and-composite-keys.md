# Enforce resource scope in authority, queries and keys

**Support status: source-backed reference recipe.** Client Discovery and FRED demonstrate live authority and resource binding; Discovery migrations demonstrate composite foreign keys that preserve project scope. The starter has account/session infrastructure but no installed tenant, membership, scoped repository or composite-key domain module.

Use this pattern whenever a URL contains both an owner ID and a child ID, a request attaches one resource to another, or an authenticated session can outlive a permission change. Existence is not authority, and a valid foreign key to the wrong scope is still a security defect.

## Resolve current authority separately from session identity

Discovery resolves the session username through the current user repository and requires an enabled account before domain actions. Its resource lookup checks membership or the explicit administrator policy and hides unauthorized projects with 404. For a locking lookup, it may take the project row lock before membership is checked. Preserve this source-specific ordering when explaining it; there is no general rule that its complete membership check always precedes every lock.

FRED's `PilotUserAccess` reloads the user by the session principal's identity. It rejects locked accounts and mismatches between current account and principal company/email. It separately requires a configured permitted company and binds the requested controller to both session controller and current operator attributes. Session identity alone cannot select an arbitrary company or restore a previous operational binding.

These are different authority models. Copy their design questions, not their role names, custom principal classes or device assumptions. A consumer must define its own live actor loader, workspace membership/role rules, revocation behavior and error contract. The starter session endpoint's enabled-user check does not automatically install those rules on every new endpoint.

## Scope every child lookup and attachment

For a hypothetical `/workspaces/{workspaceId}/assets/{assetId}` request, both identifiers constrain the lookup. After the actor is authorized for the workspace, fetch the asset by `(workspaceId, assetId)`, not merely by `assetId`. Apply the same rule to downloads, revisions, exports, audit history and nested attachments. A UI that omits a link is presentation, not backend authorization.

**Pseudocode recipe:** `actors`, `memberships`, `assets` and `views` are consumer-owned seams. Implement live authority, scoped SQL/repository methods, DTOs and the selected hidden-resource response before adapting this code.

```java
public AssetView read(UUID workspaceId, UUID assetId, Authentication auth) {
    var actor = actors.requireCurrent(auth);
    memberships.requireVisible(workspaceId, actor);
    var asset = assets.findByWorkspaceAndId(workspaceId, assetId)
        .orElseThrow(ResourceNotFound::new);
    return views.permittedAsset(asset, actor);
}
```

This recipe checks membership before the child query; it does not claim to reproduce Discovery's locking order. For mutations, coordinate authorization changes and protected resource state through the chosen transaction/lock protocol. A membership check performed long before mutation can otherwise race revocation.

| Caller input                 | Server-owned decision                                        |
| ---------------------------- | ------------------------------------------------------------ |
| Workspace path ID            | Whether the current actor may operate there                  |
| Asset or version ID          | Whether it belongs to the same permitted scope               |
| Target record ID             | Whether attachment is authorized and structurally consistent |
| Client-supplied company/role | Never accepted as proof of authority                         |

## Encode scope consistency in the database

Discovery's versioned specification/development schema uses `UNIQUE(id, project_id)` and foreign keys containing both child reference and project ID. This prevents a row from declaring project A while referencing a retained version or grant from project B. Application validation can provide a clearer error, but the database prevents invalid links across concurrent and alternative writers.

The following is a **recipe schema fragment**, not an installed migration. It assumes separately defined workspace, record and note tables and a reviewed deletion policy. A consumer must add its actual next Flyway migration and align entity/query mappings.

```sql
ALTER TABLE workspace_record
    ADD CONSTRAINT record_id_workspace UNIQUE (id, workspace_id);

ALTER TABLE record_note
    ADD CONSTRAINT note_record_scope
    FOREIGN KEY (record_id, workspace_id)
    REFERENCES workspace_record (id, workspace_id);
```

A globally unique record ID does not make the second scope column redundant: the composite relationship proves that the declared parent scope and referenced record agree. Conversely, this foreign key proves structural consistency only. It does not authorize the caller, hide rows, limit returned fields or protect a list's counts and search facets.

## Failure and recovery

If a user submits another workspace's valid asset ID, return the selected hidden/not-found or forbidden contract consistently; do not disclose names or ownership in an error. If a session's company changes, require the intended reauthentication/rebinding workflow rather than silently moving an active operational session into the new company.

If a composite foreign key rejects an attachment, roll back the command and translate only the known safe domain conflict. Do not retry with the referenced object's real workspace or “repair” the request's scope automatically. That would turn a failed security boundary into unauthorized reassignment. Review any background import or administrative tool that bypasses the ordinary service because database integrity alone is not a full authority policy.

## Acceptance cases to carry into an implementation

- A disabled, revoked or tenant-changed account loses the authority required by the next protected action.
- A child ID from another workspace cannot be read, downloaded, mutated or attached through a permitted workspace path.
- Resource hiding is consistent and does not reveal private scope details in errors or metadata.
- Composite keys reject cross-scope attachments even through a second writer.
- List rows, totals, facets and history apply the same visibility model.
- An operational session binding verifies both current actor and selected resource, rather than restoring authority from a remembered identity alone.

## Exact source references

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/DiscoveryService.java` — enabled actor, membership hiding and locking lookup order.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectFilesService.java` — project-scoped private content lookup.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/resources/db/migration/V10__specification_development.sql` — composite project-scoped foreign keys.
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/pilot/PilotUserAccess.java` — live account/company and session operator/controller checks.
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/session/LivestreamSessionService.java` — stored resource, company, controller and owner agreement.
