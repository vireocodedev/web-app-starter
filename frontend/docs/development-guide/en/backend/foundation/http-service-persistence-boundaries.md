# HTTP, application service and persistence boundaries

**Support status: installed foundation with an explicitly marked reference recipe.** The starter has authentication controllers, DTO records, a user entity and a JPA repository. A general domain-service framework, tenant authority service and business CRUD module are not installed. The transactional mutation example below adapts boundaries observed in Client Discovery; its named domain types are pseudocode.

Use this pattern when adding the first consumer feature or splitting an endpoint that mixes authentication, SQL, business policy and response construction. The goal is to make one business action understandable from its application-service entry point, with an explicit HTTP contract and one persistence boundary.

## Feature packages and file placement

Use `com.vireocode.backend.<feature>` for a capability's Java files. The installed `auth` and `user` features and the shared `http` transport owner use flat packages: keep a small feature's related classes together, and introduce role subpackages inside that feature only when its actual size or responsibilities need them. Create only the files a feature uses; a new feature does not require an empty service, mapper or folder for every role. Do not replace feature ownership with application-wide `controller`, `service`, `repository`, `entity` or `dto` packages.

Keep application bootstrap and composition in the base package. Feature-specific configuration, initialization and operator commands stay with their owning feature. `SecurityConfiguration` belongs to authentication; local user creation and one-time provisioning belong to `user`. Moving those classes to a generic configuration or startup owner would hide what they configure.

For example, a future invoice capability starts in `com.vireocode.backend.invoice`. Add an `InvoiceController`, `InvoiceService`, `InvoiceRepository` and `Invoice` entity only as the behavior requires them. Use operation-specific transport names such as `CreateInvoiceRequest` and `InvoiceResponse`. These are placement examples, not installed types.

### Current Java ownership

Paths below are the current working-tree sources. This inventory accounts for all 12 main Java source files; it does not claim a general business service or mapper already exists.

| Package                      | Source                                                                                                                 | Responsibility                                                                                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `com.vireocode.backend`      | [BackendApplication](../../../../../../backend/src/main/java/com/vireocode/backend/BackendApplication.java)            | Spring Boot bootstrap, explicit provisioning-flag parsing and closing the provisioning application context.                                                   |
| `com.vireocode.backend.auth` | [AuthController](../../../../../../backend/src/main/java/com/vireocode/backend/auth/AuthController.java)               | CSRF/login/session transport and its nested request/response records; delegates to installed Security collaborators and explicitly projects the session user. |
| `com.vireocode.backend.auth` | [AuthExceptionHandler](../../../../../../backend/src/main/java/com/vireocode/backend/auth/AuthExceptionHandler.java)   | Authentication-exception translation and allowlisted login-validation mapping scoped to `AuthController`.                                                     |
| `com.vireocode.backend.auth` | [SecurityConfiguration](../../../../../../backend/src/main/java/com/vireocode/backend/auth/SecurityConfiguration.java) | Password encoder, user-details lookup, authentication manager, session/CSRF collaborators and the HTTP security filter chain.                                 |
| `com.vireocode.backend.user` | [AppUser](../../../../../../backend/src/main/java/com/vireocode/backend/user/AppUser.java)                             | Persistent account identity, enabled state and password hash.                                                                                                 |
| `com.vireocode.backend.user` | [AppUserRepository](../../../../../../backend/src/main/java/com/vireocode/backend/user/AppUserRepository.java)         | JPA access to users and username lookup.                                                                                                                      |
| `com.vireocode.backend.user` | [LocalUserProperties](../../../../../../backend/src/main/java/com/vireocode/backend/user/LocalUserProperties.java)     | Validated local-bootstrap identity/settings record, also explicitly validated by provisioning.                                                                |
| `com.vireocode.backend.user` | [LocalUserInitializer](../../../../../../backend/src/main/java/com/vireocode/backend/user/LocalUserInitializer.java)   | Local-profile-only transactional account initialization without resetting an existing user.                                                                   |
| `com.vireocode.backend.user` | [ProvisionUserRunner](../../../../../../backend/src/main/java/com/vireocode/backend/user/ProvisionUserRunner.java)     | Explicit one-time provisioning command, protected input validation and matching-existing-account checks.                                                      |
| `com.vireocode.backend.http` | [ApiErrors](../../../../../../backend/src/main/java/com/vireocode/backend/http/ApiErrors.java)                         | Shared fixed error vocabulary, private payload records and the explicitly published authentication writers/factories.                                         |
| `com.vireocode.backend.http` | [ApiExceptionHandler](../../../../../../backend/src/main/java/com/vireocode/backend/http/ApiExceptionHandler.java)     | General MVC exception translation with safe bodies and preserved framework status/headers.                                                                    |
| `com.vireocode.backend.http` | [ApiErrorController](../../../../../../backend/src/main/java/com/vireocode/backend/http/ApiErrorController.java)       | Safe JSON servlet error dispatch using the error status attribute.                                                                                            |

The installed authentication controller and configuration read `AppUserRepository` and project `AppUser` from `user`. The [dependency contract below](#dependency-directions-and-package-interfaces) defines that exact exception and the rules for future collaborations.

Put new feature-focused tests in the corresponding package under `backend/src/test/java`. Existing application/bootstrap tests, cross-feature authentication integration tests and shared `TestcontainersConfiguration` remain in the base test package; this placement rule does not require moving them. Runtime/profile settings remain under `backend/src/main/resources`, while Flyway owns the single ordered migration stream under `db/migration`.

## Dependency directions and package interfaces

**Installed bytecode checks with explicit review obligations.** Treat each feature package and its optional subpackages as one module. Its **Interface** is the deliberately published contract at a **seam**, including allowed operations, DTO/value types and relevant failure/authority rules. All other types are its **Implementation**. A Java `public` declaration needed by Spring or JPA does not publish a feature Interface.

### Current application-owned type dependencies

The current graph contains four exact authentication-to-user lookup/projection pairs and two authentication-to-`http.ApiErrors` Interface pairs. The latter publish only shared HTTP error construction; the `http` owner has no account policy and does not depend on `auth` or `user`. Neither contract publishes user persistence or the complete HTTP implementation to arbitrary consumers.

| Consumer                     | Allowed target           | Operation and reason                                                                                                                                                                                                   |
| ---------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.AuthController`        | `user.AppUserRepository` | `findByUsername` for the authenticated session lookup.                                                                                                                                                                 |
| `auth.AuthController`        | `user.AppUser`           | Inspect enabled state and project `id`, `displayName` and `email` into `SessionUser`.                                                                                                                                  |
| `auth.SecurityConfiguration` | `user.AppUserRepository` | `findByUsername` for the installed user-details lookup.                                                                                                                                                                |
| `auth.SecurityConfiguration` | `user.AppUser`           | Read username, password hash and enabled state to construct Spring Security user details.                                                                                                                              |
| `auth.SecurityConfiguration` | `http.ApiErrors`         | Injected instance: only `writeAuthenticationRequired(HttpServletResponse)` and `writeAccessDenied(HttpServletResponse, boolean)` for Security filter responses.                                                        |
| `auth.AuthExceptionHandler`  | `http.ApiErrors`         | Static factories: only `authenticationFailure()`, `authenticationUnavailable()` and `validationFailure(Map<String, String>)` for scoped rejected authentication, authentication-service failures and login validation. |

The `AppUser` edges count even though the source uses `var`, lambdas and `Optional` instead of explicit `AppUser` imports. Review application-owned types in fields, constructor/method parameters, returns, generic arguments, annotations, inheritance and method calls, including inferred types; import lines alone are not the dependency graph.

`AuthExceptionHandler` remains an authentication Implementation detail. `LocalUserInitializer`, `LocalUserProperties` and `ProvisionUserRunner` remain `user` Implementation details. `AppUser` and `AppUserRepository` are also internal except for the exact consumers and operations above. The `http` advice, fallback controller and private payload records are Implementation details; only the listed `ApiErrors` operations are published to their exact callers. Java-public factories, constructors or other methods are not additional approved operations. This is neither a package-wide `auth → user` nor an `auth → http` permission.

There is no static `user → auth` edge: user initialization and provisioning depend on Spring's `PasswordEncoder` Interface, not on `SecurityConfiguration`. Authentication configuration supplies the bean at runtime. Distinguish that runtime wiring from dependencies between application-owned types.

### Rules for new dependencies

| Scope                             | Permitted direction                                                                                                        | Forbidden direction                                                                                                                                                |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Application composition           | `BackendApplication` bootstraps Spring, which discovers/wires feature beans.                                               | A feature depending on `BackendApplication` or another bootstrap Implementation detail.                                                                            |
| Inside a feature                  | Ordinary HTTP transport → application action → own repository/entity; DTOs and mappers project deliberately selected data. | Repository/entity → HTTP controller, servlet handling or security configuration; DTO/mapper owning reads or business actions.                                      |
| Feature configuration and runners | Wire their own feature and the required framework Interfaces; preserve the installed authentication workflow.              | Using configuration/runner placement to bypass another feature's unpublished Implementation.                                                                       |
| Between features                  | Only an explicitly approved published application Interface and its approved DTO/value types, or an exact exception above. | Any undeclared edge, a reverse `user → auth` edge, another feature's repository/entity/configuration outside the exact authentication exception above, or a cycle. |
| Test source                       | Tests may depend on production code and test fixtures.                                                                     | Production code depending on tests, mocks or test fixtures.                                                                                                        |

A future feature is isolated by default. Before adding a cross-feature collaboration, present the consuming class, exact published types, permitted operations, direction and rationale for approval under the root workflow. Record the approved collaboration in this contract before implementation. Prefer a small application Interface at the owning feature's seam rather than exposing its repository or entity. Framework bean-name lookup or reflection must respect that same declared Interface and cannot hide an undeclared collaboration. This is a contract for a real collaboration, not a requirement to add empty ports, wrappers or placeholder interfaces now.

### Review examples

| Change                                                                                                                   | Decision                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| The four listed auth-to-user lookups/projections above                                                                   | Allowed only for their documented authentication purpose.                                                                 |
| `SecurityConfiguration` uses its two published `ApiErrors` writers, or `AuthExceptionHandler` its three static factories | Allowed only for the listed error responses; another caller, member, constructor or nested payload type is not published. |
| A future `invoice.InvoiceService` accepts `AppUserRepository` or returns `List<AppUser>`                                 | Forbidden: neither type is published to `invoice`; generic/return types count too.                                        |
| `LocalUserInitializer` accepts Spring `PasswordEncoder`                                                                  | Allowed framework Interface; it does not create a `user → auth` type dependency.                                          |
| `user` imports `SecurityConfiguration`, or any feature calls `BackendApplication`                                        | Forbidden reverse or feature-to-bootstrap dependency.                                                                     |
| Production code imports `TestcontainersConfiguration` or a test fixture                                                  | Forbidden production-to-test dependency.                                                                                  |
| Two features depend on each other's types, including through inferred values                                             | Forbidden cycle; change the proposed collaboration before implementation.                                                 |

Java package visibility is narrower than this feature convention. Package-private members are accessible only in the same exact package; a nested package has no parent-package access. Public accessibility across packages is not permission to use unpublished Implementation types. The checks below enforce the static parts of this contract; they do not change Java visibility or runtime wiring.

### Automated architecture checks

The complete installed frontend/backend rule-to-check and proof map lives in
[Architecture invariants and checks](../../quality/test-design/architecture-invariants-and-checks.md).
The contract here remains the owner of backend package Interfaces and operations.

`backend/src/test/java/com/vireocode/backend/architecture/ArchitectureTests.java` imports the complete compiled main-output directory containing `BackendApplication`. Before evaluating rules, it requires a nonempty inventory containing that bootstrap class, compares every imported class name with the output's `.class` files, and verifies that no class came from test output. Import runs in `BeforeAll`, so Gradle's dry-run CI inventory can discover test methods without running it.

The shared `BackendArchitectureRules` checks:

- Feature dependencies, including generic signatures and inferred types, against the six exact caller/target pairs above, including the narrow shared-error Interface. The base package currently contains only `BackendApplication`; additional base-package types and direct bootstrap-to-feature dependencies fail. Spring's runtime bean discovery remains the composition mechanism. A future composition class or static collaboration needs explicit contract/rule review rather than a base-package escape from feature ownership.
- Feature cycles through `featureCycles`: first-level feature packages include their nested packages and static generic dependencies; bootstrap remains under separate guards, and class cycles inside one feature are allowed.
- Direct authentication accesses to the `AppUserRepository` API family and listed `AppUser` members against the documented lookup and getter operations, including ordinary calls, inherited Spring Data operations, field accesses, and method/constructor references. Being an allowed consumer of `AppUserRepository` does not grant writes through that repository interface.
- Authentication accesses to `http.ApiErrors` against the exact published instance writers/static factories and parameter signatures above. Additional members, constructor calls, references or caller classes do not inherit permission from the allowed type pair.
- Production dependencies against the actual compiled test-class inventory, including fixture types outside the production namespace; a test-class naming convention is not the guard.
- Repository/entity dependencies on HTTP/controller, servlet and security-configuration types. Role detection uses JPA annotations, Spring Data ancestry and the documented repository/controller/configuration naming conventions; unfamiliar role designs still require review.

`ArchitectureRuleProofTests` applies the same rules to explicit positive and violation graphs under the neutral test-only `backend/src/test/java/architecturefixtures/` namespace. These prove generic-only leaks, reverse edges, undeclared helpers, bootstrap bypasses, production-to-test dependencies, persistence-to-transport dependencies, forbidden authentication writes/references, shared-error Interface bypasses, direct/indirect feature cycles across nested packages and generic signatures, accepted acyclic/intra-feature graphs, and empty-input rejection. Fixtures are never part of the production import.

From `backend/`, run `./gradlew --no-daemon --console=plain test --tests '*.architecture.*'` for focused changes. The ordinary `test` task also runs both suites, and the existing `ciTestInventory`/shard runner discovers their normal JUnit methods automatically. Architecture tests need no application/database startup; the complete backend integration suite still needs Docker as documented in the workspace README.

Human review remains responsible for business purpose, the meaning of DTO/mapper ownership, direct framework I/O such as `EntityManager`/JDBC, aliased or indirect data flows, and collaborations hidden behind reflection or bean-name lookup. These rules constrain declared type/member dependencies; they do not prove globally read-only behavior or complete request authority. A passing bytecode check does not approve those designs. For an approved contract change, update this article in both languages, the corresponding rule and its positive/violation proofs together.

## Keep the transport contract distinct from stored state

The installed `AuthController` maps `/auth` beneath the `/api` servlet context. It accepts a validated `LoginRequest` and returns purpose-built `CsrfResponse` or `SessionUser` records. It never returns the persistent `AppUser` entity. That distinction matters because the entity carries a password hash and persistence concerns, while the session response exposes only `id`, `displayName` and `email`.

`AppUserRepository` extends `JpaRepository<AppUser, UUID>` and adds `findByUsername`. `AppUser` generates its UUID in the application constructor and keeps a protected no-argument constructor for JPA. These are concrete installed contracts, not a universal base entity or generic controller hierarchy.

| Role                | Placement and ownership                                                                                                                                                                                                                 | Responsibility limit                                                                                                                                              |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HTTP controller     | Feature-local `<Capability>Controller`; owns URL mapping, request validation, status and transport responses.                                                                                                                           | Reusable domain policy belongs to the application action rather than endpoint branches.                                                                           |
| Application service | Feature-local `<Capability>Service` or a named action service when the feature has that behavior; owns current actor, authority, business invariants and the complete transaction.                                                      | It is not the owner of cookie handling or raw servlet responses. The starter has no general business-service layer to extend.                                     |
| Repository          | Feature-local `<Entity>Repository`; owns persistence queries, locks and storage access.                                                                                                                                                 | Finding an entity does not itself authorize its use.                                                                                                              |
| Entity              | The owning feature's JPA type, such as `AppUser`; owns persistent identity, mapped state and entity-level behavior.                                                                                                                     | It is not the public request/response contract and must not expose stored secrets through JSON.                                                                   |
| DTO                 | Purpose-specific request/response record owned by the feature; keep a record nested in its controller when only that transport uses it, as in `AuthController`, or use a feature-local file when shared within the feature.             | Define writable input and public output deliberately; entity fields are not an automatic DTO schema.                                                              |
| Mapper              | An explicit projection at the feature's response boundary; keep simple record construction inline, as in `AuthController.session`. Extract a feature-local `<Capability>Mapper` only when real mapping complexity or reuse warrants it. | Convert already selected data; mapping does not own database reads, authorization or business mutations. No mapper framework or generic mapper base is installed. |

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
