# Accessibility policy

This application targets WCAG 2.2 AA. Use semantic HTML and native controls
before adding ARIA. MUI is a helpful implementation detail, not evidence that a
screen is accessible by itself.

Every material UI change must preserve page landmarks, one page heading,
programmatic control labels, visible keyboard focus, descriptive validation,
logical focus movement, and text/icon state cues that do not depend on colour.
Respect `prefers-reduced-motion`; do not require animation to communicate a
state. Keep user-facing copy clear and localized at its owning feature.

Automated axe and component checks run without a standing suppression list.
They do not prove WCAG conformance. Complete the manual checklist for material
UI changes and track discovered defects in the owning application. A temporary
automated-check exception requires a reviewed issue, owner, reason, and expiry;
add executable suppression only when that real exception is approved.

Do not use a React effect to load application data. Use central TanStack Query
options with `useQuery` or `useSuspenseQuery`. DOM-only focus effects are
appropriate after navigation, recovery states, validation failures, and modal
dismissal when context genuinely changes.
