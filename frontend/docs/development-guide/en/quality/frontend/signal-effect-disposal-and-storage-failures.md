# Verify signal effects stop and storage failure preserves live state

A signal's computed value and its persistence effect have different contracts. A state update can be valid even when browser storage fails. An application effect that has been disposed must stop persisting later updates. Test those boundaries independently instead of asserting that a subscription callback ran.

This is an **installed starter pattern**. Estimate signal tests cover normalized source values, derived total, typed-storage hydration, persistence status, disposal, and quota-like failure. Bootstrap tests verify hydration happens before effect startup and disposal runs in reverse module order. These are inspected assertions, not a report of executed checks.

## Trigger and ownership

Use these scenarios for application-lifetime reactive effects, persisted preferences, and feature signal groups. The signal module owns source/derived state and explicit actions. The bootstrap owner starts and disposes registered effects. The test owns initial storage, reset actions, spy restoration, and the disposer it acquires.

The Estimate suite resets source state and persistence status before each case and restores a known synthetic persisted value. It also resets source/storage afterward. That explicit setup matters because React unmount cleanup does not reset module-level signals.

## Assert before and after disposal

This is **inert neutral design pseudocode**, not an installed helper:

```ts
const dispose = startPreferencePersistence();
try {
  changePreference("compact");
  expect(readPersistedPreference()).toBe("compact");
} finally {
  dispose();
}

changePreference("comfortable");
expect(readPersistedPreference()).toBe("compact");
```

The actual starter test calls its effect initializer, disposes it, changes hours, and asserts the persisted default remains unchanged. This directly verifies the negative lifetime outcome. Merely counting disposer calls would miss a leaked effect.

A separate test spies on `Storage.prototype.setItem` and throws `QuotaExceededError`. It asserts the in-memory hours update still occurs while persistence status becomes unavailable. It restores the spy and disposes the effect in `finally`. The scenario targets storage-write failure; it does not prove every malformed JSON, read-security error, or migration branch is covered.

| Contract             | Useful assertion                                          |
| -------------------- | --------------------------------------------------------- |
| Source normalization | Public action produces valid source values                |
| Derived state        | Total follows normalized inputs                           |
| Hydration            | Both sources come from the typed persisted record         |
| Persistence          | Storage and status reflect a real update                  |
| Disposal             | A later update no longer reaches storage                  |
| Storage unavailable  | Live state changes and status reports unavailability      |
| Bootstrap ordering   | All hydration precedes effects; release order is reversed |

## Failure and cleanup

Acquire effect disposers inside the test's owned lifetime and release them even when assertions fail. Restore storage spies before neighboring setup writes. Clear only relevant fixture keys rather than erasing unrelated browser data by default. Keep persisted fixture values valid for the current schema unless corruption is the subject.

The bootstrap ordering test uses small fake modules recording meaningful lifecycle events. Here ordering is itself the contract: hydration must complete before persistence effects observe values. Avoid extending this into assertions about unrelated private function order.

Review extra risks when adding a module: repeated initialization, partial startup failure, or a disposer that throws may need their own scenarios. The cited tests do not establish universal idempotence or rollback for every initializer. Development-only registration is asserted against `import.meta.env.DEV`; production asset exclusion needs its own suitable evidence.

## Acceptance scenarios

Changing sources updates the computed result without storing a duplicate derived truth. Hydration restores the expected pair. After disposal, later changes leave storage untouched. A write exception does not revert valid live input or claim saved status. Initializers hydrate all modules before effects begin and release reverse order. Teardown leaves no signal/storage spy or subscription leaking into another case.

For UI consumers, add visible unavailable/recovery behavior where the feature promises it; signal-state assertions alone do not prove localized feedback or accessibility.

## Avoid these shortcuts

Do not reset only the DOM, swallow storage failure as saved, persist derived values unnecessarily, or assert only that disposal was invoked. Exercise the state after cleanup to establish its effect.

## Sources and provenance

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/integration/applicationState/signals/estimate/sigEstimate.test.ts` — normalized/derived state, hydration, disposal, and storage exception behavior.
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/app/bootstrap/signals/initSignalEffects.test.ts` — hydrate/start/reverse-dispose contract and development registration.
