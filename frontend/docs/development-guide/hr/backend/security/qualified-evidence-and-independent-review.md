# Točan dokaz kvalificiraj prema aktualnoj proceduri

Odvoji prikupljenu tvrdnju od ovlasti za zaštićeni prijelaz. Qualification veže zadržane bajtove, target, trenutnu proceduru i ovlaštenog verifikatora, ne checkbox ili valjanu JSON strukturu.

**Source-backed reference recept.** Service operator/agreement i reconciliation owneri Client Discoveryja pokazuju mehanizam. Njihovi komercijalni nazivi nisu pravni savjet ni starter API. Primijeni neutralni completion/access dokaz.

## Okidač, vlasnik i ugovor

Koristi kad vanjsko opažanje ili file otključava lifecycle. Evidence owner čuva original/candidate, policy owner channel/scope/reviewera, a command owner kvalificira točan target transakcijski.

Ugovor je exact-source kvalifikacija pod aktualnom politikom. Shape, hash ili ime reviewera ne autentificiraju stvarni događaj.

```text
candidate + original
         |
current procedure + target/facts + verifier
         |
qualified observation/receipt
         |
zasebno zaštićeni efektivni prijelaz
```

Operator razrješava candidate kind/line/version, zaključava ownere i provjerava proceduru prema targetu. Source payload digest mora biti među retained proofovima. Policy provjerava key/namespace/event, channel, ownership i točne metapodatke.

Agreement reprovjerava current actor kao provenance verifier, nebuduće verification vrijeme, scope i identičan target proof u listi. Observation zadržava target input; nepovezani attachment nije dovoljan.

## Neovisnost je policy

| Pravilo               | Značenje                                                                  |
| --------------------- | ------------------------------------------------------------------------- |
| Authorized operator   | Stage/acquire prema proceduri.                                            |
| Authorized verifier   | Kvalifikacija po trenutnoj proceduri.                                     |
| Independence required | U opaženom service putu drugi od stagera i relevantnog artifact creatora. |
| Nije required         | Nema dodatnog separation uvjeta; ostale provjere vrijede.                 |

Service ima `independentVerificationRequired`. Reconciliation prema policyju provjerava uploader i original/normalization creatore. Ne postoji univerzalni two-person rule niti apsolutna diskvalifikacija svakog uploadera.

Dva display namea nisu dokaz neovisnosti. Veži stable račune i konkretne artefakte. Organizacijski conflict-of-interest i institucionalno podrijetlo mogu tražiti dodatni dokaz koji izvor sam ne pruža.

## Current policy i vrijeme

Izvor odbija expired/revoked/unreviewed, wrong resource/party/channel i dvosmislenu proceduru. Provenance bilježi review, acquisition/channel, source digest/identitete, proofove, verifikatora i vrijeme.

```text
target: <resource + version/digest>
source: <namespace + event + bytes digest>
procedure: <current reviewed scope>
verifier: <authorized account>
times: <event/acquisition/verification>
result: <receipt identity/digest>
```

To nije starter DTO. Claim, acquisition i verification vremena različita su; command dodatno provjerava svoj event window.

Operator revalidira source prije replaya pa za novi rad traži request fingerprint/actor i revision. Receipt nije opći auth bypass.

## Pogreške i odluke

| Opažanje                                      | Odluka                               |
| --------------------------------------------- | ------------------------------------ |
| File postoji, qualification ne                | Samo input; transition ostaje gated. |
| Proof hash odstupa                            | Odbij binding.                       |
| Verifier je uploader uz required independence | Drugi ovlašten reviewer.             |
| Policy expired/scope drugi                    | Nova current kvalifikacija.          |
| Shape valjan, origin nije                     | Sačuvaj authenticity gap.            |
| Receipt postoji, transition ne                | Odvoji stanja u izvješću.            |

## Prilagodba i prihvat

Treba immutable storage, current policy, role, candidate/version, transakcija/lock i audit. Ne kopiraj komercijalna pravila.

Pregledaj pogrešne proof/owner/procedure/reviewer/time te dopušteni same-person slučaj. Prije integracije potreban je neovisni security/source review. Članak ništa ne kvalificira.

## Izvori

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceOperatorService.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceAgreementService.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServicePolicy.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BankReconciliationService.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/CustomerBillingPolicy.java`
