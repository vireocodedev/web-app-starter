# Separate resilient storage access from live cross-tab synchronization

A typed storage service can repair malformed values without updating every mounted provider. A live preference can change successfully even when persistence fails. Model reading, writing, current-tab state, and other-tab propagation as separate responsibilities instead of assuming localStorage is a reactive global store.

This is **installed starter behavior with the RGO storage contract**. RGO validates defaults and values, safely reads/repairs invalid JSON, and lets explicit writes fail. Starter preference providers keep live choices when writes fail. Cross-tab subscriptions exist for accessibility and theme slots, but not uniformly for every preference owner.

## Trigger and owner

Use this distinction when adding a preference, handling restricted browser storage, or promising changes across tabs. The storage service owns serialization, schema validation, and resilient reads. A provider owns live state and event subscription. The feature decides whether best-effort persistence is enough for its user-facing contract.

`RgoLocalStorageService.get` returns the configured default if storage cannot be read. Missing, malformed, or schema-invalid values are repaired on a best-effort per-key basis; repair failure is suppressed so reads remain usable. `set` validates and serializes, then writes and can throw. The constructor validates defaults, so invalid application defaults are not silently accepted.

## Update through the owner

This is a **conceptual flow**, not a replacement storage API:

```text
current-tab control -> typed provider setter -> live state update
                                         -> best-effort validated storage write
other-tab storage event -> subscribed provider -> read validated value -> live update
```

The writing tab does not rely on receiving its own native storage event. Its setter updates state directly. A raw `appLocalStorage.set` from unrelated code may therefore persist a value without notifying an already-mounted provider in that tab. Use the owning preference API when both live presentation and storage must change.

Do not send unvalidated external values through a setter merely because TypeScript normally restricts callers. Several providers set live state before attempting the typed storage write. Their catch preserves the live choice on storage failure; it is not a general runtime validator for arbitrary untrusted UI input.

| Owner                                    | Installed external-update behavior                                                        |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| Motion and link underlines               | Storage listener rereads relevant keys or clear event; fixed choices remain authoritative |
| Theme mode/dark scheme                   | MUI storage-manager subscription reads typed keys and honors fixed mode                   |
| Display values such as font/table/editor | Provider state/setters; no storage subscription shown                                     |
| Shell drawer/header preferences          | Provider state/setters; no storage subscription shown                                     |
| Application locale                       | i18n language event within its instance; no storage listener shown                        |

## Define propagation limits honestly

The subscription boundary is browser tabs/windows for the storage scope, not cross-device synchronization. No versioned merge, conflict journal, or account-server synchronization is supplied by these providers. Two tabs writing a setting do not acquire a transaction across several preference keys.

If a new requirement needs all preferences to follow external changes live, extend each actual owner or introduce one deliberate synchronization seam. Do not add a second generic listener that competes with existing theme/accessibility handling. Respect fixed settings on both the write and reread path.

A storage clear event has `key === null`; relevant subscribed owners reread defaults. That does not authorize clearing all storage as an application reset. The installed reset operations target their own preference domain; private drafts and commands belong elsewhere.

## Failure and acceptance scenarios

Malformed JSON returns a schema-approved default without crashing a read. Blocked/quota-limited writes leave a valid live preference usable, while any durable-save promise is handled separately. Change motion in another tab: its subscribed owner updates unless fixed. Change font size externally: do not claim immediate synchronization from this source; a reload or explicit extension is required. Change through the current-tab provider: the UI updates even without a storage event.

Verify subscriptions release on unmount and unrelated keys do not cause unnecessary updates. Keep stored values non-sensitive; schema validation is not encryption, identity isolation, or server authority. A feature needing durable business work must use its appropriate store/protocol rather than silently adopting best-effort preference semantics.

## Avoid these shortcuts

Do not treat storage as reactive everywhere, catch write failure and claim durable save, bypass live owners with raw writes, or advertise all-tab/all-device sync without implemented listeners. State the exact read, write, and propagation contract.

## Sources and provenance

- `RGO/frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:src/services/RgoLocalStorageService/RgoLocalStorageService.ts` — resilient validated reads/repair and explicit-write failures.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/theme/preferences/AppAccessibilityPreferencesProvider.tsx` — live setters and scoped cross-tab listener.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/theme/appThemeStorageManager.ts` — theme subscriptions and fixed policy.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/theme/preferences/AppDisplayPreferencesProvider.tsx` — best-effort display persistence without shown storage subscription.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/shell/preferences/AppShellPreferencesProvider.tsx` — shell lifetime and guarded writes.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/localization/components/AppLocalizationProvider.tsx` — locale's instance-local language synchronization.
