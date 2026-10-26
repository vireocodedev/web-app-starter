# Private, resumable specification state

Use Node 24 and the helper bundled with the selected consumer. Every command
first calls its sibling execution completion gate, including status, validation,
resume and approval. It checks full initialization, consumer identity and exact
saved initialization digest before reading interview state. It makes no provider
requests. Missing helpers, partial/local-only initialization or changed evidence
stop the operation. Reconcile changed initialization evidence under its owner;
never silently rewrite a specification's initialization binding.

From the consumer root:

```sh
node .agents/skills/specification-creator/scripts/specification.mjs init
node .agents/skills/specification-creator/scripts/specification.mjs status
node .agents/skills/specification-creator/scripts/specification.mjs save --input /private/answers.json
node .agents/skills/specification-creator/scripts/specification.mjs validate
node .agents/skills/specification-creator/scripts/specification.mjs approve --input /private/approval.json
node .agents/skills/specification-creator/scripts/specification.mjs require-approved
node .agents/skills/specification-creator/scripts/specification.mjs revise --input /private/change.json
```

All commands accept `--root /absolute/consumer`. `--input -` reads JSON from stdin;
file inputs must be user-owned regular 0600 files. Never construct shell commands
by interpolating answers. Status exposes IDs, readiness and hashes rather than
answer values. Read the private JSON through a local file tool when resuming.

State lives at `.agents/skills/specification-creator/state/interview.json`.
The ignored directory must be 0700 and files 0600. The helper rejects unsafe
symlink/hardlink paths, uses an exclusive write lock, atomically replaces state,
and requires `expectedRevision` on every mutation after init. A revision conflict
requires reloading and merging answers. Inspect writers and unfinished transactions
before removing a stale lock; do not delete state as a retry mechanism.

## Save answers and documents

`init` preserves an existing interview. New state has revision 0, iteration 1 and
an unresolved inventory of 24 topic families (the `topicIds` export). A save merges
named entries, increments revision and writes a draft. Entries are whole records,
not deep patches. Changing a previously settled question reopens its topic and all
transitive dependent questions/topics. Even dependent answers included in the same
batch are reopened: reconfirm them in a later round after the prerequisite settles.
Unrelated decisions remain intact. Reassess affected topic coverage before validation. Example:

```json
{
  "expectedRevision": 0,
  "questions": {
    "problem_statement": {
      "topic": "problem",
      "prompt": "What recurring problem does the app solve?",
      "recommendation": "Keep the first release focused on the agreed recurring problem.",
      "dependsOn": [],
      "status": "answered",
      "answer": "Coordinators need one shared view of appointment availability.",
      "provenance": "user",
      "sourceIds": [],
      "blocking": true,
      "decisionEvidence": "The user confirmed that coordinators and availability are the initial focus."
    }
  },
  "topics": {
    "problem": {
      "status": "addressed",
      "rationale": "Problem, current workaround and affected users were confirmed.",
      "questionIds": ["problem_statement"]
    }
  }
}
```

Question IDs are stable lowercase identifiers. Dependencies must exist and form an
acyclic graph. `status` is `unknown`, `proposed`, `answered`, `deferred` or
`not_applicable`; `provenance` is `user`, `source` or `proposal`. Non-unknown records
need a nonempty answer/rationale. Answered analyst proposals are rejected. User
answers and inapplicability decisions need actual decision evidence; source-derived
answers need source IDs. Preserve unanswered questions as unknown, not guessed
answers. Every conflict is a blocking question referencing conflicting source IDs.

Sources are a map such as:

```json
{
  "client_notes": {
    "kind": "file",
    "reference": "/protected/location/client-notes.md",
    "sha256": "the-64-character-lowercase-SHA256-of-the-exact-source-bytes"
  }
}
```

Use `kind: conversation` for actual message evidence, with a stable reference and
digest of the retained statement. Compute hashes from the actual contents, not a
file name or mutable URL. The helper checks reference integrity and digest shape;
the agent must check source bytes on adoption/resume, flag changes and preserve
previously reviewed source identities. Source IDs are immutable: changed source contents require a new source ID. Source edits do not authorize silently
updating requirements. Ask whether to revise and trace the affected branches.

Topic `status` is `unresolved`, `addressed` or `not_applicable`, with a rationale
and the question IDs covering it. Addressed topics require settled questions;
inapplicable topics require a rationale and settled referenced questions. Problem,
users, outcomes, scope and acceptance cannot be inapplicable. Unknown/proposed/
deferred blocking questions and settled questions with unsettled prerequisites
prevent readiness. Deferred future/excluded questions can be nonblocking with
explicit rationale; semantic review must confirm included behavior does not depend
on them. The machine cannot prove that a topic's answers are sufficiently detailed.

A `documents` patch maps uppercase Markdown filenames to their full UTF-8 content.
It writes only `docs/specification/` and records exact hashes. `SPECIFICATION.md`
is required for readiness. Manual edits cause a manifest mismatch and are preserved;
review and adopt them using a separate save with `adoptDocuments: true` before
further output changes. An unexpected document inventory or an interrupted partial
write requires explicit reconciliation. Recheck links and semantic coverage after
adoption. The helper does not overwrite manual edits automatically.

## Approval and revisions

`validate` succeeds only with complete structural coverage, no blocking questions
and a matching document manifest. `status`/`validate` return the current revision,
`reviewDigest` and `documentHashes`. Present the exact revision and documents for
human review. Approval input must bind those exact reviewed values:

```json
{
  "expectedRevision": 12,
  "reviewedDigest": "the-reviewDigest-returned-for-revision-12",
  "reviewedDocuments": { "SPECIFICATION.md": "its-exact-SHA256" },
  "confirmation": {
    "response": "The actual human response approving this reviewed specification."
  }
}
```

`approve` increments revision, records actual approval words in private state and
binds the receipt to the state and exact Markdown hashes. It also preserves a
private `state/approved-NNN.json` and public `docs/specification/versions/approved-NNN/`
Markdown snapshot with a sanitized receipt. Both snapshots are required later;
they are historical evidence, not a signature or proof that the agent recorded the
human faithfully. `require-approved` rejects changed state/documents/snapshots.
Public receipts never include interview answers, private source paths or approval
words. No commit or publication occurs.

An approved interview rejects save; begin a change with:

```json
{
  "expectedRevision": 13,
  "affectedQuestionIds": ["problem_statement"],
  "reason": "The actual request changing the target users or their problem."
}
```

`revise` verifies preserved approval snapshots, increments iteration/revision,
reopens the specified questions and all transitive dependents, marks their topics
unresolved, and preserves unaffected answers. It captures current manual document
edits without erasing the approved snapshot. The current draft loses approval;
resolve affected branches, update the relevant requirements and obtain approval
again. New branches can then be added through normal save. Add explicit dependency
edges before approval so impact propagation reflects the real product relationships.

Credential scanning is heuristic, not proof that free text is safe. Keep credentials
in protected storage, review output sanitization, and confirm ignored state is not
staged. Never force-add private state or include it in dashboards.
