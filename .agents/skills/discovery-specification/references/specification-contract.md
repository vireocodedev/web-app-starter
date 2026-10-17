# Specification package contract

Write only to the explicit output folder. Keep client artifacts in a private
location outside root `docs/*.md` and `docs/acceptance/`, which feed the public
dashboard. A nested folder such as `docs/specifications/project-name/` is not
included by that dashboard. Committing/publishing client data is a separate choice.

The capture helper writes source evidence and copies standalone Node tools.
The AI authors the rest. It must analyse the source; scaffolding alone is not
completion. Choose project-specific content and issue granularity; fixed project
identities, issue counts, source counts or business rules do not belong here.

## Files

```text
OUTPUT/
  README.md
  SPECIFICATION.md
  CONTEXT.md
  DOMAIN-MODEL.md
  DECISIONS.md
  decisions.json
  ACCEPTANCE.md
  IMPLEMENTATION-WORKFLOW.md
  traceability.json
  page-map.json
  source/approved-export.json
  source/receipt.json
  source/analysis.json
  issues/manifest.json
  issues/labels.json
  issues/bodies/ISSUE-KEY.md
  state/generation.json
  state/agent-state.json
  tools/source.mjs
  tools/import-issues.mjs
  tools/validate-package.mjs
```

README explains review, validation, future import and remaining blockers.
SPECIFICATION covers goals, roles, journeys, scope/exclusions, requirements,
relationships, quality and operations. CONTEXT is a concise business glossary;
DOMAIN-MODEL distinguishes source facts from proposed fields, lifecycle and service
contracts. ACCEPTANCE contains observable successful/failure scenarios.
IMPLEMENTATION-WORKFLOW explains claiming a leaf issue, prerequisite decisions,
bounded implementation, verification evidence, PR linkage and next-task handoff.

## Identity and traceability

In `traceability.json`, `decisions.json` and `page-map.json`, use:

```json
{
  "schemaVersion": "1.0.0",
  "source": {
    "projectId": "<captured UUID>",
    "baselineId": "<captured UUID>",
    "baselineVersion": 1,
    "contentHash": "<captured hash>"
  }
}
```

Add `records` to traceability. Copy each `source/analysis.json` record's
`kind`, `id`, `path`, and source `status`/`visible` when present. Add
`disposition` (`mapped`, `context`, `excluded`, `hidden-context`, `not-applicable`
or `unresolved`), `issueKeys`, optional `decisionIds`, and useful `rationale`.
Every source record appears once; source references in issues map back to those
rows. Hidden answers remain `hidden-context`; a missing answer has UNANSWERED
status, not a fabricated confirmed value. Context and exclusions need explicit
dispositions even when they create no task.

The page map adds `pages`, one entry per source page:
`{sourceId, proposedPath, issueKeys}`. Use `null` for an unknown/external path.
Proposed paths do not alter captured routes or imply approved page-feature links.

## Decisions

Add `decisions` to the identity envelope. Each entry contains:

```json
{
  "id": "DEC-001",
  "status": "RESOLVED_TECHNICAL",
  "sourceRefs": [{"kind":"question","id":"question.id","path":"/effectiveCatalog/sections/0/questions/0"}],
  "rationale": "Why the established consumer architecture supports this choice",
  "choice": "The explicit technical solution",
  "owner": "Developer",
  "issueKey": null,
  "affectedIssueKeys": ["APP-T01"]
}
```

Supported states: `RESOLVED_TECHNICAL`, `PROPOSED`, `REQUIRES_INPUT`. Source-delegated
answers can map to a reasoned technical resolution without an open decision issue.
Proposals and input requests that affect implementation use an explicit decision
issue and block their affected tasks; record options/owner in its body. Preserve
all source statuses. Deducing a likely client answer does not confirm it.

## Issues and initial state

[The manifest schema](issue-package.schema.json) describes the portable fields.
Use a project-derived `packageId`, `reviewStatus: "draft"` and `repository: null`
unless an explicit repository assignment exists. Manifest `source` extends the
identity with `environment: "production"`, `exportFile:
"source/approved-export.json"` and `exportFileSha256` from the receipt.

`labelsFile` is `issues/labels.json`: an array of `{name,color,description}`;
color is six hexadecimal characters. Kinds are initiative, epic, story, task and
decision. Use only the levels that help divide actual responsibility.

Each issue contains `key`, `kind`, `title`, `bodyFile: "bodies/KEY.md"`,
`parent` (key/null), `blockedBy`, `decisionBlockers`, `sourceRefs`, `labels`,
`ownerBoundary` and `readiness`. Every decision blocker is a decision-kind issue
and also a `blockedBy` entry. Readiness is `blocked-by-decision` for direct
decision blockers, otherwise `ready-for-spec-review`; this is not coding approval.
All references are stable source IDs plus RFC6901 paths. Source-authored and
analyst-derived dependencies are explained separately.

Every issue body includes its project/baseline/version/hash, bounded outcome,
scope, testable Acceptance, Dependencies, Source sections and completion evidence.
Include the exact marker `<!-- discovery-issue-key: PROJECT_UUID:ISSUE-KEY -->`
once. Immediately below it, include the deterministic source comment returned by
`provenanceFor(manifest.source, issue.sourceRefs)` from `tools/import-issues.mjs`:

```html
<!-- discovery-source: {"projectId":"<UUID>","baselineId":"<UUID>","baselineVersion":1,"contentHash":"<hash>","sourceRefs":[{"kind":"feature","id":"feature-id","path":"/requirements/features/0"}]} -->
```

Copy the exact identity and references from the manifest, including their order.
This comment travels with the published issue; the readable Source section also
explains the relevant facts. Keep keys stable across reviewed revisions; GitHub
numbers are assigned later. A parent is decomposition, not automatically an
execution blocker.

`state/agent-state.json` initially contains
`{"schemaVersion":"1.0.0","phase":"planned","implementationStatus":"unimplemented"}`.
Add useful per-issue ownership/next-action data without claiming work started.
GitHub issues and PRs become canonical execution records after publication;
publication-state mappings are distinct from coding progress.

## Validation and later publication

```sh
node OUTPUT/tools/validate-package.mjs --package OUTPUT
node OUTPUT/tools/import-issues.mjs --package OUTPUT
```

Both are local, credential-free checks. Validation checks exact source bytes,
approval identity, the generation checkpoint and copied tools, record coverage,
decision consistency, issue provenance, source pointers, local links and issue
graphs. Human review assesses semantic fidelity and suitability; passing file
checks cannot establish client approval.

When the user explicitly requests publication to an existing repository:

```sh
node OUTPUT/tools/import-issues.mjs --package OUTPUT --repo OWNER/REPO --apply
```

GitHub CLI must already have the intended account and issue/label write access.
Explicit apply creates labels/issues and native parent/sub-issue and blocked-by
relationships, using database IDs. Default runs never contact GitHub. If native
relationships are unsupported, an explicit `--relationships body-links` fallback
produces resolved Markdown links instead. It is not silently selected.

Retain `.import-state/` between runs. Exact markers recover interrupted creations
and closed issues; duplicate markers or human body drift stop writes. No automatic
POST retries, parent replacement, issue closing/reopening or rollback occurs.
Avoid simultaneous imports/body edits; local locking cannot coordinate machines
or make GitHub body updates atomic. Inspect partial results after failures.
Future baseline refresh is a reviewed revision that preserves source/progress.

GitHub contracts: [issues](https://docs.github.com/en/rest/issues/issues),
[sub-issues](https://docs.github.com/en/rest/issues/sub-issues),
[dependencies](https://docs.github.com/en/rest/issues/issue-dependencies).
