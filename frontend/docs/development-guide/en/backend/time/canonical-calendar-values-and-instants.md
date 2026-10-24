# Keep calendar values distinct from event instants

**Support status: Vireo temporal reference profile, not an installed field API in this RGO starter.** Vireo's form field uses canonical timezone-free calendar strings, while History accepts offset-bearing timestamps or finite numbers. Adding those packages is a separate consumer decision. Timezone, DST and business scheduling policy remain application-owned.

Use this pattern when a date picker, recurring schedule or audit timestamp crosses frontend/backend boundaries. A calendar date, a local wall-clock time and a unique instant are different values; converting all of them to browser `Date` can invent meaning the user never supplied.

## Preserve the canonical kind

The pinned field parser checks shape and round-trips the formatted result, rejecting invalid dates that a date library might normalize. It supports year, independent month, year-month, date, time and local date-time. Minute precision still serializes zero seconds.

| Kind            | Example                | Meaning                          |
| --------------- | ---------------------- | -------------------------------- |
| Year            | `2027`                 | Calendar year                    |
| Month           | `04`                   | Month without year               |
| Year-month      | `2027-04`              | Calendar month                   |
| Date            | `2027-04-17`           | Date without timezone            |
| Time            | `09:30:00`             | Wall time without date/zone      |
| Local date-time | `2027-04-17T09:30:00`  | Calendar fields without zone     |
| Instant         | `2027-04-17T07:30:00Z` | A specific event on the timeline |

The field uses a UTC-based internal calendar representation for parsing, but its output has no `Z` or offset. That implementation detail is not a decision that the business value means UTC. Localization controls presentation, not timezone conversion.

## Convert only after the domain selects policy

An appointment entered as local date-time needs a selected relevant timezone before it can become an instant. A date such as a birthday or reporting day may never need that conversion. A recurring local time requires a recurrence/zone policy, not a single offset captured from today's browser.

**Pseudocode recipe:** implement canonical parsing, trusted timezone selection, gap/overlap policy, persistence and error UX. These helpers are not starter or automatically available Vireo APIs.

```java
var local = LocalDateTime.parse(command.localStart());
var zone = scheduling.requireConfiguredZone(command.workspaceId());
var decision = scheduling.resolve(local, zone, policy.dstGap(), policy.dstOverlap());
if (decision.requiresUserChoice()) return ambiguity(decision.allowedChoices());
return schedules.retain(local, zone, decision.instant(), policy.version());
```

This does not prescribe a universal gap/overlap rule. An application may reject a nonexistent local time or request a choice for an ambiguous one. State that decision explicitly. Attaching the browser timezone silently or appending `Z` to a local string is not conversion.

## Validate the wire contract at both ends

The reference temporal field enforces canonical widths, seconds, actual calendar validity and configured min/max/step checks. UI validation is not a backend authority boundary. A consumer API still validates its expected kind and business range and returns a safe field-level failure.

Vireo History's default timestamp schema accepts a finite number or an ISO date-time with an offset. “Finite” is not a complete epoch-unit/range contract; an application accepting numeric timestamps must declare units and bounds. Its generated entity timestamp contract uses Java `Instant` and offset-bearing ISO strings, while generated date uses `LocalDate` and a calendar date. Do not map a timezone-free form value into `Instant` without the domain step.

Offset and named zone also differ. An offset identifies the instant relation for that timestamp; it does not encode future timezone rule changes or recurrence semantics. Decide what to retain for schedules versus immutable event history.

## Failure and recovery

Reject malformed or impossible dates instead of silently rolling them into another day. Preserve the user's calendar draft when timezone resolution requires a choice. A locale change should change formatting/labels without changing the canonical submitted value.

When timezone policy changes, distinguish an already-fixed event instant from future local scheduling intent. Recalculation requires an explicit policy/version story, not reformatting a string. Avoid treating empty/invalid input as now, using wall-clock time to measure elapsed durations or relying on one workstation's timezone in domain code.

## Adaptation checklist

- Every field names its calendar/instant kind and canonical wire shape.
- Locale and timezone conversion have separate owners.
- Impossible dates, minute/second precision and business ranges are validated.
- Numeric timestamp units/range are explicit if accepted.
- DST gaps/overlaps and recurrence are application decisions with clear UX.
- Backend conversion never assumes browser zone or appends a fake offset.
- Stored original intent, zone and resolved instant match the domain's future/history needs.

## Exact source references

- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:packages/ui/src/capabilities/forms/components/forms/VireoFormTemporalField/internal/temporalValue.ts` — canonical parser/formatter and precision validation.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:packages/ui/src/integrations/localization/providers/VireoTemporalLocalizationProvider/VireoTemporalLocalizationProvider.tsx` — scoped presentation locale.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:packages/history/src/records/historyRecord.ts` — default finite-number or offset timestamp schema.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:packages/create-vireo/src/entity-renderer.ts` — generated LocalDate/Instant and transport scalar mapping.
