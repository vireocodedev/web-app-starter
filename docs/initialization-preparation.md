# Prepare a consumer before initialization

Run `$initialization-intake prepare initialization for this repository` in the
trusted consumer checkout. The [intake skill](../.agents/skills/initialization-intake/SKILL.md)
owns all setup questions, progress and remaining prerequisites. Resume in another
agent session with `$initialization-intake resume intake`.

Private state is saved under
`.agents/skills/initialization-intake/state/intake.json` and ignored by Git.
Record nonsecret answers and protected credential references. Review the resolved
answers, finish human access/consent prerequisites and confirm the execution
scope. Updating answers invalidates completion until reviewed again.

Use the [questionnaire](../.agents/skills/initialization-intake/references/questionnaire.md)
for service access and operator preparation, and the
[state reference](../.agents/skills/initialization-intake/references/state.md)
for answer status, save/resume and completion rules. Once intake is complete, run
`$initialization-execution initialize this repository`; execution stops explicitly
if intake is incomplete or no longer matches this checkout.

The [setup entry point](template-initialization.md) records consumer-specific
setup. Neither credentials nor private intake state belong in tracked documents.
Client Discovery and exported workbooks are not initialization prerequisites.
