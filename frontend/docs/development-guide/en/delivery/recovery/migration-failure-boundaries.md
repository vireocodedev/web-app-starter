# Recover at the correct migration failure boundary

Distinguish failure before mutation from failure after a candidate backend may have changed the database. Preserve evidence and reconcile real state before deciding whether any retry, forward fix or separately authorized restore is safe.

**Installed template pattern with an explicit design recommendation.** `infrastructure/release/runtime.py` owns the production backup gate and replacement transaction. The controller owns request journals and staging receipts. Additive expand/migrate/contract schema evolution is a recommendation for future migrations, not an implemented automatic rollback mechanism.

## Trigger, owner and invariant

Use this pattern when deployment times out, backup fails, a candidate cannot start, Flyway fails, a public probe disagrees with container health, or the final GitHub status is missing. The operator owns diagnosis under the correct environment lock. The application maintainer owns schema/code compatibility and a reviewed fix. A guide reader has no implicit authority to restore or delete data.

The invariant is a fresh verified persisted production backup before candidate backend startup can run Flyway. A failure after replacement preserves a blocking transaction. No automatic database restore occurs. The existence of an older application image does not prove that it can run safely against a newer schema.

## Read the actual state transition

The runtime validates protected configuration and pair identity, checks private package visibility, takes the environment lock and examines any previous transaction. A transaction outside `success` or `backup-failed` blocks another mutation until explicit operator reconciliation.

It verifies previously active images/routes, confirms database readiness and pulls/inspects both exact candidate digests before app mutation. It creates an immutable release snapshot and writes a `prepared` transaction containing the pair, snapshot, previous active record and run/attempt.

For production, it stops the previous backend when one exists. Only then does it create and verify the fresh backup. On a backup error it attempts to start the previous backend, records `backup-failed` after that recovery step succeeds, and raises the failure. If recovery itself fails or the process crashes earlier, the durable state can remain blocking; inspect actual state rather than assuming the friendly path completed.

After backup success it writes `replacing`, starts backend and frontend, waits for containers, and verifies exact image IDs, health and public boundaries. Only successful verification publishes the new `active.json` and successful transaction.

```text
prepared
   |
   +-- production: stop old backend -> verified backup
   |                                    |
   |                          backup failure -> attempt old backend start
   |                                    |
   |                              backup-failed
   |
replacing -> actual images + health + public verification
   |                             |
   |                             +-> success + active pointer
   |
 failure / crash -> preserve transaction -> reconcile before next mutation
```

This diagram explains state, not a manual editing recipe. Do not change pointers or ledger fields to force a retry.

## What “verified backup” means here

The helper writes `pg_dump -Fc` output to an exclusively created protected `.partial` file, flushes and fsyncs it, requires a minimum size and validates the archive table of contents with `pg_restore --list`.

It records SHA-256, bytes, initialized-table evidence, user count and creation time in protected metadata. It publishes the dump name atomically, fsyncs the containing directory and rereads the persisted destination checksum. Failed partial files are removed; retention handles only the owned backup naming scheme. A file's existence or a successful dump subprocess alone is insufficient.

The selected policy retains same-server production backups for thirty days. Same-server storage cannot recover loss of that server. Daily backup activation requires initialized restore evidence under the owning runbook. Staging has no scheduled backups. This article does not broaden those selected policies into an offsite guarantee.

## Decide from the boundary, not the workflow color

| Boundary/observation                                      | Safe interpretation and next decision                                                                      |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Request rejected before runtime mutation                  | Diagnose identity/source/permission mismatch; rejection does not authorize weakening the check.            |
| Pull or provenance validation fails before prepared state | Inspect exact runtime evidence; do not assume images were replaced.                                        |
| Production backup fails                                   | Candidate startup was gated; inspect old backend recovery and transaction state.                           |
| Transaction is `replacing`                                | Candidate may have started Flyway and changed schema. Block automatic retry and inspect migration history. |
| Containers are healthy but public probes fail             | Release verification is incomplete; inspect routing/environment identity as well as images.                |
| Host records success, GitHub wait times out               | Final reporting may be lost. Reconcile journals and actual state before deploying again.                   |
| Older digest is available after migration                 | Availability does not prove schema compatibility. Prefer a reviewed forward fix.                           |

A restored database discards changes after its recovery point. That is a separate data-loss decision with separately authorized scope. It must never be an automatic response to a red workflow.

## Inspect a coherent evidence set

Use the exact run/attempt to relate the request journal, environment transaction, active pointer, referenced immutable snapshot, actual running image IDs, database health/Flyway history and GitHub Deployment status. A started request is not automatically replayed after controller restart. Repeatedly dispatching cannot repair an uncertain mutation safely.

Keep diagnostics targeted and private. Fixed credential-free error categories help triage. Do not dump environment variables, resolved Compose, CMS plaintext, Docker login files, database contents or arbitrary raw application logs into chat or CI artifacts. Preserve records rather than deleting the journal or volume to get a clean-looking retry.

## Design future migrations for compatibility

For a future schema change, prefer an additive step that old and new code can both tolerate, a separately observable data migration, then a later contract/removal step after consumers no longer depend on the old shape. Review locks, data volume, nullability/defaults and rollback compatibility for each step.

This is design guidance. The current runtime does not prove every migration is backward compatible, automatically reverse Flyway changes or restore a backup. Such behavior would require its own reviewed contract and operational evidence.

## Acceptance and inspection

Before declaring recovery complete, identify whether candidate startup occurred, which schema version is present, which exact pair is running, whether public probes agree, and whether the durable transaction/active evidence matches that reality. Record the decision and any remaining business or data-recovery limitation without exposing secrets.

For recovery readiness, use the owning runbook's isolated restore rehearsal of the retrieved verified copy, not a live database restore. No backup, restore, deployment or verification command is executed by this page.

## Source provenance

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/runtime.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/controller.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/application.yaml`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/db/migration/V1__create_users.sql`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/db/migration/V2__create_sessions.sql`
