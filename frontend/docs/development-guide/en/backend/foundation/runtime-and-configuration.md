# Runtime and configuration ownership

**Support status: installed starter pattern.** The examples describe the starter's current Java 21, Spring Boot 4.1.1 and PostgreSQL configuration. A generated consumer must inspect its own build before adapting them; another project's dependencies do not become available merely because its code is mentioned in this guide.

Use this pattern when adding a backend capability, diagnosing profile-dependent startup, or deciding whether a setting belongs in source, local development configuration or the deployment environment. Configuration is part of the application contract: a feature that requires a new setting also requires an owner, a missing-value policy and a deployment change.

## The build and application own different decisions

`backend/build.gradle` selects Java 21 through its toolchain and declares Spring Boot 4.1.1. Installed capabilities include WebMVC, Bean Validation, Security, JPA, Flyway, JDBC-backed Spring Session, Actuator and the PostgreSQL driver. The wrapper owns the Gradle version. Do not infer that a peer application's MapStruct, Lombok, MQTT or alternate JSON package is installed here.

The base `application.yaml` owns behavior common to deployed environments. Database location and credentials arrive through `DATABASE_URL`, `DATABASE_USERNAME` and `DATABASE_PASSWORD`. `SERVER_PORT` has a default of 8080. These names are contracts with the operator; adding a new name requires updating the authoritative setup runbook rather than introducing an unexplained environment dependency.

The servlet context is `/api`. Controller mappings are relative to that context:

```java
// Installed mapping shape; public URL is GET /api/auth/session.
@RestController
@RequestMapping("/auth")
class AuthController {
    @GetMapping("/session")
    public SessionUser session(Authentication authentication) {
        // Current starter resolves the enabled account and returns its public DTO.
    }
}
```

This excerpt illustrates the mapping only; the abbreviated body is not a replacement implementation. Adding `/api` to `@RequestMapping` would duplicate the prefix. Proxy routing and frontend API configuration must agree with the external URL without rewriting the controller contract accidentally.

## Profiles narrow a specific environment

The `local` profile imports an optional `.env` properties file, uses loopback binding, builds the JDBC URL from local PostgreSQL variables and permits a non-secure cookie for local HTTP. The base cookie remains HTTP-only, secure and SameSite=Lax. Copying the local cookie override into the base configuration weakens every deployed environment and does not solve a proxy or HTTPS configuration error.

The `provision-user` profile binds to loopback and selects an ephemeral port. Its runner has separate explicit safety checks; it must not be combined with `local`. A profile name is therefore a capability boundary, not just a convenient set of development defaults.

| Concern                                | Owner                                 | Change implication                                     |
| -------------------------------------- | ------------------------------------- | ------------------------------------------------------ |
| Java and dependencies                  | Build file and wrapper                | Review compatibility and compile the consumer          |
| Shared security and persistence policy | Base application configuration        | Review all deployed environments                       |
| Local database and seed identity       | Local setup scripts and local profile | Preserve an existing ignored environment file          |
| Production secrets                     | Deployment environment                | Use the approved secret mechanism; never commit values |
| New consumer prerequisite              | Setup runbook                         | Document input, safeguard and verification together    |

For local setup, follow the workspace `README.md` and its linked initialization runbook. Those sources own the commands and credential preparation. A guide article must not become a second, divergent provisioning procedure.

## Persistence and diagnostics are deliberately constrained

Hibernate uses `ddl-auto: validate`; Flyway performs schema evolution. `open-in-view: false` prevents the web rendering phase from serving as an implicit persistence session. A new response that needs related data must load and map that data within its explicit application boundary. Changing to `update` or enabling Open Session in View hides a missing migration or query design problem.

JDBC session schema initialization is `never` because Flyway owns those tables too. Session timeout is 30 minutes. Actuator exposes only `health` and suppresses health details. Server error configuration suppresses exception messages and stack traces in default responses. Those restrictions do not replace structured internal diagnostics; they keep internal detail off the public surface.

## Failure and recovery scenario

A new generated app starts locally but fails in deployment with schema validation errors. First separate database connectivity, migration execution and entity/schema agreement. Confirm the effective profile and the presence of the required environment names without printing their values. Inspect the migration failure and deployment logs through the authorized operational channel. Correct a missing migration or mismatched entity in source; do not enable automatic DDL as a recovery shortcut.

A browser that cannot keep a session over deployed HTTP is a transport/configuration problem: the secure cookie expects HTTPS. Repair the approved HTTPS/proxy path rather than disabling the production cookie flag. A local port collision belongs to local database setup, not to authentication or entity mapping.

## Acceptance cases for a future implementation

These cases document expected review coverage; they are not instructions to run tests now.

- Public `/api/auth/session` resolves through the `/auth/session` controller mapping exactly once.
- A missing required database setting fails visibly without disclosing its value.
- A fresh database receives Flyway migrations before Hibernate validates it; an incompatible schema does not get silently rewritten.
- Local HTTP uses the narrow local cookie override while the base configuration retains secure transport.
- A new configuration dependency appears in both source and the consumer's authoritative setup guidance.
- Health and ordinary error responses do not disclose database detail, credentials or stack traces.

## Exact source references

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/build.gradle` — runtime and installed dependencies.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/application.yaml` — shared persistence, context, cookie and diagnostics policy.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/application-local.yaml` — local environment import and HTTP exception.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/application-provision-user.yaml` — one-time provisioning binding.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:README.md` — canonical local development entry point.
