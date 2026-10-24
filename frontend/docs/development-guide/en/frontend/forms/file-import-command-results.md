# Treat file import as a command with an explicit result

Choosing a file, uploading its bytes, accepting an import, and applying its records are different steps. Define which step the API acknowledges and render a result that lets the person understand what changed and what needs correction. A completed browser upload is not automatically a successful business import.

This is a **reference recipe with required protocol extensions**. LMS sends a `File` through an API boundary as multipart data, validates a returned entity array, shows localized mutation feedback, and invalidates the affected entity queries. That small synchronous hook does not demonstrate async jobs, rejected-row summaries, idempotency receipts, or file-security validation. Add those contracts explicitly when the feature needs them.

## Trigger and ownership

Use an import owner for a bounded file format that changes server state. The form owns selected file and user options. The API owns multipart transport and response schema. The backend owns authorization, byte/content limits, parsing, domain validation, transaction/partial-acceptance policy, and durable result identity. The result view owns readable counts, errors, and next actions.

File extension and browser MIME are input hints, not server validation. Publish supported format/size guidance, but enforce actual limits at the server and parser. Do not include sensitive row contents in generic diagnostics or copy arbitrary server paths into download links.

## Name the outcome contract

This is a **proposed neutral result**, not LMS's installed response:

```ts
type ImportResult =
  | { state: "accepted"; jobId: string }
  | {
      state: "completed";
      importId: string;
      applied: number;
      rejected: number;
      issues: { row: number; field?: string; code: string }[];
    };

// accepted -> observe/query exact job outcome.
// completed -> show receipt, scoped refresh, and correction path.
```

Choose atomic import or explicit partial acceptance. If one invalid row rejects the whole file, say so before submission and in the failure. If valid rows apply while others fail, the result must explain exactly which outcomes are known. Retrying a corrected file can otherwise repeat records already applied.

The inspected LMS API returns a schema-validated entity array directly, so its hook treats API success as its synchronous mutation success boundary. Do not silently reinterpret that array as proof of a richer per-row or asynchronous receipt protocol. For a new job endpoint, 202 means acceptance only.

| Outcome                                | UI behavior                 | Retry rule                                       |
| -------------------------------------- | --------------------------- | ------------------------------------------------ |
| File not selected/unsupported locally  | Explain requirement         | No command sent                                  |
| Server rejects content/format          | Show safe actionable error  | Correct file/options                             |
| Upload response lost                   | Show uncertain outcome      | Reconcile or reuse supported request identity    |
| Job accepted                           | Show processing identity    | Observe job, do not create another blindly       |
| Partial completion                     | Show applied/rejected scope | Retry only under documented deduplication policy |
| Completion acknowledged, refresh fails | Preserve import receipt     | Retry read, not import                           |

## Failure and download recovery

Prevent accidental duplicate submission while an import is in flight. Transport abort does not prove rollback after bytes reached the server. Stable retry identity requires backend receipts tied to the actual file/options identity; generating a UUID per click is insufficient.

A rejected-row report or export needs its own authorization and lifetime. FRED's specialized ZIP-to-TIFF helper demonstrates blob URL creation, temporary anchor download, and URL revocation on its successful path. It chooses the first matching archive entry and does not prove safe general archive extraction. Do not copy it as an unrestricted upload/import pipeline. Bound archive expansion and choose entries under the format contract; release temporary anchors and object URLs in failure-safe cleanup.

## Acceptance scenarios

Reject an oversized or invalid file at the server even if the browser accepted its name. Lose the response after a possible commit: the UI does not automatically repeat with a new identity. Return an accepted job: display processing until final evidence arrives. Return partial results: applied and rejected work is clear and correction does not duplicate accepted records. Fail cache refresh after completion: the import remains acknowledged. Navigate away: late feedback cannot alter a replacement editor, and temporary download resources are released.

Localize format guidance, processing, row/field issue labels, completion, uncertainty, and recovery. Keep the result available beyond a transient toast; provide keyboard access to error summaries and safe report downloads.

## Avoid these shortcuts

Do not trust MIME/extension as security, equate upload completion with applied records, retry arbitrary imports automatically, hide partial results behind “success,” or expose server filesystem paths. The import's business outcome needs an explicit command contract.

## Sources and provenance

- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/failureReport/features/failureRecipient/hooks/mutations/useFailureRecipientImportCsvMutation.tsx` — File boundary, localized feedback, and scoped invalidation.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/failureReport/features/failureRecipient/api/failureRecipient.online.ts` — multipart file transport and validated synchronous entity-array response.
- `FRED/FRED-front@7a78e4f624e4b51ce1cdb9334036f2fb6119f62a:src/infrastructure/utils/downloadTifFromZip.ts` — specialized archive download, temporary resources, and limits of the example.
