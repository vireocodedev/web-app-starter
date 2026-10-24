# Put each change behind the capability that owns its contract

Choose interfaces by behavior and lifetime rather than file convenience. Review both the source dependency and the public compatibility boundary when a change spans routing, shared presentation and a feature.

**Documented starter architecture with an implementation recipe.** Frontend `AGENTS.md`, source-map/dependency articles and route/navigation skills define installed ownership. The review matrix below is guidance for applying those contracts; actual team/delegation requirements come from the current applicable instructions.

## Trigger, owner and invariant

Use when adding a page, extracting reusable UI, moving feature code or changing a public prop/export. The coordinating implementer maps affected owners. Each concurrent editor needs a coherent isolated responsibility; collaboration does not make shared files ownerless.

The invariant is capability-owned behavior behind deliberate public seams. Pages compose; features own product behavior; app infrastructure supplies stable services/presentation. A reusable component receives data instead of discovering product policy through internal imports.

## Trace the correct dependency direction

```text
main/startup -> app composition
pages        -> public feature and app interfaces
router       -> route policy + adapters
shell        -> supplied navigation/presentation inputs
features     -> own models, ports, UI and lifecycle
```

Cross-owner imports use `@/`; within one owner use relative paths. Feature `index.ts` exports are deliberate named interfaces, not broad `export *` barrels. Predictable filenames do not make contexts or `internal/` folders public.

A direct cross-feature hook edge is exceptional and must use a named public member plus an explicit known/unique/acyclic declaration in `appFeatures.ts`. Ordinary shared UI composition or injected collaborators are usually clearer boundaries.

## Apply a small worked seam

Suppose three index pages need identical navigation rows and arbitrary named groups. The shared component can accept translated labels, icons, destinations and grouping inputs. Route/catalog composition supplies those values. The presentation component should not import the route registry or a business article inventory to discover them itself.

If matched route metadata must be interpreted, use a router adapter that passes plain data into presentation. Feature validation, persistence and business state stay with the feature. Reusing visuals does not transfer all behavior into the shell.

The same restraint applies to structure. Add a runtime factory only when construction injects collaborators. Add an application-lifetime Signal registration only when that lifetime is required. Do not create empty role folders or a generic utils owner to hide an unclear responsibility.

## Choose review from the changed contract

| Change                   | Review focus                                                                       |
| ------------------------ | ---------------------------------------------------------------------------------- |
| Route/page lifecycle     | Access, direct URLs, redirects, titles, locales and development-only availability. |
| Shared public input      | Every caller, compatibility and whether policy leaks into presentation.            |
| Feature move/removal     | Exports, registration, translations, mocks, tests, persistence and docs.           |
| Auth/CI/release boundary | Actual authority, failure behavior and the owning operational review requirements. |
| Architecture exemption   | Exact justified leaf/edge; avoid broad directory bypasses.                         |

Use independent review when required by current instructions or when public/security/cross-owner risk warrants it and delegation is available/authorized. Small bounded edits can stay with one implementer. Do not manufacture a large team or start verification independently to justify parallel work.

## Keep edits and evidence coherent

Before moving files, trace callers and every lifecycle/runtime/Signal registration. Preserve stable exports unless migration is explicit. Removing an optional example should remove its own routes/labels/tests/registration while retaining shared infrastructure used elsewhere.

The architecture checker enforces many mechanical edges, including resolved relative imports. It cannot judge whether an interface is minimal or an owner is appropriate. Passing it is necessary evidence where configured, not a substitute for design review.

## Failure and decision table

| Observation                                      | Decision                                                         |
| ------------------------------------------------ | ---------------------------------------------------------------- |
| Shared UI imports the whole route registry       | Move interpretation to composition/adapter and pass narrow data. |
| Checker rejects a new owner crossing             | Inspect the contract before adding a narrow justified exception. |
| Feature move leaves old registrations            | Complete lifecycle migration before claiming completion.         |
| Two editors need the same shared manifest        | Assign one integration owner rather than competing writes.       |
| Public prop changes silently break a caller      | Update consumers deliberately or provide a reviewed migration.   |
| Runtime scaffolding has no injected collaborator | Keep the simpler owner structure.                                |

## Acceptance and inspection

Report the chosen owners, public seam, caller migration, relevant review decisions and actual authorized verification. Confirm no unrelated edits were reverted and that both source direction and observable behavior agree.

The source-owner guides remain authoritative. Reading this article does not authorize a security exemption, infrastructure change, skill rewrite or publication.

## Source provenance

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/AGENTS.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/docs/architecture/en/source-map-and-ownership.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/docs/architecture/en/dependency-boundaries-and-imports.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/docs/architecture/en/add-change-or-remove-a-feature.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/docs/architecture/en/tests-mocks-stories-and-architecture-checks.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/.agents/skills/app-route-pages/SKILL.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/.agents/skills/app-shell-navigation/SKILL.md`
