# From a cloned template to a production V1

Use this guide to coordinate a new consumer from its first clone to an accepted,
deployed business V1. Each linked owner supplies its detailed procedure and
authority; this overview adds no execution or publishing permission. The skills
assist separate tasks. They do not automate the entire journey in one invocation.

## Stage map

| Stage                                 | Completion evidence                                                                                    | Procedure owner                                                                                                                                   |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Clone and check capabilities       | Intended consumer checkout and complete compatible workflow packages                                   | [Template initialization](template-initialization.md)                                                                                             |
| 2. Prepare developer setup            | Saved, explicitly reviewed preparation valid for the selected planning/execution task                  | [Preparation guide](../.agents/skills/initialize-project/references/preparation.md)                                                               |
| 3. Initialize the consumer            | Consumer-specific local, CI, deployment and recovery acceptance for the authorized setup scope         | [Initialization contract](../.agents/skills/initialize-project/references/contract.md)                                                            |
| 4. Agree business V1                  | Administrator and designated-client approvals of the same hash, then explicit `LOCKED` version         | Client Discovery **Scope approvals**                                                                                                              |
| 5. Generate and review specification  | Pinned source receipt, traceability, decisions, acceptance scenarios and validated local issue package | [Discovery specification](discovery-specification.md)                                                                                             |
| 6. Publish the approved issue handoff | Explicit target, actual imported issues and retained import mapping                                    | [Specification package contract](../.agents/skills/discovery-specification/references/specification-contract.md#validation-and-later-publication) |
| 7. Implement bounded issues           | Linked PRs, relevant passing checks/CI and issue completion evidence                                   | Generated `IMPLEMENTATION-WORKFLOW.md` and repository guides                                                                                      |
| 8. Accept V1 on staging               | Tested image pair, business acceptance results and resolved release blockers                           | Generated `ACCEPTANCE.md` and [release owner](../infrastructure/release/README.md)                                                                |
| 9. Promote and hand over              | Exact accepted image pair in production, smoke/recovery evidence and current operating docs            | [Release owner](../infrastructure/release/README.md)                                                                                              |

Developer preparation/initialization and client discovery can proceed in parallel.
Specification generation needs both the initialized consumer context and the
intended locked business baseline. A deployed production skeleton completes
setup; the business V1 is complete only after implementation and acceptance.

## 1. Clone and check the workflow capabilities

Create a consumer using GitHub **Use this template**, clone it and open its trusted
workspace. Confirm its Git origin and existing work before requesting changes.
Keep any already completed initialization and consumer evidence intact.

Check the checkout's actual packages and documentation before using these examples.
Older clones may lack the specification skill, project-status helper or reviewed
preparation capture. Adopt the complete compatible packages, including scripts,
references, metadata and tests, with their corresponding project documentation.
This journey uses both `.agents/skills/initialize-project/` and
`.agents/skills/discovery-specification/`; an initializer-only copy is insufficient.
Follow [skill registration](../.agents/skills/initialize-project/references/runbook.md#codex-skill-registration)
when the packaged skills are not discoverable. Reconcile adoption with local edits.

Use the intended **production Client Discovery project UUID**, not a project name
or a UUID copied from an example. Configure the protected user-local Discovery
administrator profile through the [preparation guide](../.agents/skills/initialize-project/references/preparation.md#0-prepare-and-review-in-client-discovery).
Forms and committed documents contain protected credential references, never
passwords, tokens, private keys or recovery codes. Application login credentials
and Discovery export credentials serve separate systems.

## 2–3. Prepare and initialize independently of business scope

In that production project's **Developer preparation**, complete applicable setup
topics: repository and application identity, existing operator, access, domains,
initial account, backups and permitted actions. Save the preparation, review the
exact saved revision and explicitly record that review. A reviewed planning
request supports planning; execution needs its required checks, bounded actions,
signer and valid authorization window. Changes require saving and review again.

Preparation has its own revision. Business approval/locking neither completes it
nor grants infrastructure authority; it remains editable independently. The agent
still verifies the actual checkout, resources and live readiness before execution.

In the consumer workspace, use these skill invocations (replace `PROJECT_UUID`):

```text
$initialize-project
$initialize-project initialize this consumer from production project PROJECT_UUID
```

The bare invocation shows three independent states: developer preparation,
recorded consumer initialization, and current business scope/available locked
export. Supply the UUID when first requested; the successful association is saved
privately. It then offers the existing task menu. It does not inspect issue or
implementation progress, capture an export, or start setup. Unknown/access errors
remain unknown. See [status meanings](../.agents/skills/initialize-project/references/project-status.md).

The concrete initialization request captures the reviewed preparation privately,
checks written authority/readiness and follows the [runbook](../.agents/skills/initialize-project/references/runbook.md).
Keep capture, readiness and resume state under ignored `.template-initialization/`.
Full setup needs actual consumer evidence for local development, CI/protection,
staging, production and initialized recovery. Explicit local-only scope completes
only that bounded task. Use current receipts and live results where required;
template receipts and manually checked boxes do not prove consumer completion.

## 4. Client Discovery checklist for the business V1

In Client Discovery, open **Account → User manual → From template to production V1** for exact controls and recovery instructions.
Save business-scope changes before review; preparation uses its separate save.
Use the following checklist to establish scope, not to claim delivered code works:

| Section                        | What to settle or explicitly leave unresolved                                                                                                                                                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **People & access**            | Invite the client account and have them accept membership. An account invitation supports review/approval; a buyer answer link only collects questionnaire answers without an account. Send generated links yourself and keep them private.     |
| **Discovery**                  | Work through every applicable category: goals, users, journeys, permissions, integrations, quality and operating constraints as presented by the captured catalog. Answer required questions; record real uncertainty or delegation explicitly. |
| **Features**                   | Describe each V1 capability, user, delivery priority, observable acceptance criteria, dependencies and constraints. Record exclusions and later scope. A feature is a capability, independent of how many screens display it.                   |
| **Pages & screens**            | Add useful screen purpose, route, audience, access and feature links where known. Pages and their optional details are not mandatory placeholders for every feature.                                                                            |
| **Data & relationships**       | Identify stored records, fields/types, required values, relationships, access rules and lifecycle where the project needs them.                                                                                                                 |
| **Custom requirements**        | Add needs missing from the questionnaire with status, priority, acceptance criteria and references. Adjust custom categories/question settings only where needed.                                                                               |
| **Links & references / Files** | Supply relevant examples, links, designs and materials. Arrange separate delivery/access for uploaded file bytes; those bytes are outside the locked scope export/hash.                                                                         |
| **Commercial terms**           | Record shared delivery commitments and applicable terms. Private expense types, expenses and supplier invoices remain outside shared scope and export.                                                                                          |
| **Review & decisions**         | Review the saved draft, missing required answers, clarification items and warnings. Record questions, assumptions, agreed outcomes and owners, including real unresolved business inputs.                                                       |
| **Scope approvals**            | Select the designated client, submit the saved candidate, obtain both independent same-hash approvals and explicitly lock it as described below.                                                                                                |

Optional fields need useful content only when applicable. An absent answer is
unanswered; `NOT_APPLICABLE`, tentative, undecided and developer-delegated answers
have distinct meanings. Expert/owner filters and conditional visibility can hide
questions from the current view; Review still checks applicable required inputs.
Progress at 100% is neither complete agreement nor V1 acceptance.

Give each acceptance criterion an observable outcome, including relevant failure
and permission behavior. Preserve genuine unresolved business gaps with an owner
and affected scope. Developer-delegated technical details may be resolved later
within developer authority with a recorded choice and rationale.

After saving, address required-answer blockers in **Review & decisions**. If open
decisions remain, discuss them and explicitly acknowledge them when submitting.
They remain unresolved in the snapshot even if the scope is approved.

Submit a titled version in **Scope approvals**, choosing **Client whose approval
is required**. The administrator and that designated client sign in separately,
read the complete exact snapshot and each approve its same content hash. Then the
administrator explicitly selects **Lock approved scope**. Both approvals without
this action mean awaiting lock. A valid `LOCKED` baseline is exportable; approval
of an individual answer or another client's account cannot replace these steps.

For corrections before lock, reopen and submit a new candidate for fresh approvals.
After lock, use a change request/new version and approval cycle. Preserve the old
baseline and implementation history. New draft content does not alter the old hash.

## 5. Generate and review the pinned specification

Once initialization and the intended lock are available, invoke the separate skill:

```text
$discovery-specification Generate the specification for production project PROJECT_UUID in ./docs/specifications/v1
```

The [source contract](../.agents/skills/discovery-specification/references/export-contract.md)
selects the highest-version `LOCKED` baseline, independently of a newer draft.
Check that this is the intended V1 source. The package retains original export
bytes, project/baseline UUID and version, server `contentHash`, independent
approval/lock identity and a separate whole-file SHA-256 in `source/receipt.json`.
That receipt establishes provenance; it does not establish implementation progress.
Supporting assets need their own authorized retrieval and receipts outside it.

Review `SPECIFICATION.md`, `ACCEPTANCE.md`, traceability and the issue graph against
the source. `DECISIONS.md`/`decisions.json` distinguish reasoned
`RESOLVED_TECHNICAL` choices, `PROPOSED` assumptions and owned `REQUIRES_INPUT`
requests. Genuine consequential gaps block affected work; unrelated ready scope
can proceed. Generated proposals are not approved client facts.

Keep client artifacts in the explicit nested folder or another protected output.
Root `docs/*.md` and `docs/acceptance/` feed the public project dashboard. Generation
does not authorize committing or publishing client material. A valid local package
still needs semantic review before coding/publication. Resume preserves its pinned
source; a newer baseline requires an explicit refresh/new-output request and review
of changes while retaining existing issue/PR history.

## 6. Validate locally, then publish only to the approved target

The following are examples to run in the consumer after generation. Both commands
are local and credential-free; the second produces an offline import plan:

```sh
node ./docs/specifications/v1/tools/validate-package.mjs --package ./docs/specifications/v1
node ./docs/specifications/v1/tools/import-issues.mjs --package ./docs/specifications/v1
```

Review the package, blockers and import plan. Resolve an explicit authorized
`OWNER/REPO` destination before separately requesting publication. Only then use:

```sh
node ./docs/specifications/v1/tools/import-issues.mjs --package ./docs/specifications/v1 --repo OWNER/REPO --apply
```

Follow the [import contract](../.agents/skills/discovery-specification/references/specification-contract.md#validation-and-later-publication)
for account/access checks, relationships, partial failures and `.import-state/`.
Retain stable keys and mappings; publication creates execution records, not code.

## 7–9. Implement, accept and promote the V1

Claim a ready bounded leaf issue using the generated `IMPLEMENTATION-WORKFLOW.md`.
Confirm its source, dependencies, decision blockers, ownership and acceptance;
implement within that boundary, run relevant repository checks and deliver a linked
PR with actual CI evidence. Close work only against its acceptance evidence.
Use issues/PRs for execution progress rather than inferring it from initial setup
status or editing checkmarks. Repeat for the accepted V1 scope and its integration.

Deploy the candidate through **Deploy staging** following the [release procedure](../infrastructure/release/README.md#deploy-an-initialized-project).
Test real journeys, roles, integrations, failure cases and agreed quality criteria
from `ACCEPTANCE.md`. Record client acceptance and unresolved release blockers
against the exact candidate. Initial scope approval agrees what to build; it does
not accept delivered code. Required V1 behavior must be implemented and verified.

Promote the exact verified and accepted staging frontend/backend image pair through
**Deploy production**, preserving its source SHA and successful staging run identity.
Follow the release owner for authorized migrations, pre-migration backups,
environment/account provisioning, smoke checks and recovery; follow the [CI owner](../infrastructure/ci/README.md)
for shared infrastructure. Check current capabilities, workflows and evidence,
rather than assuming a template's past deployment/PR status applies here.

Finish with production health and business smoke evidence, current access/operating
documentation, backup retrieval and isolated restore evidence, approved backup
scheduling, known limitations and the accepted V1 issue/requirement coverage.
Record consumer setup changes in [its runbook entry point](template-initialization.md#consumer-specific-setup).
Production V1 completion rests on these results and client acceptance, not merely
successful image publication, a deployed skeleton or a generated specification.
