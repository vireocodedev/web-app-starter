# Validation and public error contracts

**Support status: installed authentication validation and errors; reference recipe for a wider domain protocol.** The starter has Bean Validation, a controller-scoped authentication handler and Security filter handlers. It does not install a universal field-error envelope, translation-key exception library or application-wide ProblemDetail policy.

Use this pattern when defining a request DTO, connecting a form to an endpoint, or deciding how a frontend distinguishes invalid input, expired authentication and conflicting business state. Status, safe public information and stable machine meaning belong in the endpoint contract before the UI starts branching on errors.

## What the starter actually guarantees

`AuthController.LoginRequest` is a request record validated with `@Valid @RequestBody`. Its username is nonblank and limited to 100 characters; its password is nonblank and limited to 72 characters. This is the login request contract, not the user-provisioning password policy: provisioning separately requires at least 12 characters and explicitly checks a maximum of 72 UTF-8 bytes for BCrypt. A character annotation alone cannot enforce the byte limit for non-ASCII text.

Session responses are a distinct record with `id`, `displayName` and `email`. Neither the entity nor its password hash is exposed. Request validation is also separate from authorization: a well-formed UUID or valid string does not establish permission to use a resource.

| Installed path                                     | Status | Public body                                            |
| -------------------------------------------------- | ------ | ------------------------------------------------------ |
| Security authentication entry point                | 401    | `{"message":"Authentication required"}`                |
| Security access-denied handler                     | 403    | `{"message":"Request not permitted"}`                  |
| AuthenticationException handled for AuthController | 401    | `{"message":"Invalid credentials or expired session"}` |

The last handler is restricted with `assignableTypes = AuthController.class`. It is not a global handler for every future business controller. A missing CSRF token is handled in the Security lifecycle and can produce the access-denied response before the controller runs. A client must not assume every 403 proves the account lacks a domain role.

Base server configuration suppresses exception messages and stack traces in default responses. Framework handling of malformed JSON or Bean Validation failures is not an installed, frontend-stable field-error schema here. Do not claim those failures already produce the recipe below.

## Define the consumer's protocol deliberately

LMS provides a legacy comparison: its advice distinguishes request-body validation, constraint violations, access denial and a translation-key exception. Its `ErrorResponse` contains timestamp, status, error, message, path and optional translationKey. That demonstrates a central translation boundary, but the legacy payload and Spring APIs must not be copied as if they were installed in the Boot 4 starter. In particular, forwarding arbitrary exception messages is not a general public-data policy.

For a new domain module, choose the smallest contract the frontend can use reliably. The following is **recipe JSON, not a current starter response**:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Some fields need attention",
  "fieldErrors": [{ "field": "displayName", "code": "REQUIRED" }],
  "requestId": "example-correlation-id"
}
```

Before publishing that contract, the backend owner must implement its DTO, bounded field-path mapping, exception translation and correlation-ID source. The frontend owner must implement its typed decoder, localized code mapping and unknown-code fallback. Existing Bean Validation is available; a shared error-code registry, global advice and tracing facility are not installed merely by this article. Decide whether to adopt ProblemDetail as a separate explicit design; do not mix unreviewed envelope formats endpoint by endpoint.

Use machine codes for UI behavior and localized frontend messages for presentation. A server message can remain a safe fallback, but the UI should not parse English prose to distinguish stale revision from validation. Do not include rejected passwords, credential headers, SQL, stack traces or full submitted payloads. Validation error metadata must come from an allowlist of supported fields and codes.

## A complete form scenario

A record editor sends a name and expected revision. Blank name is a request failure; a name that is well formed but disallowed by the current domain state is a business failure; an older expected revision is a conflict. The form needs different recovery for each:

| Failure                            | Consumer contract decision              | Recovery                                            |
| ---------------------------------- | --------------------------------------- | --------------------------------------------------- |
| Invalid JSON or field              | Usually 400 with safe structured detail | Keep draft; identify supported fields               |
| Unauthenticated or expired session | 401                                     | Reauthenticate without leaking credentials          |
| Authenticated but forbidden action | 403, or documented resource hiding      | Explain permission boundary; do not retry blindly   |
| Hidden or missing resource         | Documented 404                          | Leave editor safely; do not infer existence         |
| Stale expected revision            | 409                                     | Preserve draft; reload and reconcile                |
| Unexpected server failure          | Safe 5xx response                       | Preserve draft; offer bounded retry and correlation |

These are recommended choices for a consumer, not proof that the starter already implements every row. Resource hiding must be consistent between reads, writes and errors. A database uniqueness race also needs explicit translation if it corresponds to a user-facing conflict; a pre-check alone cannot guarantee success under concurrency.

## Failure, recovery and acceptance

An error handler that catches everything and returns 200 destroys the caller's ability to tell success from failure. An error handler that returns every exception's message creates an uncontrolled information channel. Keep narrow known translations, safe unexpected-error behavior and internal diagnostics linked by a correlation identifier when the consumer has that facility.

Future acceptance cases, documented rather than executed here:

- A blank login username is rejected without authentication; invalid credentials return the controlled authentication response.
- Missing CSRF fails before mutation and does not become a misleading field error.
- The form distinguishes 400, 401, 403 and stale-revision 409 while retaining unsaved work.
- Non-ASCII provisioning passwords are checked in UTF-8 bytes as well as characters.
- Unexpected exceptions never expose credentials, SQL or a stack trace.
- Unknown machine codes degrade to a safe localized fallback instead of crashing the error renderer.

## Exact source references

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/AuthController.java` — validated login record and session DTO.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/AuthExceptionHandler.java` — controller-scoped generic 401 response.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/SecurityConfiguration.java` — filter-level 401 and 403 responses.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/user/LocalUserProperties.java` — provisioning field constraints.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/core/RestResponseEntityExceptionHandler.java` — legacy translation boundary.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/core/ErrorResponse.java` — legacy envelope, not a starter API.
