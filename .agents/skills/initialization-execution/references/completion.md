# Full initialization completion receipt

Use this contract after executing and verifying the full initialization phases,
or when reconciling historical consumer setup before specification creation.
The helper records observed evidence; it performs no provider operations and
does not establish that an operator's observations are truthful or still live.

## Record observed full execution

Prepare a private JSON input (`0600`, outside Git) with these exact top-level
fields: `sourceCommit`, `phases`, `deployments`, and `recovery`. Use actual
consumer observations. Run from the selected consumer:

```sh
node .agents/skills/initialization-execution/scripts/completion.mjs complete --root /absolute/consumer --input /private/completion-evidence.json
```

`--input -` accepts JSON through stdin. The producer first requires completed
full intake for the actual GitHub consumer. It rejects local-only scope and
the canonical template. `sourceCommit` is the exact 40-character initialized,
tested and deployed consumer commit; it must be available in local Git history
and an ancestor of the selected checkout. Later specification commits may follow.

For each of the nine phases, supply
`{"status":"passed","evidence":{"checkId":"private:opaque-reference"}}`.
The authoritative required check IDs are exported as `completionPhases` in
[`completion.mjs`](../scripts/completion.mjs). Each required observation needs
its own meaningful reference to the actual check, run or protected operator
record. Supported references are this consumer's GitHub Actions run URLs,
repository-relative `docs/` or `infrastructure/` evidence paths, and opaque
`private:` identifiers resolved through protected operating guidance. References
are not secrets, log excerpts, shell commands or approvals. The schema checks
their shape; the executing agent must inspect the actual evidence privately.

`deployments` contains `staging` and `production`, each with exactly:

| Field          | Value                                                                        |
| -------------- | ---------------------------------------------------------------------------- |
| `url`          | Credential-free HTTPS origin; staging and production use distinct hostnames. |
| `runUrl`       | Actual consumer GitHub Actions run URL, optionally with `/attempts/N`.       |
| `sourceCommit` | The same initialized and tested commit as the receipt.                       |
| `frontend`     | `ghcr.io/<owner>/<repo>-frontend@sha256:<64 lowercase hex characters>`.      |
| `backend`      | `ghcr.io/<owner>/<repo>-backend@sha256:<64 lowercase hex characters>`.       |

The production image references must equal the accepted staging pair exactly.
`recovery` contains exactly `initialized: true`, `isolated: true`,
`backupSha256`, `retrievedSha256`, and `restoredSha256`. All three checksums must
be the same 64-character SHA-256 of the initialized production archive. Phase
evidence additionally identifies provisioning, restored schema/data checks,
scratch cleanup, and enabling the production timer after the successful restore.
The release operator remains the owner of the actual recovery procedure.

## Files and integrity

Successful recording writes sanitized
`docs/acceptance/initialization-acceptance.json` with schema version `1`, actual
repository, `full` scope, source commit, completed intake revision/digest,
completion timestamp, structured evidence and canonical content digest. It also
writes an owner-only binding at `.template-initialization/completion.json`
containing repository, canonical worktree root, source commit and matching digest.
The private directory is `0700`, its marker `0600`, and it remains Git-ignored.

The producer uses an exclusive lock, no-follow regular-file checks and individual
atomic, flushed file publications. The private binding is published last: an
interrupted pair is incomplete and cannot unlock specification. Inspect surviving
evidence and any stale lock before an explicit retry. Existing completion markers
are preserved and require deliberate reconciliation before replacement. Older
unstructured acceptance documents also need actual evidence reconciliation;
they are not automatically converted or treated as a new completed receipt.

The digest detects accidental changes and mismatched files. It is not a signature,
provider attestation or authorization to mutate infrastructure. Keep private
answers, credentials, customer rows and credential-bearing logs out of receipts.
Secret-like strings are rejected heuristically; inspect every public reference.

## Gate specification creation

```sh
node .agents/skills/initialization-execution/scripts/completion.mjs require-complete --root /absolute/consumer
```

This offline, read-only gate checks the receipt schema/integrity, all phase
evidence, image/recovery consistency, the actual Git origin, private binding,
safe owned paths and historical source ancestry. It returns only repository,
scope, source commit, acceptance path and digest. Its module interface is
`requireFullInitialization(root)`.

Missing, partial, local-only, malformed, edited, foreign or inconsistent evidence
fails nonzero and explicitly directs the user to finish
`$initialization-execution` before `$specification-creator`. New specification
work may not repair or fabricate receipts to bypass this gate.

The gate validates historical initialization, not current HEAD equality or current
intake completion. Later application/specification commits and intake changes do
not erase valid past acceptance. A moved checkout, missing private binding,
shallow/rewritten history or a renamed origin requires explicit reconciliation
of actual evidence; it does not authorize reinitializing or replacing resources.
`assessFullInitializationReceipt(receipt)` exposes pure schema/integrity checks
for public documentation rendering; it is not the complete worktree gate.
