# Session authentication and CSRF are one lifecycle

**Support status: installed starter pattern.** The backend uses a server-side JDBC session, a session cookie and HTTP-session CSRF tokens. JWT issuance, browser token storage, remember-me and tenant authorization are not installed substitutes for this contract.

Use this pattern when changing login, adding a protected mutation, diagnosing a post-login 403, or connecting a new frontend client. Authentication success is only one step: session identity rotation, CSRF invalidation and explicit security-context persistence must remain coordinated.

## Ownership and public endpoints

`SecurityConfiguration` owns the filter chain, authentication provider, password encoder, session strategy, CSRF repository and security-context repository. `AuthController` owns JSON login and the public identity DTO. `AuthExceptionHandler` limits authentication exception detail. Flyway owns JDBC session tables; the frontend owns credentialed requests, token acquisition and recovery UI.

The `/api` servlet context produces these external routes:

| Request                 | Contract                                                                         |
| ----------------------- | -------------------------------------------------------------------------------- |
| GET `/api/auth/csrf`    | Returns `{headerName, token}` for the current session lifecycle                  |
| POST `/api/auth/login`  | Validated JSON credentials; successful response is 204                           |
| GET `/api/auth/session` | Authenticated public user DTO; reloads enabled user                              |
| POST `/api/auth/logout` | Spring Security logout; successful response is 204 and SESSION cookie is deleted |

CSRF and login are permitted by authorization rules. `permitAll` does **not** disable CSRF on login: a state-changing login request still needs the token/header obtained through the CSRF endpoint. `/actuator/health` and `/error` are also permitted. All other requests require authentication under the installed chain.

## The ordered login transition

The frontend first fetches CSRF and retains the returned header name rather than inventing one. Its login request sends JSON credentials, the CSRF header and the browser's session cookie. The backend authenticates through `DaoAuthenticationProvider` using the repository-backed user details and BCrypt cost 12.

The controller then performs this **installed sequence**:

```java
var authentication = authenticationManager.authenticate(
    UsernamePasswordAuthenticationToken.unauthenticated(
        credentials.username(), credentials.password()));
sessionAuthentication.onAuthentication(authentication, request, response);
var context = SecurityContextHolder.createEmptyContext();
context.setAuthentication(authentication);
SecurityContextHolder.setContext(context);
securityContexts.saveContext(context, request, response);
```

`sessionAuthentication` combines `ChangeSessionIdAuthenticationStrategy` followed by `CsrfAuthenticationStrategy`. The first changes session identity; the second clears the earlier CSRF token. Only after that does the controller create the authenticated security context and explicitly save it through `HttpSessionSecurityContextRepository`.

Do not remove the save because the current request appears authenticated: setting a thread-bound context alone does not establish the next request's persisted session contract. Do not remove the strategy because cookie login seems to work without it: session identity and pre-login token lifetime are security decisions, not cosmetic browser behavior.

After successful login, the frontend must reacquire CSRF before its next mutation. It should then resolve the session DTO for authenticated UI state. Reusing the anonymous token is a common explanation for a first post-login mutation failing even though login returned 204.

## Session identity is not permanent authority

The installed session endpoint reloads the username and returns only an enabled `AppUser`. That is a useful live identity check. It does not mean every future authenticated endpoint automatically reloads enabled state or domain membership. The security principal may remain authenticated until its lifecycle is ended; consumer services that require current authority must implement that check for their own actions.

The starter assigns `USER` in its user-details adapter. It has no installed tenant, administrator or resource-membership model. Do not add a role check to a copied peer endpoint and assume that it provides the missing membership policy. Authority changes, disabled accounts and scoped resources need an explicit application-service design.

## Cookies, storage and failure recovery

Base configuration makes the session cookie HTTP-only, secure and SameSite=Lax, with a 30-minute session timeout. Only the local HTTP profile turns secure off. JDBC session rows and attributes are created by Flyway, while automatic session-schema initialization is disabled. Broken session persistence may therefore be a migration or database problem, not a reason to store credentials or session tokens in localStorage.

Logout belongs to the Security filter chain rather than a controller method added for symmetry. Send the current CSRF token with POST logout. A successful logout returns no body and deletes `SESSION`; the frontend should discard cached identity and token state rather than keep presenting the previous actor.

Different failures need different recovery. Invalid credentials receive a controlled generic 401. An unauthenticated protected request gets the authentication entry point. A missing or stale CSRF token can get 403 from the access-denied handler. Do not automatically reissue every failed mutation: a retry policy must know whether any side effect could have occurred. Reacquiring a token repairs token state, not an authorization failure or stale business revision.

## Acceptance cases for a future implementation

Use these cases to define implementation acceptance; select checks according to the current task and repository policy.

- A login without CSRF is rejected; permitting the route does not bypass the token requirement.
- Valid login rotates the session identity, persists authentication and makes the pre-login token unsuitable for later mutations.
- A newly fetched post-login token authorizes a valid mutation when all domain permissions also hold.
- The session endpoint returns only public identity fields and rejects a disabled or missing account.
- Logout with the required token ends the authenticated lifecycle and clears frontend identity state.
- A deployed secure cookie works over the approved HTTPS path; local HTTP uses only the local exception.
- A new business service documents whether it reloads live authority instead of treating a cached session role as permanent permission.

## Exact source references

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/SecurityConfiguration.java` — provider, repositories, strategy order, filter errors and logout.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/AuthController.java` — explicit context-save sequence and identity DTO.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/AuthExceptionHandler.java` — controlled authentication failure.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/application.yaml` — session, cookie and schema policy.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/db/migration/V2__create_sessions.sql` — durable session schema.
