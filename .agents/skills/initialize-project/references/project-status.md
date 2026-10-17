# Project status and next step

Use this advisory check when the developer invokes the skill without a task or
asks where the project stands. It connects the consumer checkout to the intended
production Client Discovery project without starting initialization.

```sh
node .agents/skills/initialize-project/scripts/project-status.mjs PROJECT_UUID --remember
node .agents/skills/initialize-project/scripts/project-status.mjs
```

The first command remembers an explicitly supplied UUID after a successful
authenticated lookup. Later invocations resolve that protected association, or
an existing preparation capture's provenance. With no association, ask for the
project ID once. Do not enumerate the account's other projects or infer identity
from names, template examples or previous conversations.

The helper uses the same Node-core authentication and owner-only production
profile as preparation capture. See [credential setup](./preparation.md#0-prepare-and-review-in-client-discovery).
`--root PATH` selects another Git worktree; `--profile PATH` and `--api-url URL`
support an explicitly selected source. Production is the default. Report the
actual source, especially when it is overridden. The association records project
ID, API base and repository under ignored
`.template-initialization/discovery-project.json`, with directory mode `0700`
and file mode `0600`. It contains no credentials or initialization authority.

Status without `--remember` writes no files. Remembering preserves workbooks,
provenance, resume records, acceptance and existing associations. Conflicting
project, repository or source identities require deliberate reconciliation;
changing the command-line ID does not silently replace a saved association.
Authentication creates and closes only its own session. Project status calls
use metadata GETs and never request the scope-export endpoint, which records an
export in the project's activity log. The actual export capture is a later task.

## Read the three states separately

| State | Meaning and next step |
| --- | --- |
| Preparation absent or incomplete | Complete the project's Developer preparation topics and save. Report missing/invalid field IDs without printing private answers. |
| Preparation awaiting review | Explicitly review the current saved revision in the app. Saving alone is insufficient. |
| Reviewed plan | A planning handoff is available; execution remains unapproved. Complete execution answers and review when initialization should run. |
| Preparation expired or invalid | Correct/renew it in the app and review the updated revision. Never fill consents or signatures automatically. |
| Preparation ready for execution | Current revision, compatible contract, complete applicable checks, valid written authorization and review agree. Live provider readiness is still checked during the selected setup task. |
| Initialization not started or partial | Show the first pending/blocked contract phase and preserve independently passed work. Setup/resume uses the existing readiness and written-authority gates. |
| Initialization completion recorded | Consumer-matched acceptance records all required phases. This is recorded evidence, not a new inspection of live deployments. Preserve completed consumers even if preparation later changes or expires. |
| Scope draft | Continue client Discovery, then freeze a candidate for review. This does not prevent independent developer preparation. |
| Scope under review | Show whether the administrator and designated client approved the exact same hash. Missing approval and awaiting lock are separate states. |
| Approved, awaiting lock | Both independent approvals exist; an administrator must lock that candidate. Approval alone does not make it exportable. |
| Locked scope available | A valid LOCKED baseline with matching independent approvals is eligible for administrator export. Offer specification generation after initialization, asking for the output folder only when that task is chosen. |

A new draft or review candidate can coexist with an older locked baseline.
Report both the **current scope** and the **latest available locked export**, with
their versions. Do not describe unapproved new changes as part of the old export.
No `APPROVED` scope state exists: approval readiness is derived from the
administrator and designated client's independent same-hash approvals.

Unavailable APIs, schema incompatibility, 401/403, project 404, malformed data and
network errors are unknown/error states with distinct explanations. A missing
preparation endpoint on an older deployed app is not proof of an empty form.
Preserve independently observed status where possible; never manufacture a
ready or incomplete result from an access failure.

Local initialization status comes from the actual Git origin and consumer-matched
resume/acceptance records. Copied template receipts, an arbitrary `ready` flag,
file presence or configured deployment YAML cannot establish completion. The
[initialization contract](./contract.md) owns the ordered setup phases and their
evidence. If a record is malformed or belongs to another repository, report the
discrepancy rather than treating it as a passed gate.

## Present an actionable report

Use a compact table with project/source, developer preparation, recorded setup,
current scope, and latest locked export. Give one next action, together with any
independent work that can already proceed. Prefer identity/access reconciliation
first; for incomplete setup, preparation/review/renewal or the next setup phase;
after setup, the current scope's approval/lock step and specification handoff.
Interpret the returned state fields: a successfully printed report can contain
unavailable or blocked states and is not itself a readiness pass.

For example, an observed initialized consumer with reviewed execution preparation
and fully approved but unlocked scope should say:

> Setup completion is recorded. Developer preparation is reviewed and valid.
> Scope version 2 has both approvals and awaits administrator locking.
> Lock that version, then generate its specification into your chosen folder.

After a bare invocation's report, offer initialize/resume, live readiness,
specification generation, or refresh status, with free-text input. Wait before
starting the selected task. A concrete status request ends with the report.
The baseline lock proves neither a completed specification nor issue publication
or application implementation; those require their own artifacts and instructions.
