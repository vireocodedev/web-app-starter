# Dovršite mock transport prije prvih runtime zahtjeva

Razvojni fixture mora biti spreman prije autentikacije, queryja i React zahtjeva. Worker pokrenut u effectu stranice stvara utrku: prvi zahtjev može otići stvarnom serveru ili zakazati prije presretanja. Spremnost stavite u bootstrap lanac ovisnosti.

Ovo je **ugrađeno starter ponašanje**. `main.tsx` provjerava konfiguraciju, uvjetno uvozi i čeka razvojni mock worker pa pokreće signale, runtime, router i React. Worker vraća izričitu pomoć prijave, a build validacija zasebno odbija mock.

## Okidač i vlasnik

Granica vrijedi za nove HTTP fixturee i probleme prvog učitavanja. Bootstrap određuje dopuštenost i spremnost transporta. Mock moduli handlere i sintetičku sesiju. Feature API čuva isti ugovor bez izravnog uvoza mock storea.

Uvjet traži Vite DEV i parsirani `VITE_API_MODE === "mock"`. App environment label nije dovoljan. Dinamički import drži fixture izvan obične produkcijske kompozicije. Nemojte dodati bezuvjetni import u runtime ili rutu.

## Sačuvajte startup slijed

Neutralna **ilustracija ugrađenog poretka**:

```text
provjera javne konfiguracije
ako DEV i mock:
  obnova sintetičke sesije
  await worker.start()
  zadržavanje tipizirane pomoći prijave
sinkroni signal životni ciklus
runtime i router
render aplikacije
```

Workerov callback prepoznaje API origin i baznu putanju. Nepoznat zahtjev tog opsega prijavljuje pogreškom; nepovezani asseti i origini nisu nedostajući API fixture. To je bolje od tihog ignoriranja ili uspješne zamjene svih zahtjeva.

Putanja je bitna: `/api` i `/api/...` pripadaju granici, sličan naziv ne treba uhvatiti nesigurnim tekstualnim prefiksom. Handlere gradite prema provjerenoj bazi.

| Uvjet                | Bootstrap odgovor                   |
| -------------------- | ----------------------------------- |
| DEV + mock           | Čeka worker prije runtimea          |
| DEV + HTTP           | Normalni runtime bez fixturea       |
| Build + mock         | Odbijanje prije runtimea            |
| Worker ne uspije     | Fatalni startup oporavak            |
| Nepoznat API zahtjev | Prijava nedostajućeg fixturea       |
| Pomoć prijave        | Tipizirani metapodaci auth runtimeu |

## Pogreške i granice vijeka

Nemojte nakon worker pogreške nastaviti kao da presretanje radi. Prvi zahtjev tada koristi drugi sustav od odabranog načina. Prikažite startup oporavak bez providera i korisnu lokalnu dijagnostiku.

Helper pokreće worker, ali ne vraća stop/dispose handle. Dokazuje spremnost, ne potpun aplikacijski restart i gašenje. Ako budući host mijenja način bez reloada, uvedite vlasnika prestanka starog workera i stanja; React unmount sam nije taj protokol.

Obnova mock sesije i demo pomoć razvojne su pogodnosti. Nisu produkcijski identitet, fallback autorizacija ni opravdanje nedostajućeg backenda. Fixture dokazuje simulirani frontend/adapter ugovor, ne stvarnu persistenciju ili sigurnost.

## Scenariji prihvaćanja

Prvi auth dohvat čeka worker. Neuspjeh zaustavlja stvaranje runtimea. Nepoznat API endpoint vidljiv je, ne tiho uspješan. HTTP konfiguracija nema fixture put. Build mock se odbija. Feature ne zna mock internu pohranu, a pomoć prijave dolazi samo runtime opcijom.

Pri dijagnozi zabilježite način, javni API opseg i problem spremnosti bez session tajni. Koristite sintetičke ograničene podatke; pravi klijentski zapisi nisu potrebni za ugovor.

## Izbjegnite ove prečace

Nemojte mock pokrenuti u page effectu, slati prije spremnosti, prešutjeti API propuste, uvoziti fixture store u feature ni mock smatrati backend dokazom. Poredak je dio transportnog ugovora.

## Izvori i podrijetlo

- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/main.tsx` — čekani uvjetni mock prije runtimea.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/mocks/browser.ts` — sesija, API opseg i pomoć prijave.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/config/loadAppConfig.ts` — build zabrana mocka.
