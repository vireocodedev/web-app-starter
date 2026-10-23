# HTTP, application service and persistence boundaries

**Support status: installed foundation with an explicitly marked reference recipe.** The starter has authentication controllers, DTO records, a user entity and a JPA repository. A general domain-service framework, tenant authority service and business CRUD module are not installed. The transactional mutation example below adapts boundaries observed in Client Discovery; its named domain types are pseudocode.

Use this pattern when adding the first consumer feature or splitting an endpoint that mixes authentication, SQL, business policy and response construction. The goal is to make one business action understandable from its application-service entry point, with an explicit HTTP contract and one persistence boundary.

## Keep the transport contract distinct from stored state

The installed `AuthController` maps `/auth` beneath the `/api` servlet context. It accepts a validated `LoginRequest` and returns purpose-built `CsrfResponse` or `SessionUser` records. It never returns the persistent `AppUser` entity. That distinction matters because the entity carries a password hash and persistence concerns, while the session response exposes only `id`, `displayName` and `email`.

`AppUserRepository` extends `JpaRepository<AppUser, UUID>` and adds `findByUsername`. `AppUser` generates its UUID in the application constructor and keeps a protected no-argument constructor for JPA. These are concrete installed contracts, not a universal base entity or generic controller hierarchy.

| Layer               | Owns                                                       | Must not silently acquire                              |
| ------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| HTTP controller     | Mapping, request validation, status and transport response | Reusable domain policy hidden inside endpoint branches |
| Application service | Current actor, authority, business invariants, transaction | Cookie handling or raw servlet response writing        |
| Persistence         | Queries, locks, constraints, entity storage                | The right to bypass scope because an identifier exists |
| DTO projection      | Deliberately selected public fields                        | Automatic entity serialization or lazy traversal       |

Authentication is a special workflow with installed Security collaborators. Do not move its session rotation or context persistence into a generic business service just to make all controllers look alike.

## A practical mutation recipe

Client Discovery demonstrates a service-owned transaction around a complete action: resolve an enabled actor, find the resource, check membership and mutable state, validate an expected revision, persist changes and append audit data. Its file upload service also locks the parent before checking shared quota, so competing uploads cannot each act on the same spare capacity.

The following is **recipe pseudocode, not an installed API**. A consumer must implement the command/response records, actor policy, scoped repository, conflict exception, audit writer, migrations and HTTP error mapping. JPA and Spring transactions are already dependencies; the domain collaborators are not.

```java
@Transactional
public RecordView rename(UUID workspaceId, UUID recordId,
                         RenameRecord command, Authentication authentication) {
    var actor = actors.requireEnabled(authentication);
    var record = records.lockInWorkspace(workspaceId, recordId, actor);
    record.requireMutable();
    if (record.revision() != command.expectedRevision()) {
        throw new StaleRevision();
    }
    record.rename(command.name());
    record.advanceRevision();
    audit.append(actor.id(), record.id(), "RECORD_RENAMED");
    return views.record(record, actor);
}
```

The controller translates the request and delegates once. The service keeps the invariant and all related database writes together. A failure writing the audit row must not leave the rename committed when audit is part of the business contract. Returning a DTO does not itself prove commit success: an outer transaction or commit-time constraint can still fail.

## Authority and transaction details are part of the seam

A session principal identifies an account; the application's current records establish what that account may do. The starter session endpoint reloads an enabled user, but it does not install automatic live account checks for every future domain action. A new service must choose and implement that policy explicitly. The starter's Security role is `USER`; peer ADMIN roles or memberships are not portable assumptions.

In the inspected Discovery implementation, the enabled actor is resolved first. A locking resource lookup may then acquire a row lock before its membership check returns 404 for a hidden resource. Do not rewrite that evidence as a universal claim that authorization always precedes every lock. State the actual order and the reason for the chosen lock scope.

Spring proxy transactions also have a boundary: calling another annotated method on the same service object does not create a new intercepted transaction. Adding `@Transactional` to a private helper does not isolate its work. Start retries, separate transactions and external I/O through deliberately designed boundaries instead of assuming annotations on every helper compose automatically.

## Failure and recovery

Two editors read revision 7. The first saves revision 8; the second submits expected revision 7. A correct service returns the consumer's documented conflict response and preserves the second editor's unsaved draft in the frontend. A blind retry with refreshed revision would overwrite intent and is not a valid recovery policy.

With Open Session in View disabled, a response requiring lazy data must load and map it inside the intended service/query transaction. Solve an accidental lazy-loading failure through the projection/query boundary, not by re-enabling web-wide sessions. Keep remote calls outside long database locks; a durable external operation needs its own claim, I/O and reconciliation design.

## Acceptance cases for a future implementation

Use these cases to define the checks for a consumer implementation; follow its current verification authorization.

- Invalid transport input is rejected before domain mutation; a persistence entity never appears directly in JSON.
- An identifier from another workspace cannot reach mutation or private projection.
- A stale revision produces a conflict rather than an overwrite, and the UI retains the draft.
- A related write failure rolls back the complete action, including audit data when required.
- A newly disabled account cannot perform an action whose contract requires current enabled authority.
- DTO construction completes within its explicit data-loading boundary without hidden web-layer queries.

## Exact source references

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/AuthController.java` — transport DTOs and special authentication workflow.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/user/AppUser.java` — stored identity and password hash.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/user/AppUserRepository.java` — installed JPA seam.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/DiscoveryService.java` — actor, resource lock, membership and revision policy.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectFilesService.java` — transactional quota, storage and audit action.
