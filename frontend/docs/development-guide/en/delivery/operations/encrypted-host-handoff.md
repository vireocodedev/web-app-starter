# Send an encrypted ticket to fixed trusted host code

Allow a release runner to request a narrow deployment operation without handing it SSH credentials or the host Docker socket. The host independently authenticates the request and executes installed reviewed code rather than instructions from the artifact.

**Installed template pattern.** `infrastructure/release/client.py`, `protocol.py` and `controller.py` own the handoff. Protected installation and activation belong to `infrastructure/release/README.md` and `install.py`. This page describes the protocol; it does not grant or perform deployment authority.

## Trigger, owner and contract

Use when changing release transport, token handling, artifact downloads or controller validation. The release maintainer owns the reviewed workflow/client bytes. The operator owns installed code, source pins, private key, allowlisted identities and host configuration.

The invariant is that the artifact carries an encrypted typed ticket, never arbitrary host commands. A public certificate may be published to Actions. Its private key and permanent App credential stay on the protected host. The short-lived request-job token is usable only in the context that the controller validates.

## Start with identity, not a runner label

The request client validates the immutable image pair against the selected repository and SHA. It creates a GitHub Deployment for the exact source/environment with automatic merge disabled. Its payload binds run, attempt, pair and staging origin when promoting.

The encrypted ticket adds environment, Deployment ID and the request-job token. A conceptual field list is:

```text
run_id, run_attempt, environment, deployment_id,
pair, staging_run_id, token
```

That is a shape illustration, not a token-bearing sample. The actual decoder rejects unexpected fields and duplicate JSON keys. A familiar runner label or a green build does not authorize this ticket.

The client uses OpenSSL CMS with AES-256-GCM and RSA-OAEP/SHA-256 to encrypt to the installed public certificate. Only `request.cms` ciphertext is uploaded. The plaintext token must never enter logs, screenshots, chat, source control or a second unencrypted artifact.

## Validate transport before trusting content

The host's reader uses a repository-scoped Actions-read installation token to discover requests. This is separate from the request token later used for package pull and Deployment status. The controller does not expand the CI App's permissions to give PR jobs host access.

Artifact retrieval bounds the inventory, rejects absent/ambiguous/expired/oversized candidates, validates the compressed archive digest and requires the exact single expected member. The signed download URL must be HTTPS on the allowed storage-host suffix with no embedded user/password or unexpected port. GitHub Authorization is not forwarded to that storage URL.

These checks limit transport confusion and credential leakage. Decryption alone is not authorization: someone who knows a public certificate can create ciphertext. The decoded content still needs all independent run and repository checks.

## Authenticate the actual active request

| Validation layer | Contract                                                                               |
| ---------------- | -------------------------------------------------------------------------------------- |
| Run              | Active manual dispatch, fresh enough, expected source SHA and current attempt.         |
| Repository       | Exact protected numeric identity, private repository and expected head repository.     |
| Actor            | Both original and triggering actors are allowlisted.                                   |
| Workflow         | Expected ID/path and installed hashes of trusted workflow/helper bytes.                |
| Deployment       | Exact source/environment/payload and expected Actions creator.                         |
| Job              | Exactly one actual in-progress request job with the expected name.                     |
| Promotion        | Successful expected staging workflow plus durable host receipt for the identical pair. |

The source pins cover the trusted workflow, client, protocol, smoke helper and canonical App transport. A branch can change application code but cannot silently replace its privileged handoff implementation. Reviewed host updates are deliberately separate from application branch pushes.

## Execute fixed code and report host truth

After ticket identity/payload checks, the controller writes a protected request journal in `validating` state. It then validates trusted source hashes, the actual active request job and, for promotion, the staging workflow/host receipt. Only after those checks succeed does it write `started` and invoke the installed runtime. Journal existence alone therefore proves neither complete authorization nor runtime startup. The controller accepts no artifact-supplied shell, Compose, mount, executable path or host setting. The runtime derives services from protected configuration and locks the selected environment.

The client waits for the final GitHub Deployment result while its token is alive. A timeout can occur after real host mutation; reconcile journals and actual images before retrying. Production also checks accepted staging evidence rather than trusting publication alone.

## Failure and decision table

| Observation                                     | Decision                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------- |
| Ciphertext decrypts but actor is not allowed    | Reject; encryption is not authorization.                                  |
| Artifact name matches but digest/member differs | Reject the transport; do not extract arbitrary contents.                  |
| Source pins changed on a branch                 | Require reviewed operator update rather than weakening validation.        |
| Request job is no longer active                 | Reject stale authority and inspect whether any earlier mutation occurred. |
| Request artifact contains host instructions     | Reject; only the fixed ticket contract is supported.                      |
| Wait fails after possible deployment            | Reconcile actual state and durable evidence before another request.       |

## Acceptance and inspection

Inspect ciphertext-only artifacts, protected private key paths, distinct reader/request token authority and header isolation during signed downloads. Confirm actual run/attempt/job and repository identity are checked, not inferred from labels.

For a live acceptance claim, retain nonsecret source/run/attempt/pair evidence and the successful host result. Never retain plaintext tickets in public evidence. Operational setup stays in the release runbook; no request or host action is executed here.

## Source provenance

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/client.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/protocol.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/controller.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/install.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:.github/workflows/deploy-staging.yaml`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:.github/workflows/deploy-production.yaml`
