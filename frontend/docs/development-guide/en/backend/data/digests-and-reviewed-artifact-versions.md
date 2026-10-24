# Bind review and export to exact retained artifact versions

**Support status: source-backed consumer recipe.** Client Discovery retains reviewed content, its revision and digests for the rendered artifact and its generating contract/template. The starter does not install this review/export domain or a canonical JSON/signature framework. A consumer must define exactly what is hashed and which authority permits review/export.

Use this pattern when an approval or downstream operation must refer to the exact content someone reviewed, rather than today's rendering of a mutable draft. A digest identifies bytes or a defined canonical representation; it does not by itself prove approval, origin or execution permission.

## Retain the reviewed meaning, not only a boolean

The peer preparation save increments revision and clears prior review fields, retained rendered content and its hashes on update. Review requires the expected current revision, validates the draft and captures rendered Markdown together with reviewer/time, reviewed revision, workbook SHA-256 and contract/template SHA-256.

The model computes contract and template hashes from their loaded UTF-8 source text. A stored reviewed package therefore records which generating inputs and rendered content were accepted. The export path locks the parent, requires reviewed revision to equal current revision, revalidates the draft and returns retained reviewed Markdown/digests rather than rerendering it with today's template.

| Retained fact             | Question it answers               |
| ------------------------- | --------------------------------- |
| Draft/reviewed revision   | Is this the same draft revision?  |
| Rendered content digest   | Which exact retained output?      |
| Contract/template digests | Which generating source versions? |
| Reviewer/time             | Who recorded the review and when? |
| Current authorization     | May this actor review/export now? |

A `reviewed=true` field alone cannot express these relationships.

## Distinguish export guards from stronger current-evidence checks

The source's read-only delivery-evidence projection additionally compares retained contract/template hashes with the current model and recomputes the retained workbook hash before declaring CURRENT_REVIEWED. The ordinary export method's visible guards are revision/current validation; do not claim every source path automatically rejects every template change using the identical predicate.

This distinction matters for consumers. Decide whether an older reviewed artifact remains legitimately exportable as historical content, whether a new template invalidates current execution eligibility, or whether all exports require current generating inputs. Name those separate policies instead of assuming one “reviewed” flag covers them.

**Pseudocode recipe:** implement locked artifact storage, current review authority, versioned generator, digest encoding and review evidence schema. None of these helpers is a starter API.

```java
@Transactional
public ReviewStamp review(UUID id, long expectedRevision, Authentication auth) {
    var actor = authority.requireReviewer(auth);
    var draft = drafts.lock(id);
    revisions.requireExpected(draft.revision(), expectedRevision);
    var bytes = renderer.renderVersioned(draft).utf8Bytes();
    var stamp = new ReviewStamp(draft.revision(), sha256(bytes),
        renderer.contractDigest(), renderer.templateDigest(), actor.id(), clock.instant());
    artifacts.retainReviewed(id, bytes, stamp);
    return stamp;
}
```

Later export verifies the consumer's chosen stamp/content/currentness policy under its protected boundary. A hash computed over new mutable rendering is not a substitute for retaining what was actually reviewed.

## Define bytes and canonicalization explicitly

For exact files/text, encoding, line endings and every byte affect the digest. For semantic JSON, ordinary serialization is not automatically canonical: property order, numeric representation, omitted/null fields and Unicode handling can change bytes. Define/version a canonical encoding before hashing semantic objects, or intentionally hash and retain exact issued bytes.

Client Discovery's later issued-package schema stores payload plus package/document digests linked to a specific version. Its `DeliveryJson` enables duplicate-key detection for new input without rewriting predecessor retained bytes. Strict parsing and canonical serialization are different guarantees; enabling a parser option does not establish a universal JSON canonicalization standard.

Never parse an old retained object, serialize it with a new library and call the result the same original merely because the business fields appear equal. Preserve original bytes and their declared representation/version when identity is the contract.

## Failure and recovery

A draft edit invalidates its current review under the source save policy. A retained-content digest mismatch is corruption/conflict evidence, not permission to regenerate and replace the digest silently. Preserve the original record, diagnose the owner and obtain a new reviewed version when appropriate.

A template/contract change may invalidate current execution evidence even while the historical artifact remains retained. Surface that distinction to agents and operators. A SHA-256 match does not grant deployment authority, authenticate an external sender, prove legal acceptance or make file content safe; those require separate evidence and authorization.

Avoid review/export racing deletion or edits, hashes of mutable URLs, accepting client-supplied “approved hash” as authority and changing canonicalization without a version/migration story. Approval should bind exact content and scope, not a filename that later points elsewhere.

## Implementation checklist and acceptance

- A draft mutation clears or supersedes review according to explicit revision policy.
- Review retains exact content, generating-input identity and actor/time evidence.
- Export/history/current-execution eligibility have named, distinguishable guards.
- A changed/corrupted retained payload fails its digest check without silent repair.
- Encoding/canonicalization is specified and versioned; duplicate-key parsing is not confused with it.
- Earlier issued content remains stable after serializer/template updates.
- Hash identity is kept separate from authority, signature, confidentiality and content safety.

## Exact source references

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectPreparationService.java` — save invalidation, review capture, locked retained export and stronger delivery-evidence currentness checks.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectPreparationModel.java` — generating contract/template source hashes.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/DiscoveryService.java` — SHA-256 of UTF-8 text.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/resources/db/migration/V10__specification_development.sql` — retained issued payload/digests bound to version and project.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/DeliveryJson.java` — strict duplicate-key detection scoped to new input.
