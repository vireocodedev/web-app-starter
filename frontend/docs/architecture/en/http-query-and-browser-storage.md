# HTTP, Query, and browser storage

The application separates generic infrastructure from feature persistence.

## Generic HTTP and Query clients

`src/app/data/http/createAppAxios.ts` creates the one generic Axios instance
from validated configuration: base URL, timeout, credentials policy, and common
headers. It must not encode auth endpoint paths or session-expiry behavior.
`src/app/auth` adapts that instance to the confirmed session contract.

`src/app/data/query/createAppQueryClient.ts` owns Query defaults: retry policy,
retry delay, staleness, garbage collection, and mutation retry behavior.
Features supply query keys, query functions, mutations, invalidation, and
domain-specific error presentation.

## Application and feature persistence

There are two browser-persistence owners in the shipped template:

- `src/app/data/storage/appLocalStorage.ts` validates non-sensitive
  application preferences such as locale, color mode, navigation, and Pattern
  example state.
- `src/features/development-guide/contacts/api/contact.storage.ts` validates Contacts data. Its
  `ContactApiBrowserStorage` adapter implements an asynchronous feature API and
  honors `AbortSignal` even though the backing store is local.

## Contacts keeps an asynchronous boundary

Contacts therefore does **not** call an HTTP backend. Components consume
TanStack Query options from the constructed Contacts runtime; the adapter is
replaceable without changing those components. Keep this async contract when
introducing a server adapter so cancellation, loading, error, and invalidation
behavior remain meaningful.

The browser-storage adapter serializes every mutation through one FIFO queue.
Each queued operation reads the latest validated snapshot and checks its abort
signal both on entry and immediately before the synchronous storage commit. A
failed or aborted operation does not poison the next mutation, while an abort
after the commit point cannot roll back the completed write.

## Storage rules

Application and feature code do not access native `localStorage` directly.
Use an owned `RgoLocalStorageService` with a complete Zod schema and defaults.
Never persist tokens, passwords, session cookies, or other secrets. Browser
storage is user-controlled input: validation and safe defaults are required.

If new persisted data belongs to one removable feature, keep its schema and
keys with that feature. Add it to application storage only when the value is a
stable application preference shared across capabilities.

See [APIs, models, queries, and mutations](./apis-models-queries-and-mutations.md) for the feature-side contract.
