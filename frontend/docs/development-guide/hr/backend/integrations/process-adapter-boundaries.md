# Podproces tretirajte kao ograničen integracijski adapter

**Status podrške: legacy usporedba uz eksplicitan hardening recept.** FRED Python bridge pokreće modul algoritma i parsira tipizirane retke. Pregledani izvor nema deadline, cancellation propagaciju, bounded output ni zajamčen process cleanup. To je novi rad pouzdanog adaptera, ne dokazane mogućnosti peera. Vodič ne ugrađuje Python podršku u predložak.

Obrazac koristite kad postojeći compute alat ostaje izvan Java procesa. Aplikacija posjeduje tipiziranu operaciju, adapter setup, protokol, resurse i kvar. CLI koji vraća malo JSON-a još nije pouzdan job servis.

## Sačuvajte korisnu granicu bez kopiranja praznina

Izvor ima argument/result tipove, spaja non-null dodatne argumente, gradi `ProcessBuilder` listu i pokreće `python3 -m` odabranog modula. Stdout čita po retku, prepoznaje prefix klase i JSON te mapira na result tip. `processResults` zove samo na exit code nula.

Stderr spaja u stdout. To drenira jednu cijev, ne daje odvojenu ograničenu stderr klasifikaciju i sigurno zadržavanje dijagnostike. Čeka bez roka i hvata iznimke vraćajući dotad skupljene rezultate. Nonzero exit zato može vratiti nepraznu listu; caller iz podataka ne zaključuje uspjeh.

| Opaženo                                | Zahtjev novog projekta                                      |
| -------------------------------------- | ----------------------------------------------------------- |
| Argument lista umjesto shella          | Allowlist executable/modula/opcija i zaštićen direktorij    |
| Tipiziran prefixed red                 | Verzija sheme, line/count/byte plafoni i malformed politika |
| Spojeni stdout/stderr                  | Ograničeno čitanje i sigurno označavanje dijagnostike       |
| `waitFor()`                            | Deadline, interrupt/cancellation i termination eskalacija   |
| Povrat skupljenih podataka nakon kvara | Eksplicitan ishod bez slučajnog partial uspjeha             |

Source logging cijelih argumenata i izlaza nije generička preporuka. Mogu nositi privatni payload i credentials; odaberite dopušteni diagnostic sažetak i correlation ID.

## Dizajnirajte mali protokol i ugovor ishoda

Hipotetski analysis worker treba input shemu/verziju, output zapise, completion marker ili exit semantiku te politiku partial rezultata. Diagnostic red nije domena samo zato što izgleda kao JSON. Oversized, nevaljane, unexpected-version i suvišne zapise odbijte prije neograničenog skupljanja.

Slijedi **pseudokod recepta**, ne gotov starter runner. Projekt implementira command allowlist, bounded readere, executor/process lifecycle, cancellation, parser i tipizirane pogreške te kroz setup vlasnika priprema vanjski runtime/ovisnosti.

```java
public ComputeOutcome run(ComputeInput input, Cancellation cancellation) {
    var command = commands.fromValidatedInput(input);
    var deadline = clock.instant().plus(policy.maxRuntime());
    var process = processes.start(command);
    try (var capture = output.startBoundedCapture(
            process, policy.outputLimits(), deadline, cancellation)) {
        var exit = processes.awaitUntil(process, deadline, cancellation);
        return protocol.requireCompleteSuccess(exit, capture.awaitUntil(deadline));
    } finally {
        processes.terminateAndReapIfAlive(process, policy.cleanupDeadline());
    }
}
```

Capture helper mora stvarno drenirati stdout/stderr konkurentno dok proces radi, pod istim ukupnim rokom; naziv nije implementacija. I/O i nadzor dizajnirajte zajedno, uključujući potomke gdje OS/runtime traži.

## Odvojite process ovlast i database stanje

Executable/module i radni direktorij server konfiguracija su, ne request shell ili putanja. Lista argumenata izbjegava shell interpolaciju, ali ne čini svaku opciju sigurnom niti sprječava programsku interpretaciju opasnog argumenta. Validirajte domenske vrijednosti i tajne držite izvan izloženog CLI-ja kad je moguće.

Dugi compute radi izvan database transakcija i resource lockova. Kad treba reproducibilnost, zadržite input/verziju/digest i operation ID pa provjeren rezultat spremite kratkom autoriziranom transakcijom. Completion riječ nije pravo pisanja bilo kojeg workspacea iz payloada.

Python, native biblioteke i moduli zasebna su setup obveza. Članak ne autorizira instalaciju, proizvoljnog workera ni produkcijsku izolaciju. Resource limiti, filesystem/network i identitet izvršavanja trebaju operativnu odluku prema workloadu.

## Kvar i oporavak

Timeout, cancellation, nonzero exit, malformed protokol i missing completion eksplicitni su ishodi. Pri prevođenju interrupta vratite zastavicu, prekinite čitanje i bounded politikom završite/reapajte vlastiti proces. Caller disconnect ne smije ostaviti orphan worker.

Ako partial nije domenski prihvaćen, zadržite ga samo kao ograničenu zaštićenu dijagnostiku i označite kvar. Alat s nepovratnim učincima prije kvara traži uncertainty/idempotency, ne slijepi rerun. Čisti deterministični compute i skripta koja radi remote upload različiti su ugovori oporavka.

## Kriteriji projekta

- Caller ne bira proizvoljan executable, modul, direktorij ili shell fragment.
- Hung proces i blocked reader poštuju ukupni rok/cancellation.
- Stdout/stderr, golemi retci i previše rezultata ne rastu bez granice.
- Nonzero, missing/malformed i partial ne izgledaju kao complete uspjeh.
- Sve putanje zatvaraju streamove i završavaju/reapaju proces po potrebi.
- Dijagnostika ne dumpa tajne i cijele payloade.
- Persistencija prihvaća samo valjan rezultat autoriziranog operation scopea.

## Točni izvori

- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/app/python/PythonService.java` — argumenti, lista, merged stderr, prefix parser, neograničen wait/read i catch-and-return.
