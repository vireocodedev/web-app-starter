# Revalidate delegated authority against the current principal binding

Keep a retained grant tied to the account and scope that were actually authorized. A contact identifier, current login or historical approval alone is insufficient when contacts can be rebound to another account.

**Source-backed reference recipe.** Client Discovery's `CommercialGrantPolicy` and `ServiceGrantPolicy` implement the observed checks. These classes, stores and purpose/action vocabulary are not installed APIs in this starter; adapt their contract to a neutral resource/workspace model.

## Trigger, owner and invariant

Use when a workspace delegates actions to a contact/account, when membership changes or when a background operation uses retained authority. The grant owner defines purpose, resource scope, actions, validity and revocation. The identity owner defines the current contact-to-account binding.

The invariant is captured authority plus current effectiveness. A command must satisfy its exact purpose/action/scope and current principal checks at use time. Grant existence is historical evidence, not permanent permission.

## Preserve both captured and current identity

The reference retains a grant's principal user ID and joins its contact to obtain the current user ID. The shared policy compares them before accepting authority. For an interactive path, it also requires the actor to equal the captured principal and verifies the account is enabled.

```text
retained grant: contact + captured principal + scope/actions/window
                            |
             current contact binding and enabled account
                            |
         command-specific action/purpose/resource decision
```

A neutral worked case: a contact delegated to account A is later linked to B. B does not inherit A's old grant merely by owning the contact now. A also cannot keep using it while the current binding differs. Review/reissue authority deliberately instead of rewriting the captured principal in place.

The equality check concerns current state, not every historical rebinding. If a product requires any intervening binding change to invalidate a grant forever, add a reviewed binding generation/version contract; the reference equality alone does not prove that stronger rule.

## Apply the full scope and time contract

| Dimension      | Observed source behavior                                                             |
| -------------- | ------------------------------------------------------------------------------------ |
| Validity       | `valid_from <= now` and `valid_until > now`, with no upper bound when absent.        |
| Revocation     | A retained revocation makes the grant ineffective.                                   |
| Actions        | Requested action must be in the captured action list.                                |
| Principal      | Captured/current binding equality; interactive actor equality and enabled account.   |
| Resource scope | Application/optional line and purpose-specific party relationships must still match. |

The service policy also validates action dependencies and exact purpose-specific allowed actions during creation. Those domain rules illustrate scoped admission, not universal business roles to copy.

A list/query entitlement predicate must reflect its own use case. The reference's current SQL requires a bound enabled account, while some external recipient/evidence checks intentionally allow an unbound contact when captured/current principal are both null. Do not claim every channel uses identical identity semantics.

## Keep noninteractive authority explicit

An external-evidence path can intentionally lack an interactive actor. The reference still checks window, actions, current binding and an enabled captured account when one exists. That does not authorize exposing an unauthenticated HTTP command or passing an `external=true` flag from an untrusted caller.

An adaptation needs an explicit trusted entrypoint/channel, evidence owner, resource binding and audit. Privileged administrator overrides, if present at a caller, are another policy decision; do not silently fold them into delegated grants.

## Failure and decision table

| Observation                                      | Decision                                                                       |
| ------------------------------------------------ | ------------------------------------------------------------------------------ |
| Captured principal differs from current binding  | Reject current use and review/reissue authority.                               |
| Actor owns contact but is not captured principal | No inherited permission.                                                       |
| At exact valid-until boundary                    | Grant is expired under the half-open window.                                   |
| Correct action, wrong resource/purpose           | Reject scope mismatch.                                                         |
| Background path has no actor                     | Require its separately defined trusted evidence channel.                       |
| Query and command eligibility differ             | Review channel-specific intent; do not blindly broaden one to match the other. |

## Adaptation and acceptance

Provide persistent grants/revocations, a current identity join, command authorization, consistent time semantics and transaction/locking rules for the consumer. The source does not prove atomic authorization across an unrelated remote provider call.

Inspect rebind, disabled account, revocation, boundary time, wrong action/resource and intended noninteractive cases. Keep captured history immutable and document any stronger generation-based policy separately. This article executes no grant, account change or protected action.

## Source provenance

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/CommercialGrantPolicy.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceGrantPolicy.java`
