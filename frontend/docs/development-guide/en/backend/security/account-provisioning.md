# Local seeding and one-time account provisioning

**Support status: installed starter pattern.** The starter has two deliberately different user-creation paths: local development seeding and an explicit one-time operator command. It does not have a public registration endpoint, administrator account lifecycle, password-reset feature or account synchronization service.

Use this pattern when preparing the first login of a generated app, diagnosing why changing environment values did not reset an account, or reviewing a deployment bootstrap change. Account creation is a stateful operation: rerunning it must have a documented meaning and must not silently acquire permission to modify an existing identity.

## Ownership and the two entry points

`LocalUserInitializer` runs under `local & !provision-user`. Its validated `LocalUserProperties` are bound from the local profile's `app.bootstrap-user` configuration. The local setup script creates an ignored environment file with random passwords using exclusive creation; if the file exists, it preserves it. Those scripts own preparation, while the initializer owns creating a missing database identity.

`ProvisionUserRunner` runs only under `provision-user`. The application's main method detects a valueless `--provision-user` argument, adds that profile, starts the application and closes the context after the runners complete. The provisioning profile binds a temporary server to loopback with an ephemeral port. It is not the normal long-running service profile.

| Behavior                | Local seeding                           | One-time provisioning                                |
| ----------------------- | --------------------------------------- | ---------------------------------------------------- |
| Trigger                 | Local profile, excluding provision-user | Explicit valueless flag plus provisioning profile    |
| Existing username       | Leave unchanged                         | Require exact enabled identity and matching password |
| Credential source       | Local ignored development configuration | Protected operator environment                       |
| Local profile allowed   | Required                                | Explicitly refused                                   |
| Existing password reset | Never                                   | Never                                                |

Normal backend startup does not create users just because provisioning variables exist. The CLI flag and runner checks are intentional safeguards, not inconveniences to remove when automating setup.

## Validation belongs before persistence

Both paths use the same property constraints: nonblank username up to 100 characters; nonblank valid email up to 254; nonblank display name up to 200; password between 12 and 72 characters. Both initializers additionally reject passwords longer than 72 UTF-8 bytes. This second condition matters for BCrypt and non-ASCII input: character length alone is insufficient.

```java
// Installed additional constraint; never log the password to explain failure.
if (properties.password().getBytes(StandardCharsets.UTF_8).length > 72) {
    throw new IllegalStateException(
        "PROVISION_USER_PASSWORD must be at most 72 UTF-8 bytes.");
}
```

The provisioning runner gathers Bean Validation violations and reports only the sorted property names, without submitted values. Use the same restraint in surrounding scripts and failure reports. Do not put passwords in CLI arguments, workflow variables, screenshots, guide examples or command logs.

Stored passwords pass through the configured `PasswordEncoder`, currently BCrypt cost 12. The `AppUser` constructor creates a UUID and an enabled account. A username that sounds privileged does not create administrator capabilities: the installed security adapter grants `USER` and has no administrator domain policy.

## Idempotence is a comparison, not an update

The one-time runner first looks up the username. For an existing row, it requires the account to be enabled, email and display name to match exactly, and the supplied password to match the stored hash through the encoder. Only then does it report successful no-op provisioning. Otherwise it fails without modifying the row.

This means a new BCrypt salt is not a reason to rehash or rewrite a matching existing account. It also means the command is not a recovery route for a disabled user or a forgotten password. Those require an explicitly designed, separately authorized recovery workflow. The local initializer is more permissive about reruns: any existing username is left unchanged without comparing the rest of its identity. Do not describe the two paths as interchangeable.

The runner's transaction covers its database operation, but the find-then-create sequence is not a general distributed provisioning lock. A concurrent insertion can still meet the database username uniqueness constraint. The documented deployed operator lock serializes the intended operational workflow; do not advertise arbitrary concurrent invocations as guaranteed successful idempotence.

## Operational scenario and recovery

An operator prepares the first account for a new environment through the canonical release procedure. The command uses the currently deployed backend image digest, the existing database network and a separate protected environment file. The release guide requires an operator lock and a fresh verified production backup, particularly because application startup also runs Flyway migrations and Hibernate validation. The ephemeral server must not publish a container port.

Keep staging and production provisioning credentials separate, and do not mount them into the normal service. This article is not authorization to provision an environment; it explains the installed contract. The authoritative command and host safeguards remain in `infrastructure/release/README.md`.

If rerunning with a changed display name or password fails, do not delete the user, weaken the comparison or change the runner into an upsert. Confirm which environment and username were intended without disclosing values, then use the authorized account-management path if a genuine change is needed. Editing the local environment after the first run likewise does not change either an existing user's password or the database container's existing credentials.

## Acceptance cases for a future implementation

Use these cases to define the implementation acceptance boundary:

- Ordinary startup ignores provisioning values and creates no production user.
- `--provision-user=value` is rejected; the bare flag activates provisioning and successful completion closes the context.
- Combining provisioning with the local profile fails before account mutation.
- A valid missing username creates one enabled BCrypt-hashed account; no plaintext reaches logs or storage.
- An identical rerun is a no-op; changed identity, changed password or disabled account fails without modification.
- A multibyte password exceeding 72 UTF-8 bytes fails even if it has fewer than 72 characters.
- Local seeding preserves an existing username and the setup script preserves an existing ignored environment file.

## Exact source references

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/BackendApplication.java` — flag validation, profile activation and context closure.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/user/ProvisionUserRunner.java` — operator validation and exact-match rerun policy.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/user/LocalUserInitializer.java` — local insert-only behavior.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/user/LocalUserProperties.java` — shared field validation.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/scripts/setup-local.mjs` — exclusive environment-file creation.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md` — one-time deployed-user provisioning procedure and operational safeguards.
