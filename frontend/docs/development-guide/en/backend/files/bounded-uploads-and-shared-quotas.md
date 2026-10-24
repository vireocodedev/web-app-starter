# Bound actual upload bytes under a shared quota lock

**Support status: source-backed consumer recipe.** Client Discovery stores small bounded private files in PostgreSQL with multipart, domain and database limits. The starter does not install this file service, object storage, malware scanning or a generic upload feature. These missing capabilities must be designed explicitly when required.

Use this pattern when a workspace has per-file, total-byte or file-count limits. Browser checks improve feedback, but server metadata and an unlocked quota precheck cannot protect the actual bytes or concurrent capacity.

## Enforce distinct layers

The peer transport caps file/request size and spills multipart data according to its configured threshold. Its controller accepts exactly one multipart part named `file`. The service enforces configured file, project-byte and count limits; configuration itself is bounded. The schema independently caps content at 26,214,400 bytes and checks `octet_length(content) = size_bytes`.

| Layer                     | Protects                                           |
| ------------------------- | -------------------------------------------------- |
| HTTP/multipart ceiling    | Transport/parser resource exposure                 |
| Exactly one expected part | Ambiguous or extra request content                 |
| Domain file limit         | Accepted business file size                        |
| Shared count/byte quota   | Aggregate capacity across writers                  |
| Bounded stream read       | Actual content, not only claimed size              |
| Database constraints      | Stored length/content consistency and hard ceiling |

The 25 MiB schema ceiling and peer configured defaults are not universal template policy. Raising configuration above a hard schema bound requires a reviewed schema/design change, not just an environment edit. The source permits zero-byte content; a consumer requiring nonempty files must add that rule deliberately.

## Serialize the quota invariant

The service resolves an enabled actor, locks the parent project, checks authority/mutability, then counts files and sums stored sizes. Competing uploads, membership revocation and deletion use the parent protocol. Without that shared lock, two uploads can each observe spare capacity and exceed it together.

The source's resource helper can lock before its membership check; this is not an authorization bypass and should not be rewritten as a claim that all permissions precede every lock. What matters is that protected changes wait for the same invariant owner and still enforce authority.

**Pseudocode recipe:** implement current actor, scoped parent lock, quota policy, bounded content reader, metadata/content repository, audit and safe error mapping. These names are not starter APIs.

```java
@Transactional
public FileView upload(UUID workspaceId, MultipartFile file, Authentication auth) {
    var actor = actors.currentEnabled(auth);
    workspaces.lockAndRequireUpload(workspaceId, actor);
    var usage = files.usage(workspaceId);
    quota.checkDeclared(usage, file.getSize());
    var bytes = content.readAtMost(file.getInputStream(), quota.fileLimit() + 1);
    quota.checkActual(usage, bytes.length);
    var saved = files.insert(workspaceId, safeName(file.getOriginalFilename()), bytes);
    audit.uploaded(actor.id(), saved.id(), bytes.length);
    return views.metadata(saved);
}
```

The real source uses try-with-resources for the stream and rechecks both actual file length and total quota after reading at most maximum plus one byte. Merely trusting `getSize()` or reading the entire stream before checking defeats the bound. File metadata and content/audit share the command transaction.

## Filename is display data

The peer strips path components from both slash styles, removes control and format code points, limits to 200 code points, trims and falls back for empty/dot names. It never uses the upload name as a server filesystem path. This is not file-type validation, virus scanning or proof that arbitrary content is safe to render inline.

Its bounded BYTEA design materializes a file in memory and holds the parent lock during the bounded read. That is a concrete tradeoff for small files. Large streaming/object-storage upload needs a different reservation, storage and cleanup protocol; do not rename a byte-array implementation “streaming.”

## Failure and recovery

The source uses 413 for oversize content, 409 for exhausted quota and 400 for unreadable input. A later insert/audit failure rolls back the command. An early accepted declared size followed by actual oversized data must fail without leaving content or capacity reservation behind.

Changing only frontend size limits or multipart configuration cannot change domain/database limits safely. Avoid independent per-upload locks, client-supplied stored lengths, filesystem paths from names and unlimited file reads. If scanning/quarantine is needed, define whether a pending file consumes quota and when it becomes downloadable.

## Implementation checklist and acceptance

- Transport, domain and database ceilings agree and are individually enforced.
- Extra multipart parts and malformed field contracts fail before business persistence.
- Actual oversize content fails even if declared metadata looked acceptable.
- Concurrent uploads cannot both consume the same remaining count/byte quota.
- Revocation/deletion participates in the shared parent protocol.
- Filename normalization affects display only; content trust has a separate policy.
- Failed reads/inserts/audit leave no partial file or false quota state.

## Exact source references

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectFilesService.java` — parent lock, actual-byte rechecks, audit and filename normalization.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectFilesController.java` — exactly one multipart part and HTTP mapping.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectFileLimits.java` — bounded configuration.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/resources/application.yaml` — multipart versus domain configuration.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/resources/db/migration/V5__project_files.sql` — BYTEA hard ceiling and exact size constraint.
