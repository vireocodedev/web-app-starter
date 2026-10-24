# Transfer focus only after modal ownership is released

Closing a sheet and navigating are not one instantaneous event. A still-mounted focus trap can reclaim focus from the new page, while a generic restore-to-opener can move focus back to a control on the old route. Define who owns focus during dismissal, route change, fragment navigation, and forced teardown.

This is **installed starter composition with RGO overlay details**. AppShell owns pathname-change focus, AppPageNavigation coordinates its mobile sheet exit, and RGO sessions restore focus on normal close finalization. Portals preserve React context but do not erase DOM/modal lifetime constraints.

## Trigger and owner

Use explicit focus handoff for drawers, dialogs, page selectors, command navigation, and document contents links inside a portal. The overlay/modal owner controls trapping and exit. The route shell owns the new page's main-content focus. The feature owns a meaningful field or heading only when its task requires a narrower destination.

AppShell focuses its focusable main element with `preventScroll` when pathname changes. Search and fragment changes are not automatically the same event; their flow decides focus/scroll separately. The skip link targets that main region, and the shell deliberately avoids outlining the entire main surface while keeping the skip control visible on focus.

## Wait for the right boundary

This **sequence illustration** describes the page navigation contract:

```text
choose a different page in sheet
  -> mark closing and remember destination
  -> wait for Drawer onExited and closed render
  -> restore a useful local focus point
  -> ask router to navigate
  -> new pathname owns main-content focus
```

AppPageNavigation disables MUI's automatic restore for this sheet and implements restoration after exit. Canceling returns to the trigger. Choosing the same page dismisses without dropping current query/fragment. Pathname changes close the sheet with restore suppression so its trap cannot steal the route's focus back.

Its footer can arrive through a portal. A native click listener on the actual sheet/footer DOM intercepts eligible same-page fragment links, defers navigation/scroll until exit, and preserves ordinary modifier/new-tab behavior. A same-hash click explicitly scrolls the existing target; a changed hash uses the router with current query intact. This targeted listener is not a reason to replace every React event with native handlers.

| Transition                 | Focus/scroll owner                                             |
| -------------------------- | -------------------------------------------------------------- |
| Cancel sheet               | Trigger after modal exit                                       |
| Choose another pathname    | Router/shell after exit                                        |
| Choose current page        | Dismiss and preserve current address                           |
| Follow contents fragment   | Release modal first, then target scroll                        |
| Normal RGO overlay closes  | Session finalizer attempts connected opener                    |
| Opener no longer connected | Safe fallback attempt; feature may need deliberate destination |

## Library and forced-close limits

RGO stores an opener per session and restores it when normal closing finalizes after transition. If disconnected, it attempts body focus. That is not a guarantee of a useful heading or successful focusability in every host. Forced page/provider cancellation has a different lifecycle from ordinary dismissal; route composition must own the destination rather than assume opener restoration is always appropriate.

Only the top modal should handle dismiss gestures; nested sessions can change the stack while a gesture is in progress. The library rechecks current top status for bottom-drawer dismissal. Do not bypass those owners with a global Escape handler that also closes unrelated surfaces.

## Failure and acceptance scenarios

Canceling an open selector returns focus to its trigger after exit. Choosing another page leaves focus in the new content, not the old sheet. Contents links inside a portal scroll after the modal releases ownership. Resize to desktop removes the obsolete mobile trap. An opener removed by navigation does not become an assumed valid focus target. Nested modal dismissal affects the intended top session.

Verify keyboard sequence, actual focused element, and retained URL/query/hash, not only visible disappearance. A scan or screenshot alone cannot prove handoff timing. Keep named controls, headings, dialog labels, and recovery targets meaningful in each locale; focus should not move on every background refetch.

## Avoid these shortcuts

Do not navigate before a trap releases, universally restore old openers after route changes, disable focus management globally, or treat portal context as DOM containment. Each transition needs one current focus owner.

## Sources and provenance

- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/shell/components/AppShell.tsx` — skip link, main focus, pathname and drawer handoff.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/shell/components/AppPageNavigation.tsx` — deferred sheet exit/navigation and portal fragment handling.
- `RGO/frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:src/capabilities/Overlays/RgoOverlayProvider.tsx` — modal exit finalization and top-session dismissal.
- `RGO/frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:src/capabilities/Overlays/internal/store.ts` — opener capture/restoration and forced lifetime distinctions.
