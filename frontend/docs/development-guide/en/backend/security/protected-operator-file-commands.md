# Admit privileged file commands through a narrow protected entrypoint

Keep operator input out of HTTP payloads, shell evaluation and ordinary application startup. Validate the file boundary and application authority separately before treating its contents as a privileged command.

**Source-backed reference recipe.** Client Discovery's application main, policy/service operator runners and `readProtected` helper provide the observed mechanism. These profiles/commands are not installed starter APIs. File privacy is one admission layer, not cryptographic approval or a complete hostile-filesystem sandbox.

## Trigger, owner and invariant

Use when an explicitly authorized operator imports reviewed evidence or executes a privileged one-shot action. The process owner controls profile/arguments and OS file access. The application owner validates the chosen actor, exact command schema, current policy and target state.

The invariant is explicit mode plus bounded protected data. A file is parsed as data, never sourced as shell. Its OS owner is not automatically the application principal, and a private file alone does not authorize its claims.

## Select exactly one operator mode

The reference main rejects multiple operator modes, selects a dedicated profile, disables the web application and closes the context after completion. Service execution requires its explicit flag without a value and one nonblank value for each required user/application/file option. Policy execution admits only its declared operation values.

These are concrete argument checks, not a claim that every unknown option is globally rejected. A consumer should define its own complete allowlist and conflicting-mode behavior. Normal app startup must not accidentally activate the privileged runner through broadly shared configuration.

```text
explicit process mode/arguments
           |
protected bounded file bytes
           |
JSON + command/actor/policy/target validation
           |
one-shot operation and reviewed result output
```

## Inspect the actual file guard

| Boundary  | Observed implementation                                                           |
| --------- | --------------------------------------------------------------------------------- |
| Type      | POSIX regular file attributes read with `NOFOLLOW_LINKS`.                         |
| Owner     | Must match the calling OS user's resolved principal.                              |
| Mode      | Only owner-read/owner-write permission bits allowed; no group/other permissions.  |
| Size      | Initial and incremental read ceiling of 256 KiB.                                  |
| Open      | Read channel uses `NOFOLLOW_LINKS`.                                               |
| Stability | Before/after file key, owner, permissions, size and modification time must agree. |

Mode `0600` is a sensible private-file recipe, but the source checks allowed bits rather than requiring exactly that numeric mode. It rechecks the bound while reading so a growing input cannot evade only the initial size check.

The guard is Unix/POSIX-specific and checks the selected leaf. It does not establish protected ancestors, prevent every same-owner replacement/race or prove an immutable approved snapshot. Do not describe metadata stability as a signature. A stronger trust model needs an explicit directory/descriptor/identity contract and content approval binding.

## Decode and authorize with separate contracts

The helper converts bytes with `ByteArrayOutputStream.toString(UTF_8)`, which is not a reporting decoder that rejects malformed input. A consumer requiring byte-exact UTF-8 must add a strict decoder and reject malformed/unmappable sequences before JSON parsing. Do not silently claim that validation already exists in the reference.

The command layer then resolves an enabled authorized application actor, validates fields/operation, current policy and resource revision. Input actor IDs are not trusted merely because the file is owner-only. The service operator also prevents an outer transaction from collapsing its independent phases.

Never print input payloads, evidence bytes, reviewer identities or credentials as routine diagnostics. The service runner prints a result; an adaptation must review that output schema and sanitize it rather than assume every arbitrary future result is safe for logs.

## Failure and decision table

| Observation                                      | Decision                                                     |
| ------------------------------------------------ | ------------------------------------------------------------ |
| Symlink or nonregular leaf                       | Reject without following it.                                 |
| Group/other permission or wrong OS owner         | Reject and prepare intended private input safely.            |
| Input exceeds bound or changes during read       | Reject; no partial command execution.                        |
| File private, application actor unauthorized     | Deny at the application authority layer.                     |
| Strict UTF-8 is required                         | Add reporting decode; source conversion is insufficient.     |
| Threat model includes malicious same-owner races | Design stronger ownership/descriptor protections explicitly. |

## Adaptation and acceptance

Provide explicit one-shot lifecycle, platform assumptions, complete argument/schema checks, private storage, byte/decode limits, actor/policy authorization and narrowly reviewed output. Inspect conflicting modes, wrong owner/mode/type, growth/change and unauthorized target cases.

Independent security/source review is required before integration. This article reads no operator file and executes no privileged command.

## Source provenance

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/BackendApplication.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/CommercialPolicyOperatorRunner.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceOperatorRunner.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceOperatorService.java`
