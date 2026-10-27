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
For full setup, step `1_2_select_deployment_ports.py` uses the existing attested
SSH connection to select/save unused ports before verification; it never resets
recorded state or reserves ports.
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

The shared helpers `_shared.py`, `_local.py`, `_personalization.py`, `_operations.py`,
`_handoff.py` and `_github_policy.py` are private Python modules rather than standalone numbered actions. They centralize env parsing,
argv-safe commands and the extracted local/operator implementations. They do not
replace the existing application or infrastructure runtime owners.

Steps 4.1, 5.1 and 5.2 apply the verified identity mechanically to their exact
owned fields; 4.2 moves both Java application roots. Recognized template or selected
values support safe retries, while foreign/ambiguous content stops before a step
writes. Optional `--open` is post-edit inspection. Step 6.1 is a read-only automatic
coherence gate; known neutral references need no manual classification. Both
[full](../INIT_GUIDE.md) and [compact](../INIT_GUIDE_COMPACT.md) guides follow these
same entrypoints; artwork review remains a separate manual action.
Step 7.2 formats the frontend identity files with the installed pinned Prettier
after its existing dependency installation, including wrapped long title values.

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
[section 11 handoff](../INIT_GUIDE.md#111-verify-github-app-access-and-transfer-the-initialization-state)
for the host `--env` path, protected modes and operator commands.

Section 12 configures branch protection and deployment environments through
`12_2_configure_github_policy.py --verify-protection` after successful consumer CI.
It binds the required gate to its observed App, preserves compatible stronger
policy and records read-back evidence. The optional proof mode journals one
owned failing-to-green validation PR and closes it without merging; rerun the
same command after an interruption. Follow the [policy step](../INIT_GUIDE.md#122-configure-and-verify-github-policy)
for prerequisites, conflicts and release-branch handling.

Read-only API contracts use the official [GitHub repository API](https://docs.github.com/en/rest/repos/repos)
and [Hetzner Cloud API](https://docs.hetzner.cloud/reference/cloud). Actual provider,
SSH and DNS availability must be checked with your own selected values; mocked
tests do not establish live access.

Step 11.3 captures the stopped controller configuration hash into protected,
source/boot/consumer-bound progress. Step 11.4 uses it automatically while the
canonical registration lock still rejects stale configuration; an explicitly
observed `--expected-config-sha256` remains available for operator reconciliation.

Step 7.1 checks protected backend env identity/password bounds and local database
binding ownership automatically without printing secrets or resetting volumes.
An existing same-checkout Compose binding is accepted; step 8.1 checks real auth.

Steps 15.3/17.2 automatically identify a unique run from the bounded recorded
dispatch window and exact source/workflow/actor identity, then persist its ID and
attempt before waiting. `--run-id` remains available for ambiguous/older intents;
`--reconcile-only` never dispatches or waits for completion.

Step 12.1 first configures/read-backs repository Actions permissions with the
verified maintainer's admin authority. Pinned Actions and compatible existing
selections are preserved; organization policy is never modified.

Initial step 11.1 upload first grants/read-backs existing shared CI App access
for the verified consumer only; completed retries preserve identical state.
Return-progress performs no App mutation. Step 2.3 checks the required read:user
scope and uses `--login` for explicit interactive authorization when missing.
