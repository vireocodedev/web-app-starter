# Keep URL construction and parsing in a pure typed contract

A route is a public address for a view or exact task. Scattered string concatenation makes it easy for menus, breadcrumbs, confirmations, and return flows to disagree about that identity. Give a route family one pure typed contract that builds addresses and parses untrusted locations without fetching data or deciding permission.

This is a **reference consumer pattern** from client-discovery-app. Its project URL contract uses discriminated unions, explicit route suffix inventories, and separate subfamily modules. The starter's router registry remains the installed owner of route composition; CDA's project types and builders are not starter exports and should not become a second competing application registry.

## Trigger and ownership

Use a route contract when a feature has several related views, stable record identifiers, version-specific tasks, or return flows whose identity must survive navigation. The contract owns syntax and semantic address shape. Route composition owns component binding and hierarchy. The feature owns data, capabilities, and task lifecycle after parsing.

The inspected `projectRoutes.ts` states its boundary explicitly: no feature state, permissions, queries, or registry imports. It imports pure helpers for route subfamilies. Its target union makes required identities explicit: a version review may need a record, version, digest, and grant; a list needs none of those. Presentation state such as an editor topic can be treated differently from the exact business task identity.

Keep that distinction small and meaningful. Do not recreate a 2,000-line consumer contract for a two-page feature. Split an expanding family by stable semantic owner while preserving one documented entry interface.

## Build only valid addresses

This is a **neutral conceptual contract**, not a starter API:

```ts
type DocumentTarget =
  | { kind: "list"; workspaceId: string }
  | { kind: "record"; workspaceId: string; documentId: string }
  | {
      kind: "review";
      workspaceId: string;
      documentId: string;
      versionId: string;
      digest: string;
    };

declare function documentPath(target: DocumentTarget): string;
declare function parseDocumentTarget(location: {
  pathname: string;
  search: string;
}): DocumentTarget | { kind: "invalid" } | null;
```

The union prevents a review without a version at the TypeScript boundary. Runtime validation is still required because URLs and JavaScript callers are untrusted. In the reference builder, path identifiers are validated and encoded as individual segments. Query values use `URLSearchParams`. Do not encode an entire path as one segment, append raw user strings, or use a mutable display label as persistent record identity.

The parser decodes path segments inside guarded error handling, validates allowed forms, and returns a deliberate invalid result for malformed addresses in its family. A location outside the family can return `null`. That distinction lets composition choose not-found behavior without accidentally treating a malformed exact task as the family's default page.

## Define query semantics deliberately

Parameters that determine an exact task deserve strict validation. The reference validates allowed combinations and, for many exact-task subfamilies, rejects duplicated or unknown parameters. Its compatibility and presentation rules vary by family; do not claim a universal “all unknown parameters forbidden” policy when the parser intentionally tolerates some.

Decide how filters, topics, return contexts, versions, and hashes affect identity. A presentation-only topic change may retain one draft; a changed version digest must not. The reference's `sameProjectTask` computes semantic identity rather than comparing raw URLs, with explicit subfamily rules. It is not a generic permission to ignore all search parameters.

| Input                             | Contract decision                                       | Composition consequence               |
| --------------------------------- | ------------------------------------------------------- | ------------------------------------- |
| Valid typed target                | Encode one canonical supported address                  | Render its bound page                 |
| Valid equivalent legacy address   | Parse or redirect under documented compatibility policy | Preserve intended task                |
| Malformed percent encoding        | Return invalid without throwing through render          | Show safe not-found/invalid state     |
| Missing required version identity | Reject exact task                                       | Do not silently review latest version |
| Duplicated exact-task parameter   | Reject where the family contract requires uniqueness    | Avoid ambiguous command basis         |
| Valid address without permission  | Remain a valid address                                  | Show authorization outcome separately |

## Failure and evolution

Adding a route changes a public contract. Update the target union, builder, parser, family inventory, registry binding, breadcrumbs, and deliberate old-address handling together where applicable. Preserve search/hash/state only according to the migration's meaning; blindly carrying obsolete exact-task parameters into a different action can be unsafe.

A parser should not write cache state, fetch the record, redirect based on mutable grants, or repair the server's identifiers. Those effects make address interpretation nondeterministic and harder to reuse outside a component. After parsing, the mounted feature loads the exact addressed resource and handles missing or denied state through its API contract.

## Acceptance scenarios

Build a neutral target containing spaces or reserved characters and parse it back into the intended identity. Feed malformed encoding and unsupported path shapes: interpretation fails safely. Change only a presentation topic: the documented task identity stays equal. Change version or digest: it becomes a different exact task. Open a valid denied URL: syntax remains valid while authority is denied. Retain an old public link only through an explicit compatible parser or redirect rule.

Use localized link text and breadcrumbs around stable identifiers; do not localize permanent route IDs accidentally. Exact task labels should describe the action and target without exposing private data in a public URL.

## Avoid these shortcuts

Do not concatenate routes in every component, decode twice, accept partial exact identities as “latest,” derive capabilities inside builders, or create side effects during parsing. A good route contract is small enough to understand and strict enough that callers cannot accidentally address a different task.

## Sources and provenance

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/app/router/projectRoutes.ts` — pure typed targets, encoding/parsing, family inventory, compatibility, and semantic task identity.
