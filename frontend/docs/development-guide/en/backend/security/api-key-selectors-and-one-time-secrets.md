# API keys: public selector and one-time secret

**Support status: source-backed security recipe.** LMS issues machine credentials with a lookup selector and separately hashed random secret. The starter does not install API-key authentication, key management, machine scopes or the legacy filter. Implement a separate reviewed machine-principal contract rather than adapting browser sessions implicitly.

Use this pattern when a partner or automation needs revocable access without a human password. Efficient lookup and secret verification are different responsibilities: a public selector finds a row; possession of the secret authenticates it.

## Understand the issued format

The peer service generates 12 random selector bytes and 32 random secret bytes, encoding each with unpadded base64url. Its format is `pk.<selector>.<secret>`. These generated parts are 16 and 43 characters respectively. The exact prefix/lengths are peer protocol, not template defaults.

Only the secret is BCrypt hashed. The stored row includes selector, hash, active/revoked/expiry state and metadata. Ordinary DTOs omit hash and plaintext; an issuance DTO carries plaintext only in the immediate issue/rotate response. “Shown once” means not retained for later retrieval, not proof that every intermediary cache/log is already prevented.

| Value                    | Treatment                                                 |
| ------------------------ | --------------------------------------------------------- |
| Selector                 | Public lookup identifier; unique database key             |
| Secret                   | High-entropy bearer material; return only on issuance     |
| Secret hash              | Stored verifier; never a list/response field              |
| Key type/scope           | Explicit machine authorization policy                     |
| Last-used/revoked/expiry | Current lifecycle state, not authentication by themselves |

An entity declares selector uniqueness, while generation also prechecks for collision. A consumer using Flyway must enforce actual uniqueness and handle an insert race; the precheck alone is insufficient.

## Authenticate lifecycle and secret together

LMS parses the prefix and three parts, looks up the selector, rejects inactive/revoked/expired rows, then verifies the supplied secret with the encoder. Successful authentication updates last-used time. The source parser checks nonblank parts but does not enforce all generated lengths/character classes. Strict input-size/syntax bounds, rate limiting and safe failure diagnostics are additional consumer hardening, not claims about that source.

**Pseudocode recipe:** implement the parser, credential schema, migration, verifier, current scope policy, machine principal and filter-chain wiring. These are not starter imports.

```java
public MachinePrincipal authenticate(String rawKey) {
    var parts = keys.parseBounded(rawKey);
    var row = credentials.findBySelector(parts.selector()).orElseThrow(InvalidKey::new);
    row.requireActiveAndUnexpired(clock.instant());
    if (!secrets.matches(parts.secret(), row.secretHash())) throw new InvalidKey();
    return authority.currentMachinePrincipal(row);
}
```

The peer filter creates a dedicated principal and external-API authority, sets credentials to null, invokes the chain and clears Security context in `finally`. That does not define your consumer's endpoint scopes or show the filter is wired into the starter. Choose which routes accept machine credentials, which actions they permit and how browser-session/CSRF behavior remains distinct.

## Rotate and revoke explicitly

LMS rotation revokes the old row and issues a new selector/secret under its transactional service path. Revocation records inactive state, timestamp and actor. A newly generated secret is not an update that leaves both credentials silently usable. Decide whether a controlled overlap period is needed; it is a separate policy, not demonstrated by that rotation.

Management authorization belongs to a protected owner: the peer controller is administrator-gated. A consumer still needs its own current-authority model, audit, issuance response cache policy and delivery/storage guidance. Never place the secret in URLs, analytics, exception messages or ordinary audit payloads.

## Failure and recovery

If the one-time response is lost, do not add a “reveal existing secret” endpoint. Revoke/rotate through the authorized workflow and communicate the replacement through the approved channel. A database leak of selector/hash should not directly reveal bearer material, but it still requires incident assessment; hashing does not eliminate compromise risk.

Expensive hash verification needs bounded request rates and input sizes. A valid key also does not grant arbitrary tenant access: the resulting principal must carry current allowed scope, and every protected operation must enforce it. Key type is not a substitute for resource authorization.

## Implementation checklist and acceptance

- Generate unpredictable secrets and enforce selector uniqueness in the deployed schema.
- Ordinary metadata/list DTOs expose neither plaintext nor hash.
- Missing/malformed, revoked, expired and incorrect-secret credentials fail safely.
- Rotation invalidates the old credential according to explicit overlap policy.
- Machine authentication has a deliberate route/authority boundary and clears request context.
- Issuance has current management authority, no-store/logging safeguards and a lost-response recovery path.
- Rate/input limits and tenant scope are implemented rather than inferred from BCrypt.

## Exact source references

- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/partner_api_key/PartnerApiKeyService.java` — generation, hash verification, lifecycle, rotation and parser limits.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/partner_api_key/PartnerApiKey.java` — selector uniqueness and stored verifier/state.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/partner_api_key/PartnerApiKeyDTO.java` and `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/partner_api_key/IssuedPartnerApiKeyDTO.java` — metadata versus one-time plaintext.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/partner_api_key/PartnerApiKeyAuthenticationFilter.java` — separate principal and context cleanup.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/partner_api_key/PartnerApiKeyController.java` — protected management owner.
