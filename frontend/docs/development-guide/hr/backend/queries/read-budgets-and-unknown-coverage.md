# Ograničite rad čitanja i pošteno prijavite nepoznatu pokrivenost

**Status podrške: referentni recept potkrijepljen izvorom.** Client Discovery attention servis spaja domenske činjenice uz eksplicitne budžete i coverage stanja. Nije ugrađeni dashboard framework predloška. Brojčane granice peer su politika koju projekt prilagođava vlastitim domenama i cijeni upita.

Koristite obrazac kad dashboard čita više domena, ugniježđena povijest raste ili spor izvor ne treba ukloniti sve ostale činjenice. Budgeted rezultat može biti koristan i nepotpun; „nije provjereno” nikad ne smije postati „nema potrebnih radnji”.

## Činjenice i pokrivenost odvojeni su izlazi

Izvor registrira po jednog contributora poznate vrste, provjerava deklarirane radnje te slaganje scopea i destinationa. Domenski vlasnik odgovara za ovlasti, prihvatljivost i činjenice. Agregator sastavlja čitanja; ne izvršava naredbe kartica niti inicijalizira nedostajuće stanje.

| Coverage stanje | Značenje ugovora                                          |
| --------------- | --------------------------------------------------------- |
| COMPLETE        | Definirana projekcija izvora potpuno je provjerena        |
| PARTIAL         | Dio provjerenih redaka uz eksplicitan razlog nepotpunosti |
| NOT_IMPLEMENTED | Nema contributora tog izvora                              |
| NOT_APPLICABLE  | Izvor je izričito izvan trenutačnog slučaja               |
| UNAVAILABLE     | Čitanje izvora nije uspjelo                               |
| WITHHELD        | Podaci se namjerno uskraćuju                              |
| UNKNOWN         | Potpunost nije potvrđena, uključujući iscrpljen budžet    |

Ukupni odgovor potpun je tek kada svi izvori zadovolje completeness pravilo; NOT_APPLICABLE može se računati potpunim, a unknown/unavailable ne. Prazni redci uz unknown nisu zeleni dashboard. Objašnjenje ostaje vidljivo umjesto skrivanja izvora kao da nema posla.

## Koristite više od page-size granice

Servis stvara monotoni ukupni budžet preko `System.nanoTime`, s rokom deset sekundi. Svaki izvor čita u novoj read-only REPEATABLE READ transakciji s timeoutom dvije sekunde. Ograničava i retke izvora na 1000, ukupno 10000, uz eksplicitnu truncation oznaku. To su opažene odluke, ne defaulti predloška.

Rok je kooperativan, ne jamstvo prekida proizvoljnog rada točno nakon deset sekundi. Contributori ga provjeravaju u petljama; JDBC timeout i cancellation ovise o stvarnoj putanji izvršavanja. Odvojene transakcije daju dosljednost pojedinog izvora, ne globalni snapshot dashboarda.

`ServiceAttentionReadBudget` dodaje ranije sentinele: provjerava prelazi li kolekcija ograničeni offset, mjeri ugniježđene JSON nizove prije dubljeg parsiranja i ograničava povezane receipt obilazke. Bez toga „najviše 20 kartica” može zahtijevati neograničenu povijest ili ogroman metadata objekt.

## Sačuvajte provjerene djelomične činjenice bez potvrde ostatka

Izvor provjerava cancellation prije svakog contributora i nakon čitanja. Iscrpljen rok obično daje UNKNOWN umjesto kasne COMPLETE tvrdnje. Eksplicitno podržava provjeren PARTIAL rezultat s budget-exhausted razlogom kako bi ranije potvrđene činjenice ostale, a neobiđeni ostatak ostao necertificiran. Redci i dalje prolaze source/action/scope/destination validaciju.

**Pseudokod recepta:** budžet, contributor rezultat, coverage encoder, classifier pogrešaka i transaction helper implementira projekt; nisu API-ji predloška.

```java
for (var source : sources) {
    budget.checkCancellation();
    if (budget.exhausted()) {
        coverage.add(unknown(source, "READ_BUDGET_EXHAUSTED"));
        continue;
    }
    try {
        var result = reads.inFreshBoundedTransaction(() -> source.read(context));
        budget.checkCancellation();
        results.retainVerified(result, budget);
    } catch (RecoverableSourceFailure failure) {
        failures.rethrowCancellationOrAuthority(failure);
        coverage.add(unavailable(source));
    }
}
```

Catch pripada izvan transaction izvršavanja: neuspjela PostgreSQL transakcija treba završiti rollback prije nastavka agregatora. Contributor ne deklarira proizvoljan URL ili radnju samo radi navigacije; tipizirani destination mora odgovarati scopeu činjenice.

## Cancellation i ovlasti moraju preživjeti degradaciju

Discovery obilazi uzroke zamotanih pogrešaka prije recoverable klasifikacije. Ponovno baca cancellation, vraća thread interrupt zastavicu pri `InterruptedException` i propušta authentication, access-denied te HTTP status iznimke. 403 ne postaje bezazlen nedostajući odjeljak. Caller cancellation ne postaje UNAVAILABLE nakon kojeg se nastavlja skupi rad.

Izvor hvata definirane data-access, timeout i source-read kvarove te contract violation kao unavailable rezultat. To nije preporuka hvatanja svakog `Throwable` i nastavka. Neočekivani programski kvar treba dijagnostiku i namjernu obradu; sirova poruka iznimke nije javno coverage objašnjenje.

## Kvar, oporavak i anti-patterni

Pri prekoračenju budžeta vratite obrazloženo unknown/partial stanje i omogućite otvaranje vlasničkog ograničenog pogleda ili definirani retry. Ne izmišljajte nula totale, ne uklanjajte nedostupan izvor i ne izvršavajte repair naredbu iz read putanje. Novi retry nova je opažena činjenica, ne dokaz da je stari djelomični rezultat bio potpun.

Izbjegnite neograničene nested obilazke, wall-clock trajanja budžeta, gutanje interrupta i pretvaranje svih kvarova u prazne redove. COMPLETE ne deklarirajte prije validacije svega potrebnog: pokrivenost je dokaz, ne optimističan prikaz.

## Kriteriji za buduću implementaciju

- Nedostajući contributor, kvar izvora i iscrpljen budžet daju različita stanja.
- No-data/COMPLETE vidljivo se razlikuje od no-data/UNKNOWN ili UNAVAILABLE.
- Nested guard zaustavlja skupi rad prije neograničenog parsiranja/obilaska.
- Cancellation i wrapped interrupt prekidaju rad; zabrana ostaje zabrana.
- Provjeren djelomični rezultat ostaje samo uz istinitu nepotpunost i valjan destination.
- Kvar source transakcije završava rollback prije sljedećeg izvora.
- Granice/rokovi politika su projekta bez tvrdnje globalnog snapshota ili hard preemptiona.

## Točni izvori

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/AttentionService.java` — contributor validacija, ograničena odvojena čitanja, partial i failure obrada.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/AttentionModel.java` — coverage, row plafoni i monotoni/cancellation budžet.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/AttentionContributor.java` — izvorne ovlasti/činjenice i recoverable kvar.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceAttentionReadBudget.java` — count/nested-array sentineli prije dubljeg rada.
