# State ownership and Signal lifecycle

Choose state by responsibility and lifetime, not by preferred library.

## Choose the owning state mechanism

| State kind                               | Appropriate owner                  |
| ---------------------------------------- | ---------------------------------- |
| Temporary interaction or display         | Closest React component            |
| Form values, errors, submission          | Form instance and schema           |
| Shareable route filters or selection     | URL/query parameters               |
| Async data, loading, errors, cache       | TanStack Query                     |
| Synchronous shared reactive domain state | Feature or application Signals     |
| Values that survive reload               | An owned validated storage service |

## Persistence is not a second source of truth

Persisted values are not a separate in-memory state model. Define who owns the
live value, validate storage input, hydrate deliberately, and write through one
effect or service. Never maintain the same source of truth in Query, a Signal,
Context, and storage.

## Signal group shape

Application Signal groups live at `<owner>/signals/<group>/` and share one
`sig<Group>` filename stem. A group may export source/computed values, typed
actions, a model, a service, and lifecycle effects. It remains flat inside its
group directory.

## Hydration, effects, and cleanup

A Signal group that needs startup hydration or an application-lifetime effect
exports one typed lifecycle module through its feature's public `index.ts`.
`src/app/bootstrap/signals/signalModules.ts` registers that public member;
`initSignalEffects.ts` hydrates **every** module before starting **any** effect
and returns one cleanup function. Registration order must not encode
dependencies.

Component effects remain in components and return their own cleanup. Route
state should not become an application Signal just to survive a rerender; use
the router when Back/Forward and deep links should reproduce it.

The production lifecycle registry is currently empty. The migrated Application
state examples live under `docs/storybook/patterns/`; they construct private
Signals, injected memory storage and disposable preview effects. They register
nothing at application startup and write no application storage keys. A consumer
adding real application-lifetime state must explicitly register its public module.
