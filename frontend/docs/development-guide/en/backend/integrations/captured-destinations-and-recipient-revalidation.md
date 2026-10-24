# Preserve the approved destination and revalidate the recipient before use

Treat a queued message's destination as part of its retained intent, not a mutable address lookup at dispatch time. Revalidate current authority without silently redirecting approved content to a different contact or account.

**Source-backed reference recipe.** Client Discovery's `ServiceNoticeService`, grant policy and private provider boundary implement the observed protocol. The launch provider is explicitly unconfigured and performs no network delivery. This starter has no installed notice API/provider from this reference.

## Trigger, owner and invariant

Use when background notifications depend on an approved recipient, template/version and delegation. The intent owner captures destination and exact message. The identity/grant owner determines current authority. A separately implemented provider owns transport, not the meaning of qualified delivery.

The invariant is retained destination equals currently permitted destination at protected use boundaries. A new email address or account binding must not silently inherit an old message's approval.

## Capture destination with message identity

The reference captures contact ID, captured principal ID and address through a currently effective recipient grant. It retains canonical destination/binding payloads with digests alongside message/template artifact identities, locale, due time and idempotency key.

```text
reviewed binding + current grant/contact
                 |
immutable intent: destination + message bytes/digest + source/version
                 |
current recipient and binding revalidation
                 |
claim -> external provider -> retained reconciliation
```

Row reads check retained digests, resource/version relationships, package/binding facts and exact artifact metadata. Current-recipient validation then reconstructs the permitted destination and compares canonical values with the captured one. It does not automatically normalize an arbitrary changed address into equivalence.

A neutral case: a workspace message was approved for contact A at address X. Before dispatch, the contact is rebound or address becomes Y. The system refuses current use instead of rerendering/rerouting the old intent. A reviewed new intent is a separate action.

## Revalidate more than the queue row

| Boundary             | Observed check                                                                          |
| -------------------- | --------------------------------------------------------------------------------------- |
| Message retrieval    | Visibility plus current recipient check, including after the admin visibility shortcut. |
| Current binding      | Recipient plus exactly one matching current reviewed notice binding.                    |
| Claim                | Authorized actor, owner locks, current binding and delivery-row lock.                   |
| Reconciliation       | Lease owner, existing receipt and current binding before recording state.               |
| Manual qualification | Exact notice/message/recipient evidence and current procedure/time constraints.         |

An immutable message is not permanent permission to disclose it. The reference's message retrieval checks current recipient even when a privileged actor passed visibility. Do not replace this with a broad “admins can read every historical route” assumption.

## Keep claim and remote effects distinct

The claim retains an owner token/lease, builds submission from captured address and retained message bytes, then marks uncertainty before provider I/O. First queued work may submit; later reconciliation uses lookup with stable identity rather than blindly creating a new intent.

Provider I/O occurs outside the database transaction. Afterward, a new transaction accepts only the owning lease and rechecks policy/binding. An unconfigured provider produces manual-verification state; other transport observations remain uncertain in this source. A returned provider observation is not automatically a qualified delivery receipt.

The default provider makes no network call. Installing an authenticated provider and defining accepted external evidence is separate work, not a feature already supplied by the interface.

## State the unavoidable race

A recipient can be revoked/rebound after the final database check but before a remote provider executes. A local transaction/lease cannot atomically revoke an unrelated external system. Post-call revalidation prevents false local qualification but cannot unsend a message.

An adaptation must define the acceptable dispatch window, provider idempotency/lookup guarantees, cancellation/version support if available and uncertain-outcome recovery. Do not claim the reference eliminates every authorization race or guarantees exactly-once delivery.

## Failure and decision table

| Observation                                      | Decision                                                                            |
| ------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Address or principal differs from captured route | Block use; do not silently update the old intent.                                   |
| Retained destination/message digest disagrees    | Reject source reconciliation mismatch.                                              |
| Claim lease is owned by another worker           | Do not apply this worker's result.                                                  |
| Provider times out after possible execution      | Keep uncertainty and stable lookup identity.                                        |
| Grant revoked during remote call                 | Revalidate local state, acknowledge residual exposure and follow reviewed recovery. |
| Provider reports observed stage                  | Do not invent qualified evidence without the procedure contract.                    |

## Adaptation and acceptance

Provide immutable artifacts/intents, scoped grants/current identity, canonical comparison, transaction/lease ownership and a real provider/evidence contract. Inspect changed address/account, expired grant, stale lease, timeout and duplicate identity cases.

Independent security/source review is required before integration. This article sends no message, installs no provider and authorizes no disclosure.

## Source provenance

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceNoticeService.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceGrantPolicy.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/CommercialGrantPolicy.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/NotificationDeliveryProvider.java`
