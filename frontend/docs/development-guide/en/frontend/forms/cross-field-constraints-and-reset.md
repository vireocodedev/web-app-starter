# Validate related fields and reset incompatible selections

A valid field can become invalid when another field changes. A selected person may no longer belong to the chosen department; an end time may now precede the start; a reason may be required only for one request type. Define both the constraint and the transition that keeps the draft coherent.

This is an **installed starter pattern with historical extensions**. The dependent-fields examples use current TanStack Form listeners and subscriptions, while a localized schema checks the relationships. FRED's old dependent-validation hook and LMS date controls illustrate recurring needs; their React Hook Form wrappers are not current APIs to port.

## Trigger and ownership

The feature owns relationships and clearing policy. The schema owns final validity and field error paths. A field listener handles a deliberate user change; a subscription renders only the dependent view. Do not mutate unrelated fields during render or use a generic effect that resets inputs after every object identity change.

The installed department example computes the new allowed options when department changes and clears `assigneeId` only if the previous selection is no longer valid. It does not blindly clear every choice. The conditional-reason example clears an obsolete reason when switching back to the standard request type. Its schema independently requires a reason for the exception and verifies assignee membership.

## Couple transition and validation

This is a **neutral rule illustration**, not a new form helper:

```ts
function keepOrClearSelection(selectedId: string | null, allowedIds: readonly string[]) {
  return selectedId !== null && allowedIds.includes(selectedId) ? selectedId : null;
}

// A user changes the parent choice -> keep or clear dependent value.
// The complete schema still rejects an incompatible submitted relationship.
```

Clearing improves the draft but is not enforcement. API callers can bypass the UI, and options can change remotely. The backend must validate the relation at execution. An async option read also needs request ownership so a late result for parent A cannot repopulate choices for parent B.

For dates, decide whether values represent calendar dates, local wall-clock input, or exact instants. An end-time constraint must define null semantics: open-ended may be allowed, or both endpoints may be required. Do not use truthiness that mistakes zero for absence. LMS sets visual min/max bounds between start and end controls; such UI bounds alone do not prove schema or server validity.

| Transition                              | Value policy                                              | Error policy                                  |
| --------------------------------------- | --------------------------------------------------------- | --------------------------------------------- |
| Parent changes, child still allowed     | Preserve child                                            | Revalidate relevant relation                  |
| Parent changes, child no longer allowed | Clear child deliberately                                  | Show required/invalid message at child        |
| Conditional field becomes irrelevant    | Clear or retain under documented policy                   | Remove obsolete error from active submission  |
| Date bound changes                      | Preserve user intent or explicitly clear invalid endpoint | Attach range error to useful correction field |
| Remote options revoke selection         | Mark/reconcile current draft                              | Do not silently submit hidden invalid ID      |

## Failure and recovery

Validation timing matters. The starter uses submit-first/change-after-submission behavior. Once errors are visible, changing a related field should update the relevant error rather than leave a stale warning until another submit. FRED's historical hook revalidates related fields after submission but assumes its watched-field list never changes and suppresses exhaustive dependencies. Transfer the requirement, not that suppression into current hooks.

A server error tied to an old relationship should not stick to an unrelated replacement selection forever. Clear/revalidate it through the owner with knowledge of which request produced it. Conversely, hiding a control must not make a still-submitted invalid value disappear from validation by accident.

## Acceptance scenarios

Choose a valid child, change parent to one that still permits it: the child remains. Choose an incompatible parent: it clears. Submit an invalid relationship programmatically: the schema and server reject it. Change start after end following a failed submit: the error updates at the intended field. Switch an exception to standard: obsolete reason and required error follow policy. Race two async option reads: the old parent cannot restore incompatible options.

Localize relationship-specific messages and explain deliberate clearing where it may surprise the person. Preserve focus on the current control and make dependent disabled-state explanations accessible.

## Avoid these shortcuts

Do not retain invisible invalid IDs, clear every downstream field indiscriminately, mutate during render, treat date-picker bounds as enforcement, or copy old hooks with ignored dependencies. Related values need one transition policy and one complete validity contract.

## Sources and provenance

- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/src/features/development-guide/patterns/forms/components/DependentFieldsPanel/DepartmentAssigneePreview.tsx` — listener-based conditional selection clearing and dependent subscription.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/src/features/development-guide/patterns/forms/components/DependentFieldsPanel/ConditionalReasonPreview.tsx` — explicit irrelevant-field clearing.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/src/features/development-guide/patterns/forms/validation/forms.validation.ts` — localized relational constraints and field error paths.
- `FRED/FRED-front@7a78e4f624e4b51ce1cdb9334036f2fb6119f62a:src/lib/react-hook-form/hooks/useDependentFieldValidation.ts` — historical post-submit related-field revalidation and dependency limitation.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/lockage/components/LockageForm/LockageForm.tsx` — coupled date control bounds and local aggregate relationships.
