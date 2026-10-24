# Render a small allowlisted plain-text language, not arbitrary templates

Support reviewed message text without exposing expression evaluation, recursive substitutions or implicit HTML execution. Keep exact input/template/body identity so later evidence refers to what was actually rendered.

**Source-backed reference recipe.** Client Discovery's `ServiceNoticeService` owns a restricted interpolator, strict template-byte decoding and retained text artifacts. It is not a general template engine or an installed starter rendering API. Adapt the allowed variables and limits to the consumer explicitly.

## Trigger, owner and invariant

Use when operators select approved message templates populated from immutable resource facts. The template owner defines allowed placeholders and plain-text semantics. The resource owner supplies validated values. The message-intent owner retains exact template/body digests and approved recipient binding.

The invariant is a deliberately small language: recognized `{{name}}` placeholders only, required values present, one-pass substitution and plain-text output. A message body must not become code or HTML because it contains markup-like text.

## Read the actual grammar

The reference recognizes ASCII letter-led alphanumeric placeholder names. Each name must belong to a fixed allowlist and have a nonnull value. Unmatched braces in template literal segments are rejected; expression syntax, nested structures and arbitrary property traversal are not supported.

A neutral example uses actual source placeholder names:

```text
Resource: {{serviceTitle}}
Window: {{periodStartOn}} to {{periodEndExclusiveOn}}
Reference: {{packageDigest}}
```

These identifiers illustrate the source contract, not a universal DTO. The provided value set depends on the kind of intent. Missing a period value is an error rather than an empty string quietly changing the meaning of a notice.

| Input                                            | Observed decision                            |
| ------------------------------------------------ | -------------------------------------------- |
| Known placeholder with a value                   | Substitute that string once.                 |
| Unknown placeholder or missing value             | Reject rendering.                            |
| Literal unmatched brace/expression-like template | Reject unsupported grammar.                  |
| Value containing `{{` or `}}`                    | Reject rather than recursively interpret it. |
| Template containing tag-shaped `<...>` text      | Reject by the source's narrow regex rule.    |
| Template control character except CR/LF/tab      | Reject by its codepoint check.               |

The matcher scans the original template. Inserted values are not rescanned as a second template program. This is nonrecursive substitution, not an escaping algorithm.

## Keep decoding, content and presentation separate

Template bytes use a UTF-8 decoder configured to report malformed/unmappable input. That stronger byte contract is distinct from the operator-file helper's replacement-style string conversion; do not assume all text paths in the source share the same decoder.

The template's tag regex is not a general HTML sanitizer. It checks the template string, not every substituted value, and cannot safely authorize rendering arbitrary output through HTML sinks. The control-character check is likewise on the template; value validation must have its own contract.

Store/serve the result as plain text and render through text-safe UI. Do not reuse body output as an HTML fragment, mail header, URL, shell or SQL value without a separate context-specific design. A content-type label alone cannot compensate for a consumer that later calls an unsafe HTML API.

## Bound work and retain exact artifacts

The source rejects a final body larger than 10 MiB in UTF-8 bytes. This is a post-render check after the string has been assembled and encoded. It does not establish a streaming allocation ceiling or independently bound every input value.

An adaptation should bound template bytes, value bytes/counts and total work before/during construction according to its scale. Do not describe the existing final ceiling as proof against every memory/CPU exhaustion input.

The intent creation path uses reviewed template artifact identity/digest, renders with selected facts and stores a `text/plain` body artifact. The retained notice links exact template and message metadata, package/version, locale and destination. Later delivery/evidence uses those bytes rather than silently rerendering with changed facts.

## Failure and decision table

| Observation                                | Decision                                                                     |
| ------------------------------------------ | ---------------------------------------------------------------------------- |
| New business variable requested            | Review allowlist/value source/meaning rather than enable arbitrary lookup.   |
| Missing value would change message meaning | Fail before intent creation.                                                 |
| Replacement contains markup or controls    | Enforce explicit value policy and text-safe sink; regex is not sanitization. |
| Body exceeds output bound                  | Reject and review inputs; do not truncate evidence silently.                 |
| Facts changed after retained intent        | Create a reviewed new intent instead of mutating old bytes.                  |
| Need rich HTML/localized grammar           | Design a separate supported renderer and security contract.                  |

## Adaptation and acceptance

Provide exact UTF-8 policy, variable/value validation, preconstruction resource limits, immutable artifact storage, locale semantics and safe output sinks. Inspect unknown/missing/malformed placeholders, nonrecursive values, byte boundaries and retained-digest agreement.

Independent security/source review is required before integration. This article renders no live message and sends no external communication.

## Source provenance

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceNoticeService.java`
