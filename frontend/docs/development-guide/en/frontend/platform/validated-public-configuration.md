# Validate the complete public configuration before creating runtime owners

A misspelled public environment variable should fail startup, not quietly select a default. A string containing `false` should not enable credentials through JavaScript truthiness. Validate the public configuration once, normalize its domain values, and pass the result to runtime factories.

This is **installed starter behavior**. The environment schema, strict parser, ambient loader, and URL/boolean schemas form one boundary. Build-mode flags still control development-only composition; feature code should consume deliberate runtime/config interfaces rather than invent another interpretation of application environment strings.

## Trigger and owner

Use this boundary whenever adding a public setting, changing an API base, or deciding a deployment-fixed choice. `envVariables` owns the supported `VITE_` vocabulary. `loadAppConfig` admits only those public keys, reports unknown ones, selects defined values, parses them, and applies the production-build guard. `parseAppConfig` also supports an injected record without reading ambient Vite state.

The installed defaults are HTTP API mode, production application label, credentials disabled, and a positive integer request timeout of 15,000 milliseconds. API base URL remains required. An application's custom `VITE_APP_ENV` label is separate from Vite's actual production-build flag; setting the label to development does not permit mock mode in built output.

## Keep syntax and meaning explicit

This is a neutral **illustration using the installed parser seam**:

```ts
const config = parseAppConfig({
  VITE_API_BASE_URL: "/api",
  VITE_API_WITH_CREDENTIALS: "false",
});
// Credentials is boolean false; omitted supported values use schema defaults.
```

The boolean schema accepts actual booleans and exact strings `true`/`false`; arbitrary spellings or `1` are not the contract. The timeout is coerced then constrained to a positive integer. Fixed-setting enums deliberately constrain deployment choices rather than accepting arbitrary CSS or component values.

The base URL schema permits HTTPS absolute URLs or same-origin absolute paths. It rejects protocol-relative input, backslashes, decoded parent traversal, credentials in an absolute URL, and query/fragment components. It removes trailing slashes under its normalization rule. Do not bypass this with a separate Axios base string in a feature.

| Input                                   | Installed response                                |
| --------------------------------------- | ------------------------------------------------- |
| Unknown `VITE_` key                     | Startup error naming unknown public configuration |
| Unsupported enum or malformed boolean   | Schema rejection                                  |
| Missing API base                        | Schema rejection                                  |
| `/api/`                                 | Normalized same-origin path                       |
| Absolute HTTP or credential-bearing URL | Rejected URL contract                             |
| Mock mode in production build           | Explicit startup rejection                        |

## Failure and recovery

Public Vite values are delivered to the browser; this boundary is not a secret store. Do not put passwords, service credentials, signing material, or private deployment inputs in a public variable merely because it is validated. Server-only configuration belongs to its server/operator owner.

When adding a setting, update the schema, domain mapping, owner consumption, documented input, and relevant acceptance scenarios together. A default can be useful for a harmless optional preference; it must not hide an actually required integration input. Preserve compatibility intentionally when renaming a public key instead of admitting both indefinitely without policy.

A schema failure occurs before HTTP/auth/features are created. Startup recovery can therefore explain reload without relying on those providers. Diagnostics should identify the invalid public contract without exposing unrelated environment contents. Do not catch a parse error and fabricate a healthy runtime with unchecked values.

## Acceptance scenarios

A typo in a public key fails visibly. String false stays false. Missing required base, invalid timeout, and unsupported fixed values reject before requests begin. Built mock mode rejects even when the custom application label says development. A valid normalized base is used consistently by runtime clients. An added feature receives parsed dependencies rather than reading ambient strings itself.

## Avoid these shortcuts

Do not use truthy string booleans, accept arbitrary `VITE_` keys, mix app labels with build mode, or store secrets in browser configuration. One validated public contract keeps failure early and ownership reviewable.

## Sources and provenance

- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/config/envVariables.ts` — complete public vocabulary/defaults.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/config/loadAppConfig.ts` — whitelist and production mock guard.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/config/appConfig.ts` — strict injected parser and output type.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/config/schemas/apiBaseUrlSchema.ts` — URL validation/normalization.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/config/schemas/booleanEnvironmentSchema.ts` — exact boolean conversion.
