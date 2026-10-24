# Own fixture state, timers and the business clock separately

Determinism does not mean replacing every source of variation with one global mock. It means controlling the inputs that matter: fixture lifetime, response ordering, delayed work, exact business time, locale, and time zone. Give each a clear owner so one scenario cannot alter another's world.

This is an **installed starter pattern with backend reference examples**. Lookup API tests use independent fixture instances and fake timers; formatter tests supply exact instants/locales/zones. CDA service tests inject a fixed Clock, while calendar tests use explicit date/instant boundaries. These are inspected designs, not execution results.

## Trigger and ownership

Use deterministic fixtures when behavior includes first-failure counters, delayed requests, expiry, billing/calendar boundaries, generated identities, or localized output. The test owns synthetic inputs and cleanup. The production abstraction owns whether time means elapsed duration, a calendar date, or current authority evaluation.

The starter lookup suite creates separate API instances and verifies that each retains its own controlled first failure. One scenario cannot consume another's failure counter. Its cancellation scenario starts fake timers, aborts pending/already-aborted requests, asserts no timers remain, and verifies that cancellation did not consume the intended first real failure.

## Choose the right control

This is **inert design pseudocode**, not an installed helper:

```text
Delayed lookup:
  use fake timers for transport delay
  attach rejection observation before abort/release
  advance only the work the scenario owns
  restore real timers afterward

Expiry rule:
  inject a fixed business Clock
  evaluate just before, at and after the boundary
  keep locale and time zone explicit
```

A fake JavaScript timer controls scheduled work; it does not automatically make a backend clock or server transaction deterministic. A held promise controls response order; it does not prove elapsed time. Pick the tool from the claim rather than globally freezing everything.

The lookup suite restores real timers in `afterEach`. Preserve failure-safe restoration even if an assertion rejects. Do not run all timers blindly when the code owns a recurring schedule or retry loop; use bounded advancement and cleanup that matches the intended lifetime.

| Input                  | Preferred design                         | Important limitation                                   |
| ---------------------- | ---------------------------------------- | ------------------------------------------------------ |
| Controlled API failure | Fresh fixture instance                   | Mock reset may not reset closed-over counters          |
| Network ordering       | Explicit started/release gates           | Sleep does not establish order                         |
| Timer delay            | Owned fake timers                        | Unrelated real I/O may need a different boundary       |
| Current business time  | Injected Clock/fixed instant             | Host clock assumptions leak otherwise                  |
| Calendar period        | Explicit zone/date/anchor                | Adding hours is not calendar-day arithmetic            |
| Generated ID           | Stable synthetic identity where asserted | Global UUID mock can hide collision/ownership behavior |
| Locale formatting      | Explicit locale and zone                 | Runtime/Intl versions still affect supported output    |

## Dates and fixtures need semantic boundaries

Starter formatter tests distinguish UTC and Europe/Zagreb for the same instant and require an explicit currency rather than infer it from locale. CDA calendar scenarios include leap anniversaries, month-end anchors, and daylight-saving boundaries. Those cases illustrate why “tomorrow is now plus 24 hours” is not a universal calendar rule.

CDA's attention service fixture supplies a fixed Clock directly to its collaborators. Prefer a deliberate injected time seam for new business rules over reflective field mutation or real sleeps. That recommendation is not a claim that every historical service already exposes the same constructor contract.

Unique IDs can be useful for database fixture isolation without making expected behavior random. Assert relationships and returned IDs where appropriate; use exact synthetic IDs when identity itself is the contract. Do not copy real datasets to obtain realistic-looking cases.

## Failure and acceptance scenarios

Two fixture instances fail independently. Aborted work leaves no timer and does not consume a later scripted outcome. A rejected assertion still restores timers/spies. A date rule behaves correctly before, exactly at, and after expiry under one fixed clock. Month-end/leap/DST inputs preserve the agreed calendar semantics. Formatting explicitly names locale/zone. Repeating or reordering scenarios does not inherit counters, storage, or clock overrides.

Avoid overspecifying incidental timestamps in snapshots. Assert exact time when exactness is the business contract, and an explicit relation/range when that is the contract. Do not widen tolerances until a flawed time assumption stops failing.

## Avoid these shortcuts

Do not use wall-clock sleeps for business expiry, share a scripted API singleton, leave fake timers active, infer time zone from the workstation, or make randomness disappear through a global patch without considering what it hides. Determinism comes from meaningful owned inputs.

## Sources and provenance

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/features/development-guide/patterns/forms/api/asyncLookup.api.test.ts` — per-instance failures, owned timers, cancellation, and timer restoration.
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/app/localization/formatters.test.ts` — exact instant/locale/zone and explicit currency assertions.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/test/java/com/vireocode/clientdiscovery/discovery/AttentionServiceTests.java` — injected fixed-clock service fixture.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/test/java/com/vireocode/clientdiscovery/discovery/ServiceCalendarTests.java` — month-end, leap, exact-trigger, and DST calendar boundaries.
