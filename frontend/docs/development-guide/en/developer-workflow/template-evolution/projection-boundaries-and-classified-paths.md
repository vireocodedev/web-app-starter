# Classify every template path before projecting an application

Make generated application contents an explicit reviewed projection instead of copying an entire flagship repository. Ownership, optional surfaces and identity substitution need a rule before a file can enter a consumer.

**Vireo reference profile, not installed RGO projection tooling.** The peer's application-projection JSON contract, classifier and `create-vireo` implementation provide this example. This starter remains an RGO template; adopting a classifier would be a separate implementation and migration.

## Trigger, owner and invariant

Use when maintaining a template generator, adding upstream files or investigating leaked maintainer evidence in generated apps. Template maintainers own classification and projection rules. Application owners receive only the admitted surface and their own identity.

The invariant is complete classification with deterministic precedence and fail-closed unknowns. A newly added upstream file must not silently become application-owned because it happens to sit near copied code.

## Separate dispositions from folder names

| Reference category      | Projection meaning                                               |
| ----------------------- | ---------------------------------------------------------------- |
| `maintainer-only`       | Exclude flagship governance/operations.                          |
| `historical`            | Exclude dated upstream acceptance evidence.                      |
| `managed`               | Copy with integration provenance and declared tooling ownership. |
| `application-owned`     | Copy once for consumer maintenance.                              |
| `optional`              | Copy only when selected by the profile/contract.                 |
| `substitution-required` | Render explicit application identity.                            |

These are Template projection classes, not the entity generator's generated-once/regenerated lifetimes. A whole folder's apparent purpose is insufficient when narrow files have different owners.

## Apply exact and longest-prefix precedence

The classifier validates relative paths and selected profiles, gathers exact/prefix matches and gives exact paths maximum specificity. Among prefixes, the longest wins. Different rule IDs tied at the best specificity are an error. No match returns an unclassified result; the create loop rejects it before copying.

```text
pinned template path + selected profile
                |
       exact rule, else longest prefix
                |
   unique category/disposition or fail
                |
  exclude / copy / selected optional / render
```

The contract validator also rejects duplicate rule IDs/selectors, invalid category mappings and unsupported identity definitions. The policy compares the bundled classifier contract bytes with the canonical copy, preventing a published creator from quietly using another rule set.

A safe illustrative review might classify a dated acceptance file as historical, a generic runtime integration as managed and app branding as substitution-required. These examples are design reasoning, not proposed rules already installed in this starter.

## Render identity without inheriting upstream accounts

The reference requires project/display names at creation and records owner/repository/support/security coordinates. Release-facing fields may initially have conspicuous unresolved markers; release checks reject them until real application ownership is supplied.

A generated consumer must not inherit the framework's repository or support/security destinations. Security contact and ordinary support have distinct roles. No real account, host or private project identifier belongs in a reusable example.

A marker is a visible incomplete state, not a usable default. Replacing its text without verifying actual application ownership does not establish readiness.

## Keep governance out of product output

Historical receipts describe a particular upstream source/environment. Copying them into generated apps would falsely imply acceptance. Maintainer-only automation can also carry authority assumptions inappropriate for consumers.

Conversely, exclusion must be deliberate: blindly dropping every `.github` or docs file may remove application-owned required workflows/guidance. The classifier's exact reviewed rules, not a blanket “copy everything except hidden files,” determine output.

## Failure and decision table

| Observation                                 | Decision                                                       |
| ------------------------------------------- | -------------------------------------------------------------- |
| New path has no rule                        | Fail projection and classify it explicitly.                    |
| Two equally specific rules disagree         | Reject ambiguity; do not pick list order.                      |
| Narrow exception needs a different owner    | Use reviewed exact/longer-prefix precedence.                   |
| Creator's bundled contract drifts           | Restore canonical agreement before release.                    |
| App contains upstream historical acceptance | Remove false evidence through corrected projection and review. |
| Identity marker remains at release          | Keep release blocked until actual coordinates are established. |

## Acceptance and inspection

Inspect the complete pinned inventory, unique classification, selected optional rules and rendered identity. Verify both source contract and actual generated output; checking a few happy-path fixtures does not prove all future paths are classified.

The reference performs no automatic RGO-to-Vireo migration. This article copies no files, changes no generator contract and runs no projection check.

## Source provenance

- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:docs/APPLICATION_PROJECTION.md`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:contracts/application-projection-contract.json`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:packages/create-vireo/src/application-projection-contract.mjs`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:packages/create-vireo/src/index.ts`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:scripts/application-projection-policy.mjs`
