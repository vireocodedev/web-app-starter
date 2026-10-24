# Fiksne deployment postavke neka nadjačaju korisnika bez brisanja izbora

Deployment može fiksirati jezik, temu, motion ili editor. To nije isto što i default. Fiksan izbor vrijedi u runtimeu, a korisnikov spremljeni treba ostati ako deployment kasnije ukloni pravilo.

Ovo je **ugrađeno starter ponašanje**. Javni `VITE_SETTINGS_NOCFG_*` mapiraju se u `AppFixedSettings`. Provideri štite write, Settings uklanja kontrole, a theme storage čuva korisničke vrijednosti umjesto zamjene deploy politikom.

## Okidač i vlasnik

Koristite kada deployment namjerno uklanja konfigurabilnost. Bootstrap provjerava i pretvara, provider bira efektivno i štiti setter, Settings bira prikaz. Skrivena kontrola nije provedba; drugi callback i prečac trebaju istog vlasnika.

`undefined` znači nije fiksno. False je i dalje fiksno false. System tema ili motion fiksiraju praćenje sustava bez korisničkog nadjačavanja. Truthiness nije ispravna provjera.

## Sačuvajte ugovor prednosti

Ovo je **konceptualna odluka**, a ne novi helper:

```ts
const effective = fixedValue !== undefined ? fixedValue : (savedUserValue ?? applicationDefault);

// Setter ništa ne mijenja kada fixedValue !== undefined.
// Fiksnom vrijednošću ne prepisujte korisnikov storage.
```

Vlasnik može imati dodatni izričit ulaz. Drawer bira fiksno, izričit initial mode, pohranu pa shell default. Display bira fiksno, pohranu pa temu. Accessibility izlaže fixed i odbija write. To su različiti namjerni ugovori, ne univerzalan merge za slijepu primjenu.

Deploy editor `docked` i `overlay` pretvara se u `docked-panel` i `overlay-panel`. Pretvorbu zadržite na config/domain granici. Soft-dark slično postaje MUI dark plus imenovana shema.

| Situacija                   | Ponašanje                | Korisnikova pohrana          |
| --------------------------- | ------------------------ | ---------------------------- |
| Nema fiksnog, postoji izbor | Spremljeni izbor         | Čuva se i mijenja korisnikom |
| Nema obaju                  | Default                  | Nema lažnog overridea        |
| Postoji fixed               | Deploy politika          | Ostaje ispod                 |
| Fixed false                 | False, promjena odbijena | Ostaje                       |
| Reset uz fixed              | Guard čuva fixed         | Nije zamijenjeno defaultom   |
| Restart bez fixed           | Redovita prednost        | Izbor ponovno dostupan       |

## Kontrole i granice vijeka

Interface i Accessibility hookovi uklanjaju fiksne retke. Provideri neovisno blokiraju settere. Oba su bitna: skriven Settings uz aktivan header shortcut bio bi proturječan.

Objekt nastaje pri bootstrapu. Više providera iz njega inicijalizira state, ne implementira proizvoljni hot update svih fixed vrijednosti. Nemojte obećati živo prebacivanje deploy politike bez remounta ili restarta. Uklanjanje env ključa nova je konfiguracija, ne pretpostavljena promjena propsa.

Theme storage štiti zapis i fixedom razrješava čitanje i pretplatu. Layout guard čuva MUI mode/scheme. To je prikazna politika, ne autorizacija backenda ni zaštita podataka.

## Pogreške i scenariji prihvaćanja

Spremite izbor pa pokrenite drugačiji fixed: politika vrijedi bez prepisivanja. Pokušajte kroz Settings, setter, reset i shortcut: ostaje fixed. Fiksirajte false: nije odsutnost. Restartajte bez ključa: stari izbor može se vratiti. Nevaljan javni input odbija se prije rendera.

Nazivi i kontrole trebaju pratiti politiku. Ako treba objašnjenje nedostupne prilagodbe, koristite smislen tekst, ne nazive env varijabli u proizvodu.

## Izbjegnite ove prečace

Nemojte samo sakriti retke, startupom prepisati storage, koristiti `if (fixedValue)` za boolean ni obećati nepodržan hot update. Fiksno, korisničko i default imaju izričit poredak.

## Izvori i podrijetlo

- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/bootstrap/config/fixedSettings.ts` — domenski oblik i editor pretvorba.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/theme/preferences/AppDisplayPreferencesProvider.tsx` — prednost i guard.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/shell/preferences/AppShellPreferencesProvider.tsx` — initial drawer i shell guard.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/theme/appThemeStorageManager.ts` — fixed bez prepisivanja korisnika.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/features/settings/sections/interface/hooks/useInterfaceSettingsSection.tsx` — filtriranje interfacea.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/features/settings/sections/accessibility/hooks/useAccessibilitySettingsSection.tsx` — filtriranje accessibilityja.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/theme/preferences/AppAccessibilityPreferencesProvider.tsx` — fixed accessibility i zaštićeni setteri.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/theme/components/AppThemeProvider.tsx` — fixed MUI mode/scheme guard.
