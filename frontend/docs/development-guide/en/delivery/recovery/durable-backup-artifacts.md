# A backup is complete only after durable verification

Treat a database backup as a finalized archive plus validated metadata, not a filename or a successful dump process. The production migration gate depends on evidence that the persisted artifact can be identified and inspected after a crash.

**Installed template pattern.** `infrastructure/release/runtime.py` owns dump creation, verification, retention and the environment lock; `controller.py` owns durable JSON publication. `install.py` and the release README own the disabled timer and its activation prerequisites.

## Trigger, owner and invariant

Use before production backend replacement, for scheduled/manual backups and when investigating an interrupted backup. The operator owns protected storage, recovery policy and verification evidence. Application maintainers own schema compatibility; a backup does not automatically make an incompatible image rollback safe.

The invariant is a protected custom-format dump that has passed archive validation, durable publication and reread checksum verification. Production candidate startup is gated on that result. A `.partial` file, metadata without its finalized dump or a zero-exit subprocess alone is insufficient.

## Follow the actual publication sequence

The runtime acquires the production environment lock, shared with deployment. It creates an unpredictable UTC-based owned filename and an exclusive `.partial` destination. It streams `pg_dump -Fc` directly into that file, avoiding database contents in logs or command output.

After dumping it flushes/fsyncs the stream, requires a successful subprocess and minimum size, and runs `pg_restore --list` against the archive. This validates a recognizable table of contents; it is not the same as restoring and querying the database.

It then records checksum, size, initialization evidence, user count and timestamp in protected durable metadata. The dump is atomically renamed, the directory entry is fsynced, and the checksum is reread from the persisted destination. Retention runs before the helper returns success.

```text
exclusive .partial
      |
pg_dump -> flush/fsync -> size + archive TOC
      |
SHA-256 + metadata -> atomic final name -> directory fsync
      |
reread final checksum -> owned retention -> completed artifact
```

The actual metadata shape is illustrated without application values:

```json
{
  "sha256": "<archive-sha256>",
  "bytes": "<positive-archive-byte-count>",
  "initialized": "<boolean>",
  "users": "<expected-count>",
  "created_at": "<UTC-time>"
}
```

Placeholder strings stand for typed values; this is not a valid ready-to-use metadata file. Initialization/count evidence describes what the helper observed and helps reject an empty pre-initialization recovery candidate. It does not replace an application-specific restore acceptance contract.

## Durability includes the name

Fsyncing an open file protects its contents but does not by itself establish durable publication of a renamed directory entry. The helper also fsyncs the containing directory and rereads the finalized destination checksum. The JSON writer similarly flushes/fsyncs a temporary file, replaces it and fsyncs its parent.

An interruption can leave metadata without a final dump, a partial file or a finalized artifact whose caller never received success. Inspect the exact pair and transaction before assigning meaning. Do not delete finalized evidence merely because a workflow is red.

CLI/service entrypoints enforce restrictive umask and protected path checks. Calling an imported internal function ad hoc bypasses part of that entrypoint contract. Use the installed owner procedure for actual operations, not a copied few lines from this explanation.

## Retention is a specific policy, not disaster recovery

The selected policy is thirty-day same-server production retention. The timer is configured for 03:00 Europe/Zagreb daily and installed disabled. Activation follows an initialized retrieved-copy restore rehearsal. Staging has no scheduled backup timer, and the production backup helper explicitly rejects staging.

Same-server storage cannot recover loss of that server. A schedule declaration is not proof the timer fired; an enabled unit is not proof every future backup will succeed. Operational evidence needs actual completed artifacts and observations. Offsite retention would be a separate design/authorization decision.

Pruning matches only owned timestamp/token dump names, handles paired metadata and aged orphan partial/metadata files, and does not broaden into arbitrary directory cleanup. Failed partials are removed in `finally`; a cleanup failure itself remains an error.

## Failure and decision table

| Observation                                  | Decision                                                              |
| -------------------------------------------- | --------------------------------------------------------------------- |
| Dump process exits nonzero or output is tiny | Reject backup; production candidate remains gated.                    |
| TOC validation fails                         | Treat archive as unusable evidence and inspect privately.             |
| Checksum differs after publication           | Do not use or silently bless the artifact; investigate storage/state. |
| Metadata exists without finalized dump       | Incomplete publication; inspect exact interruption boundary.          |
| Archive valid but `initialized` is false     | It is not initialized recovery acceptance evidence.                   |
| Thirty-day backup exists only on failed host | Acknowledge server-loss limit; retention is not offsite recovery.     |

## Acceptance and inspection

Record finalized filename, metadata identity, bytes/checksum, initialization evidence and actual completion time without exposing contents. Reconcile backup failure with the production transaction and old-backend recovery state before retrying deployment.

For recoverability, continue with **Isolated restore rehearsal** using the retrieved verified copy. Keep dumps, credentials and restored data outside Git and workflow artifacts. This page describes the installed protocol and executes no backup or retention action.

## Source provenance

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/runtime.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/controller.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/install.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md`
