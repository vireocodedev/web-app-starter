# Kvar operativne telemetrije držite izvan poslovnog rezultata

**Status podrške: Vireo referenca, nije ugrađena ovdje.** Odabrani query, relation-option, replay/queue i SSE publisheri izoliraju sinkrone listener runtime kvarove. Lifecycle ima drukčiji transakcijski ugovor. Primjena u RGO/Spring aplikaciji traži eksplicitne vlasnike/ovisnosti.

Obrazac koristite kad metric/log/export listener može pasti tijekom valjane operacije. Opcionalni sink ne treba pretvoriti primijenjenu radnju u client kvar koji potiče duplikat. Obvezni audit i lifecycle odluke odvojeni su.

## Usko čitajte granicu kvara

Query mjeri/klasificira, ponovno baca izvorni denied/rejected/error i objavljuje u `finally`. Publisher hvata `RuntimeException` sinkrone publikacije. Relation-option i Offline operational/SSE imaju slične catcheve.

To štiti rezultat od tog listener kvara, ne svakog JVM kvara, blokirajućeg listenera ili async dostave. Spor exporter i dalje dodaje latenciju. Kasniji async kvar pripada executor/handleru.

| Kvar                           | Vlasnik                                     |
| ------------------------------ | ------------------------------------------- |
| Domenske ovlasti/validacija    | Izvorna operacija i odgovor                 |
| Opcionalni sync metric runtime | Isolirani publisher/dijagnostika            |
| Blokirajući I/O                | Adapter timeout/queue                       |
| Async sink                     | Executor/retry/drop                         |
| Obvezni audit/lifecycle        | Eksplicitna poslovna/transakcijska politika |

Obvezno pisanje ne stavljajte u listener koji publisher namjerno tretira kao opcionalan.

## U `finally` sačuvajte izvorni ishod

**Pseudokod recepta:** projekt implementira neutralne događaje, publisher i zaštićenu dijagnostiku; helper nije ugrađen.

```java
var outcome = ReadOutcome.ERROR;
long started = System.nanoTime();
try {
    var result = reads.execute(command);
    outcome = ReadOutcome.SUCCESS;
    return result;
} finally {
    try {
        telemetry.publish(new ReadCompleted(outcome, System.nanoTime() - started));
    } catch (RuntimeException sinkFailure) {
        diagnostics.optionalSinkUnavailable();
    }
}
```

Izvor ima preciznije denied/rejected kategorije; uzorak pokazuje izolaciju. Ako konstrukcija eventa može pasti, uključite i nju u odabranu granicu. Ne zamjenjujte domain iznimku metric iznimkom niti logirajte cijeli zahtjev.

Transakcijsku neovisnost provjerite i u listeneru. Catch ne poništava nuspojavu ni rollback-only koji je pridruženi transaction listener postavio. Source catch nije dokaz protiv svakog custom listenera. Opcionalna telemetrija ne sudjeluje u business writeovima i ima bounded delivery.

## Lifecycle nema univerzalno isto pravilo

History/Offline lifecycle direktno objavljuje pri store/purge/erase/hold/quota. Nema isti wrapper, pa sync iznimka propagira prema Spring konfiguraciji. Event može prethoditi kasnijem rollbacku.

Odredite je li event mandatory audit, transakcijska integracija ili opcionalna metrika. Za metriku napravite safe adapter bez slabljenja retention odluke; za obvezni dokaz definirajte kvar/oporavak umjesto swallow-all.

Micrometer bridge ne instalira exporter ni queue plafon. Aplikacijski registry/handler može dodati blokiranje/kvar; bean je ponašajna promjena za pregled.

## Kvar i oporavak

Gubitak opcionalne telemetrije čuva autoritativni ishod. Sink health prijavite zasebno; ne ponavljajte naredbu radi metrike. Drop/retry/backpressure nema privatne label ID-eve ili dump.

Kad operacija padne, čuvajte taj kvar i ako publisher padne. Lifecycle mandatory kvar ima vlastiti rollback/retry. Metric uspjeh nije business receipt.

## Prilagodba i kriteriji

- Najprije razdvojite optional i mandatory obitelji.
- Sačuvajte izvornu success/error granicu.
- Latencija/queue/retry imaju zasebne granice.
- Optional listener ne mijenja business transakciju.
- Async kvar ima vlastiti lifecycle.
- Direct lifecycle/rollback semantika ostaje točna.
- Nedostajuća telemetrija ne uzrokuje rerun naredbe.

## Točni izvori

- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-core/src/main/java/com/vireocode/vireo/base/CrudLifecycleSupport.java` — finally i runtime izolacija.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-query/src/main/java/com/vireocode/vireo/queryengine/QueryEngineRelationOptionService.java` — outcome/publisher.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-offline/src/main/java/com/vireocode/vireo/offline/OfflineSyncService.java` i `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-offline/src/main/java/com/vireocode/vireo/offline/OfflineHeartbeatService.java` — replay/queue/SSE.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-history/src/main/java/com/vireocode/vireo/history/HistoryDataLifecycleService.java` — direct lifecycle kontrast.
