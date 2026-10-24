# Separate environment identity from application replacement

Keep staging and production independently addressable while preserving database lifetime across application releases. Replacing an image pair must never imply recreating the persistent database or borrowing another environment's credentials.

**Installed template pattern.** `infrastructure/release/install.py`, `prepare.py` and `runtime.py` own protected settings, initial database resources and fixed application Compose generation. The release README owns installation/activation procedure; a normal release does not provision these resources again.

## Trigger, owner and invariant

Use when initializing a consumer, allocating ports, adding database configuration or changing application replacement. The operator owns project slug, hostnames, ports, protected files, network/volume identity and public proxy. Application maintainers own behavior inside the accepted images.

The invariant is two environments with distinct hostnames, four distinct loopback application ports, separate database credentials/networks/volumes and separate runtime locks/state. Each application's Compose references its environment's external database network. App replacement changes the image pair while retaining the database project.

```text
PROJECT staging hostname                PROJECT production hostname
          |                                         |
  staging loopback app ports              production loopback app ports
          |                                         |
 frontend + backend pair                   frontend + backend pair
          |                                         |
 staging external DB network               production external DB network
          |                                         |
 staging persistent volume                 production persistent volume
```

The diagram is an identity map, not a network-policy proof for every possible host actor. Deployment-host Docker authority remains privileged and confined to fixed operator-controlled code.

## Install protected identity once

Installation requires a clean exact committed root-controlled source checkout with protected ancestors. It refuses an existing project installation rather than overwriting it. The project gets separate protected settings/code/state directories, disabled units and an installation source receipt.

The runtime configuration validates known fields, the slug/repository shape, expected protected directory paths, exactly staging/production environments, valid hostnames and four nonoverlapping port numbers. It does not discover a consumer's desired public domain or safely allocate capacity by guessing template values.

Each environment receives a different generated database password and separate provisioning input file. The database Compose references an external named volume and network and publishes no database port. PostgreSQL runs non-root with restricted runtime settings. Credentials are private configuration, never guide examples or Actions variables.

## Preparation is a guarded one-time mutation

`prepare.py` verifies that all configured loopback ports can bind, the project proxy site is absent and intended database resources do not already exist. It records exact creation intent before creating labeled networks and volumes. A new volume's mountpoint must be expected, nonsymlinked and empty before ownership is set.

If preparation is interrupted, its durable marker forces operator inspection. Blindly rerunning an installer or deleting the marker can collide with partially created state. A configured free port at preparation is a prerequisite, not a permanent reservation against every later host process.

The generated proxy preserves `/api` and `/api/*` for the backend, sends other requests to the frontend and adds `X-Vireo-Environment`. It validates the full Caddy configuration before reload and uses a project-specific site file. The marker helps detect routing to the wrong environment; it is not authentication.

## Replacement owns applications, not database lifetime

The fixed runtime generates application services from the protected settings and immutable pair. Frontend/backend ports bind to `127.0.0.1`; the backend joins the environment database network. Database credentials enter only through the protected runtime env file.

Application services have their own Compose project suffix and immutable snapshot under the environment release directory. The database is a separate project with external persistent resources. A normal app `up` does not replace PostgreSQL or delete its volume. A production replacement also has its own backup/migration gate.

The environment lock serializes deployment and backup operations for that environment. It does not replace the controller's request identity checks or authorize a human to run arbitrary host commands concurrently.

## Failure and decision table

| Observation                                            | Decision                                                                 |
| ------------------------------------------------------ | ------------------------------------------------------------------------ |
| Port is allocated to another project                   | Allocate unused project-specific ports; do not stop unrelated services.  |
| Staging points at production database settings         | Treat as an isolation defect before running migration/startup.           |
| Preparation marker already exists                      | Inspect exact partial resources; do not erase state and rerun blindly.   |
| App replacement proposes volume deletion               | Reject the lifecycle coupling; data retention needs a separate decision. |
| Public health is green with another environment marker | Correct proxy/environment identity before acceptance.                    |
| New consumer copies template host/ID values            | Replace with approved project inputs and validate actual remote state.   |

## Acceptance and inspection

Inspect two hostname identities, four loopback ports, separate secrets, database resources and exact app/database project ownership. Confirm no public database port and no application snapshot accepting repository-provided mounts or Compose text.

Record protected source/configuration evidence privately and verify expected running images/public markers after an authorized release. Template historical activation is not consumer readiness. This page performs no installation, preparation, proxy reload, release or database action.

## Source provenance

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/install.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/prepare.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/runtime.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md`
