# Align time series by timestamps before resampling

**Support: reference recipe.** FRED supplies a concrete weather-integration example and useful limits to improve when adapting it. Its provider adapter, DTOs and resampling helpers are not installed starter APIs. Use the pattern for any parallel-vector source that combines historical and newer observations or produces a regularly spaced export.

## Position is not timestamp identity

The pinned `OpenMeteoService.mergeHourlyData` concatenates each historical vector with its forecast vector. `mergeResponses` takes timezone, UTC offset, elevation and unit metadata from the forecast response. It does not demonstrate that historical units and zone agree, deduplicate overlapping timestamps, sort disordered observations or verify all vector lengths. Selecting disjoint request dates is useful, but it is not validation of the provider response contract.

A consumer should normalize a provider payload into timestamp-keyed rows before merging. Check that every required vector has the declared length, decide whether absent values are rejected or retained as missing, and attach unit/source metadata. Resolve duplicate timestamps using an explicit overlap policy such as reject conflicting observations or prefer a named source with retained provenance. Never zip unequal arrays by truncating to the shortest without reporting lost coverage.

## Name the actual resampling operation

Despite its name, `interpolateToTimestep` performs carry-forward, not linear interpolation. It parses the first and last local timestamps, extends the last by one hour, calculates an output count and uses elapsed whole hours as an array index. That assumes contiguous hourly positions. A missing hour or duplicated timestamp can make position differ from the intended observation time. `getValueOrNull` tolerates a short or null value vector by returning null, but that does not repair alignment.

The separate `adjustValuesToFitExactDateRange` scans for the local hour containing each output point and emits null if none matches. It converts `ZonedDateTime` to `LocalDateTime` for comparison and formats output without a zone. Across different zones or DST ambiguity, that discards information needed to identify an instant. Its inclusive-count policy is floor(duration/step)+1, with an additional not-after-end guard; an endpoint off the step grid is not necessarily emitted. This helper itself does not recheck a positive timestep.

Carry-forward is suitable only if the value's meaning permits it. Repeating an accumulated quantity such as hourly precipitation into several smaller intervals does not conserve its total when those intervals are later summed. Temperature samples, rates, interval totals and circular directions need explicit, potentially different rules. Linear interpolation is not automatically correct either.

## Consumer adaptation

This **pseudocode** needs a provider decoder, time/zone resolver, unit normalizer, missingness policy, overlap policy and bounded resampler. None is installed.

```text
requirePositiveStepAndOrderedRange(request)
requireOutputCountWithinBudget(range, step, endpointPolicy)
rows = decodeEqualLengthVectors(response)
rows = resolveTimesAndNormalizeUnits(rows, declaredZone, unitPolicy)
timeline = mergeByTimestamp(rows, overlapPolicy)
return resample(timeline, grid, perMeasureRule, gapPolicy)
```

Decide whether the grid is instant-based or calendar-local and retain enough zone information to reproduce it. Bound input rows, output rows, request span and work before materialization. Repeated linear scans for every output point can be expensive even when a timestep is positive. See [canonical calendar values and instants](../time/canonical-calendar-values-and-instants.md) and [read budgets and unknown coverage](../queries/read-budgets-and-unknown-coverage.md).

FRED's daily CSV controller indexes every value vector using `dates.size()` without comprehensive length checks. Normalize and validate before export rather than relying on index exceptions. Carry units into an explicit export schema and use a proper bounded CSV writer; see [bounded CSV contracts](../files/bounded-csv-interchange-contracts.md). The source's minimum date, seven-day future ceiling and three-month routing boundary are snapshot application choices, not verified current provider promises.

## Failure, recovery and acceptance

Reject incompatible units or ambiguous timestamps unless a declared conversion/resolution applies. Return explicit missing coverage instead of inventing zeros or carrying values across an unlimited gap. Preserve source provenance so a regenerated export can explain changes after provider corrections.

Acceptance examples include overlapping equal/conflicting timestamps, short vectors, unsorted input, a missing hour, a DST repeat/skip, differing units, zero/negative step, oversized output and an off-grid endpoint. For an interval-total measure, prove conservation under the selected resampling rule. For carry-forward, prove the permitted maximum gap and the absence of any claim that the output is linear interpolation.

## Sources

- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/app/openmeteo/OpenMeteoService.java`
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/app/export/ExportController.java`
