# Put result identity and invalidation scope in one query-key owner

A query cache reuses results by key, not by the URL the person sees or the headers sent on the wire. If the key omits viewer, workspace, filter, page, or another result-defining input, the application can reuse the wrong projection. Give each feature a deliberate key factory and make mutations invalidate the read models they can actually change.

This is a **Storybook reference pattern with source-backed extensions**, using installed Query infrastructure. Contacts lives under `docs/storybook/examples/Contacts/`, outside the production registry. Contacts owns `ContactQueryKey`, creates Query options through an injected API, and invalidates its collection after writes. CDA demonstrates viewer/project private scope. LMS historically includes page and filters in its collection key. Its separate signal assignment in one query is a limitation to examine, not a recommendation for a second source of remote truth.

## Trigger and ownership

The API/query feature owns all cache identities for its resource. Application runtime composition injects the API and QueryClient into the query/mutation factories. A page chooses inputs and observes the result; it should not invent a competing key spelling for the same collection.

The Contacts reference key root is `['contacts']`, and its collection key adds `'collection'`. That is enough for its actual unparameterized local Contacts collection. It is not evidence that every future remote collection can omit viewer, workspace, filters, or pagination. Expand the key only when those inputs genuinely determine the result.

The installed query factory passes Query's signal into `api.findAll({ signal })`. Its mutation factory invalidates `ContactQueryKey.collection()` after operations that can change that collection. API dependencies are explicit, so the query option describes work without creating an unrelated global client.

## Define the full result identity

This neutral example is a **proposed feature recipe**, not an installed Documents API:

```ts
const DocumentKey = {
  scope: (workspaceId: string, viewerId: string) => ["documents", workspaceId, viewerId] as const,
  page: (
    workspaceId: string,
    viewerId: string,
    request: {
      page: number;
      pageSize: number;
      search: string;
      sort: "title:asc" | "updatedAt:desc";
    },
  ) => ["documents", workspaceId, viewerId, "page", request] as const,
};
```

The viewer belongs in identity when two viewers can receive different data for the same workspace. It is not an authorization credential and cannot replace backend checks. Never put passwords, session tokens, private file bytes, or unnecessary sensitive content into a key; cache diagnostics and developer tooling may expose it.

Normalize request semantics before using them. Equivalent “no search” values should not create accidental distinct cache identities, and unsupported sort or page values should not reach the endpoint unchecked. Prefer stable serializable values. A key that contains a function, mutable class instance, or transient random nonce usually obscures the intended result identity.

CDA's specification key includes project and, when supplied, viewer. LMS's collection key includes pagination and filter objects. These illustrate two different dimensions; a new paged private collection may need both. Do not copy either source's minimal key without checking the new API's complete input contract.

## Invalidate the affected projections

| Mutation                                 | Likely affected reads                      | Deliberate decision                                     |
| ---------------------------------------- | ------------------------------------------ | ------------------------------------------------------- |
| Create a document                        | Matching collections and relevant totals   | Invalidate scoped collection family                     |
| Change a title used in sorting/filtering | Detail plus affected collection pages      | Reconcile cached detail and refetch projections         |
| Update one unrelated display preference  | No document business data                  | Do not invalidate collection                            |
| Archive or delete a record               | Detail, lists, counts, dependent summaries | Include each actual read-model owner                    |
| Change visibility                        | Viewer-specific private projections        | Apply revocation/removal policy as well as invalidation |
| Switch viewer                            | Different result identity                  | Do not reuse prior viewer's private entry               |

Prefix invalidation is useful when a change can alter membership across several pages or filters. Exact invalidation fits a single independent projection. Do not promise that invalidating one visible page updates all cached views of a changed record. Conversely, invalidate-all on every write hides ownership mistakes and creates unnecessary refetches.

Cache updates can use an authoritative returned projection when its shape and scope match the key. Do not insert a partial mutation response into a full-detail slot or optimistically reconstruct private server capabilities. Background invalidation and acknowledged persistence are separate outcomes; a failed refresh must not invite a duplicate write.

## Failure and recovery

A wrong key can show the wrong result with no network error. Scope bugs therefore need explicit scenario review, not only request-success inspection. On logout or permission loss, private cache retention/removal has its own lifecycle; changing a key alone does not dispose every old private entry.

Avoid query functions that also write the same remote result to an unrelated global signal. LMS's inspected `findActive` does that for historical application behavior. In a new feature, first decide which owner is authoritative and why another representation is necessary; otherwise cache invalidation and signal state drift independently.

## Acceptance scenarios

Fetch the same workspace as viewers A and B with different visibility: results do not cross over. Change filter, sort, page, and page size independently: each request has the correct identity. Submit a mutation that changes sorted membership: affected collection pages and totals refresh under the documented scope. Update a display preference: business queries remain untouched. Abort an obsolete query: its signal reaches the API and current result ownership remains coherent. Revoke access: private retained entries follow the feature's cleanup policy.

Localize empty, retained-refresh, failed, and denied states independently. Do not expose raw query-key internals as user-facing diagnostics; show the effect and recovery action appropriate to the feature.

## Avoid these shortcuts

Do not omit viewer/filter/page inputs, duplicate key literals across pages, key only by an HTTP path while headers change projection, mirror results without a second owner's contract, or invalidate the entire cache after every command. A query-key factory is a compact statement of result identity and mutation responsibility.

## Sources and provenance

- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/src/features/development-guide/contacts/api/contact.querykeys.ts` — installed feature-owned key factory.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/src/features/development-guide/contacts/api/contact.query.ts` — injected API and query-signal propagation.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/src/features/development-guide/contacts/api/contact.mutation.ts` — targeted collection invalidation after writes.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:frontend/src/features/specifications/api/specifications.api.http.ts` — project/viewer query identity and API boundary.
- `LMS/lms-front@09a8ea2fc438652a90e4400c088c282b81845443:src/features/shift/api/shift.query.ts` — page/filter identity and historical parallel-signal caveat.
