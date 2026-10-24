# Prvo generirajte, zatim prilagodite unutar vlasničke granice

Prije stvaranja standardiziranog frontend/backend izvora pronađite ugrađene generatore, procijenite stvarnu kompatibilnost, generirajte prikladnu strukturu i prilagodite poslovno ponašanje. Generirani izvor odmah pripada aplikaciji; generiranje ne dopušta prepisivanje prilagodbi ili već primijenjenih migracija.

**Instalirano proširenje obrazaca vlasništva startera.** Trenutačno radno stablo implementira CLI u `tools/generators/`; `docs/generators.md` mjerodavan je za naredbe, katalog, izvore i procjenu. Prikvačeni izvori potvrđuju postojeće granice, a ne tvrde da je novi CLI postojao na tim revizijama.

## Okidač, vlasnik i postupak

Koristite za komponente, obrasce, rasporede značajki, tablice, stranice, API/Query skupove, DTO-ove, entitete, repozitorije ili backend značajke za čitanje. Značajka posjeduje javno sučelje i ponašanje; generator predloške i reproducibilni indeks prijevoda. Router posjeduje dostupnost i odredišta primjera.

1. Pročitajte živi vodič i vlasničku granicu pa iz korijena pokrenite `npm run generate -- --list --json`. Pregledajte odabrani generator kroz `--help` i potpuni `--dry-run`.
2. Procijenite arhitekturu i strukturu (30%), biblioteke i konvencije (25%), relevantnu pokrivenost izlaza (25%) i integraciju u radni tok (20%). Svaki kriterij ocijenite od 0 do 100 uz konkretne dokaze. Procjenjujte odgovornost generatora, ne cijelu značajku.
3. Pročitajte prag iz `generator-policy.json` (zadano 80%). Na pragu ili iznad njega koristite svaki smisleno kompatibilni generator. Prednost dajte složenom generatoru pred dupliciranjem izlaza. Kršenje arhitekture, nesiguran/destruktivan izlaz, neprilagodljivo ponašanje i neprihvatljiv gubitak funkcionalnosti diskvalificiraju bez obzira na rezultat.
4. Pregledajte generirani izvor pa prilagodite poslovna pravila. Zabilježite ručni rad za nepokrivene dijelove i ponavljajuća bliska podudaranja. Poboljšanja unutar odobrene arhitekture su autonomna; arhitekturne promjene zadržavaju izričito odobrenje.
5. Provjerite stvarni izlaz, vlasničke provjere i smislene interakcije. Prijavite generator, cilj, kompatibilnost s dokazima, prilagodbe i izvršene provjere. Upute i kalkulator rezultata ne jamče buduće ponašanje agenata.

```sh
npm run generate -- frontend form UserProfile --fields name,email --dry-run
npm run generate -- frontend form UserProfile --fields name,email
npm run generate -- backend feature Product --fields title --migration 3 --dry-run
```

Odaberite stvarnu sljedeću neiskorištenu cjelobrojnu Flyway verziju. Backend značajke stvaraju zajedničke zapise dostupne prijavljenim korisnicima samo za čitanje; privatnost, tenant granice i ovlasti izmjene zahtijevaju odobren ugovor. Vizualni obrasci podržavaju ograničena tekstna polja. Skalarni API/backend izlaz ne podrazumijeva generičke specijalizirane UI kontrole.

## Vizualna integracija i životni ciklus

Svaki vizualni izlaz uključuje primjer stvarne komponente u `src/pages/development-guide/generated/<kind>/`. DEV otkrivanje datoteka popunjava postojeći registar ruta, navigaciju i pretraživanje stranica. Otvorite `/dev-guide/frontend/generated`; obrazac UserProfile dostupan je na `/dev-guide/frontend/generated/form/user-profile--user-profile`.

Postojeći provideri daju jezik, temu i router. Lokalni podaci i simulirane potvrđene povratne funkcije pokrivaju validaciju, slanje, onemogućeno stanje, uspjeh, pogreške i zbirke bez pisanja stvarnih podataka. Nevizualni API izlaz ima ugovorne testove umjesto URL-a pregleda. Produkcijske rute i pristup ostaju izričita odluka routera.

Brisanje ili preimenovanje datoteke pregleda uklanja staru izvedenu registraciju pri sljedećem razvojnom buildu. Aplikacijski izvor i parovi prijevoda ostaju vlasništvo aplikacije. Nakon namjernog uklanjanja parova prijevoda `npm run generate -- index --dry-run` prikazuje održavanje mehaničkog indeksa. Automatsko brisanje poslovnog izvora i regeneriranje usvojenog izvora nisu podržani.

## Pogreške i prihvat

| Opažanje                                     | Postupak                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------- |
| Sukob postojeće datoteke ili vlasnika        | Pregledajte rad; odaberite drugo ime/vlasnika ili ga namjerno prilagodite.            |
| Prilagođen mehanički indeks                  | Sačuvajte izmjenu, vratite kanonsku mehaniku i ponovite pregled.                      |
| Generator je ispod praga ili diskvalificiran | Zabilježite stvarni jaz; ručno implementirajte samo nepokriveni dio.                  |
| Potrebna je druga arhitektura                | Prije tog dijela implementacije zatražite konkretno odobrenje.                        |
| Prekid procesa tijekom pisanja               | Pregledajte procese i plan prije usklađivanja datoteka i uklanjanja zastarjele brave. |

Prihvat obuhvaća determinističko planiranje, probni rad bez pisanja, sigurnost putanja/simboličkih poveznica/sukoba, oporavak obrađenih pogrešaka, kompilaciju stvarnog TypeScript/Java izlaza, smislene generirane testove, navigaciju i interakcije pregleda te produkcijski build bez modula pregleda. Slijedite serijalizirane provjere repozitorija. Pregled izvora ili snapshot predloška nije dokaz izvršavanja.

## Podrijetlo izvora

- `vireocode-web-app-starter@a7defb9e45dc418036d4d62af742fadf42ffde05:frontend/src/app/router/routeRegistry.tsx`
- `vireocode-web-app-starter@a7defb9e45dc418036d4d62af742fadf42ffde05:frontend/src/features/development-guide/contacts/components/ContactForm.tsx`
- `client-discovery-app@9fcbf2f17a09329333c3d53c7a3750c48fc1db52:frontend/src/features/sales/components/LeadForm.tsx`
