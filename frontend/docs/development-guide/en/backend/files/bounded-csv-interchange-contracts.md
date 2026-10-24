# Treat CSV as a bounded interchange language

**Support: reference recipe.** Client Discovery's `BankStatementV1` is a deliberately narrow parser, not an installed starter helper or a general spreadsheet importer. Use this pattern when a machine-produced file must become reviewable observations without letting permissive parsing change its meaning.

## Own the byte, grammar and semantic contracts separately

The pinned parser first rejects inputs larger than 10 MiB and decodes with a UTF-8 decoder configured to report malformed and unmappable input. Replacement characters would hide which bytes were actually supplied. It then requires an exact, ordered twelve-column header. Renamed, reordered or additional columns do not silently become another format version. A UTF-8 BOM is not specially stripped, so it changes the first header cell and fails the exact comparison.

The CSV state machine supports comma separators, quoted cells, doubled quotes inside a quoted cell, embedded line breaks while quoted, and CR, LF or CRLF record endings. It rejects unterminated quoting, a quote after already accumulated unquoted text, and text following a closed quoted cell. Spaces after the closing quote are text too; this is not a trimming importer. An unquoted empty final record is not necessarily an additional row, while an actual blank record in the file fails the later twelve-field check. Document this grammar rather than claiming generic CSV compatibility.

Limits exist at several layers:

| Layer             | Observed source policy                 | What it does not prove                               |
| ----------------- | -------------------------------------- | ---------------------------------------------------- |
| Original input    | At most 10 MiB                         | Streaming or request-body limits before allocation   |
| Records           | At most 5,000 data records plus header | That every parsed record can become a qualified fact |
| Cell accumulation | At most 4,096 Java characters          | At most 4,096 UTF-8 bytes                            |
| Parsed field      | At most 4,096 UTF-8 bytes              | Every field permits that many bytes semantically     |
| Data record       | Exactly twelve fields                  | Authentic origin or correct accounting meaning       |

These are peer-project policy values. A consumer chooses its own ceilings and must bound upload buffering before invoking any parser; see [bounded uploads and shared quotas](./bounded-uploads-and-shared-quotas.md).

## Validate the meaning after parsing

Every data cell is checked for NUL and selected leading characters (`=`, `+`, `@`). Empty cells become null. Account identity must exactly match the account selected by the command, and transaction identity must be unique within this import. Dates use the exact calendar-date parser; direction and status use allowlists; amounts use positive exact decimal strings; currency and optional text fields receive additional validation.

The transaction duplicate set is local to this file. It is not cross-import deduplication, proof that a source transaction was never consumed, or permission to overwrite an earlier observation. Those belong to the retained import and reconciliation owner. Likewise, amount syntax does not establish the reviewed currency scale; later qualification owns that check. Follow [exact decimals and rounding policy](../data/exact-decimals-and-rounding-policy.md).

Formula-prefix rejection is a limited input rule. It does not handle every spreadsheet execution trigger, leading whitespace, every control prefix, a leading minus, or every consuming spreadsheet's behavior. A file accepted for software interchange must not automatically be advertised as safe to open in any spreadsheet. Output intended for spreadsheets needs its own explicit export contract; changing stored original bytes to neutralize formulas would also change evidence identity.

## A consumer implementation scenario

The following is **pseudocode**, not an installed API. Missing owners are the bounded byte reader, format registry, strict decoder, parser, account-scope authorizer and retained-artifact service.

```text
authorizeImport(actor, selectedSource)
original = retainBoundedOriginal(upload, configuredByteCeiling)
text = decodeReportingUtf8(original.bytes)
rows = parserFor(exactFormatVersion).parse(text, grammarBudget)
requireExactHeader(rows.header)
entries = validateRows(rows, selectedSource.accountKey)
retainParsedObservation(original.id, parserVersion, entries)
return observationId // not a qualified business effect
```

Preserve the original artifact and parser identity so a correction can be explained. Do not silently skip malformed records and then report the file as completely imported. If partial acceptance is a product requirement, introduce explicit per-record outcomes and a digest/identity contract rather than weakening the parser incidentally.

## Failure, recovery and acceptance cases

A rejected header or malformed cell leaves no qualified effect. Correct the producing exporter or select an explicitly supported format version, then retry through the import owner. A byte-limit rejection should not echo file content into logs. Duplicate identity is a meaningful validation failure, not a reason to keep whichever row happened to appear first.

Acceptance cases to specify include multibyte text exceeding the byte ceiling before the character ceiling, escaped quotes, quoted embedded newlines, trailing text after quotes, alternate line endings, BOM handling, extra or missing fields, a duplicate transaction and a foreign account. Separately prove that an accepted file remains unqualified until the provenance workflow completes. These are design acceptance cases, not evidence that the starter installs or executes them.

## Source

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BankStatementV1.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BillingData.java`
