# Runtime, provideri i životni vijek

Odaberite životni vijek prije nego što odaberete Context, Signal ili lokalno
stanje.

## Tablica životnih vjekova

| Životni vijek    | Vlasnik i stvaranje                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| Aplikacija       | Stvara se jednom u `main.tsx` ili modulima pokretanja; gasi se pri pogrešci i prema potrebi pri HMR-u |
| Runtime značajke | Stvara ga `createAppFeatures()` i izlaže jedan tipizirani hook značajke                               |
| Ruta             | Stvara ga element ili loader rute i odbacuje se napuštanjem rute                                      |
| Komponenta       | Stvara ga najbliža komponenta, a njezin efekt ga čisti                                                |

## Aplikacijski runtime i runtime značajke

`createAppRuntime()` gradi stabilnu infrastrukturu i zamrzava rezultat: jedan
Query klijent, konfigurirani Axios, auth runtime i prazan registar značajki.
Settings je prezentacijska značajka i ne treba tvornicu ni runtime hook. Contacts
pokazuje ubrizgane Query/API ovisnosti pod `docs/storybook/examples/Contacts/`,
uz vlastiti preview Context i privatni memorijski adapter. Nije registriran u
produkcijskom runtimeu. Potrošač mora izričito implementirati i registrirati
svaku novu poslovnu značajku.

## Redoslijed providera

Cjelovita aplikacijska kompozicija izgleda ovako:

```text
AppRenderErrorBoundary
└─ AppProviders
   └─ AppFixedSettingsProvider
      └─ AppLocalizationProvider
         └─ lokalizirani AppThemeProvider
            └─ lokalizirani RgoFeedbackProvider
               └─ AppRuntimeProvider
                  └─ QueryClientProvider
                     └─ AppAuthProvider
                        └─ RouterProvider
```

`App` posjeduje vanjsku granicu za pogreške renderiranja i delegira kompoziciju
providera u `AppProviders`. Redoslijed prati potrošnju: lokalizacija i tema
čitaju fiksna pravila deploymenta, tema treba lokalitet, feedback prijevode, a
auth runtime i Query klijent. RGO podržava samo LTR.

## Smještaj providera i tipizirano dohvaćanje

Provider postavite što bliže potrošačima. Iznad usmjerivača pripada samo
usluga potrebna većini ruta ili ona koja mora preživjeti promjenu rute.
Samo `hooks/use<Feature>Feature.ts` u vlasništvu značajke smije pozvati
generički `useAppFeature()`, a javni `index.ts` izlaže taj hook.
