# Numbered deletion scripts

Run these scripts from the reviewed canonical starter checkout on the workstation.
Each `X_Y_name.py` matches subsection `X.Y` in the
[full guide](../DELETE_GUIDE.md) and [compact guide](../DELETE_GUIDE_COMPACT.md).
Every public entrypoint supports inert `--help` and an explicit `--env` selecting
the protected **deletion** reference file. Step 1.1 separately takes the existing
`--initialization-env`; the two files are not interchangeable.

Private modules own historical snapshot/plan/journal (`_state.py`), orchestration
(`_deletion.py`), exact GitHub/DNS operations (`_github.py`, `_dns.py`) and reviewed
operator execution (`_host.py`) and metadata-only shared App inventory
(`_app_inventory.py`). No public script performs all stages implicitly.
SSH transfers only typed private data to the already installed clean canonical
checkout; it never transfers executable snippets or provider/App credentials.

A 0600 reference file points at a 0700 private state directory. Historical
`values.env`, `verification.json`, `progress.json` and `result.json` are retained
locally with immutable hashes; initialization verification expiry does not erase
ownership. Later steps use fresh live inventory and exact numeric identities.
Plan and journals are atomically replaced, file- and directory-fsynced, and bound
to one canonical plan SHA-256. Started operations reconcile read-back before any
retry; state must never be reset to hide uncertain outcomes.

Operator requests run under the root-only `/root/PROJECT_SLUG-deletion` context.
The final nonsecret receipt is saved locally before that host context is removed.
No raw database/configuration/key contents leave the host during inventory.

App inventory runs only on the protected operator with the existing fixed shared
signer. Its temporary token requests exactly `metadata: read` across the existing
selected repositories, exports only identity and numeric IDs, and must be revoked
before success. The explicit reader is injected into GitHub operations. Step 6
preserves App selection; step 7 verifies that repository deletion removes only the
target selection. It makes no explicit App selection mutation. Final-selection
removal blocks planning before host/provider teardown. Lost DELETE responses and
short App consistency delays reconcile through read-only inventories.
