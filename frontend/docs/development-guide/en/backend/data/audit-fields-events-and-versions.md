# Audit fields, events and immutable versions answer different questions

**Support status: installed current-row timestamps with external actor/history reference recipes.** BaseEntity supplies server-owned dates and optimistic version; LMS replacement history and Discovery transactional events/immutable versions remain separate designs, not a generic installed history framework.

Use this pattern when “who changed it?” expands into “what happened?”, “which exact content was approved?” or “can the previous state be reconstructed?” Adding four timestamps to the current row does not answer all of those questions, and retaining every request is not a safe substitute for a history design.

## Installed current-row metadata

[BaseEntity](jpa-entities-and-relationships.md) now installs createdAt/updatedAt Instant timestamps through Spring Data auditing and the shared UTC Clock, plus provider-owned optimistic version. Soft deletedAt uses that same Clock. These fields are not writable in Request DTOs. This adds neither createdBy/updatedBy nor actor history, immutable versions or events; the LMS/Discovery references below retain their distinct provenance.

## Select the evidence before the storage shape

| Mechanism               | Answers                                                    | Does not prove by itself                                |
| ----------------------- | ---------------------------------------------------------- | ------------------------------------------------------- |
| Created/modified fields | Who created or last changed the current row, and when      | Every intermediate action or exact earlier payload      |
| Audit event             | Which named action occurred, by whom, against which target | Full reconstructable state or immutable document bytes  |
| Retained version        | Which exact version payload existed                        | The authority or business meaning of a later transition |
| Transition record       | Which lifecycle decision applied to a retained version     | That every external effect was delivered                |

The mechanisms can coexist. A small CRUD preference may need only last-modified information. A reviewed artifact can need a retained payload and approval transition. None of these requirements automatically demands event sourcing for the entire application.

## Audit fields need an actor and lifecycle owner

LMS `AuditableEntity` supplies created/modified dates and principals through `AuditingEntityListener`. Its application enables JPA auditing with a named date-time provider, and `AuditorAwareImpl` resolves a principal from Security context. That is a concrete configured system, not behavior achieved by copying field annotations alone.

A consumer must define its actor representation, time source, anonymous/system-job policy and read permissions. A human display name can change or be nonunique; choose whether stable account identity, a retained display label or both are required. The LMS source uses its own principal conventions; do not copy them into the starter without adapting the account model. Audit fields are server-owned and must not be accepted from a write DTO.

## Append business events with the mutation

Discovery's `audit` inserts target, actor, action, occurrence time and JSON detail. Calls within transactional services commit with the business change. The file-upload action records bounded metadata such as file identity and byte length rather than duplicating the private file content. Event reads have their own projection; retaining detail does not mean every audience should receive all of it.

**Recipe pseudocode** below requires a consumer-owned current actor, transactional repositories, audit schema, permitted metadata encoder and HTTP contract. None of its collaborators is a starter import.

```java
@Transactional
public RecordView rename(UUID id, Rename command, Authentication auth) {
    var actor = actors.requireCurrent(auth);
    var record = records.lockAuthorized(id, actor);
    record.rename(command.name());
    audit.append(new AuditEvent(actor.id(), id, "RECORD_RENAMED",
        clock.instant(), Map.of("field", "displayName")));
    return views.record(record, actor);
}
```

The deliberately minimal detail avoids recording the old/new text by default. If exact values are required, add an explicit allowlist, retention policy and authorized history projection; do not dump the request body. Decide whether an unchanged command creates an event. A log line is diagnostic output, not a replacement for the transactional audit row or proof that the transaction committed.

## Separate logical identity from version identity

LMS's version-update path copies the existing object, applies its patch, clears the physical row ID and creates a replacement row while retaining the stable logical UUID. Its history lookup orders versions and computes selected field changes, excluding audit/convenience noise. This is an application-level versioning convention. The inspected code is not proof that the database forbids every update to an old version.

Discovery's retained schema goes further: it separates version payloads from transitions, constrains version sequence/links, stores issued payload/digests and installs triggers rejecting UPDATE or DELETE on selected retained tables. The trigger function is defined in an earlier migration and reused by the later version tables. These database protections are source-specific; a consumer must implement its own retention, correction and deletion policy through new migrations.

An immutable version should keep the exact payload its downstream approval/export references. Recomputing an old document from today's template or mutable labels changes its meaning. A digest identifies bytes or a defined canonical payload; it does not prove who approved them or constitute a digital signature. Corrections should append a new version or transition under the domain's policy rather than silently rewrite retained history.

## Failure and recovery

If audit storage is mandatory and fails, roll back the mutation. If an immutable-table trigger rejects an accidental cleanup or cascade, repair the application's lifecycle operation rather than disabling history protection. Administrative retention or erasure work needs its separately reviewed data policy; immutability in this design is not a universal legal retention decision.

Avoid conflating “saved”, “flushed”, “committed” and “delivered.” Database history can prove a committed intent while an outbound notification remains uncertain. A retained payload can be exact while its current visibility is revoked. Design projections and external-operation evidence independently from the history store.

## Acceptance cases to carry into an implementation

- Server-derived actor/time fields cannot be overwritten by client DTO values.
- A rolled-back business action leaves no committed success audit event when they share the contract.
- History endpoints apply current authority and redact fields according to their audience.
- A new version has a distinct physical identity and retains the intended logical relationship.
- Earlier retained payloads remain unchanged after later edits, template updates and transitions.
- Database immutable protections reject accidental rewrite/delete, and corrections use the reviewed append path.
- Event detail excludes credentials and unrestricted payload dumps; required sensitive evidence has explicit access/retention ownership.

## Exact source references

- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/base/AuditableEntity.java` — JPA audit fields/listener.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/base/AuditorAwareImpl.java` and `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/LmsBackApplication.java` — actor resolution and enabled auditing.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/vessel/VesselService.java` — replacement version and chronological field-diff comparison.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/DiscoveryService.java` — transactional audit insertion and history projection.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectFilesService.java` — bounded upload event metadata.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/resources/db/migration/V8__project_lifecycle.sql` and `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/resources/db/migration/V10__specification_development.sql` — immutable trigger function, retained versions and transitions.
