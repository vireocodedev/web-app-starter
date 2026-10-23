# Jednokratni CI izvršitelj je provjerena granica povjerenja

Izvršavaj kod repozitorija u svježem i ograničenom okruženju koje ne može mijenjati deployment host ni naslijediti stanje drugog posla. Oznaka izvršitelja određuje red, a ne dokazuje autorizaciju, izolaciju ili čišćenje.

**Ugrađeni obrazac predloška.** Trajna CI osnova pripada vodiču `infrastructure/ci/README.md` i fiksnom lifecycle sučelju `infrastructure/ci/manage.py`. Aplikacijski workflow je korisnik te usluge. Članak ništa ne instalira, registrira, aktivira ni nadograđuje.

## Okidač, vlasnik i ugovor

Obrazac koristi za PR kod, instalaciju ovisnosti, build skripte, browser alate i Testcontainers. To su izvršivi ulazi; i mala promjena može pokrenuti package lifecycle skriptu.

Operater upravlja instalacijom, eksplicitno odabranim privatnim repozitorijima, kontrolerskim vjerodajnicama, kapacitetom i prihvatnim dokazima. Održavatelj aplikacije upravlja redovnim naredbama i toolchain deklaracijama. Novi projekt traži pristup zajedničkom poolu; ne instalira vlastiti trajni runner iz kopiranog infrastrukturnog direktorija.

Ugovor je svježe stanje s ograničenim ovlastima: jedan JIT runner vezan uz repozitorij, novi datotečni sustav i namespaceovi, privatni rootless Docker, ograničenja resursa i čišćenje svih pripadajućih resursa. Posao ne dobiva host Docker socket, SSH/deployment tajne, aplikacijske podatke ili zajednički zapisivi cache.

```text
registrirani privatni repozitorij
              |
zaštićeni CI kontroler -- JIT registracija repozitorija
              |
      jednokratna granica posla
      datoteke / procesi / mreža / Docker / limiti
              |
        checkout i PR naredbe

zaštićeni deployment executor -- host Docker i aplikacijski podaci
                zasebna ovlast i lifecycle
```

## Prati lifecycle, ne samo oznaku

Kontroler koristi eksplicitnu zaštićenu mapu repozitorija i ograničeni pool. `[self-hosted, Linux, X64, web-app-ci]` usmjerava posao prema tom mehanizmu. App ključ i kontrolerski tokeni ne ulaze u posao. Jednokratnu JIT konfiguraciju preuzima runner listener; startup helper uklanja datoteku i zamjenjuje roditeljsku ljusku kako dodatna kopija tajnog ulaza ne bi ostala u naslijeđenom procesu.

Prije stvaranja runnera kontroler trajno bilježi namjeru i jedinstveni netajni naziv. Vraćeni ID zapisuje prije početka branch koda. Izgubljeni odgovor zato znači neizvjesnu mutaciju koju treba razriješiti, ne razlog za slijepo stvaranje sljedećeg runnera.

Nakon prekida čišćenje provjerava točne pripadajuće nazive i ID-eve kroz autentificirani cjeloviti inventar. Nedostupan privatni repozitorij, nejasan ishod stvaranja ili nepodudaran runner zadržava recovery stanje. Odgovor `404` ne dokazuje odsutnost. Samo izričito odbijanje koje sigurno nije stvorilo resurs dopušta uklanjanje namjere bez takvog usklađivanja.

Na kraju moraju nestati datoteke, kontejneri, procesi, namespaceovi i registracije. Prazan popis online runnera dok pool miruje može biti normalan. Stvarni GitHub posao i dokaz čišćenja vrjedniji su od statičnog popisa.

## Limiti su dio granice

Izvorni primjer definira memory high/max, swap, CPU kvotu, broj zadataka, disk posla, trajanje i rezervu hosta. Pool dodatno ograničava zbrojni kapacitet. To su odabrane postavke infrastrukture, ne univerzalni brojevi za svaku aplikaciju.

Alati trebaju surađivati s tim ograničenjima. Frontend shard koristi jedan Vitest worker; backend ograničene Gradle/JVM postavke i jedan testni fork. Istodobno povećavanje matrice i unutarnjih poolova može iscrpiti host.

Aplikacijski toolchain odabire se u jednokratnom prostoru. Baseline izvršitelja nije aplikacijski target: backend predloška ostaje Java 21 i ako baseline sadrži noviji JDK. `RUNNER_TOOL_CACHE` je u privremenom prostoru runnera; workflow ne smije tražiti zapis u hostov `/opt/jdk`.

## Registracija ne znači aktivaciju

Registracija zahtijeva zaustavljen, disabled i stvarno idle kontroler te očekivani hash konfiguracije. Uspjeh čuva ostale projekte, poništava stari validation receipt i ostavlja izvršavanje isključeno. Neizvjesna probna registracija blokira novi pokušaj dok se točan ledger ne razriješi.

Za prihvat novih poslova potreban je potpun dokaz za trenutačni boot, konfiguraciju i izvor izolacije. Reboot ili promjena granice poništava staru valjanost. Opća in-place nadogradnja nije podržana; uske pregledane migracije i popravci imaju vlastite provjere prethodnog stanja.

Validacija kombinira pozitivne kontrole i zabrane: dostupni host listener dokazuje da odbijena veza iz posla zaista pokazuje izolaciju. Provjerava filesystem/proc/mrežu/cgroup/uređaje, rootless Docker, stvarne aplikacijske preduvjete, napuštene procese i drugi svježi posao. Pool dodatno provjerava istodobne granice među slotovima te čišćenje uz aktivne susjede. Unit test izvora ne dokazuje ta svojstva stvarnog hosta.

## Pogreške i odluke

| Opažanje                                     | Odluka                                                                       |
| -------------------------------------------- | ---------------------------------------------------------------------------- |
| Workflow koristi očekivanu oznaku            | Routing postoji; još treba dokaz registracije i stvarnog izvršavanja.        |
| Dostupan je host Docker socket               | Granica je narušena; zaustavi prijam i istraži prije novog nepouzdanog koda. |
| Dokaz je stariji od boota ili konfiguracije  | Potrebna je nova operaterska validacija.                                     |
| Inventar za čišćenje nije dostupan           | Sačuvaj ledger i obnovi predviđeni pristup; ne proglašavaj brisanje.         |
| Novi posao vidi stari resurs                 | Svježina nije zadovoljena; istraži teardown granice.                         |
| PR traži privilegirani `pull_request_target` | Preoblikuj ovlasti tako da branch kod ne dobije privilegirani kontekst.      |

## Prihvat i inspekcija

Pregledaj odabir privatnih repozitorija, read-only PR tokene, checkout bez zadržanih vjerodajnica i job-local putanje za toolchain/cache. Traži stvarne parent/child limite, odsutnost host tajni i socketova te potpun cleanup nakon uspjeha, otkazivanja i prekida.

Promjena privilegiranog lifecyclea ili izolacije zahtijeva neovisan pregled i validaciju na svježem hostu prije aktivacije. Te radnje pripadaju operaterskom vodiču. Povijesni prihvat predloška ne potvrđuje novi projekt, drugi izvor, konfiguraciju ili boot.

## Izvori

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/README.md`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/manage.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/ci-runner/controller.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/ci-runner/start-job.sh`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/ci-runner/validation.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/ci-runner/config.example.json`
