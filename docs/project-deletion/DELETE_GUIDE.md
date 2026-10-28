# Delete a consumer project

This workflow permanently deletes the selected consumer's **host and GitHub**
resources. It uses the existing initialization results as ownership evidence.
It preserves the workstation checkout, local notes and retrieved recovery copies.
The [compact guide](DELETE_GUIDE_COMPACT.md) runs exactly the same steps.

Run numbered commands from the reviewed canonical `web-app-starter` checkout on
the workstation. Update the operator's clean, root-controlled `CI_SOURCE`
checkout to the **same reviewed deletion implementation** first. The scripts use
strict host-key-checked SSH and call that existing code with typed JSON data.
They do not upload executable code, App keys, provider tokens or plaintext
configuration. All `--help` commands are inert.

Use Python 3.11+, authenticated `gh`, the initialization's verified SSH host key,
and the existing private DNS token file. The intended maintainer must still be an
organization owner and repository/package administrator. GitHub OAuth needs
`repo`, `read:packages`, `delete:packages` and `delete_repo`, plus access to shared
App installation inventory. If scopes are missing, refresh the intended account
explicitly with `gh auth refresh -h github.com -s delete_repo -s delete:packages`.
Never transfer an App private key or weaken organization policy to bypass access.

Do not edit snapshot identity or reset a journal after interruption. Repeat the
same step and plan hash: started operations first read back the exact resource.
An inaccessible/404 resource is not absence; accessible full organization/provider
inventory must prove absence. A same-name repository with a different numeric ID
is never adopted or deleted. Unknown resources and changed predecessors block.

## 1. Import the initialization results

### 1.1. Archive historical identity privately

Complete initialization step **19.2** first with validated deployment, HTTPS,
provisioning and retrieved-copy recovery evidence. Its strict `result.completion`
is required; a partial step 19.1 report is rejected. Changing archived progress
invalidates completion and requires deliberate reconciliation.

Run from the canonical starter checkout, pointing `--initialization-env` at the
consumer's protected input. `--env` is the destination **deletion** reference file.
Replace the initialization path with the real absolute path before copying.

```bash
python3 -B docs/project-deletion/scripts/1_1_import_initialization.py --initialization-env /absolute/consumer/.template-initialization/values.env --env "$HOME/.local/share/project-deletion/values.env"
```

The script creates a private `0700` directory and `0600` files, archives exact
`values.env`, `verification.json`, `progress.json` and `result.json` bytes and
hashes, and derives immutable repository ID/slug, host, hostnames, ports, workflow
IDs, source and App installation identity. Historical verification need not be
less than 24 hours old: deletion performs its own fresh live checks. The new
reference file contains only `STATE_DIRECTORY` and `INITIALIZATION_SNAPSHOT`;
identity is never duplicated as editable deletion values. Use a distinct private
directory per consumer. Nothing from these archives belongs in Git.

## 2. Inspect and review the exact deletion plan

### 2.1. Inventory and seal a plan

```bash
python3 -B docs/project-deletion/scripts/2_1_inspect_and_plan.py --env "$HOME/.local/share/project-deletion/values.env"
```

Inspect the printed protected `plan.json`. It records exact numeric repository
and package IDs, App selection, DNS RRsets, Docker IDs/labels/consumers, root-owned
path hashes, neighboring resources, host machine/key identity and canonical tool
source/implementation hashes. It explicitly selects host data purge. The command
prints the plan SHA-256 and all subsequent commands with the actual `--env` path.
Set this shell variable to the **printed** value:

```bash
export DELETION_PLAN_SHA256=PASTE_PRINTED_64_CHARACTER_SHA256
```

Review that the plan names only the intended consumer and that retained local
backups satisfy your decision. This procedure removes its databases and all
server-side dumps, passwords and CMS keys. Recovery after deletion depends on
retained local copies and GitHub/provider recovery policy, not this workflow.

A possible unmanifested task directory, source bundle, orphan SSH key, certificate,
Docker resource or changed predecessor stops planning. Do not use substring
matching as ownership. Create a protected JSON extra manifest only after reviewing
its exact creation/source evidence, and rerun step 2.1 with
`--extra-manifest /absolute/protected/extras.json` before any plan exists. Shape:

```json
{
  "schema_version": 1,
  "resources": [
    {
      "path": "/root/PROJECT_SLUG-task-specific-directory",
      "kind": "task-artifact",
      "evidence_sha256": "SHA256_OF_REVIEWED_CREATION_EVIDENCE",
      "fingerprint": null
    }
  ]
}
```

Replace the example values; `evidence_sha256` must contain 64 lowercase hex digits.
It references separately reviewed creation evidence; it is **not** automatic
machine proof of ownership. Review and retain a protected evidence packet mapping
each exact extra path to its creation/transfer receipt and original project ID.
A random valid digest or similar basename is never sufficient to adopt an asset.
The sealed plan binds each explicit entry to the immutable numeric project ID and
exact operator-observed path/inode/content metadata; the final receipt retains
its evidence reference.
Supported kinds are `task-artifact` (an exact project-scoped root child),
`orphan-ssh-key` (the exact recorded project read-only key/private or public file,
with its `SHA256:...` public fingerprint), and `dedicated-tls` (the exact
hostname-specific Caddy certificate directory, with null fingerprint). The key
must be unreferenced by SSH configuration. A TLS certificate must contain only
the one exact hostname; shared/wildcard certificates and ACME accounts remain.
The plan seals exact owner/inode/content metadata. Unknown assets remain blockers.

## 3. Stop project producers

### 3.1. Quiesce GitHub and operator resources

```bash
python3 -B docs/project-deletion/scripts/3_1_quiesce.py --env "$HOME/.local/share/project-deletion/values.env" --plan-sha256 "$DELETION_PLAN_SHA256"
```

Disable this repository's Actions and future backup timer admission. Cancel only
its ordinary CI runs; wait for active deployment runs to finish without cancelling
a possible database mutation. Acquire staging and production locks and reject
unresolved release, request, provisioning or restore intents **before** stopping
its deploy controller and backup service. While both idle environment locks remain
held, stop those services, acquire the controller lock and recheck durable state.
Seal runtime inventory after producers are idle. A paused/failed transaction must be reconciled before deleting it.
The shared CI controller continues serving other projects at this stage.

## 4. Purge project host resources

### 4.1. Remove exact containers, data, files and routes

```bash
python3 -B docs/project-deletion/scripts/4_1_remove_host_resources.py --env "$HOME/.local/share/project-deletion/values.env" --plan-sha256 "$DELETION_PLAN_SHA256"
```

Recheck exact container IDs, Compose project/service, image source, mounts and
network ownership. Remove application/database containers, project networks and
labeled persistent volumes only when no foreign consumers exist. Remove only
this project's GHCR image references with matching OCI provenance; shared images,
base images and all other containers are preserved. There is no global prune.

Remove the project Caddy site, validate the full configuration and reload Caddy.
Remove the three exact project units and enablement links, then daemon-reload.
Purge its settings, private credentials/CMS key, installed code, state, snapshots,
server backups, source checkout, initialization/recovery directories, registration
file and explicitly reviewed extras. TLS storage requires the dedicated ownership
checks above. Symlinks, foreign writable/owned paths, unexpected mounts and changed
resources stop before removal. Interrupted directory removal accepts only a
subset of the original recorded inodes and never a replacement or new file.

## 5. Deregister from shared CI

### 5.1. Remove only this consumer and revalidate the shared pool

```bash
python3 -B docs/project-deletion/scripts/5_1_unregister_ci.py --env "$HOME/.local/share/project-deletion/values.env" --plan-sha256 "$DELETION_PLAN_SHA256"
```

The script closes admission through the reviewed dispatcher barrier, waits for
busy workers to finish and stops/disables only the verified idle parent after
durably invalidating admission receipts. A frozen recovery outcome preserves its
private journal and requires reconciliation before retry. The original activation
intent is retained across interruption.
Invoke canonical `manage.py unregister` under its lifecycle lock with the exact
observed configuration hash and a protected resume journal. Preserve every other
project and setting. For a nonempty pool, run full installed validation to create
fresh receipts and reactivate only when the controller was previously enabled.
Full pool validation can take several minutes; do not interrupt it merely because
no progress is printed. If the final consumer is removed, leave the empty pool
controller disabled. A failed validation remains incomplete and must be resumed.

## 6. Remove DNS, package and App access

### 6.1. Delete only recorded provider resources

```bash
python3 -B docs/project-deletion/scripts/6_1_remove_provider_resources.py --env "$HOME/.local/share/project-deletion/values.env" --plan-sha256 "$DELETION_PLAN_SHA256"
```

Require successful host/CI absence receipts first. Delete only the two recorded
A RRsets with the expected operator IP; preserve the shared zone and all other
RRsets. Verify provider and authoritative absence. Delete the exact two private
GHCR package IDs linked to this repository, including their versions. Complete
accessible organization inventory proves package absence. Remove only this
repository's numeric ID from the shared App's selected repositories and read
back every preserved selection. Never uninstall the shared App. Removing its
last selected repository is a blocking policy decision, not an inferred approval.

## 7. Delete the GitHub repository last

### 7.1. Recheck immutable repository identity and delete

```bash
python3 -B docs/project-deletion/scripts/7_1_delete_repository.py --env "$HOME/.local/share/project-deletion/values.env" --plan-sha256 "$DELETION_PLAN_SHA256"
```

Require all previous receipts and repeat current host/provider checks. Confirm the
same full name, organization, private state, administrator authority and original
numeric repository ID. Persist deletion intent before DELETE. If the response is
lost, resume by accessible organization inventory; never re-create the repository,
blindly repeat against a reused name or treat an isolated 404 as proof.

## 8. Verify and remove the host deletion context

### 8.1. Record final cross-scope absence locally

```bash
python3 -B docs/project-deletion/scripts/8_1_verify_deletion.py --env "$HOME/.local/share/project-deletion/values.env" --plan-sha256 "$DELETION_PLAN_SHA256"
```

Reinventory host paths, Docker resources, four loopback ports, DNS, packages,
repository, App selection and CI registration. Check preserved neighboring
containers, repositories, shared settings and required controller health. Save
`final-receipt.json` privately on the workstation, retaining exact plan and host
identity. Do not declare completion while this step reports a blocker.

### 8.2. Remove the remaining protected host context

```bash
python3 -B docs/project-deletion/scripts/8_2_remove_host_context.py --env "$HOME/.local/share/project-deletion/values.env" --plan-sha256 "$DELETION_PLAN_SHA256"
```

Recheck absence, remove only `/root/PROJECT_SLUG-deletion`, verify that directory
is gone and mark its cleanup in the local final receipt. A lost response is safe
to reconcile by rerunning the same command. Retain local receipts and recovery
archives; local removal is a separate scope decision.

The receipt reports active-resource removal, not deletion of shared host/GitHub
logs, provider audit or retention records, physical media erasure, or copies held
by other people. Those limits must remain visible in the final handoff.

API owners: [GitHub repositories](https://docs.github.com/en/rest/repos/repos#delete-a-repository),
[packages](https://docs.github.com/en/rest/packages/packages#delete-a-package-for-an-organization),
[App repository selection](https://docs.github.com/en/rest/apps/installations#remove-a-repository-from-an-app-installation),
and [Hetzner DNS RRsets](https://docs.hetzner.cloud/reference/cloud#zone-rr-sets-delete-an-rrset).
Initialization ownership remains in [INIT_GUIDE.md](../template-initialization/INIT_GUIDE.md);
shared CI in [its operator guide](../../infrastructure/ci/README.md), runtime
identity in [the release runbook](../../infrastructure/release/README.md).
