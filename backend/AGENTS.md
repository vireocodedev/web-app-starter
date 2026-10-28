# Backend agent router

Follow [root policy](../AGENTS.md) and the
[task-scoped guide workflow](../frontend/docs/development-guide/README.md#mandatory-agent-workflow).
Select all affected concerns with `guide:index -- route <keys...>` through the
root Node launcher. Read full selected contracts and current examples before
planning their implementation; frontend tutorials load only for browser concerns.

| Before this work                                                         | Required contract / route                                                                                                                                           |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Java changes, new feature files, dependencies or import/interface review | [Package/interface ownership](../frontend/docs/development-guide/en/backend/foundation/http-service-persistence-boundaries.md), `backend`                           |
| HTTP endpoint/DTO, validation/errors or API evolution                    | `endpoint`; transport/error and compatibility contracts, plus the owning service/authority articles                                                                 |
| Configuration or profiles                                                | [Runtime/configuration](../frontend/docs/development-guide/en/backend/foundation/runtime-and-configuration.md)                                                      |
| Authentication, session or CSRF                                          | `session`; [session lifecycle](../frontend/docs/development-guide/en/backend/security/session-and-csrf-lifecycle.md) and current auth adapters                      |
| Local seeding or deployed identity provisioning                          | [Account provisioning](../frontend/docs/development-guide/en/backend/security/account-provisioning.md)                                                              |
| Persistence, Flyway, constraints or concurrent writes                    | `migration`; [schema ownership](../frontend/docs/development-guide/en/backend/data/flyway-and-schema-ownership.md) and affected transaction/query/locking contracts |

The package article owns feature placement, role naming, published interfaces and
the exact authentication lookup exception. Apply it to signatures and inferred
types, not just Java visibility. Approved collaboration changes must update the
corresponding ArchUnit rule and positive/violation fixtures together; distinguish
bytecode enforcement from required semantic review. Preserve applied migration
bytes and existing data.

Services, queries, integrations, files, lifecycle, telemetry, temporal values and
cross-stack contracts have task-specific articles: discover all applicable ones
with `route --list backend`, topic/article keys and full-text search; follow
indirect dependencies and negative paths. Use the [workspace README](../README.md#local-development)
for setup and [verification](../README.md#verification) for backend checks. Keep
secrets out of source and shared evidence.
