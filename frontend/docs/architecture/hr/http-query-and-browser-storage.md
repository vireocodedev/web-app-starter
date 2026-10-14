# HTTP, Query i pohrana u pregledniku

Aplikacija odvaja generičku infrastrukturu od trajnosti podataka značajke.

## Generički HTTP i Query klijenti

`src/app/data/http/createAppAxios.ts` stvara jednu generičku Axios instancu iz
provjerene konfiguracije: osnovni URL, timeout, politiku vjerodajnica i
zajednička zaglavlja. Ne smije sadržavati auth putanje ili ponašanje isteka
sesije. `src/app/auth` prilagođava je potvrđenom ugovoru sesije.

`src/app/data/query/createAppQueryClient.ts` posjeduje Query zadane vrijednosti:
ponavljanje, odgodu, svježinu, uklanjanje i mutation pravila. Značajke daju
ključeve, funkcije upita, mutacije, invalidaciju i prikaz domenskih pogrešaka.

## Aplikacijska pohrana i pohrana značajke

Predložak ima dva vlasnika pohrane:

- `src/app/data/storage/appLocalStorage.ts` provjerava nesenzitivne aplikacijske
  postavke poput jezika, teme i navigacije.
- `src/features/development-guide/contacts/api/contact.storage.ts` provjerava Contacts podatke.
  `ContactApiBrowserStorage` nudi asinkroni API značajke i poštuje
  `AbortSignal`, iako koristi lokalnu pohranu.

## Asinkrona granica Contactsa

Contacts zato **ne poziva HTTP backend**. Komponente koriste TanStack Query
opcije iz konstruiranog Contacts runtimea; adapter se može zamijeniti bez
promjene komponenti. Zadržite asinkroni ugovor i pri uvođenju poslužiteljskog
adaptera.

Adapter lokalne pohrane serijalizira svaku mutaciju kroz jedan FIFO red. Svaka
operacija pri dolasku na red čita najnoviju provjerenu snimku i provjerava signal
prekida pri ulasku te neposredno prije sinkronog spremanja. Neuspješna ili
prekinuta operacija ne blokira sljedeću mutaciju, a prekid nakon točke spremanja
ne može poništiti dovršeni zapis.

## Pravila pohrane

Kod ne pristupa izvornom `localStorage` izravno. Koristite vlasnički
`RgoLocalStorageService` s potpunom Zod shemom i zadanim vrijednostima. Ne
pohranjujte tokene, lozinke, session kolačiće ili druge tajne. Podaci jedne
uklonjive značajke ostaju uz tu značajku; zajedničke stabilne postavke pripadaju
aplikacijskoj pohrani.

Vidi [API-ji, modeli, upiti i mutacije](./apis-models-queries-and-mutations.md).
