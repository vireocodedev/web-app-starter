# Shared Hetzner CI foundation

This repository owns the permanent runner foundation. One host controller
serves explicitly registered private application repositories using a bounded pool
of independently isolated worker slots and
`[self-hosted, Linux, X64, web-app-ci]`. Every job gets a fresh repository-scoped
GitHub runner, filesystem, network namespace, and rootless Docker daemon.
Registration and installation are operator tasks, not steps to repeat from
every consumer's copy of this directory.

**Pool change status:** source implementation has passed independent review;
current-source disposable-host fresh-install/migration/rollback validation and
production canary acceptance remain pending. Earlier receipts below certify only their exact
recorded sources and configuration; they do not certify the new worker pool.

**Previous serial-host status:** the selected template host was rebuilt and this source passed
273 actual current-source isolation probes, including a second fresh job and
complete cleanup. See [host acceptance](verification/host-acceptance.json) for
source/configuration/boot-bound evidence. The App and private template repository are registered, and the controller is
active for controlled acceptance. Genuine template PR/main jobs and path-aware
gate/protection acceptance passed; see [CI acceptance](../../docs/acceptance/ci-acceptance.json).
The reviewed HTTPS memory repair subsequently passed fresh installation and
actual predecessor-to-repair validation on a disposable host, full current live
validation, the original polling replay and genuine post-repair jobs. See
[current controller acceptance](../../docs/acceptance/controller-memory-acceptance.json).
Cross-repository shared-pool acceptance is still pending. This evidence describes the
template host, not automatic readiness for a consumer or a different boot.

The isolation machinery was extracted from the experimental
`vireocodedev/web-app-infrastructure` source at commit
`4c4366f445cf34647f27d865b9fff6d45f83e85c`. Registration now accepts one repository
per project. The old separate frontend/backend registration, generator,
deployment adapters, and release metadata are not part of this implementation.
Historical acceptance does not certify this modified source.

## Interface and ownership

The public lifecycle interface is [manage.py](manage.py): `inspect`, `install`,
`prepare-app-auth`, `register`, `recover-registration`, and an explicitly
unsupported general `upgrade`, plus the versioned `migrate-pool` and
`rollback-pool` operations described below. The narrow `repair-https-memory` operation below
updates only the reviewed HTTP client/controller modules; it is not a general
upgrade or an activation command.
The [ci-runner/](ci-runner/) implementation stays behind that interface. Jobs
cannot supply root commands, source paths, or repository allowlists to it.

- **Operator:** owns the reviewed installation, protected configuration,
  GitHub controller credential, repository registration, and validation.
- **Application maintainer:** selects the shared runner label and uses
  application-owned verification commands from the monorepo.
- **Consumer:** supplies its actual `owner/repository` and asks the operator
  for access. It does not provision another permanent runner for itself.

The fixed label is routing, not authorization. The protected repository map and
repository-scoped JIT registration provide the access restriction. The
controller currently uses GitHub's default runner group (ID `1`); custom
organization runner groups are not configurable in this version.

## Source verification

From the workspace root:

```sh
python3 -B -m unittest discover -s infrastructure/ci/tests -p 'test_*.py' -v
bash -n infrastructure/ci/ci-runner/install.sh
bash -n infrastructure/ci/ci-runner/start-job.sh
```

Tests use temporary files and mocked system/GitHub operations; they never
install packages, alter services, or contact GitHub. Privileged lifecycle,
isolation, or credential-handling changes require independent review and
source-bound disposable-host validation before activation.

## Bounded HTTPS memory and controlled repair

The controller polls continuously. Creating a new verified TLS context for every
request loads another native certificate trust store. HTTP reference cycles can
retain those allocations until garbage collection, even when Python's live heap
is small. The isolated real polling reproduction exceeded 64 MiB RSS growth
after 52 polls; shared verified context reuse held 80 polls near 34 MiB RSS.
Forced garbage collection was diagnostic only, not the production fix.
The actual installed fix passed 80 polls at 33 MiB peak with 2.6 MiB RSS growth.
After genuine backend/frontend/foundation jobs, controller RSS remained about
37 MiB with zero OOM events or restarts and the same 512 MiB service limit.
Worker preparation can charge reclaimable filesystem cache up to that cgroup
limit; distinguish `memory.stat`/OOM counters from process RSS when monitoring.

The shared App module owns a lazily cached default TLS context, with certificate
and hostname verification and HTTP/1.1 ALPN preserved. Each request still gets a
new opener/handlers and explicit credential headers: no token, redirect state,
or response is cached. CI discovery, App renewal, registration probes and the
deployment transport reuse this implementation. Do not raise memory limits,
disable verification, add periodic forced GC or schedule restarts to hide growth.
After deliberate CA/trust-store configuration changes, restart the reviewed
controllers under their normal idle/validation safeguards to reload trust.

For an existing compatible installation, after independent review and fresh
disposable-host validation of the exact candidate commit:

1. Drain genuine CI jobs. Stop and disable the CI controller and verify its user
   manager, processes, mounts, namespace and job state are idle. Keep application
   and deployment services running; this repair does not alter their workloads.
2. Record the exact protected configuration SHA-256 and installed
   `controller.py`/`github_app.py` SHA-256 values. Transfer a clean root-controlled
   checkout of the reviewed commit. Do not introduce new credentials.
3. Run its operator interface:

   ```sh
   python3 -B infrastructure/ci/manage.py repair-https-memory \
     --expected-config-sha256 ACTUAL_CONFIG_SHA256 \
     --expected-controller-sha256 ACTUAL_OLD_CONTROLLER_SHA256 \
     --expected-github-app-sha256 ACTUAL_OLD_APP_MODULE_SHA256
   ```

   It requires the stopped/disabled/idle lifecycle lock, no pending registration
   proof, unchanged configuration, exact expected old module hashes, safe
   root-controlled destinations, and byte-identical unchanged validation/job/
   service sources. It invalidates the old receipt before replacing the two
   files and fsyncs each replacement. It changes no config, key, unit, resource
   limit or network policy and never enables the controller.
4. Run full installed-source `controller.py validate` and inspect its fresh
   current-boot/configuration/source receipt before an explicit activation.
   Repeat the original read-only memory replay and genuine jobs afterwards.
   An interrupted repair leaves the receipt invalid and controller disabled;
   inspect exact file hashes before any recovery rather than blindly rerun.

The deployment controller and isolated workflow client use the same transport.
Its operator must separately stop/confirm idle, verify its installed receipt,
apply the exact reviewed source, and refresh its workflow/helper source pins.
The canonical source `infrastructure/ci/ci-runner/github_app.py` is now an
explicit pinned dependency; an unpinned file beside a checkout helper cannot
replace it. Old handoff-helper revisions are not silently accepted after the
pin update. Existing running application images/databases are not redeployed.

## Bounded concurrent worker pool

One root scheduler retains the controller lock and repository allowlist. Before
forking a worker or requesting a JIT registration it fsyncs a nonsecret slot/job
reservation in `pool.json`. Each worker retains the existing durable unique-name
JIT registration intent and exact inventory-based deletion/recovery. A failed
worker with an unexpected local boundary/cleanup failure stops further admission,
terminates peers and cleans all boundaries. A different, typed outcome applies
when local teardown succeeds but GitHub inventory/deletion cannot prove remote
runner absence (for example429/503): quarantine only that slot, suspend all new
admission, and let already healthy jobs drain naturally. Exit with the quarantined
slot reservation and exact registration intent retained. Never reuse the slot or
clear either ledger until accessible remote inventory proves absence during
startup recovery. A local teardown failure can never claim this remote-only
quarantine outcome.
Discovery takes one shared snapshot for all free slots. Polling starts at a
15-second minimum, backs off to 120 seconds on empty snapshots and to 300
seconds on API/rate-limit failures. Worker monitoring/reaping continues every
second independently; discovery failures pause admission without cancelling
healthy jobs. Before each fork, reserve current available memory/disk against
the remaining growth of every live or still-preparing worker. An expected child
resource recheck deferral releases only that admission after successful cleanup;
unexpected boundary/cleanup failures remain fail-closed.

After an unclean shutdown the scheduler cleans every slot before checking fresh
validation receipts or admitting more work. An unresolved registration remains
fail-closed; never delete its state to bypass reconciliation.

The generic runner labels do not bind a JIT runner to the particular queued job
observed by the poller. The observed job is an admission reservation, not an
assertion about the job GitHub ultimately assigns. GitHub may assign another
eligible job in that same allowlisted repository. Durable reservations avoid
repeated admission of the same observation; configured slot ceilings remain the
hard concurrency limit. A slot is not released until its runner service exits
and cleanup succeeds.

Each slot has its own UID, disjoint 65,536-ID subordinate range, rootfs copy,
job image/home, user runtime/bus/socket, namespace/veth/subnet/firewall names,
witness mounts and recovery state. Slot 0 retains legacy paths and identity;
additional slots live under `/var/lib/web-app-ci/slots/N`. No writable dependency
cache or Docker state is shared. Only trusted root-owned baseline files are
copied during provisioning. Workflows may use GitHub's scoped cache service;
untrusted job files never become a shared privileged baseline.

Pooled managers live under root-owned `webappci.slice`, each in its own immutable
`webappci-workerN.slice`. Both the parent and children enforce CPU, memory, swap
and task ceilings; namespace-entry helpers join the same worker cgroup. The
controller has its separate existing 512 MiB/25% ceiling. Application services
and their existing slices are not moved or modified.

Use [config.pool.example.json](ci-runner/config.pool.example.json) as a candidate,
not a promise of throughput. Its six slots each have 2 CPU equivalents and 3 GiB
maximum RAM; the aggregate ceiling is 12 CPU equivalents and 22 GiB, with an
8 GiB host reserve. This fits the upgraded host's actual 31,326 MiB total memory;
using nominal 32 GiB to allocate 24 GiB + 8 GiB would not. Provision/validate all six boundaries, then run the manual
[worker acceptance workflow](../../.github/workflows/ci-worker-acceptance.yml)
with its default four-job cohort before selecting its six-job cohort. Decide the accepted final slot
count from measured complete-pipeline latency, application health, CPU
throttling, reclaim/OOM counters and concurrent-PR contention.

Configuration validates the complete aggregate arithmetic before privileged
changes. `pool_capacity` also checks actual host memory/CPU, and each admission
requires current memory/disk headroom. Do not increase slots without checking
UID/range/route/unit conflicts and rerunning source/config/boot-bound validation.
No API accepts arbitrary root commands or writable cache locations.

### Versioned serial predecessor migration and rollback

The only supported predecessor is controller SHA-256
`bef4b3169896c259c5bcf841a2a51755d14a7160fb51ee98e5916eb14195492f`,
with user-side validation probe SHA-256
`afce2ec9cde27440259a07fdf0fd97edd5bb11ef07fb741ab33b9e826dd4e44e`.
A general upgrade remains unsupported. This operation changes pool capacity,
resource settings and the PostgreSQL readiness probe; it must preserve projects, identity roots, host IP deny
list, storage/task/timeout bounds, GitHub App files and existing deployments.

The probe waits for PostgreSQL's final TCP listener. Its temporary initialization
server can accept Unix-socket readiness checks and then stop before the existing
SQL query runs. Migration backs up the exact predecessor probe, invalidates
receipts, and atomically installs the reviewed probe before cloning workers.
Every clone must match that source. Rollback verifies and restores the original
probe alongside the original controller and configuration; unknown later probe
revisions cannot be overwritten by rollback.

After independent review and disposable-host proof of the exact candidate:

1. Drain CI, stop **and disable** the controller. Keep application/deployment
   services running. Require no slot managers, owned/subordinate processes,
   job/witness mounts, namespace/image, registration proof or reservations.
2. Refresh predecessor validation on the current boot if necessary. Record the
   exact config/controller hashes and keep the reviewed candidate checkout
   root-owned with protected ancestors. Copy the protected configuration to a
   root-only candidate file and change capacity fields only. Provision and validate all six
   slots; retain all existing project registrations. The first controlled
   acceptance cohort queues four jobs, followed by six after canary success.
3. Run from the protected candidate checkout:

   ```sh
   python3 -B infrastructure/ci/manage.py migrate-pool \
     --config /root/reviewed-pool-config.json \
     --expected-config-sha256 ACTUAL_CURRENT_CONFIG_SHA256 \
     --expected-controller-sha256 bef4b3169896c259c5bcf841a2a51755d14a7160fb51ee98e5916eb14195492f
   ```

   The operation checks the predecessor's full receipt, exact source and idle
   state, all new identity/path conflicts and host capacity. Root-only fsynced
   backups and a versioned phase ledger are published together atomically as
   `migration-v1` before operational mutation. A crash before publication leaves
   only an unreferenced private staging directory and preserves the predecessor
   configuration/receipt; a crash after publication always has complete backups
   and an explicit rollback ledger. The old receipt
   is invalidated before mutation; the protected config commits only after
   slot provisioning. It never activates CI. An interrupted migration is not a
   fresh-install/retry opportunity: inspect its ledger and use explicit rollback.
4. Run installed `controller.py validate`. Every slot must pass all existing
   toolchain/rootless-Docker/Testcontainers/boundary/fresh-second-job probes.
   Pool validation then prepares all slots simultaneously, verifies actual
   parent/child limits, uses positive peer controls for hostile cross-slot
   filesystem/process/network/Docker probes, and destroys one slot while peers
   remain healthy. Inspect every slot receipt and `pool-validation.json`.
5. Explicitly enable/start only after all evidence is accepted. Dispatch the
   fixed-command worker acceptance workflow with `slots=4`, inspect its
   artifacts and actual overlap, then repeat with `slots=6`. It accepts no
   commands, repository names or credentials as inputs. Run genuine
   selected and all-scope CI, cancellation/restart/cleanup and concurrent-PR
   cases. Record cold/warm end-to-end times, complete shard coverage, actual
   job overlap and application reserve. Do not replace required checks with
   nightly-only verification to meet the latency target.

Rollback also requires the stopped/disabled/fully idle lock and exact current
config hash. It verifies the protected ledger/backups and rejects unknown later
controller revisions, removes only derived extra slot identities/baselines/
units, restores the exact predecessor config/source/units, and invalidates all
receipts. It never touches host application data or credentials or reactivates CI:

```sh
python3 -B infrastructure/ci/manage.py rollback-pool \
  --expected-config-sha256 ACTUAL_CURRENT_CONFIG_SHA256
```

Run the restored predecessor's full validation before activation. Preserve the
migration ledger/backups for audit; reusing a completed migration ledger is
intentionally rejected. Further capacity changes need a separately reviewed
migration rather than editing a validated config while the controller runs.

### Acceptance evidence to retain

The operator's private receipt should bind candidate commit/source hashes,
predecessor hashes, protected config hash and boot ID to: fresh install;
predecessor migration; at least two simultaneous slots; every hostile denial
with a positive control; one-slot cleanup with live peers; interrupted intent
recovery; rollback and predecessor revalidation; genuine CI test inventory and
cold/warm timing; application health and measured aggregate resource limits.
Public evidence must contain no credentials, JIT payloads, job output or
application data. Pending evidence must be labelled pending; earlier serial
receipts cannot certify the pool.

## Fresh-host prerequisites

Rebuilding a server or removing old repositories requires a separate, explicit
approval naming the resources and retention/recovery decision. These instructions
are not a teardown authorization.
For the provider API credential and server/SSH identity preflight, use
[the provider-access handoff](../../docs/hetzner-provider-access.md).

The initial host supports Ubuntu 26.04 amd64 with systemd 259+, cgroup v2,
AppArmor, unprivileged user namespaces, and `/dev/net/tun`. Installation requires
at least 7,500 MiB total memory and 25 GiB free disk, plus the configured
worker/host reserve. The default worker is bounded to 3 GiB memory, 1 GiB swap,
four CPU equivalents, 1,024 tasks, 12 GiB job storage, and a one-hour job lifetime.
Omitting pool configuration preserves one-slot compatibility. Pool configurations
require explicit aggregate CPU and memory ceilings plus a host reserve;
application capacity is additional.

Inspect and prepare the host's routing/firewall deliberately. IPv4 forwarding
must already be `1`; the installer checks it and never enables it. Install the
prerequisite tools through signed Ubuntu repositories: debootstrap, nftables,
iproute2, iptables, AppArmor tools, Python, curl, GnuPG, mount/util-linux,
e2fsprogs, and capability tools. The full boundary validation needs a positive
host HTTPS listener as well as internet access for toolchain/image probes.
Plan that listener before installation; do not disable network-denial tests to
work around its absence.
The current bootstrap uses Caddy's internal TLS for `ci-bootstrap.internal`,
with the real HTTPS listener bound on port `443`. Verify it locally using its
generated CA and `--resolve`; no public DNS record is needed for this temporary
validation endpoint. This does not establish public HTTPS for staging or
production. Keep application sites in `/etc/caddy/sites/` and import them from
the root Caddy configuration when deployment routing is implemented.

The installer creates its own private Docker installation. It does not prepare
the host Docker/Caddy deployment stack. PR jobs must not receive the host Docker
socket, SSH keys, deployment credentials, or production filesystem/network
access.

Use an exact reviewed, committed source revision under a root-owned checkout
with protected ancestors, for example `/root/web-app-starter`. Record its commit
and installed file hashes outside the public repository. Configurations and
credentials are root-owned, regular mode `0600` files beneath root-owned
directories without group/other write access.

## Install once, without activating

As the operator, prepare `/root/foundation-config.json` from
[config.example.json](ci-runner/config.example.json). Set the actual public host
IPv4 addresses (including all addresses that jobs must not reach), inspect
UID/GID/subordinate-ID conflicts and capacity, and keep `projects` empty.
Keep the server-specific file outside source control.

From the protected source checkout:

```sh
python3 -B infrastructure/ci/manage.py inspect
python3 -B infrastructure/ci/manage.py install --config /root/foundation-config.json
python3 -B /usr/local/lib/web-app-ci/controller.py validate
```

Installation refuses existing owned paths, accounts, subordinate ranges, and
systemd configuration, and leaves the controller inactive. Inspect an interrupted
installation before recovery; rerunning the fresh installer or deleting its
state is not an upgrade/recovery procedure.

Validation must exercise actual toolchains, rootless Docker and PostgreSQL/Ryuk,
filesystem/proc/sys/device denials, resource limits, namespace/cgroup behavior,
abandoned-child cleanup, and a second fresh job. Its root-only receipt must match
the current configuration, installed isolation sources, and current boot.

## Register a private monorepo

Use the organization-owned App described in
[GitHub CI App setup](../../docs/github-ci-app.md). It needs only repository
**Actions: read**, **Administration: write**, and automatic Metadata read,
installed for selected private repositories. Its RSA key is stored at
`/etc/web-app-ci/github-app.pem`, root-owned mode `0600`, and public IDs/owner
at `/etc/web-app-ci/github-app.json`. The controller mints per-repository tokens
with automatic renewal; it verifies installation ownership/permissions/selection.
Neither the key nor its tokens are supplied to jobs. Extend installation access
before registering a consumer; registry publishing/deployment permissions stay
separate. Introduce the key only after current-source credential-free validation.

Prepare a root-owned mode `0600` `/root/project-registration.json`:

```json
{
  "slug": "web-app-starter",
  "repository": "vireocodedev/web-app-starter"
}
```

For a consumer, replace both values with its approved slug and exact repository.
The installed configuration then contains, for example:

```json
{
  "projects": {
    "web-app-starter": {
      "repository": "vireocodedev/web-app-starter"
    }
  }
}
```

This is a configuration excerpt, not a replacement for the complete host
configuration. Repository duplicates are rejected case-insensitively, including
under different slugs; unknown input fields and the old split-repository shape
are rejected.

At an idle maintenance point, stop and disable the controller. Confirm the worker
manager is stopped and no job processes, boundary mounts, or nonempty job state
remain. `inspect` reports the current `configuration_sha256`; supply that exact
digest, replacing `CURRENT_CONFIG_SHA256` below:

```sh
systemctl disable --now web-app-ci-controller.service
python3 -B infrastructure/ci/manage.py inspect
python3 -B infrastructure/ci/manage.py register \
  --project /root/project-registration.json \
  --expected-config-sha256 CURRENT_CONFIG_SHA256
python3 -B /usr/local/lib/web-app-ci/controller.py validate
```

Registration shares the controller lock and proves private repository identity
and actual JIT permissions by creating and deleting one proof registration. It
never starts that runner or retains its JIT credential. Failure leaves the
configuration unchanged; uncertain creation/deletion keeps a protected recovery
ledger and blocks a fresh registration attempt.
Cleanup confirms absence through a successful repository runner inventory;
an inaccessible private repository returning `404` is not proof of deletion.

For that interrupted proof only, inspect the ledger and use
`manage.py recover-registration --expected-config-sha256 CURRENT_CONFIG_SHA256`
under the same stopped/disabled/idle guards. Recovery reconciles the exact
registered name and ID; it is not permission to delete unrelated GitHub runners.

A successful registration preserves the other projects, invalidates the previous
receipt, and still leaves the controller disabled. Repeat full validation before
an explicitly approved activation:

```sh
systemctl enable --now web-app-ci-controller.service
```

After a reboot or configuration/isolation-source change, stop and disable the
controller and establish a fresh full receipt before activation. `upgrade`
currently performs no mutation and exits `2`; use a separately reviewed migration
instead of editing a live installation in place.

## Interrupted-job recovery

Before creating a normal job's JIT runner, the controller durably records a
unique nonsecret name and pending creation intent. It records the returned ID
before starting job code. A lost response or interrupted controller therefore
retains enough evidence to reconcile the exact registration by name.
An explicit rejected JIT POST clears that intent because it created no runner;
transport failures and uncertain server responses retain it. Rejected jobs still
fail and clean their local worker before any later attempt.

On authenticated controller startup, stale worker processes/mounts are stopped
and the owned registration is reconciled **before** the mount-sensitive receipt
digest is checked. Successful cleanup does not authorize new jobs: their
admission still requires a valid current-boot/configuration/source receipt.

Both proof-registration and job cleanup require an accessible, complete runner
inventory to confirm absence. Revoked repository access, a surviving mismatched
runner, or an unresolved creation outcome preserves recovery state and blocks
another JIT creation. Restore the intended protected access and inspect fixed-code
diagnostics. If the creation outcome remains ambiguous, leave the controller
disabled and approve a specific recovery plan; deleting its state to retry is
not a supported recovery operation.
Inventory pagination rejects changed totals or duplicate IDs rather than using
a drifting result to discard recovery evidence.

## Application toolchains and workflow contract

The immutable isolated baseline currently pins Node 24.18.1, npm 12.0.2, and
JDK 25.0.4.1. These are worker validation pins, not a mandate to change the
application's Java toolchain. This starter remains Java 21.

Select Java 21 inside each backend job using a reviewed, SHA-pinned
`actions/setup-java` step, with its `RUNNER_TOOL_CACHE` pointing inside the
disposable job workspace (for example `${{ runner.temp }}/toolcache`). Set
`JAVA_HOME` and `PATH` for that job only. Do not request writes to `/opt/jdk` or
the deployment host's Java installation. Genuine runner execution must verify
the download, cache location, and Gradle toolchain before this is accepted as
working; that workflow is the next implementation step.

PR jobs use read-only repository token permissions and do not receive deployment
or registry-write credentials. Use ordinary `pull_request`, not privileged
`pull_request_target`, and checkout without retained Git credentials. Main-branch
push and later manual deployment verification may use this CI pool, but any
privileged deployment execution must use a separate, approved mechanism.

The [root CI workflow](../../.github/workflows/ci.yml) runs the backend from
`backend/` and frontend from `frontend/`, selects affected paths, and always
reports `CI gate`. See [CI/protection setup](../../docs/github-ci.md) for
consumer activation and branch policy. The inactive nested frontend workflow
was removed to keep one authoritative monorepo configuration.

## Host acceptance still required

Before declaring this pool ready:

1. Observe a fresh install and all current-boot isolation probes on the approved
   clean host using this exact committed source.
2. Register and execute genuine workflows from two distinct authorized private
   repositories. One must exercise this starter's Java 21 Gradle/PostgreSQL tests
   and Node/npm frontend checks.
3. Verify configured concurrent execution and that each subsequent job has fresh storage,
   processes, namespaces, and Docker state.
4. Verify task-owned registrations/resources are removed after success,
   failure/cancellation, and an interrupted job, with no surviving controller
   credential in job-visible files or logs.

A runner inventory may be empty while the ephemeral pool is idle. A configured
label or a unit-test pass is not proof that a GitHub job can run. Record actual
run URLs, source commits, fixed-code diagnostics, and cleanup results without
secrets. Pending host acceptance blocks activation for normal consumer use.
