# Try the intake locally

Use this mode to experience the real setup interview in this template checkout,
review its questions and request improvements. It uses the same catalog, answer
validation, conditional full/local-only scope, save/resume and confirmation flow.
It needs no consumer clone, GitHub login, operator profile or service credentials.

## Start or resume

```text
$initialization-intake dry run
$initialization-intake resume dry run
$initialization-intake dry run using session inventory-demo
$initialization-intake resume dry run using session inventory-demo
```

The default session is `default`. A named session starts a separate scenario;
an existing name resumes its saved answers rather than resetting it. Use a
lowercase letter or digit followed by lowercase letters, digits or hyphens, up
to 64 characters. Keep the session in every helper command:

```sh
node .agents/skills/initialization-intake/scripts/intake.mjs status --dry-run --session inventory-demo
node .agents/skills/initialization-intake/scripts/intake.mjs init --dry-run --session inventory-demo
node .agents/skills/initialization-intake/scripts/intake.mjs save --dry-run --session inventory-demo --input -
node .agents/skills/initialization-intake/scripts/intake.mjs complete --dry-run --session inventory-demo --input -
```

Add `--root /absolute/template` when invoking the helper from elsewhere. Input
JSON follows [the state contract](state.md), including `expectedRevision` and the
actual user confirmation. Status is read-only, including before a session exists.

## Conduct the same interview

Identify the conversation as a **dry run**. Present all applicable questions
upfront, with proposed examples clearly separated from user answers. The normal
repository question describes the hypothetical consumer, such as
`example/inventory-demo`; it need not match this template's origin. All other
field validation and scope requirements remain the same. A dry run can exercise
full initialization questions without proving actual access.

For each human or service prerequisite, explain what real intake would require
and ask which outcome to simulate: ready, blocked or unknown. A user may accept
a proposed group of simulated outcomes together. Save ready evidence explicitly
as simulation, for example `Simulated for this dry run: selected-repository App
consent is available; no access was checked.` Preserve hypothetical blockers;
do not silently answer questions or mark every prerequisite ready.

Use fictional credential/profile references. Read only local questionnaire,
guidance and practice state. Keep provider APIs, logins, protected operator files,
credential stores, dependency installation, application edits and execution
outside this mode. Action-scope answers describe a scenario, not permission to
perform those actions. Confirm the resolved scenario with the user before
completing it, just as real intake reviews the complete setup scope.

When the user requests a skill change, handle that editing request in its stated
scope rather than treating it as another questionnaire answer. After helper or
schema changes, reconcile saved answers with the existing stale-state procedure
in [the state contract](state.md); preserve user answers and review again.

## Saved practice and completion

State lives inside this skill at
`state/dry-runs/<session>/intake.json`, covered by the existing Git ignore and
private permissions. It is separate from real `state/intake.json`, carries an
explicit session/mode marker, and binds to this host worktree and installed
helpers. Another agent session loads the same practice file and asks only what
remains unresolved. Changing an answer clears practice completion.

`status --dry-run` reports `dryRun: true`, `rehearsalComplete` and `complete: false`.
Completion here means the interview and confirmation succeeded for the simulated
scenario. Report remaining IDs or that practice result, its session/path and the
resume prompt. `require-complete --dry-run` always fails; copying practice state
to the real state path is rejected. Starting real initialization requires a
separate real intake with actual consumer identity, prerequisite evidence and
confirmation. No other skill gains dry-run support from this increment.
