# GitHub App for the shared CI controller

The permanent controller uses an organization-owned GitHub App. Its root-only
RSA key signs a short-lived JWT; the controller exchanges that JWT for a
repository-scoped installation token and renews it before expiry. Tokens stay
in controller memory, not in configuration, job environments, workflow secrets,
or recovery state.

## Organization authorization

Create a private App owned by **vireocodedev**, signed in as **brunotot**. For a
different operator organization, substitute that owner and its authorized
administrator. The agent may prepare GitHub's App manifest flow so the human
only authorizes creation/installation; otherwise use the organization's
**Settings -> Developer settings -> GitHub Apps -> New GitHub App**.

Use these values for the current foundation:

| Setting                                   | Value                                                                        |
| ----------------------------------------- | ---------------------------------------------------------------------------- |
| Name                                      | `VireoCode Shared CI` (use an available organization-specific name if taken) |
| Homepage                                  | `https://github.com/vireocodedev/web-app-starter`                            |
| Visibility                                | Private; installation limited to this organization                           |
| Webhooks                                  | Inactive; the controller polls GitHub                                        |
| Repository Actions permission             | Read-only                                                                    |
| Repository Administration permission      | Read and write, required by repository JIT runner registration/deletion      |
| Repository Metadata permission            | Automatic read-only                                                          |
| Other repository/organization permissions | None                                                                         |
| Installation access                       | Only selected repositories; initially `web-app-starter`                      |

Record the App ID and installation ID, not the client secret or an OAuth token.
Keep the generated RSA PEM file directly in the protected local credential
directory, for example
`~/.config/vireocode/web-app-starter/github-app.pem`, mode `0600`.
It is a private key: never paste it into chat, source, command arguments, logs,
or GitHub Actions secrets. A protected local `github-app.json` records only:

```json
{
  "app_id": 123456,
  "installation_id": 789012,
  "owner": "vireocodedev"
}
```

The numeric examples are not usable IDs. An App manifest callback can capture
the real IDs/key automatically through a loopback-only, one-use authorization
flow. Validate the returned organization, permissions, selected-repository
policy, and installation using the App's authenticated API before accepting it.

## Prepare the host's App adapter

Fresh installations contain the App adapter and dormant settings. An already
prepared, credential-free foundation may use the guarded `prepare-app-auth`
operation. This is not a general upgrade or live migration: the controller must
be stopped/disabled/idle, the repository map empty, no credential/proof recovery
pending, and the expected configuration and installed controller hashes must
match. Source must be an exact reviewed protected checkout.

Prepare the real settings in a root-owned mode `0600` file. From that checkout:

```sh
python3 -B infrastructure/ci/manage.py prepare-app-auth \
  --settings /root/github-app-settings.json \
  --expected-config-sha256 CURRENT_CONFIG_SHA256 \
  --expected-controller-sha256 CURRENT_CONTROLLER_SHA256
python3 -B /usr/local/lib/web-app-ci/controller.py validate
```

Replace both hashes with observed current values. The guarded operation installs
only the reviewed controller/auth adapter, unit, credential-denial probes and
public App settings. It
invalidates the prior receipt and never introduces a private key or enables CI.
Inspect partial failures rather than retrying blindly; mismatched hashes are a
blocker, not an override to bypass.

Only after the new full current-boot validation passes, the agent transfers the
private PEM through the attested SSH connection to
`/etc/web-app-ci/github-app.pem`, root-owned mode `0600` beneath the mode `0700`
directory. App settings live in `/etc/web-app-ci/github-app.json`, also mode
`0600`; their bytes and adapter source are bound into the validation receipt.
The systemd controller loads the key as `github-app-key`. No personal API token
is required by this interface.

## Register and verify a consumer

Before registration, grant this App installation access to the consumer's
private repository, preserving existing selections. The consumer owner must
match this pool's configured organization; other organizations need their own
installation/pool or a separately implemented multi-installation adapter.

Follow the existing protected monorepo registration procedure in the
[operator guide](../infrastructure/ci/README.md). Registration proves the real
App installation token's JIT permissions. Repeat full validation after the
repository-map change, then run genuine GitHub jobs before normal pool use.

Installation tokens are renewed automatically, but deleting/suspending the App,
revoking its key, or removing repository access remains an explicit failure.
Keep recovery evidence when access is unavailable. For key rotation, stop the
controller at an idle point, replace the protected key deliberately, restart
with its systemd credential, and verify actual access; retire the old key after
successful acceptance. App identity/settings changes require revalidation.

Source: [GitHub App authentication](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/about-authentication-with-a-github-app).
