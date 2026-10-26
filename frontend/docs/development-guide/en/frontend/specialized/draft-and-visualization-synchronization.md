# Keep one draft behind form and visual preview

A map, diagram, or arrangement preview can show the same draft as form fields without becoming a second source of business truth. Define the forward mapping from draft to visual state and the reverse mapping from explicit visual interaction to draft changes. Persistence remains a separate named command.

This is a **reference recipe** from FRED form/map integration and LMS aggregate arrangement. Their historical React Hook Form/OpenLayers helpers are not installed starter APIs. The transferable contract is one canonical draft plus owned adapters, not adding map libraries to every template consumer.

## Trigger and ownership

Use synchronized visualization when a visual explains or edits the same facts as controls: a neutral rectangle's dimensions, a diagram node's position, or an ordered arrangement. The form/feature owns canonical draft values and validation. The visualization adapter owns preview objects and listeners. The command owner submits the agreed domain representation.

FRED's `useFormInteraction` watches form values, maps them to a DTO, and calls a feature method to reload preview geometry. It exposes the form and feature object. It does not itself prove full interaction cleanup, bidirectional synchronization, or persistence. LMS updates staged child values and preserves arrangement coordinates when replacing a child; the parent later submits the aggregate.

## Define both directions deliberately

This is **neutral conceptual code**, not an installed SDK API:

```ts
type ShapeDraft = { width: number; height: number; x: number; y: number };

function toPreview(draft: ShapeDraft) {
  return { origin: [draft.x, draft.y], size: [draft.width, draft.height] };
}

// Form change -> validate/derive -> update existing preview.
// Completed drag -> convert SDK coordinates -> patch canonical draft.
// Save -> validate complete domain command -> API acknowledgement.
```

Do not let preview events immediately call Save. A programmatic preview update may itself emit SDK events; identify their origin or compare meaningful values so the forward path does not recursively trigger the reverse path. The final interaction boundary should be explicit: a drag end may update the draft, while intermediate moves only update a lightweight preview if the feature chooses.

Coordinate systems, units, precision, and snapping rules belong to the adapter/domain contract. Pixels are not necessarily business distance, and a projection transform can be lossy. Keep authoritative constraints in domain validation and the backend; a visually plausible arrangement is not proof of validity.

| Change                                | Canonical draft                       | Preview                      |
| ------------------------------------- | ------------------------------------- | ---------------------------- |
| Numeric field edited                  | Update field through form owner       | Derive new geometry          |
| Explicit visual interaction completed | Apply validated mapped patch          | Reflect resulting draft      |
| Programmatic preview update           | No independent business mutation      | Suppress feedback loop       |
| Cancel task                           | Restore/drop draft under owner policy | Remove or reset preview      |
| API rejects save                      | Preserve safe draft and errors        | Show same unsaved preview    |
| Owner changes                         | End old draft/interaction lifetime    | Detach old objects/listeners |

## Failure and recovery

A failed geometry conversion must not corrupt the draft with invalid numbers. Preserve the last meaningful value, explain the issue, and provide a nonvisual correction path. If a remote update changes the editing basis, use stale/reconciliation policy rather than silently repainting over typed input.

Attach and detach preview layers, interactions, and callbacks under the SDK lifecycle owner. FRED's mapping hook alone does not demonstrate those disposal guarantees; inspect the consuming feature before adopting it. Late events from a removed preview must not patch a new editor with the same component instance.

Use form-level dirty state for user intent, not “SDK object changed.” Derived drawing operations should not mark a clean form dirty repeatedly or trigger unsaved prompts by themselves.

## Acceptance scenarios

Change a field: one canonical value and preview update. Drag the preview: the mapped draft changes once without an event loop or server write. Cancel: both return according to the same draft policy. Submit invalid geometry: client/server validation rejects it without losing safe input. Unmount during interaction: listeners end and late events cannot affect a new owner. Use keyboard/nonvisual controls: the same domain values can be entered and reviewed. Save successfully: the accepted baseline and preview agree.

Localize units, constraints, errors, and interaction instructions. Do not communicate validity solely with shape color, and provide accessible controls for essential visual choices.

## Avoid these shortcuts

Do not keep two uncontrolled drafts, save on every SDK event, compute server rules only from canvas pixels, leak detached preview objects, or confuse a successful redraw with persistence. The preview is a representation of owned draft intent.

## Sources and provenance

- `FRED/FRED-front@7a78e4f624e4b51ce1cdb9334036f2fb6119f62a:src/features/map-interactions/hooks/useFormInteraction.ts` — form-to-DTO-to-preview mapping and limits of the helper's lifecycle scope.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/lockage/components/LockageForm/LockageForm.tsx` — staged child replacement, coordinate preservation, and later aggregate submission.
