# Separate private file downloads from metadata projections

**Support status: source-backed consumer recipe.** Client Discovery reads metadata without content and serves private bytes through a separate authorized download endpoint. Its storage is bounded PostgreSQL BYTEA, not an installed object-storage abstraction. The starter does not ship this file API or S3/signed-download support.

Use this pattern when files appear in lists, quotas, cards or ordinary domain responses. Most screens need identity, name, size and uploader—not the blob. Loading private content as a side effect of rendering metadata increases memory, bandwidth and accidental disclosure risk.

## Give metadata and content separate queries

The peer list explicitly selects file ID, name, byte size, upload time and uploader identity/display name, constrained by the authorized parent. It never selects `content` for lists or quota calculation. Its response also includes quota limits and total stored size derived from metadata.

Download first resolves the current enabled actor and parent authority, then selects name/content using both parent ID and file ID. A valid file UUID from another project cannot be substituted under an allowed parent path. The controller and service divide transport headers from resource authorization and storage.

| Operation           | Data needed                           | Authority boundary                      |
| ------------------- | ------------------------------------- | --------------------------------------- |
| Metadata list       | Public permitted metadata only        | Current parent/resource visibility      |
| Quota check         | Count and stored byte sizes           | Mutation's shared quota protocol        |
| Download            | Exact bytes and safe display filename | Current parent plus child scope         |
| Preview/inline view | Additional reviewed content policy    | Not installed by an attachment endpoint |

Do not serialize an entity containing a byte array and rely on a frontend component to ignore the field. Deliberate projection prevents content loading/exposure at the source seam.

## Deliver bytes with a narrow transport contract

The source successful response uses `application/octet-stream`, the actual byte-array length, attachment disposition, an encoded UTF-8 filename, `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`. A fixed fallback filename accompanies the encoded display name. The stored name has already been normalized as display data.

**Pseudocode recipe:** implement the current-actor policy, scoped repository, bounded content representation, safe filename/header encoder and response mapping. These collaborators are not starter APIs.

```java
public Download download(UUID workspaceId, UUID fileId, Authentication auth) {
    var actor = actors.currentEnabled(auth);
    workspaces.requireVisible(workspaceId, actor);
    var stored = files.readContentByWorkspaceAndId(workspaceId, fileId)
        .orElseThrow(FileNotFound::new);
    return new Download(stored.safeDisplayName(), stored.bytes());
}
```

The controller then chooses the attachment headers; a database/file name is never concatenated into a filesystem path or raw response header. Reuse the framework's reviewed encoder rather than hand-building unescaped names.

Attachment/no-sniff reduces accidental browser interpretation; it does not make arbitrary file content benign or protect a user who later opens it. The peer does not demonstrate malware scanning, content-type validation or safe document preview. Add those as explicit capabilities if the consumer requires them.

## Keep bounded bytes distinct from streaming storage

The inspected download materializes the complete bounded file as a byte array. That is appropriate only under the source's size/memory constraints. A large-file or object-storage recipe needs a storage adapter, stream lifecycle, timeout/cancellation and authorization strategy; it is not achieved by renaming this method.

If introducing signed object URLs, decide their scope, expiry, content-disposition/cache behavior and revocation limits. That is proposed consumer work, not an existing starter API. A private bucket alone does not replace application authority at URL issuance, and a previously issued bearer link has its own lifetime semantics.

## Failure and recovery

Missing or cross-parent files return the selected not-found contract after the relevant authority checks. Do not expose whether an unowned file exists in an error message or redirect. The peer success response sets no-store; a consumer must decide safe cache policy for errors too rather than assuming every handler inherits those headers.

Once a user has downloaded bytes, server-side revocation cannot retract that local copy. Current authorization controls future access, not digital-rights management. Metadata can also be sensitive: names, uploader labels and sizes need the same permitted projection discipline as other domain data.

Avoid blob columns in ordinary lists, client-side authorization, path guessing, inline rendering based on upload MIME metadata and using quota routes as alternate downloads.

## Implementation checklist and acceptance

- List/quota/ordinary DTO queries do not select or serialize content.
- Download checks live authority and both parent/child identifiers.
- Wrong-scope and missing IDs follow the safe response contract.
- Successful bytes have actual length, attachment encoding, no-store and no-sniff policy.
- Filename/header handling cannot introduce paths or raw header content.
- Memory/stream/object-storage claims match the actual implementation.
- Preview/scanning, error caching and revoked-link behavior are explicitly owned rather than assumed.

## Exact source references

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectFilesService.java` — metadata-only projection, parent/child lookup and byte-array download.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectFilesController.java` — attachment, encoding, size, cache/no-sniff and error mapping.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/resources/db/migration/V5__project_files.sql` — bounded BYTEA and metadata/content consistency.
