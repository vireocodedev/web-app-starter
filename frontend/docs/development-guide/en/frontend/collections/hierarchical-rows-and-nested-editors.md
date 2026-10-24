# Give expanded rows and child editors explicit draft boundaries

A parent form can contain editable child rows without making every child edit a separate server transaction. Decide whether a child dialog changes a local aggregate draft or persists an independent resource, and make that boundary visible in callbacks and button labels.

This is a **reference recipe** from LMS aggregate forms and FRED expansion presentation. Their historical React Hook Form/table wrappers are not current starter APIs. Transfer ownership and identity rules; implement controls through the current form/table interfaces.

## Trigger and ownership

Use hierarchical rows for a real parent/child relationship that benefits from compact overview and optional detail. The parent aggregate owns its complete staged value and final command. A child dialog owns a temporary editing copy until Apply or Cancel. Expansion owns visibility, not selection or persistence.

The inspected LMS form combines child collections, uses a dialog callback to replace the matching child in parent form state, and removes children locally. The parent submission maps temporary IDs before sending the complete aggregate. This demonstrates a staged aggregate path; it does not make every child editor in that application local-only.

FRED's expandable row uses a separate button and a collapsed detail row. It unmounts the detail content on collapse. That is fine for read-only detail but can destroy field state if editable controls live only there. Put durable draft state in the owner or deliberately keep the editor mounted.

## Separate identities and actions

This is a **conceptual neutral model**, not an installed API:

```ts
type DraftLine = {
  localId: string;
  serverId: string | null;
  title: string;
  quantity: number;
};

// Apply child: replace by localId in the parent's draft.
// Cancel child: discard only the dialog copy.
// Save parent: validate and submit the complete agreed aggregate.
```

A local ID remains stable across sorting, expansion, and edits. A server ID identifies a persisted record. Do not conflate them or use the array index as both. LMS historically generates a negative timestamp ID for new children; that is not a universal identity protocol and can collide. Prefer a deliberate stable local identity with explicit transport mapping.

| Action                          | Local effect                            | Remote effect                    |
| ------------------------------- | --------------------------------------- | -------------------------------- |
| Expand row                      | Show detail                             | None unless owned lazy read      |
| Select row                      | Update selection scope                  | None                             |
| Apply staged child edit         | Update parent draft                     | None until parent command        |
| Cancel child edit               | Drop temporary copy                     | None                             |
| Save independent child resource | Follow that resource's command contract | Explicit acknowledged mutation   |
| Save aggregate                  | Validate complete parent/child intent   | One documented aggregate command |

## Failure and recovery

Do not accidentally nest HTML forms or let a child Apply button submit the parent. Portal presentation does not by itself define submission ownership. Use explicit form association and button types, and inspect the real dialog/form boundary.

If parent validation rejects a child, map errors to that child's stable identity and provide a way to open or expand it. If a child disappears remotely during editing, reconcile against current authority and revision rather than replacing a different row at the old index. Cancellation should not preserve accidental mutations made directly to a shared object.

Expansion, row click, checkboxes, and embedded links need distinct interaction semantics. FRED's historical markup includes a checkbox row role without a complete selection protocol; do not copy that as accessibility guidance. Use the current component's supported semantics, `aria-expanded`/control relationships where appropriate, and localized action names.

## Acceptance scenarios

Edit a child and cancel: the parent remains unchanged. Apply it: only the intended local row changes and no server write occurs in a staged flow. Reorder rows: open editors, errors, and selection keep the same identity. Collapse detail: required draft state survives under its owner. Save the parent with an invalid child: the exact row can be reached and corrected. Trigger child Apply with Enter: it does not unintentionally submit the parent. Reject the server command: safe aggregate input remains available.

## Avoid these shortcuts

Do not treat expansion as selection, persist half an aggregate unintentionally, mutate a shared child before confirmation, rely on array indices, or advertise negative timestamps as a standard. A nested editor needs a named draft and commit boundary.

## Sources and provenance

- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/lockage/components/LockageForm/LockageForm.tsx` — local child replacement/removal, temporary identity, and aggregate submission mapping.
- `FRED/FRED-front@7a78e4f624e4b51ce1cdb9334036f2fb6119f62a:src/shared/components/data-display/FredTable/components/FredExpandableTableRow/FredExpandableTableRow.tsx` — separate expansion control, detail-row layout, and unmount/markup limitations.
