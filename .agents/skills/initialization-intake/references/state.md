# Private state and helper API

For a local practice session, first read [dry runs](dry-run.md). Add `--dry-run`
and the selected `--session NAME` to practice commands; its isolated state never
satisfies the real completion gate. The commands below describe real intake.

Run Node 24 from the consumer root (use its local Node launcher when needed):

```sh
node .agents/skills/initialization-intake/scripts/intake.mjs init --root /absolute/consumer
node .agents/skills/initialization-intake/scripts/intake.mjs status --root /absolute/consumer
node .agents/skills/initialization-intake/scripts/intake.mjs save --root /absolute/consumer --input /private/patch.json
node .agents/skills/initialization-intake/scripts/intake.mjs complete --root /absolute/consumer --input /private/confirmation.json
node .agents/skills/initialization-intake/scripts/intake.mjs require-complete --root /absolute/consumer
```

`--input -` reads JSON from stdin, avoiding scratch files. File inputs must be
user-owned regular 0600 files. The helper uses Node core and local Git only;
status and execution gating create no files and make no API requests. A helper
invoked from elsewhere still writes inside the selected consumer, never beside
its source helper. Use matching installed helper bytes for that consumer.

`init` creates missing private state and preserves existing state. `status`
returns completion, revision, missing/invalid IDs, proposed/answered IDs and
blocked prerequisites, without printing answers/evidence. Missing fields are
unanswered; proposed and unknown values remain incomplete. Inspect the private
file to resume actual answers; never copy it to public artifacts.

`save` shallow-merges field entries, increments the revision and clears any
completion. Every patch supplies the revision just read; a conflict requires
reloading and merging rather than overwriting another session. Example:

```json
{
  "expectedRevision": 0,
  "answers": {
    "display_name": { "status": "answered", "value": "Inventory" },
    "backup_timezone": { "status": "proposed", "value": "Europe/Zagreb" },
    "initial_email": { "status": "unknown" }
  },
  "prerequisites": {
    "app_consent": {
      "status": "blocked",
      "evidence": "Owner still needs to select this repository."
    }
  }
}
```

Answer statuses are `answered`, `proposed`, `unknown`. Preserve the user's value,
including invalid answers, and clarify them; the gate rejects invalid required
answers rather than silently normalizing them. Prerequisites are `ready`,
`blocked`, `unknown`; `ready` requires nonempty nonsecret evidence. Unknown fields
and top-level `approved`/`complete` flags are rejected. All IDs and value contracts
come from [the catalog](../scripts/schema.mjs).

After all required questions and prerequisites are satisfied, show the full
resolved plan and action list. Supply the actual user response:

```json
{
  "expectedRevision": 4,
  "confirmation": {
    "response": "Use those targets and proceed with the listed setup actions."
  }
}
```

`complete` validates the current answers and evidence, increments the revision,
and records the response and timestamp with a SHA-256 binding to all inputs,
repository/worktree, revision and installed helper/schema bytes. It cannot prove
that a response came from a human; the agent must preserve the real chat response
and its meaning. This is an accidental-drift gate, not a cryptographic signature
or standing execution authority. The explicit execution request remains required.

`require-complete` succeeds only for valid completed state matching this exact
consumer. It returns `complete`, `statePath`, `revision`, `repository`, `scope`
and `digest` (plus progress IDs); execution reads answers from `statePath` and
retains the digest with its own `.template-initialization` phase evidence. Missing,
partial, malformed, edited, stale or mismatched state exits nonzero and explicitly
directs the user to finish `$initialization-intake` before execution.

The ignored `state/` directory is 0700; JSON/temp/lock files are 0600. Writes are
atomic with an exclusive writer lock and revision check; symlinked state/helper
paths and hard-linked state files are rejected. If a process crashes with a lock,
inspect active writers and the unchanged JSON before removing only that stale
lock. Never delete the JSON as a retry shortcut.

Changed helpers/schema make old completion stale. Inspect the saved answers
against the current catalog and use `save` with the old revision to reconcile
any answers/prerequisites, adopting the current schema and clearing completion;
review and complete again. A changed repository/worktree requires explicit
identity reconciliation: preserve the old file privately, verify actual origin,
then initialize the new target and re-confirm applicable answers. Never silently
rebind completed state or replace another project's intake.

This folder's `.gitignore` and the repository ignore protect normal publication.
Before committing, verify `state/intake.json` is ignored and absent from staged
files; never force-add it. Secret-pattern checks catch common mistakes but cannot
determine whether arbitrary text is a credential: record references only.
