# JPA entities and relationships

**Support status: installed foundation and test-only executable reference.**

Use this installed metadata foundation for new business entities. Existing `AppUser` deliberately retains its schema and authentication role; it does not acquire new columns or inheritance.

## Define controlled state

Extend [BaseEntity](../../../../../../backend/src/main/java/com/vireocode/backend/crud/BaseEntity.java): backend-assigned UUID, `Instant createdAt`, `Instant updatedAt` and nullable `@Version Long`. The initial null version lets Spring Data recognize a new entity despite the assigned UUID. Keep a protected JPA no-argument constructor, private fields, no public metadata setters and named domain mutation methods. Do not use a persistence entity as a transport DTO or generate equality from mutable fields/relationships.

Base equality compares persistent entity class and UUID, including Hibernate proxy identifiers without initialization. Its class-based hash stays stable across persist/update. [CrudConfiguration](../../../../../../backend/src/main/java/com/vireocode/backend/crud/CrudConfiguration.java) supplies UTC Clock and the matching Spring Data auditing DateTimeProvider. Tests can supply a controlled Clock; soft deletion uses the same time source. These are current-row dates, not actor audit or reconstructable history; see [audit ownership](audit-fields-events-and-versions.md).

## Model a relationship deliberately

Declare cardinality, nullability and lazy loading explicitly. [Contact](../../../../../../backend/src/test/java/referencefixtures/contacts/Contact.java) has a required LAZY many-to-one ContactGroup; the response includes group id/name, loaded through a deliberate repository fetch plan inside the service transaction. Avoid speculative bidirectional collections, broad cascades and automatic orphan removal.

Flyway owns actual tables, indexes, unique keys and foreign keys. Entity annotations and Hibernate validation do not prove those constraints exist. Scope consistency and authority are separate obligations; a valid foreign key never authorizes the actor. Keep normal entity writes and parent deletion in the same [lock protocol](revision-conflicts-and-shared-locks.md).

Flush before response construction so generated version/audit values match persistence. A no-op PUT needs explicit optimistic verification because dirty checking may emit no UPDATE; see [revision conflicts](revision-conflicts-and-shared-locks.md). OSIV stays false. Verify metadata lifecycle, lazy projection, proxy/hash behavior and rollback against PostgreSQL; a unit reflection assertion alone does not prove JPA behavior.

## Owning and inverse sides

The side with `@JoinColumn` owns the foreign key; changing only the inverse collection does not persist that relationship. If a real feature needs a bidirectional association, use `@OneToMany(mappedBy = "group")` on the inverse collection to name the child's owning Java property. A feature-local add/remove method must synchronize both sides in memory. This is a mapping recipe, not an installed ContactGroup collection: the reference deliberately keeps its required, unidirectional `Contact.group` relationship.

Choose cascade operations individually. `PERSIST`/`MERGE` propagate the corresponding lifecycle operation; `REMOVE` propagates physical removal. `orphanRemoval = true` deletes a child when it leaves the managed relationship and is appropriate only when the parent exclusively owns that child's lifecycle. It is not a soft-delete implementation. Do not apply `ALL`, REMOVE or orphan removal to shared children or to bypass the reference's retained-child deletion guard. A required association cannot be detached by setting its owning side to null; use the approved child-delete action or a separately specified move action. Test both the in-memory graph and flushed FK state when adding a bidirectional model.

## Managed writes, bulk DML and callbacks

Use managed entity mutation for ordinary versioned writes. JPQL/native bulk DML bypasses entity dirty checking, lifecycle callbacks and Spring Data auditing, and does not synchronize already-loaded objects or automatically apply optimistic version checks. Native SQL also bypasses the ORM active-row restriction. A justified bulk operation must explicitly define scope/active predicates, expected-version matching and increment, audit values and affected-row validation. Flush pending changes first, then deliberately refresh or evict the affected managed state at an owned boundary; never add a global `EntityManager.clear()` shortcut that discards unrelated work. Test rollback and subsequent reads in the same context. Hibernate-specific versioned bulk syntax is not portable JPA.

Entity lifecycle callbacks/listeners may maintain local metadata, such as the installed auditing listener. Do not use them for queries, authorization, external I/O, notifications or multi-entity business flow. Callback execution is not proof of commit and bulk operations can skip it. The public service transaction owns business invariants; post-commit effects follow the [commit-aware notification contract](../application-services/commit-aware-notifications.md).

## Exact source references

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/build.gradle` — Baseline JPA/build dependency provenance; current implementation links above describe the working tree.
