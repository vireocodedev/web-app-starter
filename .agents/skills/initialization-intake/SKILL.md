---
name: initialization-intake
description: Collect and resume a consumer project's setup questionnaire before initialization execution.
---

# Initialization intake

## Start

A bare `$initialization-intake` asks: “Start setup intake, resume saved answers,
review readiness, or describe another task?” Wait before inspecting task files.
A concrete request proceeds directly. Explanation-only requests stay read-only.
This skill prepares setup; business requirements remain a separate workflow.

## Workflow

1. Read the consumer's agent guides and initialization entrypoint. Read
   [the questionnaire](references/questionnaire.md) before interviewing and
   [state handling](references/state.md) before saving. Reuse the existing
   initialization-execution runbook for identity, CI, hosting and recovery
   constraints; inspect current source rather than assume template receipts
   prove this consumer is ready.
2. Confirm the consumer worktree and inspect Git identity, changes, configuration
   and existing data without changing application/provider configuration. Use
   `scripts/intake.mjs status --root /absolute/consumer` locally; it contacts no
   API. For new intake, use `init`. Existing answers are loaded from
   `.agents/skills/initialization-intake/state/intake.json` inside that consumer,
   including in a separate agent session.
3. Present all applicable setup questions together, grouped by topic. Prefill
   detectable facts and label recommended defaults **proposed**. Let the user
   answer in one message or several; save actual answers after each batch with
   `save`, retaining unknowns, unanswered fields and blocked prerequisites.
   Ask only unresolved questions when resuming. A suggestion becomes answered
   only when the user accepts it; an inferred approval is not an answer.
4. Finish foreseeable human preparation and read-only preflight during intake:
   login/2FA, App-owner consent, credential storage, IDE trust, operator/DNS/
   registry access and recovery prerequisites. Record nonsecret evidence against
   each prerequisite. Any external write needed to establish access requires
   its own explicit consent; intake itself performs no application, GitHub, DNS,
   host, deployment or database mutations. Missing existing shared infrastructure
   remains blocked; setting up a new foundation is separate work.
5. Show the resolved identity, environment targets, exact action scope, preserved
   resources and prerequisites. Obtain the user's confirmation of that complete
   scope and record their actual response using `complete`. The helper derives
   readiness from required valid answers and prerequisites and binds the receipt
   to this repository, schema and inputs. No invented signer or expiry is needed.

Store credential **references** only. Use protected stores or hidden provider
flows for secrets; keep passwords, tokens, private keys and credential-bearing
URLs out of chat, patches, evidence and state. Never execute state values as
commands. Keep private intake files outside public documentation/dashboard inputs.

## Finish

Run `require-complete`. Intake is complete only when it succeeds for this consumer
and the saved confirmation covers the displayed action scope. Report completion
or the exact unresolved question/prerequisite IDs, private state path and resume
command. A completed intake is the prerequisite for `$initialization-execution`;
execution starts only when requested. Changes invalidate completion and require
review of the updated scope. Readiness evidence is preparation, not deployment
or business acceptance.
