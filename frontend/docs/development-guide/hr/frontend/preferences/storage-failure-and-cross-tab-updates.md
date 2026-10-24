# Odvojite otpornu pohranu i živu sinkronizaciju kartica

Tipizirani storage može popraviti JSON bez ažuriranja svakog providera. Živa postavka može raditi i kada persistencija ne uspije. Čitanje, upis, aktualno stanje i druge kartice različite su odgovornosti; localStorage nije automatski reaktivni globalni store.

Ovo je **ugrađeno starter ponašanje s RGO ugovorom**. RGO validira default i vrijednost, sigurno čita i popravlja JSON, a izričit write može pasti. Provider čuva živi izbor nakon write pogreške. Cross-tab postoji za accessibility i temu, ne ravnomjerno za sve vlasnike.

## Okidač i vlasnik

Razlika vrijedi za novu postavku, ograničen storage i obećanje rada među karticama. Servis posjeduje serijalizaciju, shemu i otporno čitanje. Provider stanje i pretplatu. Feature odlučuje je li best-effort dovoljno.

`get` vraća default pri read pogrešci. Nedostajući, malformed ili schema-invalid zapis popravlja se pojedinačno koliko je moguće; neuspjeh repaira ne ruši read. `set` provjerava i serijalizira pa upisuje i može baciti. Konstruktor provjerava default; kriva aplikacijska vrijednost ne prihvaća se tiho.

## Promjenu provedite kroz vlasnika

Ovo je **konceptualni tok**, ne zamjenski API:

```text
kontrola -> tipizirani setter -> živo stanje
                            -> best-effort provjereni upis
storage događaj druge kartice -> pretplaćeni provider -> provjeren read -> stanje
```

Kartica koja piše ne čeka vlastiti nativni storage event. Setter mijenja state izravno. Sirovi `appLocalStorage.set` zato može trajno promijeniti zapis bez obavijesti mountanom provideru iste kartice. Za stanje i storage koristite vlasnički API.

Nemojte setteru dati neprovjeren vanjski input samo zbog TypeScripta. Više providera prvo postavlja state pa pokušava provjeren upis. Catch čuva živu postavku pri storage kvaru; nije opći runtime validator proizvoljnog unosa.

| Vlasnik                | Ugrađeno vanjsko ažuriranje                               |
| ---------------------- | --------------------------------------------------------- |
| Motion i podcrtavanje  | Listener čita svoj ključ ili clear; fixed i dalje vrijedi |
| Theme mode i shema     | MUI storage pretplata i fixed pravilo                     |
| Font, tablica i editor | State i setter; nema prikazanog storage listenera         |
| Drawer i header        | State i setter; nema listenera                            |
| Locale                 | i18n jezični događaj instance, ne storage                 |

## Pošteno definirajte granice

Pretplata obuhvaća browser kartice/prozore opsega pohrane, ne uređaje. Nema verzioniranog mergea, conflict journala ni server account sinkronizacije. Dvije kartice ne dobivaju transakciju više ključeva.

Ako zahtjev traži live sve postavke, proširite stvarne vlasnike ili jednu namjernu granicu. Nemojte dati drugi generički listener koji se natječe s temom i accessibilityjem. Fixed poštujte pri writeu i readu.

Clear event ima `key === null`; pretplaćeni vlasnici čitaju default. To ne dopušta globalno čišćenje kao reset. Reset cilja vlastitu domenu, a privatni nacrti i naredbe pripadaju drugdje.

## Pogreške i scenariji prihvaćanja

Malformed JSON daje valjan default bez pada. Blokirani ili puni storage ostavlja valjano živo stanje, a trajno spremanje ima zaseban ugovor. Motion druge kartice mijenja se osim uz fixed. Font promijenjen izvana ovdje nema jamstvo odmah: treba reload ili proširenje. Setter aktualne kartice radi i bez storage događaja.

Provjerite release pretplate i ignoriranje tuđih ključeva. Vrijednosti neka budu neosjetljive; shema nije šifriranje, identitet ni server ovlast. Poslovni trajni rad ne smije preuzeti best-effort semantiku postavke.

## Izbjegnite ove prečace

Nemojte pohranu svugdje smatrati reaktivnom, write failure nazvati durable saved, zaobići provider sirovim upisom ni obećati sve kartice i uređaje bez implementacije. Imenujte čitanje, upis i propagaciju.

## Izvori i podrijetlo

- `RGO/frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:src/services/RgoLocalStorageService/RgoLocalStorageService.ts` — otporan read i repair, write pogreške.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/theme/preferences/AppAccessibilityPreferencesProvider.tsx` — setter i cross-tab.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/theme/appThemeStorageManager.ts` — theme pretplate i fixed.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/theme/preferences/AppDisplayPreferencesProvider.tsx` — display bez storage listenera.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/shell/preferences/AppShellPreferencesProvider.tsx` — shell vijek i upis.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/localization/components/AppLocalizationProvider.tsx` — jezik unutar instance.
