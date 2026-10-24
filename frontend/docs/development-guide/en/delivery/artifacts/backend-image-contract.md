# Separate backend compilation from restricted runtime

Compile the backend with the tools it needs, then run a smaller non-root artifact with external environment configuration. Image compilation, meaningful tests, schema compatibility and live deployment health remain separate evidence.

**Installed template pattern.** The owners are `backend/Dockerfile`, `backend/gradle.properties`, `backend/build.gradle`, application configuration and the fixed release runtime. This page explains the image contract rather than duplicating a complete Dockerfile or provisioning runbook.

## Trigger, owner and invariant

Use when upgrading Java, changing jar packaging, memory behavior, image base or startup configuration. The backend maintainer owns compile/runtime compatibility and application migrations. The operator owns protected database settings, persistent infrastructure and container limits.

The invariant is a verified source-labeled jar running as a fixed non-root user, with no build tools, source credentials or database data required at runtime. Starting a container must not perform uncontrolled account creation or assume the local development profile.

## Compile in one stage, run in another

The Dockerfile uses digest-pinned Java 21 JDK and JRE base images. The build stage receives the Gradle wrapper/configuration, `gradle.properties` and source. It invokes `bootJar` without a daemon and with plain console output. A build cache is local to the executing Docker boundary; it does not justify sharing a writable host cache with unrelated jobs.

The runtime stage copies the built jar as mode `0444`, sets a stable working directory and selects `10001:10001`. It exposes private `8080` and invokes:

```text
java -XX:MaxRAMPercentage=75.0 -jar /app/app.jar
```

That is the current entrypoint, not a universal heap recommendation. Seventy-five percent addresses maximum heap ergonomics relative to the JVM's perceived memory limit. Native allocations, thread stacks, metaspace and other process/container memory still need headroom. The fixed release runtime currently bounds backend container memory to 512 MiB and provides a limited writable `/tmp`.

The build JVM has independent worker/heap/metaspace settings in `gradle.properties`. Copying that file into the image build retains the bounded compilation contract. Runtime heap percentage does not bound compilation, and build heap settings do not tune the deployed application.

## Keep configuration outside layers

The default profile reads `DATABASE_URL`, `DATABASE_USERNAME` and `DATABASE_PASSWORD` externally. Flyway owns migration and Hibernate uses `ddl-auto: validate`; JDBC session schema initialization is disabled in favor of migrations. The server context is `/api`, secure HTTP-only session cookies are enabled, and public health details are suppressed.

No production env file belongs in the Docker context. `.dockerignore` excludes env files, local Gradle/build outputs, local helper scripts and Compose configuration. Passing a secret through a build argument or copying an env file and deleting it in a later layer is not a safe runtime injection mechanism.

The deployed runtime receives protected database configuration and joins the external environment database network. It uses read-only root, dropped capabilities, no-new-privileges, memory/PID limits and tmpfs. The local profile and local seed credentials are not production defaults.

## Startup is not user provisioning

Ordinary backend startup creates no users, including when provisioning settings are present. A separate explicit one-time `--provision-user` command creates a matching identity and terminates; repeated matching requests preserve it, while conflicts fail instead of resetting credentials.

Provisioning is an operator action with separate protected input and, in production, backup safeguards. It must use the accepted backend digest and must not add provisioning credentials to the normal long-running service. An account name does not create an authority model absent from the application.

## Keep evidence boundaries distinct

`bootJar` in BuildKit compiles/packages the application; it does not run the ordinary Testcontainers suite. The workflow verifies meaningful tests separately before release publication. Adding Testcontainers inside image compilation would couple build infrastructure to an unrelated Docker lifecycle.

The image healthcheck probes `/api/actuator/health`. Restricted artifact smoke checks additionally start fresh PostgreSQL, exercise Flyway/Hibernate and inspect anonymous session/CSRF behavior. Neither a successful build nor a healthy process proves migration compatibility with the existing production database or business acceptance.

## Failure and decision table

| Observation                                      | Decision                                                                             |
| ------------------------------------------------ | ------------------------------------------------------------------------------------ |
| Jar runs in JDK stage but fails in JRE           | Inspect target/runtime compatibility and packaged dependencies.                      |
| Runtime wants root or writable application files | Fix ownership and writable temp boundaries rather than granting broad privilege.     |
| Heap fits but container OOMs                     | Inspect total JVM/native/thread memory and the actual cgroup limit.                  |
| Env changes do not repair an existing schema     | Diagnose migrations and compatibility; runtime configuration is not schema rollback. |
| Normal deployment creates/resets users           | Restore separate explicit provisioning ownership.                                    |
| Host rejects restricted execution                | Diagnose supported host policy; do not drop restrictions merely for a green check.   |

## Acceptance and inspection

Inspect source/repository labels, pinned bases, non-root user, jar permissions, runtime entrypoint and external configuration. Authorized artifact verification should use the actual production image under the intended restrictions, with disposable data.

Record compilation, tests, restricted runtime and live-state evidence separately. Link operational deployment/provisioning to `infrastructure/release/README.md`; consult **Migration failure boundaries** before any recovery affecting persistent data. This article executes no build, container, provisioning or database command.

## Source provenance

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/Dockerfile`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/gradle.properties`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/build.gradle`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/.dockerignore`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/application.yaml`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/runtime.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/smoke_images.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md`
