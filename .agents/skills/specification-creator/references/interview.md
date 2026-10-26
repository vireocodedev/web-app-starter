# Adaptive client discovery

## Rounds and decisions

Model the interview as a decision tree with stable question IDs and explicit
prerequisites. The frontier contains all unresolved questions whose prerequisites
are settled. Ask that whole frontier in one round; a question dependent on another
question in the same round belongs to a later round. Save partial replies and
recompute the frontier. The tree can grow when answers reveal new branches.

Use this format and number continuously across the conversation:

```text
❓ Q1 — Problem: Which recurring problem should this app solve, for whom,
and what happens today? Is this proposed description accurate: ...?
➡️ Recommended: ... because ...

❓ Q2 — Decision owners: Are you the person who can approve product scope,
and who will accept the completed app?
➡️ Recommended: record named responsibilities before accepting requirements.
```

Word a question so “yes” accepts the recommendation when a defensible recommendation
exists. For unknown client facts, ask the open question, explain why it matters and
say there is not enough evidence for a recommendation. Avoid invented client facts,
forced defaults, fixed questionnaire length and repeat questions answered by sources.
Ask applicable branches together without inventing answers to unblock others.

Inspect repository/source facts yourself after the initialization gate. Prefer
available read-only connected sources for user-supplied references when authorized.
Never ask the user to discover a fact the agent can inspect. Product intent,
priorities, tradeoffs, business policy and approval belong to the user. A provided
specification is source evidence; agent interpretations remain proposals until
confirmed. Track conflicting statements by source ID and targeted question.

## Coverage

The helper's fixed topic inventory is a completeness floor, not a questionnaire
or proof of good analysis. Expand each applicable topic into real product-specific
questions; record a rationale for every addressed or inapplicable topic. The core
problem, users, outcomes, scope and acceptance always need substantive answers.

- **Problem, users, outcomes:** current workarounds, pain and causes, beneficiaries,
  user groups, motivations, frequency and measurable success/failure indicators.
- **Scope:** first release, future possibilities and explicitly excluded behavior;
  dependencies, essential versus optional capability and simpler alternatives.
- **Workflows and features:** actors, triggers, preconditions, main path, alternate
  paths, permission failures, business rules, validation and observable outcomes.
- **Pages:** purpose, entry points, navigation, displayed information, available
  actions and relevant loading/empty/error/success states; keyboard/focus behavior
  where meaningful. A page list alone is not a behavior specification.
- **Data:** business entities, field meaning/type/requiredness, uniqueness, defaults,
  relationships and cardinality, ownership, lifecycle transitions, history,
  consistency rules, deletion and retention. Describe business structure; schema
  migrations, ORM models and API payload design belong to architecture planning.
- **Permissions:** actors/roles, action and record scope, ownership changes,
  administrator behavior and access revocation. Check each included feature.
- **Business rules:** calculations, limits, timing, approvals, cancellations,
  concurrent user expectations and dispute/error recovery.
- **Integrations and notifications:** purpose, external owner, source of truth,
  consent, triggers, audiences/channels, retries, duplicates and failure behavior.
- **Search/reporting and import/export:** visibility, filters/sorts, data volumes,
  formats, reporting definitions, partial errors and permission boundaries.
- **Localization/accessibility:** languages, locale-specific formats, translated
  content ownership, user needs, keyboard/screen reader and accessibility targets.
- **Usage/performance:** expected users, concurrent activity and data growth,
  important response times, availability and offline requirements where relevant.
- **Privacy/retention and migration:** personal/sensitive data, permitted purposes,
  user-visible controls, retention/deletion obligations, existing data quality,
  mapping, ownership and acceptance. Record unresolved specialist/legal questions
  with owners; do not invent legal conclusions.
- **Visual direction/responsive behavior:** references, branding/assets, navigation
  expectations, page layouts, devices, narrow-screen priorities and interaction
  preferences. Mockups and coded prototypes are separate tasks.
- **Constraints/responsibilities:** deadline/budget constraints without fabricated
  estimates, external dependencies, who supplies content/data, product decision
  authority and final acceptance responsibility.
- **Acceptance:** measurable positive, negative and recovery scenarios for the
  included workflows, roles and rules, plus who accepts them and on what evidence.

Ask why a requested feature helps the agreed outcome, who needs it and whether a
simpler option would meet the need. Challenge contradictions respectfully; retain
the user's resulting decision even when it differs from your recommendation.

## Completion and change

A topic label marked addressed is not sufficient evidence of depth. Review the
actual answers and documents together. Every included feature must have actor,
trigger, normal path, rules/validation, failure behavior and acceptance; every
page/data relation/permission must agree across documents. Track stable IDs and
source/question references. Missing included behavior remains blocking.

“Decide later” is unresolved when included functionality depends on the answer.
Future/excluded questions may remain deferred with rationale and no first-release
dependency. Revisit scope when a blocker is explicitly moved outside the release;
never silently relabel it nonblocking to pass validation.

Save after each answer batch. On resume show a short recap and ask only unresolved
frontier questions. New source material, conflicts and changed answers reopen
relevant branches. For approved work, first create a revision with the helper;
present its impact on features, pages, data and acceptance before reapproval.
