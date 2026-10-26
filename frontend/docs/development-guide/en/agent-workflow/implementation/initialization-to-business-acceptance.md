# Separate setup readiness from accepted business V1

Coordinate setup, agreed requirements, implementation and release without
confusing one stage's evidence with another's. A deployed skeleton is setup
progress; an accepted business product requires implemented and verified journeys.

**Documented starter workflow.** `docs/v1-workflow.md` coordinates the stages.
The current setup owners are `.agents/skills/initialization-intake/SKILL.md` and
`.agents/skills/initialization-execution/SKILL.md`; detailed procedures remain with
those packages and the CI/release owners. This article adds no execution authority.

## Trigger, owner and invariant

Use when planning a consumer, resuming partial setup or deciding whether V1 is
complete. The developer/operator owns setup within confirmed scope. Product/client
owners agree requirements and accept delivered business behavior. Implementers
own bounded outcomes; release operators own promotion and recovery.

Intake completion, execution acceptance, business agreement and business acceptance
are independent states. Completing one does not imply the others.

```text
checkout -> upfront intake -> confirmed, saved answers
                         -> gated initialization -> verified setup

agreed business requirements -> bounded implementation -> staging acceptance
                         -> exact-pair production promotion + handoff
```

## Establish the consumer and finish intake

Inspect actual Git origin, identity, local work and compatible packages. Preserve
existing data, credentials, initialization receipts and private resume state.
Adoption needs both complete skills, not a copied helper without its references.

A bare skill invocation offers a short action menu and waits. A concrete request
such as `$initialization-intake prepare initialization for this repository` starts
intake directly. The agent presents all known questions upfront, proposes detected
facts for review and resolves human service-access prerequisites before execution.

Answers, unknowns and prerequisite evidence live in the Git-ignored
`.agents/skills/initialization-intake/state/intake.json`. Keep nonsecret values and
protected references there. Another agent session can resume with
`$initialization-intake resume intake`, preserving answered questions and showing
what remains. Completion binds the user's confirmation to the resolved scope and
current state; answer changes invalidate it.

## Gate execution on completed intake

`$initialization-execution initialize this repository` first checks intake
completion, current answers and checkout identity. Missing, partial, changed or
mismatched intake explicitly stops with `$initialization-intake` guidance before
provider checks or initialization actions. Execution must not silently answer
remaining questions or mark intake complete.

Once the gate passes, verify live readiness and execute the confirmed scope using
the execution contract/runbook. Full setup requires real consumer evidence for
local development, CI/protection, staging, production and initialized recovery.
Explicit local-only scope proves only local setup. Unexpected provider failures or
scope changes can block execution; known questions belong in intake.

No Client Discovery service, project UUID, export or business approval is needed
for initialization. Preserve completed legacy evidence when adopting the skills;
incomplete execution requires intake before continuing mutations.

## Keep later requirements separate

The replacement requirements/specification workflow is outside this initialization
change and remains to be defined. No new automated specification workflow is
installed. The existing `discovery-specification` package is a legacy app
integration, outside the new setup path; local intake is not its business source.

Business scope still needs useful acceptance criteria, exclusions, permissions,
journeys and owned unresolved decisions before affected implementation. Setup
confirmation does not approve those business decisions. Track actual issue/PR
progress independently of initialization state.

## Accept behavior before promoting artifacts

| Stage result              | Required distinction                                                    |
| ------------------------- | ----------------------------------------------------------------------- |
| Intake complete           | Confirmed setup inputs, not successful setup.                           |
| Local app starts          | Local setup, not deployed business acceptance.                          |
| CI/protection configured  | Delivery foundation, not implemented business features.                 |
| Reviewed implementation   | Bounded outcome with actual checks; full V1 may remain.                 |
| Staging candidate healthy | Runtime readiness; verify agreed journeys/roles/failures separately.    |
| Exact pair promoted       | Production identity still needs smoke, operating and recovery evidence. |

Record business acceptance and blockers against the exact staging candidate.
Production promotes that accepted frontend/backend pair without rebuilding.
Migrations, backups, account provisioning and recovery follow their existing owners.
Keep source identity and actual run/pair receipts intact.

## Failure and decision table

| Observation                                        | Decision                                                 |
| -------------------------------------------------- | -------------------------------------------------------- |
| Intake missing or no longer valid                  | Stop execution and resume intake.                        |
| Another session has answered questions             | Load saved state and continue only remaining questions.  |
| Setup complete, business features missing          | Continue implementation; business V1 remains incomplete. |
| Consequential business policy unresolved           | Block affected work with an owned decision.              |
| Staging infrastructure green, journey fails        | Business acceptance remains open.                        |
| Production pair differs from accepted staging pair | Reconcile artifact identity before claiming promotion.   |

## Acceptance and handoff

Final V1 evidence includes accepted requirement coverage, exact candidate/pair
identity, real business smoke, current operating/access docs, recovery and limits.
Consumer setup belongs in its authoritative setup entry point. Historical template
receipts never prove consumer acceptance. A fresh-consumer rehearsal is required
before claiming the new setup experience needs no follow-up intervention.

The pinned references below describe historical stage/evidence contracts. Current
intake and execution behavior is owned by the current skill paths named above.

## Source provenance

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:docs/v1-workflow.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:AGENTS.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/initialize-project/references/contract.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/initialize-project/references/project-status.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/references/export-contract.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/references/specification-contract.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/SKILL.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:infrastructure/release/README.md`
