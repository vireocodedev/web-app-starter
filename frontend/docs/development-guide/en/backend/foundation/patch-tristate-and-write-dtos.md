# PATCH tri-state and deliberate write DTOs

**Support status: source-backed reference recipe with a legacy implementation comparison.** LMS uses `JsonNullable`, validation groups and MapStruct to distinguish omitted properties from explicitly supplied values. Those libraries and its Jackson configuration are not installed starter APIs. A Boot 4 consumer must select compatible serialization, validation and mapping mechanisms before adopting the recipe.

Use this pattern when a form updates only changed fields, a nullable field can be cleared, or a client must never write derived/audit data. HTTP PATCH alone does not define your field semantics: the endpoint needs a documented absent/null/value contract that survives decoding, validation, mapping and persistence.

## Installed POST and PUT default

New starter business resources use one `<Resource>Request` record for POST and full PUT, with identical writable-field validation and a separate Response. Null clears an optional nullable field on PUT; omitted optional JSON normally decodes to null and therefore also clears it. Required omissions fail validation. Metadata/version remain server-owned, with version carried in `X-Expected-Version`. See [CRUD conventions](crud-foundation-and-class-conventions.md). The LMS PATCH recipe below remains a separate, uninstalled partial-update design; do not infer PATCH semantics for this PUT.

## Three inputs mean three different commands

Assume a record has a nullable note and a required display name. The following is a **recipe wire contract**, not an existing starter endpoint:

| JSON request          | Meaning for note                                           |
| --------------------- | ---------------------------------------------------------- |
| `{}`                  | Leave the stored note unchanged                            |
| `{"note":null}`       | Clear the note if domain policy permits                    |
| `{"note":"New note"}` | Replace it with the supplied value                         |
| `{"note":""}`         | A present empty string; validate or normalize deliberately |

A plain Java nullable field usually collapses omission and explicit null, losing the command distinction before the service runs. An `Optional` chosen casually is not automatically a JSON tri-state contract either. The decoder must preserve presence, the validator must inspect the correct contained value and the mapper must skip only absence.

Collections need an equally explicit rule: an empty array may mean replace with empty, while null may mean clear or be invalid. Do not silently turn every collection PATCH into merge semantics. A separate operation such as “add member” can be clearer when the business action is more precise than generic field replacement.

## What the LMS source demonstrates

LMS request DTOs wrap many patchable fields in `JsonNullable`. `JsonNullableMapper` unwraps present values and uses a MapStruct `@Condition` that checks both wrapper existence and `isPresent()`. The JSON configuration explicitly registers `JsonNullableModule`. The controller selects `CreateGroup` or `UpdateGroup`, rather than treating creation and patching as the same validation operation.

Its DTO also marks convenience/audit properties with `@Null` for both groups; an ID is rejected on creation and the base mapper ignores identity when mapping to the domain. `@Null` rejects supplied non-null values, not the mere textual presence of a JSON property with null. Do not claim it provides a strict unknown/server-owned-property rejection protocol by itself.

The source's required-name annotation sits on a wrapped value. Verify compatible value extraction and group behavior when adapting it; the existence of an annotation is not proof that every omitted, explicit-null and blank case behaves correctly under a different Jackson/validation version. The older configuration uses its own JSON packages and date settings; copying that whole object mapper into the starter would be a much larger contract change.

## Keep the write model narrower than the read model

A response may include display labels, creator, revision, computed totals or capability flags. That does not make those fields writable. Prefer purpose-specific `CreateRecord` and `PatchRecord` commands when sharing a large DTO would obscure their rules. The server owns identity, actor, audit time and derived values.

**Pseudocode recipe:** `PatchValue` is a proposed presence-bearing type, not a starter class. Implement its decoder, field validation, DTO and mapper together; add compatible dependencies only if the chosen design requires them.

```java
void apply(PatchRecord command, Record target) {
    if (command.displayName().isPresent()) {
        target.rename(requireNonblank(command.displayName().value()));
    }
    if (command.note().isPresent()) {
        target.replaceNote(validateNullableNote(command.note().value()));
    }
    // Identity, workspace, createdBy and audit timestamps are server-owned.
}
```

The service first resolves current authority and the scoped target, then validates state/revision and applies allowed changes inside the transaction. A referenced category or owner ID needs its own authorized lookup. In the legacy mapper, an unavailable relation can resolve to null; a new consumer should decide explicitly whether missing, hidden or foreign-scope references fail rather than copying silent relation removal.

## Failure and recovery

The dangerous failure is successful-looking data loss: the client sends only a name, the decoder maps omitted note to null, and the mapper clears it. Another is the reverse: a null-ignoring mapper prevents an intentional clear. Trace one sample through the complete pipeline instead of reasoning only from the controller signature.

Keep the submitted patch/draft when validation or revision conflict fails. Rebuilding a patch from a refreshed full response can accidentally overwrite untouched fields and defeats the purpose of presence semantics. After a decoder or mapper change, review all patchable fields; a fix for one string must not alter lists or relationships silently.

Avoid generic map-to-entity assignment, copying read DTOs into writes, trusting client audit fields, and treating validation groups as an authorization policy. Groups select constraints; they do not decide who may change the resource.

## Acceptance cases to carry into an implementation

- Omission leaves a stored nullable field unchanged; explicit null clears it only when allowed.
- A present value replaces the field; empty strings and empty arrays follow documented rules.
- Required create fields and optional patch fields behave differently without losing contained-value validation.
- Supplied identity/audit/derived values cannot alter server-owned state.
- Invalid or cross-scope relationship IDs fail according to the endpoint contract rather than disappearing silently.
- Serialization, validation and generated/manual mapping agree on all three states.
- A failed patch preserves the caller's draft and does not modify unrelated fields.

## Exact source references

- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/vessel/VesselDTO.java` — nullable wrappers, validation groups and server-owned response fields.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/vessel/VesselController.java` — group selection on create and patch requests.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/base/JsonNullableMapper.java` — present-value condition and unwrap semantics.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/base/BaseMapper.java` — deliberate identity exclusion.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/vessel/VesselMapper.java` — mapping conditions and relation lookup comparison.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/core/JsonConfig.java` — legacy nullable module and mapper configuration.
