# Functional specification output

Write reviewable, sanitized Markdown under `docs/specification/`. Start with
`SPECIFICATION.md`; add supporting files only when they improve review, such as
`FEATURES.md`, `PAGES.md`, `DATA.md`, `DECISIONS.md` and `ACCEPTANCE.md`. The helper
accepts simple uppercase Markdown filenames, not arbitrary output paths. Keep the
entry point concise with working relative links to the supporting detail.

The specification describes the problem, users, outcomes, first release, future
possibilities, exclusions, functional behavior, constraints and responsibilities.
Use stable feature/page/entity/decision/acceptance IDs and source/question references
so changes and contradictions can be followed across documents. Identify actual
source statements, confirmed user decisions, proposals and unresolved questions.
A requirement table or matrix can expose missing acceptance, data or permission
coverage; it cannot replace the behavior descriptions.

Describe data at the business level: meaning, fields, cardinality, ownership,
lifecycle, invariants and deletion. Reuse and link root `CONTEXT.md` as the glossary
owner; do not create a competing glossary or nested CONTEXT.md. Follow the consumer's
domain-modeling instructions when a real glossary update is needed. Record conflicts
with existing ADRs for a separately authorized architecture decision. Keep technical
architecture, endpoint design, SQL migrations and implementation backlog outside
this skill's outputs.

Drafts clearly identify incompleteness. Before approval, review cross-document
consistency and verify links, source/decision traceability and the completeness of
included workflows. The helper checks state structure, prerequisites, topic
coverage and hashes. The agent and client retain responsibility for semantic
accuracy, useful acceptance and product fit. Never treat a machine check as approval.

Record the actual human approval words only in private state. Public version
receipts contain repository, revision, digest, timestamp and document hashes.
`versions/approved-NNN/` preserves the exact approved Markdown before later edits;
those snapshots remain reviewable and can be version controlled. Private approved
interview snapshots remain in the ignored state directory.

Keep source originals in their existing protected location and retain their
content identity in private state. Never copy confidential notes, interview state,
credentials or private source paths into public dashboards. The skill does not
stage, commit, publish issues or modify remote systems. Initialization acceptance,
requirements approval and acceptance of implemented software remain distinct.

## Downstream issue handoff

The [specification-to-issues skill](../../specification-to-issues/SKILL.md) owns
decomposing approved functional scope into bounded issue bodies and a portable
manifest. It must use `require-approved` and copy only the exact public approved
snapshot, not private interview state. A missing business rule returns to this
specification's revision workflow. The
[github-issues-import skill](../../github-issues-import/SKILL.md) owns subsequent
explicit publication and private import progress. Neither step is implicit in
specification approval, and imported tickets do not report implemented behavior.
