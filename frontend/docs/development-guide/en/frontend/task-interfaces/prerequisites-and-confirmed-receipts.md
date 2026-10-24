# Prerequisites report evidence; receipts report acknowledged outcomes

Use a prerequisite panel when an operation is blocked by facts owned elsewhere, and a receipt when the server has acknowledged a meaningful outcome. The first explains what remains and how to resolve it. The second explains what happened and which next action is now valid. Neither should invent business completion from local UI state.

This is a **reference recipe** based on Client Discovery's `AppPrerequisiteList` and `AppTaskReceipt`. These components are consumer-owned presentation, not installed starter exports. A new application must supply its own authoritative projection and command result.

## Evidence belongs to its source

A prerequisite row has a stable ID, title and optional description, responsible party, due information and remedial action. The inspected component receives outstanding items and optional completed items. Completed items appear in a disclosure, while the overall status and optional coverage text are supplied by the owner.

Its source comment deliberately says rows are evidence/status, never editable completion flags. A checkbox that changes only local state cannot establish that a required document was accepted, an account was provisioned or another service finished its work.

The feature owns fetching and interpreting prerequisite facts. The backend owns whether an operation is allowed. A ready-looking panel is not authorization for a later mutation: the service must recheck current prerequisites when the command arrives.

Distinguish incomplete from unavailable. If a contributor failed, a budget expired or the viewer cannot see a required source, show the appropriate unknown/restricted state according to the public contract. Do not turn a missing row into a green “Everything complete” result. A completion count without its coverage boundary can be actively misleading.

## Give every blocked fact a precise remedy

Use the action belonging to the missing prerequisite: open the relevant editor, request the named evidence, or navigate to the exact source record. Preserve the original task's owner and safe return context. A generic “Go to settings” link for every problem is rarely useful.

Responsible and due information describe the source projection; the panel does not assign people or recalculate deadlines. Format dates through application locale/time policy. Keep long descriptions readable, and use clear action labels that name what can be changed.

The following is **illustrative view-model pseudocode**, not a DTO already installed by the template:

```ts
type PrerequisiteProjection = Readonly<{
  coverage: "complete" | "partial" | "unavailable";
  readiness: "ready" | "blocked" | "unknown";
  checkedAt: string;
  missing: readonly Readonly<{
    id: string;
    reasonCode: string;
    remedy: "edit-document" | "request-evidence";
  }>[];
}>;
```

The feature maps reason/remedy codes to translated text and valid route actions. It should not accept arbitrary server HTML or execute a server-provided command string. Recompute current capability before exposing an action, and rely on backend enforcement after navigation.

## Receipts start with acknowledgement

The reference `AppTaskReceipt` is a success-styled alert with an owner-supplied title, body, details and next action. It does not infer any result from the route, form values or component mount. Use that success presentation only when the owner's contract has confirmed the described fact.

HTTP 202 can mean a request was accepted for processing. It does not prove processing finished. An acknowledgement may justify “Export requested” while the actual export remains pending, but must not justify “Export completed” or a download link that does not yet exist. Choose wording and presentation for the exact acknowledged state.

A useful durable receipt identifies the resulting object or operation and, when relevant, its acknowledged revision/time. Its next action is derived from the confirmed state and current capability. Do not infer it from the next page's position in a wizard.

A transient toast can accompany the result, but should not be its only discoverable record when the user needs to copy an identifier, resume an operation or distinguish an uncertain submission from completion. Do not display internal provider payloads or sensitive evidence merely because a result object contains them.

## Failure and recovery decisions

| Situation                             | UI and protocol response                                            |
| ------------------------------------- | ------------------------------------------------------------------- |
| One prerequisite is missing           | Explain that source-owned fact and its exact remedy                 |
| Coverage is partial                   | Keep unknown coverage visible; do not claim readiness from omission |
| Prerequisites change while confirming | Backend rechecks; frontend handles the specific rejection           |
| Write response is lost                | Show uncertainty and use the original receipt/retry protocol        |
| Write is acknowledged, refresh fails  | Preserve the receipt and offer refresh recovery                     |
| Background operation is accepted      | Report accepted/pending until authoritative completion arrives      |
| Access is revoked                     | Remove restricted facts and invalidate obsolete actions             |

After a remedy is completed, refresh the relevant prerequisite projection. Do not set a local “done” flag just because a navigation detour returned. A successful upload may still require a separate review, binding or acceptance action.

## Acceptance and shortcuts to avoid

Open a blocked task: each item explains its source, state and actionable remedy. Make one source unavailable: the panel shows incomplete coverage rather than success. Complete a remedy and return: only refreshed authoritative evidence changes readiness. Submit a command that returns accepted/pending: copy does not claim the final effect. Lose a response after server commit: the receipt protocol avoids a duplicate operation. Fail a later refresh: the acknowledged result remains visible.

Avoid editable local completion flags, green states derived from an empty array, success inferred from HTTP status alone, misleading counts over partial coverage and generic next actions detached from the result. Presentation helps people understand facts; it does not manufacture those facts.

## Sources and provenance

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/components/AppPrerequisiteList.tsx` — evidence rows, coverage, responsible/due/action fields and completed disclosure.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/components/AppTaskReceipt.tsx` — owner-supplied acknowledged facts and next action; success alert presentation.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/types/AppTaskPresentation.ts` — prerequisite presentation contract.
