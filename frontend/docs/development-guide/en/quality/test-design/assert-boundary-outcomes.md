# Assert the outcome at the boundary that owns it

A useful scenario states what should change, what must remain unchanged, and which boundary can establish that fact. A button click count cannot prove persistence; an HTTP status alone cannot prove the absence of an unauthorized row. Choose assertions from the contract before choosing mocks.

This is an **installed testing pattern with consumer reference examples**. Starter Contacts mutation tests inspect affected and unrelated query state; authentication API tests inspect request prerequisites and error classification. CDA adds persisted negative outcomes around exact commands. The cited files were read as source evidence; this article does not report a test run or passing result.

## Trigger and ownership

Use boundary-focused design when adding behavior, repairing a regression, or deciding where coverage belongs. The feature owns observable outcomes; the test owns setup and a controlled scenario. Select the smallest real boundary that can expose the failure without replacing the behavior under investigation.

The starter Contacts mutation suite seeds its collection and an unrelated collection, performs a mutation, and asserts that only Contacts becomes invalidated. Its rejected-write scenario asserts neither collection is invalidated. That is stronger than checking that an internal helper was called: both intended effect and isolation are visible at QueryClient state.

The auth API suite verifies that failed CSRF acquisition causes zero login submissions. It also distinguishes 503 from invalid credentials. These negative assertions protect the contract against “error occurred” tests that would accept the wrong failure.

## Write a scenario contract first

The following is **inert design pseudocode**, not an installed helper:

```ts
// Given: a visible document and an unrelated cached collection.
// When: the document command is rejected for stale revision.
// Then: the draft remains, no success is reported,
//       no acknowledged-result observer runs,
//       and unrelated cache state stays unchanged.
```

A positive case and its neighboring rejection case often expose the meaningful boundary. For a command, ask about accepted result, persisted facts, receipt identity, and unauthorized absence. For a UI task, ask about visible state, focus, navigation, and preserved input. For cleanup, ask what stops happening after disposal.

| Claimed behavior        | Useful evidence                             | Insufficient alone      |
| ----------------------- | ------------------------------------------- | ----------------------- |
| Correct HTTP contract   | Actual client request/response mapping      | Mocked feature callback |
| Scoped cache refresh    | Target and unrelated key states             | “invalidate called”     |
| Authorization rejection | Denial plus no forbidden persisted effect   | Hidden button           |
| Safe cancellation       | Abort plus ignored late result              | Controller existed      |
| Editor completion       | Acknowledged state and intended close/reset | Toast function called   |

## Keep test seams honest

A spy is useful when invocation itself is the contract, such as a committed-result observer. It is weak evidence for behavior that the spy replaces. If the scenario concerns server authorization, frontend mocks cannot prove it. If it concerns browser focus, a mocked dialog cannot prove assembled modal behavior.

CDA's specification integration scenarios inspect retained immutable bytes, privacy projections, replay, and row counts after denial. They illustrate deeper boundaries, but their product fixtures are not generic starter test APIs. Adapt the neutral outcome, not the entire business scenario.

Avoid assertions that mirror every private step. A refactor should be able to change internal ordering unless ordering itself protects the contract. Conversely, when hydration-before-effects or lock-before-decision is the safety property, a targeted ordering assertion is appropriate and should explain why.

## Failure and acceptance scenarios

Check that a deliberately rejected write cannot satisfy the success scenario merely because a promise settled. Check that a stale or denied operation leaves forbidden effects absent. Check an unrelated owner remains untouched. Check cleanup by performing another action after disposal and observing no effect. Make failure messages name the expected boundary rather than a vague snapshot mismatch.

A test source file documents intended evidence, not current execution status. Report commands, results, limitations, and unexecuted scenarios accurately when verification is authorized. Read-only inspection never substitutes for execution evidence, and a temporary restriction on running tests does not change the repository's ordinary testing policy.

## Avoid these shortcuts

Do not assert only render success, match broad error text, count mocked calls as proof of a database result, or duplicate implementation structure in a test. Start with the externally meaningful invariant and include the nearest forbidden outcome.

## Sources and provenance

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/features/development-guide/contacts/api/contact.mutation.test.ts` — positive/negative scoped invalidation evidence.
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/integration/auth/api/appAuth.api.springSession.test.ts` — zero-submit prerequisite and distinct failure contracts.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/test/java/com/vireocode/clientdiscovery/SpecificationIntegrationTests.java` — persisted absence, immutable output, privacy, and replay assertions.
