# Prepare a consumer before initialization

Prepare and review initialization in **Client Discovery**, on the production
project's **Developer preparation** page. The developer completes the identity,
operator references, prerequisites, bounded action scope and signature there.
Clients do not see or approve developer preparation. Its revision and review
are independent of the client requirements baseline.

The [contract](../.agents/skills/initialize-project/references/contract.md) owns verification and authority; the
[runbook](../.agents/skills/initialize-project/references/runbook.md) owns application edits and operator procedures. This is
the blank format-1 template, not preparation evidence or execution authority.
An accepted consumer retains its completion evidence.

## 0. Prepare and review in Client Discovery

Open the intended project in production Client Discovery as an administrator.
Complete the short preparation topics using protected file references rather
than credentials. Review the exact answers and explicitly save the review.
Any subsequent edit clears review until the developer reviews that revision
again. Plan-only preparation may contain unresolved answers; execution requires
complete prerequisites, the applicable action consents and unexpired signature.

Configure the administrator's owner-only Discovery profile once at
`~/.config/client-discovery/production.env` (mode `0600`):

```dotenv
DISCOVERY_API_URL=https://clientdiscovery.vireocode.com/api
DISCOVERY_USERNAME=your-administrator-login
DISCOVERY_PASSWORD=your-protected-password
```

Store credential values only in that protected file, never in preparation,
Git, public documentation or chat. Environment variables with the same names
can supply the profile values. This is a user-local configuration shared with
the Discovery specification workflow; the portable initializer is standalone.

## 1. Let the initializer capture the reviewed workbook

Invoke the repository-local skill with the production project ID:

```text
$initialize-project initialize this consumer from production project PROJECT_UUID
```

The agent automatically fetches the exact reviewed Markdown export and records
its project, revision, reviewer, review time and SHA-256 in ignored
`.template-initialization/preparation-provenance.json`. It saves the private
`.template-initialization/preparation.md` with mode `0600` in a user-owned
`0700` directory, then verifies the actual checkout and live readiness.
No download command, Markdown editing or extra routine approval is needed.
An unreviewed revision blocks capture. Authentication/authorization failures
are reported as errors, never interpreted as missing preparation.

An existing identical workbook can be reused. A differing private workbook,
a changed pinned revision or accepted initialization is preserved. Explicitly
request a refresh from the chosen production project before replacing a prior
capture; refresh cannot alter accepted initialization evidence. Existing manual
format-1 workbooks and incomplete legacy runs remain supported without a
project ID. Keep their answers and reconcile them deliberately when adopting
the app source.

The remaining sections explain the exact fields and consents. The tracked
answer table stays blank. For an existing manual workbook, use table escaping
for literal pipes, retain `use-profile` only where offered, and keep credentials
in protected stores. Plan-only unresolved answers grant no execution authority.

## 2. Prepare GitHub access and App consent

1. At <https://github.com/vireocodedev/web-app-starter>, choose **Use this
   template**, select the intended owner and create a **private** consumer
   repository. Clone it; keep the monorepo and template stack.
2. In your own terminal, run `gh auth status`. Log in through
   `gh auth login --hostname github.com --web` if necessary. With multiple
   existing logins, select the intended account yourself using
   `gh auth switch --hostname github.com --user YOUR_ACCOUNT`.
   The agent will verify identity and access, preferably without changing the
   global account. A signed-in browser and CLI are separate sessions.
3. Open `https://github.com/OWNER/REPOSITORY/settings/actions`. Under **Actions
   -> General**, ensure the repository can run the template's pinned Actions.
   Confirm you can administer this private repository and its main policy.
   Required checks/PRs with zero approving reviews need plan support; making
   the repository public is not a workaround.
4. Ask the existing operator for its protected profile and the exact shared
   App installation. Open
   `https://github.com/organizations/OWNER/settings/installations`, choose that
   existing App's **Configure**, select **Only select repositories**, add this
   consumer and **Save**, preserving all prior selections.
5. If your organization restricts that action, have its authorized owner finish
   it now. Repository-admin CLI access alone did not establish this permission
   in the rehearsal. Keep the reviewed permissions: **Actions: read**,
   **Administration: write**, and **Metadata: read**. Do not choose all
   repositories, expand permissions or create another App for this consumer.

The agent still proves actual selected-repository App authentication and
registration permissions. A checked box or a CLI repository read is not proof.
It will configure main protection **after observing the genuine `CI gate`**,
not require you to invent a check before the first CI run. It also creates
default staging/production GitHub environments without unnecessary paid
reviewer/wait-timer features.

See [CI App access](../docs/github-ci-app.md#register-and-verify-a-consumer) and
[main protection](../docs/github-ci.md#configure-a-consumer).

## 3. Resolve existing package names before authorizing changes

The package names derive from the **repository**, not the application slug:
`ghcr.io/owner/repository-frontend` and `-backend`.

1. Open `https://github.com/orgs/OWNER/packages` and inspect both derived names.
   You can read exact IDs, owners and version counts without exposing tokens:

   ```sh
   gh api orgs/OWNER/packages/container/REPOSITORY-frontend
   gh api orgs/OWNER/packages/container/REPOSITORY-backend
   ```

2. If absent, select `require-absent` below. If already owned by this same
   consumer during a resume, select `same-repository-resume` and preserve them.
3. For another repository's packages, stop and choose a different consumer
   repository name, reconcile ownership separately, or explicitly list the
   exact replacement scope below. An old application/database is not permission
   to take over its packages. The normal default preserves and blocks.
4. **Only if you approve listed deletion**, authorize the active CLI account
   through GitHub's own browser flow:

   ```sh
   gh auth refresh --hostname github.com --scopes delete:packages
   ```

   Do not send the token to the agent or place it in the workbook. This scope
   is unnecessary for a fresh namespace. The agent rechecks package IDs,
   repository ownership, privacy, version counts and authority before deleting.

Deleting old versions makes their image digests unavailable to other
deployments. Repository deletion, database deletion and password resets are
never implied. No deletion is performed merely because this guide is opened.

## 4. Prepare the existing operator and DNS access

Obtain an **existing** protected operator profile from the authorized operator.
Reuse verified credential references instead of setting up the host again.
The [profile contract](../.agents/skills/initialize-project/references/contract.md#operator-profile)
defines its fields, ownership and `0600`/private-directory requirements.

The operator must already have a reviewed shared pool, a source/config/boot-bound
validation receipt, strictly verified SSH access, an approved deployment host,
DNS access to the correct zone/project, and a supported backup destination.
Interactive SSH recovery, unknown host keys, an unsupported backup transport or
an unreviewed host repair must be resolved by the operator **before** invocation.
This workbook does not authorize a host rebuild, pool install or privileged
upgrade.

For Hetzner DNS:

1. Open <https://console.hetzner.com/> and select the **existing project that
   owns the DNS zone**, then its DNS zone/records page. A server-project token
   is not automatically authorized for a zone in a different project.
2. Confirm ownership/delegation of the zone and choose two distinct hostnames.
   Inspect A, AAAA and CNAME records and wildcard effects. Preserve matching
   records. Resolve conflicting ownership with the operator rather than create
   another zone, change delegation or overwrite unrelated records.
3. For `user-prepared`, create only the two intended records pointing at the
   operator-approved host and let DNS propagate. For `agent-create-missing`,
   leave creation to the agent under the exact written scope below; your manual
   prerequisite is usable authority/credential references, not doing its work.
4. If a suitable credential does not exist, the zone owner uses that project's
   **Security -> API tokens** to create the necessary scoped credential and
   stores it through protected input. Supply only its profile/file reference.
   Reuse a suitable existing credential; do not replace the server credential.

The [provider handoff](../docs/hetzner-provider-access.md#dns-project-access-for-staging-and-production)
contains operator details. Its template host/zone IDs and hostnames are
historical examples, not values to copy. The agent verifies provider identity,
all authoritative/recursive answers, record conflicts and current capacity.
You do not have to create DB volumes, install controllers, publish certificates
or run deployments manually.

## 5. Prepare the local workspace, not an old-identity database

Install the [README prerequisites](../README.md#local-development): JDK 21,
Node 24/npm 12, Docker/Compose and the recommended Java/Gradle debugger
extensions. Open the consumer as a **trusted** VS Code workspace, complete any
extension consent and allow the Gradle import to finish.

Do not generate old-template credentials, start its database or mark the
future personalized application as tested. Identity edits must precede fresh
credentials/data creation. The agent preserves existing files/volumes and
checks port ownership before allocating any approved free port.

Actual IDE acceptance happens **after personalization**. Before bulk work the
agent must identify a usable unattended tool path for both saved configurations,
including the frontend's `node-terminal` launch. Merely seeing Java tools is
insufficient. If that path is unavailable, it reports a preparation blocker;
it does not promise a no-follow-up run or silently substitute a shell-only test.
Unexpected runtime failures still block their gate and are diagnosed within
scope; paperwork cannot pre-verify a program that has not been personalized.

## 6. Fill the answers

The field IDs are stable input labels. Enter literal values or the choices
shown, never shell commands. Read the
[identity constraints](../.agents/skills/initialize-project/references/runbook.md#1-confirm-the-target-and-identity)
before selecting names.

| Field | Your answer | Meaning |
| --- | --- | --- |
| `form_version` | 1 | Workbook format, not permission. |
| `repository` | example/portal | Exact private `owner/repository`; the agent discovers/verifies numeric ID. |
| `github_account` | use-profile | Existing protected CLI login, or exact account. |
| `operator_profile` | REQUIRED | Protected external JSON path/reference; no secret values. |
| `reuse_existing_operator` | REQUIRED | `yes`; another foundation/bootstrap is separate work. |
| `allow_global_cli_switch` | no | Prefer scoped authentication; change only if explicitly `yes`. |
| `project_slug` | REQUIRED | Approved lowercase/hyphen identity. |
| `display_name` | Planning \| Portal | Product name. |
| `java_base_package` | REQUIRED | Explicit dotted application namespace. |
| `pwa_short_name` | REQUIRED | At most 12 characters. |
| `localization_policy` | same-name-across-locales | Or list exact approved names per locale. |
| `artwork_source` | retain-template | Or an exact supplied image directory/reference; report deferred branding if retained. |
| `theme_policy` | retain | Keep the template theme unless a separate change is explicitly requested. |
| `data_boundary` | REQUIRED | `fresh-isolated` or `resume-same-identity`; a different identity/DB migration is separate work. |
| `preserve_resources` | all-existing | Add known unrelated names/paths/volumes; never secret contents. |
| `production_hostname` | REQUIRED | Owned production FQDN. |
| `staging_hostname` | REQUIRED | Different owned staging FQDN. |
| `dns_mode` | REQUIRED | `user-prepared` or `agent-create-missing`; conflicts always preserve and block. |
| `authorized_maintainers` | use-profile | Explicit GitHub login allowlist, not all repository writers. |
| `initial_username` | REQUIRED | A name such as `admin` does not add an administrator role. |
| `initial_display_name` | REQUIRED | Initial account display name. |
| `initial_email` | REQUIRED | Approved initial account email. |
| `backup_destination` | REQUIRED | `same-server` or an already supported operator destination reference. |
| `same_server_loss_acknowledged` | REQUIRED | `yes` for same-server; otherwise `not-required`. Do not inherit acceptance from the profile. |
| `backup_time` | REQUIRED | Daily local time, e.g. `03:00`; must match the supported operator schedule. |
| `backup_timezone` | REQUIRED | Explicit IANA zone, e.g. `Europe/Zagreb`. |
| `backup_retention_days` | 30 | Fixed supported policy; staging scheduling remains disabled. |
| `deployment_port_range` | use-profile | Unused loopback ports within the operator-approved range. |
| `local_port_policy` | REQUIRED | `allocate-free-loopback` or `preserve-defaults-and-block`; update all related configuration consistently. |
| `prerequisite_policy` | locked-project-dependencies-only | Or `none`; no system install or dependency upgrade is implied. |
| `new_paid_resource_ceiling` | 0 | No host/subscription/resize/rebuild in this workflow. |
| `registry_policy` | require-absent | Or `same-repository-resume` / `replace-listed-only`. |
| `registry_delete_auth` | not-required | Set `completed` only for approved replacement after the conditional CLI authorization. |
| `old_image_loss_acknowledged` | not-required | Required `yes` for listed replacement; old digests will no longer be pullable. |
| `execution_mode` | plan-only | `plan-only` or `execute-listed-scope`. |
| `approval_signer` | REQUIRED | Your authorized GitHub account, matching the selected actor. |
| `approval_signed_at` | REQUIRED | ISO-8601 UTC timestamp. |
| `approval_expires_at` | REQUIRED | Later ISO-8601 UTC expiry; stale/expired authority blocks writes. |
| `stable_learning_proposals` | none | Only explicit proposal IDs from the readiness report if Stable-mode guidance edits are later approved. |

Passwords are intentionally absent from the form. The agent generates distinct
local/staging/production credentials into protected files **after** identity
personalization, and provisions deployed users explicitly.
Choose an authorization window covering the intended bounded run; expiry is
not renewed automatically. If it expires, preserve completed work and renew
the declaration before further mutations.

### Exact optional registry replacement

Leave this table with no data rows unless `registry_policy` is
`replace-listed-only`. In that case add **each** authorized package, numeric
ID, current owner repository and complete version count. Unknown/new versions
or changed ownership block deletion and require a written scope update.

| Exact package name | Numeric package ID | Current owner/repository | All versions to delete |
| --- | --- | --- | --- |

Even when replacement is approved, preserve old GitHub repositories, every
database/volume, all other packages and every unrelated workload.

## 7. Mark human prerequisites actually completed

- [ ] Private consumer created/cloned; exact repository and fresh/resume boundary entered.
- [ ] Intended GitHub account is authenticated in the protected CLI store.
- [ ] Repository administration, private Actions and required-check plan support confirmed.
- [ ] Existing shared App has this selected repository; owner/browser consent saved.
- [ ] Existing protected operator profile is available; host trust/source/receipt and capacity are the operator's responsibility.
- [ ] Correct DNS zone/project authority is available; names/conflicts and chosen record-creation mode resolved.
- [ ] Package names inspected; no conflict, same-consumer resume, or exact replacement rows and digest-loss acknowledgement recorded.
- [ ] Conditional `delete:packages` authorization completed, **or** `registry_delete_auth` is `not-required` because no deletion is requested.
- [ ] Local tools, Docker and trusted VS Code/Java import/extension consent prepared.
- [ ] Identity, artwork, account, backup destination/risk/schedule and allocation bounds answered.

These are human attestations for preflight, not substitutes for the agent's
authenticated checks or post-personalization/runtime/restore evidence.

## 8. Authorize the bounded execution in writing

For `plan-only`, the agent performs read-only discovery and writes a readiness
report; it does not execute the actions below.

For `execute-listed-scope`, check every action you actually authorize. A missing
required action blocks full initialization rather than creating a partial
success. Fill signer/timestamps above yourself. By invoking `/initialize-project`
after completing this workbook, you make the current request to execute **only**
the listed scope if live preflight matches it:

- [ ] Personalize this consumer's approved identity/assets and generate protected distinct credentials.
- [ ] Build/test, launch the real native/IDE/browser flows and allocate only approved unused local ports.
- [ ] Register this exact repository through the existing reviewed operator at an idle maintenance point; validate before reactivation and preserve existing registrations.
- [ ] Create scoped consumer commits/branches/PRs/pushes and configure main with the genuine `CI gate`, strict PRs, zero approving reviews and administrator enforcement.
- [ ] Use only the declared DNS names, existing host/namespace and permitted free ports; preserve matching records and block conflicts.
- [ ] Prepare isolated consumer databases/volumes/networks/controller/TLS and publish only the public controller certificate variable.
- [ ] Run real Deploy staging and promote its exact successful immutable pair with Deploy production at the same selected source.
- [ ] Explicitly provision the approved users, verify both real HTTPS/browser flows, retrieve and isolated-restore an initialized production dump, then enable only the approved production schedule.
- [ ] Remove only exact task-owned scratch containers/temporary transfer or credential files; retain protected backups and all unrelated resources.
- [ ] If and only if exact replacement rows are present and approved above, replace only those packages/versions; otherwise no old image/package deletion.

The final replacement checkbox is conditional: leave it unchecked when there
are no replacement rows and the deletion fields are `not-required`. That is not
a missing mandatory approval and grants no deletion authority.

Fixed exclusions: no upstream publication, new paid host, resize/rebuild,
shared privileged-source upgrade, repository deletion, database replacement,
password reset or live-database restore. A workbook cannot override these
workflow boundaries or mandatory tool/provider approvals.

The profile, checked boxes and old state are not standing permission. The
current user invocation, complete signed/unexpired workbook, matching verified
consumer and resolved in-scope plan must agree. The agent records the workbook
SHA-256 and approval provenance before mutations and never fills your approval
fields for you.

## 9. Invoke once prepared

Open a fresh agent chat in the trusted consumer workspace and invoke:

```text
$initialize-project initialize this consumer from production project PROJECT_UUID
```

Other agents supporting skill slash commands use `/initialize-project`.
The skill captures the reviewed workbook, verifies live readiness and writes
`.template-initialization/readiness.md` with the resolved plan, provenance,
checks and exact blockers. Within current signed bounds it proceeds without a
configuration interview or another routine approval round.

Correct missing, expired or conflicting preparation in Client Discovery,
review the changed revision, then explicitly request a refresh and resume.
The agent preserves completed work and accepted evidence. Existing manual
workbooks can still be used directly. Stable-mode learning edits require the
explicit proposal IDs; `none` grants no such edits. Explanation or maintenance
and verification of completed consumers do not require a new workbook.

Sources: [GitHub App installation/access](https://docs.github.com/en/apps/using-github-apps/installing-a-github-app-from-a-third-party)
and [GitHub CLI scope refresh](https://cli.github.com/manual/gh_auth_refresh).
