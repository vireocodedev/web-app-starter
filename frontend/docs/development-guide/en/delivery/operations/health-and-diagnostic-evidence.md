# Diagnose availability, identity and behavior as separate evidence

Use small health contracts to locate a failure, then verify the intended image pair and user behavior separately. A process answering 200 can still be the wrong release, wrong environment or an incomplete application.

**Installed template pattern.** Frontend Nginx, backend Actuator/security configuration, image healthchecks and `infrastructure/release/runtime.py` own health/probe behavior. The release README owns targeted operator diagnostics and prohibits secret-bearing dumps.

## Trigger, owner and contract

Use after deployment, when public routes fail, when containers report healthy but a feature fails, or when collecting a handoff. Application maintainers own endpoint behavior and business acceptance. The operator owns actual container identity, proxy environment and private runtime diagnostics.

The invariant is evidence by layer: process health, artifact identity, public routing/auth boundaries and business behavior are different claims. Report exactly which one was observed. Never broaden a small health response into a claim that an initialized fullstack project is delivered.

## Read the installed probes precisely

| Layer                    | Installed evidence                                                                 | What it does not prove                                            |
| ------------------------ | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Frontend `/healthz`      | Nginx answers its small 200 contract.                                              | Correct API proxy, image pair or logged-in workflow.              |
| Backend Actuator health  | Health response body reports `UP`.                                                 | Every business operation or schema compatibility with older code. |
| Docker health            | Image-defined probe currently passes.                                              | Correct digest/source or public route identity.                   |
| Runtime image inspection | Exact UID and OCI source/revision; running image ID matches expected pulled image. | Business acceptance.                                              |
| Public runtime probes    | Expected status/body boundaries and `X-Vireo-Environment`.                         | Authorization of an individual user or all regression coverage.   |

The default backend exposes only health through Actuator and suppresses health details. Server errors omit messages/stack traces. Health is intentionally useful without becoming a public configuration/database diagnostic endpoint.

## Follow the host's actual acceptance sequence

The runtime obtains exact container IDs from the generated snapshot, inspects health and running image IDs, and compares each with the expected immutable pair. Image inspection also requires the configured component user and source/revision labels.

It then probes public HTTPS without accepting redirects. Expected environment headers prevent an accidentally green response from another environment. The checks include backend health `UP`, anonymous session 401, CSRF response shape, built SPA at `/login` and missing release asset 404.

```text
container exists
     -> expected image identity + healthy
     -> expected public environment + API/SPA boundaries
     -> separately authorized user/business acceptance
```

The CSRF probe checks contract shape; its token is not diagnostic material to print. Anonymous 401 is a successful boundary check, not a failed login. The public environment marker detects routing identity; it is not an authentication mechanism and is not evidence that every downstream operation is safe.

## Choose targeted diagnostics

Start with the first failed layer and inspect only relevant nonsecret categories. A private operator can relate source/run/attempt, transaction, snapshot, actual image IDs and public status. Avoid asking for a full resolved Compose or container environment to answer a narrow routing question.

The owning runbook uses project-specific controller journal categories. It explicitly forbids dumping CMS plaintext, Docker login files, database contents, secret-bearing resolved configuration or indiscriminate raw application logs. Existing diagnostic access is not permission to send those materials into chat or workflow artifacts.

A useful sanitized observation record might be:

```text
expected environment: <staging-or-production>
expected source: <exact-sha>
pair identity: <protected-receipt-reference>
container health: <observed-state>
public status/marker: <observed-status-and-environment>
first failed layer: <identity-or-routing-or-behavior>
```

Keep underlying private evidence outside the public guide. Use exact IDs privately for correlation without turning real host identities into reusable defaults.

## Distinguish host problems from application defects

If restricted containers cannot execute any program on a host, an unrelated minimal image can help the authorized operator distinguish a platform policy failure from application code. Do not weaken AppArmor/no-new-privileges globally merely to get a smoke result. Conversely, a platform limitation must not be presented as proof that the application image passed.

A healthy backend plus API HTML indicates a proxy/fallback boundary problem. Correct public routing plus a failing authenticated business action belongs to application acceptance. A lost GitHub status after verified replacement belongs to uncertain-release reconciliation, not immediate redeployment.

## Failure and decision table

| Observation                                         | Decision                                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `/healthz` 200, API unavailable                     | Inspect backend/proxy separately.                                                    |
| Healthy container runs another image ID             | Identity check fails despite availability.                                           |
| Public header names another environment             | Correct routing before accepting release.                                            |
| Expected anonymous 401 observed                     | Record successful auth boundary; do not “fix” by opening the endpoint.               |
| Operator suggests full env/log dump                 | Request targeted private evidence instead.                                           |
| All infrastructure probes pass, business flow fails | Keep release health and business acceptance distinct; diagnose application behavior. |

## Acceptance and inspection

Record source/pair identity, each observed probe layer, public environment and any missing business evidence. Preserve credential-free failures and their precise scope. A screenshot or green process is not a live-release receipt.

Related reading: **Runtime smoke evidence** covers disposable artifact checks; **Reconcile uncertain releases** covers status disagreement. The release runbook remains the operator procedure. This page executes no probe, log collection or infrastructure change.

## Source provenance

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/runtime.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/controller.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/nginx.conf`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:frontend/Dockerfile`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/Dockerfile`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/application.yaml`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/SecurityConfiguration.java`
