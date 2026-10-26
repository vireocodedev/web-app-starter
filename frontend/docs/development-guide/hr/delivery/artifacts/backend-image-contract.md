# Odvoji backend kompilaciju od ograničenog runtimea

Kompiliraj alatima koji su potrebni, a pokreći manji non-root artefakt s vanjskom konfiguracijom. Kompilacija, testovi, kompatibilnost sheme i health live deploymenta različiti su dokazi.

**Ugrađeni obrazac predloška.** Vlasnici su `backend/Dockerfile`, `backend/gradle.properties`, `backend/build.gradle`, aplikacijska konfiguracija i release runtime. Članak opisuje ugovor bez kopiranja cijelog Dockerfilea ili provisioning postupka.

## Okidač, vlasnik i ugovor

Koristi pri Java nadogradnji, promjeni pakiranja, memorije, baze slike ili startupa. Backend vlasnik odgovara za compile/runtime kompatibilnost i migracije. Operater upravlja zaštićenim database ulazima, trajnom infrastrukturom i container limitima.

Ugovor je jar označen provjerenim izvorom koji radi kao fiksni non-root korisnik bez runtime build alata, source vjerodajnica i ugrađenih podataka. Startup ne smije nekontrolirano stvarati račune ili pretpostavljati lokalni profil.

## Odvojene compile i runtime faze

Dockerfile koristi digest-pinned Java 21 JDK i JRE baze. Build dobiva Gradle wrapper/konfiguraciju, `gradle.properties` i source. Izvršava `bootJar` bez daemona uz plain output. Build cache pripada izvršavajućoj Docker granici; nije opravdanje za zajednički zapisivi host cache nepovezanih poslova.

Runtime kopira jar s pravima `0444`, postavlja radni direktorij, bira `10001:10001`, izlaže privatni `8080` i pokreće:

```text
java -XX:MaxRAMPercentage=75.0 -jar /app/app.jar
```

To je trenutačni entrypoint, ne opća heap preporuka. Postotak usmjerava maksimalni heap prema memoriji koju JVM vidi. Native alokacije, thread stackovi, metaspace i container overhead traže rezervu. Release runtime trenutačno ograničava backend na 512 MiB i daje ograničeni `/tmp`.

Build JVM ima zasebne worker/heap/metaspace postavke u `gradle.properties`. Kopiranje te datoteke čuva ograničenu kompilaciju. Runtime heap postotak ne ograničava build, a build heap ne podešava deployanu aplikaciju.

## Konfiguracija izvan image layera

Zadani profil izvana čita `DATABASE_URL`, `DATABASE_USERNAME` i `DATABASE_PASSWORD`. Flyway upravlja migracijama, Hibernate koristi `ddl-auto: validate`, a session schema initializer je isključen u korist migracija. Server context je `/api`, session cookieji su secure i HTTP-only, a detalji javnog healtha skriveni.

Produkcijski env ne pripada contextu. `.dockerignore` uklanja env datoteke, lokalni Gradle/build output, helper skripte i Compose. Tajna kroz build argument ili env datoteka obrisana tek u kasnijem layeru nije sigurna runtime injekcija.

Deployani runtime dobiva zaštićenu database konfiguraciju i pristupa vanjskoj mreži baze okruženja. Koristi read-only root, uklonjene capabilities, no-new-privileges, memory/PID limite i tmpfs. Lokalni profil i seed vjerodajnice nisu produkcijske zadane vrijednosti.

## Startup i provisioning imaju različite vlasnike

Normalni startup ne stvara korisnike čak ni uz prisutne provisioning postavke. Zasebna izričita naredba `--provision-user` stvara identitet i završava. Isti ponovljeni zahtjev čuva identitet, a konflikt pada bez reseta lozinke.

To je operaterska radnja sa zasebnim zaštićenim ulazom i produkcijskim backupom. Mora koristiti prihvaćeni backend digest. Provisioning tajne ne smiju ući u normalni dugotrajni servis. Sam naziv računa ne uvodi authority model koji aplikacija nema.

## Razlikuj vrste dokaza

`bootJar` u BuildKitu kompilira i pakira; ne izvršava redovni Testcontainers skup. Workflow testove provjerava zasebno prije objave. Umetanje Testcontainersa u kompilaciju slike nepotrebno veže build uz drugi Docker lifecycle.

Healthcheck provjerava `/api/actuator/health`. Restricted artifact smoke dodatno podiže svježi PostgreSQL, izvršava Flyway/Hibernate i provjerava anonimni session/CSRF ugovor. Ni build ni health ne dokazuju kompatibilnost postojeće produkcijske baze ili poslovni prihvat.

## Pogreške i odluke

| Opažanje                                  | Odluka                                                                     |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| Jar radi u JDK, ne u JRE                  | Pregledaj target/runtime i pakirane ovisnosti.                             |
| Runtime traži root ili zapis u aplikaciju | Popravi ownership/temp granice bez širokih ovlasti.                        |
| Heap je malen, container OOM              | Pregledaj ukupnu JVM/native/thread potrošnju i cgroup.                     |
| Env promjena ne popravlja shemu           | Dijagnosticiraj migracije; konfiguracija nije rollback.                    |
| Deploy stvara ili resetira račune         | Vrati eksplicitni odvojeni provisioning.                                   |
| Host odbija ograničenja                   | Dijagnosticiraj podržani host bez slabljenja zaštite radi zelenog statusa. |

## Prihvat i inspekcija

Pregledaj source/repository labele, baze, non-root korisnika, jar prava, entrypoint i vanjsku konfiguraciju. Ovlaštene artifact provjere moraju koristiti stvarnu produkcijsku sliku uz ograničenja i jednokratne podatke.

Odvojeno navedi compile, test, runtime i live dokaze. Operativni postupci ostaju u `infrastructure/release/README.md`; prije oporavka trajnih podataka čitaj **Granice migracijskog neuspjeha**. Članak ne izvršava build, provisioning ni database naredbe.

## Izvori

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/Dockerfile`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/gradle.properties`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/build.gradle`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/.dockerignore`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/application.yaml`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/runtime.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/smoke_images.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md`
