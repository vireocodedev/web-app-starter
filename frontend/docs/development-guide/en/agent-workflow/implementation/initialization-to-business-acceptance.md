# Separate setup readiness from accepted business V1

Coordinate setup, agreed requirements, implementation and release without
confusing one stage's evidence with another's. A deployed skeleton is setup
progress; an accepted business product requires implemented and verified journeys.

**Documented starter workflow.** `docs/v1-workflow.md` coordinates the stages.
Current setup belongs to initialization intake (`.agents/skills/initialization-intake/SKILL.md`) and
initialization execution (`.agents/skills/initialization-execution/SKILL.md`).
The specification creator (`.agents/skills/specification-creator/SKILL.md`) owns subsequent functional discovery.
Detailed procedures remain with those packages and the CI/release owners. This
article adds no execution authority.

## Trigger, owner and invariant

Use when planning a consumer, resuming partial setup or deciding whether V1 is
complete. The developer/operator owns setup within confirmed scope. Product/client
owners agree requirements and accept delivered business behavior. Implementers
own bounded outcomes; release operators own promotion and recovery.

Intake completion, execution acceptance, business agreement and business acceptance
are independent states. Completing one does not imply the others.

```text
checkout -> upfront intake -> confirmed, saved answers
         -> gated full initialization -> verified setup
         -> adaptive specification interview -> approved specification revision
         -> local issue package -> explicitly requested GitHub import
         -> separate architecture/readiness planning -> bounded implementation
         -> staging business acceptance -> exact-pair production + handoff
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

For local practice in the template, use `$initialization-intake dry run` and
`$initialization-intake resume dry run`. The same questionnaire and validation
use hypothetical targets and explicitly simulated service prerequisites, without
opening provider accounts or protected operator files. Progress lives separately
at `.agents/skills/initialization-intake/state/dry-runs/<session>/intake.json`;
named sessions preserve alternative scenarios. Its `rehearsalComplete` result
always leaves `complete: false` and cannot unlock real execution. The intake
reference `.agents/skills/initialization-intake/references/dry-run.md` owns the
practice contract. Only intake supports this dry-run mode in the current stage.

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

No external discovery service, project UUID, export or business approval is needed
for initialization. Preserve completed legacy evidence when adopting the skills;
incomplete execution requires intake before continuing mutations.

## Gate specification creation on full initialization

Run `$specification-creator create a specification for this repository` only after
full initialization execution is complete. The skill first uses execution's local
completion gate for this consumer. Missing, incomplete, inconsistent or local-only
completion stops it with an instruction to finish `$initialization-execution`.
The gate checks recorded setup evidence; it is not a live remote-health check and
cannot borrow a template's acceptance receipt.

The specification creator (`.agents/skills/specification-creator/SKILL.md`) interviews the product/client owner in
adaptive rounds. It reads supplied specifications or notes as source material,
separates confirmed requirements from interpretations and proposals, challenges
feature value and surfaces contradictions. Ask the current answerable frontier
with numbered questions and justified recommendations; use answers to determine
the next round rather than guessing dependent answers.

Cover the problem, users and outcomes; V1, future scope and exclusions; workflows,
features, pages and relevant UI states; data, relationships and lifecycle;
permissions, rules and failure/acceptance cases. Explore applicable integrations,
notifications, reporting, imports/exports, accessibility, localization, performance,
privacy and retention. Include visual/responsive direction, references, deadlines,
budget constraints, dependencies, responsibilities and acceptance ownership.
Explicitly mark inapplicable topics instead of silently skipping them.

Save answers, proposals, unresolved questions, source references and progress after
each answer batch under Git-ignored `.agents/skills/specification-creator/state/`.
A fresh agent session resumes the unresolved branches without replaying the
conversation. Maintain reviewable documents in `docs/specification/`, entered
through `SPECIFICATION.md`; supporting documents cover features, pages, data,
decisions and acceptance where useful. Root `CONTEXT.md` remains the business
glossary owner; architecture decisions retain their existing owner.

Drafts may contain unknowns. Completion requires all applicable topics addressed,
no blocking product unknowns for included functionality, consistency checks and
the user's explicit approval of the exact specification revision. A later change
preserves the previous approved baseline, identifies affected requirements and
reopens affected branches for renewed approval while preserving unaffected answers.
Validation does not grant product approval.

The skill ends at functional specification creation. Architecture planning, issue
creation/publication, mockups, prototypes and coding are separate tasks. Track
actual issue/PR progress independently of initialization and specification state.

## Generate locally, then import explicitly

After exact-revision specification approval, use specification-to-issues
(`.agents/skills/specification-to-issues/SKILL.md`) to prepare a local issue package.
It validates approval and preserves copied approved source/approval evidence,
content hashes, a versioned manifest and Markdown issue bodies. Tickets retain
source references, acceptance criteria, labels, dependencies and parent grouping.
Missing business rules return to specification revision. Generation changes no
application source, invents no architecture and performs no GitHub publication.

Use github-issues-import (`.agents/skills/github-issues-import/SKILL.md`) separately.
Offline validation/dry-run performs no provider access or writes. Actual import
requires an explicit import request naming the exact target repository. Reconcile
stable markers/mappings to resume without duplicates, preserve human edits and
closed issues, and stop on conflicts. Publish blockers first; add native blocking
and sub-issue relationships where available, otherwise use explicit linked
references according to `docs/agents/issue-tracker.md`. Parent grouping alone does
not imply execution order.

Default new tickets to `needs-triage`, following `docs/agents/triage-labels.md`.
Approved functionality, a valid package and successful publication are different
states from architecture review and agent implementation readiness. The handoff
reports package identity, source approval, actual imported issue links and limits;
none of these stages starts coding automatically.

## Accept behavior before promoting artifacts

| Stage result               | Required distinction                                                    |
| -------------------------- | ----------------------------------------------------------------------- |
| Intake complete            | Confirmed setup inputs, not successful setup.                           |
| Local app starts           | Local setup, not deployed business acceptance.                          |
| Full initialization passed | Setup prerequisite for specification, not approved product scope.       |
| Specification approved     | Exact functional agreement, not architecture or implemented features.   |
| Local issue package valid  | Reviewable task handoff, not remote publication or coding readiness.    |
| GitHub issues imported     | Tracker records/relationships, not implemented business behavior.       |
| Reviewed implementation    | Bounded outcome with actual checks; full V1 may remain.                 |
| Staging candidate healthy  | Runtime readiness; verify agreed journeys/roles/failures separately.    |
| Exact pair promoted        | Production identity still needs smoke, operating and recovery evidence. |

Record business acceptance and blockers against the exact staging candidate.
Production promotes that accepted frontend/backend pair without rebuilding.
Migrations, backups, account provisioning and recovery follow their existing owners.
Keep source identity and actual run/pair receipts intact.

## Failure and decision table

| Observation                                        | Decision                                                  |
| -------------------------------------------------- | --------------------------------------------------------- |
| Intake missing or no longer valid                  | Stop execution and resume intake.                         |
| Another session has answered questions             | Load saved state and continue only remaining questions.   |
| Setup is incomplete or local-only                  | Stop specification work and finish full initialization.   |
| Approved requirements change                       | Preserve baseline and reopen affected interview branches. |
| Setup complete, business features missing          | Continue implementation; business V1 remains incomplete.  |
| Consequential business policy unresolved           | Block affected work with an owned decision.               |
| Staging infrastructure green, journey fails        | Business acceptance remains open.                         |
| Production pair differs from accepted staging pair | Reconcile artifact identity before claiming promotion.    |

## Acceptance and handoff

Final V1 evidence includes accepted requirement coverage, exact candidate/pair
identity, real business smoke, current operating/access docs, recovery and limits.
Consumer setup belongs in its authoritative setup entry point. Historical template
receipts never prove consumer acceptance. A fresh-consumer rehearsal is required
before claiming the new setup experience needs no follow-up intervention.

The pinned references below describe historical stage/evidence contracts. Current
intake, execution, specification and issue-handoff behavior belongs to the current skill paths
named above, not the retired app-linked specification package.

## Source provenance

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:docs/v1-workflow.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:AGENTS.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/initialize-project/references/contract.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/initialize-project/references/project-status.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/references/export-contract.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/references/specification-contract.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/SKILL.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:infrastructure/release/README.md`
