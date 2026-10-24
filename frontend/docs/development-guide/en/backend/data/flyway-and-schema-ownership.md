# Flyway owns application and session schema

**Support status: installed migration ownership; reference recipe for new scoped domain tables.** The starter already uses Flyway for user and JDBC session tables and Hibernate for schema validation. It does not install the sample workspace schema below or a general tenant framework.

Use this pattern whenever a feature needs stored state, an entity change, a new constraint, or a session persistence upgrade. The migration and the code using it form one change. Schema evolution must explain both fresh installation and the next supported upgrade of an existing database.

## One owner performs DDL

The base configuration enables Flyway, sets Hibernate `ddl-auto: validate`, disables Open Session in View and sets JDBC session `initialize-schema: never`. Flyway performs DDL; Hibernate checks agreement; Spring Session uses its tables without creating another copy. Changing only an entity or enabling automatic DDL gives the generated app competing owners.

`V1__create_users.sql` creates `app_user` with a UUID primary key, unique non-null username, bounded hash/display/email columns and an enabled flag. The email column is not unique in that migration. An AI agent must not infer an email-login or unique-email policy that the schema does not implement.

`V2__create_sessions.sql` is application infrastructure, but it is still versioned schema. It defines `spring_session`, a unique session-ID index, expiry and principal indexes, plus `spring_session_attributes` with a composite primary key and a cascading foreign key to the session row. Deleting a session can therefore delete its attributes through the database relationship. A dependency upgrade that changes required session schema needs an explicit compatibility review, not an assumption that Spring will initialize it automatically.

## Add a migration, do not rewrite history

Once a version is applied outside a disposable isolated database, treat its contents as immutable. Add the next uniquely numbered migration for the change. Rewriting an old file changes the expected migration checksum and hides how existing databases reach the desired state. A copied example number must be replaced with the consumer's actual next version.

Review a migration with its corresponding entity/query change. Make nullability, uniqueness, foreign keys and indexes explicit. The service may validate early for a useful message, but the database is the last shared arbiter when requests race. A find-before-insert check cannot replace a unique constraint.

The following is **recipe SQL, not an installed migration**. It assumes a consumer has separately implemented a workspace lifecycle, account membership, authorized repositories, DTOs and deletion policy. PostgreSQL and Flyway are already dependencies; those application owners are not.

```sql
-- Example only; choose the actual next migration version in the consumer.
CREATE TABLE workspace_record (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspace(id),
    name VARCHAR(160) NOT NULL,
    revision BIGINT NOT NULL DEFAULT 0 CHECK (revision >= 0),
    UNIQUE (id, workspace_id)
);

CREATE TABLE record_note (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL,
    record_id UUID NOT NULL,
    body TEXT NOT NULL,
    FOREIGN KEY (record_id, workspace_id)
        REFERENCES workspace_record(id, workspace_id)
);
```

The composite relationship prevents a note claiming one workspace while referencing a record from another. Client Discovery uses this technique for version, grant and evidence relationships scoped to a project. It complements authorization; it does not make a caller entitled to read any row or remove the need for workspace-constrained queries.

## Index and lifecycle decisions accompany the table

A foreign key expresses a relationship, while an index supports a query pattern; do not treat the two as interchangeable. Define the important access path before adding speculative indexes. A list ordered by timestamp should state its stable identifier tie-breaker and evaluate a matching index. Session schema shows purposeful separate indexes for session identity, expiry cleanup and principal lookup.

Choose deletion behavior deliberately. Session attributes use cascade because their lifecycle is subordinate to the session. That does not establish a general rule to cascade every business relationship. Immutable history, audit obligations, retained artifacts and active work can require different policies. The Discovery reference contains immutable record and transition tables; those are domain decisions, not starter defaults.

For a populated database, a required field may need an expand/backfill/constrain sequence rather than a single assumption that every old row already has a valid value. The backend owner specifies meaning and compatibility; the deployment owner supplies the approved migration window, backup and recovery procedure. Avoid copying a large backfill into request-time startup without considering its lock and duration implications.

## Failure and recovery

If migration validation reports a checksum mismatch, first establish which file changed and what databases already applied it. Do not delete Flyway history, run repair blindly or edit production tables until the version story is understood. A repair changes metadata; it does not prove that real schema and intended schema agree.

If a migration fails because existing rows violate a new constraint, preserve the failure evidence without publishing data. Decide the domain's correction/backfill policy, then supply a reviewed path forward. Do not weaken the constraint merely to make startup green. Destructive recovery or backup restoration belongs to the operational runbook and explicit environment authority.

## Acceptance cases for a future implementation

Use these criteria to choose source checks and authorized implementation verification.

- A fresh supported PostgreSQL database applies the complete migration chain and passes Hibernate validation.
- An existing database upgrades through new versions without modifying already-applied migrations.
- Duplicate usernames fail at the database boundary; no unique-email rule is assumed without a migration.
- Session attributes cannot outlive their parent through the defined foreign key lifecycle.
- Cross-workspace child references fail even when both identifiers exist, while read/write queries still authorize the actor.
- A new required field has an explicit policy for old rows, including backfill and deployment compatibility where needed.
- Migration failures have a reviewed recovery path that preserves history and does not expose real records.

## Exact source references

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/application.yaml` — Flyway, Hibernate and JDBC session ownership.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/db/migration/V1__create_users.sql` — installed user constraints.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/db/migration/V2__create_sessions.sql` — installed session tables, indexes and cascade.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/user/AppUser.java` — entity/schema agreement.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/resources/db/migration/V10__specification_development.sql` — project-scoped composite foreign keys and immutable domain records.
