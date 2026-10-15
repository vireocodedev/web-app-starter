# Workspace agent guide

For initializing a consumer from this template, or resuming incomplete template
personalization, follow [Template initialization](docs/template-initialization.md).
The explicit no-argument entry point is `/initialize-project`, provided by the
[project skill](.github/skills/initialize-project/SKILL.md); its status owns the
learning-edit policy. Use the linked contract for full setup versus local-only scope.
Apply that workflow only when requested, not during ordinary application work.

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
For local development and verification, use [the workspace README](README.md).
