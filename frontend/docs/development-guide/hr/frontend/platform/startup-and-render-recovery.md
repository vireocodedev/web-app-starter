# Odvojite bootstrap pogrešku i React render oporavak

Konfiguracija može zakazati prije React granice. Provider može pasti pri renderu nakon uspješnog startupa. Async naredba može biti odbijena u handleru izvan obaju putova. Razdvojite vlasnike umjesto očekivanja da jedna granica hvata sve.

Ovo je **ugrađeno starter ponašanje s granicama**. Bootstrap hvata inicijalizaciju i daje neovisnu fatal stranicu. `AppRenderErrorBoundary` omata providere i prikazuje istu stranicu nakon descendant render pogreške. API i feature pogreške ostaju kod svojih vlasnika.

## Okidač i vlasnik

Startup oporavak pokriva config, čekani mock, sinkrone signale te runtime, router i root unutar try bloka. React granica pokriva render ugovor potomaka. Validacija, zabrana, sukob i očekivani zahtjev koriste obično stanje featurea.

Statička evaluacija modula prethodi try tijelu pa neuspješan top-level import nije automatski uhvaćen. Odbijeni promise click handlera također ne postaje render pogreška samim položajem komponente.

## Fallback ostavite neovisnim

Ugrađeni **putovi pogreške**:

```text
bootstrap -> lokalna dijagnostika -> signal cleanup -> fatal ekran
React render -> boundary failed stanje -> fatal ekran
očekivani command/query problem -> oporavak featurea
```

`FatalErrorScreen` ima obične stilove, main naslov, tekst i reload gumb. Nakon mounta fokusira naslov. Ne traži zdrav theme, runtime, locale, feedback ni auth. Tekst je trenutačno fiksni engleski. Nemojte jamčiti prijevod kroz upravo slomljene providere.

Startup renderer prima samo root, ne Error, i ne renderira bez HTMLElementa. Time ne izlaže tehničke detalje, ali nedostajući root nema jamstvo vidljivog fallbacka iz tog helpera.

| Pogreška           | Oporavak          | Nepodržani zaključak          |
| ------------------ | ----------------- | ----------------------------- |
| Config ili mock    | Startup ekran     | Runtime može zdravo nastaviti |
| Render potomka     | Boundary fallback | Sve async pogreške uhvaćene   |
| Validacija/409/403 | Feature poruka    | Cijela aplikacija mora pasti  |
| Event promise      | Vlasnik naredbe   | Boundary ga automatski vidi   |
| Nema root elementa | Host dijagnostika | Fatal ekran nužno postoji     |

## Granice prijave i čišćenja

`reportStartupFailure` piše detaljnu dijagnostiku samo u developmentu. Produkcija treba zaseban sanitiziran adapter. Boundary ima neobvezni callback bez sirove pogreške, ali root `App` ga ne postavlja. Nemojte tvrditi da je telemetrija već povezana.

Bootstrap čuva signal disposer i zove ga pri neuspjehu; HMR ga registrira pri zamjeni. Render fallback sam ne uklanja aplikacijske signale ni sve runtime resurse. Za novi listener ili worker definirajte vlastiti teardown.

Postoji uža granica: catch zove disposer prije fallbacka bez zasebne zaštite od cleanup pogreške. Throw zato može prekinuti taj put. Signal servis namjerno prijavljuje cleanup probleme, pa jače obećanje da se fallback uvijek renderira traži dodatnu orkestraciju. Dokumentacija tu pretpostavku ne smije sakriti.

## Pogreške i scenariji prihvaćanja

Nevaljan config daje lokalnu dijagnostiku i siguran ekran bez raw pogreške u UI-ju. Provider kvar daje neovisan ekran. Očekivan domenski ili mrežni problem ostaje u featureu. Reload je pun restart, ne retry neizvjesnog writea ni rollback.

Pri promjeni recoveryja zasebno razmotrite missing root, throwing disposer, neuspjelog reportera i async odbijanje. Korisna dijagnostika ne smije izložiti privatne payloadove, cookieje ili lozinke. Prikaz fallbacka ne potvrđuje završetak izvornog zadatka.

## Izbjegnite ove prečace

Nemojte fallback lokalizirati slomljenim providerom, pokazati stack trace, sve feature probleme učiniti fatalnima ni jamčiti univerzalan catch i cleanup. Oporavak treba preživjeti ovisnosti koje zamjenjuje.

## Izvori i podrijetlo

- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/main.tsx` — startup i cleanup prije fallbacka.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/failure/AppRenderErrorBoundary.tsx` — render stanje i callback.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/failure/FatalErrorScreen.tsx` — engleski neovisni ekran, fokus i reload.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/failure/renderFatalStartupError.tsx` — provjera roota bez raw Errora.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/failure/reportStartupFailure.ts` — lokalna dijagnostika.
