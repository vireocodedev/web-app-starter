# Karta izvornog koda i vlasništvo

Aplikacija je organizirana prema **vlasniku**, a ne prema vrsti datoteke. Prvo
odredite sposobnost odgovornu za promjenu, zatim odaberite najmanju mapu uloga
koja tu sposobnost čini preglednom.

## Korijeni izvornog koda

```text
src/
├── app/          stabilna infrastruktura i kompozicija aplikacije
├── features/     produktne sposobnosti i uklonjivi primjeri
├── pages/        ulazi ruta koji slažu javna sučelja
├── main.tsx      pokretanje i korijen kompozicije
└── vite-env.d.ts Vite tipovi i deklaracije vremena izgradnje
```

`src/app` posjeduje zajedničku infrastrukturu: pokretanje, provjerenu
konfiguraciju, HTTP i Query postavke, autentikaciju, lokalizaciju, usmjeravanje,
ljusku, temu, koordinaciju prikaza u sloju preklapanja i usluge pohrane u pregledniku. `src/features` posjeduje poslovno
ponašanje i korisničko sučelje značajki. `src/pages` namjerno je tanak sloj
koji za jednu rutu slaže javna sučelja značajki i aplikacije.

`src/app/forms` posjeduje ponovno upotrebljive ugovore obrazaca, pomoćnike
životnog ciklusa i kontrole unosa u `components/`. `AppSingleChoiceToggleGroup`
prikazuje kontrolirani odabir jedne opcije. Značajke daju vrijednosti, prevedene
oznake i raspored te zadržavaju vlasništvo nad validacijom i pohranom.

`src/app/overlays` koordinira prikaze unutar preklapanja vezanog uz stranicu.
Upravljač i `RgoOverlayProvider` moraju se ukloniti zajedno kako panel ne bi
ostao bez zaštite zatvaranja. Kontakti i primjeri slojeva u razvojnom vodiču
uključuju prikaz kao donju ladicu ispod granice od 1024 px. Pružatelj pamti
taj prikaz pri otvaranju svakog sloja kako promjena širine ne bi ponovno
montirala aktivni uređivač; spremljena postavka prikaza vrijedi za nove
slojeve otvorene na računalu.
Donje ladice imaju ručicu za povlačenje prema dolje, dok pomicanje sadržaja
ostaje izvorno. Privatna aplikacijska ručica služi i navigacijskim ladicama
ljuske i Postavki. Ladice objavljenog overlay providera koriste njegove
privatne mehanizme i postojeće zaštićeno zatvaranje. Privremeni paneli i donje
ladice ispunjavaju jednu izdignutu površinu; odmak radnog prostora tablice
pripada samo usidrenim panelima.

Uklonjive razvojne upute grupirane su bez spajanja njihovih vlasnika:

```text
src/features/development-guide/{architecture,contacts,handbook,patterns/<category>}
src/pages/development-guide/{architecture,contacts,handbook,patterns}
tests/features/development-guide/{architecture,contacts,patterns/<category>}
```

Architecture, Contacts, Handbook i svaka Patterns kategorija i dalje imaju odvojena javna
sučelja i granice ovisnosti. `development-guide` je fizičko grupiranje koda koji
se izostavlja iz produkcije, a ne jedna široka granica značajke.

Katalog Handbook posjeduje dvojezične fullstack članke u
`docs/development-guide/`. Router sastavlja njegov javni manifest u rute
kategorija, tema i članaka. Zajednički prikaz Markdowna i navigacija stranice
pripadaju `app/shell/documentation`; ne uvoze kataloge članaka.

## Vlasnici paketa, testova i mockova

Ponovno upotrebljivi paket `@rgo-web/frontend` zaseban je vlasnik. On isporučuje
opće komponente i usluge, a aplikacija bira njihovu konfiguraciju i slaže ih u
produktno ponašanje. Aplikacijska pravila ne premještajte u paket samo zato što
ih koristi više datoteka aplikacije.

Vrhunski `tests/` zrcali vlasništvo produkcijskog koda te sadrži zasebna
područja `integration/` i `browser/`. Vrhunski `mocks/` sadrži razvojnu MSW
granicu i determinističke auth pripreme. Ni jedno ne pripada u produkcijski
`src/`.

## Neobvezni primjeri i stabilna infrastruktura

Neki isporučeni primjeri nisu obvezni. Contacts je cjelovit primjer značajke,
Settings je prezentacija aplikacijskih postavki, a Patterns, Architecture i Handbook su
razvojne upute. Pri uklanjanju primjera uklonite njegovu značajku, stranice,
testove, rute, prijevode i registracije. Stabilni vlasnici kao `src/app/data`,
`src/app/router` i ljuska ostaju dok ih aplikacija treba.

## Izbjegavajte kod bez vlasnika

Ne stvarajte `src/shared`, `src/common` ili `src/utils`. I ponovno upotrebljiv
alat treba odgovornu sposobnost i usko sučelje.
