# Paralelnim checkoutima dodijeli eksplicitan identitet baze

Više worktreeova ne smije se sudarati na portu ili neprimjetno koristiti istu trajnu bazu. Port, Compose projekt, volumen i aplikacijska lozinka različiti su ulazi.

**Ugrađeni helper uz ograničeni workflow recept.** Izvor su `backend/scripts/start-local.mjs`, `backend/compose.yaml` i local profil. Recept ih primjenjuje na više checkouta; debugger ne dodjeljuje automatski zasebne frontend/backend app portove.

## Okidač, vlasnik i ugovor

Koristi kad drugi app javlja port conflict, zdrava baza odbija novi env password ili worktree treba neovisne podatke. Developer upravlja ignored konfiguracijom i odlukom o dijeljenju. Podaci drugog projekta nisu za brisanje jer smetaju portu.

Neovisnost traži izričit port i namespace. Drugi port ne stvara drugi volumen. Druga env lozinka ne mijenja inicijaliziranu DB ulogu.

## Lanac odabira

Helper parsira vlastiti backend `.env`, dodaje vrijednosti Docker procesu i bira `COMPOSE_PROJECT_NAME` iz te datoteke ili starter defaulta. Namjerno ignorira tuđi project identity naslijeđen iz terminala.

Compose objavljuje container port `5432` samo na loopbacku kroz `POSTGRES_PORT` ili default. Imenovani `postgres-data` volumen pripada odabranom projektu. Lokalni Java datasource koristi host port i pripadajuće DB tajne.

```text
checkout .env
   +-> COMPOSE_PROJECT_NAME -> resursi / trajni volumen
   +-> POSTGRES_PORT        -> host loopback port
   +-> POSTGRES_*           -> autentikacija, ne reset volumena
```

Neutralna ilustracija:

```dotenv
COMPOSE_PROJECT_NAME=sample-feature-a-local
POSTGRES_PORT=55480
```

Port nije zajamčeno slobodan. Provjeri stvarnu dostupnost i sačuvaj ostale vrijednosti/tajne. Isječak nije zamjena cijelog enva.

## Dijeljenje mora biti namjerno

Za zajedničku bazu zabilježi odluku i uvaži istodobne migracije/ponašanje. Za neovisnost odaberi drugi project name i slobodan port prije prve inicijalizacije. Isti projekt čuva podatke i lozinku i nakon rekreiranja kontejnera.

Helper nakon healtha radi password `SELECT 1` kroz service interface. `pg_isready`, socket ili loopback mogu prolaziti s drugim auth pravilom. Healthy-but-rejected traži provjeru enva/volumena, ne slabljenje provjere.

Initial-user lozinka odvojena je granica: initializer stvara samo odsutni username i ne resetira postojeći. DB pristup i browser login mogu padati neovisno.

## Dijagnoza koja čuva podatke

| Opažanje                        | Značenje                     | Odluka                                        |
| ------------------------------- | ---------------------------- | --------------------------------------------- |
| Port zauzet                     | Postoji vlasnik bindinga     | Identificiraj ga i odaberi drugi port.        |
| Novi port, stari podaci         | Isti projekt/volumen         | Potvrdi namjeru ili odaberi novi namespace.   |
| Zdrav DB odbija lozinku         | Persistirana početna tajna   | Vrati odgovarajući env ili novi projekt/port. |
| DB pristup radi, login ne       | Drugi aplikacijski identitet | Pregledaj account tok bez reseta baze.        |
| Terminal project name ignoriran | Namjerna helper politika     | Zapiši identitet u vlastiti env.              |
| Debugger stane, baza radi       | Trajni odvojeni lifecycle    | Po potrebi zaustavi samo svoj servis.         |

Brisanje volumena nije normalni popravak. Scoped stop/down ga čuva; uklanjanje je zasebna data-loss odluka.

## DB izolacija nije izolacija cijele aplikacije

Java launch i Vite proxy koriste svoje app portove. `POSTGRES_PORT` ne dodjeljuje drugi API niti mijenja proxy. Potpuno paralelni appovi trebaju zaseban pregledan port/proxy dogovor svih vlasnika.

Cookie je vezan uz host/path, ne izolira ga drugi frontend port. Dva appa na istom hostu mogu dijeliti browser cookie state unatoč različitim bazama. Po potrebi odaberi odvojene browser profile/hostnameove uz ovlast i očuvan same-origin ugovor, bez širokog CORS-a.

## Prihvat i inspekcija

Zabilježi netajni Compose identitet, stvarni port, namjeru dijeljenja i helper autentikaciju. Potvrdi da ostali projekti nisu dirani. Za cijele paralelne instance opiši i API/proxy/browser odluke i granice.

README upravlja startupom. Članak ne uređuje env, zaustavlja servis, alocira port ili briše podatke.

## Izvori

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:backend/scripts/start-local.mjs`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:backend/compose.yaml`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:backend/src/main/resources/application-local.yaml`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:backend/src/main/java/com/vireocode/backend/user/LocalUserInitializer.java`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.vscode/launch.json`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/vite.config.ts`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:README.md`
