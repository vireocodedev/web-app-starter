# Karta izvornog koda i vlasništvo

Aplikacija je organizirana prema **vlasniku**, a ne prema vrsti datoteke. Prvo
odredite sposobnost odgovornu za promjenu, zatim odaberite najmanju mapu uloga
koja tu sposobnost čini preglednom.

## Korijeni izvornog koda

```text
src/
├── app/          stabilna infrastruktura i kompozicija aplikacije
├── features/     ugrađene produktne sposobnosti (trenutačno Settings)
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
ostao bez zaštite zatvaranja. Izolirani Contacts i overlay primjeri u Storybooku
pokazuju prikaz kao donju ladicu ispod granice od 1024 px. Pružatelj pamti
taj prikaz pri otvaranju svakog sloja kako promjena širine ne bi ponovno
montirala aktivni uređivač; spremljena postavka prikaza vrijedi za nove
slojeve otvorene na računalu.
Donje ladice imaju ručicu za povlačenje prema dolje, dok pomicanje sadržaja
ostaje izvorno. Privatna aplikacijska ručica služi i navigacijskim ladicama
ljuske i Postavki. Ladice objavljenog overlay providera koriste njegove
privatne mehanizme i postojeće zaštićeno zatvaranje. Privremeni paneli i donje
ladice ispunjavaju jednu izdignutu površinu; odmak radnog prostora tablice
pripada samo usidrenim panelima.

Sve nastavne implementacije i čitači žive izvan aplikacije:

```text
docs/storybook/examples/Contacts/
docs/storybook/patterns/<Category>/
docs/storybook/architecture/ArchitectureReference/
docs/storybook/handbook/Handbook/
docs/storybook/shared/documentation/
tests/storybook/
```

Handbook katalog posjeduje metapodatke i dohvat uparenog Markdowna kanonskih
članaka pod `docs/development-guide/{en,hr}/`. Architecture čita kanonske članke
pod `docs/architecture/{en,hr}/`. Storybook posjeduje engleske čitače i zajednički
prikaz Markdowna; produkcija ne uvozi kataloge ni sadržaj. U `src/` nema ruta,
preusmjerenja, navigacije, prostora imena ni registracija primjera razvojnog
vodiča, čak ni tijekom razvoja.

## Vlasnici paketa, testova i mockova

Ponovno upotrebljivi paket `@rgo-web/frontend` zaseban je vlasnik. On isporučuje
opće komponente i usluge, a aplikacija bira njihovu konfiguraciju i slaže ih u
produktno ponašanje. Aplikacijska pravila ne premještajte u paket samo zato što
ih koristi više datoteka aplikacije.

Vrhunski `tests/` zrcali vlasništvo produkcijskog koda te sadrži zasebna
područja `integration/` i `browser/`. Vrhunski `mocks/` sadrži razvojnu MSW
granicu i determinističke auth pripreme. Ni jedno ne pripada u produkcijski
`src/`.

Storybookove upute, CSF primjeri i pripreme prikaza žive izvan `src/`, pod
`docs/storybook/<sekcija>/<Upute>/`. Svake upute imaju istoimenu mapu, a zajednički
helperi sekcije koriste `shared/`. Ulaz `docs/storybook/README.md` usmjerava obvezno
čitanje arhitekture i uputa za zadatak. Grupiranje dokumentacije
ne spaja produkcijske mogućnosti koje primjeri prikazuju.

## Reference i stabilna infrastruktura

Contacts je cjelovita dokumentacijska referenca, a ne ugrađena produktna značajka.
Živi prikaz koristi ubrizgani memorijski adapter i privatni Query klijent; adapter
pohrane u pregledniku ostaje neaktivan dok ga test izričito ne stvori. Settings
prikazuje aplikacijske postavke. Produkcijski registri `appFeatures.ts` i
`signalModules.ts` prazni su dok potrošač namjerno ne ugradi značajku ili modul
životnog ciklusa. Stabilna infrastruktura ostaje u `src/app/`.

Produkcijski izvor ne uvozi niti ponovno izvozi sadržaj iz `docs/` ili
`.storybook/`, uključujući raw Markdown, doslovne dinamičke importe i globove.
Dokumentacija i testovi smiju koristiti ugrađeni izvor kroz dopuštena sučelja.

## Izbjegavajte kod bez vlasnika

Ne stvarajte `src/shared`, `src/common` ili `src/utils`. I ponovno upotrebljiv
alat treba odgovornu sposobnost i usko sučelje.
