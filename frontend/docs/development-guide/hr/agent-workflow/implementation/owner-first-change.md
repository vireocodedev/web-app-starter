# Prije uređivanja pronađite vlasnika

**Status podrške: dokumentiran postupak predloška uz praktičan recept implementacije.** Repozitorijski `AGENTS.md`, frontend vodič, lokalne route/navigation vještine i arhitekturni dokumenti određuju trenutačno vlasništvo. Primjeri primjenjuju ta pravila; ne ugrađuju automatizaciju i ne daju ovlast za deployment.

Koristite postupak za konkretan zahtjev, posebno kad mala promjena ekrana prelazi routing, feature i zajednički prikaz. Krenite od traženog ishoda, odredite vlasnike i javne granice pa implementirajte ograničenu promjenu. Datoteka praktična za uređivanje nije nužno vlasnik ponašanja.

## 1. Utvrdite ishod, upute i dokaze

Prije promjene područja pročitajte trenutačne primjenjive `AGENTS.md` datoteke. Root upute vode na frontend vodič za frontend i workspace README za lokalni razvoj i verifikaciju. Promjena životnog ciklusa rute ili stranice aktivira lokalni `app-route-pages`; drawer, tabovi, breadcrumbs ili sidebar uključuju i `app-shell-navigation`. Slijedite pokazivače kad njihov uvjet vrijedi, umjesto učitavanja svih inicijalizacijskih i deployment postupaka za običnu promjenu funkcionalnosti.

U nekoliko redaka napišite provjerljiv ishod. Primjer: „Patterns prikazuje grupu Application state s Signals, Server data i Routing and URLs; postojeći URL-ovi članaka ostaju dostupni; oba jezika prikazuju grupu.” Granica dovršenosti uključuje postojeće rute i lokalizaciju, ne samo naslov na jednom screenshotu.

Jasno označite vrstu dokaza:

| Oznaka              | Značenje                                               | Sljedeći korak                                     |
| ------------------- | ------------------------------------------------------ | -------------------------------------------------- |
| Činjenica iz izvora | Implementirano ili dokumentirano na određenoj reviziji | Provjeriti odstupanje generiranog projekta         |
| Referentni recept   | Prilagodba potvrđena drugim izvorom                    | Navesti nedostajuće suradnike, ovisnosti i pravila |
| Prijedlog           | Neimplementirana dizajnerska odluka                    | Riješiti odluku prije tvrdnje da ponašanje postoji |

Za prenesene smjernice zabilježite projekt, commit i relativnu putanju. Dobar dizajn drugog projekta ne dokazuje da predložak sadrži njegove API-je, ovlasti ili operativnu pripremu.

## 2. Mapirajte vlasništvo i sačuvajte javnu granicu

Frontend organizira izvorni kod po mogućnosti: `app` drži stabilnu infrastrukturu, `features` ponašanje i feature UI, a tanke `pages` slažu javna sučelja rute. Namjerni izvozi feature `index.ts` datoteke njegova su javna granica. Za prelazak vlasnika koristite `@/`, a unutar vlasnika relativne importe; prije novih izvoza pregledajte postojeće.

Route politika pripada `routeRegistry.tsx`: URL, pristup, dostupnost, lokalizirani naslovi, hijerarhija, navigacija i layout metapodaci. Shell prikazuje predanu navigaciju; ne čita registry radi otkrivanja produktne politike. Route adapter može tumačiti router metapodatke i proslijediti obične podatke prikazu. Feature zadržava validaciju, pristup podacima i poslovno stanje umjesto njihova premještanja u shell jer dvije stranice trebaju sličan izgled.

| Tražena promjena                                | Vjerojatni vlasnik i granica                               |
| ----------------------------------------------- | ---------------------------------------------------------- |
| Nova routana stranica ili čuvanje starog URL-a  | Kompozicija stranice, registry i eksplicitni redirect      |
| Ponovna uporaba grupiranih navigacijskih redaka | Zajednički prikaz s labelama, ikonama, linkovima i grupama |
| Tumačenje matched route handleova               | Router adapter koji daje podatke prikazu                   |
| Novo Contacts mutation pravilo                  | Contacts model/API/runtime granica, namjerno izložena      |
| Novi preduvjet ili naziv tajne projekta         | Izvorni vlasnik i mjerodavni setup runbook                 |

Ove odluke početne su točke, ne ovlast za širok refaktor. Pregledajte susjedni kod i arhitekturnu politiku. Eksplicitni allowlist pregledljiva je granica; pad checkera nije poziv za izuzeće cijelog direktorija.

## 3. Implementirajte ograničenu promjenu

Za primjer grupiranja proširite postojeći presentation ulaz da predstavlja imenovane grupe i negrupirane stavke pa proslijedite prevedene podatke iz postojećeg pozivatelja. Sačuvajte ponašanje stavki i URL-ove. Reusable komponenta ne treba uvoziti inventar ruta ni svaka stranica duplicirati redove. Promjena javnog propa zahtijeva namjerno ažuriranje svih pozivatelja i objašnjenje kompatibilnosti.

Prije premještanja featurea pratite izvoze, rute, prijevode, mockove, testove, runtime registracije i eventualni Signal životni ciklus. Dodajte samo potrebne uloge; promjena prikaza podataka ne opravdava novi feature factory ili hook aplikacijskog životnog vijeka. Sačuvajte nepovezani rad, posebno kad drugi editor posjeduje susjedne datoteke.

Korak implementacije dovršen je kad svi zahvaćeni pozivatelji i registracije odgovaraju odabranom ugovoru, ne kad se jedna datoteka izolirano kompilira. Ako izvor pokaže potrebu veće migracije, navedite njezinu granicu umjesto tihe promjene javnog ponašanja.

## 4. Verificirajte samo autorizirano

Pročitajte konfigurirane skripte i testing vodič. Uobičajeni frontend `verify` uključuje formatiranje, lint, arhitekturu, typecheck, testove i buildove. Checker otkriva mehaničke import i lifecycle povrede; pregled i dalje odlučuje jesu li vlasnik i sučelje odgovarajući. Fokusirano pokrivanje ponašanja i šire gateove odaberite prema riziku i trenutačnim pravilima koordinacije repozitorija.

Izričita ograničenja sesije mogu suziti izvršavanje. Primjerice, kada korisnik zabrani testove do novog zahtjeva, odaberite dopuštene provjere bez testova i prijavite prazninu. Takva iznimka vrijedi za taj zadatak; ne isključuje trajno provjere repozitorija niti dokazuje prolaz neizvršenih testova. Testne datoteke mogu opisati namjeravane slučajeve bez ovlasti za izvršavanje.

Zabilježite naredbu, kandidat-reviziju ili opseg, rezultat i bitna ograničenja. Vizualni pregled potvrđuje opaženi izgled, ne ovlasti, persistenciju ili konkurenciju. Build potvrđuje kompilaciju i bundling, ne sva ponašanja opisana člankom.

## 5. Pregledajte, isporučite i prijavite granicu

Zatražite neovisan pregled kad ga zahtijevaju primjenjiva pravila ili opravdava rizik javnog ugovora i više vlasnika. Bitne nalaze riješite prije završne verifikacije. Isporuka je zasebna autorizirana radnja: commit, push, WIP PR, merge i deployment imaju vlastiti opseg. Za vremenski ograničen rad koji izričito dopušta objavu nakon svakog zadatka zabilježite commit i push, provjerite zadanu vremensku zonu i odaberite idući zadatak samo unutar dogovorenog razdoblja. Druga sesija može dopustiti samo lokalne izmjene; vodič ne daje trajne ovlasti za objavu.

Koristan završni izvještaj navodi ponašanje, vlasničke datoteke, odluke kompatibilnosti, stvarne provjere i preostala ograničenja. Kad je objava autorizirana, uključite commit/PR. Pisanje vodiča nikada ne pretvarajte u dopuštenje promjene infrastrukture, aktiviranja workflowa, mergea ili deploymenta okruženja.

## Točni izvori

- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:AGENTS.md` i `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/AGENTS.md` — trenutačne upute i vlasnička područja.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/.agents/skills/app-route-pages/SKILL.md` i `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/.agents/skills/app-shell-navigation/SKILL.md` — životni ciklus ruta i navigacija.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/docs/architecture/en/source-map-and-ownership.md` — vlasnici mogućnosti i stabilna infrastruktura.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/docs/architecture/en/dependency-boundaries-and-imports.md` — javna sučelja i smjer ovisnosti.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/docs/architecture/en/route-entries-and-feature-composition.md` i `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/docs/architecture/en/add-change-or-remove-a-feature.md` — kompozicija ruta i potpuno vlasništvo promjene.
- `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/docs/architecture/en/tests-mocks-stories-and-architecture-checks.md` i `vireocode-web-app-starter@7c2264746bd6d6c3fc00e373778831943666592b:frontend/package.json` — odgovornosti verifikacije i stvarne skripte.
