# API evolution and compatibility

**Support status: installed compatibility policy and frontend consumer fixtures, with a worked rollout procedure.** The current Spring-session adapter validates incoming transport responses and writes explicit commands. Its compatibility fixtures exercise that client through MSW; backend HTTP tests separately exercise the producer. This is not generated/OpenAPI schema support or proof that old deployed binaries have been tested together.

Use this policy before changing an existing request, response, endpoint behavior, validation rule, authorization decision or error meaning. The frontend/backend owners share the compatibility review; Bruno approves breaking changes and removal conditions before implementation.

## Preserve the installed contract deliberately

Current authentication paths remain under `/api/auth` with no version segment. This article introduces neither a `/v1` convention nor a general resource-naming policy. Record the affected method/path and actual consumers instead of silently renaming an endpoint.

[AppAuthUser](../../../../../../frontend/src/app/auth/models/AppAuthUser.ts) validates a nonempty string `id`, nonempty `displayName` and valid `email`, stripping extra response fields. The [Spring-session adapter](../../../../../../frontend/src/app/auth/api/appAuth.api.springSession.ts) similarly validates CSRF `headerName: "X-CSRF-TOKEN"` and a nonempty token. Extra metadata can be ignored; malformed known values cannot be treated as a successful response.

The login serializer deliberately writes only `username` and `password`, even when a structurally compatible caller object carries extra properties. Keep response additions separate from write intent: never spread a received response or arbitrary form object into a command. Backend DTO validation, authorization and persistence constraints remain authoritative even when the frontend narrows its write.

The [shared error contract](../foundation/validation-and-error-contracts.md) also carries behavior: status/code matching, validation-field allowlists and authentication classification are contract facts. UI copy comes from local translations; server `message` text is not interpreted for behavior or displayed. A safe wording change within its documented bounds is different from changing a machine code, HTTP status or which request is classified as invalid credentials.

## Classify the whole change

| Proposed change                                                                                      | Compatibility decision                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add an unknown response property                                                                     | Compatible with the current tolerant reader's shape, provided known values/semantics and security remain unchanged. New consumers still need a missing-field policy for an older backend. |
| Rename/remove a known field; change type, nullability or scalar meaning                              | Breaking for existing consumers unless an explicit transition preserves their contract. Missing and explicit null are separate cases.                                                     |
| Add an enum/code value                                                                               | Breaking unless each supported older reader already handles that value safely and deliberately; a generic fallback does not prove equivalent business behavior.                           |
| Add a required request field, tighten validation or change omission/null meaning                     | Breaking for writers that previously produced valid requests. Support old commands during an approved transition.                                                                         |
| Change method/path, status, error code, authorization, CSRF acquisition/rotation or session behavior | Review as semantic compatibility work even if JSON field names are identical. Security improvements still require an explicit migration decision.                                         |
| Change response projection into write echoing                                                        | Rejected: extra response fields are not permission to write server-owned data.                                                                                                            |

Use the [tolerant-reader recipe](tolerant-readers-and-exact-write-intent.md) and [generated-contract reference](generated-wire-contracts-and-schema-compatibility.md) for their principles, not their absent APIs. This starter does not acquire Vireo generation, JsonNullable DTOs or a versioned endpoint system by following those articles.

## Review both readers and writers

Record the supported old/new producer and consumer versions for the specific change. For an additive response field and a transitional request contract:

| Combination              | Response-reader obligation                                                                                                                              | Request-writer obligation                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Old client / old backend | Preserve the established baseline.                                                                                                                      | Established commands still work.                                                    |
| Old client / new backend | Known fields keep meaning; unknown additions remain safely ignorable.                                                                                   | New backend continues accepting the approved old command shape.                     |
| New client / old backend | Handle absence of the new field explicitly through a reviewed transitional reader or deploy prerequisite. Nullable-but-required does not mean optional. | Send only fields the older backend accepts until the new capability is established. |
| New client / new backend | Validate the intended new contract without weakening known fields.                                                                                      | Send the deliberate new command; server still validates and authorizes it.          |

This table is a review obligation, not evidence that a binary matrix has run. Name unsupported combinations and the prerequisite that prevents them. Paired image deployment does not instantly replace old browser tabs, cached clients or required rollback candidates.

## Expand → deploy → contract

1. **Approve the change record.** Identify old/new shapes and semantics, affected readers/writers, schema/data changes, supported combinations, recovery and removal criteria. Present breaking changes or missing patterns to Bruno before implementation; fixture edits cannot grant that approval.
2. **Expand compatibility first.** Preserve the old backend contract while adding the approved optional capability or transitional behavior. A new reader must have an explicit policy for older responses; do not silently accept malformed required fields. Coordinate migrations with the existing schema owner.
3. **Deploy through the existing release contract.** Validate the candidate pair on staging, retain its exact source/digests and accepted evidence, and promote that same pair to production. The [paired-release procedure](../../delivery/releases/staging-and-production-promotion.md) remains authoritative; this policy does not authorize component-only deployments or a workflow dispatch.
4. **Verify the supported transition.** Check the declared producer/consumer combinations and relevant retained data, caches, sessions and rollback assumptions. Source fixtures describe compatibility expectations; record separately any real deployed-version evidence that is required.
5. **Contract only after explicit approval.** Remove old fields/behavior only when the approved consumer/support and recovery conditions are demonstrably satisfied and Bruno approves removal. Preserve the change/evidence record. No universal retention period or automatic rollback-compatibility guarantee is established here.

A migration can make an old image unsafe even when its original API fixture still parses. Use the owning migration/recovery procedure and explicit operator authority rather than inferring rollback safety from retained image digests.

## Consumer fixtures and their limits

[appAuth.contractCompatibility.test.ts](../../../../../../frontend/tests/integration/auth/api/appAuth.contractCompatibility.test.ts) keeps frozen literal baseline session, CSRF and login fixtures independent of production serializers. It uses the actual Axios/client adapter with scenario-owned HTTP handlers to cover:

- Established session payloads and additive response fields; missing, null and malformed known identity fields remain failures.
- Existing CSRF metadata plus harmless additions; malformed known metadata blocks the protected POST.
- Stable error codes/classification despite changed server prose; an incompatible status is not concealed by a familiar error code.
- Exact login `username`/`password` serialization, content type and CSRF header, with structural extras omitted.

The existing [adapter suite](../../../../../../frontend/tests/integration/auth/api/appAuth.api.springSession.test.ts) separately covers failed CSRF acquisition, including preflight 401: no login POST follows and the acquisition failure is not mislabeled invalid credentials.

Keep baseline literals independent. Changing an expectation is a reviewed contract change, not a way to erase a compatibility regression or retroactively approve a break. Additions to the contract need new acceptance cases without rewriting the old baseline silently.

These are frontend consumer checks against synthetic HTTP responses. [AuthIntegrationTests](../../../../../../backend/src/test/java/com/vireocode/backend/AuthIntegrationTests.java) separately verifies the backend producer through actual HTTP/PostgreSQL. Together they provide complementary evidence; they do not launch the frontend against that backend or run an old deployed-binary matrix. Follow [MSW transport ownership](../../quality/frontend/http-contract-mocks-and-handler-lifetimes.md) and the repository verification instructions for authorized execution.

## Exact source references

Pinned sources establish the existing producer, fixture lifetime and release foundation; current codec and new compatibility checks are linked above without invented revision pins.

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/AuthController.java` — baseline login, CSRF and session producer.
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/setup.ts` — scenario-owned transport fixture lifetime.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md` — paired immutable releases and operator recovery ownership.
