# Manual accessibility checklist

Complete this checklist for every material UI change. Automated checks support
this review; they do not replace it.

- [ ] Keyboard-only: every interactive control is reachable, operable, and has
      visible focus in a logical order.
- [ ] NVDA with Chrome: record that landmarks, headings, labels, instructions,
      errors, and state changes communicate a useful name and order.
- [ ] VoiceOver with Safari: record the same reading-order, control-name,
      error, and state-change evidence on an available Apple device.
- [ ] Forms: invalid submission explains each error and moves focus to the
      first invalid field without discarding entered values.
- [ ] Dialogs and drawers: focus enters the surface, remains usable within it,
      and returns to a sensible trigger or successor when it closes.
- [ ] Async work: loading, completion, and failure states are meaningful
      without watching animation or colour alone.
- [ ] Zoom and reflow: verify 200% and 400% zoom plus a narrow viewport without
      page-level horizontal scrolling or lost controls.
- [ ] Contrast and state: inspect light and dark mode; text, icons, or labels
      communicate state when colour perception is unavailable.
- [ ] Forced colors: enable the operating system or browser forced-colors mode;
      controls, focus, boundaries, and selected/error states remain visible.
- [ ] Motion: enable reduced motion and confirm that animation is not required
      to understand progress or a state change.
- [ ] Pointer targets: record that controls meet the WCAG 2.2 target-size rule
      or its documented spacing, inline, equivalent-control, or essential
      exception.
