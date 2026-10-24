# Odvojite točne decimale, zaokruživanje i prikaz

**Status podrške: potkrijepljen recept za projekt.** Discovery prihvaća ograničene decimalne stringove, koristi `BigDecimal` i pregledana currency/calculation pravila. Predložak nema financijsku domenu, poreznu politiku ni univerzalni Money. Članak opisuje numerički ugovor, ne računovodstveni savjet jurisdikcije.

Obrazac koristite za novac, količinu ili omjer čije decimalno značenje mora preživjeti JSON, računanje i pohranu. Binary float i UI formatter ne određuju ga pouzdano.

## Sačuvajte značenje na granici

Peer `decimal` traži string s 1–14 cijelih i opcionalno 1–6 decimalnih znamenki te iz njega stvara `BigDecimal`. Po toj politici odbija eksponent, znak i non-string coercion. Drugi helper traži strogo pozitivno; opći dopušta nulu. Granice/sign pripadaju peer poljima, ne svakoj domeni.

```json
{ "amount": "125.40", "currency": "EUR" }
```

To je ilustracija, ne endpoint. Projekt definira shemu, valutu, sign/range, precision/scale, aritmetiku i bazu. String nije validirani novac bez tih pravila.

| Područje        | Odluka                               |
| --------------- | ------------------------------------ |
| Točan unos      | Gramatika/raspon bez lossy coerciona |
| Sign            | Koja polja dopuštaju nulu/negativno  |
| Valuta/jedinica | Identitet i kompatibilnost           |
| Aritmetika      | Međupreciznost i redoslijed          |
| Zaokruživanje   | Mode, scale i faza                   |
| Prikaz          | Locale bez promjene vrijednosti      |

Decimal iz binary `double` nakon JSON pretvorbe ne vraća izvorni točan tekst. Granica, naredba i pohrana ostaju exact.

## Zaokruživanje je imenovana politika

Izvor bira scale iz pregledanih currency pravila i mode iz calculation politike. Razlikuje gotov total od net iznosa s eksplicitnim porezom. Nerazriješene/nepodržane uvjete odbija umjesto pogađanja. Tax/category pravila peer su domena, ne generički predložak.

**Pseudokod recepta:** `Amount`, currency politika, validator i rounding owner predložene su granice projekta. Implementirajte DTO, numeric stupac i autorizirani odabir politike.

```java
var input = decimals.requireBoundedString(command.amount());
var policy = reviewedPolicies.forCurrency(command.currency());
var amount = new BigDecimal(input);
policy.requireAllowedInputScale(amount);
var calculated = calculations.applyExact(amount, command, policy);
var payable = calculated.setScale(policy.scale(), policy.roundingMode());
return new AmountView(payable.toPlainString(), policy.currency());
```

Caller ne bira proizvoljan rounding radi željenog rezultata. Politika može biti server konfiguracija ili retained reviewed verzija prema domeni; recept je ne ugrađuje.

Odredite rounding po retku, komponenti ili tek agregatu; matematički se razlikuju. Dijeljenje s neterminirajućim rezultatom također treba scale/mode, ne improvizirano dodavanje znamenki.

## Izlaz i pohrana imaju granice

Output helper provjerava precision, uklanja trailing zeros i koristi `toPlainString`. Ne jamči točno dvije decimale JSON stringa. UI može prikazati dvije prema politici, bez promjene kanonske vrijednosti ili pretpostavke istog scalea svake jedinice.

Numerička jednakost i jednakost reprezentacije razlikuju se: scale-sensitive object equality nije automatski poslovna jednakost. Odredite gdje treba normalizacija, primjerice hash reviewed payloada, a gdje numerička usporedba.

Database numeric/decimal i constrainti odgovaraju ugovoru; float stupac poništava exact DTO. Nova numeric migracija zaseban je rad. Različite valute/jedinice ne zbrajajte tiho: konverzija treba rate/source/time/rounding ugovor.

## Kvar i oporavak

Nepodržanu precision ili missing reviewed terms odbijte prije commita. Sačuvajte originalni decimalni nacrt za objašnjenje. Ne zaokružujte nevaljan unos prešutno i ne pretvarajte malformed u nulu.

Postojeći izračun zadržava značenje svoje policy verzije; correction/recalculation je pregledani tok. Novi locale/formatter ne mijenja payable. Decimalne mehanike odvojite od commercial/tax/legal odluka projekta.

## Implementacija i kriteriji

- Grammar/sign/range/precision vrijede bez binary pretvorbe.
- Valuta/jedinica prati iznos; nepovezane vrijednosti ne zbrajaju se.
- Mode/scale/faza dolaze iz imenovane politike.
- Division/agregacija slijede dokumentiranu preciznost.
- Storage/output čuvaju značenje; prikaz je zaseban.
- Nerazriješena politika izričito odbija, ne pogađa.
- Povijest ostaje objašnjiva nakon locale/policy promjene.

## Točni izvori

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BillingData.java` — bounded decimal, positive, plain output i reviewed scale/rounding/basis.
