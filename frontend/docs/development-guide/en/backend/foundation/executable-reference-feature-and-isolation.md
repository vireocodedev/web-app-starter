# Executable reference feature and isolation

**Support status: installed foundation and test-only executable reference.**

The executable Contacts example is test-only. Use it to learn the installed CRUD foundation without shipping demonstration business functionality into a consumer.

## Read the actual feature

[Reference sources](../../../../../../backend/src/test/java/referencefixtures/contacts/ContactService.java) live under neutral `referencefixtures.contacts`; ContactGroup is actor-owned and HARD, Contact belongs to that group and is SOFT. The group stays in the path, and ordinary PUT cannot move a contact. Responses include group id/name so fetch behavior is observable. Controllers derive a synthetic actor key from the authenticated principal; service queries enforce it on detail/list/count/mutation. Foreign identifiers return 404. This fixture policy is not a universal tenant/admin model or live-account-revocation policy.

[ReferenceFeatureConfiguration](../../../../../../backend/src/test/java/referencefixtures/config/ReferenceFeatureConfiguration.java) explicitly imports test controllers/services. The host context under the application's test package also registers fixture JPA entities/repositories while preserving production auth/user scans. Neutral packages remain outside normal component/JPA discovery. Ordinary application mappings, OpenAPI, entity metadata, schema and Boot JAR must contain no reference feature.

## Keep schema evidence explicit

The test-only repeatable migration is `backend/src/test/resources/reference-feature/db/migration/R__template_reference_schema.sql`, enabled only by the explicit reference context alongside production migrations. Table/index/constraint names use `template_reference_`; this avoids taking a future consumer's V3 number. It is an idempotent test bootstrap, not a claim about production upgrade history.

Hibernate schema validation checks columns/types, not every unique or foreign key. Explicit PostgreSQL catalog assertions verify required uniqueness and the exact FK relationship; negative drift tests remove uniqueness or replace/remove the FK and require rejection. `CREATE TABLE IF NOT EXISTS` must not quietly accept incompatible existing constraints. Never modify applied production migration bytes to make this reference work.

## Run and review at the owning boundary

Use the workspace backend verification command (`./gradlew --no-daemon --console=plain test bootJar` from backend), under the repository's sequential resource policy. Focused reference tests provide real PostgreSQL/HTTP, audit/version, rollback, concurrency, active visibility, full-page query budget and OpenAPI evidence. Architecture rules explicitly evaluate the reference graph while the complete production inventory stays main-only. Boot JAR assertions independently check packaging.

Consumer personalization rewrites only approved CRUD and `http.PageResponse` imports inside this neutral fixture tree; packages/comments/literals and unrelated fixtures stay neutral. The initialization runbook owns exact preflight/resume/audit behavior. A personalized consumer compile/test is required; text replacement assertions alone do not prove the example still works. Record actual checks separately from documented acceptance, including semantic review of authority/invariants/native SQL.

## Exact source references

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/build.gradle` — Baseline JPA/build dependency provenance; current implementation links above describe the working tree.
