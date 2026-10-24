# Debug the session through one browser origin

Trace local authentication from browser request to Vite proxy, backend session and fresh CSRF protection. Distinguish transport, cookie policy and account state before changing security settings.

**Installed starter contract.** Vite configuration, the Axios factory, Spring-session adapter and backend auth/local configuration own the path. This is a diagnostic recipe over those interfaces, not a second authentication implementation.

## Trigger, owner and invariant

Use when login succeeds but the next session request is anonymous, unsafe requests return 403, mock credentials fail against Java or a URL works only under one hostname. Frontend infrastructure owns the shared HTTP instance and adapter. Backend auth owns sessions, CSRF and cookie policy. Local development owns the proxy.

The invariant is browser requests to one frontend origin using `/api`, credentialed HTTP and session-bound CSRF on every unsafe request. Do not add permissive CORS or disable CSRF to mask a wrong host, missing proxy or stale token.

## Establish the path before credentials

```text
browser: http://127.0.0.1:<frontend-port>/api/...
       -> Vite /api proxy
       -> loopback backend:<configured-api-port>/api/...
       -> PostgreSQL-backed session
```

The installed defaults are frontend `5173` and backend `8080`. Use one hostname consistently: `localhost` and `127.0.0.1` are distinct cookie hosts. Cookies are not isolated just by changing ports on the same host.

Confirm the actual Vite process is in HTTP mode. The VS Code frontend launch sets it explicitly, but a separately started process may use mock configuration. Mock fixture identities are not real database accounts. A responsive MSW screen proves neither Java connectivity nor persisted authentication.

The Axios instance uses the validated API base URL and `withCredentials` setting. Do not construct a second ad-hoc client in a feature to repair auth; that can omit the shared interceptor and create a different lifecycle.

## Follow the actual session sequence

| Request                 | Expected installed boundary                                         |
| ----------------------- | ------------------------------------------------------------------- |
| GET `/api/auth/csrf`    | Header name `X-CSRF-TOKEN` plus a nonempty session-bound token.     |
| POST `/api/auth/login`  | JSON credentials and fresh CSRF; 204 for successful authentication. |
| GET `/api/auth/session` | Public identity DTO when authenticated; 401 when anonymous.         |
| POST `/api/auth/logout` | Fresh CSRF, invalidation and 204.                                   |

Login changes session identity and rotates CSRF protection. The adapter fetches a fresh CSRF response before each unsafe method rather than persisting one token indefinitely. It never automatically retries a mutation. A network failure after a POST is not proof the server did nothing.

The auth adapter maps anonymous session 401 to no current user and login 401 to invalid credentials. Unexpected 401 on other requests triggers the auth-owned expiry observer. Preserve this distinction rather than globally turning every 401 into the same toast.

Credentials are transient form/request data. Cookies are HttpOnly and browser-managed. Do not copy session cookies, passwords or CSRF tokens into localStorage, URL parameters, logs or screenshots to make diagnosis easier.

## Decide from the first mismatched boundary

| Observation                                      | Inspect                                                   | Decision                                                          |
| ------------------------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------- |
| API returns HTML                                 | Proxy path and backend availability                       | Correct routing before debugging password validation.             |
| Session always anonymous after login             | Host consistency, cookie policy and credentialed requests | Use the intended origin/profile; do not open protected endpoints. |
| Unsafe request returns 403                       | Fresh CSRF fetch/header and current session               | Repair adapter lifecycle rather than disable CSRF.                |
| Login returns 400                                | JSON wire format and field validation                     | Preserve contract; avoid sending incompatible form encoding.      |
| Login returns 401 with DB authentication working | Existing application account/password                     | Env edits do not reset an existing seeded identity.               |
| Only mock mode works                             | Actual HTTP/backend state                                 | Record mock evidence separately from real auth evidence.          |

## Keep local and deployed cookie rules separate

Base backend configuration requires Secure cookies. The loopback-bound `local` profile permits HTTP cookies for development. Using the base profile over plain local HTTP can prevent the browser from returning the expected cookie. Using the local profile on a deployed host weakens the intended production boundary and is not a fix.

Production serves frontend and `/api` under one HTTPS origin through the host proxy. The Vite development proxy is absent from built assets. A production API routing failure belongs to deployment proxy/configuration, not a reason to ship Vite as the server.

## Acceptance and inspection

For authorized manual diagnosis, record mode, nonsecret origin/path, expected status sequence and whether the session survived navigation/logout. Redact all credential/token values. Check real HTTPS behavior separately for deployed acceptance.

A successful session sequence does not prove every role or business action. Relevant behavior verification remains governed by the task's authorization and repository scripts. This page performs no login, request capture or security-setting change.

## Source provenance

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/vite.config.ts`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/src/app/data/http/createAppAxios.ts`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/src/app/auth/api/appAuth.api.springSession.ts`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:backend/src/main/resources/application.yaml`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:backend/src/main/resources/application-local.yaml`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:backend/src/main/java/com/vireocode/backend/auth/SecurityConfiguration.java`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:README.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/README.md`
