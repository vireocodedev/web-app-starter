# Preuzmite rad, pozovite izvan transakcije pa uskladite

**Status podrške: potkrijepljen recept za projekt.** Client Discovery trajno sprema namjeru, transakcijski preuzima rad, provider I/O radi izvan transakcije pa kasnije usklađuje. To nije ugrađeni job/outbox framework predloška; uključeni adapteri i dalje nisu konfigurirani.

Obrazac koristite kad baza i vanjski učinak moraju biti objašnjivi kroz timeout, pad i konkurentne workere. PostgreSQL i nepovezani provider nisu jedna atomska transakcija. Umjesto toga zadržite namjeru, stabilan identitet i usklađivanje dokazima.

## Prije poziva potvrditi nepromjenjivo značenje

Document request sprema operation key, immutable payload/digest, draft verziju i pregledane policy reference. Notice putanja čuva message/destination značenje i idempotency key. Dispatch ne sastavlja današnju promjenjivu formu kao da je izvorni zahtjev.

Claim pod odgovarajućim resource/registry/operation lockovima ponovno provjerava preduvjete. Bira submit ili lookup, sprema vlasnika i rok, mijenja stanje i commita prije transporta. Notice označava uncertainty već pri claimu, pa pad ne ostavlja lažnu priču da pokušaja nije bilo.

| Faza          | Database granica              | Trajna činjenica                                  |
| ------------- | ----------------------------- | ------------------------------------------------- |
| Request       | Poslovna transakcija          | Postoji autorizirana immutable namjera            |
| Claim         | Kratka zaključana transakcija | Worker posjeduje pokušaj prema lease protokolu    |
| Provider call | Izvan transakcije             | Ishod može biti potvrđen, odbijen ili neizvjestan |
| Reconcile     | Nova zaključana transakcija   | Provjeren dokaz mijenja operation/receipt         |

Izvorni operation/idempotency key ostaje. Novi attempt token označava worker claim, ne novi poslovni identitet.

## I/O držite izvan svake vanjske transakcije

Oba pregledana orkestra odbijaju aktivnu caller transakciju. Programatske transakcije završe prije submit/lookupa. Sam `REQUIRES_NEW` ne znači da nema database lockova: suspendirani caller može zadržati svoje. Eksplicitan outside-transaction ugovor čini taj rizik vidljivim.

**Pseudokod recepta:** projekt implementira shemu, locking repozitorij, žive ovlasti/politike, adapter, ograničene timeoute, tokene i evidence validaciju. Helperi nisu importi predloška.

```java
public void dispatch(UUID operationId) {
    transactions.requireNoOuterTransaction();
    var claim = transactions.write(() -> operations.claim(operationId));
    if (claim == null) return;
    var outcome = provider.submitOrLookup(claim.operationKey(), claim.payload());
    transactions.write(() -> operations.reconcile(claim, outcome));
}
```

Stvarni kod normalizira transportne iznimke u uncertainty i obrađuje kvar pohrane rezultata. Recept pokazuje faze, ne implementira exception/retry/shutdown postupak.

## Ogradite worker ažuriranja bez odbacivanja stvarnosti

Notice reconciler ponovno zaključava stanje i provjerava stored lease owner te postojeći receipt. Kasni worker ne prepisuje običan ishod novog vlasnika. Ponovno provjerava i trenutačni binding. Neposredni unconfigured daje manual-verification-required; drugi rezultati ostaju uncertain, bez automatskog delivered receipta.

Document putanja ima namjernu nijansu: u pravilu odbija stari claim token, ali confirmed propušta u strožu original/evidence validaciju. Autoritativna kasna potvrda može opisivati stvarni vanjski učinak koji se ne smije izbrisati istekom worker leasea. Provjerava zadržanu autorizaciju, source/event identitet, original i konflikt. Zato ne generalizirajte ni „ignoriraj sve kasne odgovore” ni „prihvati svaki kasni HTTP uspjeh”.

Odredite dvije politike: tko mijenja scheduling/uncertainty stanje i koji autentificirani dokaz potvrđuje vanjsku stvarnost. Povezane su, ali nisu ista ovlast.

## Usklađujte s istim operation identitetom

Nakon nejasnog slanja lookup koristi zadržani ključ. Novi key može stvoriti drugi remote učinak i otežati istragu prvog. Document dispatcher šalje samo početni queued pokušaj, a kasnije traži authoritative lookup; idempotent-submit zastavica ne dokazuje dostupnost svih drugih načina.

Pad nakon remote uspjeha, a prije receipt commita, ostavlja oporavljivu operaciju preko istog identiteta i evidence protokola. Kvar pohrane rezultata u document orkestru pokušava zasebno postaviti uncertainty umjesto izmišljanja potvrde. Trajni receipt sprema se atomski s prihvaćenim prijelazom.

## Kvar i oporavak

Aktivan lease odgađa konkurentnog workera; istek daje mogućnost novog claima, ne dokaz odsutnog remote učinka. Izgubljen odgovor, nevaljan normalizirani podatak, promjena politike i konflikt source identiteta trebaju sigurne kodove i zaštićenu dijagnostiku.

Izbjegnite row lock tijekom mreže, obnovu mutable payloada, promjenu idempotency keya, caller confirmation flag i čišćenje novijeg receipta kasnim workerom. Manual verification zasebna je pregledana putanja, ne prečac pretvaranja unknowna u uspjeh.

## Kriteriji projekta

- Provider poziv ne radi pod orchestration/caller transakcijom.
- Pad na svakoj granici ostavlja oporavljiv identitet i značenje.
- Claimovi se serializiraju, a kasno obično ažuriranje ne prepisuje novog vlasnika.
- Autoritativni kasni dokaz slijedi eksplicitnu validaciju/konflikt.
- Retry/lookup čuva izvorni key i payload.
- Dupli/konfliktni eventi daju idempotentan receipt ili eksplicitan konflikt.
- Unconfigured/uncertain ne izmišlja konačni receipt.

## Točni izvori

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceNoticeService.java` — faze, vanjska transakcija, lease fence i receipt.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BillingDocumentService.java` — immutable payload, digest i key.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BillingProviderOperations.java` — odvojene transakcije, submit/lookup, claim-token nijansa, evidence i persistence uncertainty.
