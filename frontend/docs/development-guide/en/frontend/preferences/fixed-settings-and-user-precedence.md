# Let deployment-fixed settings override users without destroying their choices

A deployment may fix language, theme, motion, or editor presentation. That is different from changing the application's default. A fixed choice wins for this runtime, while a saved user choice should remain available if the deployment later stops fixing it.

This is **installed starter behavior**. Public `VITE_SETTINGS_NOCFG_*` values are validated and mapped into `AppFixedSettings`. Preference owners guard writes, Settings filters fixed controls, and theme storage preserves underlying saved values rather than overwriting them with deployment policy.

## Trigger and owner

Use fixed settings when a consumer deployment intentionally removes configurability. Bootstrap owns validation and conversion. Preference providers own effective values and guarded setters. Settings owns whether a control is rendered. A hidden control alone is not enforcement: callbacks and alternate shortcuts must honor the same fixed owner.

`undefined` means not fixed. Explicit false is still fixed false; explicit system theme/motion still fixes the choice to following system policy rather than allowing a user override. Do not use truthiness to decide whether a setting is controlled.

## Preserve the precedence contract

This is a **conceptual decision**, not a new installed helper:

```ts
const effective = fixedValue !== undefined ? fixedValue : (savedUserValue ?? applicationDefault);

// A setter is a no-op when fixedValue !== undefined.
// Do not persist fixedValue over the user's stored value.
```

Exact owners can add another deliberate input. Shell drawer mode resolves fixed value, explicit initial drawer mode, stored preference, then shell default. Display values resolve fixed, stored, then theme default. Accessibility providers expose fixed overrides and reject fixed writes. These differences are documented ownership choices, not a universal merge function to apply blindly.

Deployment-facing editor values `docked` and `overlay` map to application values `docked-panel` and `overlay-panel`. Keep that conversion at the config/domain boundary so feature code sees its normal vocabulary. Theme similarly maps soft-dark to MUI's dark mode plus a named dark scheme.

| Situation                                 | Effective behavior                 | Stored user choice            |
| ----------------------------------------- | ---------------------------------- | ----------------------------- |
| No fixed value, saved choice exists       | Use saved choice                   | Preserved/updated by user     |
| No fixed or saved value                   | Application default                | No fabricated policy override |
| Fixed value present                       | Use deployment policy              | Preserved underneath          |
| Fixed false                               | False, with mutation blocked       | Preserved                     |
| Reset while fixed                         | Guarded setters leave fixed choice | Not replaced by default       |
| Deployment removes fixed input on restart | Normal precedence resumes          | Available again               |

## Controls and lifetime limits

Interface and Accessibility section hooks remove rows whose settings are fixed. The providers independently prevent changes through setters. Both layers matter: hiding every control but leaving a header shortcut effective would produce contradictory policy.

The fixed settings object is created during runtime bootstrap. Several preference providers initialize state from it rather than implementing arbitrary hot reconfiguration of every fixed property. Do not advertise live deployment-policy switching without remount/restart semantics. Removing an environment key means a new configuration/runtime, not mutating provider props by assumption.

Theme storage guards writes and resolves reads/subscription values through fixed mode. A layout-effect guard also keeps MUI's active mode/scheme consistent. This is presentation policy, not authorization; fixed settings cannot secure a backend capability or protect browser data.

## Failure and acceptance scenarios

Save a user choice, start a fixed deployment with a different value, and verify effective policy without replacing the saved choice. Attempt change through Settings, a direct setter, reset, and another shortcut: fixed values remain effective. Fix a boolean to false: it is not mistaken for absence. Restart without the fixed setting: saved choice can resolve again. Invalid public fixed input fails validation before rendering.

Keep labels and control visibility consistent with policy. If a workflow needs an explanation of unavailable customization, provide user-meaningful text instead of exposing environment variable names in the product UI.

## Avoid these shortcuts

Do not implement fixed policy only by hiding rows, overwrite user storage at startup, use `if (fixedValue)` for booleans, or promise dynamic policy updates unsupported by the provider lifecycle. Fixed, saved, and default values are separate sources with explicit precedence.

## Sources and provenance

- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/config/fixedSettings.ts` — undefined/fixed domain shape and editor conversion.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/theme/preferences/AppDisplayPreferencesProvider.tsx` — precedence and guarded setters.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/shell/preferences/AppShellPreferencesProvider.tsx` — drawer initial-value precedence and shell write guards.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/theme/appThemeStorageManager.ts` — fixed reads/subscriptions without overwriting user values.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/features/settings/sections/interface/hooks/useInterfaceSettingsSection.tsx` — fixed interface-row filtering.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/features/settings/sections/accessibility/hooks/useAccessibilitySettingsSection.tsx` — fixed accessibility-row filtering.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/theme/preferences/AppAccessibilityPreferencesProvider.tsx` — fixed accessibility overrides and guarded setters.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/theme/components/AppThemeProvider.tsx` — fixed MUI mode/scheme guard.
