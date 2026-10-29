# Configurable hard and soft deletion

**Support status: installed foundation and test-only executable reference.**

Choose deletion once in the concrete service constructor: HARD is the default; SOFT requires [SoftDeletableEntity](../../../../../../backend/src/main/java/com/vireocode/backend/crud/SoftDeletableEntity.java) and invalid capability fails at construction. This is immutable service policy, never a request flag.

## Define retained-row visibility

SOFT sets server-owned `deletedAt` on a managed entity using the shared Clock. Ordinary flush updates audit/version. Each concrete retained entity declares and tests `@SQLRestriction("deleted_at is null")`; do not assume superclass annotation propagation. Do not combine this with Hibernate `@SoftDelete`, which intercepts remove and would prevent the same mapped entity's ordinary HARD service behavior.

[Contact](../../../../../../backend/src/test/java/referencefixtures/contacts/Contact.java) is SOFT; [ContactGroupService](../../../../../../backend/src/test/java/referencefixtures/contacts/ContactGroupService.java) is HARD. HARD can physically remove a soft-capable entity under a separately chosen service policy. Protected `deleteManaged` requires an actual writable transaction, but concrete services still own authority, expected version, invariants, locks and flush.

Normal detail/list/count/search/selection and related projections exclude deleted rows. Missing/deleted/foreign scope and repeated delete return 404 RESOURCE_NOT_FOUND. ORM SQL restrictions do not remove an already-managed entity from the same persistence context; owned lookups/projections check state rather than clearing the entire EntityManager. Native SQL states active/scope conditions explicitly.

## Protect keys and relationships

Soft deletion reserves unique keys by default: `(group_id, code)` stays unique across active and retained contacts. An active-only partial index requires an explicit feature policy; never silently recycle a key. Restore, purge and include-deleted APIs are outside this foundation.

Active children block parent deletion. Retained soft children may also block a HARD parent through its foreign key; return safe 409 RESOURCE_IN_USE, without cascade/detach surprises. Child create/update/delete and parent delete acquire the same parent lock before checking or changing dependents. Multiple parents require canonical lock order. A cascade is a separately reviewed business lifecycle decision.

Only the exact known contact unique constraint maps duplicate POST/PUT, including concurrent insert, to 409 REQUEST_REJECTED. Translation runs after the service proxy returns or fails so rollback is complete; unrelated integrity failures remain 500. See [error ownership](../foundation/validation-and-error-contracts.md). Verify physical retained/removed rows, fresh and cached visibility, version/audit, key reservation and child-create/parent-delete races against PostgreSQL.

## Exact source references

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/build.gradle` — Baseline JPA/build dependency provenance; current implementation links above describe the working tree.
