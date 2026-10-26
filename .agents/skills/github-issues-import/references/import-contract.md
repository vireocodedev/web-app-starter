# Import contract

## Commands and authority

From the consumer checkout with Node 24/npm 12:

```sh
node .agents/skills/github-issues-import/scripts/import.mjs plan --package docs/issue-packages/v1
node .agents/skills/github-issues-import/scripts/import.mjs apply --package docs/issue-packages/v1 --repo OWNER/REPO
```

`plan` is offline: it validates the sibling specification-to-issues package, approved copied source and current source when a consumer root exists, resolves the target against Git origin, and prints labels/order/relationships. It writes neither checkpoints nor remote resources. `apply` requires the user's import instruction naming that package and repository. The CLI flag identifies the target; it does not prove conversational authorization. A bare skill invocation waits for a selected task.

`--root /absolute/consumer` selects another checkout. The CLI otherwise detects the current Git root. Outside a checkout, a portable copied package requires `--repo OWNER/REPO` and verifies its copied approval/source evidence. It cannot establish whether that source has subsequently changed in its original checkout. In a checkout, a differing origin or no current approval stops the import.

## Published content and labels

One Markdown body becomes one issue, preserving its bytes and adding a deterministic package/item marker and readable approved-source iteration, revision, digest and references. The reserved `<!-- issue-package` namespace belongs to this importer. Duplicate/spoofed markers or title/body drift stop publication. GitHub issue database IDs, numbers and exact target URLs are distinct values; relationships use database IDs.

Existing labels retain their color/description. Only missing labels declared by the validated package are created. Existing issue labels/lifecycle are preserved. The packaging owner defaults new issues to `needs-triage`; functional approval is not coding authorization. This importer does not publish comments, grant implementation readiness, assign users, close/reopen/delete issues or replace manual edits.

Blockers are created before their dependents. Parent grouping has its own graph and is attached only after all issue numbers exist; parent grouping does not imply blocking. Native sub-issue and blocked-by endpoints are the default. If these capabilities are unavailable, explicitly select `--relationship-mode body-links` to publish an importer-owned relationship section containing parent, child and blocker URLs. The selected mode is pinned in the checkpoint. Authentication, validation and rate-limit failures stop; they never silently switch modes. Closed issues are reused and preserved, including their existing bodies and relationships; report any relationships intentionally skipped for those records.

## Resume and conflicts

Private checkpoints live under this skill's ignored `state/<repository-hash>/<package-id>.json`. Atomic writes, fsync, private modes and an exclusive local lock protect the original repository, package digest, relationship mode, mappings and per-action intent/outcome. Pending intent is durable **before** every remote mutation. Packages and consumer origin are checked again before each mutation.

Resume enumerates all open/closed issues, excludes pull requests and reconciles exact stable markers. A single marker with the expected title/body recovers a successful create whose response was lost. Multiple matches, missing previously mapped issues and manual title/body edits stop. Importer-owned body changes accept only the recorded before/after variants while pending. Successful imports can be rerun without remote writes.

A pending mutation whose result cannot be observed remains uncertain. Preserve it and inspect/reconcile GitHub rather than automatically retrying a create. The same conservative rule applies to ambiguous label or relationship requests. A definitive rejection can be diagnosed from the bounded HTTP status, but this helper intentionally keeps its original intent until an operator resolves it; deleting checkpoints is not a retry procedure. Stale locks require checking active writers first.

A local lock does not coordinate other machines. Concurrent imports from another machine or manual changes between a final read and write remain possible. Use one publisher for a package/target. The GitHub API has no transaction spanning all tickets; successful earlier actions remain when later steps stop. No live GitHub import is required when developing this skill: tests inject a fake transport.

## Maintainer API references

The transport uses bounded `gh api` argument lists and JSON stdin, configured gh authentication and GitHub API version `2026-03-10`; it never places credentials in arguments or reports raw stderr. Providers must return the same repository identity, exact issue URLs, valid database IDs and bounded paginated lists. Network failures and malformed responses after writes retain uncertainty.

- [GitHub CLI API](https://cli.github.com/manual/gh_api)
- [Issue creation and retrieval](https://docs.github.com/en/rest/issues/issues)
- [Repository labels](https://docs.github.com/en/rest/issues/labels)
- [Sub-issues](https://docs.github.com/en/rest/issues/sub-issues)
- [Issue dependencies](https://docs.github.com/en/rest/issues/issue-dependencies)

These helpers implement the repository's [tracker conventions](../../../../docs/agents/issue-tracker.md) and [triage roles](../../../../docs/agents/triage-labels.md). Validate an import using its exact package, source approval, target, real mappings and observed relationship mode. Passing mock tests establishes local behavior only.

Select body-links before the initial apply when native capabilities are unavailable. An existing native checkpoint cannot simply switch modes: preserve its mappings and pending intents and resolve the capability failure with a bounded, explicitly reviewed reconciliation. Deleting the checkpoint or silently changing modes can lose evidence of earlier successful writes.
