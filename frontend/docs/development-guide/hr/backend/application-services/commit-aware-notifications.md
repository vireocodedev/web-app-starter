# Obavijestite klijente nakon commita i navedite granice isporuke

**Status podrške: referentni recept uz ograničenja starije implementacije.** LMS u memoriji grupira Server-Sent Events i šalje nakon transakcijskog commita, uz rollback i lifecycle čišćenje. Predložak nema ugrađen SSE feature, distribuirani event bus ili trajni outbox. Ispravan trenutak slanja i trajna isporuka različita su jamstva.

Koristite obrazac kad promjena treba osvježiti druge otvorene poglede bez prikaza poništenih promjena. Najprije odredite je li obavijest best-effort invalidation hint ili poslovna poruka koja mora preživjeti pad procesa. Ta odluka određuje je li in-memory after-commit callback dovoljan.

## Objasnite stvarni transakcijski životni ciklus

LMS `SseService` dodaje payload u thread-local batch i objavljuje flush event kad kontekst smatra da flush nije zakazan. `SseBatchPublisher` u `AFTER_COMMIT` šalje batch, a u `AFTER_ROLLBACK` uklanja kontekst. Uspješan database flush nije ista trajna poslovna činjenica kao commit.

Commit listener koristi `fallbackExecution = true`: objava izvan transakcije može se izvršiti odmah. Servis ima i eksplicitnu no-active-transaction flush putanju. To su stvarna ponašanja za pregled pri prilagodbi; izvor ne znači „obavijest nije moguća bez commita” niti scheduling flag dokazuje exactly-once dispatch.

| Granica                     | Što potvrđuje                                |
| --------------------------- | -------------------------------------------- |
| Dodano u memory batch       | Proces/thread trenutačno drži payload        |
| AFTER_COMMIT listener       | Povezana database transakcija potvrđena je   |
| Dispatch predan executor-u  | Rad je predan u ovom procesu                 |
| Uspješan emitter send       | Poslužitelj je uspješno pokušao stream write |
| Klijent primijenio promjenu | Zasebna činjenica, nedokazana prethodnim     |

Projekt bira dopušta li objavu bez transakcije. Progress/heartbeat hint može biti neovisan o poslovnoj transakciji, dok „odobreno” obično zahtijeva potvrđenu vlasničku radnju. Različita značenja mogu trebati različite ulaze.

## Mali recept prilagodbe

Za preimenovanje zapisa autorizirani invalidation hint može biti sigurniji od broadcasta cijelog privatnog DTO-a. Slijedi **pseudokod recepta**, ne klase predloška. Implementirajte event tip, žive ovlasti, transakcijskog vlasnika zapisa, recipient politiku i transport.

```java
@Transactional
public void rename(UUID recordId, Rename command, Authentication auth) {
    var actor = actors.requireCurrent(auth);
    records.renameAuthorized(recordId, command, actor);
    events.publishEvent(new RecordViewChanged(recordId));
}

@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
public void afterCommit(RecordViewChanged event) {
    liveUpdates.invalidatePermittedViews(event.recordId());
}
```

Recept namjerno izostavlja fallback; dodajte ga samo eksplicitnom odlukom. Izostanak ne opisuje LMS postavku. Primatelj ponovno dohvaća obični autorizirani read model, pa primljeni ID ne zamjenjuje provjeru pristupa. Čak i ID traži recipient scope kada je postojanje resursa privatno.

## Thread-local batch traži potpuno vlasništvo čišćenja

Izvorni holder pri clear koristi uklanjanje `ThreadLocal`. Rollback listener ga čisti; MVC interceptor registriran na API putanje čisti nakon završetka zahtjeva; scheduled-method aspekt čisti nakon scheduled rada. `flushBatch` čisti poruke i scheduling flag. Putanje postoje jer pool thread kasnije obrađuje nepovezan rad.

Projekt mora pokriti vlastite async jobove, iznimke i non-HTTP ulaze, ne pretpostaviti da ih HTTP interceptor doseže. Obični ThreadLocal ne prelazi automatski na drugi executor thread. Nested neovisne transakcije istog threada također traže namjerni batch model; thread nije univerzalno jedna transakcija. Pregledajte finally-ekvivalentne putanje i odvojite batch vlasništvo od dispatcha.

## Ograničite transport i ponovno provjerite ovlasti

LMS uklanja emitter na completion, timeout i error te nakon send iznimke. Dispatch koristi cached executor, a subscriberi žive u memoriji. Pregledani izvor ne dokazuje bounded sender queue ni distribuirani subscriber registry. Novi projekt mora odrediti kapacitet, shutdown/backpressure i replike prije tvrdnje operativne spremnosti.

Izvor sprema subscriber principal pri registraciji i filtrira prema tom pogledu. To ne dokazuje živi opoziv članstva pri svakom slanju. Definirajte zatvaranje pretplate ili suppress kasnijih događaja nakon promjene ovlasti. Dugotrajna veza ne zadržava pravo samo zato što ga je imala pri otvaranju.

## Kvar i oporavak

Proces može pasti nakon commita, a prije dispatcha; klijent može prekinuti vezu nakon slanja. Memory batch nestaje restartom, a pregledani initial-events hook nema trajni replay. Kada je to odabrani ugovor, događaje tretirajte kao hint i na reconnectu uskladite autoritativnim čitanjem.

Poruka koja mora preživjeti pad traži trajnu namjeru uz mutaciju, worker, retry, vlasništvo, idempotentnost i receipt. Outbox/operation dizajn dodatni je rad. Beskonačan retry after-commit mrežnog poziva ne stvara ga i može duplicirati poruke bez dokaza primitka.

## Kriteriji za buduću implementaciju

- Rollback ne daje committed-success hint; commit se razlikuje od flusha.
- Objavu bez transakcije određuje eksplicitna politika, uključujući fallback.
- Svaki završetak zahtjeva/joba čisti batch prije ponovne uporabe threada.
- Disconnect, timeout i send kvar uklanjaju neuporabljiv emitter.
- Opozvani primatelj gubi sljedeće hintove/payload prema definiranoj politici.
- Restart/reconnect oporavlja se autoritativnim čitanjem ili stvarnim persisted replay ugovorom.
- Memory obavijest dokumentirana je kao best-effort; trajnost se tvrdi tek uz implementiranu trajnu isporuku.

## Točni izvori

- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/sse/SseBatchPublisher.java` — commit, rollback i fallback semantika.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/sse/SseBatchContextHolder.java` i `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/sse/SseBatchContext.java` — thread-local i batch zastavice.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/sse/SseBatchCleanupInterceptor.java` i `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/core/WebConfig.java` — request cleanup i registracija interceptora.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/sse/ScheduledSseCleanupAspect.java` — scheduled cleanup.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/sse/SseService.java` — batching, no-transaction flush, emitter lifecycle, executor i recipient granice.
