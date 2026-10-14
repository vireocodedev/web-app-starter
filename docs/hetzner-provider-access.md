# Hetzner provider access

This is the provider-access handoff for a shared-host operator. A consumer using
an existing CI pool needs repository registration, not a Hetzner API token.

## Current bootstrap target

The read-only inspection of the selected host established:

- Hetzner Cloud server ID: `144310066`.
- Public IPv4 / SSH target: `46.224.72.162` / `root@46.224.72.162`.
- Current OS: Ubuntu 26.04 amd64.
- The loaded local RSA identity matches a root-authorized key on that host.

The approved rebuild completed using Ubuntu 26.04 image `387894169` and action
`661493689671202`. All seven existing provider backups and the plan/IP were
retained; no additional snapshot or other resource deletion was performed.
[Credential-free foundation acceptance](../infrastructure/ci/verification/host-acceptance.json)
records the resulting host/source evidence.

These are this template's current bootstrap values, not defaults for a consumer.
For a different host, obtain its exact Cloud server ID, address, desired image,
and SSH recovery method and verify that they agree before any write operation.
The current host is experimental and a clean rebuild has been selected. A
rebuild replaces the root disk and interrupts every application there. Retention,
attached volumes, snapshots, and the exact rebuild action must be resolved
before execution; this access handoff does not itself rebuild anything.

## Create or supply a protected API credential

SSH is sufficient to inspect a host but does not authorize Hetzner's provider
API. The agent needs a project-scoped **Read & Write** API token to rebuild the
Cloud server on the user's behalf. A read-only token can inspect, not rebuild.

1. Open [Hetzner Console](https://console.hetzner.com/) and select the project
   containing server `144310066` at `46.224.72.162`. For a consumer, select the
   project containing its verified host instead.
2. Open **Security** -> **API tokens** -> **Generate API token**.
3. Give it a recognizable purpose, such as `web-app-starter-bootstrap`, and
   select **Read & Write**. This token applies to that Cloud project; it is not
   scoped only to one server.
4. Copy the token once and enter it through the supplied hidden terminal prompt.
   Keep its value out of chat, screenshots, logs, source files, command arguments,
   shell history, and GitHub Actions secrets.

If an appropriate credential already exists, provide its protected local file
path rather than creating or sharing another token. The agent verifies owner and
mode before reading it. The current handoff stores `HCLOUD_TOKEN` in
`~/.config/vireocode/web-app-starter/hetzner.env`, inside a mode `0700` directory
with a mode `0600` file, outside the checkout. The one-use wizard lives in the
agent session workspace, not in this repository, and is removed after the
handoff. There is no maintained provider-setup script for consumers to run.

The agent then makes read-only API requests to:

- Confirm the exact server ID, name, public address, architecture, protection,
  attached volumes, and selected OS image.
- Confirm a working public SSH key can be injected by the rebuild.
- Establish the chosen retention/recovery decision and exact destructive scope.

Only after those checks and the required action authorization does the agent
execute the rebuild. A credential being present is not proof of sufficient scope
or approval to affect another resource. No other server, DNS zone, volume, or
GitHub repository is removed as a side effect.

## Rebuild and SSH recovery safeguards

Rebuild through the exact server's `POST /servers/{id}/actions/rebuild` operation,
with an available image of the matching architecture. Record the intent before
submission and the returned action ID. Inspect that same action until it
completes; a timeout or lost response is not permission to submit another rebuild.

Supply explicit, schema-validated cloud-init `user_data` rather than inheriting
experimental startup instructions. Configure the verified operator public key,
disable SSH password authentication, and establish a secure way to attest the
new SSH host identity. The current bootstrap used a private, one-use proof file
installed through the provider; the agent compared it without logging its value
before transferring source or credentials. Only then was the exact server's
known-host record rotated, preserving unrelated host entries.

Verify cloud-init completion, OS/architecture, memory/disk capacity, provider
server identity, retained plan/IP, and all pre-existing backup IDs. Remove the
one-use proof from the host after attestation. Protected provider payloads and
credentials stay outside source control; only sanitized operation IDs, hashes,
and outcomes belong in the acceptance record.

## DNS project access for staging and production

The selected zone is `vireocode.com`, zone ID `1423739` in Cloud project
`15086223`: [existing records](https://console.hetzner.com/projects/15086223/dns/1423739/records).
The selected application targets are:

| Environment | Hostname                        | Zone-relative A name | IPv4            |
| ----------- | ------------------------------- | -------------------- | --------------- |
| Production  | `starter.vireocode.com`         | `starter`            | `46.224.72.162` |
| Staging     | `starter-staging.vireocode.com` | `starter-staging`    | `46.224.72.162` |

Initial authoritative inspection found both names absent, with no AAAA/CNAME
conflicts. The separate DNS-project credential was then verified and both A
record sets were created at TTL `300`. All three authoritative nameservers and
public resolvers `1.1.1.1`/`8.8.8.8` returned the exact IPv4; see
[DNS acceptance](dns-acceptance.json) for operation IDs and scope. The local
recursive resolver still returned `NXDOMAIN` at inspection time despite those
positive answers; do not add duplicate records to work around resolver/cache lag.

The server-project API credential sees no DNS zones and receives `404` for this
zone. That access boundary required a separate credential, not a duplicate zone
or nameserver changes. Public application/TLS verification is still pending.

Obtain a **Read & Write** API token from the exact DNS project `15086223` using
its **Security -> API tokens** settings. Store it through the hidden terminal
handoff at `~/.config/vireocode/web-app-starter/hetzner-dns.env`, mode `0600`,
under key `HCLOUD_TOKEN`. Keep it separate from the server-project credential;
never overwrite that credential or paste either token into chat.

Before writing, the agent must verify the token can read zone `1423739` and that
its name/nameservers match the authoritative `vireocode.com` zone. Add only the
two intended A record sets, preserving all other DNS and existing matching
records. Use TTL `300` during bootstrap where supported. A newly discovered
conflicting A/AAAA/CNAME requires reconciliation before replacement.

Verify both authoritative answers and recursive resolution afterward. Negative
caches can outlive a successful authoritative update; report that distinction
instead of adding duplicate records. These current template hostnames are
inputs to replace for a consumer, not automatically inherited deployment names.

After provider work is finished, revoke the bootstrap token if it is no longer
needed and remove its local file deliberately. Keep any longer-lived provider
credential under separately agreed operator ownership and record only its
location/purpose in documentation.

Source: [Hetzner's token-generation guide](https://docs.hetzner.com/cloud/api/getting-started/generating-api-token/).
