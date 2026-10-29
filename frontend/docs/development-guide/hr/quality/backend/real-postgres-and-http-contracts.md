# Zajedno provjerite stvarni PostgreSQL i javni HTTP ugovor

Autentikacija obuhvaća sigurnosne filtre, cookie sesije, CSRF, JSON, bazu i projekciju. Mock kontrolera ne dokazuje sve granice. Kada tvrdnja ovisi o njihovoj interakciji, koristite jednokratnu stvarnu bazu i pokrenutu aplikaciju.

Ovo je **ugrađeni starter obrazac testiranja**. `AuthIntegrationTests` koristi Spring na slučajnom portu, local profil s izričitim sintetičkim bootstrap vrijednostima i Testcontainers konfiguraciju. Ona service connectionom daje PostgreSQL 18. Izvor je pregledan; za članak nije pokrenut kontejner, server ni test.

## Ugrađena poslovna reference granica

[Izvršivi primjer](../../backend/foundation/executable-reference-feature-and-isolation.md) dodaje stvarni PostgreSQL/HTTP za HARD grupu i SOFT kontakt bez produkcijskih feature tablica ili endpointa. Provjerite pouzdani actor scope, zajednički Request/puni PUT clear, obvezni X-Expected-Version parser, sigurne 400/404/409/500 odgovore i OpenAPI oblik. Nakon requesta provjerite bazu: flush nije commit, HTTP nije u test rollbacku i uspješni odgovor nosi aktualnu verziju/audit.

Zasebni fixturei provjeravaju metadata/proxy/hash, fresh/cached soft vidljivost, native active uvjete, rezervirani unique kod, točne FK/UNIQUE catalog constrainte i negativni schema drift. Normal-context mappings/schema/OpenAPI i Boot JAR exclusion zasebni su negativni dokazi. Puna stranica s hladnim contextom mora ostati unutar konkretna tri SELECT-a; mali skup/cache može sakriti N+1. To su acceptance provjere implementacije, ne uspješni rezultati samo zato što ih članak navodi.

## Okidač i vlasništvo

Granica odgovara sesijama, sigurnosti, bazi, migracijama i endpoint mapiranju koje service-only test ne dokazuje. Suite posjeduje jednokratnu bazu i sintetičke podatke. Spring stvarnu HTTP i sigurnosnu kompoziciju. Klijent ima vlastiti cookie jar, svjež u svakom scenariju.

Test u `BeforeEach` stvara Java HttpClient s CookieManagerom i port čita iz Environmenta. Ne cilja trajnu bazu developera ni pravi račun. To sačuvajte pri prilagodbi; local profil nije dopuštenje uporabe osobnih runtime podataka.

## Provjerite činjenice protokola, ne samo dostupnost

Ovo je **neizvršeni neutralni scenarij**, a ne ugrađeni helper:

```text
GET session anonimno -> zabrana
GET CSRF -> zadržati cookie jar i token
POST login s tokenom -> potvrđena prijava
GET session -> točna javna projekcija
POST logout sa svježim tokenom -> potvrđena odjava
Ponoviti stari session cookie -> zabrana
```

Suite dodatno provjerava promjenu session ID-a, spremljene sesije, hash lozinke, idempotentnu lokalnu inicijalizaciju, nevaljani JSON/polja i cookie/cache zaglavlja. Javna projekcija ima točan broj polja i vrijednosti, što hvata slučajno otkrivanje bolje od široke tvrdnje da sadrži korisnika.

| Ugovor             | Pozitivan ili negativan dokaz                           |
| ------------------ | ------------------------------------------------------- |
| Anonimni pristup   | Sesija zabranjena, health javan                         |
| CSRF               | Prijava i odjava bez tokena odbijene                    |
| Vezanost uz sesiju | Token bez svojeg cookie jara ne prolazi                 |
| Rotacija           | Stari token ne može odjaviti prijavljenu sesiju         |
| Odjava             | Stari cookie ne vraća sesiju                            |
| Vjerodajnice       | Pogrešan i nepoznat korisnik ne započinju autentikaciju |
| Persistencija      | Postoji sesija, lozinka nije plaintext                  |

Iz lokalnog HTTP scenarija nemojte zaključiti HTTPS/Secure-cookie ponašanje deploya. Tvrdnje uključuju HttpOnly i no-store, ne sve proxy i transportne postavke. Promjenu deploy granice provjerite zasebno.

## Granice baze i transakcije

Stvarni PostgreSQL otkriva specifičan SQL, ograničenja i session pohranu vjernije od nepovezane memorijske zamjene. Ne dokazuje produkcijsku povijest nadogradnje, pool opterećenje, failover ni deploy. Za to trebaju odgovarajući scenariji.

Nemojte pretpostaviti da HTTP zahtjev pripada transakciji testne metode ni da se njome poništava. Ugrađeni suite nema testnu class transakciju. Identitet fixturea i čišćenje moraju imati vlasnika uz razumijevanje stanja među metodama i kontekstima. Za naredbu dodajte dokaz da odbijanje ne ostavlja djelomičan učinak.

## Pogreške i scenariji prihvaćanja

Neuspjeh treba razlikovati startup, kontejner, HTTP ugovor i trajnu tvrdnju. Nemojte stvarnu bazu zamijeniti mockom pa prijaviti isto jamstvo. Čisto mapiranje i validacija mogu ostati mali kada baza nije tema.

Scenariji trebaju odbiti nedostajući, stari i tuđi CSRF, krive vjerodajnice, JSON i odjavljeni cookie. Valjan tok vraća samo dopuštena polja i stvarnu sesiju. Ponovite inicijalizaciju bez duplikata ili neočekivane promjene lozinke. Sintetičke vrijednosti čuvajte od logiranja lozinki i cookieja.

Članak definira dokaze za odobreni verification workflow. Čitanje tvrdnji nije prolaz ni zamjena redovite politike testiranja.

## Izbjegnite ove prečace

Nemojte zaobići security u kontroleru, koristiti pravi račun, 200 smatrati dovoljnošću, pretpostaviti HTTP rollback ni lokalnim testom jamčiti produkcijski TLS. Granicu odaberite prema obećanju.

## Izvori i podrijetlo

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:backend/src/test/java/com/vireocode/backend/AuthIntegrationTests.java` — HTTP, cookie, CSRF, baza i negativni ugovori.
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:backend/src/test/java/com/vireocode/backend/TestcontainersConfiguration.java` — PostgreSQL 18 service connection.
