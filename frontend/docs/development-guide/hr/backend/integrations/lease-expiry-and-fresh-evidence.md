# Istek leasea ostaje neizvjesnost do svježeg dokaza

**Status podrške: potkrijepljen recept za projekt.** FRED oporavlja isteklu pripremu tek nakon svježeg prihvaćenog inactive dokaza i provjere vlasništva. Predložak nema lease registar, freshness politiku uređaja ili takeover API. Brojke u nastavku objašnjavaju peer izvor, ne default svake integracije.

Obrazac koristite kad operator priprema remote rad, lease istječe dok vanjski sustav možda nastavlja ili novi worker odlučuje smije li preuzeti. Lokalni timer dokazuje proteklo vrijeme, ne vanjsku neaktivnost ni opoziv starog učinka.

## Odredite što lease posjeduje

FRED PREPARED sesija rezervira resource/controller/operator vezu prije opažene aktivnosti. Priprema traje 300 sekundi i može se obnoviti istom autoriziranom vlasniku. ACTIVE je drugo stanje koje preparation-expiry pravilo ne završava.

Trenutačni operator može ponovno koristiti svoju pripremu uz točan resource/controller match; drugi je ne preuzima samo zbog starog timestampa. Servis pri novoj pripremi provjerava trenutačni resource/area/company i unmanaged aktivnost. Vrijeme je samo jedan predikat šireg protokola.

| Pitanje                               | Potreban dokaz                            |
| ------------------------------------- | ----------------------------------------- |
| Je li rok prošao?                     | Server-owned sat i deadline               |
| Je li remote resurs neaktivan?        | Prihvaćeno eksplicitno inactive opažanje  |
| Slijedi li opažanje isteklu pripremu? | Event vrijeme iza dopuštenog skew prozora |
| Je li još svježe?                     | Ograničena starost i future-skew          |
| Smije li akter stvoriti zamjenu?      | Trenutačne ovlasti i resource binding     |

Nepoznato ili nedostajuće stanje nije explicit false.

## Peer predikate čitajte zajedno

Oporavak traži PREPARED, istu trenutačnu tvrtku, sadašnje vrijeme nakon deadlinea plus pet sekundi i eksplicitni false. Prihvaćeno opažanje mora biti iza tog cutoffa, staro najviše 90 sekundi i najviše pet sekundi ispred poslužitelja. Tek tada priprema postaje ENDED uz zadržano opaženo vrijeme.

To su peer brojke. Dodatni cutoff isključuje dopušteni future clock prozor, a age provjera sprječava drevni inactive dokaz sadašnjeg stanja. Projekt izvodi vlastiti skew, age, trajanje i assurance zahtjev iz domene i transporta.

Obnova mijenja relevantan deadline. Dokaz prije obnovljenog isteka ne opravdava takeover samo zato što bi vrijedio prema izvornom roku. Efektivni deadline neka bude eksplicitan, ne različito izračunat kod više pozivatelja.

## Recept politike oporavka

Slijedi **pseudokod**, ne helper predloška. Projekt implementira trusted evidence store, žive ovlasti, zaključani operation/resource repozitorij, sat i pregledane konstante. Eventualna manual escalation zasebna je implementacija i autorizacija.

```java
boolean mayRetirePreparation(Operation prior, Evidence latest, Instant now) {
    var cutoff = prior.preparationDeadline().plus(policy.allowedFutureSkew());
    return prior.isPrepared()
        && latest.sameResourceAndScope(prior)
        && latest.isExplicitlyInactive()
        && now.isAfter(cutoff)
        && latest.observedAt().isAfter(cutoff)
        && !latest.observedAt().isBefore(now.minus(policy.maxEvidenceAge()))
        && !latest.observedAt().isAfter(now.plus(policy.allowedFutureSkew()));
}
```

Provjeru izvršite pod istom zaštićenom granicom kao retirement/replacement. Cacheirani UI rok i active indikator nisu autoritet. Ubrizgajte `Clock` u vremenski ovisnu domenu poput preparation servisa izvora kako granica ima jednog vlasnika i ne ovisi o pretpostavci workstation vremena.

## Lease nije univerzalni fencing token

Recept uređuje preparation recovery iz opažanja. Ne dokazuje da vanjski sustav odbija naredbe prethodnog vlasnika. Ako stari worker još može djelovati, novi dizajn možda treba vanjsku fencing generaciju, idempotency ugovor ili izričit operator oporavak. Timestamp nije potpuno distribuirano jamstvo vlasništva.

Povezivanje dokaza jednako je strogo: svjež inactive druge tvrtke, controllera ili resursa ne potvrđuje ovu operaciju. Store provjerava scope/controller prije promjene stvarnosti sesije, a recovery ponovno gleda spremljenu tvrtku. Predikati surađuju; kopiranje samo deadline retka gubi sigurnosni argument.

## Kvar i oporavak

Kad lease istekne bez dovoljno novog inactive dokaza, zadržite nerazriješeno stanje i objasnite da oporavak blokira dokaz, ne countdown. Ponudite autorizirano usklađivanje ili eskalaciju kada postoji. Ne čistite vlasništvo automatski i ne zovite nedostatak telemetryja „stopped”.

Predalek future dokaz, zastarjelost i drugi scope ne zadovoljavaju takeover. Mrežni prekid može usporiti oporavak baš zato što je neaktivnost nepoznata. To je pošten kompromis dostupnosti, ne razlog izmišljanja uspjeha.

## Kriteriji projekta

- Istek sam ne prenosi vlasništvo ni završava ACTIVE.
- Nedostajući, unknown, stari, pre-cutoff i wrong-scope dokaz ne dopuštaju oporavak.
- Svjež explicit inactive iza efektivnog cutoffa dopušta samo definirani tok.
- Same-owner renewal čuva identitet i poništava stare cutoff pretpostavke.
- Skew granice slijede imenovanu politiku i jedan ubrizgani sat.
- UI razlikuje isteklu pripremu i dokazanu neaktivnost.
- Dokumentacija navodi postoji li external fencing umjesto zaključivanja iz database leasea.

## Točni izvori

- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/session/LivestreamSessionService.java` — trajanje, obnova, expiry/freshness i sat.
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/persistence/DroneObservationStore.java` — prihvaćeni scope/controller dokaz i inactive stanje.
