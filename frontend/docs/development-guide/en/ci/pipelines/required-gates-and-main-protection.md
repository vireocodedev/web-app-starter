# Bind the required gate to the policy that produced it

Make merging depend on a specific trusted check and a current candidate, rather than a green status with a familiar name. Workflow success and repository protection are different owners that need matching evidence.

**Installed template pattern.** The policy is documented in `docs/template-initialization/github-ci.md`; `infrastructure/ci/ci_scope.py` and `.github/workflows/ci.yml` produce the aggregate result. Consumer repositories must configure and verify their own protection. Template creation does not copy remote branch settings.

## Trigger, owner and contract

Use when activating a generated repository, changing required check names, changing job selection, or diagnosing a PR that appears mergeable despite missing verification. The application maintainer owns the gate implementation. The repository administrator owns effective branch policy and compatible organization rules. Runner registration remains the infrastructure operator's concern.

The contract is stronger than “none of the jobs failed.” Classification must succeed, every selected owner lane must succeed, and every unselected owner lane must be skipped. Failed, cancelled, absent and unexpectedly executed jobs are distinct states. The gate rejects states that do not match its policy.

## One required check, explicit internal obligations

The installed `CI gate` has `if: always()` and depends on classification and every application/foundation lane. This preserves reporting even when an earlier dependency fails. Workflow-level path filters must not remove the only required status from an otherwise valid PR.

The gate helper validates boolean selection outputs before mapping owners to expected job outcomes. The workflow subsequently validates source/run/attempt-bound shard reports for selected applications. A selected test matrix showing green is insufficient if membership evidence is missing or belongs to another attempt.

```text
trusted workflow + exact candidate
             |
  selected lane and evidence obligations
             |
       CI gate check-run
             |
  required context + source App binding
             |
    effective branch protection
```

This separates the policy producer from the merge decision. A source edit changes the producer; it does not silently update protection or installed host registrations.

## Bind identity, not just the text label

Read an actual check-run produced by the workflow. Record the observed name and source App, then require that identity in protection. Merely requiring the string `CI gate` can leave ambiguity about which integration supplied the status. Do not copy the template's numeric App or repository IDs into a consumer's setup instructions.

The template policy requires a PR before merging, the successful gate bound to GitHub Actions, an up-to-date branch, administrator enforcement, and blocked force pushes/deletion. Its selected review threshold is zero required approving reviews, with no required code-owner or last-push approval. That is the template's policy, not permission to weaken a stronger compatible organization rule.

Up-to-date enforcement matters because a green result on an earlier base is not evidence for the current integration candidate. Confirm the workflow's checked-out source and event comparison, rather than treating a branch name as an immutable identity.

## Configure and read back as separate steps

For an authorized consumer activation, first establish genuine successful CI and observe actual check identity. Then configure protection using the repository's approved settings/API procedure. Finally read the effective policy back, including inherited rules and administrator behavior.

A controlled harmless validation PR can show that missing/failing evidence blocks merging and corrected evidence permits merging under the intended approval threshold. It must not merge a failing fixture or temporarily remove required checks to manufacture acceptance. These are conditional acceptance actions for an authorized task, not instructions executed by this article.

Private-repository plan limitations or inherited policy conflicts are setup findings to report. Making a private repository public, bypassing enforcement or dropping required checks is not an acceptable workaround.

## Failure and decision table

| Observation                                           | Interpretation and decision                                                      |
| ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| Green status has the expected name but another source | Inspect source App binding before accepting it as required evidence.             |
| Gate remains pending on a docs-only PR                | Check workflow triggers and always-reporting behavior; do not remove protection. |
| Selected job was cancelled but aggregate is green     | Gate implementation is too weak; enforce exact expected states.                  |
| Current PR base changed after green CI                | Require current integration evidence through up-to-date policy.                  |
| Newly generated repo allows direct main pushes        | Remote policy was not inherited; configure it under administrator authority.     |
| Organization requires stronger reviews                | Preserve compatible stronger policy and document any real conflict.              |

## Acceptance and inspection

Inspect actual check name/source, selected and skipped outcomes, current attempt evidence, effective required contexts and branch freshness. Verify administrator enforcement and blocked force push/deletion through read-back, not screenshots of intended settings alone.

Record repository, revision, run and effective policy observations without tokens or numeric identities copied as universal defaults. Historical template acceptance is provenance for that repository only. Related reading: **Select verification by owner** explains routing; **Complete shard evidence** explains proof scope; the owning `docs/template-initialization/github-ci.md` retains the actual activation procedure.

## Source provenance

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:docs/github-ci.md`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/ci_scope.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:.github/workflows/ci.yml`
