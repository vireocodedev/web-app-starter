# Jedan workspace, dva runtimea

**Status podrške: ugrađen razvojni postupak predloška.** Workspace povezuje Java 21 / Spring Boot backend s frontend alatima Node 24 / npm 12. Node izvršava i backend helpere za lokalnu bazu. Ugovori proizlaze iz verzionirane konfiguracije; u generiranom projektu ponovno ih pregledajte prije promjene runtimea ili kopiranja launch naredbe drugog projekta.

Koristite vodič pri pripremi checkouta, pokretanju oba dijela kroz VS Code, dijagnostici porta ili lozinke baze te razdvajanju stvarne backend sesije od mock ponašanja. Mjerodavna procedura postavljanja ostaje workspace `README.md`, naveden među izvorima; izvorna putanja ovdje znači pronalazak u repozitoriju, ne pretpostavljeni URL preglednika.

## Utvrdite runtime ugovor prije pokretanja

Javu odabire toolchain Java 21 u `backend/build.gradle`; koristite uključeni Gradle wrapper. Potrebni Node major zapisan je u `frontend/.nvmrc`. `frontend/package.json` zahtijeva Node 24.x i npm 12.x, uz package-manager deklaraciju npm 12.0.2 u ovom snapshotu.

Integrirani terminal i VS Code pokrenut s desktopa mogu naslijediti različit PATH. `with-local-node.sh` čita potrebni major iz `.nvmrc`, pokušava odabrati već instalirani runtime preko nvm-a te jasno prekida ako ne uspije. Ne instalira Node i ne nadograđuje globalne alate. Java debugging i dalje zahtijeva preporučene Java ekstenzije i dovršen uvoz Gradle projekta.

Priprema je dovršena kada su deklarirani Java, Node i npm dostupni te operater razlikuje korijen workspacea od direktorija pojedinog paketa. Promjena projektne naredbe radi prilagodbe nepovezanom starom shell runtimeu skriva stvarni preduvjet.

## Slijedite redoslijed backend pripreme

Ugrađeni VS Code **Backend: local dev** izvršava lanac ovisnosti prije Jave:

```text
Backend: prepare local credentials
  -> with-local-node.sh setup-local.mjs
Backend: start local PostgreSQL
  -> with-local-node.sh start-local.mjs
  -> Compose up --detach --wait postgres
  -> SELECT 1 uz lozinku preko service DNS-a
BackendApplication s profilom local i backend radnim direktorijem
```

Java launch čita ignoriranu backend datoteku okruženja ovog checkouta i koristi profil `local`. Setup ekskluzivnim stvaranjem priprema pristupne podatke samo kad datoteka nedostaje, a postojeću čuva. Database helper spaja datoteku s procesnim okruženjem i namjerno odabire Compose identitet iz datoteke ili lokalnog zadanog naziva predloška, izbjegavajući naslijeđeni `COMPOSE_PROJECT_NAME` drugog checkouta.

Samo Compose health stanje nije dokaz da se Java može autentificirati. Loopback ili socket provjera može uspjeti pod drukčijim pravilom autentikacije. Helper zato zasebno provjerava lozinku preko service sučelja baze s istim predanim podacima. Uspješna priprema potvrđuje više od TCP socketa koji prihvaća vezu.

## Port, identitet i volume odvojene su odluke

Ugrađeni PostgreSQL veže se samo na loopback, uz zadani host port 55436 i container port 5432. `POSTGRES_PORT` odabire drugi host port. `COMPOSE_PROJECT_NAME` odabire Compose projekt i pripadajući prostor resursa. Imenovani volume baze postoji neovisno o Java debug sesiji.

| Simptom                                  | Tumačenje                                             | Oporavak koji čuva postojeći rad                                                       |
| ---------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Host port zauzet                         | Drugi servis koristi odabrani binding                 | Identificirati vlasnika; odabrati slobodan `POSTGRES_PORT` ovog checkouta              |
| Zdrava baza odbija lozinku               | Ponovno korišten volume može zadržati prvotnu lozinku | Vratiti odgovarajuću konfiguraciju ili namjerno odabrati drugi projekt i slobodan port |
| Java je zaustavljena, baza radi          | Životni ciklus debuggera razlikuje se od Composea     | Zaustaviti servis ovog projekta dokumentiranim postupkom                               |
| Promijenjena početna lozinka nema učinka | Lokalni initializer čuva postojeće korisničko ime     | Koristiti namjeravani tok računa; promjena okruženja nije reset lozinke                |

Promjena samo host porta ne stvara novu bazu. Promjena samo environment lozinke ne prepisuje lozinku postojećeg volumea. Tijekom dijagnostike čuvajte pristupne podatke i volume; brisanje nije zadani popravak. Dokumentirani uobičajeni stop/down postupci čuvaju volume baze. Zdrava baza drugog projekta nije potrošni resurs zato što joj port smeta ovom checkoutu.

## Preglednik zadržite na jednom originu

**Frontend: local dev** pokreće Vite na loopback portu 5173 uz strict port i eksplicitno bira `/api`, HTTP način, credentialed zahtjeve i razvojno okruženje. Najprije instalirajte zaključane frontend ovisnosti. Taj launch za vlastiti proces nadjačava staru lokalnu mock postavku; frontend pokrenut zasebno i dalje treba svoju namjeravanu konfiguraciju.

Vite proxy prosljeđuje `/api` na loopback backend port 8080. Preglednik koristi jedan frontend origin pa session cookieji rade bez permisivnog CORS-a. Dosljedno koristite jedan hostname: `localhost` i `127.0.0.1` različiti su cookie hostovi. Lokalni Spring profil dopušta HTTP cookieje, dok osnovna deployment konfiguracija zadržava secure oznaku.

Dva VS Code launcha neovisna su. Za stvarni backend pokrenite oba. Mock fixture podaci nisu pristupni podaci baze, a responzivan mock ekran ne dokazuje PostgreSQL ni backend autentikaciju. Vite razvojni proxy nije dio produkcijskog builda; deployed same-origin HTTPS usmjeravanje ima vlastitu konfiguraciju u vlasništvu operatera.

## Završite dokazima odgovarajućeg opsega

Za budući zadatak lokalnog postavljanja zabilježite deklarirane runtimeove, launch načine, odluku o identitetu/portu baze i opaženi startup bez objave tajnih vrijednosti. Navedite je li autentikacija provjerena stvarnim HTTP-om ili mockovima. Preostalu blokadu smjestite u odabir runtimea, Compose vlasništvo, autentikaciju lozinkom, Java startup ili cookie usmjeravanje preglednika.

Repozitorijska verifikacija uobičajeno uključuje testove. Izričita uputa zadatka može ograničiti izvršavanje; odaberite samo dopuštene provjere i prijavite izostavljene korake bez promjene politike predloška. Uspješan lokalni launch također ne daje dopuštenje za deployment, promjenu infrastrukture ili objavu releasea.

## Točni izvori

- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:README.md` — mjerodavan lokalni setup, debugger, autentikacija i verifikacija.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:backend/build.gradle` — Java toolchain i backend ovisnosti.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/.nvmrc` i `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/package.json` — Node/npm ugovori.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:.vscode/launch.json` i `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:.vscode/tasks.json` — neovisni launchi i uređena priprema.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:backend/scripts/with-local-node.sh` — oporavak desktop PATH-a instaliranim Nodeom.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:backend/scripts/setup-local.mjs` i `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:backend/scripts/start-local.mjs` — čuvanje podataka, eksplicitni Compose identitet i provjera lozinke.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:backend/compose.yaml` i `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/vite.config.ts` — loopback binding baze, trajni volume i API proxy.
