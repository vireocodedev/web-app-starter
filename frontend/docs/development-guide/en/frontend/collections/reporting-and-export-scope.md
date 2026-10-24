# Give reports and exports the same explicit data scope

An Export button must explain what it exports: visible page, selected records, or every match under the current filters. Share the report's data definitions and formatting policy across screen and file output, while allowing each renderer to use a suitable layout.

This is a **reference recipe** from LMS reporting. Its report card receives filters, rows, columns, a period caption, stable row keys, and an owner-supplied export callback. Dedicated PDF components render report data separately. These historical table/PDF helpers are not installed starter APIs, and the card does not infer export scope or guarantee a server snapshot.

## Trigger and ownership

Use a report owner when filters, period navigation, totals, and downloadable output describe one dataset. The owner defines normalized filter/time-zone semantics and result identity. The screen table owns interactive presentation. The export action owns authorized data acquisition, size limits, formatting, and download lifecycle.

LMS's card keeps client pagination for its supplied rows and delegates export through `onExport`. It disables export for empty data unless the owner overrides the decision. That is a presentation seam, not proof that export means the currently visible page. The callback must choose and label its actual scope.

## Define a portable report request

This is a **proposed neutral contract**, not an installed report API:

```ts
type ReportRequest = {
  workspaceId: string;
  period: { start: string; endExclusive: string; timeZone: string };
  filters: { status: "active" | "all" };
  scope: "all-matches" | "selected" | "current-page";
  selectedIds?: readonly string[];
};

// Normalize once, then use the same meaning for screen and export.
// Authorization and bounded data acquisition remain server responsibilities.
```

Do not assume a date caption proves query bounds. Define inclusive/exclusive endpoints, calendar interpretation, and time zone explicitly. LMS's PDF example has local date/time formatting helpers; it demonstrates dedicated rendering but not a universal time-zone normalization contract. Adopt the application's current date policy rather than copying incidental browser-local behavior.

A report can share column meaning, calculations, labels, and normalized values without sharing the exact React component tree. PDF pagination and headers differ from a responsive table. Use text-based output where appropriate instead of a screenshot that loses selectable content, meaningful structure, and predictable pagination. Do not claim PDF accessibility guarantees without implementing them.

| Scope               | Required behavior                                                 |
| ------------------- | ----------------------------------------------------------------- |
| Current page        | Export exactly that page and label it                             |
| Selected records    | Name and validate selection scope, including cross-page selection |
| All matches         | Fetch/export all authorized matches within explicit limits        |
| Historical snapshot | Use the agreed immutable snapshot/revision identity               |
| Large report        | Use a bounded server job or other deliberate delivery protocol    |

## Failure and recovery

A background refresh can change results while export is preparing. Decide whether the output represents a captured report request, an immutable server snapshot, or current state at generation time. Include useful period/filter/generated metadata where the product needs traceability. Do not silently combine rows from incompatible revisions and describe them as one exact snapshot.

Keep export preparation, server job acceptance, generation, and file download distinct. A 202 response is not a completed file. A failed download does not necessarily mean generation failed. Preserve an acknowledged job/result identity so retry downloads do not create duplicate generation work where that matters.

Apply server authorization to exports separately from screen visibility. Bound row counts, memory, time, and file size. Sanitize filenames and output values according to the chosen format; CSV, spreadsheet, and PDF consumers have different interpretation risks. Never expose arbitrary server filesystem paths as download handles.

## Acceptance scenarios

Export a filtered multi-page collection: output scope matches its label and period semantics. Select records across pages: only the explicit selected scope is exported. Change filters while generation is pending: the result still identifies the captured request. Produce no matches: export is disabled or deliberately generates an empty report under documented policy. Lose the download after job completion: recovery uses the known result. Revoke permission before download: server access is rechecked. Compare screen and file totals under one request: definitions agree.

Localize report headings, period captions, export scope, progress, and errors. Keep the screen table accessible independently of the file. A download action should identify format and scope without hiding essential information in a tooltip.

## Avoid these shortcuts

Do not export unlabelled all-data while showing one filtered page, use locale-ambiguous numbers as machine values, let table pagination accidentally define server scope, or promise exact snapshots from unrelated reads. Report meaning belongs to the owner; presentation can vary.

## Sources and provenance

- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/statistics/components/StatisticsReportTableCard/StatisticsReportTableCard.tsx` — filters/caption, stable identity, client paging, delegated export, and empty disable policy.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/statistics/components/StatisticsDateNavigationButtons/StatisticsDateNavigationButtons.tsx` — shared presentation of owner-supplied period navigation.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/statistics/features/statisticsShiftComments/components/StatisticsShiftCommentsPdfDocument/StatisticsShiftCommentsPdfDocument.tsx` — dedicated PDF renderer, explicit data/translations, and local formatting scope.
