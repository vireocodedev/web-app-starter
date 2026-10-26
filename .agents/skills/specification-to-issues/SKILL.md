---
name: specification-to-issues
description: Convert an approved functional specification into a local, validated issue package for later GitHub import. Use to prepare, resume or check issue files; publication belongs to github-issues-import.
---

# Specification to issues

## Start

For a bare invocation or capability question without a task, ask: “Prepare issue
files, resume a draft package, validate a package, or describe another task?” Wait
for the answer before inspecting task files. Concrete tasks proceed directly.
Explanation-only requests stay read-only. Skill-maintenance requests stay within
the requested editing scope and do not start the project workflow.

Project generation first runs the specification owner's `require-approved` through
`scripts/package.mjs prepare`. If initialization or current specification approval
is missing, incomplete or changed, STOP before output writes and direct the user
to `$specification-creator`. Never repair approval evidence or fill product gaps.

## Workflow

1. Read applicable repository guides, issue-tracker/triage conventions and the
   [decomposition contract](references/decomposition.md). Use the approved public
   snapshot and the existing repository's documented boundaries to plan coherent
   issues. Separate hierarchy from actual execution blockers.
2. Run `prepare --root ROOT --output DIR` using [package commands and format](references/package.md).
   Ask for an output folder only when none is supplied or inferable; a sensible
   proposed location is `docs/issue-packages/specification-NNN/`. Existing folders
   are preserved. Resume an existing draft rather than preparing over it.
3. Author issue Markdown and manifest metadata with stable IDs, ownership, exact
   source references, acceptance and relevant verification. Cover included scope,
   with sensible epic/task grouping where useful. Return newly discovered product
   ambiguities to specification revision; architectural work can be an explicit
   bounded planning issue rather than an invented implementation contract.
4. Review coverage, dependencies, scope fidelity and private-data exclusion. Read
   human-edited files before changes; preserve their intent. Run `seal --root ROOT
--package DIR` only after reviewing the authored package. It rechecks current
   approval and updates integrity fields without rewriting bodies.
5. Run `validate --root ROOT --package DIR` and review the source-to-issue mapping.
   A passing mechanical check does not establish useful decomposition, technical
   readiness or approval of a new business rule. When source approval changes,
   preserve the old package and create a new one against the approved revision.

## Finish

Report the folder, approved iteration/revision/digest, issue inventory, dependencies,
coverage and unresolved technical planning needs. Completion means the authored
package passes validation and faithfully covers the approved included scope.
Hand off with `$github-issues-import preview DIR` or an explicitly requested import.
This skill makes no GitHub calls, writes no implementation code and publishes
nothing. Functional approval does not automatically confer `ready-for-agent`.
