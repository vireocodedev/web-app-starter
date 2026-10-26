---
name: initialization-intake
description: Collect and resume a project's setup questionnaire before initialization execution, or try the same interview locally in a dry run.
---

# Initialization intake

## Start

A bare `$initialization-intake` asks: “Try a dry run, start or resume project
intake, review readiness, or describe another task?” Wait before inspecting task
files. A concrete request proceeds directly. Explanation-only requests stay
read-only; skill-maintenance requests stay within the requested editing scope.
This skill prepares setup; business requirements remain a separate workflow.

For an explicit dry-run request, read [local practice](references/dry-run.md)
before inspecting a consumer or starting the interview. Keep the chosen mode and
session explicit throughout the conversation and every helper invocation.

## Workflow

1. Read the workspace's agent guides and initialization entrypoint. Read
   [the questionnaire](references/questionnaire.md) before interviewing and
   [state handling](references/state.md) before saving. Reuse the existing
   initialization-execution runbook for identity, CI, hosting and recovery
   constraints. Dry runs use hypothetical targets and simulated prerequisites;
   real intake inspects the consumer's actual identity and existing resources.
2. Use `scripts/intake.mjs status --root /absolute/workspace` locally; add
   `--dry-run` and the selected `--session NAME` for every practice operation.
   Status contacts no API. For new intake, use `init`; existing answers load from
   the selected private state path, including in a separate agent session. Real
   intake inspects Git identity, changes, configuration and existing data without
   changing application/provider configuration. Dry runs follow their local-only
   boundary instead of inspecting protected operator or credential stores.
3. Present all applicable setup questions together, grouped by topic. Prefill
   detectable facts or dry-run example values and label recommended defaults
   **proposed**. Let the user answer in one message or several; save actual
   answers after each batch with `save`, retaining unknowns, unanswered fields
   and blocked prerequisites. Ask only unresolved questions when resuming. A
   suggestion becomes answered only when the user accepts it.
4. In real intake, finish foreseeable human preparation and read-only preflight:
   login/2FA, App-owner consent, credential storage, IDE trust, operator/DNS/
   registry access and recovery prerequisites. Record nonsecret evidence.
   External writes to establish access require their own explicit consent;
   intake performs no application, GitHub, DNS, host, deployment or database
   mutations. Dry intake asks which prerequisite outcomes to simulate and labels
   their evidence as simulated; hypothetical blockers remain visible.
5. Show the resolved identity, environment targets, exact action scope, preserved
   resources and prerequisites. Obtain the user's confirmation of that complete
   scope and record their actual response using `complete`. In a dry run, explain
   that confirmation completes only the practice scenario. The helper derives
   readiness from required valid answers and prerequisites and binds the receipt
   to the selected mode, workspace, schema and inputs.

Store credential **references** only. Use protected stores or hidden provider
flows for real secrets; practice uses fictional references without opening them.
Keep passwords, tokens, private keys and credential-bearing URLs out of chat,
patches, evidence and state. Never execute state values as commands. Keep private
intake files outside public documentation/dashboard inputs.

## Finish

For a dry run, use `status --dry-run` with the selected session. Report
`rehearsalComplete`, unresolved question/prerequisite IDs, the private state path
and the resume prompt. Practice completion ends this task; it grants no setup
authority and cannot satisfy execution's `require-complete` gate.

For real intake, run `require-complete`. Intake is complete only when it succeeds
for this consumer and the saved confirmation covers the displayed action scope.
Report completion or exact unresolved IDs, private state path and resume command.
A completed real intake is the prerequisite for `$initialization-execution`;
execution starts only when requested. Changes invalidate completion and require
review of the updated scope. Readiness evidence is preparation, not deployment
or business acceptance.
