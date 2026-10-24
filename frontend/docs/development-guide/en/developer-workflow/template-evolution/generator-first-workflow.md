# Generate first, customize through the owning boundary

Before creating standardized frontend/backend source, discover the bundled generator catalog, assess genuine compatibility, generate the suitable structure, then customize business behavior. The application owns generated source immediately; generation never grants permission to overwrite it or rewrite an applied migration.

**Installed extension of the starter's ownership patterns.** The current working tree implements the CLI under `tools/generators/`; `docs/generators.md` owns its commands, catalog, source traceability and compatibility procedure. The pinned source below establishes the pre-existing boundaries, rather than claiming the new CLI existed at that revision.

## Trigger, owner and procedure

Use when creating a component, form, feature layout, table, page, API/Query bundle, DTO, entity, repository or read-only backend feature. The capability owns its public interface and behavior; the generator owns only its templates and reproducible translation index. The router owns example availability and destinations.

1. Read the live guide and intended owner, then run `npm run generate -- --list --json` from the root. Inspect the selected generator with `--help` and a complete `--dry-run`.
2. Evaluate architecture/file structure (30%), libraries/conventions (25%), relevant output coverage (25%) and workflow integration (20%), scoring each 0–100 with inspected evidence. Evaluate the generator's responsibility rather than an entire feature.
3. Read the threshold from `generator-policy.json` (default 80%). At or above it, use every meaningfully compatible generator. Prefer a composite over duplicated output. Architecture violations, unsafe/destructive output, behavior that cannot safely adapt and unacceptable functionality loss disqualify regardless of score.
4. Inspect generated source, then customize business rules. Record unsupported/below-threshold manual work and repeated near-matches. Generator improvements preserving the approved architecture may proceed; architectural changes keep their explicit decision gate.
5. Verify actual emitted code, owner checks and meaningful interactions. Report generator, target, evidence-based compatibility, customization and executed checks. Instructions and a score calculator do not mechanically guarantee future agent behavior.

```sh
npm run generate -- frontend form UserProfile --fields name,email --dry-run
npm run generate -- frontend form UserProfile --fields name,email
npm run generate -- backend feature Product --fields title --migration 3 --dry-run
```

Use the actual next unused Flyway integer version. Backend features implement shared-authenticated read-only records; private/tenant/mutation authority is deliberately left to an approved contract. Visual forms support bounded text fields. API/backend scalar support does not imply generic specialized UI controls.

## Visual integration and lifecycle

Every visual output includes a real-component example under `src/pages/development-guide/generated/<kind>/`. DEV-only file discovery feeds the existing route registry, category navigation and page search. Open `/dev-guide/frontend/generated`; UserProfile's form opens `/dev-guide/frontend/generated/form/user-profile--user-profile`.

The existing providers supply locale/theme/router context. Local fixtures and acknowledged callback simulations exercise validation, pending/disabled/success/error and collection states without writes to real data. Nonvisual API output has contract tests rather than a preview URL. Product-page route/access policy remains an explicit router decision.

Removing or renaming a preview file removes the old derived registration on the next dev build. Ordinary application code and locale pairs stay developer-owned. After deliberately removing locale pairs, `npm run generate -- index --dry-run` previews mechanical index maintenance. No automatic business-source deletion or adopted-source regeneration is supported.

## Failure and acceptance

| Observation                               | Action                                                                             |
| ----------------------------------------- | ---------------------------------------------------------------------------------- |
| Existing file or owner collision          | Inspect existing work; choose another owner/name or adapt it deliberately.         |
| Customized mechanical index               | Preserve the change, restore canonical mechanics and rerun the preview.            |
| Generator below threshold or disqualified | Record the actual gap; implement only the unsupported part manually.               |
| Required architecture differs             | Obtain approval for that specific departure before implementing it.                |
| Process interrupted during writes         | Inspect processes and the plan before reconciling files and removing a stale lock. |

Acceptance includes deterministic planning, no-write dry runs, collision/symlink/path safety, handled-failure rollback, emitted TypeScript/Java compilation, meaningful generated tests, actual preview navigation/interaction, and a production build without preview modules. Use the repository's serialized verification workflow. A source inspection or template snapshot is not runtime evidence.

## Source provenance

- `vireocode-web-app-starter@a7defb9e45dc418036d4d62af742fadf42ffde05:frontend/src/app/router/routeRegistry.tsx`
- `vireocode-web-app-starter@a7defb9e45dc418036d4d62af742fadf42ffde05:frontend/src/features/development-guide/contacts/components/ContactForm.tsx`
- `client-discovery-app@9fcbf2f17a09329333c3d53c7a3750c48fc1db52:frontend/src/features/sales/components/LeadForm.tsx`
