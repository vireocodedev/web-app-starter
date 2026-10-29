# Stabilan redoslijed lockova i retry u novoj transakciji

**Status podrške: referentni recept potkrijepljen izvorom.** FRED koristi determinističan redoslijed zaključavanja i eksplicitne `TransactionTemplate` granice za utrke inserta. LMS retry anotacija usporedba je sa starijom implementacijom, ne ovisnost predloška ni preporučeni zadani broj pokušaja. Predložak nema univerzalni retry koordinator.

Koristite obrazac kad naredba zaključava više postojećih resursa ili dva zahtjeva mogu pokušati isti unique insert. Redoslijed smanjuje izbježive deadlockove, database ograničenja razrješavaju utrku, a nova transakcija daje uporabljivo stanje nakon prekida. Ništa od toga proizvoljnu naredbu ne čini sigurnom za ponavljanje.

## Starter reference politika

[Referentni feature](../foundation/executable-reference-feature-and-isolation.md) zaključava istu owned grupu za child write i parent delete. Nema automatskog retryja. Samo točan contact unique constraint postaje 409 REQUEST_REJECTED izvan neuspjele service transakcije; nepovezani integrity problem ostaje 500. Osvježena expected verzija nije automatski oporavak stale korisničke namjere.

## Redoslijed definirajte prema stvarnom zaključanom identitetu

FRED registration servis sortira serijske reference po kanonskom database identitetu, zatim po serijskoj referenci. Izvor izričito pokriva konfigurirane aliase. Sortiranje samo korisničkog aliasa može dati različite redoslijede za iste temeljne resurse i poništiti protokol.

Projekt koji premješta kapacitet između kolekcija mora u oba smjera zaključavati prema istom kanonskom ID redoslijedu, bez obzira na ulogu izvora ili cilja. Prije zaključavanja uklonite duplikate identiteta kad aliasi vode istom retku. Uključite brisanje, batch promjene i održavanje; jedan ispravan endpoint ne uređuje konkurentnog zapisivača koji koristi drugi redoslijed.

```text
Recept protokola:
  dohvatiti i autorizirati trenutačnog aktera
  pretvoriti reference zahtjeva u kanonske identitete
  sortirati i ukloniti duplikate jednim definiranim komparatorom
  prvo uzeti zajednički domenski lock, ako ga invarijanta zahtijeva
  zaključati resurse kanonskim redoslijedom
  ponovno provjeriti zaštićeno stanje i izvršiti naredbu
```

Ovo je dizajnerski recept, ne točan slijed svake FRED ili Discovery naredbe. Eksplicitno pregledajte mjesto autorizacije i lockova. Discovery financijski mutex dokumentira administratorsku ovlast prije globalnog mutexa te resource lockove nakon njega. Stabilni redoslijed smanjuje jedan uzrok deadlocka, ali ne jamči da baza nikad neće prekinuti transakciju.

## Jedinstvenost neka razriješi utrku inserta

U FRED-u različiti resource lockovi ipak mogu konkurirati za zajednički request ID. Session entitet deklarira jedinstven request ID, a priprema hvata integrity povredu tek nakon završetka prvog transakcijskog izvršavanja. Druga transakcija traži postojeći zahtjev i provjerava resurs, controller i operator vlasništvo. Ponovno iskorišten ID drugog vlasnika konflikt je, ne idempotentni uspjeh.

Registration servis slično ponavlja jednu cijelu operaciju u novom template izvršavanju nakon `DataIntegrityViolationException`. Izvor zaista hvata tako široku iznimku; to nije dokaz da je svaka integrity pogreška prolazna. Novi projekt treba prepoznati očekivano ograničenje/utrku, a nepovezane not-null, foreign-key i domenske kvarove propustiti umjesto ponavljanja nevaljanih podataka.

Baza projekta mora stvarno provoditi odabranu unique politiku kroz Flyway shemu. Anotacija entiteta ili prethodni `exists` upit nisu prenosivo deployment jamstvo, posebno uz Hibernate validaciju umjesto generiranja sheme.

## Prije oporavka završite neuspjelu transakciju

Database kvar može ostaviti transakciju aborted ili rollback-only. Hvatanje unutar transakcije i čitanje konkurentnog inserta iz istog konteksta nije sigurno. Spring poziv koji prividno uspješno vrati rezultat može naknadno završiti rollback pogreškom jer ju je unutarnji kvar već označio.

**Pseudokod recepta:** `attempts` je namjerno konfiguriran `TransactionTemplate` s `REQUIRES_NEW`. `commands`, `conflicts` i `recovery` suradnici su projekta, ne API-ji predloška. Prije prilagodbe konfigurirajte transaction manager i vlasništvo/idempotentnost zahtjeva.

```java
public Result submit(Command command) {
    try {
        return attempts.execute(status -> commands.createOrLoad(command));
    } catch (DataIntegrityViolationException failure) {
        if (!conflicts.isExpectedIdentityRace(failure)) throw failure;
        return attempts.execute(status -> recovery.loadAndVerifyOwner(command));
    }
}
```

Catch je izvan `execute`, pa rollback završava prije oporavka. `REQUIRES_NEW` eksplicitan je u FRED izvoru; self-call anotiranog helpera nije ista proxy granica. Postojeća vanjska transakcija suspendira se umjesto magičnog čišćenja i može zadržati lockove. Odredite ugovor orkestracije te pregledajte pool i lock interakcije prije ugnježđivanja neovisnih transakcija.

## Zajedno ograničite retry i nuspojave

FRED oporavak radi jedan drugi pokušaj; session putanja prelazi na dohvat postojećeg umjesto stvaranja novog identiteta. LMS `OptimisticLockRetry` navodi do deset pokušaja uz 200 ms backoff za optimistic locking kvarove. Brojke pripadaju starijem projektu i njegovim ovisnostima, ne univerzalnoj anotaciji svake mutacije.

Prije retrija odredite prihvatljive konflikte, broj pokušaja ili rok, ponovno učitavanje ovlasti/stanja i razlog zašto ponavljanje ne duplicira vanjski učinak. Retry oko emaila, provider slanja ili audita potvrđenog odvojenom transakcijom treba dodatni idempotency dizajn. Autentikacijski kvar, zabrana i zastarjela korisnička revizija nisu prolazne transportne smetnje.

## Kvar, oporavak i kriteriji

Ako ograničen oporavak ne pronađe operaciju ispravnog vlasnika, vratite dokumentirani konflikt. Sačuvajte izvorni request identitet i dijagnostički uzrok bez otkrivanja privatnih podataka. Novi ID nije način zaobilaženja unique kvara: jednu namjeru može pretvoriti u dvije radnje.

Kriteriji projekta:

- Suprotne batch operacije stječu isti kanonski redoslijed, uključujući aliase.
- Konkurentni inserti daju jedan trajni identitet i potvrđeni postojeći rezultat ili konflikt.
- Oporavak čita tek nakon završetka prve transakcije, bez rollback-only stanja.
- ID drugog aktera/resursa nikada ne vraća tuđi rezultat.
- Nepovezane constraint povrede i neponovljive domenske pogreške odmah se prijavljuju.
- Budžet pokušaja eksplicitan je i ne duplicira nepovratne učinke.

## Točni izvori

- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/registration/PilotRegistrationService.java` — kanonsko sortiranje i nova transakcija retrija.
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/session/LivestreamSessionService.java` — priprema, oporavak utrke i provjere postojećeg vlasništva.
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/session/LivestreamSession.java` — unique deklaracija request identiteta.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectFinanceLock.java` — dokumentirani redoslijed globalnog i resource locka.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/core/OptimisticLockRetry.java` — starija optimistic retry/backoff politika.
