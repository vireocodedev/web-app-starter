# Tolerate additive response fields without weakening write intent

**Support status: Vireo generated-contract reference, not installed DTO/schema APIs in this RGO starter.** The pinned renderer produces separate create, patch and response types with Zod parsing and JsonNullable-backed JVM patches. Adopting these types requires generator/module and mapping/validation support; equivalent consumer boundaries can be implemented directly.

Use this pattern when a server adds response fields or a form edits only part of a resource. A tolerant reader can ignore unfamiliar additive data while a write command still says exactly what the user intended to change. Those policies are complementary, not a reason to accept arbitrary malformed known fields.

## Starter write policy

This Vireo recipe preserves its original separate Create/Patch types. The installed starter default instead uses one Request for POST/full PUT and a separate Response; [CRUD conventions](../foundation/crud-foundation-and-class-conventions.md) owns that rule. Write serializers select only writable fields, never spread Response metadata. Full PUT includes every writable value and uses `X-Expected-Version`; a stale response preserves the draft. This does not change the pinned Vireo generator.

## Be tolerant only about the chosen dimension

Generated response schemas use `z.object`, which strips unknown properties. Known properties retain their type, enum and nullability validation. Optional domain fields appear as explicit nullable response fields; `.nullable()` does not make a missing property optional. A new client can therefore reject an older response that omits a newly expected field, despite unknown-field tolerance in the other direction.

| Input condition                    | Contract behavior                 |
| ---------------------------------- | --------------------------------- |
| Extra unknown response property    | Stripped by the generated reader  |
| Known property with wrong type     | Rejected                          |
| Optional response value null       | Accepted as declared              |
| Expected nullable property omitted | Not automatically accepted        |
| Unknown enum value                 | Rejected by the known enum schema |

Do not turn tolerant reading into “catch parse failure and trust the object.” That removes the HTTP trust boundary. Likewise, do not silently coerce missing/invalid data to a create-form default.

## Preserve omission, explicit null and value in writes

The generator emits distinct CreateRequest, PatchRequest and Response shapes. Patch fields are optional at the JSON boundary; present null clears an optional field and is invalid for a required field. JVM request fields use `JsonNullable` with contained validation, and mapping checks presence before applying changes. Response-only ID/display fields are excluded from writable projections.

**Pseudocode recipe**, not installed schemas:

```ts
const PatchRecord = z.object({
  title: z.string().min(1).optional(),
  note: z.string().nullable().optional(),
});

const intent = editor.clearedNote ? { note: null } : editor.changedTitle ? { title: editor.title } : {};
const command = PatchRecord.parse(intent);
```

Implement real dirty/touched state, canonical validation, API adapter and server presence mapping in the consumer. The simplified branching is illustrative; a real form can submit several changed fields together. Use explicit null for clearing, not `undefined`, which JSON serialization normally omits.

## Do not promise generated dirty-field diffing

The pinned generated `ToPatchRequest` helper enumerates **all** known writable values from the supplied model. It does not compute which fields changed. The API accepts a partial patch, but the default helper can intentionally submit a full writable projection. An application requiring precise dirty-field intent must implement that selection instead of assuming PATCH method alone provides it.

The generated create/patch Zod schemas also use ordinary `z.object`; unfamiliar input keys can be stripped there too. This is not a strict unknown-write rejection guarantee. Narrow DTOs/mappers protect server-owned fields, while raw backend requests still need their own validation, unknown-property policy and authorization. Frontend parsing is not a security control against a caller bypassing that frontend.

A related display name can remain response-only while writes use a flat relationship ID. The backend still authorizes the target relationship in current scope. Omitting a label from a command does not validate the referenced ID automatically.

## Failure and recovery

When a response fails a known-field schema, report an integration/compatibility failure and preserve the editor's unsaved draft. Do not overwrite it with partially parsed defaults. For mixed-version deployment, define a transitional reader or deployment order rather than changing required/null semantics ad hoc after failure.

When a patch fails validation or revision conflict, keep the original intended fields distinct from a refreshed server snapshot. Rebuilding a full write from the latest response can overwrite untouched fields and defeat user-intent protection. Tolerant readers also must not echo unknown response properties back into writes through object spreading.

Avoid one shared entity DTO for all directions, client-supplied server IDs/audit values, omission collapsed into null and changing decimal/time representations on one side only. The exact-decimal and temporal patterns remain deliberate contract choices; tolerant reading does not make incompatible scalars compatible.

## Adaptation checklist

- Parse responses at the trust boundary and strip only the chosen additive fields.
- Keep known type/enum/nullability failures visible.
- Define missing-versus-null rollout behavior for new response fields.
- Separate create/patch/response and preserve all three patch states.
- Decide full writable projection versus dirty-field intent explicitly.
- Enforce backend writable fields, scope and validation independently.
- Preserve drafts and exact intended writes through compatibility/conflict recovery.

## Exact source references

- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:packages/create-vireo/src/entity-renderer.ts` — response/request schemas, API parsing, JsonNullable DTOs and all-field ToPatchRequest helper.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-core/src/main/java/com/vireocode/vireo/base/BaseRequestMapper.java` — distinct write/response models and identity exclusion.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-core/src/main/java/com/vireocode/vireo/base/JsonNullableMapper.java` — present-value condition and unwrap semantics.
