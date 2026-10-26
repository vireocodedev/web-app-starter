# Pristupačne postavke provedite semantičkim vlasnikom teme

Motion, kontrast, tekst i veličina mete utječu na cijeli zadatak, uključujući overlay i pogrešku. Koristite preference i theme granice umjesto izdvojenog CSS-a koji ignorira fixed, sustav ili drugu shemu.

Ovo je **ugrađeno ponašanje s granicama**. AppThemeProvider izvodi opcije i globalne stilove iz providera. Component defaulti daju fokus i česte veličine. To je početna politika, ne tvrdnja da je svaka stranica i kontrola provjerena.

## Okidač i vlasnik

Theme vlasnik drži globalne tokene i component tretman. Feature nazive, strukturu, interakciju i iznimke. Provider drži žive, sistemske i fixed izbore; Settings je samo prikaz.

Ugrađena skala postavlja root na 100%, 112.5% ili 125%. Motion prati sustav ili izričito smanjuje. Increased contrast bira cijele alternativne sheme i usklađuje palette i CSS varijable umjesto nekoliko DOM boja.

## Sačuvajte semantiku motiona

Ovo je **konceptualno pravilo**, ne novi API:

```text
system -> prefers-reduced-motion
izričito reduce -> manje tranzicija bez obzira na sustav
custom JS/SDK -> namjerno koristiti istu politiku
pending rad -> istinit progress i status
```

Provider daje motion temi i globalno skraćuje CSS transition na 0.01ms izričito ili media queryjem. CSS animacije, uključujući progress, namjerno ostaju. To nije isključivanje svih animacija.

Custom loop, canvas i SDK trebaju vlastitu integraciju; CSS ne prekida proizvoljni JS. RGO docked entrance čita OS query. App override ne treba automatski pripisati svakoj bibliotečnoj callback funkciji bez pregleda vlasnika.

| Pitanje   | Ugrađeno              | Feature                   |
| --------- | --------------------- | ------------------------- |
| Tekst     | Root postotak         | Reflow i dosegljivost     |
| Motion    | Tema i CSS            | JS/SDK i fokus            |
| Kontrast  | Semantičke sheme      | Tokeni i ne-bojni znakovi |
| Meta      | MUI minimumi          | Custom i override         |
| Fokus     | Focus-visible outline | Red, nazivi i odredište   |
| Poveznice | Podcrtavanje prose    | Semantika linka i akcije  |

## Veličina i kontrast nisu univerzalna potvrda

Button, icon button, checkbox, radio, menu item i outlined input imaju odgovarajuće 44px minimume. Ne koriste svi iste komponente, a `sx`, gustoća i navigacija mogu ih nadjačati. AppPageNavigation namjerno razlikuje desktop i sheet. Provjerite stvarnu klikabilnu metu, ne tvrdnju o cijeloj temi.

Koristite `rgo`/MUI semantičku boju teksta, obruba, statusa, fokusa i radnje. Increased contrast obuhvaća light, dark i soft-dark. Fiksni hex može zaobići politiku; svjetliji obrub nije potvrda punog standarda.

Underline pravilo cilja main sadržajne linkove i izuzima aside/button-like. Ne mijenja svaki anchor. Zadržite razliku između navigacijske kontrole i poveznice čitanja.

## Pogreške i scenariji prihvaćanja

Povećajte tekst na uskoj prevedenoj stranici: radnje su dostupne i nazivi se prelamaju. Promijenite shemu i kontrast: status i fokus ostaju dosljedni. System i explicit reduce skraćuju prijelaz bez gubitka progressa. Custom widget namjerno prati politiku. Fokus tipkovnice ostaje vidljiv bez ocrtavanja cijelog maina.

Pregledajte error, disabled, selection, hover, active i portal, ne samo početno stanje. Scan, keyboard/geometry tvrdnje i vizual daju različit dokaz. Nijedan sam ne jamči sve. Pri odobrenoj provjeri navedite stvarne postavke, jezike i viewporte.

## Izbjegnite ove prečace

Nemojte ugasiti svu povratnu informaciju, CSS-u pripisati SDK animacije, hardkodirati boje ni defaultima jamčiti svaku veličinu i kontrast. Politika treba točnog potrošača i dokaz zadatka.

## Izvori i podrijetlo

- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/theme/components/AppThemeProvider.tsx` — tekst, motion, underline i tema.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/theme/config/theme.components.ts` — fokus i minimumi.
- `vireocode-web-app-starter@4e9f00d3ed781205eeecea70d7543c13d5da7868:frontend/src/app/theme/config/theme.palette.ts` — kontrastne sheme.
- `RGO/frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:src/capabilities/Overlays/RgoOverlayProvider.tsx` — OS motion i lifecycle prijelaza.
