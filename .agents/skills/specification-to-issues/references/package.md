# Portable issue package

Use Node 24; commands need no installed dependencies or provider access:

```sh
node .agents/skills/specification-to-issues/scripts/package.mjs prepare --root /consumer --output /consumer/docs/issue-packages/specification-001
node .agents/skills/specification-to-issues/scripts/package.mjs seal --root /consumer --package /consumer/docs/issue-packages/specification-001
node .agents/skills/specification-to-issues/scripts/package.mjs validate --root /consumer --package /consumer/docs/issue-packages/specification-001
```

`prepare` calls the consumer's specification helper before creating output. It
copies exact approved public Markdown and `approval.json` from
`docs/specification/versions/approved-NNN/` into `source/`. It creates a stable
package UUID, draft manifest, README and empty `issues/`. The output must not
exist. Interrupted preparation remains a visible partial folder; inspect and
reconcile it rather than overwriting human work.

The agent authors bodies in `issues/ID.md` and entries in `manifest.json`:

```json
{
  "schemaVersion": 1,
  "packageId": "a-generated-v4-uuid",
  "repository": "owner/repo",
  "source": {
    "iteration": 1,
    "revision": 13,
    "digest": "the-approved-state-SHA256",
    "documents": { "SPECIFICATION.md": "its-exact-SHA256" }
  },
  "labels": [
    {
      "name": "needs-triage",
      "color": "D4C5F9",
      "description": "Maintainer evaluation needed"
    }
  ],
  "issues": [
    {
      "id": "ISSUE-001",
      "kind": "task",
      "owner": "Appointment workflow",
      "title": "Coordinators can inspect appointment availability",
      "body": "issues/ISSUE-001.md",
      "sha256": null,
      "labels": ["needs-triage"],
      "sourceRefs": [{ "document": "SPECIFICATION.md", "id": "FEATURE-001" }],
      "dependsOn": [],
      "parent": null
    }
  ],
  "packageDigest": null
}
```

`kind` is `epic` or `task`; owner is a nonempty responsibility description. Issue
IDs are stable uppercase identifiers. References must identify tokens present in
the approved documents. Each label needs a definition. Parents and dependencies
must exist and be acyclic separately. Parent grouping is not an execution edge.
Draft hashes can be null; `seal` computes them only after validating all content
and current source. It preserves README, bodies and source, updating only manifest
integrity fields with an atomic replacement under an exclusive local lock.
Inspect active writers before removing an interrupted `.package-write-lock`.

After a body/metadata edit, validation fails until intentional review and resealing.
Keep package identity stable during local drafting. Once importing starts, preserve
the sealed package unchanged: changed package contents need a separately reconciled
package/version, never a silent in-place continuation of partial remote work.

`validate --package DIR` without `--root` validates copied source, receipt/body
hashes, exact inventory, source references and graphs offline. It cannot establish
that the original consumer still approves that revision. With `--root`, it also
requires the current exact approval and rejects stale or foreign packages.
Source receipts and hashes identify recorded contents; they are not signatures.

The importer uses `loadPackage(directory, { root?, requireCurrentSource? })` from
`scripts/package.mjs`, returning `{manifest, packageDigest, issues, sourceReceipt}`.
Each issue includes its metadata and `bodyText`. Supplying a root checks current
approval by default; `requireCurrentSource: true` requires a root. Validation
has no writes or GitHub calls. Reserved `<!-- issue-package` markers belong to
the importer and are rejected in authored bodies.
