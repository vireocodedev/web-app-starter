# Validation and public error contracts

**Support status: installed shared HTTP error and CRUD conflict contract.** MVC, authentication, Security filters and servlet dispatch retain the code/message/fieldErrors envelope. Correlation IDs and ProblemDetail are not installed.

Use this pattern when defining a request DTO, connecting a form to an endpoint, or distinguishing invalid input, missing authentication and conflicting business state. HTTP status and a stable machine code govern behavior; arbitrary server prose does not.

## CRUD failures and expected version

| Status | Code                 | Meaning                                                                                                             |
| ------ | -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 404    | `RESOURCE_NOT_FOUND` | Missing, soft-deleted or outside the permitted actor/parent scope.                                                  |
| 409    | `VERSION_CONFLICT`   | Stale expected version or an actual optimistic-lock race, including commit.                                         |
| 409    | `RESOURCE_IN_USE`    | A known relationship/invariant blocks deletion.                                                                     |
| 409    | `REQUEST_REJECTED`   | Exact known unique constraint on duplicate POST/PUT, including reserved soft-deleted code and concurrent insertion. |

PUT/DELETE require `X-Expected-Version`, a nonnegative int64 decimal; missing, malformed, negative or overflowing values return 400 `INVALID_REQUEST`. Version remains outside the shared writable Request. Unknown integrity/persistence failures remain 500 `INTERNAL_ERROR`; never translate every DataIntegrityViolationException into conflict or leak constraint names/SQL/private input. Known-constraint translation happens outside the service proxy after rollback, not by continuing inside an aborted transaction. Existing auth meanings, field allowlists, bounded frontend parsing, cancellation/original Axios object and unknown fallback stay unchanged. EN/HR translations include the three CRUD codes.

## Installed response shape and owners

Every error envelope contains `code`, `message` and `fieldErrors`. The latter is always an array, including when empty:

```json
{
  "code": "AUTHENTICATION_FAILED",
  "message": "Invalid credentials or expired session",
  "fieldErrors": []
}
```

The current working-tree owners are [ApiErrors](../../../../../../backend/src/main/java/com/vireocode/backend/http/ApiErrors.java), [ApiExceptionHandler](../../../../../../backend/src/main/java/com/vireocode/backend/http/ApiExceptionHandler.java), [ApiErrorController](../../../../../../backend/src/main/java/com/vireocode/backend/http/ApiErrorController.java), [AuthExceptionHandler](../../../../../../backend/src/main/java/com/vireocode/backend/auth/AuthExceptionHandler.java) and [SecurityConfiguration](../../../../../../backend/src/main/java/com/vireocode/backend/auth/SecurityConfiguration.java). These links describe the installed implementation; the pinned baseline references at the end describe its provenance, not the current envelope.

| Status    | Code                      | Trigger and safe public message                                                                                                                                                     |
| --------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 400       | `VALIDATION_FAILED`       | Bean Validation failure: `Some fields need attention`.                                                                                                                              |
| 400       | `INVALID_REQUEST`         | Malformed JSON or another invalid request: `The request is not valid`.                                                                                                              |
| 401       | `AUTHENTICATION_REQUIRED` | Missing authentication, including the Security entry point: `Authentication required`.                                                                                              |
| 401       | `AUTHENTICATION_FAILED`   | Rejected authentication scoped to `AuthController`, including unavailable session accounts but excluding authentication-service failures: `Invalid credentials or expired session`. |
| 403       | `CSRF_INVALID`            | Security rejects a missing/invalid CSRF token: `Request not permitted`.                                                                                                             |
| 403       | `FORBIDDEN`               | Other access denial: `Request not permitted`.                                                                                                                                       |
| Other 4xx | `REQUEST_REJECTED`        | Preserve the rejection status: `The request was rejected`.                                                                                                                          |
| 5xx       | `INTERNAL_ERROR`          | Unexpected/server failure, including authentication-service or user-store outages: `The request could not be completed`.                                                            |

`ApiExceptionHandler` handles general MVC errors at lowest precedence; the controller-scoped authentication advice keeps its narrower meaning. `AuthenticationServiceException`, including `InternalAuthenticationServiceException`, denotes an authentication backend/user-store failure rather than rejected credentials; both advice paths return 500 `INTERNAL_ERROR` without exposing the cause. Existing framework statuses and headers, such as `Allow` for a method rejection, are preserved while the public body/content type become the shared JSON contract. The servlet fallback reads the error status attribute, not exception text or submitted input. Missing/invalid status metadata falls back to 500. The contract does not turn failures into 200 responses.

## Validation detail is explicitly bounded

`AuthController.LoginRequest` is validated with `@Valid @RequestBody`: username is nonblank and at most 100 characters; password is nonblank and at most 72 characters. This differs from provisioning, which additionally requires at least 12 characters and checks the BCrypt ceiling of 72 UTF-8 bytes. Character annotations do not establish the byte limit for non-ASCII input.

Only login `username` and `password` fields are published as field details, in that order, with at most one entry per field. `NotBlank` becomes `REQUIRED`; `Size` becomes `TOO_LONG`; required takes precedence if both apply. For example:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Some fields need attention",
  "fieldErrors": [{ "field": "username", "code": "REQUIRED" }]
}
```

Other input-validation failures retain `VALIDATION_FAILED` with an empty array unless an explicit supported mapping exists. Return-value validation is a server failure and retains 500 with `INTERNAL_ERROR`. Never serialize raw binding paths, rejected values, constraint messages, credentials, SQL or stack traces. A valid field value or UUID also does not establish authority to use a resource. The session response remains a distinct `id`/`displayName`/`email` projection; neither its entity nor its password hash becomes public.

## Frontend decoding and recovery

[appHttpError.ts](../../../../../../frontend/src/app/data/http/appHttpError.ts) reads the original Axios failure without wrapping or changing it. A known code must match its HTTP status; `message` must be a string of at most 512 characters, and `fieldErrors` an array of at most 32 entries. Each entry's field/code strings are bounded to 100 characters. Invalid envelopes, unsupported top-level codes, status mismatches, cancellation and failures without a response return no recognized metadata.

The decoder retains field details only for `VALIDATION_FAILED`, known `REQUIRED`/`TOO_LONG` codes and the consumer's explicit field allowlist. It keeps the first supported detail per field and excludes prototype-related names even if a caller lists them. Login opts into `username` and `password`; another form does not inherit that permission automatically.

Stable codes map to local translation keys during rendering. The server's `message` is checked for shape but never displayed. Login preserves entered values, shows a localized alert and supported field helper text, and clears stale errors as input changes; logout uses the same shared message mapping. Unknown/malformed failures use the owning UI's localized fallback.

The [Spring-session adapter](../../../../../../frontend/src/app/auth/api/appAuth.api.springSession.ts) classifies credentials as invalid only when the failed original request was `POST /auth/login` and the decoded code is `AUTHENTICATION_FAILED`. A 401 from the CSRF preflight is not a failed login POST and must not become an invalid-credentials message. Session expiry and anonymous-session handling retain their separate responsibilities.

## Domain extensions remain deliberate

The [backend-connected feature tutorial](../../../../storybook/data/BackendConnectedFeature/BackendConnectedFeature.mdx) provides a complete frontend consumer recipe using this envelope. Its endpoint-specific status mapping and proposed domain-field publication are explicit consumer contracts, not additions to the installed shared vocabulary. Implement and test the corresponding backend field allowlist before promising those field details to a form.

The installed CRUD codes above define the approved stale-version and deletion meanings. Any further domain code still requires explicit 409 semantics, safe fields, authorization/resource-hiding and draft-preserving recovery, plus coordinated backend/frontend contract coverage. Do not infer a domain protocol from the generic `REQUEST_REJECTED` fallback or add unreviewed envelope fields endpoint by endpoint.

LMS remains a legacy comparison: its older `ErrorResponse` includes timestamp/status/path and an optional translation key. That demonstrates a translation seam, not an instruction to copy its payload or forward arbitrary exception messages. This starter emits no `requestId` and promises no correlation-ID facility. Introduce such a facility only through its own approved design.

## Verification responsibilities

Choose authorized coverage at the real HTTP and UI seams; this article itself runs no checks:

- Verify invalid login fields, malformed JSON, missing/invalid CSRF, anonymous access and invalid credentials return the documented status/code/array shape.
- Verify other 4xx and 5xx responses preserve status and framework headers while hiding exception/input details, including servlet error dispatches.
- Verify frontend limits, status/code matching, unsupported fields/codes and malformed payloads degrade safely without changing the original Axios failure.
- Verify CSRF-preflight 401 sends no login POST and is not presented as invalid credentials.
- Verify local translations, field helper text and preserved user drafts; provisioning's character/UTF-8-byte constraints remain a separate account-provisioning contract.

## Exact source references

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/AuthController.java` — baseline validated login record and session DTO.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/AuthExceptionHandler.java` — baseline controller-scoped authentication translation; current shared construction is linked above.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/SecurityConfiguration.java` — baseline Security filter ownership; current shared writers are linked above.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/user/LocalUserProperties.java` — provisioning field constraints.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/core/RestResponseEntityExceptionHandler.java` — legacy translation seam.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/core/ErrorResponse.java` — legacy envelope, not the starter contract.
