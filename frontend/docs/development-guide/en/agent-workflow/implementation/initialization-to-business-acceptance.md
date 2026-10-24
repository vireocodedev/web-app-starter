# Separate setup readiness from accepted business V1

Coordinate a generated application through setup, agreed scope, specification, implementation and release without confusing one stage's evidence with another's. A deployed skeleton is valuable setup progress; it is not an accepted business product.

**Documented starter workflow.** `docs/v1-workflow.md` is the stage coordinator. Initialization, Discovery export/specification and release procedures retain their own contracts. This article adds a decision map, not a new end-to-end automation or authority to run every stage.

## Trigger, owner and invariant

Use when planning a generated consumer, resuming partial setup, selecting the implementation baseline or deciding whether V1 is complete. The developer/operator owns setup within written scope. Administrator and designated client own business approval/lock. Implementers own bounded issue outcomes; release and business acceptance retain their separate owners.

The invariant is independent state with explicit transitions. Preparation review does not imply business approval. Business lock does not authorize infrastructure changes. Specification completeness does not mean issues were published or code implemented. Production health does not replace accepted business journeys.

```text
consumer capability + reviewed developer preparation
             -> authorized initialization evidence
                         |
independent business review -> same-hash approvals -> explicit LOCKED
                         |
           pinned specification + decision/issue graph
                         |
          approved publication -> bounded implementation
                         |
             staging business acceptance
                         |
             exact-pair production promotion + handoff
```

Setup and business discovery can proceed in parallel. Specification needs the actual initialized context and intended locked business baseline; the diagram is not a requirement to wait on every unrelated branch of preparation.

## Establish the consumer before mutating it

Inspect actual Git origin, identity, existing work and compatible workflow packages. Preserve completed initialization, private resume state and existing data. Older clones may lack full specification capabilities; copying one script without its references/metadata/tools is not a complete adoption.

Initialization uses reviewed developer preparation with its own revision, signed bounded execution scope and live readiness. A bare status invocation reports preparation/setup/scope state rather than starting setup or downloading a business export. Plan-only does not become execution because every checkbox is checked.

The initializer supports a bounded local-only task when explicitly requested. That completes local scope only, not full CI/deployment/recovery acceptance. Missing provider access or setup evidence must remain visible instead of borrowing historical template receipts.

## Lock the intended business source

The administrator and designated client independently approve the same saved snapshot hash, then the administrator explicitly locks it. Two approvals without lock remain awaiting lock. A newer draft does not replace the old locked baseline, and a participant's tentative answer remains tentative even inside an approved snapshot.

The specification capture selects the highest-version `LOCKED` baseline. Confirm it is the intended V1 source. Retain original export bytes, project/baseline/version/content hash, approval identity and separate whole-file digest. Supporting asset bytes are outside that export/hash and need their own authorized retrieval/provenance.

## Generate actionable scope without fabricating facts

The package includes specification, acceptance scenarios, decisions, traceability, page map, issue manifest and implementation workflow. Technical delegation can be resolved with rationale. `PROPOSED` and `REQUIRES_INPUT` outcomes remain visible and gate affected tasks; unaffected ready work can proceed.

Local structural validation and semantic review have different purposes. Passing tools do not establish client approval. Generation initially leaves implementation unimplemented, and ready-for-spec-review is not coding authorization.

Client artifacts belong in the explicit private/nested output, away from public dashboard inputs. Generation does not authorize committing or publishing them. Issue publication requires the selected target and explicit request, retaining stable keys/import mappings and partial-failure evidence.

## Accept behavior before promoting artifacts

| Stage result              | Required distinction                                                              |
| ------------------------- | --------------------------------------------------------------------------------- |
| Local app starts          | Local setup, not deployed business acceptance.                                    |
| CI/protection configured  | Consumer delivery foundation, not completed features.                             |
| Specification validated   | Source/graph consistency plus separate semantic review.                           |
| Issues published          | Execution records, not implemented code.                                          |
| PR integrated             | Bounded implementation with actual checks; full V1 may remain.                    |
| Staging candidate healthy | Artifact/runtime readiness; test agreed journeys/roles/failures separately.       |
| Exact pair promoted       | Production identity; still retain smoke, operating and recovery handoff evidence. |

Use the generated `ACCEPTANCE.md` to verify agreed business behavior on the exact staging candidate and record client acceptance/release blockers. Scope approval agrees what to build; it does not accept the delivered code.

Production promotes the exact accepted frontend/backend pair without rebuilding. Migrations, backup, account provisioning and recovery follow their operator owners. Keep source identity and actual run/pair receipts intact.

## Failure and decision table

| Observation                                         | Decision                                                           |
| --------------------------------------------------- | ------------------------------------------------------------------ |
| Setup complete, features missing                    | Continue implementation; do not mark business V1 delivered.        |
| Both approvals exist, no explicit lock              | Finish the intended lock process before export selection.          |
| New draft appears during coding                     | Preserve pinned source; reviewed refresh/change cycle is separate. |
| Package tools pass, consequential policy unresolved | Block affected work with an owned decision.                        |
| Staging infrastructure green, journey fails         | Business acceptance remains open.                                  |
| Production image differs from accepted staging pair | Promotion contract fails; reconcile artifact identity.             |

## Acceptance and handoff

Final V1 evidence includes accepted requirement/issue coverage, exact candidate/pair identity, real business smoke, current operating/access docs, recovery evidence and known limitations. Consumer-specific setup belongs in its authoritative runbook entrypoint.

The stage owners decide and execute their authorized procedures. This article performs no setup, export capture, issue publication, implementation claim or deployment.

## Source provenance

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:docs/v1-workflow.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:AGENTS.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/initialize-project/references/contract.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/initialize-project/references/project-status.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/references/export-contract.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/references/specification-contract.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/SKILL.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:infrastructure/release/README.md`
