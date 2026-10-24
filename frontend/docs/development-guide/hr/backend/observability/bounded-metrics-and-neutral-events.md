# Emitirajte neutralne evente i ograničite metric dimenzije

**Status podrške: Vireo observability referenca, nije ugrađena ovdje.** Vireo daje strukturirane događaje i opcionalne Micrometer bridgeove. Primjena traži module i wiring; Spring projekt može implementirati vlastitu granicu. Ne implicira vendor ili meter backend.

Obrazac koristite za query/replay/lifecycle telemetriju. Ishod, broj i trajanje korisni su bez identiteta, URL-a, pretrage i payloada. Dimenzije ostaju ograničene i kad se privatna vrijednost hashira.

## Kategorije odvojite od mjerenja

Query event ima outcome enum, searched/filtered boolean, result count i nanosekunde uz nonnegative validaciju. Offline ima operation/outcome, count/duration. Lifecycle nosi operation i affected/held, bez partition/actor ID-a.

| Podatak                           | Uloga ugovora                       |
| --------------------------------- | ----------------------------------- |
| Fiksni enum                       | Low-cardinality tag                 |
| Search/filter boolean             | Low-cardinality tag                 |
| Broj/nanosekunde                  | Numeričko mjerenje                  |
| Actor, tenant, entity, command ID | Isključeni iz framework eventa/taga |
| URL, poruka iznimke, upit/payload | Isključeni, ne novi tag             |

Hash tenant ID-a i dalje ima vrijednost po tenantu, ne rješava kardinalnost ili anonimizaciju. Slobodan „reason” nije bounded jer je kratak.

## Sačuvajte značenje vremena

Query koristi `System.nanoTime` i `finally`, uz success/denied/rejected/error. Broj je veličina vraćene stranice, ne svih matching redaka. Relation-option event ima vlastiti count i search-presence.

**Pseudokod recepta:** projekt implementira enum/sheme, publication, diagnostic politiku i metrics adapter. Helperi nisu ugrađeni.

```java
record ReadCompleted(ReadOutcome outcome, boolean searched,
                     long returnedCount, long elapsedNanos) {}

void record(ReadCompleted event) {
    counters.increment("records.read", "outcome", event.outcome().name());
    measurements.record("records.read.duration", event.elapsedNanos());
    measurements.record("records.read.returned", event.returnedCount());
}
```

Odredite jedinicu i adapter. Proposed helper nije dokaz automatskog framework histograma.

## Registry ne instalira backend

Auto-config stvara bridge samo uz `ObservationRegistry` class/bean. Bez njega događaji ostaju. Aplikacija bira implementaciju, exporter, sampling, retention i pristup; biblioteka ne provisiona servis.

Bridge radi low-cardinality observation oko praznog completion callbacka. Ne čita event `durationNanos`/count u histogram. Njegovo kratko callback vrijeme nije cijela query/replay latencija. Izvorno mjerenje aplikacija mora namjerno potrošiti.

Bridge ni ne stvara distribuirani span originalnog DB zahtjeva retroaktivno. Ako tracing treba, korelaciju definirajte na operation granici uz siguran vocabulary.

## Kvar i oporavak

Nedostupan metric adapter prati failure-isolation ugovor, ne mijenja business ishod. Lifecycle ima drukčiju transakciju; nije svaki event disposable. Sink kvar bilježite bounded dijagnostikom bez dodavanja privatnog zahtjeva.

Pri cardinality rastu provjerite listener enrichment. Neutralni event s kasnije dodanim actor ID-om gubi smisao. Nedostajuće mjerenje ostaje unknown, ne izmišljena nula/success.

Izbjegnite entity-specific imena, URL s ID-em, search tag i exception poruku. Count kao label stvara novu seriju za svaku brojku.

## Prilagodba i kriteriji

- Fiksni enum/boolean i jasna measurement semantika.
- Nema privatnih vrijednosti ni u downstream enrichmentu.
- Returned/total i original/callback trajanje razlikuju se.
- Registry/exporter, retention i ovlasti pripadaju aplikaciji.
- Histogram izričito koristi strukturirano mjerenje.
- Failure odgovara event/transaction ugovoru.
- Referenca ne implicira tracing backend ili instalaciju.

## Točni izvori

- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-core/src/main/java/com/vireocode/vireo/observability/QueryExecutionObservationEvent.java` — polja i validacija.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-offline/src/main/java/com/vireocode/vireo/offline/OfflineObservationEvent.java` — enum obitelji.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-history/src/main/java/com/vireocode/vireo/history/HistoryDataLifecycleEvent.java` — operation i aggregate brojevi.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-core/src/main/java/com/vireocode/vireo/base/CrudLifecycleSupport.java` — query vrijeme i page count.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-core/src/main/java/com/vireocode/vireo/config/CoreMicrometerObservations.java` — tagovi i empty callback.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-core/src/main/java/com/vireocode/vireo/config/StarterCoreAutoConfiguration.java` — conditional registry.
