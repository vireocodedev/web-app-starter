# Runtime stvarajte izvan rendera, a providere redajte prema ovisnostima

Provider stablo graf je vlasništva, ne popis prema ukusu. Lokalizacija daje tekst i smjer teme te feedback nazive; auth treba zajednički cache; stranice ista runtime sučelja. Drugi klijent ili runtime pri renderu razdvaja životne vijekove.

Ovo je **ugrađeno starter ponašanje**. Bootstrap nakon configa i mock spremnosti jednom stvara runtime i predaje ga `App`-u. `createAppRuntime` sastavlja QueryClient, HTTP/auth, featuree i fiksne postavke, a `AppProviders` kontekste oko routera.

## Okidač i vlasnik

Root granicu koristite za aplikacijsku ovisnost i odluku page scopea. Runtime posjeduje stabilne servise. Provideri ih prilagođavaju Reactu, upravljaju pretplatama i prikaznim stanjem. Feature koristi namjerno sučelje, ne još jednu cache ili HTTP politiku.

Vraćeni objekt je frozen, ali QueryClient i unutarnji storeovi time nisu duboko nepromjenjivi. Njihova sučelja dopuštaju kontroliranu promjenu. Tip također ne daje univerzalni disposer; cleanup mora dati vlasnik koji stvara rad.

## Sačuvajte poredak ovisnosti

Pojednostavljena **mapa ugrađene kompozicije**:

```text
render error boundary
  fiksne postavke
    lokalizacija
      lokalizirana tema (display/accessibility postavke unutra)
        lokalizirani feedback
          runtime kontekst
            zajednički QueryClient
              autentikacija
                router i sadržaj
```

Fiksne postavke dostupne su prije jezika i teme. Lokalizacija drži jezik i smjer. Tema iz njega izvodi MUI opcije, feedback dobiva prevedeni close naziv. Auth koristi servis ispod istog QueryClienta. Runtime i query provider pripadaju istom vijeku.

Novi provider treba jasnu ovisnost i opseg uklanjanja. Page overlay pripada stranici featurea, ne automatski cijeloj aplikaciji. Nacrt rute ne treba postati globalan radi jednostavne kompozicije.

| Promjena        | Vlasnik                  | Problem za izbjeći               |
| --------------- | ------------------------ | -------------------------------- |
| API politika    | Runtime/data granica     | Klijent po komponenti            |
| Jezik           | Lokalizacija             | Ponovno stvaranje servisa        |
| MUI tekst       | Lokalizirana tema        | Drugi konkurentski theme root    |
| Overlay sesija  | Page feature             | Preživljava nepovezanu stranicu  |
| Auth query      | Zajednički QueryClient   | Auth i page različiti cachevi    |
| Render pogreška | Vanjska neovisna granica | Oporavak treba slomljen kontekst |

## Pogreške i oporavak

Nedostajući obvezan kontekst treba jasno zakazati; lažni default runtime skriva kompoziciju. Za preview i test dajte namjernu minimalnu granicu, ne nevidljivu drugu produkcijsku implementaciju.

Promjena jezika i teme treba memoizirano izvesti prikaz uz iste query/auth instance. Reset runtimea radi jezika izgubio bi cache, naredbe i identitet bez namjernog prijelaza. Stvarna promjena identiteta ima vlastitu cache politiku, ne smije biti skrivena kao vizualni rerender.

Bootstrap cleanup izričito uklanja inicijalizirane signale. Ova tvornica ne daje opću teardown transakciju resursa. Za socket, worker ili listener definirajte startup rollback i gašenje umjesto pretpostavke da ih provider stablo pronalazi.

## Scenariji prihvaćanja

Feature i auth gledaju isti klijent. Jezik mijenja temu i feedback bez novog API-ja. Unmount lokalnog providera završava njegove sesije. Nedostajući provider jasno se dijagnosticira, bez drugog singletona. Nova ovisnost ima preduvjet i cleanup. Neovisna recovery stranica radi i nakon provider pogreške.

Pri pregledu pitajte zašto postoji svaki rub i što završava njegov vijek. Kratko objašnjenje korisnije je od univerzalne tvornice koja skriva poredak.

## Izbjegnite ove prečace

Nemojte runtime stvarati u komponenti, svaki feature omotati novim klijentom, preurediti providere bez ovisnosti ni lokalno stanje globalizirati. Stabilni vlasnici čine root malenim.

## Izvori i podrijetlo

- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/main.tsx` — jednokratno stvaranje.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/runtime/createAppRuntime.ts` — servisi i featurei.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/runtime/AppProviders.tsx` — poredak i lokalizirani adapteri.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/App.tsx` — vanjska recovery granica i router.
