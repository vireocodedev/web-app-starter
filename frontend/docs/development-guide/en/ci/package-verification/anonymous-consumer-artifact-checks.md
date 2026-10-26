# Prove public consumption without maintainer credentials or workspace links

Verify the artifact a new user can actually download, not only the source checkout that produced it. Separate local candidate packaging from anonymous registry consumption and keep privileged attestation verification outside the consumer process.

**RGO publication checks plus a broader Vireo reference.** The installed app consumes public RGO packages. RGO's maintainer repository has separate packed-package and published-template verifiers. Vireo's anonymous gauntlet is a reference profile, not an installed CI lane or upgrade command in this starter.

## Trigger, owner and invariant

Use when publishing a library/initializer, diagnosing an install that works only for maintainers or designing a clean-room release gate. The package maintainer owns public coordinates/content. The verifier owns isolation and exact evidence. Application owners retain generated app/business acceptance.

The invariant is honest consumption identity: a registry claim must use exact public coordinates without inherited registry credentials or workspace substitution. Local pack proof remains useful, but it cannot be relabeled anonymous publication proof.

## Distinguish the actual RGO checks

| RGO check                      | Mechanism                                                                                       | Evidence limit                                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Packed package verifier        | Creates tarball, installs it offline, checks files/exports, consumer types and runtime behavior | Deliberately links local peer dependencies; not a fully anonymous public installation.                |
| Published application verifier | Fresh npm cache, empty user/global configs, sanitized environment, exact public initializer     | Verifies generated platform version, typecheck and build; not exhaustive browser/business acceptance. |

The packed verifier asserts the root export map, files/license/peer contract and absence of leaked source/testing/CSS/maps. Local peers make a controlled fast artifact check, but a registry outage, missing public package or credential-dependent initializer can remain invisible there.

The published verifier chooses the exact stable version from the release source, creates a fresh app with the public initializer, runs locked installation and confirms the installed platform version. It does not consume the current library through `@/` or a `file:` override.

## Use a controlled consumer environment

A generic evidence outline is:

```text
release identity -> exact registry coordinates
                    |
           fresh consumer + config/cache
                    |
         install resolution and integrity checks
                    |
       declared type/runtime/build/app scenarios
                    |
             sanitized source-bound evidence
```

RGO's environment helper preserves selected executable/locale/TLS context but supplies blank npm user/global configs and a dedicated cache. This prevents ordinary inherited npm credentials/hooks from silently making an otherwise private install succeed. It is not a hostile-code sandbox or proof that every host resource is inaccessible.

Vireo's broader gauntlet derives exact npm/Maven/Template coordinates from its ecosystem contract, creates fresh homes/caches, filters executable paths and rejects symlinked/outside-consumer packages, workspace/file/link locks and Maven Local. Those rules are concrete reference mechanisms, not installed defaults for this app.

## Keep authority out of the consumer

The Vireo reference runs public consumption token-free and publishes sanitized atomic JSON evidence. A separate least-privilege attestation reader verifies signed SBOM material without exposing its GitHub token to the consumer process.

Release-tag source, gauntlet verifier source and SBOM attester source are distinct identities. A historical attestation must not be interpreted as if it came from the current verifier or release commit. Exact signature/certificate/checksum/ancestry policies belong to that source owner; copying a green summary cannot transfer them.

The gauntlet covers substantial generated-app/container/database/upgrade/package scenarios, but physical-device PWA evidence and product/adopter decisions remain human-owned. Automated external warnings must not be silently promoted to pass.

## Failure and decision table

| Observation                                          | Decision                                                                     |
| ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| Maintainer install works, anonymous install fails    | Inspect public coordinates, access and hidden credential/config assumptions. |
| Lock resolves to `file:` or linked workspace source  | Reject public-consumption claim; use real registry artifacts.                |
| Packed proof used local peers                        | Report that scope; run the separate public gate when authorized.             |
| Signed evidence check needs a token                  | Keep its privileged verifier separate from the anonymous consumer.           |
| Type/build pass but device behavior unobserved       | Keep the human/device acceptance gap explicit.                               |
| Source/reference version differs from actual package | Reconcile exact coordinate/integrity before accepting evidence.              |

## Acceptance and inspection

Record release/source coordinates, actual downloaded resolution/integrity, environment boundaries, scenario outcomes and missing human evidence. Preserve exact artifact identities rather than only an elapsed time or “green” badge.

The RGO/Vireo maintainer guides own actual release operations. This article installs nothing, queries no registry and runs no gauntlet, test or workflow.

## Source provenance

- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:scripts/package/verify-package.mjs`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:scripts/application-template/verify-published-application-template.mjs`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:README.md`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:docs/ANONYMOUS_CONSUMER_GAUNTLET.md`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:scripts/anonymous-consumer-gauntlet.mjs`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:scripts/lib/anonymous-consumer-environment.mjs`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:scripts/verify-anonymous-consumer-signed-sboms.mjs`
