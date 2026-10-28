---
name: template-initialization
description: Initialize or resume a consumer cloned from web-app-starter using a project name, confirmed values and DNS, then complete the initialization guide.
---

# Template initialization

## Start

For a bare `$template-initialization` or a request without a task, ask one short
question: “Would you like to (1) prepare a new consumer, (2) resume initialization,
(3) explain the workflow, or describe another task?” Wait before inspecting or
changing task files. Explanation-only requests stay read-only.

A concrete invocation such as `$template-initialization Inventory Portal` supplies
the display name and proceeds directly to intake. It authorizes preparation of
private inputs and read-only readiness checks. Full initialization starts only
after the developer confirms the displayed values, configured DNS and execution
scope. A repeated name or elapsed time is not confirmation.

## Workflow

**Load the owners.** Read the current root/applicable `AGENTS.md`,
[compact initialization guide](../../../docs/template-initialization/INIT_GUIDE_COMPACT.md)
and the [full guide](../../../docs/template-initialization/INIT_GUIDE.md) for its
prerequisites, exceptions and recovery. The guides and numbered scripts own the
procedure; this skill coordinates them. Before every new owner or consequential
operation, load its applicable contracts and inspect current source. “Manual”
steps can be performed by the agent through authorized GitHub, SSH and browser
operations; they still require real evidence and the guide's review gates.

**Prove the checkout before creating inputs.** Inspect Git root, origin, branch
and changes. Require the already-created consumer in the supported organization;
refuse the canonical `vireocodedev/web-app-starter` checkout before running even
step 1.1. Preserve unrelated work, existing values, credentials, databases and
observations. Derive `PROJECT_SLUG` from the actual cloned origin, not from an
assumption about the supplied display name. Existing initialization is resumed,
not renamed or restarted. For a different recorded identity, stop for deliberate
reconciliation.

**Prepare fresh intake.** In a fresh consumer:

1. Run `python3 -B docs/template-initialization/scripts/1_1_prepare_values.py`.
2. Fill the generated `.template-initialization/values.env` while preserving its
   `0600` mode and `0700` parent. Treat it as literal data, without shell exports,
   interpolation or quoted dotenv values. Keep the checked-in infrastructure
   defaults and propose these project values:

   | Input                  | Selection                                                                                                             |
   | ---------------------- | --------------------------------------------------------------------------------------------------------------------- |
   | `PROJECT_SLUG`         | Exact origin repository slug                                                                                          |
   | `DISPLAY_NAME`         | Supplied project name                                                                                                 |
   | `JAVA_PACKAGE`         | Valid lowercase dotted namespace; normally `com.vireocode.<slug-without-hyphens>`, adjusting invalid/keyword segments |
   | `PWA_SHORT_NAME`       | Readable name of at most 12 characters                                                                                |
   | `STAGING_HOSTNAME`     | `<slug>-staging.vireocode.com`                                                                                        |
   | `PRODUCTION_HOSTNAME`  | `<slug>.vireocode.com`                                                                                                |
   | `MAINTAINER_LOGIN`     | `brunotot`                                                                                                            |
   | `INITIAL_EMAIL`        | `brunotot1000@gmail.com`                                                                                              |
   | `INITIAL_USERNAME`     | Existing default `admin`                                                                                              |
   | `INITIAL_DISPLAY_NAME` | Existing default `Project Administrator`                                                                              |

   For `Inventory Portal` in repository `inventory-portal`, suitable suggestions
   are `com.vireocode.inventoryportal` and `Inv Portal`. Validation and the actual
   consumer remain authoritative; `admin` is an account name, not a new role.

3. Run `1_1_prepare_values.py --check` using the full script path above, then run
   `python3 -B docs/template-initialization/scripts/1_2_select_deployment_ports.py`.
   Ports require valid identity/account values first. Reuse existing strict SSH
   host trust and access. Port selection checks stopped-project reservations too;
   it does not reserve anything.
4. Run guide steps 2.1–2.3 to check/select the declared tools and existing intended
   GitHub login. Missing credentials, permissions, host trust, Docker access,
   policy entitlement or operator prerequisites require the precise missing
   intervention; never promise that DNS is unconditionally the only human step.
5. Before the developer creates DNS, run
   `python3 -B docs/template-initialization/scripts/2_4_verify_values.py --scope full --mode new --prepare-dns-intake`.
   This performs normal full checks while names are unused and records protected
   historical absence evidence. It writes no DNS or deployment resources. Existing
   unclaimed DNS or conflicting resources must be reconciled, never adopted,
   overwritten or deleted merely to pass initialization.
6. Run `python3 -B docs/template-initialization/scripts/1_1_prepare_values.py --show-values`.
   Print all 22 validated nonsecret inputs in chat, including selected ports.
   Print the two exact A records and `OPERATOR_IPV4`, TTL 300 where supported,
   using the existing zone. Print credential-file paths only; retain credential
   contents in protected storage. Never raw-print an arbitrary env file.
7. Present the confirmation below, then stop. Application personalization,
   commits/publication, CI mutations and deployment start after confirmation.

**Use one explicit confirmation.** Tell the developer:

> Review all values above and create the two DNS A records. Confirm: “Values are
> correct, DNS is configured, start initialization.” After that confirmation I
> will follow the full compact guide through verified completion, including
> local checks, GitHub configuration, scoped CI registration, commits/pushes,
> PRs and merges after green checks, staging/production deployment, account
> provisioning, and backup/recovery validation. Existing artwork stays with
> branding deferred. Production backups run daily at 03:00 Europe/Zagreb with
> 30-day same-server retention; they do not survive server loss. Staging is
> unscheduled. VS Code debugger acceptance is explicitly waived; real GUI login
> locally and on both deployed environments remains required.

Persist the actual reply and accepted scope/decisions privately, without secrets,
in a `0600` `agent-decisions.json` beside the values under the owned `0700`
directory. Bind the record to the exact `repository`, observed `repository_id`
and values-file SHA-256, with confirmation time and the developer's actual words.
Use atomic protected writes and preserve an existing decision record. Record
artwork deferral, backup risk/policy and the explicit debugger waiver. This record
preserves user authorization across chat interruptions; it does not replace any
verification, controller receipt or acceptance observation. Never manufacture a
confirmation. Changed inputs require renewed review and confirmation; preserve
bound evidence and reconcile before editing an already-recorded intake.

**Verify DNS and execute.** After matching confirmation, run fresh full
`2_4_verify_values.py --scope full --mode resume`, then guide step 13.2 early:
`python3 -B docs/template-initialization/scripts/13_2_verify_dns.py`.
Use the full 2.4 path above. Preparation permits exact matching DNS on resume
even days later, while the readiness receipt still expires after 24 hours. All
live prerequisites and authoritative/public answers must pass again. Never edit
progress IDs, claims or receipt timestamps by hand. If the operator context needs
a fresh receipt later, follow the guide's revalidation and state-transfer rules.

Continue sections 3–19 of the compact guide, retaining every applicable numbered
and lettered action, check, operator review and recovery gate. Section 13 now
rechecks the same recorded DNS; it needs no second provider write. Invoke each
script separately with its actual workstation/operator paths and `--env` when
custom. Work only within this consumer's authorized scope, preserve shared pool
and unrelated resources, and stop on a real blocker. Wait for actual CI and exact
release runs; opening a PR, image publication or a health response is not completion.
Review code/configuration and evidence before using `--reviewed`; confirmation
of scope does not make an unreviewed candidate acceptable. Merge only the clean
initialization PR after required green checks and review, never validation fixtures.

**Observe the real GUI and completion.** After frontend and backend are running,
use browser automation or the installed Playwright/Chrome tooling to sign in
through the actual local GUI, then verify navigation, reload/session persistence
and logout. Use privately read generated credentials in memory; avoid credentials
in source, command arguments, logs, screenshots, chat or browser-tool history.
Mock-mode journeys or API-only probes cannot supply this acceptance. Check both
locales' personalized names/titles. Repeat real GUI journeys on staging and
production after their separate provisioning; retain all six required HTTPS
checks and exact source/run/image/recovery observations. If browser capability is
unavailable, request that specific intervention rather than inventing success.

Run the static IDE configuration check in section 9. Do not require launching the
VS Code debugger. In section 19.2 use only for `manual.ide`:
`{"status":"waived","evidence":"Bruno explicitly waived debugger acceptance; terminal-started GUI acceptance is recorded separately.","user_authorized":true}`.
Record `local_application` as passed only after actual observations; record
artwork as deferred with its reason. All other guide completion requirements
remain mandatory. Maintain the consumer-specific setup handoff and deliver its
final documentation through green CI before declaring completion.

**Resume deliberately.** On re-invocation inspect existing protected values,
progress, decisions and actual resources. Reuse approved values/ports/passwords,
revalidate expired readiness with full resume verification, and continue the first
unfinished action. An intake without matching recorded confirmation stays at the
confirmation gate. A pending dispatch is reconciled before another dispatch;
partial registration/installation follows its owner recovery procedure. Changed
identity or values stop for reconciliation instead of resetting evidence. Keep
precise completed/blocking/next-action notes so another chat can continue safely.

## Finish

Intake finishes by displaying the complete validated values, DNS records and
explicit confirmation request, with no full initialization started yet.

Full initialization finishes only when step 19.2 validates the source-bound
completion marker, the consumer handoff is current and its required CI is green.
Report local/staging/production GUI results, source and run/pair identities,
recovery and backup state, protected credential locations and the debugger waiver.
Distinguish setup completion from business acceptance. The first scheduled backup
execution may remain pending as the guide permits; name that limit. If blocked,
report the exact missing action and preserved resume point, not “100% complete.”
