# Resolve live authority instead of trusting stale session claims

**Support status: installed identity check with source-backed domain recipes.** The starter's session endpoint reloads an enabled account. Client Discovery and FRED go further for their domain operations. The starter does not automatically reload all permissions on every protected request or install either peer's tenant/operator model.

Use this pattern when disabling an account, changing tenant membership, adding privileged commands or maintaining long-lived sessions. Authentication identifies a principal at a point in time; current domain records determine what that principal may do now.

## State the installed boundary accurately

The starter user-details adapter loads username, password hash and enabled state at login and grants `USER`. Its session endpoint looks up the current username again and rejects a missing or disabled account before returning public identity. This is useful live checking at that endpoint, not proof that Spring invalidates every existing session immediately after a database edit.

A future business controller guarded only by “authenticated” can still receive a previously authenticated principal. It needs an explicit current-actor/authority policy if disablement, role changes or membership revocation must affect its next action. Do not add peer administrator annotations to the starter and assume the missing role model exists.

## Identify which facts must be current

Client Discovery's domain service reloads an enabled account before actions and uses its current administrator role or resource membership. FRED's user-access owner reloads by principal identity, rejects locked accounts and rejects a changed company or email relative to the session principal. Its company policy additionally checks current permitted configuration.

| Fact                         | Ownership question                                     |
| ---------------------------- | ------------------------------------------------------ |
| Account identity             | How does the session reference a stable account?       |
| Enabled/locked state         | Which actions reload it, and when?                     |
| Role or membership           | Which current record authorizes this operation?        |
| Tenant/company binding       | Does a change require reauthentication/rebinding?      |
| Operational resource binding | Is it valid for both this actor and this resource now? |

The FRED method does not compare every possible account field. In particular, do not describe it as a general password/role fingerprint check; its remembered-credential service has a separate fingerprint policy. A fresh account read only helps if the action actually uses its current authority instead of continuing with cached claims.

## Make the action boundary explicit

The following is **pseudocode recipe**, not a starter actor service. Implement account lookup, membership policy, scoped resource queries, error mapping and the transaction/lock protocol before adapting it.

```java
@Transactional
public RecordView change(UUID workspaceId, UUID recordId,
                         ChangeRecord command, Authentication authentication) {
    var actor = actors.requireEnabledCurrentAccount(authentication);
    var record = records.lockInWorkspace(workspaceId, recordId);
    authority.requireCurrentMembership(actor, workspaceId, command.action());
    record.applyAllowed(command);
    return views.permitted(record, actor);
}
```

The exact lock/authority order is domain-owned. Discovery can lock a resource row before checking membership and hide the unauthorized resource with 404. This recipe is not a universal claim that authorization must happen before every lock. Coordinate revocation and mutation under the shared protocol if the contract requires concurrency-safe revocation; a fresh check far before the write is not sufficient by itself.

FRED also verifies that a session's controller attribute matches the requested controller and that its operator attribute matches the current user. Remembered sign-in restores account identity, not that operational binding or an external native connection. Reusing a remembered account must not silently reattach another operator's resource.

## Failure and recovery

For a changed tenant/company, use the defined reauthentication/rebinding flow rather than treating the stale principal as permission to enter the new scope. For a disabled account, reject protected work with a safe response and clear/reconcile frontend identity according to its auth owner. Do not disclose whether a hidden resource exists merely to explain a failed membership check.

Long-lived streams, queued work and scheduled operations need their own authority decisions. Authorization at enqueue or subscription time may not grant perpetual delivery or execution. Decide whether work retains an explicit reviewed authorization snapshot or must revalidate current authority; neither behavior is automatic merely because the request once authenticated.

Avoid role checks only in React, trusting client tenant IDs, treating a display name as stable identity or resolving a current account and then ignoring its state. Also avoid claiming instantaneous global revocation without an implemented invalidation/locking policy.

## Implementation checklist and acceptance

- Name the live account and resource-authority owner for each protected action.
- A newly disabled account fails the next action covered by that policy.
- Changed membership or tenant cannot reuse cached claims to mutate another scope.
- Current actor and operational resource binding are both verified.
- Reads, commands, downloads and long-lived subscriptions have documented revocation behavior.
- Concurrency with revocation follows one explicit transaction/lock contract.
- The guide distinguishes source checks from stronger invalidation guarantees still to implement.

## Exact source references

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/AuthController.java` — installed enabled-user session lookup.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/SecurityConfiguration.java` — login-time user details and USER authority.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/DiscoveryService.java` — live actor, role/membership and locking order.
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/pilot/PilotUserAccess.java` — current account/company and session operator/controller binding.
