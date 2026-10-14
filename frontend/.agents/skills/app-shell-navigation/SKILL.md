---
name: app-shell-navigation
description: "Compose RGO generated-app navigation and header context: main drawer, mobile shortcuts, second-row sections, page sidebar, breadcrumbs, and header actions. Use for navigation placement or shell wayfinding requests; use app-route-pages for page lifecycle work."
---

# App shell navigation

## Start

When invoked only as `$app-shell-navigation`, or named without a concrete task, ask one question: “What would you like to do with shell navigation: (1) explain the current navigation map, (2) add or reorganize navigation links, (3) compose header sections, breadcrumbs, or a page sidebar, or (4) describe another task?” Wait for the answer before inspecting or changing the app. When a concrete task is supplied, proceed directly. Treat explanation-only requests as read-only.

Start from the requested destination and inspect its route group. Infer ordinary placement from neighboring pages; ask when the user's product hierarchy is genuinely ambiguous. These instructions assume the current generated-app shell. If route handles, supplied navigation props, or the page-layout seam are missing, explain the mismatch and propose an upgrade or separate migration.

## Workflow

### Choose the right navigation layer

Read [router and shell responsibilities](../../../docs/architecture/en/router-and-shell-responsibilities.md). [`routeRegistry.tsx`](../../../src/app/router/routeRegistry.tsx) defines page metadata and the explicit `appNavigationItems` and `appBottomNavigationItems` lists. [`routes.tsx`](../../../src/app/router/routes.tsx) passes those lists through `AuthenticatedAppShell` to [`AppShell`](../../../src/app/shell/components/AppShell.tsx). Add a top-level destination to the main drawer only when it belongs in app-wide navigation. Choose mobile shortcuts deliberately; they are a separate list. The account menu lives in [`AppAuthActions.tsx`](../../../src/app/auth/components/AppAuthActions.tsx), so account actions need their own link update.

A route-group parent opts into row-two tabs with `headerNavigation: true`; immediate children with `navigation` become tabs. Deeper descendants keep their ancestor tab active. [`routeHierarchy.tsx`](../../../src/app/router/routeHierarchy.tsx) derives the section list; [`AppSectionNavigation.tsx`](../../../src/app/shell/components/AppSectionNavigation.tsx) renders desktop overflow and the mobile section menu. Keep labels in the route's translation namespace and set `navigation.to` for a concrete destination or `activePath` only for a different active-match pattern; a descendant pattern needs `/*`.

The first row uses the top-level matched route title and may append route-owned `HeaderContext` from [`AppRouteDefinition`](../../../src/app/router/types/AppRoute.ts). The parameterized example is [`DynamicProjectHeaderIdentity.tsx`](../../../src/app/router/components/DynamicProjectHeaderIdentity.tsx). `breadcrumbs` and ancestry produce the local deep-page trail in [`AppBreadcrumbs.tsx`](../../../src/app/shell/components/AppBreadcrumbs.tsx). For app-provided quick actions, wire `headerActions` through the authenticated shell composition into `AppShell`; keep controls functional and compact on mobile.

An optional page sidebar belongs to a route layout adapter. [`DocumentationRouteLayout.tsx`](../../../src/app/shell/documentation/DocumentationRouteLayout.tsx) demonstrates a sticky desktop rail and a page-local mobile menu supplied by route-handle `documentationGroups`. The shipped `groupId` union and guide group builders are specific to Patterns and Architecture; for another domain, design its own group data and adapter instead of treating guide `groupId` as a general registration API. A route can use `mobileBottomNavigation: false` or `mobileSurface: "flush"` when its page needs those behaviors; keep page-owned mobile spacing usable.

### Worked navigation recipe

For “put Workspace in the drawer, Overview and Activity across the top, and detail links beside Activity,” add Workspace to `appNavigationItems`; opt its parent into `headerNavigation` and give the two children `navigation` metadata; let an Activity layout adapter own detail links and its narrow-screen menu. Check active states on deeper URLs, tab overflow, both drawer modes, and narrow widths. If the page or URL is new, load [app-route-pages](../app-route-pages/SKILL.md); if a persistent display option is involved, load [app-shell-preferences](../app-shell-preferences/SKILL.md). Complete the request as one task.

Use focused tests in [`tests/app/router`](../../../tests/app/router) and [`tests/app/shell`](../../../tests/app/shell) plus browser inspection when visual or responsive behavior changed.

## Finish

Report the resulting route/navigation map, changed files, check results, and any destination or action that the application author must supply.
