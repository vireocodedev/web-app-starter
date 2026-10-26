# Svaki scenarij počnite namjernim životnim vijekom runtimea i predmemorije

Scenarij može prolaziti sam, a zakazati uz drugi jer naslijedi podatke, identitet ili promjenjiv servisni fixture. Izgradite svježe vlasnike granice koju provjeravate i izložite ih testu kako bi izolacija bila izričito vidljiva.

Ovo je **ugrađeni starter obrazac s referentnim scenarijem**. `renderApp` zadano daje svjež QueryClient, prima aplikacijski runtime i neobvezan MemoryRouter. Auth runtime testovi stvaraju stvarne tvornice klijenta i runtimea s izoliranim ovisnostima. To je dizajn fixturea, ne tvrdnja o izvršenju.

## Okidač i vlasništvo

Svježe fixturee koristite za komponente s podacima, runtime mogućnostima, autentikacijom i rutama. Test posjeduje QueryClient, API adapter, početnu rutu i promjenjive podatke. Aplikacijske tvornice ostaju stvarne granice kompozicije. Poseban provider može dodati ograničenu ovisnost bez zamjene cijele aplikacije.

Helper u testnom klijentu isključuje automatsko ponavljanje queryja i mutacija. Jedno odbijanje tako ostaje jedan događaj. To ne mijenja produkcijsku retry politiku: aplikacijski QueryClient zasebno provjerava otkazivanje, klijentske pogreške i ograničene mrežne pokušaje.

`renderApp` koristi QueryClient predanog runtimea ako nije izričito zadan drugi. Nemojte runtimeu i komponenti slučajno dati različite cacheve pa provjeravati krivi. Vraćeni `queryClient` omogućuje promatranje stvarnog mountanog vlasnika.

## Komponirajte potrebnu granicu

Ovo je **neizvršeni fixture pseudokod**, a ne novi ugrađeni helper:

```ts
const fixture = createDocumentScenario(); // predloženi feature fixture
const view = renderApp(<DocumentPage />, {
  runtime: fixture.runtime,
  initialEntries: ["/documents/example"],
});

// Koristite stvarnog vlasnika stranice kroz odabrani API seam.
// Promatrajte view.queryClient i vidljiv ishod pa oslobodite vlastiti rad.
```

Uz pravi RouterProvider ili drugog router vlasnika koristite `withRouter: false`; ugniježđeni router nije dodatna integracija. Memory ruta odgovara lokalnom location ponašanju, browser stvarnom fokusu, rasporedu i historyju.

Helper automatski ne resetira svaki singleton niti uklanja svaki runtime effect. Testing Library cleanup unmounta React; test i dalje posjeduje pohranu fixturea, queryje, pretplate, lažne timere i disposere. Životni vijek izrazite kroz `finally` ili prikladne hookove suitea.

| Ovisnost      | Priprema                                     | Tvrdnja izolacije                        |
| ------------- | -------------------------------------------- | ---------------------------------------- |
| Cache         | Novi klijent ili namjerni zajednički vlasnik | Nema starih ili nepovezanih zapisa       |
| Autentikacija | Novi runtime i sintetička sesija             | Promjena identiteta čisti privatni opseg |
| Ruta          | Izričita početna lokacija                    | Namjeravani URL i outlet                 |
| API stanje    | Nova instanca fixturea                       | Brojač pogreške ne prelazi drugome       |
| Effecti       | Namjerna inicijalizacija i disposal          | Nema rada nakon uklanjanja               |

## Pogreške i oporavak

Auth runtime izvor zadržava odgovor featurea, promijeni identitet pa otpusti stari odgovor. Tvrdnje pokrivaju abort, uklonjene privatne zapise i zabranu ponovnog popunjavanja. Susjedni scenarij čuva queryje ako je korisnik isti. Zajedno provjeravaju granicu umjesto pretpostavke da svaki dohvat sesije treba obrisati sve.

Curenje nemojte zadano rješavati širokim resetom modula. Birajte tvornice i vlasnike; izolaciju modula koristite kada ugovor to traži. Reset mocka ne mora resetirati store, a prazan DOM ne znači prazan cache.

## Scenariji prihvaćanja

Početak novog fixturea treba biti izričit. Promijenite korisnika uz pending dohvat: stari opseg se ne vraća. Osvježite istog: valjano stanje ostaje. Napravite dva fixturea s prvom pogreškom: jedan ne troši drugu. Unmountajte i otpustite rad: stari vlasnik ga ne prihvaća. Produkcijski retry provjerite testom politike, ne testnim isključivanjem pokušaja.

Za jezično ponašanje koristite stvarne lokalizacijske providere. Stub prijevodnih ključeva može odgovarati užoj nepovezanoj granici, ali nije dokaz lokalizacije.

## Izbjegnite ove prečace

Nemojte dijeliti mutabilan klijent među nepovezanim slučajevima, slučajno komponirati dva cachea, pretpostaviti reset svega cleanupom ni mockati tvornicu čiju politiku provjeravate. Svjež vlasnik čini dokaz razumljivim.

## Izvori i podrijetlo

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/renderApp.tsx` — svježi klijent, runtime i router te vraćena predmemorija.
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/integration/auth/createAppAuthRuntime.test.ts` — kompozicija i izolacija identiteta i kasnog odgovora.
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/tests/app/data/query/createAppQueryClient.test.ts` — zasebne tvrdnje produkcijske retry politike.
