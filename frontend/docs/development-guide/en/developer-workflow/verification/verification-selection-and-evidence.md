# Select verification by changed contract and report its limits

Choose checks that can detect the changed behavior, inspect what aggregate scripts actually run and bind results to the candidate that was reviewed. Verification is a collection of evidence, not one undifferentiated green label.

**Documented starter workflow with an application recipe.** The workspace/frontend READMEs, frontend architecture-testing guide and package/build scripts define available checks. The selection table below applies those owners; it is not a new automated scheduler or permanent exception to normal verification.

## Trigger, owner and invariant

Use before delivering a change, after a review fix or when a task restricts which checks may execute. The implementation owner identifies changed contracts. The coordinating developer applies current resource/concurrency instructions and schedules permitted checks. A source author must not independently start a heavy suite while another owner is verifying the candidate.

The invariant is honest scope: run authorized relevant checks, retain their actual outcomes and report missing evidence. An explicit instruction limiting execution applies to that task; it does not permanently remove tests from repository policy or establish passing evidence for commands never run.

## Read scripts before choosing an aggregate

At this source snapshot, frontend `verify` includes formatting, lint, architecture, development-guide validation, typechecking, Vitest, production build and Storybook build. A request for “static checks only” cannot safely invoke that aggregate. `build` itself performs TypeScript build before Vite bundling.

Backend verification uses the included Gradle wrapper and meaningful tests with isolated PostgreSQL/Testcontainers; it does not use/reset the local developer database. Docker availability matters for those tests. Image compilation and runtime smoke are separate contracts owned by CI/release configuration.

```text
changed contract
   -> actual owning scripts
   -> authorized focused checks
   -> material review fixes
   -> coordinated final permitted gates
   -> source-bound handoff with omissions
```

## Match the evidence to the change

| Changed contract          | Useful evidence to select when authorized                         | Important limitation                                         |
| ------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------ |
| Markdown/catalog/routes   | Guide validator, lint/types, relevant route/build checks          | Valid links do not prove semantic accuracy.                  |
| Import/lifecycle boundary | Architecture check and focused behavior coverage                  | Mechanical acceptance cannot choose the right owner.         |
| Shared visual component   | Types/build, Storybook and relevant interaction/visual inspection | Screenshot proves observed layout, not persistence/security. |
| Auth/API behavior         | Focused adapter/integration and browser scenarios                 | Mock-only evidence does not prove real backend behavior.     |
| Backend persistence       | Relevant transactional/integration cases and build                | Compiled jar does not establish database invariants.         |
| Runtime image             | Restricted artifact smoke and image identity                      | Local dev success is not artifact acceptance.                |

Select existing meaningful coverage rather than tests that repeat implementation details. Record any required manual accessibility or semantic review that automated checks cannot establish.

## Coordinate resources before execution

Read current workspace constraints and inspect whether an interrupted heavy process is still active before restarting it. Follow the repository's selected coordination mechanism. Independent editors do not imply unrestricted parallel typechecks, browsers, Gradle and build workers.

Focused checks help during implementation; final gates apply after all affected editors and material review fixes finish. A relevant source change invalidates the evidence it could affect. Repeat the necessary checks because the candidate changed, not from habit after an already successful unchanged run.

If a user's explicit task scope prohibits tests, choose separately named permitted commands and disclose that behavior evidence remains missing. Do not rewrite CI to skip suites as a side effect. A later task can authorize the omitted checks under its own scope.

## Keep a small evidence receipt

A neutral handoff record can include:

```text
candidate: <commit-or-working-tree-scope>
command: <exact-selected-command>
result: <passed-failed-interrupted-not-run>
log: <private-or-safe-artifact-reference>
limits: <mock-only/manual-gap/omitted-suite>
```

For uncommitted work, identify the actual working-tree scope rather than assigning an unrelated HEAD commit to all edits. After commit, ensure the delivered source matches the candidate verified. A failing or interrupted check must remain visible even if a later unrelated check passes.

## Failure and decision table

| Observation                                          | Decision                                             |
| ---------------------------------------------------- | ---------------------------------------------------- |
| Aggregate secretly includes prohibited tests         | Choose explicit permitted scripts before execution.  |
| Architecture passes but review finds wrong ownership | Resolve design; checker success is not a waiver.     |
| Source changed after recorded build                  | Re-evaluate and repeat affected evidence.            |
| Old worker remains after interrupted verification    | Reconcile owned process state before restart.        |
| All static checks pass, tests not run                | Report static success and behavioral gap separately. |
| Log belongs to another checkout/attempt              | Reject it as evidence for this candidate.            |

## Acceptance and inspection

Delivery states resulting behavior, actual checked scope, outcomes, omissions and remaining risks. Distinguish local checks, remote CI, staging acceptance and production/recovery evidence. Publication or deployment needs its own authorization; selecting verification grants neither.

The package/build scripts and owner guides remain authoritative. This article runs no command and does not turn a temporary session restriction into permanent repository policy.

## Source provenance

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:README.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/README.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/package.json`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:backend/build.gradle`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/AGENTS.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/docs/architecture/en/tests-mocks-stories-and-architecture-checks.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:docs/v1-workflow.md`
