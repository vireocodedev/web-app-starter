# Distinguish published dependencies from local candidate overrides

Know whether a generated app is consuming the public release or a locally packed candidate. A workspace alias, symlink and installed tarball can expose different files even when the package name looks identical.

**RGO maintainer reference over the installed dependency boundary.** The starter normally consumes its exact published RGO dependency. The separate RGO source repository supplies local template-development and published-application verification helpers. Those maintainer scripts are not commands installed in this starter.

## Trigger, owner and invariant

Use when a library fix appears only in Storybook, a generated app uses stale code or a local preview changes package manifests unexpectedly. The library maintainer owns candidate build/pack. The application owns its declared dependency/lockfile. A preview override must not silently become a release declaration.

The invariant is explicit artifact identity and mode: public release proof consumes public coordinates, candidate proof consumes a known packed artifact, and source aliases remain development-only implementation detail.

## Compare the modes

| Mode                           | What it proves                                                | Main limitation                                          |
| ------------------------------ | ------------------------------------------------------------- | -------------------------------------------------------- |
| Library source/Storybook alias | Source behavior in the maintainer environment                 | Can hide missing exports/declarations/package files.     |
| Locally packed candidate       | Built tarball surface exercised by a consumer                 | Does not prove registry publication or anonymous access. |
| Published generated app        | Public initializer and exact installed platform work together | Still bounded by the verifier's actual scenarios.        |

The RGO template-development helper builds the platform, packs it and installs the tarball into `templates/application` without saving dependency/lockfile changes. It snapshots those protected files and restores changed bytes, reporting unexpected mutations. It supplies safe mock configuration in memory instead of rewriting a developer's env file.

A platform source edit requires rebuilding/repacking before the template sees it. Hot reload of template source alone does not refresh the installed library artifact.

## Keep the override visible

A neutral diagnostic record is:

```text
mode: <published-or-packed-candidate>
package: <name and exact version>
artifact: <registry integrity or candidate tarball identity>
manifest/lock: <unchanged or intentionally reviewed>
consumer: <isolated generated path>
proof: <actual type/runtime/build scenarios>
```

Do not label a local candidate “published” because its version string matches a released coordinate. Bytes and resolution path matter. Conversely, a current public app may not include an unbuilt workspace source fix.

The RGO published verifier creates a fresh application using the exact initializer version, installs locked dependencies, checks the installed platform version, then typechecks/builds. It uses fresh npm cache/config and sanitized environment. That is stronger publication evidence than a source alias, but it is not a full browser/business acceptance suite.

## Preserve the application's owner boundary

The starter's `package.json` and lockfile are application-owned source. A deliberate dependency upgrade updates and reviews them coherently. Temporary no-save candidate installation is a maintainer workflow with its own cleanup, not a general reason to commit `file:`/`link:` paths or workstation-specific absolute references.

The RGO package's internal `@/` alias is not consumer API. Import through its root exports. A declaration or runtime file that works only with the library tsconfig/path aliases has a packaging defect; do not copy those aliases into every consumer to hide it.

Vireo's anonymous gauntlet provides a separate reference that refuses workspace/file/link dependencies and Maven Local. That stricter release-consumption model does not automatically install a Vireo upgrade tool in this RGO app.

## Failure and decision table

| Observation                                  | Decision                                                                           |
| -------------------------------------------- | ---------------------------------------------------------------------------------- |
| Storybook sees a fix, generated app does not | Inspect whether the candidate was rebuilt/repacked and installed.                  |
| Local preview rewrites manifest/lock         | Treat as a preservation error or intentional reviewed change, not invisible setup. |
| Consumer needs library `@/` alias            | Fix published entrypoints/declarations.                                            |
| Version matches, installed bytes differ      | Record candidate versus published integrity distinctly.                            |
| App lock contains a workstation path         | Remove accidental local coupling through a reviewed dependency change.             |
| Published verification passes                | Report exactly its install/type/build scope; do not claim full product acceptance. |

## Acceptance and inspection

Record selected mode, package/artifact identity, actual resolution, protected-file state and observed consumer checks. Preserve application customizations and remove temporary overrides through the owning workflow.

No helper, install, pack, build or registry operation runs from this article.

## Source provenance

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/package.json`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/package-lock.json`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:README.md`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:scripts/application-template/run-application-template.mjs`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:scripts/package/pack-release-artifact.mjs`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:scripts/package/verify-package.mjs`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:scripts/application-template/verify-published-application-template.mjs`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:docs/ANONYMOUS_CONSUMER_GAUNTLET.md`
