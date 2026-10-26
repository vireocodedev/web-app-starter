# Create a functional specification

After full initialization, use the bundled
[specification creator](../.agents/skills/specification-creator/SKILL.md) to define
the product with the client or their representative. It checks completed execution
for this repository before starting or resuming a project task. Missing,
inconsistent or local-only completion stops the workflow with instructions to
finish `$initialization-execution`. The check reads saved evidence locally; it
does not provision services or claim current production health.

## Start or resume

```text
$specification-creator start a specification
$specification-creator start a specification using /path/to/project-brief.md
$specification-creator resume the specification interview
$specification-creator review the current specification
$specification-creator revise the specification for the requested changes
```

A bare invocation offers a short task menu and waits. A concrete request proceeds
directly. The skill uses the repository's bundled initialization completion helper;
install the complete compatible packages when adopting it into an older consumer.
It requires no Client Discovery account, project UUID, API or external workbook.

## Interview and scope

The agent works from the problem, users, desired outcomes and success measures to
release scope, roles, features, workflows, pages and data relationships. Follow-up
questions cover permissions, rules, validation, lifecycle/deletion, UI states and
observable acceptance. Relevant branches cover integrations, notifications,
reporting/import/export, accessibility, localization, usage/performance, privacy,
retention/migration, visual/responsive direction and delivery constraints.

Questions arrive in adaptive numbered rounds with justified recommendations.
Dependent questions wait for their prerequisites. Existing briefs seed established
requirements; uncertainty and contradictions remain explicit. The agent challenges
feature value and simpler alternatives, while the client or developer makes product
decisions. First-release requirements, future possibilities and exclusions stay
separate. Inapplicable topics receive a reason instead of invented requirements.

## Saved progress and approval

Private interview state lives in the Git-ignored
`.agents/skills/specification-creator/state/`. Save each answer batch so a new agent
session can continue from unresolved questions. Store no credentials or sensitive
personal data in answers; use protected references when access is relevant.

Reviewable documents start at `docs/specification/SPECIFICATION.md`, with linked
supporting documents when useful. This nested directory and private state are not
inputs to the public project dashboard. Documents can still contain confidential
client material; committing or publishing them is a separate explicit action.
Use the existing root `CONTEXT.md` as the business terminology owner.

Drafts can retain unanswered questions. A complete specification requires coverage
of applicable topics, resolution of decisions needed for included functionality,
consistency review and the user's explicit approval of the exact revision and
document contents. Checks establish structural consistency, not business truth or
human agreement. Future possibilities can retain questions that do not affect the
included scope.

Before changing an approved specification, preserve its approved documents and
receipt. Identify affected branches, retain unaffected answers and obtain approval
for the revised specification. Manual document changes invalidate the previous
approval's applicability and must be reconciled without overwriting human edits.

The skill creates functional requirements. Architecture, issues, prototypes and
implementation follow separate workflows; specification approval does not perform
or authorize those actions.

## Prepare and import issues afterward

Use [specification to issues](../.agents/skills/specification-to-issues/SKILL.md)
after approval to create a local package from that exact specification revision.
Then use [GitHub issues import](../.agents/skills/github-issues-import/SKILL.md)
for a preview or an explicitly requested publication. The
[issue workflow](github-issue-workflow.md) owns this handoff; changing the approved
specification requires a fresh package rather than silently changing imported scope.

## Verification

```sh
npm --prefix .agents/skills/specification-creator run verify
```

The package uses Node 24 core modules and synthetic local consumer fixtures. CI
also verifies the initialization completion helper and generated public docs.
A real client interview remains necessary to judge question quality and product fit.
