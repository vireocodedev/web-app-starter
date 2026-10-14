# Route entries and feature composition

`src/pages` contains route entries. A page answers one question: which public
application and feature interfaces compose this routed screen?

## The page boundary

```tsx
import { ContactsFeature } from "@/features/development-guide/contacts";

export function ContactsPage() {
  return <ContactsFeature />;
}
```

Feature pages use `src/pages/<feature>/`. Small application boundaries such as
Home, Login, and Not Found may remain one flat file. Pattern pages are grouped
by category; Architecture pages adapt article IDs and locale to its public
renderer. Pages must not import feature internals, construct feature runtimes,
duplicate queries, or own business behavior.

## Route policy belongs to the registry

The route registry composes page entries with route policy: URL, access,
development availability, title, breadcrumbs, navigation metadata, layout, and
scroll behavior. This keeps routing decisions out of both the feature and shell.
The shell presents navigation supplied from that registry and renders the
matched `Outlet`.

A page that owns nested route composition is a layout adapter: render an
`Outlet` where the selected child belongs, then register the layout and each
descendant in `routeRegistry.tsx`. Keep full application paths on descendant
records and express hierarchy with `parentId`. Do not reproduce the child route
inventory inside the page.

## Route state and feature composition

Use route or URL state when navigation should preserve, share, or restore a
choice. `useAppQueryParams` provides typed, reversible codecs for scalar query
parameters. Give every schema field a safe default, update related fields in
one `setValues()` call, and remember that reads do not rewrite malformed URLs.

When composing multiple features, prefer passing public UI and callbacks at the
page boundary. If a stable runtime dependency is required, inject it in
`appFeatures.ts`. Direct cross-feature hook use is exceptional and must be
declared there.

## Route-focused tests

Route tests should establish access behavior, nested redirects, titles,
breadcrumbs, enabled destinations, and Not Found recovery. Feature tests remain
with the feature's ownership tree.
