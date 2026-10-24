# Keep resource shape, plural semantics and locale recomputation aligned

A translation key can exist in both languages while its plural or interpolation meaning is wrong. A locale can change while a memoized menu still displays strings captured at mount. Treat typed resource structure, language behavior, and recomputation as related but distinct contracts.

This is **installed starter behavior**. English resources define a structural vocabulary, Croatian resources satisfy its string-leaf shape, i18next augmentation checks keys, and the application owns one i18n instance per localization provider. Theme/formatters derive from the resolved active locale.

## Trigger and owner

Use this seam when adding resource branches, plural messages, formatted values, or UI that must update language without losing task state. The localization owner registers resources and language policy. Feature resources own task copy. A component owns when translated labels are derived; the business draft should keep stable values/IDs, not translated display text as identity.

`StringLeaves` keeps nested property names while widening leaves to string. It catches missing/mismatched structure at compilation but does not prove translated meaning, placeholder parity, grammar, or safe use in every rendering context. Strict i18next keys similarly do not replace reviewing the actual text.

## Model plurals and values deliberately

A neutral **resource illustration** is:

```ts
const english = {
  items_one: "{{count}} item",
  items_few: "{{count}} items",
  items_other: "{{count}} items",
} as const;
// A parallel locale supplies the same declared structural vocabulary.
// Call the plural message with numeric count; do not concatenate a suffix.
```

The starter deliberately includes one/few/other shapes in both languages for relevant guide messages, allowing Croatian's cardinal forms within the shared shape. Do not assume English's everyday singular/plural distinction is every locale's complete rule. Pass a number as count and let i18next select the supported locale's form.

Formatting is another boundary: number, currency, date, and time should use active locale and explicit domain inputs. `useAppLocalizationFormatters` rebuilds bound functions when locale changes and uses the application default time zone unless overridden. Currency is an explicit argument; a language does not determine the business currency.

## Preserve the provider lifetime

`createAppI18n` creates an instance rather than mutating a global default. It registers ordinary application resources in every build and development-guide resources only in DEV. Initialization is synchronous for the bundled resources. Adding asynchronous loading would require a new readiness/error contract; do not assume the current provider waits for remote bundles.

The provider listens for language changes, updates resolved locale, and sets document `lang` and `dir`, restoring prior attributes on cleanup. Its setter persists explicit user selection and asks the instance to change language, unless locale is fixed. Browser language is an initial fallback, not an automatic ongoing override of a chosen locale.

| UI value                    | Correct ownership                                 |
| --------------------------- | ------------------------------------------------- |
| Entity ID/status code       | Stable domain value                               |
| Menu/field label            | Derive from active translation context            |
| Form validation text        | Rebuild/revalidate under deliberate locale policy |
| Number/date display         | Active formatter with explicit zone/currency      |
| Open overlay copy           | Current props or an explicit captured-copy policy |
| Document language/direction | Localization provider                             |

## Failure and recovery

Do not memoize translated lists with empty dependencies or store a translated label as a route/entity identifier. A locale change should not recreate the runtime, discard a draft, or change command identity. If validation errors or an open confirmation intentionally capture old copy, define that behavior; the provider cannot rewrite arbitrary strings already stored by a feature.

Fixed locale guards the setter. The provider does not subscribe to storage events from another tab; instance languageChanged synchronization is not all-tab locale propagation. Direction support also does not prove every component has a complete RTL layout; review actual supported locales and composition.

Interpolation escaping is disabled in the bundled i18next setup for React rendering. That is not permission to insert untrusted translated/interpolated values as HTML. Use normal safe rendering and a deliberate rich-content boundary when needed.

## Acceptance scenarios

A missing Croatian property is caught by shape checking. Numeric counts exercise each relevant form. Switching locale updates menus, MUI text, formatted values, and document attributes without changing draft identity. A stored explicit locale wins over browser fallback. A fixed locale cannot be changed through a shortcut. Empty-dependency cached labels are not mistaken for provider failure. Production resources do not silently acquire development-only copy.

## Avoid these shortcuts

Do not hardcode suffixes, infer currency from language, cache translated labels forever, or claim types prove grammar/interpolation correctness. Locale switching is a live presentation transition over stable business state.

## Sources and provenance

- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/localization/types/TranslationShape.ts` — string-leaf structural typing.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/localization/i18next.augmentation.ts` — namespace/key typing.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/localization/createAppI18n.ts` — owned instance, bundled readiness, namespace and interpolation policy.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/localization/components/AppLocalizationProvider.tsx` — live locale/document lifecycle and fixed setter.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/localization/hooks/useAppLocalizationFormatters.ts` — locale-bound recomputation.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/localization/translations/development-guide.hr.ts` — matching plural forms and resource-shape satisfaction.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/localization/preferences/localePreference.ts` — explicit stored/browser/default initial-locale policy.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/localization/translations/development-guide.en.ts` — parallel one/few/other source shape.
