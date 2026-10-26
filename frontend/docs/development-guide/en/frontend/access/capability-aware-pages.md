# Render pages and actions from explicit capabilities

A hidden menu item does not protect a deep link or an API. Use one deliberate frontend capability vocabulary for presentation, guard route entry separately, and let the backend authorize every read and command against current facts.

This is a **reference recipe with installed starter context**. The starter's `AppAuthGate` handles authentication loading and anonymous redirection. It does not install LMS permissions or client-discovery-app's resource capabilities. LMS provides historical evidence of a centralized typed permission catalog; CDA demonstrates resource projections with capabilities and action-specific grants. Their business roles and grants are not starter defaults.

## Trigger and ownership

Use capability-aware presentation when people can see different pages or perform different actions according to their identity, assignment, resource state, or explicit grant. The server owns live authorization and permitted data projection. The frontend owns understandable presentation of the authority it has observed, including loading, denial, expired authority, and unavailable actions.

Separate global page eligibility from resource-specific permission. A person may enter a Documents section but lack permission to archive document A. A menu can use page eligibility; a record's action uses the server-derived capability for that record. Avoid reproducing server policy from a role name and a collection of local assumptions.

In LMS, `LMS_PERMISSIONS` maps typed keys to roles, `lmsCan` is a pure function, and `useLmsCan` reads the React authentication context. Its route guard independently redirects anonymous users to login and authenticated users without permission to their role's home. This centralizes frontend presentation decisions; it does not prove server enforcement or justify copying historical role memberships.

## Keep presentation and enforcement connected

For a neutral record, this is a **conceptual feature contract**, not an installed API:

```ts
type DocumentView = {
  id: string;
  title: string;
  capabilities: {
    view: boolean;
    edit: boolean;
    archive: boolean;
  };
};

// Menu: show the section when page eligibility is established.
// Route: resolve loading/anonymous/denied before rendering protected content.
// Action: require this record's fresh archive capability before confirmation.
// Server: reauthorize archive when the command executes.
```

CDA's editor consumes capabilities and action grants from an authorized workspace projection. It also treats observed restrictions as lifecycle changes, invalidating obsolete actions and removing restricted data. A capability is not an eternal permission token: it is an observation whose freshness and owner matter. Server enforcement remains necessary even immediately after a successful read.

Keep route construction pure. Permission checks belong in route composition, the page's authority owner, or the API operation, rather than a URL builder. This lets a denied deep link remain a valid URL with an explicit denied state instead of a parser that silently rewrites the person's destination.

## Choose the visible state deliberately

| State                         | Presentation                                             | Server responsibility                 |
| ----------------------------- | -------------------------------------------------------- | ------------------------------------- |
| Authentication unresolved     | Show loading without protected content                   | Resolve session                       |
| Anonymous                     | Redirect through the authentication contract             | Reject protected API calls            |
| Authenticated, page denied    | Explain denial or use a safe destination                 | Enforce page data access              |
| Record visible, action denied | Hide or disable with a useful reason                     | Reject unauthorized command           |
| Capability refresh pending    | Preserve safe content, block freshness-sensitive actions | Decide current authority on execution |
| Authority revoked             | Invalidate pending work and restricted projections       | Reject subsequent access              |

Hiding an irrelevant action often keeps a page clear. Disabling a discoverable action can help when the person can satisfy a prerequisite. The explanation should identify the missing condition without disclosing private information. Do not show a disabled technical grant identifier as the only explanation.

## Failure and recovery

Distinguish denied access from empty data and transient transport failure. An empty collection is a successful authorized result; it is not a substitute for a 403. Likewise, a temporary read failure does not necessarily mean the person lost permission. Let the feature API map its actual response contract into explicit UI states.

On capability change during confirmation, recheck the operation owner before sending. If the server rejects because authority changed afterward, present the live denial and clear data according to the revocation policy. A reload or retry must not use another viewer's cached projection.

## Acceptance scenarios

Open a protected URL directly without its menu entry: the route still enforces authentication and denial. Give a user section access but no archive permission: the record remains readable and archive cannot execute. Revoke an action while its confirmation is open: stale confirmation cannot authorize the command. Switch viewers without a full reload: the previous viewer's private projection is not rendered. Trigger a real server denial through a direct API request: frontend visibility has no bearing on enforcement.

Localize loading, denial, prerequisites, and action labels. Keep disabled-state explanations available to keyboard and assistive-technology users. Do not rely on opacity or color alone, and preserve a clear page heading or safe navigation action when entry is denied.

## Avoid these shortcuts

Do not use menu visibility as authorization, duplicate role arrays in every component, derive permission from route text, equate missing capability data with permission, or assume every 404 means an empty resource. Do not import historical LMS helpers into the starter. Define the feature's authority contract and its server owner first, then reuse it consistently across menus, routes, and controls.

## Sources and provenance

- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/src/app/auth/components/AppAuthGate.tsx` — installed authentication gate, distinct from resource authorization.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/setup/permissions/lmsPermissions.ts` — typed permission keys, pure decision, and React context adapter.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/setup/route-guards/LmsRouteGuardPermission.tsx` — route-entry presentation guard independent of menus.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/specifications/hooks/useSpecificationEditor.ts` — resource capabilities, action grants, and observed authority transitions.
