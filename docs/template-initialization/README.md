# Template initialization

First complete the [consumer repository prerequisites](INIT_GUIDE.md#prerequisite-create-and-open-the-consumer-repository):
create it through GitHub's template UI, clone it and open the consumer in VS Code.
For agent-led setup invoke `$template-initialization Inventory Portal`, using
your project name. The [shipped skill](../../.agents/skills/template-initialization/SKILL.md)
prepares private inputs and checks access, then waits for explicit values/DNS/scope
confirmation. It follows the [agent-assisted sequence](INIT_GUIDE.md#agent-assisted-initialization),
including safe DNS preparation before the developer creates records.

Manual execution follows [INIT_GUIDE.md](INIT_GUIDE.md) in order. Numbered scripts
own the commands; agent execution retains real review, access and application
acceptance requirements.

| File                                                     | Purpose                                                                     |
| -------------------------------------------------------- | --------------------------------------------------------------------------- |
| [INIT_GUIDE.md](INIT_GUIDE.md)                           | Complete setup procedure and completion checklist.                          |
| [INIT_GUIDE_COMPACT.md](INIT_GUIDE_COMPACT.md)           | Same procedure with short descriptions, commands and separate manual steps. |
| [.env.example](.env.example)                             | Nonsecret project values and the existing shared infrastructure defaults.   |
| [scripts/](scripts/README.md)                            | Numbered entrypoints, shared data parsing and read-only preflight checks.   |
| [github-ci.md](github-ci.md)                             | Consumer CI selection, evidence and branch protection.                      |
| [github-ci-app.md](github-ci-app.md)                     | Shared GitHub App identity, access and recovery.                            |
| [hetzner-provider-access.md](hetzner-provider-access.md) | Existing host/DNS identities and provider safeguards.                       |

Start with `scripts/1_1_prepare_values.py`, edit the private values file it creates,
prepare the section 2 tools, then run `scripts/2_4_verify_values.py`. Each later
script loads those same verified values; shell exports are unnecessary.

Actual values, verification receipts and observations live in the ignored
`.template-initialization/` directory, with protected file modes. The env file
contains credential **paths**, never tokens or passwords. Keep provider keys in
their existing protected stores.

Full preflight verifies the existing private consumer and makes read-only DNS and
SSH checks. A failed/ambiguous lookup is a failure, not evidence that a deployment
name is available. Local-only validation
does not require those remote services. Verification observes current state;
installation retains its own collision/ownership guards.

The runtime implementations remain with the [CI operator guide](../../infrastructure/ci/README.md)
and [release operator guide](../../infrastructure/release/README.md). Initialization
scripts never grant permission to update or activate those services.
