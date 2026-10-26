# Issue tracker: GitHub

Issues and specifications live in this repository's GitHub Issues.
Use the `gh` CLI from the checkout; infer the repository from its Git remote.

## Operations

- Create: `gh issue create --title "..." --body-file <file>`.
- Read: `gh issue view <number> --comments`.
- Read structured details:
  `gh issue view <number> --json number,title,body,labels,comments`.
- List:
  `gh issue list --state open --json number,title,body,labels,comments`.
  Set label, state and result limits for the task.
- Comment: `gh issue comment <number> --body-file <file>`.
- Label:
  `gh issue edit <number> --add-label "..." --remove-label "..."`.
- Close: `gh issue close <number>`.

Write multiline issue bodies and comments to a temporary file, then pass
that file with `--body-file`.

When a skill says "publish to the issue tracker", create a GitHub issue.
When it says "fetch the relevant ticket", read the issue and its comments.

## Ticket relationships

Publish one issue per approved ticket, with blockers published first.
Use native blocking and sub-issue relationships where available.
Otherwise, record explicit "Blocked by" references in each ticket and link
children from the parent. Parent-child grouping alone does not imply blocking.

## Pull requests as a triage surface

**PRs as a request surface: no.**

## Workflow ownership

The root AGENTS.md and the workflow owning the task govern authorization
and delivery. These conventions specify how to use the tracker.
