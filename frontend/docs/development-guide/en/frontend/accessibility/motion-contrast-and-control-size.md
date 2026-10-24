# Apply accessibility preferences through semantic theme owners

Motion, contrast, text scale, and target size affect the whole task, including overlays and error states. Use the application preference/theme seams rather than adding isolated CSS patches that ignore fixed settings, system preference, or another color scheme.

This is **installed starter behavior with bounded guarantees**. AppThemeProvider derives theme options and global styles from display/accessibility providers. Component defaults provide focus treatment and common target sizes. These implementations are a starting policy, not a claim that every screen or every custom control has passed accessibility verification.

## Trigger and owner

Use the theme owner for application-wide tokens and component treatment. Use feature code for meaningful labels, task structure, custom interactions, and exceptions. Preference providers own live/system/fixed choices; Settings is only one presentation of those choices.

The installed font scale sets root size to 100%, 112.5%, or 125%. Motion is system-following or explicitly reduced. Increased contrast chooses complete alternative color schemes, keeping component palette values and generated CSS variables aligned rather than overriding a handful of DOM colors.

## Preserve motion semantics

This is a **conceptual consumption rule**, not a new API:

```text
system motion -> follow prefers-reduced-motion
explicit reduce -> reduce transitions regardless of system
custom JS/SDK animation -> consume the same policy deliberately
pending work -> keep truthful progress/status feedback
```

AppThemeProvider maps reduced preference into theme motion options and shortens CSS transition duration to 0.01ms globally, either explicitly or through the system media query. It deliberately leaves CSS animations, including progress indicators, running. Do not describe this as “all animations disabled.”

Custom animation loops, canvas behavior, or third-party SDK transitions need their own policy integration. CSS alone cannot cancel arbitrary JavaScript animation work. RGO's docked entrance also reads the OS reduced-motion query; an application-specific motion override should not be assumed to change every custom library callback without inspecting its owner.

| Concern      | Installed seam                   | Feature responsibility                   |
| ------------ | -------------------------------- | ---------------------------------------- |
| Text scale   | Root font percentage             | Reflow, wrapping, and reachable actions  |
| Motion       | Theme plus CSS transition policy | Custom JS/SDK behavior and focus timing  |
| Contrast     | Semantic palette schemes         | Correct token usage and non-color cues   |
| Target size  | Common MUI component minimums    | Custom/overridden hit areas              |
| Focus        | Shared focus-visible outlines    | Order, names, and meaningful destination |
| Inline links | Optional content underline rule  | Clear link/action semantics              |

## Size and contrast are not universal certificates

Buttons, icon buttons, checkboxes, radios, menu items, and outlined inputs receive relevant 44px minimum dimensions in the component policy. Not every component uses those rules, and local `sx` or density/navigation variants can override dimensions. AppPageNavigation intentionally differs between compact desktop and sheet rows. Evaluate the actual interactive hit area, not a claim that the theme guarantees every target size.

Use semantic `rgo`/MUI palette values for text, borders, status, focus, and action states. Increased contrast applies to light, dark, and soft-dark schemes. A fixed hex color in a feature can bypass that policy; a brighter border alone does not establish a full contrast/accessibility standard.

The optional underline style targets content links in main prose/list contexts and excludes button-like/aside links. It is not a global restyling of every anchor. Preserve the difference between navigational controls and reading links.

## Failure and acceptance scenarios

Enlarge text while using a narrow translated page: required actions remain reachable and labels wrap. Switch schemes with increased contrast: semantic surfaces/focus/status remain coherent. Reduce motion through system and explicit preference: transitions shorten without losing pending-state feedback. A custom animated widget follows the same intentional policy rather than ignoring it. Keyboard focus remains visible without outlining the entire main region.

Inspect errors, disabled controls, selection, hover, active state, and portal surfaces as well as a clean default screen. Automated scans, keyboard/geometry assertions, and visual review provide different evidence; none alone establishes universal compliance. State which viewports/locales/settings were actually verified when execution is authorized.

## Avoid these shortcuts

Do not disable all progress feedback, assume global CSS controls SDK animation, hardcode colors outside tokens, or claim universal target/contrast guarantees from theme defaults. Accessibility policy needs correct consumption and assembled-task evidence.

## Sources and provenance

- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/theme/components/AppThemeProvider.tsx` — text scale, motion, underline, and theme composition.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/theme/config/theme.components.ts` — focus and common minimum target policy.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/theme/config/theme.palette.ts` — complete semantic contrast schemes.
- `RGO/frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:src/capabilities/Overlays/RgoOverlayProvider.tsx` — docked entrance's OS motion observation and owned transition lifecycle.
