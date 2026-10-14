# Authentication and session

Authentication is application infrastructure under `src/app/auth`. It owns the
session contract, provider, gate, login UI, return-path rules, and the adapter
for the Spring Session backend. It is not a product feature and does not live
under `src/features`.

## Session runtime and expiry

`createAppAuthRuntime()` receives the configured Axios instance and Query
client. It creates the session API, query and mutation options, login
assistance for the mock environment, and one policy for replacing a session.
Login, logout, and session expiry cancel an older session read before publishing
the new session, clear non-auth Query data, and preserve the authoritative auth
query for provider observers. An accepted anonymous session read performs the
same identity-bound cleanup without cancelling itself. The HTTP interceptor
that recognizes the backend's expiry response is installed inside the auth
adapter, not in generic Axios setup.

An accepted session whose user ID differs from the cached session is another
identity transition, including when a shared cookie changes in another tab.
The runtime cancels and removes non-auth queries before publishing that user,
and the provider remounts the protected subtree. A same-user refresh retains
that subtree and its feature state. A failed background refresh also retains an
already accepted identity and recoverable drafts; only startup without an
accepted session is routed to the fatal render boundary.

## Provider, gate, and shell adapter

`AppAuthProvider` exposes this runtime to auth-owned components and hooks.
`AppAuthGate` protects authenticated routes and preserves a safe return path.
`AuthenticatedAppShell` is the router-owned adapter that supplies account
actions to the otherwise authentication-agnostic shell.

## Development mocks and a real backend

Development mock mode starts deterministic MSW authentication handlers before
runtime construction. Mock credentials and login assistance are fixtures, not
production defaults. Production application startup rejects mock API mode and
the production bundle omits the mock worker bootstrap; set
`VITE_API_MODE=http` before running the built application.

When connecting a real backend, adapt endpoint paths, request serialization,
response normalization, `401` behavior, and any confirmed CSRF contract in
`src/app/auth/api/appAuth.api.springSession.ts`. The login UI parses submitted
credentials transiently and this adapter serializes them for the request. Do
not read or manage authentication cookies or tokens from application
JavaScript, and do not persist credentials or authentication tokens in browser
storage or Signals.

## Dependency boundary

Authentication must not import development mocks, Signal state, or storage
services. Tests can install scenario-specific MSW handlers through the
top-level test server, while production auth remains independent of test code.
