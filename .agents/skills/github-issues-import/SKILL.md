---
name: github-issues-import
description: Validate, preview, import or resume a specification-to-issues package in its exact GitHub repository. Local validation is offline; publication requires an explicit import request.
---

## Start

A bare invocation asks: “Preview a package, import a package, resume an import, or describe another task?” Wait for the answer before inspecting task files. A concrete task proceeds directly. Explanation-only requests remain read-only.

## Workflow

1. Read the consumer's instructions, tracker and triage-label conventions, and [import contract](references/import-contract.md). Identify the exact package and target repository. Use the sibling specification-to-issues validator; missing or invalid approved-source/package evidence stops the import. Return changed requirements to specification-creator; return packaging gaps to specification-to-issues.
2. Run the helper's `plan` command. It validates locally and reports issue order, declared labels, relationships and source identity without provider access or writes. Reconcile the target with the consumer Git remote; a standalone package requires an explicit matching target. Summarize what would be published. Validated functional scope remains distinct from architecture review and implementation readiness.
3. For actual publication, require a user instruction to import this named package into this target repository. A request to create these skills, generate a package, preview or validate it grants no publication authority. A concrete import request already naming both satisfies this boundary; do not invent an additional signing or approval ceremony. Run `apply` only within that instruction, using authenticated `gh` and the recorded relationship mode.
4. Reconcile open and closed issues by stable package/item markers and protected mappings before each continuation. Preserve closed issues, manual edits, existing labels and relationship ownership. Native blocking/sub-issue links are the default. Use body links only when explicitly selected for unavailable native capabilities, never automatically after permission/rate/validation failures. Follow the helper's conflict and uncertain-outcome stop rules; do not delete state to force retries.

## Finish

Report source approval, package identity/digest, target, validation result and actual imported/reused issue URLs, including closed records and relationship mode. A stopped run reports the preserved checkpoint and the bounded recovery action. Import is complete only when all intended issues and relationships are observed. Keep private state out of commits and reports. Publication does not start application implementation or promote triage labels automatically.
