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

`src/app/data/storage/appLocalStorage.ts` validates stable, non-sensitive
application preferences such as locale, color mode and navigation. It contains
no teaching-example state.

The separate `docs/storybook/examples/Contacts/api/contact.storage.ts` and
`contact.api.browser-storage.ts` files are inert, tested references. The live
Contacts preview injects a private memory adapter and Query client; it calls no
HTTP backend and does not construct its browser-storage adapter.

## Contacts keeps an asynchronous boundary

Reference components consume Query options from their private constructed
runtime. An installed consumer feature must choose and inject its own adapter,
register its runtime and preserve cancellation, loading, error and invalidation
semantics; documentation does not install that behavior in the application.

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
