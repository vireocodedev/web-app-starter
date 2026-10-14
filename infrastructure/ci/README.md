# Shared Hetzner CI foundation

This repository owns the permanent runner foundation. One host controller
serves explicitly registered private application repositories, serially, using
`[self-hosted, Linux, X64, web-app-ci]`. Every job gets a fresh repository-scoped
GitHub runner, filesystem, network namespace, and rootless Docker daemon.
Registration and installation are operator tasks, not steps to repeat from
every consumer's copy of this directory.

**Status:** the selected template host was rebuilt and this source passed
273 actual current-source isolation probes, including a second fresh job and
complete cleanup. See [host acceptance](verification/host-acceptance.json) for
source/configuration/boot-bound evidence. The App and private template repository are registered, and the controller is
active for controlled acceptance. Genuine template PR/main jobs and path-aware
gate/protection acceptance passed; see [CI acceptance](../../docs/ci-acceptance.json).
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
unsupported general `upgrade`.
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
Only one worker runs at a time; application capacity is additional.

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
3. Verify serial execution and that each subsequent job has fresh storage,
   processes, namespaces, and Docker state.
4. Verify task-owned registrations/resources are removed after success,
   failure/cancellation, and an interrupted job, with no surviving controller
   credential in job-visible files or logs.

A runner inventory may be empty while the ephemeral pool is idle. A configured
label or a unit-test pass is not proof that a GitHub job can run. Record actual
run URLs, source commits, fixed-code diagnostics, and cleanup results without
secrets. Pending host acceptance blocks activation for normal consumer use.
