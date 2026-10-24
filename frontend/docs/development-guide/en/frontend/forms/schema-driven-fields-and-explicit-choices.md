# Use schema-driven fields without inventing user intent

A structured form description can reuse text, number, object, array, nullable, and union controls across related commands. It cannot decide what a person's business choice means. Keep transport shape, initial values, explicit selection, and domain validation separate.

This is a **reference recipe**, not an installed starter renderer. CDA declares `FormNode` and initialization utilities; its command features supply additional semantics. The starter uses current TanStack Form and `@rgo-web/frontend` interfaces. Do not replace deliberate feature forms with an imported consumer schema engine merely because both accept JSON-shaped values.

## Trigger and owner

Use a structured renderer when several related operations share genuinely stable field semantics and the feature can supply labels, choices, validation, and accessible presentation. Prefer a custom form when fields represent a specialized task, need rich explanation, or depend on exact domain evidence.

The feature owns the command and authoritative schema. A reusable renderer owns controls and error placement. The editor owns draft lifetime and submission. A topic navigator can organize those controls; CDA's `AppTopicEditor` is navigation/presentation and does not itself implement schema rendering.

CDA's `FormNode` declares a `requireChoice` flag. However, the inspected shared initializer always creates a union's initial value from its first option; it does not consult that flag. Do not describe explicit unselected union behavior as a guarantee of that utility. Implement and validate the requirement in the actual feature/renderer before relying on it.

## Make meaningful choices explicit

This is a **proposed neutral draft contract**, not an installed API:

```ts
type DestinationDraft =
  { choice: null } | { choice: "existing"; recordId: string | null } | { choice: "new"; title: string };

// choice:null remains invalid for submission until the user chooses.
// Switching branches follows an explicit preserve/discard policy.
```

A default branch can be appropriate for a harmless display option. It is inappropriate when “existing” versus “new” decides what resource is created or linked. Validate the discriminator and required branch fields before building the command. Do not submit hidden stale fields from the previous branch.

Similarly, `null`, empty string, zero, and false are distinct values. An empty number input must not silently become zero unless the feature explicitly defines that conversion. Date-only values and exact instants need different parsing rules; CDA's utility distinguishes date formatting metadata and converts an instant to local input text, but a new renderer still needs an explicit reverse-conversion/time-zone contract.

## Decisions and recovery

| Change                           | Required policy                                            |
| -------------------------------- | ---------------------------------------------------------- |
| Union branch changes             | Retain or discard old branch data deliberately             |
| Nullable field is disabled       | Decide whether it becomes null or merely noneditable       |
| Array item added                 | Assign stable local identity where needed                  |
| Schema version changes           | Reconcile existing draft rather than silently reshaping it |
| Server rejects a domain relation | Preserve safe input and attach the real error              |

Runtime shape validation cannot prove current permission, valid linked-record ownership, or freshness. The backend revalidates the complete command. A generic renderer must not turn a currently unavailable option into a free-text escape from those rules.

## Acceptance scenarios

Open a required union with no selection: submission remains invalid. Select a branch, enter values, switch branch, and return: the documented retention policy applies. Clear a nullable number: null and zero stay distinguishable. Add/reorder array items: errors and focus follow stable identity. Load an old schema draft: unsupported fields are not silently submitted. Reject a stale linked resource on the server: the form keeps useful authorized input and offers a precise correction.

Localize labels, help, options, and error messages. Internal property names are not final UI copy. Ensure generated controls have stable labels and error associations, and give long structured forms meaningful topic headings.

## Avoid these shortcuts

Do not make the first union branch an invisible business decision, confuse nullable with empty string, expose raw JSON as universal UX, or assume a type flag is implemented behavior. Reuse mechanics while the feature retains semantics.

## Sources and provenance

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/types/structuredFields.ts` — structured vocabulary and declared choice metadata.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/utils/structuredFields.ts` — initial values, first-option union initialization, and instant-to-local formatting.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/components/AppTopicEditor.tsx` — topic presentation without schema-renderer ownership.
