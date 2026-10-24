# Share form mechanics while keeping entity mode explicit

Create and update are different operations. An update form needs the entity being edited; a create form needs its own defaults. Express that difference in the interface, then share validation timing, localized schemas, and acknowledged submission behavior without moving routes and data ownership into a universal form factory.

This is an **installed starter pattern**. `AppEntityFormMode` is a discriminated union keyed by the current library's form group. Create forbids an initial entity; update requires one. `buildAppEntityFormOptions` supplies submit-first/change-after-submission validation and awaits the owner submission before calling `onSaved`.

## Trigger and ownership

Use the shared seam for ordinary entity forms that need consistent validation timing and lifecycle reporting. The feature defines values, schema, field presentation, create defaults, and update mapping. The parent owns API calls, success/error state, closing/navigation, and any stale-revision protocol. The shared helper does not decide which endpoint to call.

The starter exposes a schema-factory type receiving translation and explicit context. Build localized validation from that owner rather than hardcoding English strings in a generic utility. LMS's historical `useLmsForm` also injects translation, which supports the recurring requirement, but its React Hook Form wrapper is not a current starter API.

## Make operation identity visible

This is a **neutral illustration of the contract**, not the exact installed type:

```ts
type DocumentFormMode =
  { mode: "create"; initialValue?: never } | { mode: "update"; initialValue: { id: string; title: string } };

// Feature: map mode to defaults and schema context.
// Owner: await the actual command result before success/closing.
```

Do not use `initialValue?: Entity` to silently mean both operations; an absent entity can then accidentally turn a failed update load into a create form. Resolve loading/missing/denied before mounting a valid update owner. If the record changes, choose an explicit reset or new editor session rather than assuming changed defaults replace current typed values.

| Concern           | Shared policy                         | Feature/parent responsibility                          |
| ----------------- | ------------------------------------- | ------------------------------------------------------ |
| Validation timing | Submit first, then revalidate changes | Correct cross-field rules and messages                 |
| Value parsing     | Validate before owner callback        | Map domain input and expected revision                 |
| Submission        | Await supplied promise                | Resolve only under the actual acknowledgement contract |
| Success callback  | Run after submission resolves         | Close/reset/navigate deliberately                      |
| Failure           | Rejection must not become success     | Present error and preserve safe input                  |

## Failure and recovery

The inspected helper reports submitting state before parsing and awaiting the callback. It does not implement a general `finally` reset, remote conflict recovery, or form-state subscription by itself. Integrate the form's real lifecycle reporting so a rejected parse or request cannot leave the parent permanently busy. Do not infer a complete pending-state machine from one helper.

A resolved callback is only as truthful as its implementation. If it starts a request without returning/awaiting it, `onSaved` runs too early. If it treats HTTP acceptance as final completion for an asynchronous command, the form needs a different outcome flow. Cache observer failure after a known commit also needs separate handling from actual write failure.

## Acceptance scenarios

A create caller cannot provide an accidental initial entity under the installed type. An update caller cannot omit it. Invalid values do not reach the API. First submission exposes localized errors; later edits revalidate under the shared policy. A rejected API promise keeps the form open and useful input intact. A successful acknowledged promise invokes the deliberate completion path. Switching edited identity does not silently overwrite a dirty session.

Keep labels, validation, create/update titles, and completion actions localized. Validation should attach to the correct field and support accessible error focus; sharing schema timing does not remove that feature responsibility.

## Avoid these shortcuts

Do not build one giant form owner for routing, fetching, permissions, and fields; infer operation from an optional object; copy historical hooks; or close before awaiting acknowledgement. A small shared policy leaves the meaningful operation explicit.

## Sources and provenance

- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/src/app/forms/types/AppEntityForm.ts` — operation union, lifecycle props, and localized schema-factory context.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/src/app/forms/utils/buildAppEntityFormOptions.ts` — validation timing, parsing, awaited submission, and success callback.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/shared/hooks/useLmsForm.ts` — historical translation injection, not an API to port.
