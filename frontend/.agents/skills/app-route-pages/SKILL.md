---
name: app-route-pages
description: Add, change, move, or remove a routed page in an RGO generated app, including its route policy, redirects, links, and localization. Use for page or URL lifecycle requests; use app-shell-navigation for navigation-only changes.
---

# App route and page lifecycle

## Start

When invoked only as `$app-route-pages`, or named without a concrete task, ask one question: “What would you like to do with routes or pages: (1) explain the current route map, (2) add a page, (3) move, rename, or remove a route, or (4) describe another task?” Wait for the answer before inspecting or changing the app. When a concrete task is supplied, proceed directly. Treat explanation-only requests as read-only.

Accept a plain-language goal. Inspect the live files and infer routine choices from nearby routes; ask only for unresolved product decisions. This skill targets the current generated-app shell. If the expected route registry or route-handle seam is absent, explain the mismatch and propose an upgrade or separate migration before using this recipe.

## Workflow

1. Read [route policy and shell ownership](../../../docs/architecture/en/router-and-shell-responsibilities.md) and [page composition](../../../docs/architecture/en/route-entries-and-feature-composition.md). Trace the existing page, incoming links, access gate, titles, and route tests before editing.
2. Compose a usable page in [`src/pages`](../../../src/pages) from public feature interfaces when the requested content is known. Keep route policy in [`routeRegistry.tsx`](../../../src/app/router/routeRegistry.tsx) and use [`AppRouteDefinition`](../../../src/app/router/types/AppRoute.ts) for the current fields. Choose `Component` or `lazy`, `access`, `path` or `index`, `parentId`, `title`, and any needed `navigation`, `breadcrumbs`, layout, mobile, or scroll metadata. A nested layout renders `Outlet`; each child is a separate registry entry. Child access matches its parent. Use `defaultChildId` for a default-child redirect or an index child for content at the parent URL.
3. For moves and removals, inspect callers and bookmarks represented by existing tests or docs. Update links, destination lists, and translations in both supported locales. Keep an old URL with an explicit redirect when compatibility matters; cover its target and access behavior. Remove stale redirects and navigation when a route is intentionally retired. Respect development-only inheritance for consumer route policy. The starter has no guide routes in any build; retired guide URLs resolve to Not Found. Keep documentation examples in Storybook.
4. When the task also changes where a page appears, load [app-shell-navigation](../app-shell-navigation/SKILL.md). When it introduces a user preference or changes shell presentation, load [app-shell-preferences](../app-shell-preferences/SKILL.md). Complete the combined request in one pass.
5. Use focused route and page checks from [`tests/app/router`](../../../tests/app/router) and the [testing guide](../../../docs/architecture/en/tests-mocks-stories-and-architecture-checks.md). Add meaningful coverage for new route behavior, redirects, access, titles, or breadcrumbs; run broader checks only when the change warrants them and repository verification allows it.

### Worked route recipe

For “add a Workspace with Overview and Activity,” create a page or layout adapter, register a `workspace` parent with `Component: WorkspaceLayout`, `path: "/workspace"`, and `defaultChildId: "workspaceOverview"`; register `workspaceOverview` and `workspaceActivity` with complete paths beneath `/workspace`, matching `access`, and `parentId: "workspace"`. Give each a localized title. Add `headerNavigation: true` to the parent and `navigation` metadata to its immediate children only if the sections belong in row two. See the nested-route example in [router and shell responsibilities](../../../docs/architecture/en/router-and-shell-responsibilities.md#nested-application-layouts).

## Finish

Report a concise route and navigation map, changed files, focused check results, and app-specific content or policy left for the author to customize. For explanation-only requests, point to the live route entries and describe their effects.
