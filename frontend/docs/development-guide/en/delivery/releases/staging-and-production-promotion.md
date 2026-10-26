# Stage a verified pair and promote exactly what was accepted

Separate application builds, registry publication and host mutation into different authority phases. Production receives the same immutable pair accepted by staging, with both workflow evidence and a durable host receipt.

**Installed template pattern.** The owners are `.github/workflows/deploy-staging.yaml`, `.github/workflows/deploy-production.yaml` and the fixed release client/controller. This is manual paired monorepo delivery, not automatic deployment on a pull request and not independent frontend/backend promotion.

## Trigger, owner and contract

An authorized maintainer chooses a source branch through GitHub's native manual workflow selector. The workflow and host validate the exact selected SHA. The operator previously installed reviewed fixed code, protected configuration, certificate/key material and repository/actor/workflow identities. Template creation does not inherit those remote prerequisites.

The core contract has three parts: untrusted application build commands do not get package-write permission; publication happens in a fresh worker after independent artifact checks; production accepts only the exact source/pair already verified by staging. Uploading an image or request artifact is not successful deployment.

## Phase 1: build with read-only repository authority

Staging's `build` job checks that `git rev-parse HEAD` equals `GITHUB_SHA`, verifies infrastructure helpers and both applications, and builds frontend/backend candidates from that checkout. Its repository token remains read-only. Ordinary npm/Gradle branch code therefore does not share a worker with a registry-write token.

The job saves the two candidate images into an artifact named by the current workflow attempt. Current retention is one day. This artifact is a transport between isolated workers, not a published release or staging acceptance record.

Normal release verification includes meaningful test suites. Documenting that policy does not authorize test execution during a separate task whose user prohibited it; it means that task's local evidence must report the omission honestly rather than weakening release automation.

## Phase 2: verify and publish in a fresh worker

The `release` job starts in a different disposable worker that has not executed branch npm/Gradle code. It loads the candidate archive, confirms exact source identity and independently runs restricted image smoke verification. Only this job has `packages: write`.

It then invokes the reviewed publication helper with isolated Python, records immutable digests and checks private container-package visibility. The output `release-pair-<attempt>` is retained for thirty days under the current workflow policy. Retention settings are operational choices, not an unlimited release archive.

```text
build worker              fresh release worker       request worker
contents:read             contents:read              contents/actions:read
npm + Gradle + Docker --> packages:write          --> packages:read
candidate artifact        smoke + digest pair        deployments:write
                                                    encrypted request + wait
```

The privileged helpers run with `python3 -I -S` and explicitly load reviewed transport code. Repository-added sibling modules must not shadow standard-library imports. Source pins on the host bind both workflows and trusted helper bytes to independently reviewed versions.

## Phase 3: request mutation, then wait for host truth

A third worker downloads the exact pair and creates a deployment request. Its permissions are contents/actions/packages read plus deployment-status write; it cannot publish images. The client encrypts the pair, exact run/attempt and short-lived request-job token to the controller's public certificate. Only CMS ciphertext enters the one-day request artifact. The private key remains on the host.

The fixed host controller validates private repository identity, original and triggering actors, workflow ID/path, active manual run/attempt, trusted source hashes, exact Deployment payload and the actual running request job. It accepts no shell, Compose file, mount or host path from source-provided data.

The installed runtime pulls exact digests, preserves the separate database infrastructure, replaces the app pair under an environment lock and checks actual image IDs, container health and public routes/environment markers. The request job waits for the host's final Deployment status. A timeout is an instruction to inspect journals, not proof that nothing changed.

## Promote the accepted pair without a rebuild

These commands are illustrative and unexecuted. They require a separately authorized initialized project and real placeholder substitution:

```sh
gh workflow run deploy-staging.yaml --repo OWNER/REPOSITORY --ref SOURCE_BRANCH
gh workflow run deploy-production.yaml --repo OWNER/REPOSITORY \
  --ref SAME_SOURCE_BRANCH -f staging_run_id=SUCCESSFUL_STAGING_RUN_ID
```

The production selector must still point to the accepted SHA. If the branch moved, preserve/use a release branch at that exact commit. Do not edit the pair's source field to match a later branch tip.

The client selects `release-pair-<staging-attempt>` from a successful manual staging run with matching source. The host separately requires the expected staging workflow and a successful durable receipt for that exact staging run attempt and identical pair. An unrelated green workflow or fabricated pair artifact is insufficient.

Both environments use their own concurrency group with `cancel-in-progress: false`. Cancelling redundant CI is appropriate; cancelling an in-flight state mutation is not the same operation. Production has no build/publish phase and no component selector.

## Failure and decision table

| Observation                                                 | Meaning and next decision                                                          |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Package-write token is visible to application build scripts | Restore fresh-worker phase separation before release.                              |
| Images uploaded, request still waiting                      | Publication succeeded; host deployment is unresolved.                              |
| Selected branch moved                                       | Select a branch at the accepted SHA or create a new staging candidate.             |
| Staging workflow green but host receipt missing             | Promotion contract is incomplete; inspect provenance and host state.               |
| Trusted workflow/helper bytes changed                       | Request an explicit reviewed operator update; source pins intentionally reject it. |
| Final status lost after replacement                         | Reconcile actual host transaction and images before any retry.                     |

## Acceptance and inspection

Inspect permission blocks per job, not just global defaults. Confirm fresh worker independence, current-attempt artifact naming, exact pair equality and absence of a production rebuild. Check that source identity is preserved when selecting a release branch.

For an actual accepted release, retain workflow source/run/attempt, pair digests, successful staging receipt, final production host result and any independently required business acceptance. Builds and source review alone do not prove a live deployment. This page performs no workflow dispatch, registry write, host action or promotion.

## Source provenance

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:.github/workflows/deploy-staging.yaml`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:.github/workflows/deploy-production.yaml`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/client.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/controller.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/protocol.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md`
