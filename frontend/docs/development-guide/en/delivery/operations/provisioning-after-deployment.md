# Provision the initial identity as a separate post-deployment command

Create the authorized first account explicitly after the accepted backend is deployed, without turning every application restart into an identity mutation. Keep provisioning inputs separate from the normal service and preserve existing accounts on repeat.

**Installed template pattern.** `BackendApplication`, `ProvisionUserRunner`, local-user properties and the dedicated profile own application behavior. `infrastructure/release/README.md` owns the operator procedure using protected per-environment inputs and the active backend digest.

## Trigger, owner and invariant

Use when an initialized deployed environment has no initial identity and the operator is authorized to create it. The operator owns account inputs, environment selection, active image identity and production backup safeguards. The backend owner owns validation, password encoding and repeat semantics.

The invariant is explicit one-time creation, not startup seeding or password recovery. Normal deployed startup creates no users and ignores provisioning settings for account creation. A matching repeat is a no-op; a conflict is an error, never a reset/re-enable/update operation.

## Activate through the explicit flag

The application main method parses `--provision-user` as a flag without a value. It adds the `provision-user` profile, starts the application and closes the context when the command completes. The profile binds its temporary server only to loopback on an ephemeral port. The operator must not publish a container port for this command.

The runner also requires the flag and rejects the `local` profile. Local development seeding is a separate initializer with different lifetime and ownership; it must not become a production shortcut.

```text
accepted deployed backend digest
            |
protected DB env + separate provisioning env
            |
explicit --provision-user, no published port
            |
Flyway + Hibernate validation -> identity transaction -> exit
```

Starting this command can run migrations before identity logic. Use the currently deployed accepted digest and obtain a fresh verified production backup under the environment lock. Choosing a newer unaccepted image to create an account could introduce schema changes outside the intended release.

## Validate inputs without exposing them

The four public field names are `PROVISION_USER_USERNAME`, `PROVISION_USER_EMAIL`, `PROVISION_USER_DISPLAY_NAME` and `PROVISION_USER_PASSWORD`. Values belong in a separate protected mode `0600` env file beneath root-only directories, not command arguments, Actions variables or source control. Staging and production get different credentials.

The shared property validation requires nonblank username/display name/password, a valid bounded email, bounded lengths and a password of at least twelve characters. The runner additionally caps the password at 72 UTF-8 bytes, matching the encoding boundary rather than assuming character count equals bytes. Validation errors list field names, not the rejected secret values.

The constructor creates an enabled user with an encoded BCrypt password. It does not implement an administrator role merely because a username sounds administrative. The starter's authentication service currently assigns `USER`; future role/authorization requirements need their own explicit domain and security design.

## Preserve identity on repeat

| Existing state                                              | Installed result                                   |
| ----------------------------------------------------------- | -------------------------------------------------- |
| Username absent and inputs valid                            | Save one enabled identity with encoded password.   |
| Enabled identity, same email/display name, password matches | Return successfully with no changes.               |
| Different email or display name                             | Fail without updating the identity.                |
| Password does not match                                     | Fail without resetting the stored hash.            |
| Existing account disabled                                   | Fail without re-enabling it.                       |
| Local profile active                                        | Refuse the one-time deployed provisioning command. |

This contract deliberately prevents “rerun provisioning” from becoming account maintenance. A renamed display field or rotated password is not an idempotent repeat. The appropriate future management/recovery use case needs its own authorized workflow.

The runner is transactional, but it is not a general concurrent provisioning API or external-effect coordinator. Use the documented operator/environment lock rather than launching multiple identity commands against the same environment.

## Verify behavior with the right evidence

The installed image smoke helper checks normal startup leaves scratch users absent, the explicit command terminates, matching repeats preserve the row and a password conflict fails without altering it. These are disposable artifact checks, not proof that a real operator account exists in a generated consumer.

For actual post-deployment acceptance, inspect the command's private nonsecret outcome and separately verify authorized real HTTPS login/session/logout. Keep passwords, BCrypt hashes, session cookies, CSRF tokens and restored user data out of evidence shared in chat or GitHub.

The normal long-running app container must not mount the provisioning env file or retain the profile/flag. A deployment should remain able to restart safely without introducing users or resetting credentials.

## Failure and decision table

| Observation                                         | Decision                                                                  |
| --------------------------------------------------- | ------------------------------------------------------------------------- |
| Existing identity conflicts                         | Stop; do not mutate it through provisioning.                              |
| Operator wants password reset                       | Use a separately designed/authorized recovery workflow, not this command. |
| Selected image differs from active digest           | Resolve release identity and migration implications first.                |
| Provisioning secrets are mounted on normal service  | Remove that coupling and preserve separate command lifetime.              |
| Command succeeds but login fails                    | Diagnose HTTPS/auth configuration and chosen identity privately.          |
| Username suggests admin but permissions remain USER | Implement the actual authority model explicitly if required.              |

## Acceptance and inspection

Record environment, accepted backend identity, production backup reference where required, explicit command completion and private login/session evidence. Confirm no unintended update or extra long-running service remains.

The release runbook is authoritative for operational invocation and safeguards. This article creates no account, runs no migration and provides no real credential example.

## Source provenance

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/BackendApplication.java`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/user/ProvisionUserRunner.java`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/user/LocalUserProperties.java`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/user/LocalUserInitializer.java`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/SecurityConfiguration.java`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/application-provision-user.yaml`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/smoke_images.py`
