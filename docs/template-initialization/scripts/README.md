# Numbered initialization scripts

Each public script uses `X_Y_name.ext`, matching subsection `X.Y` in
[INIT_GUIDE.md](../INIT_GUIDE.md). Run only the chosen step from that guide;
there is no command that runs the whole initialization automatically.

Begin in the consumer checkout already created through GitHub's template UI,
cloned locally and opened in VS Code; follow the guide's
[prerequisites](../INIT_GUIDE.md#prerequisite-create-and-open-the-consumer-repository).
Workstation setup uses that existing checkout. Create the private values file:

```bash
python3 -B docs/template-initialization/scripts/1_1_prepare_values.py
```

Edit `.template-initialization/values.env`, following [.env.example](../.env.example).
Its `GH_ORG` and `PROJECT_SLUG` must match that existing consumer's origin.
After preparing the section 2 tools and intended GitHub login, verify the values:

```bash
python3 -B docs/template-initialization/scripts/2_4_verify_values.py --scope full --mode new
```

Use `--scope local` for local-only work. Both scopes require the consumer origin.
`--mode new` starts deployment initialization for the existing repository; its
GitHub name is already in use by that consumer. Successful full verification
records its numeric ID. Use `--mode resume` for recorded setup; neither mode can
replace a previously recorded repository ID.
`--env /absolute/path/values.env` selects a different protected input file. The
parser accepts literal data, not shell exports, interpolation or command
substitution. Every entrypoint supports `--help` without performing setup.

The shared helpers `_shared.py`, `_local.py`, `_operations.py` and `_handoff.py`
are private Python modules rather than standalone numbered actions. They centralize env parsing,
argv-safe commands and the extracted local/operator implementations. They do not
replace the existing application or infrastructure runtime owners.

The verification receipt is bound to the env bytes and verifier code, expires
after 24 hours and records its scope and producer. It does not reserve names or
prove later business/HTTPS/IDE acceptance. Operator copies of the env, receipt and
observations must preserve their bytes and use root-owned `0600` files beneath a
`0700` directory. Provider secrets are never copied with them.

Section 11 starts on the workstation with `11_1_transfer_state.py`. It derives
`/root/PROJECT_SLUG-initialization/` from the verified slug and transfers only the
three state files over strict host-key-checked SSH. Run it with
`--return-progress` after the operator steps to retrieve matching progress without
losing local observations. Initial upload retries require identical host files;
later context switches still require deliberate reconciliation. Follow the
[section 11 handoff](../INIT_GUIDE.md#111-transfer-the-initialization-state-to-the-operator-host)
for the host `--env` path, protected modes and operator commands.

Read-only API contracts use the official [GitHub repository API](https://docs.github.com/en/rest/repos/repos)
and [Hetzner Cloud API](https://docs.hetzner.cloud/reference/cloud). Actual provider,
SSH and DNS availability must be checked with your own selected values; mocked
tests do not establish live access.
