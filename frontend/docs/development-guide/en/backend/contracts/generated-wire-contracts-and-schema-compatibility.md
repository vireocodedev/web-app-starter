# Generate wire contracts without hiding compatibility decisions

**Support status: Vireo generator reference profile, not installed in this RGO/Spring starter.** Vireo derives frontend/backend transport artifacts from an entity schema and records hashes/manifests. This repository does not gain Vireo generation, its DTOs or checks by reading the recipe. Adoption or migration requires explicit owner, dependency, data and delivery decisions.

Use this pattern when frontend/backend shape drift repeatedly breaks features or when generated code is mistaken for a coordinated API rollout. A shared schema can make drift observable; it cannot decide whether a change is safe for old clients, retained data or deployed mixed versions.

## Know which artifact owns which contract

Pinned generator 0.4.0 derives wire-contract schema v2 while the entity schema/manifest have their own versions. The contract describes endpoints, field types/nullability, enum values, constraints, create/patch/response shapes and scalar/error meaning. Generation records schema/contract digests and per-file hashes.

Full-stack generation produces backend DTO/controller/migration and frontend schema/adapter artifacts. Frontend-only generation deliberately omits backend/migration output and records external-adapter ownership of server precision/errors. It must not pretend to define behavior for a backend it does not own.

| Artifact                              | Responsibility                                           |
| ------------------------------------- | -------------------------------------------------------- |
| Entity schema                         | Canonical generation input                               |
| Derived wire contract                 | Explicit transport meaning for the selected target       |
| Managed DTO/controller/schema/adapter | Executable boundary shape                                |
| Manifest/hash check                   | Detect recorded contract-critical drift                  |
| Application compatibility plan        | Rolling versions, data migration and deployment sequence |

The source checker recomputes digests and verifies recorded critical files, recognizing selected older exact generator versions without rewriting them. It is not a signature against a maliciously rewritten manifest, a backend availability probe or proof that CI is configured to run it. Those are different guarantees.

## Preserve scalar meaning as well as names

Generated date uses Java `LocalDate` and ISO calendar strings; timestamp uses `Instant` and offset-bearing ISO strings. Required and optional fields differ in nullability. Relationships write flat IDs and expose a stable relation-name-derived display property, rather than leaking the target's internal display-field name into every consumer.

The reference decimal wire is JSON number with server `BigDecimal`; long/integer values are JavaScript numbers in the generated frontend. This does not support arbitrary exact decimal money or every 64-bit integer losslessly in JavaScript. The earlier decimal-string recipe is a different deliberate contract, not something the generator supplies automatically. Precision-sensitive adaptation must change and verify both sides.

Vireo's full-stack error contract is `ApiError` with status, code, message, nullable field-message map and timestamp. It is not Spring ProblemDetail and is not this starter's currently installed general error protocol. A frontend-only target instead delegates backend-specific error normalization to the application adapter.

## Review a change before regenerating

**Recipe review record**, not a generator input file:

```text
Change: add optional response field "note"
Old readers: continue after stripping unknown response fields
New readers: require the documented nullable/missing rollout contract
Writes: keep create/patch intent separate from response-only fields
Data: add the reviewed migration when this application owns the backend
Delivery: choose deployment order and evidence before promotion
```

An additive nullable response field is generally safer than a required one, but an old backend may omit it. A new client whose response schema requires presence-with-null can still reject that older response. Define deployment order or a transitional reader explicitly.

Removing/renaming fields, changing scalar type, narrowing nullability, changing enums or endpoints is breaking. Even adding an enum value can break an older exhaustive/validated reader when the new value appears. Generated overwrite/force flags do not solve rollout or retained-data migration.

## Failure and recovery

A one-sided DTO or transport-schema edit should produce recorded drift when the reference check runs. Fix the schema/managed ownership or intentionally eject/migrate according to the generator workflow; do not simply update a hash to conceal an unreviewed contract change. Customized files are tracked distinctly so regeneration is not permission to destroy application behavior.

A successful hash check does not prove business authorization, concurrency, performance or external compatibility. Keep acceptance cases at those owners. Existing generated versions must remain understandable during migration; rewriting a predecessor's contract metadata can erase the evidence needed to explain deployed behavior.

## Adaptation checklist

- Confirm actual generator/profile adoption before using any Vireo API or command.
- Identify entity, wire, manifest and generator versions separately.
- Review methods, nullability, enums, scalar precision and errors—not only field names.
- Keep frontend-only ownership honest about unknown backend behavior.
- Wire the authorized drift check into the real repository workflow.
- Design data and mixed-version rollout for breaking/transitional changes.
- Treat generated consistency as evidence of shape, not complete application correctness.

## Exact source references

- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:packages/create-vireo/src/entity-generator.ts` — target selection, manifests/hashes, critical-file checking and recognized versions.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:packages/create-vireo/src/entity-renderer.ts` — wire contract, request/response artifacts and scalar/relationship semantics.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-core/src/main/java/com/vireocode/vireo/web/ApiError.java` — reference error record.
