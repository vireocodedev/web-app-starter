# Consumer initialization contract

The [intake skill](../.agents/skills/initialization-intake/SKILL.md) owns the
upfront questionnaire and resumable private answers. The authoritative
[execution contract](../.agents/skills/initialization-execution/references/contract.md)
owns the completion gate, confirmed scope, live readiness, execution resume and
acceptance.

Execution checks intake first. Missing, partial, changed or repository-mismatched
intake explicitly stops with instructions to finish `$initialization-intake`.
Completing intake records the user's confirmation of the resolved scope; it is
not proof that initialization, CI or deployments have succeeded.

The [local dry run](../.agents/skills/initialization-intake/references/dry-run.md)
uses the same intake interview with hypothetical inputs and separate private
session state. Its practice completion cannot satisfy execution's real intake gate.

See the [setup entry point](template-initialization.md) for invocation and
consumer-specific setup decisions. Preserve existing credentials, data and
completed evidence when adopting the new skills; an incomplete legacy run needs
completed intake before execution resumes. No Client Discovery service is needed.
