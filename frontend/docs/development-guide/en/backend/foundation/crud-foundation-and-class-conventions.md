# CRUD foundation and class conventions

**Support status: installed foundation and test-only executable reference.**

Use this installed foundation when adding a business feature. Keep the feature flat until real size justifies internal subpackages. The [package contract](http-service-persistence-boundaries.md) owns placement and published dependencies; this article owns the small reusable service mechanics.

## Start with one explicit action

Use a concrete `<Resource>Service`, constructor injection and final collaborators. Introduce an interface only for a real boundary or multiple implementations. Controllers own HTTP and validation, services own authority/business rules/transactions, repositories own persistence and entities own controlled state changes. Keep simple response record construction inside the transaction; extract a feature-local mapper only for actual complexity or reuse.

Use one Java record `<Resource>Request` for POST and full PUT, with the same writable fields and constraints, plus a separate `<Resource>Response`. Optional nullable values are cleared by null on PUT; this is full replacement. Identity, scope, version, timestamps and related labels are response/server-owned. Named action DTOs remain appropriate; login/CSRF records retain their existing contracts. PATCH requires a separately approved presence protocol.

The actual [ContactRequest](../../../../../../backend/src/test/java/referencefixtures/contacts/ContactRequest.java) is shared by POST and PUT. The concrete [ContactService.update](../../../../../../backend/src/test/java/referencefixtures/contacts/ContactService.java) follows this order inside its public transaction:

```text
lock owned parent -> scoped active contact -> compare expected version
-> OPTIMISTIC verification -> replace all writable fields
-> flush -> response projection -> proxy commit -> HTTP success
```

## Extend only the mechanics you need

[BaseService](../../../../../../backend/src/main/java/com/vireocode/backend/crud/BaseService.java) accepts `(Class<E>, JpaRepository<E, UUID>, DeleteMode, Clock)`; the overload without `DeleteMode` defaults to HARD. Protected final helpers are:

- `requireActive(scopedLookup)` hides absent and already-managed soft-deleted results.
- `requireExpectedVersion(entity, expectedVersion)` rejects stale versions without rewriting intent.
- `deleteManaged(entity, expectedVersion)` checks an actual writable Spring transaction, active state and version, then removes or marks the entity using the injected clock.

There is no public generic create/update/delete API and no EntityManager in the base. A concrete public, nonfinal `@Transactional` method resolves trusted actor and scope, acquires the shared parent lock, checks domain invariants, calls helpers and flushes. Repository transactions alone do not make that entire action atomic. A final protected helper is not a Spring proxy entry point.

The [transaction contract](../application-services/transactional-commands.md) owns commit semantics; [deletion](../data/configurable-hard-and-soft-deletion.md) owns retained rows. Test direct service calls, rollback and stale/deleted outcomes as well as HTTP. [BaseServiceTests](../../../../../../backend/src/test/java/com/vireocode/backend/crud/BaseServiceTests.java) covers the helper boundary; the [executable reference](executable-reference-feature-and-isolation.md) supplies real PostgreSQL actions.

## Exact source references

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/build.gradle` — Baseline JPA/build dependency provenance; current implementation links above describe the working tree.
