# From approved scope to bounded issues

Read the copied public specification, relevant repository guides and current
source examples. Reuse actual capability owners; filenames or existing screen
names alone do not establish the right boundary. Source approval settles functional
requirements, not new architecture choices or permission to implement them.

Cover each included feature, page/workflow, data rule and acceptance scenario.
Use a compact coverage table in the package README when it helps expose omissions.
Future/excluded requirements remain outside the implementation backlog. An issue
may reference them to explain a boundary, never to silently include them.

Choose tasks by a coherent observable outcome that a reviewer can assess. Include
the supporting UI/API/data/locale/docs work needed for that outcome where applicable;
avoid automatically splitting every feature into one issue per technical layer.
Use epic grouping when multiple independently reviewable outcomes share a goal.
An epic has aggregate acceptance and explicit children, not a second implementation
of the same work. Parent grouping does not imply blocking. `dependsOn` records
only genuine prerequisites. Define owners as capability/responsibility boundaries,
not guessed GitHub assignees.

Every body contains nonempty sections:

```markdown
## Outcome

The observable user or developer result.

## Scope

Included behavior and explicit boundaries, including applicable failure paths.

## Acceptance criteria

- Observable success, validation, permissions and failure scenarios from the approved source.

## Verification

Relevant existing checks and manual acceptance, with any later planning needed.

## Decisions

Source-backed settled choices and any separately owned technical planning needs.

## Source

Approved document names and stable requirement/acceptance IDs.

## Dependencies

Local issue IDs for actual blockers; state None when there are none.
```

Make these sections specific to the issue. The helper checks structure and exact
source references, while the agent reviews semantic coverage and meaningful
acceptance. Missing requirement IDs must be added through the specification owner
and approved; don't edit the retained snapshot. A missing product rule returns
the affected source branch to specification revision instead of inventing policy.

Resolve routine technical detail only within documented patterns and delegated
authority. Where architecture needs a consequential decision, write a bounded
planning issue with its questions, inputs, decision owner and expected reviewable
result; make dependent implementation issues explicit. Default issues to
`needs-triage`. `ready-for-agent` requires actual implementation readiness and
the repository's decision process, not functional approval alone.

Use canonical triage labels and meanings from `docs/agents/triage-labels.md`.
Label definitions allow the importer to create exact missing labels if authorized;
they do not authorize changing existing labels. Keep secrets, raw interview
answers, source originals and actual approval words outside the package. Review
sanitization even when the heuristic credential check passes.
