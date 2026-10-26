# Combine keyboard, responsive geometry and accessibility evidence

A screenshot can look correct while keyboard focus is trapped, a menu overflows at phone width, or controls have no accessible name. An automated accessibility scan can find rule violations but cannot prove the complete task is usable. Design complementary evidence around the actual interaction.

This is an **installed starter browser-test pattern**. Source scenarios combine keyboard actions, focus assertions, viewport geometry, localized layouts, and axe scans. They were read only. No browser, axe run, assertion harness, or screenshot verification was executed for this article.

## Trigger and ownership

Use assembled browser evidence for navigation, modal focus, responsive menus, large text, motion preferences, and controls whose usability depends on CSS/layout. The component owns semantics and interaction. The browser scenario owns viewport, locale, input sequence, and observable assertions. Accessibility remains a product responsibility beyond one tool's report.

The starter keyboard scenario tabs to the skip link, checks visible outline, activates it, and verifies main-content focus. It then navigates to Settings and a not-found route and scans those assembled states. A compact Settings scenario opens the page selector, checks active links, closes with Escape, and verifies focus returns to the selector. Moving from the sheet to a different page focuses the main content.

## Specify the interaction and its recovery

This is **inert neutral scenario pseudocode**, not a new helper:

```text
At phone width:
  open page selector with keyboard
  inspect named dialog and active link
  press Escape -> dialog gone, trigger focused
  reopen and choose a different page -> destination heading/main focused
  resize to desktop -> obsolete modal released, no page overflow
```

Source tests also compare control/menu bounds to the viewport and inspect horizontal overflow, including English/Croatian and large-text variants. Geometry assertions should target a real usability contract, such as an action remaining reachable, rather than freeze every pixel of incidental spacing.

| Evidence                  | Establishes                                          | Does not establish alone           |
| ------------------------- | ---------------------------------------------------- | ---------------------------------- |
| Role/name locator         | Exposed semantic target in that state                | Entire screen-reader experience    |
| Keyboard/focus sequence   | Tested path is operable and focus is restored        | Every input/device path            |
| Bounds/overflow assertion | Tested viewport retains reachable layout             | All viewport/font combinations     |
| Axe result                | No detected configured violations in scanned context | Complete accessibility compliance  |
| Screenshot                | Reviewable appearance at captured state              | Focus order or command correctness |

## Choose a useful matrix

Include representative narrow and wide viewports, actual supported locales, and meaningful accessibility settings such as large text and reduced motion. Do not claim full cross-product coverage merely because one case loops through themes. Prioritize interactions most likely to fail at combined boundaries, such as a long translated menu at narrow width with enlarged text.

The documentation source scans both whole pages and selected contexts. State the scanned scope accurately: scanning a drawer does not prove the rest of the page. A hidden or absent dialog should be asserted absent, not merely outside the screenshot. An active link should expose the intended `aria-current` state.

## Failure and maintenance

Use observable waits for transitions rather than fixed sleeps. When a modal disappears, check focus after the actual exit lifecycle. A reduced-motion preference can change timing; assertions should follow the semantic outcome instead of depending on animation duration.

Keep diagnostics useful: axe violation IDs and node counts, actual viewport dimensions, failed bounds, and focus target. Do not suppress broad rule categories to make a page green without understanding the cause. Intentional exceptions need precise scope and a maintained reason through the project's normal review policy.

Manual review remains useful for reading order, instructions, content clarity, zoom/reflow, and assistive technology behavior that the automated cases do not establish. Source presence and a clean lint/build are not execution evidence for any browser scenario.

## Acceptance scenarios

A keyboard user reaches main content through the skip link. Opening and canceling a sheet returns focus; choosing another page moves focus meaningfully. A narrow translated bulk menu stays within the viewport and its actions remain named. Enlarged text does not hide required controls. Reduced motion retains usable transitions. Axe scans the intended state and reports actionable diagnostics. Screenshots complement, rather than replace, interaction assertions and manual review.

## Avoid these shortcuts

Do not claim accessibility from axe alone, use screenshots as focus tests, assert only desktop English, or check a dialog's visibility without its exit/focus behavior. Name the actual evidence and its limits.

## Sources and provenance

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/browser/application.spec.ts` — keyboard skip/focus, modal exit, viewport bounds, large text/motion, and axe diagnostics.
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/browser/documentation.development.spec.ts` — localized narrow guide navigation, context scans, and overflow evidence.
