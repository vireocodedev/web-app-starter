# Verify the produced image under its runtime restrictions

Exercise the actual packaged artifact with disposable data and the same classes of restriction expected at deployment. A green development server or successful Docker build does not prove that the final image can start or serve its HTTP contract.

**Installed template pattern.** `infrastructure/release/smoke_images.py` owns artifact startup/probes and exact-resource cleanup. The Dockerfiles define image users, labels, entrypoints and healthchecks. The fixed host runtime performs a separate, stronger live-deployment identity check.

## Trigger, owner and contract

Use when changing Dockerfiles, runtime users, Nginx routes, backend startup, provisioning or release packaging. The application owner owns the behavior and image definition. The CI/release owner invokes the helper in the isolated worker. Persistent application data is never an input to these smoke checks.

The contract is task-unique resources, generated scratch credentials, bounded probes, restricted non-root containers and cleanup of only the resources this invocation attempted to create. Smoke success is artifact evidence; it does not certify business acceptance or authorize a deployment.

## Inspect only intended metadata

The helper requests allowlisted metadata fields instead of dumping complete image/container environments. Its image check rejects root/empty users and requires the expected OCI revision label. It does not independently enforce the exact frontend/backend UID or source-repository label in this helper. The fixed deployment runtime later checks exact configured users and both source/revision labels before verifying running image IDs.

This distinction prevents an evidence overclaim: a smoke result and a host acceptance receipt are complementary, not identical checks. The pair protocol separately validates component registry paths and immutable digest identity.

## Start with task-owned resources

Each invocation generates an unpredictable resource prefix and a temporary directory. Backend checks generate unrelated database and provisioning passwords, write protected scratch env files and start a digest-pinned PostgreSQL image on the task network. Database storage and writable runtime locations use bounded tmpfs; no production volume, credential or database network is used.

App containers use read-only root, dropped capabilities, no-new-privileges, memory/PID bounds and limited `/tmp`. Host HTTP access uses dynamically allocated loopback ports. These ports serve this invocation's probes rather than making a persistent service publicly reachable.

```text
produced images + expected revision
                |
   task network / scratch PostgreSQL / generated inputs
                |
     restricted application containers
                |
       bounded health + HTTP + state probes
                |
     exact-name reconciliation and cleanup
```

## Exercise the actual implemented probes

| Artifact                   | Evidence obtained by this helper                                                                                                                               |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend                   | Non-root/revision metadata, `/healthz`, built SPA at `/login`, unknown API 404, missing asset 404, container health.                                           |
| Backend                    | Fresh PostgreSQL startup, migrations/schema startup, health body `UP`, anonymous session 401, CSRF response with expected header name/token, container health. |
| Normal backend startup     | `app_user` remains empty even with provisioning inputs present.                                                                                                |
| Explicit provision command | Terminates successfully, matching repeat preserves the row, conflicting password exits unsuccessfully without altering it.                                     |
| Provision diagnostics      | Generated credentials do not appear in captured output.                                                                                                        |

The provisioner has no published application port. State checks use the scratch database and a row fingerprint; the guide does not display user data. The smoke helper does not perform a complete browser login/logout journey, compare every frontend cache header, prove all application tests ran or check production schema compatibility.

HTTP redirects are rejected rather than accepted as a substitute for the expected endpoint. Polling has a deadline and distinguishes expected status/body shapes from mere socket availability. Database startup failures can include bounded credential-redacted diagnostics; that is not permission to publish arbitrary application logs.

## Reconcile uncertain creation by exact ownership

Names are recorded before resource creation, and cleanup runs in `finally`. If a Docker response is lost after creation, cleanup inventories the exact intended name rather than assuming nothing exists. Containers are removed in reverse ownership order; the exact network is removed afterward. An inventory/removal failure is reported as cleanup needing inspection.

Broad prefix deletion, all-container removal or shared-daemon pruning is not equivalent cleanup. The helper must never touch local developer databases, deployed volumes or another concurrent task. Cleanup success also matters after an earlier probe fails.

## Failure and decision table

| Observation                                            | Decision                                                                           |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Build succeeds, restricted entrypoint fails            | Inspect image user/filesystem/temp and supported host behavior.                    |
| Unrelated executables also fail with no-new-privileges | Diagnose host runtime policy; do not silently weaken restrictions.                 |
| Backend health is up but session/CSRF contract differs | Artifact smoke fails; fix the API/startup boundary.                                |
| Matching provision repeat changes the row              | Provisioning idempotency contract is broken.                                       |
| Probe passes but cleanup inventory fails               | Preserve failure and inspect exact resources; do not report unconditional success. |
| Smoke passes, public environment is wrong              | Host deployment acceptance remains a separate required layer.                      |

## Acceptance and inspection

Retain expected source identity, actual artifact references, helper result and cleanup outcome. Inspect whether restrictions match the intended runtime and whether the supported host can execute them unchanged. State missing evidence honestly: status smoke is neither exhaustive regression testing nor business acceptance.

Operational invocations belong to `infrastructure/release/README.md`. Related articles explain each image contract and immutable promotion. This article contains no execute control and performs no container or database action.

## Source provenance

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/smoke_images.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/runtime.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/protocol.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/Dockerfile`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/Dockerfile`
