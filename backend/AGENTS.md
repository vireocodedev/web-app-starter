# Backend agent guide

For every task, follow the root
[mandatory development-guide workflow](../AGENTS.md#mandatory-development-guide-workflow),
including its pattern-reuse and approval gate.

Before creating source, follow the mandatory
[Generator-first workflow](../docs/generators.md#generator-first-agent-policy),
including compatibility evaluation and meaningful composite generation.

Before changing Java code, placing new feature files or adding a dependency, read
[package organization, ownership and dependency directions](../frontend/docs/development-guide/en/backend/foundation/http-service-persistence-boundaries.md).
That article owns feature-package placement, role naming, the current class map,
published feature interfaces and the exact authentication lookup exception.
Use its dependency contract when reviewing imports, method signatures and
inferred types; Java visibility alone does not publish a feature interface.
When an approved collaboration changes that contract, update the corresponding
ArchUnit rule and its accepted/violation fixtures together. Use the guide's
automated-check section to distinguish enforced bytecode rules from review duties.

For configuration or profiles, read
[runtime and configuration ownership](../frontend/docs/development-guide/en/backend/foundation/runtime-and-configuration.md).
For authentication changes, read
[session and CSRF lifecycle](../frontend/docs/development-guide/en/backend/security/session-and-csrf-lifecycle.md);
for local seeding or deployed account provisioning, read
[account provisioning](../frontend/docs/development-guide/en/backend/security/account-provisioning.md).
For persistence changes, read
[Flyway and schema ownership](../frontend/docs/development-guide/en/backend/data/flyway-and-schema-ownership.md)
and the applicable transaction/query patterns found through the live guide index.

Use the [workspace README](../README.md#local-development) for local setup and
its [verification instructions](../README.md#verification) for backend checks.
