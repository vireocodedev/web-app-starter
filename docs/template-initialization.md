# Initialize a project from this template

Follow this runbook when a user asks to personalize a freshly cloned GitHub
template consumer. Make scoped edits directly; this workflow needs no renaming
script, generator, new dependencies, or runtime identity configuration.

Initialization covers project naming and local development. Container publishing,
GitHub settings, staging/production configuration, and deployment are separate
tasks requiring their own instructions and authorization.

## 1. Confirm the target and identity

Read the root and scoped agent guides. Inspect the actual files listed below,
the working tree, and the consumer's Git remote. GitHub copies template files
unchanged; the new repository name is only a suggested slug, not approval to
rename the project. If Git metadata is absent, ask for the intended repository.
Preserve unrelated local changes.

Obtain these values from the request, asking for missing inputs one at a time:

| Input             | Example              | Rule                                                                                                                                                                                          |
| ----------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project slug      | `inventory-portal`   | Lowercase ASCII letters/digits separated by single hyphens; start with a letter; at most 50 characters.                                                                                       |
| Display name      | `Inventory Portal`   | Nonempty human-readable product name. Keep it the same across locales unless localized names are supplied.                                                                                    |
| Java base package | `com.acme.inventory` | Explicit dotted namespace of lowercase ASCII Java identifiers; each segment starts with a letter; exclude Java keywords. This is the application's package, not just its organization prefix. |
| PWA short name    | `Inventory`          | Use the display name if it is at most 12 characters; otherwise obtain an approved short name.                                                                                                 |

Derive these values consistently:

| Setting                                    | Derivation                                  | Example                                 |
| ------------------------------------------ | ------------------------------------------- | --------------------------------------- |
| Frontend package                           | `<slug>-frontend`                           | `inventory-portal-frontend`             |
| Gradle root project and Spring application | `<slug>-backend`                            | `inventory-portal-backend`              |
| Gradle group                               | Java base package                           | `com.acme.inventory`                    |
| Local Compose project                      | `<slug>-local`                              | `inventory-portal-local`                |
| Default local database and database user   | Slug with hyphens replaced by underscores   | `inventory_portal`                      |
| Java source directory suffix               | Java base package with dots replaced by `/` | `com/acme/inventory`                    |
| Java main class                            | `<java-base-package>.BackendApplication`    | `com.acme.inventory.BackendApplication` |

Escape supplied display names for each destination's JSON, HTML, TypeScript,
Groovy, or Markdown syntax rather than interpolating unescaped text.

**Done when:** the user has supplied or confirmed the identity and the target is
the consumer checkout, not the shared template repository.

## 2. Establish the data and resume boundary

Check whether the consumer already has an identity recorded in its README or
configured in the application. If requested values already match, verify them
instead of rewriting. For an incomplete initialization with that same identity,
finish only the missing changes. A different existing consumer identity is a
later rename: pause for a separately approved scope.

Check for existing local environment files and Docker resources using names and
labels, without printing environment values. Changing the Compose project name
changes its generated volume/network names; it does not rename or migrate a
database. New database/user settings also do not change an initialized PostgreSQL
volume.

For a fresh clone, update the committed environment example before generating
local credentials or starting PostgreSQL. If a local database or an existing
environment file uses the old identity, explain the mismatch and obtain a
decision before changing that identity or starting a different database. Preserve
existing passwords, volumes, and data. Data migration, volume deletion, and
password resets are outside this runbook.

**Done when:** initialization can proceed without replacing an existing identity
or hiding an existing database behind newly generated resource names.

## 3. Replace application-owned values

The following is the current replacement map. Read each field before editing;
if the layout differs, locate its owner and report the difference. Use exact
fields and package-prefix changes, not a global replacement of `RGO`, `backend`,
or `vireocode`.

### Backend and local infrastructure

Paths in this table are relative to the workspace root.

| File or surface                                                                                                                                                     | Template value                                                                | Consumer change                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [backend/settings.gradle](../backend/settings.gradle)                                                                                                               | `rootProject.name = 'backend'`                                                | Set `<slug>-backend`. Keep the physical `backend/` folder.                                                                                                                                                                                     |
| [backend/build.gradle](../backend/build.gradle)                                                                                                                     | `group = 'com.vireocode'`; description `VireoCode Web App Starter backend`    | Set group to the approved Java base package and description to `<display name> backend`. Preserve versions, plugins, and dependencies.                                                                                                         |
| [backend/src/main/resources/application.yaml](../backend/src/main/resources/application.yaml)                                                                       | `spring.application.name: vireocode-backend`                                  | Set `<slug>-backend`. Preserve `/api`, profiles, datasource placeholders, session/security settings, and Hibernate validation.                                                                                                                 |
| [backend/compose.yaml](../backend/compose.yaml)                                                                                                                     | `name: vireocode-web-app-starter-local`                                       | Set `<slug>-local`. Keep the `postgres` service and `postgres-data` volume key; Compose scopes their resources by project.                                                                                                                     |
| [backend/.env.example](../backend/.env.example)                                                                                                                     | `POSTGRES_DB=vireocode`; `POSTGRES_USER=vireocode`                            | Set both to the underscore-form slug. Keep passwords empty and retain the initial-user defaults unless the user requests different local account details.                                                                                      |
| [backend/src/main/java/](../backend/src/main/java/) and [backend/src/test/java/](../backend/src/test/java/), each with the template suffix `com/vireocode/backend/` | Package prefix `com.vireocode.backend`                                        | Move all owned Java files into the approved package's directory under each source root; update package declarations, imports, and qualified references. Retain relative `auth` and `user` subpackages and the `BackendApplication` class name. |
| [`.vscode/launch.json`](../.vscode/launch.json)                                                                                                                     | `mainClass: com.vireocode.backend.BackendApplication`; `projectName: backend` | Set the qualified main class and the new Gradle root project name. Preserve both runnable configurations, task references, working directories, and `local` profile.                                                                           |

Keep the physical `frontend/` and `backend/` folders, Flyway migration filenames
and SQL schema, database table names, and authentication endpoint/DTO contracts
unchanged. Delete only empty old Java package directories after all their owned
files have moved.

Preserve local ports unless there is a confirmed collision. If a port change is
needed, keep its launch/task/proxy and documented references consistent.

### Frontend identity

| File or surface                                                                                                                                                                                                                                                                                                                                                                | Template value                                                         | Consumer change                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [frontend/package.json](../frontend/package.json)                                                                                                                                                                                                                                                                                                                              | `name: rgo-frontend-template`                                          | Set `<slug>-frontend`; retain dependency names and versions.                                                                                                                                 |
| [frontend/package-lock.json](../frontend/package-lock.json)                                                                                                                                                                                                                                                                                                                    | Top-level `name` and `packages[""].name` are `rgo-frontend-template`   | Align both with the frontend package name. Keep the dependency graph and integrity data unchanged; if using npm to refresh the lockfile, inspect and discard unrelated task-generated churn. |
| [frontend/index.html](../frontend/index.html)                                                                                                                                                                                                                                                                                                                                  | `<title>RGO application</title>`                                       | Set the display name; retain the app entry point and asset references.                                                                                                                       |
| [frontend/public/manifest.json](../frontend/public/manifest.json)                                                                                                                                                                                                                                                                                                              | `name: RGO application`; `short_name: RGO`                             | Set the display and approved short names. Preserve `id`, `start_url`, `scope`, and icon entries; naming is not a routing change.                                                             |
| [translation.en.ts](../frontend/src/app/localization/translations/translation.en.ts), [translation.hr.ts](../frontend/src/app/localization/translations/translation.hr.ts), [development-guide.en.ts](../frontend/src/app/localization/translations/development-guide.en.ts), [development-guide.hr.ts](../frontend/src/app/localization/translations/development-guide.hr.ts) | `navigation.shellTitle` contains `RGO application` or `RGO aplikacija` | Set the approved display name in all four catalogs. Keep translation keys and localized page labels.                                                                                         |

### Brand assets

The header's `Brand` in
[AppShell.tsx](../frontend/src/app/shell/components/AppShell.tsx) uses `alt="RGO"`
and the bundled RGO symbol assets. The favicon and PWA icons also contain template
branding. A new display name alone does not provide new artwork.

If replacement artwork is supplied, update its accessible name, header symbols,
favicon, and both installed-app icons together, retaining light/dark readability
and valid asset references. If it is not supplied, retain the existing artwork
and its accurate alternative text and report branding as deferred. Preserve
framework attribution and license notices in either case.

### Tests and documentation

Update only identity-dependent expectations in:

- [AppAuthFlow.test.tsx](../frontend/tests/integration/auth/components/AppAuthFlow.test.tsx):
  document-title suffix.
- [application.spec.ts](../frontend/tests/browser/application.spec.ts):
  document-title suffix.
- [documentation.development.spec.ts](../frontend/tests/browser/documentation.development.spec.ts):
  English and Croatian document-title suffixes; retain localized page titles.

Search the remaining owned tests for additional identity-dependent expectations.
Keep mock identities and demo credentials unchanged: they are authentication
fixtures, not project branding.

Update the [root README](../README.md) title and introduction for the consumer.
Add a compact **Project identity** section recording the approved slug, display
name, Java base package, and PWA short name. Update the
[frontend README](../frontend/README.md) application heading and any
consumer-specific build/JAR examples to match the new Gradle artifact name.
Keep working setup and verification instructions and retain a link to this
runbook. This runbook's template values and example consumer remain reference
material; they are not leftovers to replace.

**Done when:** every mapped surface matches the approved identity or has a
specifically reported deferral, and source directories, Java declarations,
Gradle identity, launch configuration, and tests agree.

## 4. Verify the consumer

Use existing tooling and the repository's configured checks. Run commands from
the indicated directories; Docker must be available for backend tests.

From `backend/`:

```sh
./gradlew test bootJar
```

From `frontend/`:

```sh
npm run verify
npm run test:browser -- tests/browser/application.spec.ts --grep 'supports keyboard navigation|offers the account menu' --reporter=list
npm run test:browser:development -- tests/browser/documentation.development.spec.ts --reporter=list
```

Restore dependencies only when a chosen check reports them missing. Use `npm ci`
for the existing lockfile; keep dependency upgrades outside initialization.

Search tracked/owned application files for the old Java package, package name,
Spring/Compose names, and application-title strings. Exclude dependencies,
generated build/test output, environment secrets, and Git internals. Classify
every residual match: retained runbook examples, framework references,
attribution, mock fixtures, or deferred artwork are legitimate. Unexplained
application-identity leftovers are incomplete work.

Validate that the Java launch configuration points to the new main class and
Gradle project; keep the frontend launch configuration usable. With VS Code Java
tools available, launch through them after project import. If they are unavailable,
report the IDE launch check as unverified rather than claiming JSON inspection
proves it.

For a fresh local setup, follow the root README's existing credential/database
steps. The local credential helper is unrelated to renaming and stays unchanged.
Check that the frontend runs in HTTP mode against `/api`; an existing
`.env.local` may still select mocks. Exercise initial login, refresh, and logout
through the real backend, and confirm the visible document/installed-app names.
Handle credentials through local files or secret interfaces, not committed
documents or the final report. Stop only processes started for verification and
retain the local database volume.

**Done when:** builds/tests pass, the replacement audit has no unexplained
leftovers, and local runtime/IDE results are recorded. Missing prerequisites or
failed checks are explicit blockers, not successful verification.

## 5. Report the result

Return the approved identity, changed surfaces, commands and outcomes, and any
blocked checks or deferred artwork. Point to local setup instructions without
revealing credentials. Leave changes uncommitted unless a commit is requested;
remote publication and deployment are separate work.

**Done when:** the consumer can distinguish completed personalization, verified
behavior, and remaining work without relying on a generic "setup complete" claim.
