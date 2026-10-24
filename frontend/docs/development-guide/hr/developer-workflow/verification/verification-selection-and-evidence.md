# Provjere biraj prema promijenjenom ugovoru i opiši granice dokaza

Odaberi provjeru koja može otkriti promijenjeno ponašanje, pročitaj stvarni aggregate script i veži rezultat uz pregledanog kandidata. Nije sve jedan zeleni status.

**Dokumentirani starter workflow s primijenjenim receptom.** README-i, frontend testing/architecture vodič i package/build skripte definiraju provjere. Tablica ih primjenjuje; ne uvodi novi scheduler ni trajnu iznimku od normalne politike.

## Okidač, vlasnik i ugovor

Koristi prije isporuke, nakon review popravka ili uz ograničenje izvršavanja. Implementacijski vlasnik određuje promijenjeni ugovor. Koordinator primjenjuje aktualna resource/concurrency pravila. Autor ne pokreće samostalno tešku provjeru dok drugi vlasnik verificira.

Ugovor je pošten opseg: dopuštene relevantne provjere, stvarni ishodi i jasno nedostajući dokazi. Ograničenje jednog zadatka ne briše testove trajno niti znači da je neizvršena naredba prošla.

## Prije aggregatea pročitaj skriptu

Frontend `verify` u snapshotu uključuje format, lint, architecture, guide validation, typecheck, Vitest, production i Storybook build. “Samo statičke provjere” zato nije dozvola za taj aggregate. `build` uključuje TypeScript prije Vitea.

Backend koristi Gradle wrapper i smislene PostgreSQL/Testcontainers testove koji ne resetiraju lokalnu bazu. Potreban im je Docker. Image compile i runtime smoke zasebni su ugovori CI/release vlasnika.

```text
promijenjeni ugovor
  -> vlasničke skripte
  -> ovlaštene fokusirane provjere
  -> review popravci
  -> koordinirani konačni gateovi
  -> handoff vezan uz source i izostanke
```

## Odaberi odgovarajući dokaz

| Promjena              | Koristan dopušten dokaz                    | Granica                                 |
| --------------------- | ------------------------------------------ | --------------------------------------- |
| Markdown/catalog/rute | Guide validator, lint/types, route/build   | Valjani link nije semantički prihvat.   |
| Import/lifecycle      | Architecture i ponašanje                   | Checker ne bira vlasnika.               |
| Shared UI             | Types/build, Storybook, interakcija/visual | Slika ne dokazuje persistence/security. |
| Auth/API              | Adapter/integration/browser                | Mock ne dokazuje stvarni backend.       |
| Backend persistence   | Transaction/integration/build              | Jar ne dokazuje invarijante baze.       |
| Image runtime         | Restricted smoke i identitet               | Dev server nije artefakt prihvat.       |

Biraj postojeće smislene scenarije, ne kopije implementacije. Navedi ručnu accessibility/semantic provjeru koju alat ne može potvrditi.

## Resurse koordiniraj prije izvršavanja

Prije ponavljanja prekinute teške provjere pročitaj constraints i provjeri žive procese. Koristi odabrani koordinacijski mehanizam repozitorija. Više urednika nije dozvola za paralelne typecheck/browser/Gradle/build workere.

Fokusirane provjere služe implementaciji; konačne slijede nakon urednika i materijalnih review popravaka. Relevantna promjena poništava dokaze na koje utječe. Ponavljaj zbog promijenjenog kandidata, ne ritualno nakon uspješnog nepromijenjenog runa.

Ako zadatak izričito zabranjuje testove, biraj zasebne dopuštene skripte i navedi behavioral gap. Ne mijenjaj CI kako bi preskakao testove. Drugi zadatak može naknadno odobriti izostale provjere.

## Kratak zapis dokaza

```text
candidate: <commit-ili-working-tree-opseg>
command: <tocna-naredba>
result: <passed-failed-interrupted-not-run>
log: <sigurna-referenca>
limits: <mock-only/manual-gap/izostali-suite>
```

Za necommitane izmjene navedi stvarni working tree, ne pripisuj sve starom HEAD-u. Nakon commita potvrdi da isporučeni source odgovara provjerenom kandidatu. Pad ili prekid ostaje vidljiv i nakon nepovezanog uspjeha.

## Pogreške i odluke

| Opažanje                              | Odluka                                       |
| ------------------------------------- | -------------------------------------------- |
| Aggregate uključuje zabranjeni test   | Prije izvršavanja biraj eksplicitnu skriptu. |
| Checker prođe, ownership pogrešan     | Popravi dizajn; checker nije waiver.         |
| Source promijenjen nakon builda       | Ponovi pogođeni dokaz.                       |
| Stari worker nakon prekida            | Uskladi ownership prije restarta.            |
| Statika prošla, testovi nisu izvršeni | Odvoji uspjeh i behavioral gap.              |
| Log drugog checkouta/attempta         | Odbij kao dokaz kandidata.                   |

## Prihvat i inspekcija

Handoff navodi ponašanje, opseg, stvarne ishode, izostanke i rizike. Lokalna provjera, CI, staging i production/recovery odvojene su tvrdnje. Odabir provjera ne daje publish/deploy ovlast.

Skripte i vodiči ostaju autoritet. Članak ne izvršava naredbu ni pretvara privremenu zabranu u trajnu politiku.

## Izvori

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:README.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/README.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/package.json`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:backend/build.gradle`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/AGENTS.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/docs/architecture/en/tests-mocks-stories-and-architecture-checks.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:docs/v1-workflow.md`
