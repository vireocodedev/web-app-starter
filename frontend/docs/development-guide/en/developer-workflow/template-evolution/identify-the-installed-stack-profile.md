# Identify the installed stack before applying a platform recipe

Determine which template, library and generator contracts the checkout actually contains. Similar product names, shared authorship or a newer reference repository do not establish API compatibility or an upgrade path.

**Installed RGO profile plus separate Vireo reference.** This starter's frontend declares exact `@rgo-web/frontend` 1.0.3. Its backend is the checked-in Spring Boot application. Vireo's ecosystem/projection contracts describe another product line and are reference material here, not an installed migration mechanism.

## Trigger, owner and invariant

Use before copying an example, upgrading a package, invoking a generator or interpreting a peer project's metadata. The application owner verifies manifests, imports, scripts and source instructions. Library/generator maintainers define their own admitted interfaces. A documentation comparison never authorizes modifying the peer repositories.

The invariant is source evidence before recipe selection. Identify the installed package coordinate and public surface, then use the matching owner guidance. Do not infer an installed command from a guide mentioning it.

## Inspect a small profile record

```text
application source: <repository and exact commit>
frontend dependency: <manifest coordinate and lock resolution>
backend contract: <build owner and actual dependencies>
public imports: <supported package entrypoints>
generation metadata: <present, absent or historical>
upgrade owner: <actual available procedure, or no declared path>
```

This is an inspection recipe, not a new metadata format. Read current files; an old receipt records origin, not necessarily today's dependencies or customized application code.

| Surface              | This starter                                                  | Vireo reference                                                |
| -------------------- | ------------------------------------------------------------- | -------------------------------------------------------------- |
| Frontend platform    | `@rgo-web/frontend` root API                                  | Multiple packages and admitted export subpaths.                |
| App structure        | `app`, `features`, thin `pages`, local shell/router contracts | Explicit Template projection and managed metadata.             |
| Backend              | Application-owned Java/Spring source                          | Declared Vireo JVM artifacts and compatibility sets.           |
| Generation/upgrades  | Use actual bundled workflow; no assumed Vireo CLI             | `create-vireo` metadata, release graph and guarded transforms. |
| Version relationship | RGO platform/initializer release synchronized upstream        | Vireo package versions can differ within a compatibility set.  |

The table is a comparison, not a proposal to replace the starter stack. A package name in a reference source is not an import already available to this app.

## Keep version identity precise

The installed manifest selects RGO 1.0.3; the lockfile establishes the resolved artifact. The RGO source snapshot defines a single ESM package-root API and peer ranges. An internal `@/` alias in that library is not a supported consumer entrypoint.

The Vireo ecosystem contract instead binds exact npm/Maven/Template coordinates into an admitted compatibility set. It explicitly does not require all packages to share one version. Its source labels the line public alpha; a generic “latest is stable” assumption would be inaccurate.

Toolchain declarations are another layer. Node/npm/Java targets belong to their actual application owners; a reference generator's command syntax or baseline does not supersede them.

## Apply only the matching recipe

Trace one real import or script from the app into the supported public contract. If a reference helper is absent, describe the adaptation seam instead of adding a fictional import. If migration is desired, make its compatibility, file ownership and acceptance scope explicit first.

The current frontend architecture uses its own route metadata, public feature indexes and source-owner rules. Vireo generated-code markers and projection categories can inspire a reviewed ownership design, but adding those files alone would not install the generator's upgrade guarantees.

## Failure and decision table

| Observation                                   | Decision                                                            |
| --------------------------------------------- | ------------------------------------------------------------------- |
| Example imports a different package family    | Treat it as a reference; map behavior to the installed public seam. |
| Version receipt disagrees with manifest/lock  | Reconcile actual installed state before upgrading.                  |
| CLI command is documented only in a peer repo | Do not execute it against this checkout as if supported.            |
| Similar folder names have different owners    | Follow current application instructions and trace callers.          |
| Newer upstream profile looks attractive       | Propose a bounded migration with evidence, not automatic adoption.  |

## Acceptance and inspection

A usable profile names actual coordinates, public imports, app ownership, metadata and available upgrade owner, including missing capabilities. Preserve peer provenance and application customizations.

Related articles explain application/library boundaries and packed artifacts. Reading this comparison performs no install, generation, upgrade or publication.

## Source provenance

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/package.json`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/package-lock.json`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:backend/build.gradle`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/AGENTS.md`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:README.md`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:package.json`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:docs/platform/PUBLIC_MODULE_CONTRACT.md`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:docs/ECOSYSTEM_CONTRACT.md`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:docs/APPLICATION_PROJECTION.md`
