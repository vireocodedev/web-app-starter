# Rehearse recovery from the retrieved copy in isolation

Prove that a verified backup survives retrieval and restores into a disposable database without touching live state. Archive inspection and checksum validation are necessary, but they do not demonstrate a working recovered schema and initialized data.

**Installed operator procedure.** The release README owns this rehearsal; `runtime.py` owns production backup format/metadata and the pinned PostgreSQL image. This is a recovery-readiness procedure, not automatic restore logic and not permission to overwrite production.

## Trigger, owner and invariant

Use before enabling the production backup timer, after a relevant backup/schema change or when authorized recovery-readiness evidence is needed. The operator owns protected copies, scratch resources, expected initialized evidence and cleanup. The application owner defines meaningful schema/data expectations without publishing real rows.

The invariant is that the exact retrieved, checksum-matched finalized archive is restored in a task-owned database with no live network, production credentials or persistent destination. A real data-loss recovery needs a separate explicit decision naming backup, environment, destination and consequences.

## Select evidence before creating scratch resources

Record the finalized dump and matching `.dump.json` from a successful backup. Do not select a `.partial` file or assume that the newest filename is an initialized snapshot. Verify expected bytes/SHA-256 and require initialization evidence plus the expected data/count criteria for the project.

Retrieve both files through verified operator transport into a `0700` directory outside Git, with files kept `0600`. Check the retrieved bytes, not just the original server copy. Restoring a different on-server archive would miss corruption or substitution introduced during retrieval.

A neutral evidence record can capture identities without contents:

```yaml
archive: <exact-finalized-name>
metadata: <matching-name.dump.json>
retrievedSha256: <verified-sha256>
initialized: true
expectedSchema: <reviewed-Flyway-versions>
expectedCounts: <private-acceptance-reference>
scratchOwner: <task-specific-label>
```

This is an illustrative record, not a secret-bearing configuration. Counts and expected versions must be derived from the authorized project snapshot, not copied from the template's historical rehearsal.

## Isolate the destination deliberately

The owning procedure uses a task-unique container from the pinned PostgreSQL image. It has `--network none`, no published ports, no bind mounts or persistent volumes, non-root `999:999`, read-only root, dropped capabilities, no-new-privileges, memory/PID limits and bounded tmpfs.

PostgreSQL 18 uses the parent `/var/lib/postgresql` volume boundary. Scratch database, socket and temp paths must be writable only through the intended tmpfs. Generate unrelated scratch credentials in a protected temporary env file; never reuse production credentials to make setup easier.

```text
finalized protected backup -> retrieved verified copy
                                      |
                           stdin into exact scratch container
                                      |
                        isolated PostgreSQL + bounded tmpfs
                                      |
                         schema + initialized-state evidence
```

Network isolation does not prevent the operator's explicit `docker exec` stream. It prevents the scratch database from becoming an accidental reachable replacement or talking to application services. The procedure still depends on authorized supported-host Docker authority.

## Restore and inspect without publishing data

After bounded readiness, the owner procedure streams the retrieved archive into the exact scratch name with `pg_restore --exit-on-error --no-owner --no-privileges`. Errors stay in protected diagnostics. There is no live database destination and no broad “restore latest” operation.

Inspect successful Flyway versions, expected schema/session tables and initialized identity evidence. For the template, useful checks include enabled users with BCrypt hashes and queryable session structures. The application's future business tables need their own acceptance criteria. Do not display restored rows, hashes or private values in public evidence.

A restore that exits successfully but omits expected initialized data is not complete recovery evidence. Likewise, a table-of-contents check is not a substitute for actual restore/query acceptance.

## Clean only the scratch owner

Before removal, verify the exact container's task-specific ownership label. Remove only that container and disposable credential/temporary-copy files. Preserve original backups and the protected retrieved operator copy according to retention policy.

If local Docker rejects the intended restricted runtime, use a supported authorized recovery host. Do not weaken global Docker/AppArmor policy or drop runtime restrictions solely to produce a green result. Record the platform limitation separately from archive behavior.

## Failure and decision table

| Observation                                                   | Decision                                                              |
| ------------------------------------------------------------- | --------------------------------------------------------------------- |
| Retrieved checksum/bytes mismatch                             | Stop before restore and reconcile transport/source identity.          |
| Backup predates initialization                                | Choose valid initialized evidence or record missing readiness.        |
| Scratch destination has ports or persistent mounts            | Correct isolation before importing data.                              |
| Restore exits successfully but expected schema/data is absent | Acceptance fails; investigate snapshot/version assumptions privately. |
| Ownership label differs during cleanup                        | Do not delete; resolve exact task identity.                           |
| Someone proposes restoring production to finish rehearsal     | Reject scope expansion; live recovery requires a separate decision.   |

## Acceptance and inspection

Retain nonsecret archive/checksum identity, retrieval verification, exact scratch ownership, restrictions, restore result, expected schema/data checks and cleanup outcome. Keep customer rows and credential material private.

A successful rehearsal proves the selected retrieved copy recovered under those conditions. It does not establish zero data loss, offsite storage or an automatic production rollback. The release runbook remains the operation owner; this page performs no restore or resource creation.

## Source provenance

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/runtime.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/db/migration/V1__create_users.sql`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/db/migration/V2__create_sessions.sql`
