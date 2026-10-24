# Provjerite cijelu javnu konfiguraciju prije stvaranja runtime vlasnika

Pogrešno napisana javna varijabla treba zaustaviti startup, ne tiho uključiti default. String `false` ne smije truthinessom omogućiti credentials. Jednom validirajte javnu konfiguraciju, normalizirajte domenske vrijednosti i predajte rezultat runtime tvornicama.

Ovo je **ugrađeno ponašanje startera**. Env shema, strogi parser, ambient loader te URL i boolean sheme jedna su granica. Build zastavice i dalje upravljaju razvojnim sastavljanjem; feature treba namjerno runtime sučelje, ne vlastito tumačenje env stringova.

## Okidač i vlasnik

Granica vrijedi za novu javnu postavku, API bazu i fiksan deployment izbor. `envVariables` posjeduje podržani `VITE_` rječnik. `loadAppConfig` dopušta te ključeve, prijavljuje nepoznate, bira definirane vrijednosti, parsira i provodi build zaštitu. `parseAppConfig` prima injektiran zapis bez čitanja Vite okoline.

Defaulti su HTTP način, production aplikacijska oznaka, isključeni credentials i pozitivan cjelobrojan timeout 15.000 milisekundi. API baza je obvezna. Custom `VITE_APP_ENV` odvojen je od stvarnog Vite produkcijskog builda; development oznaka ne dopušta mock u buildu.

## Sintaksu i značenje ostavite izričitima

Neutralna **ilustracija ugrađenog parsera**:

```ts
const config = parseAppConfig({
  VITE_API_BASE_URL: "/api",
  VITE_API_WITH_CREDENTIALS: "false",
});
// Credentials je boolean false; izostavljene podržane vrijednosti dobivaju default.
```

Boolean shema prima boolean i točne stringove `true`/`false`; druge oznake ili `1` nisu ugovor. Timeout se pretvara pa ograničava na pozitivan cijeli broj. Enum fiksnih postavki ograničava deploy izbor, ne prima proizvoljni CSS ili component input.

URL shema dopušta apsolutan HTTPS ili same-origin apsolutnu putanju. Odbija protocol-relative unos, backslash, dekodirani parent traversal, credentials i query/fragment. Završne slashove normalizira prema pravilu. Nemojte to zaobići drugim Axios base stringom featurea.

| Ulaz                        | Ugrađeni odgovor                         |
| --------------------------- | ---------------------------------------- |
| Nepoznat `VITE_`            | Startup pogreška nepoznate konfiguracije |
| Nepodržani enum ili boolean | Schema odbijanje                         |
| Nema API baze               | Schema odbijanje                         |
| `/api/`                     | Normalizirana same-origin putanja        |
| HTTP ili URL s credentials  | Odbijen URL                              |
| Mock u production buildu    | Izričito odbijanje                       |

## Pogreške i oporavak

Javne Vite vrijednosti dolaze pregledniku; to nije pohrana tajni. Lozinke, servisne vjerodajnice, ključevi i privatni deploy ulazi ne postaju sigurni validacijom. Server konfiguracija pripada serveru i operatoru.

Uz novu postavku zajedno promijenite shemu, domensko mapiranje, potrošača, dokumentiran ulaz i scenarije. Default odgovara bezopasnoj opciji, ali ne treba sakriti stvarno obveznu integraciju. Preimenovanje ključa traži namjernu kompatibilnost, ne beskonačno dopuštanje obaju bez politike.

Schema pogreška nastaje prije HTTP-a, autha i featurea. Startup oporavak zato ne ovisi o tim providerima. Dijagnostika treba imenovati nevaljan javni ugovor bez drugih env sadržaja. Nemojte uhvatiti parse pa stvoriti lažno zdrav runtime.

## Scenariji prihvaćanja

Tipfeler javnog ključa vidljivo ne uspijeva. String false ostaje false. Nedostajuća baza, krivi timeout i fiksna vrijednost odbijaju se prije zahtjeva. Build mock odbija se i uz development label. Normaliziranu bazu svi runtime klijenti koriste jednako. Feature prima parsirane ovisnosti umjesto ambient stringova.

## Izbjegnite ove prečace

Nemojte koristiti truthy boolean string, proizvoljan `VITE_`, miješati app label i build ni spremati tajne u browser konfiguraciju. Jedan javni ugovor čini ranu pogrešku i vlasništvo preglednima.

## Izvori i podrijetlo

- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/config/envVariables.ts` — rječnik i defaulti.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/config/loadAppConfig.ts` — whitelist i mock zaštita.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/config/appConfig.ts` — strogi injektirani parser.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/config/schemas/apiBaseUrlSchema.ts` — URL pravila.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/config/schemas/booleanEnvironmentSchema.ts` — točna boolean pretvorba.
