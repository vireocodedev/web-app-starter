# Exercise real PostgreSQL and the public HTTP contract together

A backend authentication contract spans security filters, session cookies, CSRF, JSON validation, persistence, and response projection. A mocked controller call cannot establish all of those boundaries. Use a disposable real database and a running application when the claim depends on their interaction.

This is an **installed starter test pattern**. `AuthIntegrationTests` uses a random-port Spring application, the local profile with explicit synthetic bootstrap values, and imported Testcontainers configuration. That configuration supplies PostgreSQL 18 through a service connection. The source was inspected; no container, server, or test was started for this article.

## Installed business reference boundary

The [executable reference](../../backend/foundation/executable-reference-feature-and-isolation.md) adds real PostgreSQL/HTTP coverage for a HARD group and SOFT contact without adding production feature tables or endpoints. Test trusted actor scope, shared Request/full PUT clearing, required X-Expected-Version parsing, safe 400/404/409/500 envelopes and OpenAPI shape. Inspect persisted state after requests: flush is not commit, HTTP work does not share a test rollback, and a successful response must carry current version/audit.

Separate fixtures assert metadata/proxy/hash behavior, fresh/cached soft visibility, native active predicates, reserved unique code, exact FK/UNIQUE catalog constraints and negative schema drift. Normal-context mappings/schema/OpenAPI and Boot JAR exclusion are independent negative evidence. A full page with a cold context must stay within the specific three-SELECT budget; small data/cache can conceal N+1. These are implementation acceptance checks, not passing results merely because this article names them.

## Trigger and ownership

Use this boundary for session/security contracts, database-backed behavior, migrations, and endpoint mapping that a service-only test cannot prove. The suite owns a disposable database and synthetic data. Spring owns the real HTTP/security/application composition. The HTTP client owns its cookie jar, and each scenario starts with a fresh one.

The installed test builds Java's HttpClient with CookieManager in `BeforeEach` and obtains the application's random port from Environment. It does not point at a developer's persistent database or require a real user account. Keep that isolation when adapting the fixture; a configured local profile is not permission to reuse personal runtime data.

## Assert protocol facts, not just reachability

This is **inert neutral scenario pseudocode**, not an installed helper:

```text
GET session as anonymous -> unauthorized
GET CSRF -> retain cookie jar and token
POST login with that token -> acknowledged login
GET session -> exact public user projection
POST logout with fresh token -> acknowledged logout
Replay old session cookie -> unauthorized
```

The actual suite additionally checks session-ID change after login, persisted session rows, hashed passwords, idempotent local initialization, malformed JSON/missing-field responses, and cookie/cache headers. Its public session projection has an asserted field count and expected values, which helps catch accidental disclosure beyond a broad “contains user” assertion.

| Contract          | Positive/negative evidence                                 |
| ----------------- | ---------------------------------------------------------- |
| Anonymous access  | Session is denied while health remains public              |
| CSRF prerequisite | Login and logout without token are forbidden               |
| Session binding   | Removing the token's cookie jar makes token use fail       |
| Token rotation    | Pre-login token cannot log out authenticated session       |
| Logout            | Old authenticated cookie cannot restore session            |
| Credentials       | Wrong/unknown credentials do not start authentication      |
| Persistence       | Session row exists and password is not stored as plaintext |

Do not infer HTTPS/Secure-cookie deployment behavior from a local HTTP scenario. The installed assertions include HttpOnly and no-store, not every reverse-proxy or transport setting. Add deployment-specific evidence at its actual boundary when that behavior changes.

## Database and transaction limits

A real PostgreSQL fixture exposes database-specific SQL, constraints, and session storage more faithfully than an unrelated in-memory substitute. It still does not prove production upgrade history, pool saturation, cross-host failover, or deployment configuration. Choose separate migration/operational scenarios when those are the claim.

Do not assume HTTP requests run inside the test method's transaction or roll back with it. The installed suite is not marked transactional at the test class. Own fixture identity and cleanup explicitly and understand what persists across methods/application contexts. Add failure/rollback assertions where a command must leave no partial effect.

## Failure and acceptance scenarios

An integration failure should identify whether startup, container availability, HTTP contract, or persisted assertion failed. Do not replace a failing real-database scenario with a mock and report the same guarantee. Conversely, keep pure mapping/validation tests small where no real database behavior is involved.

The designed scenarios should reject missing CSRF, stale token, token from another jar, wrong credentials, malformed JSON, and replayed logged-out session. A valid flow returns only permitted user fields and records actual session state. Repeat initialization without creating duplicate users or changing the existing password unexpectedly. Use synthetic values and avoid logging passwords/cookies while debugging.

This article defines source-grounded evidence to run through the repository's authorized verification workflow. Reading its assertions is not a passing result and does not replace ordinary project testing policy.

## Avoid these shortcuts

Do not test only a controller with security bypassed, use a real account, treat 200 alone as correctness, assume rollback across HTTP, or claim local cookie tests prove production TLS behavior. Pick the real composition boundary for the promise being made.

## Sources and provenance

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:backend/src/test/java/com/vireocode/backend/AuthIntegrationTests.java` — running HTTP/cookie/CSRF/persistence and negative-contract assertions.
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:backend/src/test/java/com/vireocode/backend/TestcontainersConfiguration.java` — disposable PostgreSQL 18 service connection.
