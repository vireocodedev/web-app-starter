# Keep exact decimals separate from rounding and display policy

**Support status: source-backed consumer recipe.** Client Discovery accepts bounded decimal strings, uses `BigDecimal` and applies explicitly reviewed currency/calculation rules. The starter does not install its financial domain, reviewed tax policy or a universal Money class. This article describes numeric contracts, not jurisdiction-specific accounting advice.

Use this pattern for money, measured quantities or ratios whose exact decimal meaning must survive JSON, arithmetic and storage. Binary floating-point values and a UI formatter cannot define that contract reliably.

## Preserve decimal meaning at the boundary

The peer `decimal` helper requires a string with 1–14 integer digits and optionally 1–6 fractional digits, then constructs `BigDecimal` from that string. It rejects scientific notation, signs and non-string coercion under this input policy. A separate helper requires a strictly positive result; zero is valid for the general decimal helper. Those bounds/sign rules belong to the peer's fields, not every numeric domain.

```json
{ "amount": "125.40", "currency": "EUR" }
```

This is an illustrative wire shape, not an installed endpoint. The consumer must define amount schema, accepted currency, sign/range, precision/scale, arithmetic and database representation. A string is not “validated money” until those rules are enforced.

| Concern       | Explicit decision                                        |
| ------------- | -------------------------------------------------------- |
| Exact input   | Decimal grammar and range, with no lossy number coercion |
| Sign          | Which fields permit zero/negative values                 |
| Currency/unit | Required identity and compatibility rules                |
| Arithmetic    | Intermediate precision and calculation order             |
| Rounding      | Mode, scale and point in the calculation                 |
| Display       | Locale formatting without changing stored meaning        |

Constructing a decimal from a binary `double` after JSON conversion cannot recover the original exact decimal text. Keep the typed boundary exact throughout the command and persistence path.

## Make rounding a named domain policy

The source selects scale from reviewed currency rules and rounding mode from reviewed calculation policy. It distinguishes an amount already representing the total from a net amount with explicit tax. It refuses unresolved or unsupported reviewed terms rather than guessing. The particular tax/category assumptions are peer business policy, not a generic template rule.

**Pseudocode recipe:** `Amount`, currency policy, request validator and rounding owner are proposed consumer seams. Implement their DTO/schema, compatible database numeric column and authorized policy selection before adapting it.

```java
var input = decimals.requireBoundedString(command.amount());
var policy = reviewedPolicies.forCurrency(command.currency());
var amount = new BigDecimal(input);
policy.requireAllowedInputScale(amount);
var calculated = calculations.applyExact(amount, command, policy);
var payable = calculated.setScale(policy.scale(), policy.roundingMode());
return new AmountView(payable.toPlainString(), policy.currency());
```

The caller must not choose an arbitrary rounding mode merely to obtain a desired result. A legitimate policy can come from current server-owned configuration or a retained reviewed version, depending on the domain. The recipe does not install that policy store.

Specify whether rounding occurs per line, per component or only after aggregation. Those choices can differ mathematically. Division also needs an explicit scale/rounding strategy when the exact result is nonterminating; adding more digits ad hoc is not a reviewed policy.

## Output and storage have their own limits

The peer output helper checks supported integer/fractional precision, strips trailing zeros and uses `toPlainString`. It does not guarantee a fixed two-decimal JSON string. A display formatter may show two decimals under a currency's UI policy without rewriting the canonical amount or assuming every currency/unit has that scale.

Numeric comparison and representation equality also differ: scale-sensitive object equality is not automatically the desired business comparison. Decide where normalized representation matters—for example, hashing a reviewed payload—and where exact numeric equality is intended.

Use a database numeric/decimal representation with constraints matching the consumer's contract; adding a floating column behind an exact DTO loses the guarantee. A proposed numeric column/migration is new implementation work, not supplied by this helper. Never add amounts of unlike currencies or units silently; conversion needs its own rate/source/time/rounding contract.

## Failure and recovery

Reject unsupported precision or missing reviewed terms before committing a financial mutation. Preserve the user's original decimal draft so the UI can explain the field issue. Do not round an invalid amount silently at ingestion or coerce a malformed string to zero.

If an existing record was calculated under another policy version, retain that version's meaning for its history and introduce a reviewed correction/recalculation flow when required. A new UI locale or formatter must not change payable values. Keep generic decimal mechanics distinct from the consumer's commercial, tax and legal decisions.

## Implementation checklist and acceptance

- String grammar, sign, range and precision are validated without binary coercion.
- Currency/unit identity accompanies every amount and incompatible values cannot be summed accidentally.
- Rounding mode, scale and calculation stage come from a named policy.
- Division and aggregation behave under the documented precision rules.
- Storage and output preserve exact meaning; display remains separate.
- Unsupported or unresolved policy fails explicitly instead of guessing.
- Retained calculations remain explainable after policy/locale changes.

## Exact source references

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BillingData.java` — bounded string decimals, positive check, plain output and reviewed scale/rounding/basis rules.
