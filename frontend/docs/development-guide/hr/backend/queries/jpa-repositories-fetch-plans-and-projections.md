# JPA repozitoriji, fetch planovi i projekcije

**Status podrške: ugrađena osnova i izvršivi primjer samo za testove.**

Počnite feature-local `JpaRepository<Entity, UUID>`. Derived metode služe jednostavnim scopeanim dohvatima i countu, JPQL/projekcije jasnim složenim čitanjima, a opravdani native SQL samo potrebnim slučajevima. Ne dodajte univerzalni BaseRepository i ne izlažite repository entitete kroz HTTP.

## Prvo scope, zatim namjerni fetch

[ContactRepository](../../../../../../backend/src/test/java/referencefixtures/contacts/ContactRepository.java) pokazuje detail EntityGraph, to-one fetch join za paginiranu listu i odvojeni count bez fetcha. Svaka javna radnja ograničava aktera, roditelja i dijete prije projekcije. Nemojte prvo učitati globalnu stranicu pa u Javi filtrirati nedopuštene retke; items, count i search dijele visibility uvjete.

To-many collection fetch join može umnožiti retke i pokvariti paginaciju; odaberite projekciju, dvofazno čitanje ili zasebno ograničen upit. Entity-to-response mapiranje ostaje unutar service granice uz OSIV false. Native upiti izričito nose scope i `deleted_at is null`; Hibernate SQLRestriction ne prepisuje proizvoljan native SQL. Već cached obrisani entity u istom contextu također traži service active provjeru.

## Objavite stabilnu stranicu

[PageResponse](../../../../../../backend/src/main/java/com/vireocode/backend/http/PageResponse.java) kopira `items` i izlaže samo `(items, page, size, totalItems)`. Ne serijalizirajte Spring Page izravno. Referentni endpointi imaju zero-based page, default size 20, dopušten size 1–100, nenegativni page, feature sort allowlist i UUID `id` tie-breaker. Nepodržani sort/direction, negativni/fractional/overflow unos i preveliki size daju 400. Page je indeks stranice, ne offset retka.

Contacts dopušta displayName/code/createdAt, a grupe name/createdAt, uz asc/desc. Search ima ograničenu duljinu i escaped SQL LIKE znakove; vrijednosti ostaju bound parametri. [Vlasnik paginacije](bounded-pagination-and-sort-contracts.md) pokriva total order, deep-offset/count trošak i indekse.

Puna referentna contact lista ima budžet najviše tri SELECT-a (owned group lookup, stranica s grupom, count), neovisno o broju redaka. Test koristi punu stranicu i hladno persistence stanje kako cache ili preskočeni count ne bi sakrili N+1. Taj budžet vrijedi za konkretan primjer, nije univerzalno pravilo. Read-only sam ne obećava zajednički snapshot; [snapshot politika](snapshot-consistent-page-metadata.md) ostaje eksplicitna.

## Točne reference izvora

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/build.gradle` — Podrijetlo polaznih JPA/build ovisnosti; poveznice ranije opisuju trenutačnu implementaciju u radnoj kopiji.
