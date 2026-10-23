# Workspace agent guide

For coordinating a consumer from clone through accepted production business V1,
read [the V1 workflow](docs/v1-workflow.md); follow its linked owners for each task.

For initializing a consumer from this template, or resuming incomplete template
personalization, follow [Template initialization](docs/template-initialization.md).
Invoke the [project skill](.agents/skills/initialize-project/SKILL.md) with
`$initialize-project` in Codex or `/initialize-project` in agents supporting skill
slash commands. A bare invocation reports the associated project's preparation,
setup and approved-scope phase before offering tasks; a concrete request proceeds
directly. This canonical package owns the workflow and learning-edit status.
Use the linked contract for full setup versus local-only scope.
Apply that workflow only when requested, not during ordinary application work.

After initialization, use [Discovery specification](.agents/skills/discovery-specification/SKILL.md)
to generate, resume or validate a specification and issue handoff from a production
locked scope. The invocation supplies the project ID and output folder.

Generic initialization procedures and tools live in the
[portable skill](.agents/skills/initialize-project/SKILL.md). Update its bundled
references at their source; keep consumer-specific setup in the runbook entry
point. After changes to public project documents or bundled references, follow
the [dashboard verification procedure](.agents/skills/initialize-project/references/runbook.md#project-documentation-dashboard).

When an implementation adds or changes consumer-specific values, configuration,
prerequisites, or setup steps, update that runbook in the same change. Include
the affected files, required inputs, setup actions, safeguards, and verification.
Keep it the authoritative setup guide; link to it rather than duplicating steps.

For shared CI foundation changes, follow
[the operator guide](infrastructure/ci/README.md). The canonical source belongs to
`vireocodedev/web-app-starter`; consumers register for that shared pool rather
than install another copy.
Privileged lifecycle or isolation changes require independent review and
fresh-host validation before activation.

For frontend changes, also follow [the frontend agent guide](frontend/AGENTS.md).
Before implementing a web-app change, use [the development guide](frontend/docs/development-guide/README.md)
to select focused frontend, backend, CI, delivery or agent-workflow patterns.
It distinguishes installed template behavior from source-backed reference recipes;
the current source owners and task authorization remain authoritative.
For local development and verification, use [the workspace README](README.md).
