# Dependency boundaries and imports

Dependencies follow ownership. Use `@/` when crossing capability owners and
relative imports inside one owner. The alias makes boundary crossings visible
and lets the architecture checker resolve them consistently.

## Owner crossings

```text
main.tsx ──▶ app startup and composition
pages    ──▶ feature public interfaces + app interfaces
app/bootstrap/runtime ──▶ feature public factories
feature internals ──▶ their own models, API ports, UI, and hooks
```

## Public feature interfaces

Every root feature exposes deliberate named members from `index.ts`. Pages,
runtime composition, other features, and lifecycle registries must not import a
feature's internal paths. Avoid broad `export *` barrels: they turn private
implementation into an accidental contract. Context objects and `internal/`
directories stay private even when their filenames are predictable.

## Cross-feature dependencies

Cross-feature dependencies should normally use public UI composition or an
injected dependency at a factory seam. A direct feature-hook dependency is an
exception. If it is genuinely necessary, import the target's named public
member and declare the edge in
`src/app/bootstrap/runtime/appFeatures.ts`. The declarations must be known,
unique, non-self-referential, and acyclic.

## Reusable application inputs

Features may import deliberate application form leaves from
`@/app/forms/{components,types,hooks,utils}`. Keep feature validation, saved
values, and page-specific presentation with the feature or preference owner.
For a controlled single-choice input:

```tsx
import { useState } from "react";

import { AppSingleChoiceToggleGroup } from "@/app/forms/components/AppSingleChoiceToggleGroup";

export function EnabledChoice() {
  const [enabled, setEnabled] = useState(false);

  return (
    <AppSingleChoiceToggleGroup
      aria-label="Enabled"
      onChange={setEnabled}
      options={[
        { value: false, label: "No" },
        { value: true, label: "Yes" },
      ]}
      value={enabled}
    />
  );
}
```

Supply localized labels in application code. Option values must be unique
strings, numbers, or booleans; options can also provide an icon, disabled state,
accessible-label override, and button `sx`. The group accepts MUI presentation
props, native attributes/events, and a root ref. `onChange` receives the next
value followed by the originating event. Set `value` to `null` for an unanswered
field; enable `allowDeselect` to let users clear a selection and receive `null`
in the callback. The owner updates selection when its options change; the
component does not reconcile it automatically.

## Application direction and review

Application leaves also have a direction. Generic data infrastructure must not
know about authentication endpoints. Authentication must not depend on mocks,
Signals, or persisted application preferences. Shell presentation receives
navigation and account behavior from router composition; it does not load the
route registry or pages itself. Stable application infrastructure must not
reach into feature internals. Feature construction is the explicit exception
and belongs in `app/bootstrap/runtime`.

The checker catches many import violations, including resolved relative paths,
not just aliases. Review is still required to decide whether an owner is the
right owner, whether an export is intentionally public, and whether an
exception is justified.

See also [Feature anatomy, filenames, and public interfaces](./feature-anatomy-filenames-and-public-interfaces.md).
