# Remembered credentials have their own expiry and account binding

**Support status: source-backed security recipe.** FRED has a dedicated long-lived remembered credential distinct from its short session. The starter does not install remember-me, its cookie, token repository or restore flow. A consumer needs an explicit security and UX decision before adding persistent sign-in.

Use this pattern when a user may restore account identity after the ordinary session ends. Remembering identity must not restore operational resource bindings, native external connections or stale privileges. It also must not quietly become an indefinitely sliding credential.

## Retain only a verifier for a high-entropy secret

The peer generates 32 random bytes, encodes them as a 43-character unpadded base64url secret and puts that secret in a dedicated HTTP-only cookie. The database stores its SHA-256 digest, user ID, account fingerprint, creation time and fixed expiry. This is a verifier for a high-entropy random bearer, not a recommendation to store ordinary human passwords with a fast hash.

Restore first checks token syntax, hashes it for lookup, then checks expiry and current usable account state. It compares the retained account fingerprint through `MessageDigest.isEqual`. Invalid/stale tokens are deleted when found and the cookie is cleared. A missing lookup also clears the presented cookie.

| Value                | Purpose                                              |
| -------------------- | ---------------------------------------------------- |
| Browser secret       | Proves possession; remains bearer material if stolen |
| Stored digest        | Lookup/verifier without retaining plaintext          |
| Account fingerprint  | Binds restoration to selected current account facts  |
| Created/expiry times | Fixed lifetime, independent of read frequency        |
| Operational binding  | Separate authority; never restored by this token     |

The source lifetime is 30 days. That is a peer policy, not a recommended duration for every generated application.

## Define exactly which account changes invalidate restoration

FRED's fingerprint covers user identity, password value/hash, email and company separated by delimiters. A password/email/company change therefore causes the next restore comparison to fail. Usability separately checks account lock and required fields. Role is required to exist but is not part of that fingerprint; do not claim every role change invalidates the token through fingerprinting.

This is lazy rejection on restore, not proof that every existing session or database token row is instantly deleted when account data changes. Revoking the presented credential removes that token and clears its cookie. An “all devices” revocation feature would need an additional explicit owner and implementation.

**Pseudocode recipe:** implement random issuance, digest repository/schema, fingerprint policy, secure cookie configuration, live authority and session integration. The collaborators below are not starter APIs.

```java
public Optional<Account> restore(RememberCookie input) {
    var secret = syntax.requireBoundedToken(input.value());
    var token = tokens.findByDigest(digests.sha256(secret)).orElse(null);
    if (token == null) return Optional.empty();
    var account = accounts.current(token.accountId());
    if (!policy.usable(token, account, clock.instant())) {
        tokens.revoke(token.id());
        return Optional.empty();
    }
    return Optional.of(account);
}
```

The calling auth owner must still establish the short session correctly, including its session/CSRF lifecycle and persisted security context where applicable. The peer restore method returns an account; it is not itself evidence that the starter's login lifecycle has been wired for remembered sign-in.

## Explain fixed expiry and concurrency

The source deliberately does not rotate or extend the token on every restore read because concurrent startup requests can present the same credential. Uncoordinated rotation can make one successful startup request revoke the token another is about to use. Fixed expiry avoids that particular race, at the cost of the same credential remaining usable until expiry, revocation or account-binding failure.

A consumer may choose rotation with a reviewed concurrency/grace policy instead. Do not teach fixed expiry as universally preferable or add a read-time expiry extension without acknowledging that it changes the maximum credential lifetime. Cookie Max-Age and database expiry must agree with the chosen policy.

The source cookie is HTTP-only, secure according to the configured transport policy, SameSite=Lax and path `/`. Browser session credentials and remembered credentials have different lifetimes. Neither belongs in localStorage or ordinary response payloads/logs.

## Failure and recovery

Malformed, expired, revoked or account-mismatched credentials lead to ordinary sign-in recovery, not a fallback that trusts account ID from the cookie. A restored user must reconnect any operational controller/resource through current authority. A remembered credential cannot authorize a tenant selected by caller input.

On logout/account switch, revoke the intended presented credential through the auth owner and clear the cookie. Decide separately whether all remembered devices or all short sessions should end. The peer opportunistically deletes expired rows during successful remembered issuance; it does not demonstrate a comprehensive retention/maintenance policy by itself.

## Implementation checklist and acceptance

- Database rows contain digest/fingerprint, never the bearer secret.
- Expiry is fixed or rotated according to one explicit concurrency policy.
- Account/password/email/company changes follow the documented binding behavior; role/lock handling is not overstated.
- Invalid restore clears browser state and returns to sign-in safely.
- Restoring identity creates a valid short auth lifecycle without restoring operational bindings.
- Logout, account switch, presented-token revoke and any all-device policy are distinct and covered.
- Cookie transport, retention, incident revocation and credential theft limits have explicit owners.

## Exact source references

- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/pilot/PilotRememberService.java` — random secret, digest/fingerprint, fixed expiry, restore/revoke and cookie policy.
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/pilot/PilotRememberToken.java` — stored verifier/account/times.
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/pilot/PilotUserAccess.java` — separate current account and operational controller binding.
