# Give build, publication and deployment request different authority

Protect release credentials by separating executable application build work, registry publication and host mutation requests. Each phase hands over a bounded artifact and receives only the permissions needed for its own outcome.

**Installed template pattern.** The staging workflow, release client/protocol and protected host controller own this trust split. This article focuses on authority boundaries; **Staging and production promotion** explains the operator flow and exact accepted-pair selection.

## Trigger, owner and invariant

Use when a dependency install needs credentials, a release job is consolidated, artifact transport changes or someone proposes running deployment through the PR worker's shell. Application maintainers own build inputs. Release maintainers own trusted client/workflow code. The operator owns installed host code, source pins and protected configuration.

The invariant is that branch npm/Gradle build commands do not share a worker with registry-write authority, and runners never receive the host Docker socket, deployment SSH key or arbitrary host execution interface. Publication success, request creation and host acceptance remain distinct results.

## Draw the permission matrix first

| Phase          | Executes                                                  | Token authority in current workflow               | Output                                  |
| -------------- | --------------------------------------------------------- | ------------------------------------------------- | --------------------------------------- |
| Build          | Application verification and candidate Docker builds      | `contents: read`                                  | Candidate archive for this attempt      |
| Fresh release  | Restricted candidate smoke and trusted publication helper | `contents: read`, `packages: write`               | Validated immutable pair                |
| Request/wait   | Trusted encrypted handoff and status polling              | Contents/actions/packages read, deployments write | Encrypted request and final status      |
| Protected host | Fixed reviewed runtime only                               | Protected operator-controlled authority           | Verified live state and durable receipt |

This is not a claim that the fresh release worker executes no candidate code: smoke checks intentionally start the images inside restricted containers. It has not executed branch npm/Gradle scripts on its worker filesystem, and it does not mount registry credentials into candidate containers. The distinction is where untrusted code runs and which authority crosses that boundary.

## Freshness prevents build residue from becoming publication code

A build script can alter files or leave processes behind. Merely placing a publish step later in the same worker does not remove that influence. The installed workflow transports images through a current-attempt artifact, starts a fresh disposable release worker, independently smoke-verifies candidates and calls the reviewed publisher there.

The client gets registry authentication through its step input, writes temporary Docker login state and removes that directory afterward. The pair records immutable digests and verifies private package visibility. It does not accept a candidate-provided shell command as a publication instruction.

Trusted helpers use `python3 -I -S`, explicitly loading their reviewed transport. This blocks ambient checkout import search from silently substituting a branch-added module for a standard-library dependency. The host separately pins workflow/helper bytes, so changing the trusted release boundary requires a reviewed operator update rather than only a branch push.

## Request an operation, do not send host commands

The request phase validates the pair, creates a Deployment tied to source/environment/run/attempt and encrypts its short-lived job token plus ticket to the host public certificate. The artifact contains ciphertext; the private key stays protected on the host. Artifact download handling bounds size/membership, verifies digest and does not forward the GitHub Authorization header to signed storage URLs.

The controller validates the actual active manual workflow/attempt, private repository identity, allowed actors, expected workflow path/ID, exact Deployment payload, trusted source hashes and running request job. For production it additionally requires the successful staging workflow and matching durable host receipt for the identical pair.

```text
runner: fixed typed ticket -> encrypted artifact -> protected validator
                                                    |
                                        installed fixed runtime
                                                    |
                                 environment lock + exact digest pair
```

There is no artifact field for arbitrary Compose, shell, host path or mount. The installed runtime derives configuration from protected settings, not repository-provided infrastructure text. The request job waits for final host status while its short-lived token is alive; creating a request is not proof that mutation succeeded.

## Preserve boundaries during optimization

Reducing setup time is useful only if it preserves authority. Compatible read-only verification phases may be reviewed for consolidation. Build and publication cannot be merged merely because both call Docker. Candidate archives are not inherently trusted because an earlier job uploaded them; fresh independent verification is part of the handoff contract.

Normal PR CI remains read-only and cannot dispatch privileged host work implicitly. Workflow dispatch, deployment, host installation and merging each require their own task authorization. Reading this guide is not any of those actions.

## Failure and decision table

| Observation                                       | Decision                                                             |
| ------------------------------------------------- | -------------------------------------------------------------------- |
| Publishing follows npm install in the same worker | Restore fresh-worker separation before exposing package-write.       |
| Candidate container needs registry token mounted  | Redesign input flow; smoke must not inherit publication credentials. |
| New branch helper bypasses an installed pin       | Request independent review/operator update, not a disabled check.    |
| Artifact contains a shell/Compose instruction     | Reject it; the host accepts the fixed ticket contract only.          |
| Registry push succeeds but host rejects ticket    | Publication and deployment are separate; report each honestly.       |
| Wait times out after possible host replacement    | Reconcile exact journals/live state before retry.                    |

## Acceptance and inspection

Inspect permissions per job, fresh-worker boundaries, credentials passed only to trusted steps and no host execution authority in runners. Review artifact source/attempt binding, trusted code pins, ciphertext-only transport and final status waiting.

For live acceptance, require the controller receipt and actual image/public-state checks, not upload success. Operational procedures remain in `infrastructure/release/README.md`; this article changes no token, workflow, host or registry setting.

## Source provenance

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:.github/workflows/deploy-staging.yaml`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:.github/workflows/deploy-production.yaml`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/client.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/protocol.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/controller.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/runtime.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md`
