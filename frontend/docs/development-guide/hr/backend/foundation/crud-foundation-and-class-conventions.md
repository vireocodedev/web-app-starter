# CRUD osnova i pravila pisanja klasa

**Status podrške: ugrađena osnova i izvršivi primjer samo za testove.**

Koristite ugrađenu osnovu pri dodavanju poslovne funkcionalnosti. Mali feature ostaje ravan dok stvarna veličina ne opravda podpakete. [Ugovor paketa](http-service-persistence-boundaries.md) vlasnik je smještaja i objavljenih ovisnosti, a ovaj članak malih ponovljivih servisnih mehanizama.

## Počnite jednom jasnom radnjom

Koristite konkretnu klasu `<Resource>Service`, constructor injection i final ovisnosti. Sučelje uvedite samo za stvarnu granicu ili više implementacija. Controller vodi HTTP i validaciju, service ovlasti/poslovna pravila/transakcije, repository persistenciju, a entity kontrolirane promjene stanja. Jednostavan response record izgradite unutar transakcije; lokalni mapper izdvojite tek zbog stvarne složenosti ili ponovne uporabe.

Za POST i puni PUT koristite isti Java record `<Resource>Request`, s istim writable poljima i pravilima, te zaseban `<Resource>Response`. Null na PUT-u briše opcionalnu nullable vrijednost; to je potpuna zamjena. Identitet, scope, verzija, vremena i povezane oznake pripadaju odgovoru/backendu. Imenovani action DTO-i ostaju prikladni; login/CSRF recordi zadržavaju sadašnje ugovore. PATCH zahtijeva zasebno odobren presence protokol.

Stvarni [ContactRequest](../../../../../../backend/src/test/java/referencefixtures/contacts/ContactRequest.java) dijele POST i PUT. Konkretni [ContactService.update](../../../../../../backend/src/test/java/referencefixtures/contacts/ContactService.java) prati ovaj redoslijed unutar javne transakcije:

```text
lock owned parent -> scoped active contact -> compare expected version
-> OPTIMISTIC verification -> replace all writable fields
-> flush -> response projection -> proxy commit -> HTTP success
```

## Naslijedite samo potrebnu mehaniku

[BaseService](../../../../../../backend/src/main/java/com/vireocode/backend/crud/BaseService.java) prima `(Class<E>, JpaRepository<E, UUID>, DeleteMode, Clock)`; overload bez `DeleteMode` koristi HARD. Protected final pomagači su:

- `requireActive(scopedLookup)` skriva nedostajući i već managed soft-obrisani rezultat.
- `requireExpectedVersion(entity, expectedVersion)` odbija zastarjelu verziju bez promjene namjere.
- `deleteManaged(entity, expectedVersion)` provjerava stvarnu writable Spring transakciju, aktivnost i verziju, pa uklanja ili označava entitet koristeći predani clock.

Nema javnog generičkog create/update/delete API-ja niti EntityManagera u bazi. Konkretna javna, nonfinal `@Transactional` metoda razrješava pouzdanog aktera i scope, zaključava zajedničkog roditelja, provjerava invarijante, poziva pomagače i radi flush. Repository transakcije same ne čine cijelu radnju atomarnom. Final protected pomagač nije ulaz u Spring proxy.

[Transakcijski ugovor](../application-services/transactional-commands.md) vodi commit, a [brisanje](../data/configurable-hard-and-soft-deletion.md) zadržane retke. Testirajte direct service pozive, rollback i stale/deleted rezultate uz HTTP. [BaseServiceTests](../../../../../../backend/src/test/java/com/vireocode/backend/crud/BaseServiceTests.java) pokriva pomagače, a [izvršivi primjer](executable-reference-feature-and-isolation.md) stvarne PostgreSQL radnje.

## Točne reference izvora

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/build.gradle` — Podrijetlo polaznih JPA/build ovisnosti; poveznice ranije opisuju trenutačnu implementaciju u radnoj kopiji.
