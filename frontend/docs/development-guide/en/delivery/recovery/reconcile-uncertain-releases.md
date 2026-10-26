# Reconcile an uncertain release before retrying mutation

Determine what the host actually changed when a request, controller or final status fails. Preserve the exact release evidence and resolve the uncertainty before another deployment can act on the environment.

**Installed template pattern.** The controller owns request journals and staging receipts; the runtime owns environment transactions, immutable snapshots and active state. `infrastructure/release/README.md` defines operator recovery. There is no generic automatic replay or “clear failure” recovery command.

## Trigger, owner and invariant

Use after a request timeout, controller restart, incomplete replacement, lost GitHub response or disagreement between reported and actual state. The operator owns inspection under the correct environment lock. Application maintainers own migration compatibility and any reviewed forward fix. GitHub status alone cannot resolve host mutation.

The invariant is reconcile before retry: retain source/run/attempt/pair identity and compare journals with live images, database state and public routing. Do not erase evidence, change pointers or delete volumes to make a fresh attempt possible.

## Know the independent state owners

| Evidence                         | Meaning and limitation                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------- |
| `requests/<run>-<attempt>.json`  | Controller processing state for one exact request; not a complete database history.   |
| `<environment>/transaction.json` | Runtime replacement boundary, pair, snapshot and previous active record.              |
| `<environment>/active.json`      | Last published accepted application state; may lag a partial replacement.             |
| Referenced immutable snapshot    | Exact generated app configuration for that release, not arbitrary repository Compose. |
| Staging receipt                  | Durable successful host acceptance of a staging run/attempt/pair.                     |
| Actual containers and database   | Current execution and migration reality, independent of a lost reporting response.    |
| GitHub run/Deployment status     | Remote reporting and request context; may fail after host success.                    |

These records are protected operator evidence, not user-facing app data. Inspect only required fields and keep secrets out of the report.

## Understand why retries are blocked

The controller records a request before runtime work and does not automatically replay an existing request journal after restart. A journal marked started may represent a mutation whose response was lost. Replaying it blindly could apply a second operation to already changed state.

The runtime rejects prior transactions outside `success` and `backup-failed`. It verifies the previously accepted state and database readiness before preparing a new replacement. After candidate start, Flyway may already have changed schema even if app health later fails.

A production backup failure has a narrower boundary: candidate startup remains gated, and the runtime attempts to restart the previous backend. Only after that recovery succeeds does it publish `backup-failed`. If the restart or persistence step fails, the transaction may remain blocking. Never infer recovery from the original backup error alone.

## Build an evidence timeline

A minimal nonsecret timeline can look like:

```text
source SHA / request run / attempt / environment
  -> request validated
  -> exact digests pulled and inspected
  -> prepared snapshot + transaction
  -> production backup boundary, if applicable
  -> replacing
  -> running-image/public checks
  -> active/transaction success
  -> staging receipt and final GitHub status
```

Mark each line observed, absent or uncertain. Do not fill an absent observation with an optimistic assumption. Installed host-executor source and application image source may differ after an explicitly reviewed operator repair; record both rather than changing image provenance.

Compare exact running image IDs against the intended digest pair, not a mutable tag or container name. Inspect health and public environment markers, then database health/Flyway versions where mutation may have occurred. A functioning old frontend does not prove the backend or schema remained unchanged.

## Choose from the actual failure boundary

| Observation                                    | Decision boundary                                                                        |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Validation rejected before runtime             | Resolve authorization/source/transport problem without weakening validation.             |
| Pull failed before replacement                 | Establish that no app mutation occurred; preserve request failure evidence.              |
| Backup failed and old backend verified running | Candidate did not start through that gate; document recovery and remaining backup issue. |
| Transaction is replacing or state is mixed     | Block new mutation and review schema/code/runtime reality.                               |
| Host success exists but GitHub response failed | Repair/report status uncertainty without deploying the same change again blindly.        |
| Old image is available after migration         | Availability does not establish rollback compatibility; prefer reviewed forward repair.  |
| Restore is proposed                            | Separate explicit data-loss recovery decision is required.                               |

The guide intentionally provides no sequence of ledger edits. A supported recovery plan must name the exact state and action under operator authority, preserve audit evidence and respect schema consequences.

## Keep diagnostics bounded

Use credential-free controller error categories and targeted private observations. Do not publish resolved Compose, env files, CMS plaintext, registry login state, database rows or raw application logs. A failed request in one environment should not become permission to stop unrelated projects or clear shared infrastructure.

A restored database discards changes after the selected recovery point. A previous digest can be incompatible with a migrated schema. Those decisions are materially different from correcting a missing status update.

## Acceptance and inspection

Recovery is complete only when the chosen pair, database schema/health, public routing and protected records agree, or an explicit remaining blocker is documented. Record exact request identity, observed boundary, approved recovery action and final evidence without secrets.

Use **Migration failure boundaries** for pre/post-Flyway consequences and **Durable backup artifacts** for backup validity. The owning release runbook remains authoritative; this page performs no retry, pointer mutation, restore or deployment.

## Source provenance

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/controller.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/runtime.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/client.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md`
