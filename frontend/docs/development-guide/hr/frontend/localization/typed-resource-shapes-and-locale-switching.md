# Uskladite oblik resursa, množinu i ponovno računanje jezika

Ključ može postojati u oba jezika, a imati pogrešnu množinu ili interpolaciju. Jezik se može promijeniti dok izbornik čuva tekst mounta. Tipizirani oblik, jezično ponašanje i recomputation povezani su, ali različiti ugovori.

Ovo je **ugrađeno starter ponašanje**. Engleski definira strukturu, hrvatski zadovoljava string-leaf oblik, i18next augmentation provjerava ključeve, a provider posjeduje instancu. Tema i formatteri izvode se iz aktivnog jezika.

## Okidač i vlasnik

Koristite za nove grane, množine, formatirane vrijednosti i promjenu jezika bez gubitka zadatka. Lokalizacija registrira resurse i politiku; feature posjeduje task copy. Komponenta određuje izvod naziva. Poslovni nacrt čuva stabilne ID-eve i vrijednosti, ne prevedeni tekst kao identitet.

`StringLeaves` čuva nazive svojstava, a listove širi na string. Hvata strukturu, ne značenje, placeholder paritet, gramatiku ni sigurnost svakog konteksta. Strogi ključevi ne zamjenjuju pregled teksta.

## Množinu i vrijednosti modelirajte namjerno

Neutralna **ilustracija resursa**:

```ts
const english = {
  items_one: "{{count}} item",
  items_few: "{{count}} items",
  items_other: "{{count}} items",
} as const;
// Paralelni jezik daje isti deklarirani strukturni rječnik.
// Poruku zovite brojčanim countom, ne spajanjem sufiksa.
```

Dokumentacijski resursi vodiča namjerno imaju one/few/other u oba jezika kako bi hrvatski kardinalni oblici stali u oblik. Žive pod `docs/storybook/` i nisu dio aplikacijskih resursa. Engleski singular/plural nije cijelo pravilo svakog jezika. Proslijedite broj, a i18next neka bira oblik.

Brojevi, valuta i datumi posebna su granica. `useAppLocalizationFormatters` mijenja vezane funkcije s jezikom i zadano koristi aplikacijsku zonu. Valuta je izričit argument; jezik ne određuje poslovnu valutu.

## Sačuvajte provider vijek

`createAppI18n` stvara instancu, ne globalni default. Svim aplikacijskim buildovima daje samo obične resurse. Storybook zasebno registrira prostore imena vodiča iz `docs/storybook/`; otvorena sučelja aplikacijskih resursa dopuštaju to proširenje samo u dokumentaciji, bez produkcijskog importa. Bundled inicijalizacija je sinkrona. Remote resursi trebaju novi readiness/error ugovor, ne pretpostavljeno čekanje.

Provider sluša languageChanged, ažurira locale i document `lang`/`dir`, a cleanup vraća stare atribute. Setter sprema izričit izbor i mijenja instancu osim uz fixed. Browser je početni fallback, ne trajno nadjačavanje korisnika.

| Vrijednost                | Vlasništvo                                      |
| ------------------------- | ----------------------------------------------- |
| ID i status               | Stabilna domena                                 |
| Naziv izbornika ili polja | Aktualni prijevod                               |
| Validacija                | Namjerno ponovno građenje ili validiranje       |
| Broj i datum              | Formatter sa zonom i valutom                    |
| Otvoreni overlay          | Aktualni props ili izričit captured-copy ugovor |
| Document jezik i smjer    | Provider                                        |

## Pogreške i oporavak

Nemojte prijevode memoizirati praznim ovisnostima ni naziv spremiti kao route ID. Jezik ne treba stvarati novi runtime, odbaciti nacrt ni mijenjati identitet naredbe. Ako pogreška ili dijalog čuva stari tekst, definirajte to; provider ne može prepisati svaki string featurea.

Fixed blokira setter. Provider nema cross-tab storage listener; languageChanged nije sinkronizacija svih kartica. Smjer također ne dokazuje potpuni RTL svake komponente; pregledajte podržane jezike i stvarni raspored.

i18next za React ima isključen interpolation escaping. To nije dopuštenje za untrusted HTML. Koristite normalan siguran prikaz i namjernu rich-content granicu.

## Scenariji prihvaćanja

Nedostajući hrvatski property hvata shape. Brojčani count pokriva oblike. Jezik mijenja izbornike, MUI, formatere i document bez promjene nacrta. Spremljeni izbor ima prednost nad browserom. Fixed se ne mijenja shortcutom. Stari memo tekst nije pogrešno pripisan provideru. Aplikacijski resursi u razvoju i produkciji ne sadrže tekst vodiča.

## Izbjegnite ove prečace

Nemojte ručno slagati množinu, jezikom birati valutu, vječno čuvati prijevod ni tipom jamčiti gramatiku. Jezik je živi prikaz nad stabilnom domenom.

## Izvori i podrijetlo

- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/localization/types/TranslationShape.ts` — strukturni oblik.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/localization/i18next.augmentation.ts` — ključevi i namespace.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/localization/createAppI18n.ts` — instanca, readiness i interpolation.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/localization/components/AppLocalizationProvider.tsx` — jezik, document i fixed.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/localization/hooks/useAppLocalizationFormatters.ts` — recomputation.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/localization/translations/development-guide.hr.ts` — množine i shape.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/localization/preferences/localePreference.ts` — početni jezik iz pohrane, browsera i defaulta.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/localization/translations/development-guide.en.ts` — paralelni one/few/other oblik.
