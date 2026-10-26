# From an approved specification to GitHub issues

Use two separate bundled skills after
[specification creation and approval](specification-creator.md):

1. [Specification to issues](../.agents/skills/specification-to-issues/SKILL.md)
   converts the approved functional specification into a local import folder.
2. [GitHub issues import](../.agents/skills/github-issues-import/SKILL.md) validates
   and previews that folder, then publishes it only when the user requests import
   to its exact repository.

A bare invocation asks a short task menu and waits. A concrete task proceeds
directly. Explanation-only and skill-maintenance requests stay in their requested
scope. Creating these skills does not publish any consumer issues.

## Prepare the local package

```text
$specification-to-issues convert the approved specification into ./docs/issue-packages/v1
```

The first prerequisite is the specification owner's `require-approved` check.
Drafts, unresolved blocking questions, changed documents or damaged approval
snapshots stop preparation before output writes. The agent reads the included
functional scope and repository guidance, then writes bounded issues with clear
outcomes, acceptance, relevant verification, ownership and source references.
Choose useful grouping based on actual scope; avoid a fixed issue count or an
assumption that every feature needs the same decomposition.

Missing product rules return to specification revision. Technical proposals stay
within existing architecture and documented patterns; the packaging skill does
not invent business approval, implement code or design unsupported APIs. Explicit
dependencies express execution blockers. Parent/child grouping is separate.

The chosen folder contains a versioned `manifest.json`, readable issue bodies,
label definitions, a README and exact copies of the approved Markdown and public
approval receipt under `source/`. It records the source revision and content
digests, stable package/issue IDs and relationships. Private interview state and
approval words are not copied. Preparation, sealing and preview make no GitHub
calls. The author reviews coverage of included behavior and explicit exclusions;
structural validation cannot prove semantic completeness.

Use a nested folder such as `docs/issue-packages/v1/`, which stays outside the
public dashboard's inputs. The package can contain confidential client material;
committing or publishing it remains a separate action. Preserve manual body edits
and regenerate integrity fields deliberately. A changed approved specification
gets a fresh package; an existing partially imported package retains its identity.

## Preview or import

```text
$github-issues-import preview ./docs/issue-packages/v1
$github-issues-import import ./docs/issue-packages/v1 into OWNER/REPO
```

Preview validates the folder offline and reports the target, source identity,
issue inventory and dependency order without provider calls or writes. When the
consumer checkout is available, also compare the package with its current approved
specification. A standalone copied package retains its pinned historical source;
validation of its hashes is not a new statement of client approval.

An actual import instruction authorizes publication of the named package to the
matching repository. Manifest contents and command switches are not user consent.
Use the intended existing GitHub CLI authentication; verify the target and account
before remote writes. Follow [tracker conventions](agents/issue-tracker.md) and
[triage labels](agents/triage-labels.md). Default new tickets to `needs-triage`:
approval of functional requirements alone does not make a ticket technically ready
for implementation. Reuse existing labels unchanged and create only missing label
definitions from the authorized package.

The importer creates blockers first, records each GitHub number and attaches
parent and blocking relationships after all issue identities exist. Native
relationships use GitHub's [sub-issue](https://docs.github.com/en/rest/issues/sub-issues)
and [dependency](https://docs.github.com/en/rest/issues/issue-dependencies) APIs;
an explicitly selected Markdown-link mode, chosen before the first import,
supports installations where those relationships are unavailable. Authentication,
permission, validation and rate-limit errors remain visible. The importer does
not silently reinterpret those failures as successful publication.

## Resume and preserve work

Import progress lives in the Git-ignored
`.agents/skills/github-issues-import/state/`, bound to target, package identity
and exact digest. Stable issue markers allow reconciliation after interrupted
requests, including issues that are now closed. A lost response is not a reason
to repeat creation blindly. An uncertain result without a uniquely matching issue
stops for reconciliation; conflicting markers or human content changes also stop.

Resume the same import to finish remaining actions. The relationship mode remains
bound to its checkpoint; switching after partial publication needs deliberate
reconciliation rather than deleting state or retrying with another mode.
Preserve human edits, existing
parents and closed states. A complete rerun verifies existing results and creates
no duplicate issues. Retain private import state between sessions and inspect
stale locks instead of deleting state to retry. Local locks cannot coordinate
independent machines or make remote updates atomic; avoid simultaneous imports.

Report actual GitHub URLs, imported/reused/pending issue counts and any unresolved
relationships. Local validation, completed publication and implementation progress
are separate results. No code implementation, deployment or issue closure follows
automatically from publication.

## Verification

```sh
npm --prefix .agents/skills/specification-to-issues run verify
npm --prefix .agents/skills/github-issues-import run verify
```

Tests use synthetic approved consumers and fake GitHub responses, including
interrupted import and duplicate prevention. They do not establish live GitHub
acceptance. Each package's references own its exact file and command contracts.
