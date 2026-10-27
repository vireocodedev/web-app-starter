# Lokalizacija, tema i postavke

Lokalizacija, tema i postavke ljuske zasebni su aplikacijski vlasnici koji
surađuju preko providera i malih hookova.

## Vlasnici aplikacijskih postavki

`src/app/localization` posjeduje podržane jezike, stvaranje i18nexta, oblike
prijevoda, formatere, prezentaciju lokaliteta i jezičnu postavku. Engleski i
hrvatski objekti imaju isti tipizirani oblik u svakom prostoru imena.
Aplikacijski tekst u svim buildovima koristi samo `translation` i
`useAppTranslation()`. Otvorena sučelja `AppTranslationResource` i
`AppTranslationResources` opisuju obične resurse neovisno o konkretnoj
implementaciji. Samo Storybook proširuje prostore imena vodiča pod
`docs/storybook/`; produkcija ne uvozi resurse vodiča ni njihovo proširenje tipova.
Komponente koriste hookove formattera umjesto izravnog uvoza prijevoda.
RGO aplikacije podržavaju samo LTR.

`src/app/theme` posjeduje MUI temu, zadane postavke komponenti, tipografiju,
razmake, prijelomne točke, shemu boja i postavke prikaza. Tema prima MUI opcije
aktivnog lokaliteta. Način boje prati izričit odabir korisnika ili sustav kad
nema spremljene iznimke. Meka tamna tema koristi zasebnu paletu boja
ugljena uz ponašanje tamnog načina rada. Sustav i dalje koristi zadanu Tamnu
paletu kada je operacijski sustav u tamnom načinu. Veličina teksta nudi Uobičajenu (100 %),
Srednju (112,5 %) i Veliku (125 %) opciju. Vlasnik pohrane jednokratno
pretvara ranije spremljenu vrijednost `big` u `medium` kako bi zadržao
prethodnu veličinu prikaza. Gustoća tablica na računalu zadano je Mala.
Spremljena Srednja ili fiksna aplikacijska vrijednost imaju prednost, a reset
Izgleda vraća konfiguriranu zadanu vrijednost. Povećani kontrast prema zadanim postavkama
nije uključen. Kada je uključen, tema izvodi izraženije semantičke tokene za
tekst i obrube u svijetloj, tamnoj i mekoj tamnoj temi, bez promjene odabranog
načina boja, neutralnih površina ili RGO naglaska. Provider obnavlja paletu
tako da MUI CSS varijable i JavaScript čitanja teme koriste iste vrijednosti.
Ovdje se nalaze i postavke pristupačnosti: kretanje prema zadanim postavkama prati sustav, a tekstne poveznice zadržavaju
stil podcrtavanja stranice. Korisnik može smanjiti nepotrebno kretanje ili
uvijek podcrtati poveznice u sadržaju. To obuhvaća poveznice u sadržaju bez promjene navigacije aplikacije ili gumba.
Storybookovi primjeri zasebno prikazuju poveznice članaka.

`src/app/shell` posjeduje privremeni ili stalni način navigacijske ladice
na računalu, otvoreno i sažeto stanje stalne ladice te način zadržavanja
zaglavlja pri pomicanju. Donji gumb stalne ladice mijenja prikaz između
naziva i trake ikona, a gumb u zaglavlju skriva je ili vraća.
Mobilna navigacija uvijek koristi privremenu ladicu, a samo prvi redak
zaglavlja ostaje pri pomicanju. Usmjerivač daje odredišta i podatke o grupama
ruta; ljuska sprema način prikaza navigacije.

Svaki vlasnik izlaže i jednu reset akciju za cijeli skup svojih postavki:
`useResetAppLocale()`, `useResetAppThemePreferences()`,
`useResetAppShellPreferences()` i `useResetAppAccessibilityPreferences()`. Ti hookovi vraćaju konfigurirane zadane
vrijednosti postojećim setterima, pa ponašanje živih promjena, validacije i
best-effort spremanja ostaje isto. Hook za reset teme koristi MUI kontekst
sheme boja i zato se mora pozivati ispod `AppThemeProvider`.

## Settings prikazuje, a ne posjeduje

`/settings/appearance`, `/settings/navigation` i `/settings/accessibility`
prikazuju aplikacijske postavke unutar rute Postavke; `/settings` preusmjerava
na Izgled. Prilagodljiva navigacija Postavki prikazuje identitet računa iznad
navigacije stranica. U spremnicima širine najmanje 900 px poveznice odjeljaka
čine bočnu navigaciju. U užim spremnicima gumb pune širine prikazuje trenutačni
odjeljak i otvara pomičnu donju ladicu sa svim odjeljcima. Zatvaranje vraća fokus
na taj gumb, a uspješna navigacija koristi uobičajeni fokus ljuske na glavni
sadržaj. Retci postavki na svim širinama prikazuju naziv i opis iznad kompaktnih
opcija koje se prelamaju. Izgled grupira kontrole u Temu i jezik, Kontrast, Gustoću
i oblik te Uređivače. Navigacija sadrži način rada glavne ladice i zadržavanje
zaglavlja pri pomicanju. Pristupačnost sadrži postavke kretanja i podcrtavanja
poveznica u tekstu. `src/features/settings` sastavlja kontrole iz hookova
njihovih vlasnika, ali ne posjeduje njihove vrijednosti. Nema tvornicu, zapis
u `appFeatures.ts` ni runtime hook. Svaki odjeljak ima vlastiti reset: Izgled
sastavlja vlasničke reset akcije teme i jezika, Navigacija koristi reset
vlasnika ljuske, a Pristupačnost koristi reset svojeg vlasnika. Te akcije
koriste zadane vrijednosti i settere vlasnika umjesto nabrajanja pojedinačnih
vrijednosti postavki u Settingsu.

Mogućnost podešavanja tijekom builda jedna je aplikacijska politika izvedena iz
tipiziranog ugovora varijabli `VITE_SETTINGS_NOCFG_*`. Bootstrap provider
distribuira domenske nazive postavki, a ne nazive varijabli okruženja. Vlasnici
postavki provode fiksnu vrijednost pri početnom razrješavanju i odbijaju pokušaje
promjene setterom ili događajem pohrane bez prepisivanja spremljene neaktivne
vrijednosti. Settings samo filtrira odgovarajuće retke, a ljuska uklanja kontrole
fiksnog jezika i teme iz zaglavlja. Koristite `useAppColorScheme()` umjesto
izravnog MUI hooka `useColorScheme()` kako bi politika fiksnog načina boja
obuhvatila i izravne settere.

Stabilne nesenzitivne postavke koriste aplikacijsku pohranu. Kontekst, provider,
hook, validacija i reset ostaju uz pravog vlasnika. Ne stvarajte generički
Settings store samo zato što se vrijednost tamo uređuje.

## Dodavanje postavke

Pri dodavanju postavke obuhvatite početno razrješavanje, spremljenu iznimku,
reset, životni vijek providera, prevedenu oznaku i oba podržana jezika. Proširite
reset hook vlasnika i njegov fokusirani test sa stvarnim providerom; reset odjeljka u Settingsu ne treba mijenjati. Postavka koja pripada samo jednoj
značajci ostaje uz tu značajku. Novu aplikacijsku postavku stavite u odgovarajući
odjeljak i odlučite treba li tipizirani build-time ulaz za fiksnu vrijednost. Proširite
normaliziranu politiku na jednom mjestu.
