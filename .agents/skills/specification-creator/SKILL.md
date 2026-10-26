---
name: specification-creator
description: Create, resume, review or revise an application's functional specification through a client discovery interview after full project initialization. Use supplied requirements or start from a problem; architecture planning, issue publication and implementation are separate tasks.
---

# Specification creator

## Start

For a bare invocation or capability question without a task, ask: “Start an app
specification, resume the interview, review readiness, revise approved scope, or
describe another task?” Wait before inspecting task files. A concrete task proceeds
directly. Explanation-only requests stay read-only. Skill-maintenance requests
stay within the requested editing scope. Neither needs an initialized consumer.

Every project operation first runs:

```sh
node .agents/skills/initialization-execution/scripts/completion.mjs require-complete
```

If the helper is missing or fails, STOP before inspecting product documents,
asking discovery questions or creating state. Explicitly tell the user:
“Full initialization is not complete. Finish `$initialization-execution` before
running `$specification-creator`.” Completed intake or local-only setup does not
qualify. Never invent, repair or bypass initialization evidence here.

## Workflow

1. Read the consumer's applicable guides, `docs/template-initialization.md`,
   `docs/v1-workflow.md`, domain-document conventions and existing `CONTEXT.md`/
   relevant ADRs. Respect actual ownership. Read [interview](references/interview.md),
   [state](references/state.md) and [outputs](references/outputs.md). These references
   make the package portable; no globally installed interview skill is required.
2. Start or load the private interview with `scripts/specification.mjs`. Inspect
   saved answers, source identities, proposals, contradictions and unresolved
   branches before asking questions. Supplied notes/specifications seed the
   interview: extract established statements, identify conflicts and label
   interpretations as proposals. Retain source identities; never silently replace
   previously reviewed material with its edited contents.
3. Build a dependency tree and ask the whole current frontier in numbered rounds,
   following the interview reference. Investigate facts from permitted sources;
   the user decides product policy. Challenge scope and complexity using the
   problem, user benefit and success measures. Recommendations need reasons;
   ambiguity stays visible. Wait for answers before advancing dependent questions.
4. Save each answer batch before the next round. Keep proposed, answered, deferred
   and unknown states distinct. Capture applicable topics, first-release/future/
   excluded scope, consequences, source IDs and actual user decisions. Represent
   every unresolved contradiction as a blocking question with its conflicting
   sources. Reopen affected dependent answers when an earlier decision changes.
5. Maintain sanitized Markdown drafts and traceability as answers settle, preserving
   manual edits. Follow the output contract rather than creating architecture,
   implementation tasks or speculative APIs. Mark incomplete drafts accurately.
6. Run `validate` when coverage appears complete. Review semantic consistency,
   feature/page/data/permission relationships, scoped failure behavior and measurable
   acceptance with the user. Present the exact revision and document inventory,
   summarize exclusions and any nonblocking future questions, then wait for explicit
   approval. Record the user's actual response with `approve`; validation cannot
   assert client agreement.
7. To change approved requirements, use `revise` before editing. Preserve approved
   documents and private interview snapshots, identify affected branches and their
   dependent requirements, interview those branches, and obtain renewed approval.
   Keep unaffected decisions intact. Report conflicts with existing ADRs for the
   later architecture owner rather than silently changing them.

## Finish

A draft handoff reports saved revision, document paths, unresolved IDs and the
resume prompt. Approved completion requires `require-approved` to pass for the
exact state and Markdown hashes, plus the recorded human agreement and semantic
review above. Report approved version, source/decision traceability, first-release
scope and explicit exclusions. Provide `$specification-creator resume the interview`
or `$specification-creator revise approved scope` as appropriate.

Stop at functional specification. Architecture planning, GitHub issues, prototype
creation, app implementation, commits and publication need separate tasks.

After approval, use [specification to issues](../specification-to-issues/SKILL.md)
to create a local issue package from this exact revision. Use
[GitHub issues import](../github-issues-import/SKILL.md) separately for a preview
or explicitly requested publication. This skill's completion does not run either
downstream task or authorize remote writes.
