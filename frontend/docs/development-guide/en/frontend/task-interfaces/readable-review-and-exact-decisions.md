# Show readable evidence before an exact decision

Use a review page when a person must decide against a specific set of values, documents or versioned evidence. A useful review makes that evidence readable and names the effect of the decision. It does not infer consent from scrolling, time on page, a visited route or an opened dialog.

This is a **reference recipe** based on Client Discovery's `AppReadableReview`. The component is a presentation seam, not an installed starter export and not an approval engine. The feature and backend still own the decision protocol.

## Separate review presentation from decision authority

The reference accepts a title, optional context, ordered sections, optional contents label, extra details and an owner-supplied decision node. Each section has a stable ID, title, readable content and optional local action. It renders all sections, optional anchor buttons, then details and the decision after a divider.

The component's comment explicitly rejects a read/approval gate. It has no proof-of-reading state, no scroll percentage and no permission calculation. That is a useful boundary: a reusable review layout should not invent business authority.

The feature owns the exact record/version being reviewed, the user's current capability, loading and failure states, and the command. The backend must validate current authorization and the expected revision or evidence token when that command arrives. Displaying an authorized projection does not freeze its authority for a future click.

## Bind the decision to an immutable basis

A neutral decision model can make the relationship explicit. This is **illustrative protocol pseudocode**, not a DTO already shipped by the template:

```ts
type ReviewBasis = Readonly<{
  documentId: string;
  expectedRevision: number;
  evidenceToken: string;
}>;

type PublishCommand = Readonly<{
  requestId: string;
  basis: ReviewBasis;
}>;
```

Capture the reviewed basis with the displayed values. Do not combine old text with a freshly refreshed token simply to make a command succeed. If evidence changes, show the stale state and require the owner-defined refresh/review transition. Preserve an unchanged command's retry identity when acknowledgement is uncertain and the backend provides receipt support.

The action label should name the actual effect: “Publish document”, “Accept revision” or “Return for changes”. “Continue” can be appropriate navigation copy, but must not conceal a business mutation. Localize labels through the application resource owner, and describe consequential scope where needed.

## Use sections people can inspect and edit

Prefer concise readable labels and formatted values over an unstructured JSON dump. Preserve meaningful empty values, unavailable evidence and source coverage; absence is not proof that nothing is required. Long text should wrap, tables should scroll within their container, and date/number formatting should follow application locale policy.

The reference's anchor controls point to generated section heading IDs and use the shared sticky-header offset. The caller supplies a heading level appropriate to the containing page; child headings follow it. Use stable section IDs for reconciliation, but do not treat generated DOM anchors as durable business identifiers.

A section's edit action should return to the relevant editor and preserve the review task's context. Define what happens after editing: a saved revision generally invalidates the former review basis. The presentation component does not coordinate that return flow for you.

Do not collapse essential reviewed values merely to make the decision button appear sooner. Optional technical detail can be disclosed separately. Show the decision after the complete review, while retaining keyboard access and an understandable focus order.

## Failure and transition decisions

| Event                                 | Required owner behavior                                               |
| ------------------------------------- | --------------------------------------------------------------------- |
| Review data is loading                | Show pending state without an actionable stale decision               |
| A background read changes revision    | Mark the reviewed basis stale; do not silently replace only the token |
| Permission is lost                    | Invalidate pending decisions and clear restricted content as required |
| Command conflicts                     | Keep the conflict distinct from validation or transport failure       |
| Server acknowledges the decision      | Show the exact resulting state or receipt                             |
| A refresh callback fails after commit | Preserve the acknowledged outcome; offer refresh recovery             |

A confirmation, when warranted, must name the same target and effect as the command. Recheck the captured owner after awaiting the person's choice. A dialog that was opened under an older permission cannot make a later action valid.

If the business actually requires an attestation, model a deliberate named statement and record it server-side under the appropriate protocol. Do not fabricate an attestation from a scroll listener or from this layout's presence.

## Acceptance and shortcuts to avoid

Read a long review with keyboard navigation: contents links reach the right sections and essential values stay available. Edit one section and return: the displayed revision and command basis agree. Change the underlying revision before deciding: a stale command cannot silently overwrite or approve newer evidence. Lose access while a confirmation is open: no obsolete local action proceeds. A server-acknowledged decision remains successful even if a later list refresh fails.

Avoid generic submit labels that hide effects, token-only refreshes, fake reading gates, route visitation as consent, and success feedback before acknowledgement. Review presentation explains the decision; the domain protocol decides whether it may commit.

## Sources and provenance

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/components/AppReadableReview.tsx` — complete readable sections, anchor navigation, local actions and decision placement; explicit no-read-gate boundary.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/types/AppTaskPresentation.ts` — review section and heading contracts.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/specifications/hooks/useSpecificationEditor.ts` — pinned values/tokens, authority generations and command acknowledgement as a separate owner protocol.
