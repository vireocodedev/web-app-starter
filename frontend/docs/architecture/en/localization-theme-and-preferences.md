# Localization, theme, and preferences

Localization, theme, and shell preferences are separate application owners
that collaborate through providers and small hooks.

## Application preference owners

`src/app/localization` owns supported locales, i18next creation, translation
shapes, formatting helpers, locale presentation, and the locale preference.
English and Croatian objects have matching typed shapes in each namespace.
Application strings use `translation` and `useAppTranslation()`. Development
guide strings have a separate `development-guide` entry point and use
`useDevelopmentGuideTranslation()` throughout guide content, navigation, and
documentation. The guide namespace is registered only in development; its
strings are absent from production builds. Components use locale-aware formatter
hooks rather than importing locale objects directly. RGO applications are LTR only.

`src/app/theme` owns the MUI theme, component defaults, typography, spacing,
breakpoints, color scheme, and display preferences. Theme creation receives the
active locale's MUI options. Color mode follows the user's explicit choice or
the system when no override is saved. Soft dark uses a separate charcoal
color scheme while retaining dark-mode component behavior. System continues
to use the default Dark palette when the operating system is dark. Font size has Normal (100%), Medium
(112.5%), and Big (125%) choices. The storage owner migrates an older saved
`big` value to `medium` once, preserving its previous visual size.
Desktop table density defaults to Small. A saved Medium choice or fixed
application value retains precedence, while resetting Appearance restores the
configured default.
Increased contrast defaults to No and derives stronger semantic text and
boundary tokens for Light, Dark, and Soft dark. It does not change the selected
color mode, neutral surfaces, or RGO accent. The theme provider rebuilds the
palette so MUI CSS variables and JavaScript theme reads use the same values.
The Accessibility preference owner also lives here: motion follows the operating
system by default, and text links keep each page's current underline style.
Users can instead reduce nonessential motion or always underline content links.
The latter includes guide breadcrumbs and related-reading links while leaving
app navigation and button links unchanged.

`src/app/shell` owns the temporary or permanent desktop drawer mode, the
permanent drawer's open and collapsed states, and desktop header stickiness.
The permanent drawer switches between a labeled panel and an icon rail from
its bottom control; the header button hides or restores it. Mobile navigation
always uses a temporary drawer, while only its first header row sticks. The
router supplies destinations and route-group metadata; the shell persists how
navigation is displayed.

Each owner also exposes one reset action for its complete preference set:
`useResetAppLocale()`, `useResetAppThemePreferences()`,
`useResetAppShellPreferences()`, and `useResetAppAccessibilityPreferences()`. These hooks restore owner-specific configured
defaults through the existing setters, so live updates, validation, and
best-effort persistence keep the same behavior. The theme reset hook consumes
MUI's color-scheme context and must therefore be called beneath
`AppThemeProvider`.

## Settings presents rather than owns

`/settings/appearance`, `/settings/navigation`, and `/settings/accessibility`
present application-owned preferences under the Settings route; `/settings`
redirects to Appearance. The responsive Settings navigation shows account
identity above the page navigation. At container widths of at least 900px, section
links form a desktop rail. Narrower containers show the current section in a
full-width selector that opens a scrollable bottom sheet with every section.
Dismissal restores selector focus; successful navigation uses the shell's normal
main-content focus. Settings rows place the label and description above compact,
wrapping choices at every width. Appearance groups controls under Theme
& language, Contrast, Density & shape, and Editors. Navigation contains main drawer mode
and header stickiness. Accessibility contains motion and text-link underlines.
`src/features/settings` composes controls from owner hooks but does not own
their values. It has no feature factory, `appFeatures.ts` entry, or runtime
lookup hook. Each section has its own reset action: Appearance composes theme
and locale owner resets, Navigation uses the shell owner reset, and
Accessibility uses its own owner reset. These actions use owner defaults and
setters rather than enumerating individual preference values in Settings.

Build-time configurability is one application policy derived from the typed
`VITE_SETTINGS_NOCFG_*` environment contract. The bootstrap provider
distributes domain setting names rather than environment keys. Preference
owners enforce any fixed value during initial resolution and reject setter or
storage-event attempts without overwriting dormant saved preferences. Settings
only filters the matching rows, while the shell omits fixed locale and theme
header controls. Use `useAppColorScheme()` rather than MUI's raw
`useColorScheme()` so fixed color-mode policy also guards direct setters.

Use the application storage service for stable non-sensitive preferences.
Keep a preference beside its true owner, including its context, provider, hook,
validation, and reset behavior. Do not create a generic Settings state store or
move a value into Settings simply because users edit it there.

## Add a preference

When adding a preference, cover its initial resolution, persisted override,
reset behavior, provider lifetime, translated label, and both supported
locales. Extend the owning reset hook and its focused provider-backed test;
Settings' section resets should not need to change. Consider whether the
setting changes application policy or merely one feature; feature-only
preferences stay with that feature. Place a new application preference in the
matching Settings section and decide whether it needs a typed build-time
fixed-value input. Extend the
normalized policy in one place.
