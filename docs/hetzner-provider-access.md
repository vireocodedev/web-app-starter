# Hetzner provider access

This is the provider-access handoff for a shared-host operator. A consumer using
an existing CI pool needs repository registration, not a Hetzner API token.

## Current bootstrap target

The read-only inspection of the selected host established:

- Hetzner Cloud server ID: `144310066`.
- Public IPv4 / SSH target: `46.224.72.162` / `root@46.224.72.162`.
- Current OS: Ubuntu 26.04 amd64.
- The loaded local RSA identity matches a root-authorized key on that host.

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

After provider work is finished, revoke the bootstrap token if it is no longer
needed and remove its local file deliberately. Keep any longer-lived provider
credential under separately agreed operator ownership and record only its
location/purpose in documentation.

Source: [Hetzner's token-generation guide](https://docs.hetzner.com/cloud/api/getting-started/generating-api-token/).
