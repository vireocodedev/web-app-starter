# Separate setup readiness from accepted business V1

Coordinate setup, agreed requirements, implementation and release while keeping
each stage's evidence explicit. A deployed skeleton establishes setup progress;
an accepted business product requires implemented and verified journeys.

**Documented starter workflow.** The root `README.md` section **Project lifecycle**
coordinates the stages. The numbered manual procedure in
`docs/template-initialization/INIT_GUIDE.md` owns setup,
including prerequisites, copy-paste commands and completion evidence. CI and
release operator guides own their infrastructure. This article adds no execution
authority. The numbered scripts load a private values env file and hash-bound verification observations. The repository-shipped `template-initialization` skill coordinates the same guide with an explicit values/DNS/scope confirmation and protected DNS preparation; it does not replace these contracts or establish business acceptance.

## Trigger, owner and invariant

Use when planning a consumer, resuming partial setup or deciding whether V1 is
complete. The developer/operator owns setup within authorized scope. Product/client
owners agree requirements and accept delivered business behavior. Implementers
own bounded outcomes; release operators own promotion and recovery.

Chosen setup inputs, verified initialization, business agreement and business
acceptance are independent states. Completing one does not imply the others.

```text
consumer checkout -> project values + access -> numbered manual setup
                                            -> verified initialization

agreed business requirements -> bounded implementation -> staging acceptance
                             -> exact-pair production promotion + handoff
```

## Establish the consumer and follow the setup guide

Create the private consumer through GitHub's template UI, clone it and open its
folder in VS Code before starting the initialization guide. No local template
checkout is required. Inspect actual Git origin, identity and local changes. Preserve existing data,
credentials and verified setup evidence. Follow `docs/template-initialization/INIT_GUIDE.md`
in order, beginning with project values and access. Keep credentials in protected
stores and record only nonsecret setup decisions and remaining blockers in the
guide's consumer-specific setup section.

When resuming, check completed evidence against the actual checkout and
environments, then continue the missing steps. Full initialization requires
consumer evidence for local development, CI/protection, staging, production and
initialized recovery. Explicit local-only scope establishes only local setup.
Unresolved access, configuration or authority blocks the affected step.

Business requirements and their approval belong to the later requirements stage;
they are not prerequisites for the manual initialization procedure.

## Keep later requirements separate

The requirements/specification workflow remains to be defined separately.
Setup notes establish technical configuration and do not supply business requirements.

Before affected implementation, agree business acceptance criteria, exclusions,
permissions, journeys and owners of unresolved decisions. Setup confirmation
does not approve these business decisions. Track issue/PR progress separately.

## Accept behavior before promoting artifacts

| Stage result              | Required distinction                                        |
| ------------------------- | ----------------------------------------------------------- |
| Setup values chosen       | Inputs and scope still need execution evidence.             |
| Local app starts          | Local setup; deployed business acceptance remains open.     |
| CI/protection configured  | Delivery foundation; business features may remain.          |
| Reviewed implementation   | Bounded outcome with actual checks; full V1 may remain.     |
| Staging candidate healthy | Verify agreed journeys, roles and failures separately.      |
| Exact pair promoted       | Complete production smoke, operating and recovery evidence. |

Record business acceptance and blockers against the exact staging candidate.
Production promotes that accepted frontend/backend pair without rebuilding.
Migrations, backups, account provisioning and recovery follow their existing
owners. Keep source identity and actual run/pair receipts intact.

## Failure and decision table

| Observation                                        | Decision                                                 |
| -------------------------------------------------- | -------------------------------------------------------- |
| Required setup input or access missing             | Resolve it before the affected manual step.              |
| Earlier setup work already exists                  | Preserve it, verify evidence and continue missing steps. |
| Setup complete, business features missing          | Continue implementation; business V1 remains incomplete. |
| Consequential business policy unresolved           | Block affected work with an owned decision.              |
| Staging infrastructure green, journey fails        | Business acceptance remains open.                        |
| Production pair differs from accepted staging pair | Reconcile artifact identity before claiming promotion.   |

## Acceptance and handoff

Final V1 evidence includes accepted requirement coverage, exact candidate/pair
identity, real business smoke, current operating/access docs, recovery and limits.
Consumer setup belongs in `docs/template-initialization/INIT_GUIDE.md`. Historical template
receipts do not establish consumer acceptance. A fresh-consumer rehearsal is
required before claiming the complete setup needs no follow-up intervention.

The pinned references below describe historical stage/evidence contracts. The
current lifecycle overview is in the root `README.md`; the manual setup
procedure is owned by `docs/template-initialization/INIT_GUIDE.md`.

## Source provenance

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:docs/v1-workflow.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:AGENTS.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:infrastructure/release/README.md`
