# Initialize a project from this template

The authoritative reusable setup procedure is bundled with the
[initialize-project skill](../.github/skills/initialize-project/SKILL.md):

- [Preparation and blank workbook](../.github/skills/initialize-project/references/preparation.md):
  required human inputs, protected references, login/App consent, safeguards
  and the local browser wizard or manual fallback.
- [Contract](../.github/skills/initialize-project/references/contract.md):
  written authority, live readiness, private resume state and acceptance.
- [Runbook](../.github/skills/initialize-project/references/runbook.md):
  affected identity/configuration files, setup actions, owners and verification.
- [Rehearsal lessons](../.github/skills/initialize-project/references/rehearsal-lessons.md):
  generic prevention rules, not a consumer execution receipt.

From the consumer Git worktree root on Linux with Node 24 and Git:

```sh
node .github/skills/initialize-project/scripts/prepare.mjs
```

No application startup or npm install is needed for the wizard. Keep
`/.template-initialization/` Git-ignored; private drafts/workbooks and readiness
reports stay there. Save the reviewed workbook, then invoke
`/initialize-project` with no arguments. Completed browser steps do not prove
provider access or authorize the agent to manufacture a signature.

Full initialization preserves the stack and existing resources and uses the
existing approved operator. It verifies local development, real CI, both paired
deployments and initialized recovery; local-only personalization remains a
separate explicit scope. The canonical template cannot initialize itself.

## Consumer-specific setup

This template records no consumer-specific setup or acceptance. During
personalization, record application-specific values, prerequisites, affected
files, setup actions, safeguards and verification here, linking to the bundled
runbook instead of copying it. Keep protected values in secret stores and
private run evidence, not this document.

## Documentation verification

Follow the bundled
[dashboard procedure](../.github/skills/initialize-project/references/runbook.md#project-documentation-dashboard).
The skill owns its documentation dependencies and lockfile; the public
[project dashboard](project.html) combines project documents and bundled
references, while its bundled reference page never includes consumer evidence.
