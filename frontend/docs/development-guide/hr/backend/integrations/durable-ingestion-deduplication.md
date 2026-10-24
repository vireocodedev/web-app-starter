# Deduplirajte trajne učinke, ne samo primljene poruke

**Status podrške: potkrijepljen recept za projekt.** FRED spaja ograničeni ingress cache, deterministične spremljene identitete, zaključano stanje i vremenske watermarkove. Predložak nema taj ingestion sustav ni MQTT/Jackson ovisnosti. Projekt implementira vlastiti trajni event/state ugovor.

Obrazac koristite kad broker, webhook ili polling feed šalje isti događaj više puta ili izvan redoslijeda. „Handler je radio dvaput” očekivano je transportno ponašanje; „isti događaj napravio je dvije poslovne promjene” kvar je koji sprječavamo.

## Razlikujte tri identiteta

Ingress determinističan ID računa iz topica i raw JSON teksta. Uspješno rukovanje stavlja ga u ograničeni cache 10.000 stavki, pa identični redelivery preskače rad opažanja. Identitet ovisi o tekstu: drukčije formatiran JSON nije automatski isti semantički događaj. Veličina cachea peer je politika, ne univerzalni default.

Store trajni identitet izvodi iz vrste opažanja, serial reference i event ID-a. Telemetry prije inserta provjerava spremljeni primarni identitet. Resurs zadržava i zadnje prihvaćeno vrijeme. To preživljava restart, za razliku od ingress cachea.

| Mehanizam             | Uloga                                  | Ograničenje                              |
| --------------------- | -------------------------------------- | ---------------------------------------- |
| Memory message cache  | Manje rada za nedavno identičan ulaz   | Restart, eviction i process-local stanje |
| Trajni observation ID | Identitet istog poslovnog opažanja     | Stabilno značenje i provedba u bazi      |
| Resource watermark    | Staro opažanje ne vraća stanje unatrag | Pravila izjednačenja i source satova     |

Kad izvor daje pouzdan event ID s određenim unique scopeom, koristite ga. Hash sadržaja koristan je, ali nije automatski poslovni identitet; retry s promijenjenim sadržajem može zahtijevati konflikt, ne drugu radnju.

## Serializirajte zaštićeni učinak resursa

Store zaključava odobren kanonski resurs i osvježava ga prije trenutačnog vlasništva/stanja. Telemetry odbija duplikat i opažanje koje nije novije od relevantnog telemetry/end vremena. Livestream čuva resource watermark i provjerava trajni stream ID kako redelivery nakon restarta ne bi otvorio zatvoren stream.

Invarijanta nije samo „insert jednom”. Stari active događaj ne smije reaktivirati nakon novijeg inactive dokaza; duplikat ne smije stvoriti novi parent lifecycle jer je ranije dijete zatvoreno. Parent, child i prijelaz pregledajte zajedno pod transakcijom.

**Pseudokod recepta:** event/resource repozitorije, ordering politiku i rezultate implementira projekt. Prije primjene dodajte unique constraint u stvarnu Flyway shemu, kanonsku mapu, ovlasti, replay/conflict politiku i transakcije.

```java
@Transactional
public IngestionResult accept(Observation observation) {
    var resource = resources.lockApproved(observation.resourceRef());
    if (events.sameIdentityExists(observation.identity())) return duplicate();
    if (!ordering.isNewer(observation, resource.watermark())) return obsolete();
    events.insertUnique(observation);
    resource.apply(observation);
    resource.advanceWatermark(observation.position());
    return applied();
}
```

Poredak je namjerno apstraktan: neki izvori imaju sequence/revision jači od timestampa. Relevantne FRED putanje traže strogo novije vrijeme; jednako vrijeme može se ignorirati. To ne preuzimajte tiho za izvor s različitim događajima istog vremena.

## Odvojite protokolski odgovor i duplirani učinak

FRED odgovara obveznim status/event porukama prije cache provjere, pa i duplikat dobiva potreban odgovor. Nedostajući odgovor inače potiče beskonačno ponavljanje ispravno deduplirane promjene.

Odgovor prethodi trajnoj pohrani i nije database-commit acknowledgment. Protokol to možda traži; novi adapter izričito navodi znači li odgovor primitak, prihvat obrade ili commit. Izgubljen odgovor nakon commita legitimno može izazvati retry primijenjenog događaja.

Cache se puni nakon uspješnog accept završetka. To ne znači da je svaki podržani envelope stvorio database red: neki ažuriraju presence ili su namjerno ignorirani. Cache completion opišite precizno umjesto naziva autoritativnog trajnog inboxa.

## Kvar i oporavak

Pri persistence kvaru dopustite rollback i predviđeni retry. Memory completion ne postavljajte prije uspjeha trajne granice. Konkurentni unique insert oporavlja se tek nakon završetka neuspjele transakcije prema ograničenoj politici.

Nakon restarta replay daje isti trajni učinak i čuva najnovije stanje. Isti trusted event ID s različitim sadržajem traži konflikt/quarantine, ne last-write-wins. Cache hit ne preskače obvezni odgovor niti trajno zamjenjuje approval resursa.

Izbjegnite distribuirani exactly-once zaključak iz synchronized metode, memory seta ili jedne replike. Ispravnost dolazi iz trajnog identiteta, transakcija/ograničenja i resource ordering pravila.

## Kriteriji projekta

- Identična dostava prije i nakon restarta daje jedan trajni učinak.
- Eviction mijenja cijenu, ne ispravnost.
- Staro active opažanje ne poništava novije inactive stanje ni zatvoreni lifecycle.
- Jednako vrijeme i konflikt sadržaja imaju eksplicitnu politiku.
- Duplikat dobiva obvezni odgovor s poštenim acknowledgment značenjem.
- Kvar pohrane ne puni completion cache niti ostavlja djelomičan parent/child.
- Konkurentni zapisivači slijede database unique i lock protokol, ne memoriju jednog procesa.

## Točni izvori

- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/protocol/DroneMessageIngress.java` — raw identitet, cache, completion i odgovori prije deduplikacije/pohrane.
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/persistence/DroneObservationStore.java` — trajni ID, lockovi, watermark i restart-safe lifecycle.
