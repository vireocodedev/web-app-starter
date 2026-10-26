# Classify and redact before persistence

**Support status: Vireo framework reference recipe, not installed in this RGO/Spring starter.** Vireo History and Offline modules expose lifecycle-policy seams before storage. Adopting their APIs requires a deliberate package/module, configuration, migration and application-authority change. A consumer can also implement the same boundary in its existing owners without importing Vireo.

Use this pattern when history snapshots, replay commands or diagnostics can contain private fields. Redacting a response later does not remove the raw value already stored, backed up or copied into another subsystem. Decide the permitted persisted representation at the write boundary.

## What the source actually enforces

Vireo's History recorder converts prior/current DTOs to JSON trees, resolves an actor and calls a policy before storing the selected snapshots. The decision must exist, contain a valid partition and retention instant, and not expire before occurrence time. It must preserve null/non-null snapshot presence: create, update and delete semantics cannot change merely because fields were removed.

The default replaces each present snapshot with `{}` while retaining absent snapshots as null. Offline's default retains neither request body nor headers; its service retains an idempotency fingerprint separately. These defaults minimize payload retention rather than attempting a clever universal sensitive-field detector.

| Input relationship                   | Redacted shape                     |
| ------------------------------------ | ---------------------------------- |
| Create: no previous, present current | `null`, permitted object           |
| Update: both present                 | permitted previous/current objects |
| Delete: present previous, no current | permitted object, `null`           |

A custom policy can retain fields, but the framework does not prove those fields are safe. It validates mechanics, not the application's classification policy. Metadata such as actor labels, entity IDs or command URLs can still be sensitive; snapshot/body redaction does not anonymize the entire row.

## Define the application's minimum representation

**Pseudocode recipe:** implement classification, allowed-field projection, current tenant/actor resolution and durable storage in the consumer. These helpers are not installed APIs in this repository.

```java
var classification = policy.forRecordKind(command.kind());
var retained = classification.projectAllowedFields(command.snapshot());
var decision = new RetentionDecision(
    partitions.fromTrustedScope(actor, workspace),
    retention.deadline(clock.instant()),
    holds.currentFor(command.recordId()),
    retained);
history.storeValidated(decision);
```

Choose fields by purpose and allowlist. Removing only a property called `password` misses nested secrets, alternate credential names and sensitive free text. Include derived fields, error data and headers in the review. If exact historical content is required, define its protected storage separately rather than leaking it into a broadly readable activity feed.

Offline redaction also changes what retained data can later reconstruct. Keeping an idempotency fingerprint is not retaining a replayable body or proof of payload confidentiality. Confirm the replay service's actual request/retry path and data needs; do not expand retention merely for convenient diagnostics.

## Treat legacy adoption as a data change

The pinned framework migrations immediately replace old non-null History snapshots with empty objects and clear legacy Offline body/headers. They mark old rows expired and assign lifecycle partitions because historical classification cannot be reconstructed. This is destructive redaction of existing content, not an innocent dependency upgrade or a migration to run in this starter automatically.

A consumer adopting such behavior needs an authorized migration plan, backup/recovery and a policy for required retained evidence. Framework defaults do not establish a legal retention or erasure obligation. Reading the recipe gives no authority to erase another application's history.

## Failure and recovery

Null/invalid decisions, expiry before event time or changed snapshot presence fail before the intended store. Keep that failure visible rather than silently persisting the original payload as a fallback. A classifier exception must not become “store everything so the operation keeps working.”

Serialization occurs before classification in the source recorder, so raw values still enter process memory. This pattern limits persistence; it does not prove end-to-end absence from memory, logs or telemetry. Review each downstream sink separately.

## Adaptation checklist

- Identify the current history/replay owner and whether Vireo adoption is actually in scope.
- Specify permitted fields and sensitive metadata, not only response redaction.
- Preserve event presence semantics and reject invalid policy decisions.
- Confirm replay/idempotency needs after body/header removal.
- Review legacy migration effects before any authorized data operation.
- Keep retention purpose, access and legal decisions application-owned.
- Document failure cases without claiming universal secret detection or anonymization.

## Exact source references

- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-history/src/main/java/com/vireocode/vireo/history/HistoryRecorder.java` — classification, expiry and presence checks before store.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-history/src/main/java/com/vireocode/vireo/history/SafeDefaultHistoryDataLifecyclePolicy.java` — present-to-empty-object fallback.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-offline/src/main/java/com/vireocode/vireo/offline/OfflineSyncService.java` — fingerprint and classified retained payload.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-offline/src/main/java/com/vireocode/vireo/offline/SafeDefaultOfflineDataLifecyclePolicy.java` — no retained body/headers.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-history/src/main/resources/db/vireo/history/V3__data_lifecycle.sql` and `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-offline/src/main/resources/db/vireo/offline/V4__data_lifecycle.sql` — destructive legacy redaction/expiry.
