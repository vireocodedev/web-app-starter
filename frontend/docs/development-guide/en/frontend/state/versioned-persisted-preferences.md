# Validate persisted preferences and migrate their meaning deliberately

A value read from browser storage is untrusted input, even if the application originally wrote it. It may come from an older release, another tab, manual editing, a partial migration, or a browser that now refuses storage. Put preference keys, runtime schemas, defaults, and semantic migrations under one owner.

This article combines **installed starter behavior with historical FRED evidence**. The starter owns `appLocalStorage`, its typed schema/defaults, and an explicit font-size meaning migration. FRED validates stored values against per-key schemas, but its `JSON.parse` and storage access are unguarded in the inspected service. Do not copy that limitation or infer uninspected library error guarantees from the starter wrapper alone.

## Trigger and ownership

Use persisted preferences for small non-sensitive presentation choices that should survive reload: locale, density, theme, or editor presentation. The application preference owner defines allowed values and their meaning. Components consume the deliberate preference interface instead of inventing storage keys or parsing raw JSON themselves.

Do not use this store as server authority, authentication storage, a private business draft, or a durable command outbox. Those have different privacy, consistency, and recovery requirements. Browser-origin storage can be accessible to application JavaScript and may be shared between sessions on the same device; a key name is not an authorization boundary.

The starter declares key names, a Zod object schema, and defaults together, then supplies them to `RgoLocalStorageService`. Several shell values default to `null`, meaning no explicit user override. Preserve that semantic distinction: absence can mean “follow system/application policy,” not necessarily a concrete light theme, fixed density, or enabled setting.

## Separate shape validation from semantic migration

A runtime schema can say that `"big"` is allowed while its meaning changed between releases. The starter explicitly handles that case: an old `big` font preference without scale version 2 is read as `medium`, preserving the former 112.5% choice instead of silently turning it into the newer 125% choice.

Its migration converts old `big` to `medium`, then writes scale version 2. It skips work if the marker already exists and catches storage failure so the live preference remains usable. The read compatibility rule matters when persistence cannot complete. This is stronger than merely changing the enum and hoping old values disappear.

A neutral **proposed migration recipe** is:

```ts
type DensityPreference = {
  version: 2;
  value: "comfortable" | "compact" | null;
};

// Safely read unknown raw data.
// Decode JSON, validate recognized old/current version.
// Migrate old meaning to the current value.
// Publish a usable live value even if persistence is unavailable.
// Persist only after successful conversion; keep recovery idempotent.
```

This is not the starter's installed envelope format. Choose a versioned envelope or per-setting marker deliberately. Ordinary localStorage writes are separate operations; a marker plus a setting is not automatically a multi-key transaction. Make interrupted migrations repeat safely and avoid marking completion before the converted value is retained.

Unknown future versions need a policy too. An older tab should not blindly rewrite a newer representation to its default. Preserve or ignore unsupported data safely, and avoid destructive downgrade behavior unless that migration is explicitly intended.

## Failure and recovery decisions

| Stored condition                | Read behavior                                    | Persistence behavior                          |
| ------------------------------- | ------------------------------------------------ | --------------------------------------------- |
| Key absent                      | Use documented default/system override semantics | Persist only under deliberate policy          |
| Valid current value             | Use schema-validated value                       | No rewrite needed                             |
| Valid recognized old value      | Convert meaning deterministically                | Migrate idempotently                          |
| Malformed JSON                  | Recover this preference safely                   | Remove/reset only the affected key if allowed |
| Wrong shape or unsupported enum | Use safe default or supported migration          | Do not trust a TypeScript cast                |
| Storage security/quota failure  | Keep live preference usable                      | Report/handle without breaking the shell      |
| Unsupported future version      | Follow compatibility policy                      | Avoid overwriting newer state blindly         |

FRED's service validates defaults and parsed values, resets schema-invalid values, and validates writes. But malformed JSON throws before its `safeParse`, and storage `getItem`/`setItem` can also fail. A new implementation must guard both decoding and storage access; runtime schema validation alone covers neither.

The starter also removes a specific allowlist of obsolete shell keys, with per-key storage error handling. That is targeted cleanup, not permission to call `localStorage.clear()` and erase unrelated application data. Keep migrations and retired-key removal documented at the preference owner.

## Lifetime and synchronization

Decide whether a preference is device-wide, account-specific, or workspace-specific. Theme may reasonably be device-wide; another setting may need owner scoping. Do not accidentally transfer a private task preference or draft between viewers by reusing a generic key. Store no session credentials, passwords, or private file content in this preference layer.

Cross-tab updates require deliberate reconciliation if the product promises them. A typed getter does not prove that React state reacts to another tab's storage event. Likewise, changing the stored value alone may not update a provider's live state. Use the existing application preference API so persistence and live presentation stay coherent.

## Acceptance scenarios

Load a valid preference and preserve it across reload. Store malformed JSON: the shell still renders with a safe value. Store an old `big` value without a scale marker: the starter's compatibility rule preserves its former visual size. Interrupt migration between setting and marker: repeating it does not compound the conversion. Make storage writes throw: the live choice still works. Corrupt one key: unrelated preferences remain. Open an older client against a future version: it follows the compatibility policy rather than destroying newer data.

Localize preference labels and descriptions, not permanent storage keys. Keep system/default choices understandable, and ensure live accessibility preferences work even when persistence is unavailable.

## Avoid these shortcuts

Do not trust `JSON.parse(...) as T`, validate only writes, change an enum's meaning without a migration, reset all storage for one bad key, store authentication secrets here, or assume localStorage is always available. Persisted shape, semantic version, live value, and write durability are separate responsibilities.

## Sources and provenance

- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/src/app/data/storage/appLocalStorage.ts` — installed typed preferences, nullable override semantics, font-size compatibility/migration, and targeted retired-key cleanup.
- `FRED/FRED-front@7a78e4f624e4b51ce1cdb9334036f2fb6119f62a:src/infrastructure/services/LocalStorageService.ts` — per-key validation/default recovery with unguarded JSON/storage limitations.
- `FRED/FRED-front@7a78e4f624e4b51ce1cdb9334036f2fb6119f62a:src/infrastructure/services/localStorageSchemas.ts` — centralized persisted-value vocabulary and inferred types.
