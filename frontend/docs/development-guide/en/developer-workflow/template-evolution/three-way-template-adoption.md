# Compare immutable baseline, local changes and upstream target

Review a template change against the source an application actually adopted, not only against today's upstream tree. Preserve local customization and make automatic transforms narrower than the full human migration plan.

**Reference recipe grounded in Vireo guarded upgrades and immutable Template adoption.** This RGO starter has no installed `vireo upgrade` contract. The three-way reasoning below explains safe review; it is not a generic automatic text merge or permission to run peer commands here.

## Trigger, owner and invariant

Use when bringing template improvements into an existing app or evaluating a generator/framework release. The application owner owns customizations and applied migrations. Template/tooling maintainers own immutable baseline/target identities and declared transforms. Operators separately own live setup changes.

The invariant is three identities: baseline B, current local L and upstream target U. Only an admitted ownership/edge can authorize automatic replacement. An upstream release proves artifact identity, not that every local project can migrate safely.

## Make the comparison explicit

```text
B: immutable bytes originally admitted
L: current application bytes and customizations
U: reviewed target bytes / exact transform
             |
      classify ownership and drift
             |
automatic narrow change OR explicit app-owned migration action
```

The Vireo `baselineState` implementation uses source/target hashes rather than a fuzzy merge. For an update, L equal to U is unchanged, L equal to B is an eligible update, missing L is missing, and other bytes are conflict. Adds/deletes have similarly explicit presence/hash conditions.

| Managed update state                 | Reference decision                  |
| ------------------------------------ | ----------------------------------- |
| Local already equals target          | No rewrite needed.                  |
| Local equals declared source         | Eligible reviewed transform/update. |
| Local differs from source and target | Refuse managed baseline drift.      |
| Local missing                        | Refuse missing managed baseline.    |

This is deliberately narrower than automatically preserving arbitrary local edits. Application-owned adaptations remain human-reviewed actions; the tool must not invent a safe merge merely because the upstream artifact is authentic.

## Separate two adoption layers

The peer's upstream Template-adoption workflow first selects a unique immutable successor with exact manifest/artifact evidence. It stages a marked draft and unresolved report. Current planning emits `upgrade.ready: false` without independently reviewed consumer-upgrade proof.

That framework draft is not the same as applying a project upgrade. A published CLI later admits only declared project release edges, profile-specific baselines, known managed scripts and validated generated contracts. An unpublished candidate is rejected, and manual application-owned actions remain visible in the receipt.

Artifact integrity therefore does not encode a transformation recipe. Neither a new Template pin nor a generated draft justifies overwriting application routes, business code or lockfiles by guesswork.

## Preserve schema and interrupted work

Already-applied migrations and adopted generated code need byte-stable history plus normal forward changes. A framework upgrade should not secretly regenerate an entity or rewrite a production migration to match a newer template.

The reference records an upgrade journal for its filesystem writes and refuses read-only preview while interrupted recovery is outstanding. Its recovery behavior concerns that declared managed write set, not live database rollback. This starter must not adopt a peer journal or recovery command without the corresponding tooling and reviewed project contract.

For a manual RGO template improvement, capture the relevant old/current/new source, classify affected owners, apply a reviewable diff and state any compatibility decisions. Lack of an automated edge is a reason for explicit work, not a reason to fabricate metadata that claims one exists.

## Failure and decision table

| Observation                                             | Decision                                                              |
| ------------------------------------------------------- | --------------------------------------------------------------------- |
| Local managed bytes differ from both hashes             | Preserve conflict and review customization.                           |
| Upstream release is immutable but transform unspecified | Keep adoption draft/unready; artifact proof is not migration proof.   |
| Lockfile/app actions are inferred automatically         | Require the actual owner plan and acceptance.                         |
| New target rewrites applied migration                   | Reject; use forward schema evolution.                                 |
| Interrupted managed upgrade exists                      | Follow its exact owner recovery; no blind second apply.               |
| RGO app lacks Vireo metadata/tooling                    | Use bounded manual/reference reasoning, not fake compatibility state. |

## Acceptance and inspection

Retain B/L/U identities, changed path ownership, exact automatic scope, remaining manual actions and candidate verification. Check that customization, issue/history and migration provenance survive.

This page executes no upgrade, merge, journal recovery or upstream adoption workflow.

## Source provenance

- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:docs/TEMPLATE_RELEASE_ADOPTION.md`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:docs/architecture/generated-code-ownership.md`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:packages/create-vireo/src/project-upgrade.ts`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:scripts/plan-template-adoption.mjs`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:contracts/project-upgrade-policy.json`
