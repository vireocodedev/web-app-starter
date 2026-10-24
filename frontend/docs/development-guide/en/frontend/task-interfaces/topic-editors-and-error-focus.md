# Topic navigation keeps one form and one owner

Use topic navigation when a long form contains distinct groups of work but still submits one business command. Moving from “Details” to “Attachments” changes the visible section; it does not create a second record, save a partial draft, or establish that earlier answers are valid.

This is a **reference recipe**. Client Discovery's `AppTopicEditor` supplies presentation and navigation; it is not an installed starter export. A consumer adapting it should retain the starter's form owner and validation policy rather than introduce a competing form controller.

## Keep values above the selected topic

The feature owns the form instance, initial baseline, selected topic ID, dirty state, validation, submission and navigation guards. Topics contain stable IDs, translated titles and rendered field content. The presentation component receives that data, an explicit selection callback, error links, busy state and an owner-supplied final action.

In the inspected source, every topic section remains mounted. Inactive sections use `hidden` and `display: none`; field values are not reset by changing topics. This solves a common loss of unsubmitted values, but hiding is not lifecycle cleanup: effects, subscriptions and expensive widgets inside hidden topics remain mounted too. Choose deliberately whether an embedded map or large preview should defer its own expensive work.

Do not place one form instance in each topic and merge their values only at the final click. That makes cross-topic validation, dirty tracking and exact command construction harder to reason about. A separately saved child resource is a different operation and deserves an explicit owner.

## Navigation is not validation or persistence

The following is **illustrative consumer composition**, not an importable starter component:

```tsx
<TopicEditor
  topics={topicsOwnedByThisForm}
  topicId={selectedTopic}
  onTopicChange={setSelectedTopic}
  errors={visibleFormErrors}
  busy={commandPending}
  finalAction={
    <Button type="submit" disabled={commandPending}>
      {t("documents.create")}
    </Button>
  }
/>
```

The actual reference component also requires translated navigation labels. Its previous/next controls use `type="button"`; the final action is supplied as-is. Therefore the owner must set its submit behavior, accessible name, authority conditions and disabled state. Passing `busy` does not magically configure an arbitrary supplied button.

The reference navigates directly between topics; “Next” does not validate the section. If a consumer needs gated steps, define that workflow separately and explain the prerequisite. Never let a step label silently imply that data has been persisted or accepted by the server.

Keep final submission responsible for the complete authoritative validation and command. Decide how native browser validation interacts with hidden required controls; do not disable hidden fields merely to bypass validation, because disabling can also change submitted values. Use the form library's intended validation/submission contract consistently.

## Error links change topic and focus

A topic error has its own stable ID, owning topic ID, translated message and optional field ID. The source's default error handler selects the topic and schedules focus to its field, or to the topic heading when no field is specified. Headings are programmatically focusable and use the shared sticky-header offset.

An override of `onErrorSelect` transfers that responsibility to the owner. It must reveal the right topic and move focus after the target is mounted and visible. If topic updates become asynchronous, use committed visibility/readiness rather than assuming one animation frame always completes the transition.

A focus change must follow a user navigation or error-selection action. Do not focus the first field on every background query refresh. Keep labels, error summaries and previous/next copy localized, and preserve logical heading levels supplied by the containing page.

## State and failure decisions

| Situation                                 | Expected behavior                                                                            |
| ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| User moves between topics                 | Preserve values, dirty state and the same form instance                                      |
| Final validation finds an error elsewhere | Show a linked summary that reveals and focuses the target                                    |
| Command is pending                        | Block topic changes and duplicate submission in the operation owner                          |
| Available topics change                   | Normalize the selected stable ID deliberately; do not infer permission from a fallback index |
| User leaves the editor                    | Existing dirty/busy navigation guards decide whether departure is allowed                    |
| Server rejects the command                | Retain safe input and identify the affected fields or business conflict                      |

The inspected component falls back to the first topic for an unknown selected ID. Treat that as a presentation fallback, not validation of a route parameter or evidence of authority. An empty topic list needs an explicit owner state rather than a misleading “1 of 0” form.

## Acceptance and shortcuts to avoid

Enter a value on one topic, navigate twice and return: the value and validation history remain. Select an error on another topic: the actual field receives focus. Start submission: both navigation and the supplied final action respect pending state. Change locale: translated labels change without changing topic identity or input. Navigate away with unsaved work: the editor's existing guard still applies.

Avoid remounting the form with `key={topicId}`, using array indexes as semantic IDs, treating “Next” as a hidden save, or letting an inaccessible error summary point to a hidden field. Topic presentation helps people complete one operation; it does not own business completion.

## Sources and provenance

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/components/AppTopicEditor.tsx` — mounted sections, selection, busy guards, error links, focus and final-action seam.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/forms/types/AppTaskPresentation.ts` — topic and error contracts.
