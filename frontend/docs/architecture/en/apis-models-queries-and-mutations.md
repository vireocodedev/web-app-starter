# APIs, models, queries, and mutations

A feature data boundary has distinct layers so transport, validation, caching,
and UI can change independently.

## Models, ports, and adapters

`models/` owns domain values and Zod schemas. Parse data at an input boundary
instead of letting unvalidated transport values flow into components. The API
port in `<domain>.api.ts` describes domain operations and request concerns such
as `AbortSignal`; it must not expose Axios or Zod types.

An adapter such as `contact.api.browser-storage.ts` implements that port.
The documentation-only Contacts reference exposes asynchronous methods; its live
Storybook preview injects memory data. Its validated browser-storage adapter
remains an inert, tested reference. A consumer HTTP adapter can implement the same
port using the application Axios instance explicitly injected by its factory.
No Contacts adapter or runtime is installed in production.

## Query and mutation options

Query keys live in `<domain>.querykeys.ts` and are stable, hierarchical values.
Query option factories in `<domain>.query.ts` call the API port and forward
TanStack Query's cancellation signal. Mutation option factories in
`<domain>.mutation.ts` perform writes and invalidate only the affected keys.
The UI passes these options to Query hooks; it does not construct adapters or
reach into storage.

```text
component
  → feature runtime query/mutation options
    → API port
      → selected adapter
```

The composition owner selects the adapter and passes it with shared dependencies
such as `QueryClient` to the feature factory. Keep one constructed set of options in the application-lived
feature runtime when those options carry stable dependencies.

## One owner for asynchronous data

Use Query for asynchronous server-like data, including the Contacts async
storage contract. Do not duplicate Query-managed data in Signals or Context.
Queries own loading, error, cancellation, cache, refetch, and invalidation
behavior; local UI state owns selection and temporary presentation unless it
must be shareable or addressable elsewhere.

Tests should exercise ports/adapters and mutation invalidation independently,
then cover the assembled flow where integration risk warrants it.
