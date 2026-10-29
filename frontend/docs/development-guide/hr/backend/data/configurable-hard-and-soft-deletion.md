# Podesivo hard i soft brisanje

**Status podrške: ugrađena osnova i izvršivi primjer samo za testove.**

Brisanje birajte jednom u konstruktoru konkretnog servisa: HARD je default; SOFT traži [SoftDeletableEntity](../../../../../../backend/src/main/java/com/vireocode/backend/crud/SoftDeletableEntity.java), a nevaljana sposobnost pada pri konstrukciji. To je nepromjenjiva service politika, nikad request opcija.

## Definirajte vidljivost zadržanog retka

SOFT postavlja backend `deletedAt` na managed entitet koristeći zajednički Clock. Obični flush ažurira audit/verziju. Svaki konkretni retained entity deklarira i testira `@SQLRestriction("deleted_at is null")`; ne pretpostavljajte propagiranje anotacije s baze. Nemojte kombinirati s Hibernate `@SoftDelete`, koji presreće remove i onemogućuje obični HARD postupak drugog servisa nad istim mappingom.

[Contact](../../../../../../backend/src/test/java/referencefixtures/contacts/Contact.java) koristi SOFT, a [ContactGroupService](../../../../../../backend/src/test/java/referencefixtures/contacts/ContactGroupService.java) HARD. HARD smije fizički ukloniti soft-capable entitet prema zasebnoj service politici. Protected `deleteManaged` traži stvarnu writable transakciju, ali konkretni service i dalje vodi ovlasti, expected version, invarijante, lockove i flush.

Normalni detail/list/count/search/selection i povezane projekcije isključuju obrisane retke. Missing/deleted/foreign scope i ponovljeni delete daju 404 RESOURCE_NOT_FOUND. ORM SQLRestriction ne uklanja već managed objekt iz istog persistence contexta; vlastiti lookup/projekcija provjerava stanje umjesto globalnog EntityManager clear-a. Native SQL izričito nosi active/scope uvjete.

## Zaštitite ključeve i relacije

Soft brisanje zadano rezervira unique ključeve: `(group_id, code)` ostaje jedinstven za aktivne i zadržane kontakte. Active-only partial index traži izričitu feature politiku; nemojte tiho reciklirati ključ. Restore, purge i include-deleted API-ji nisu dio osnove.

Aktivna djeca blokiraju brisanje roditelja. Zadržana soft djeca također mogu FK-om blokirati HARD roditelja; vratite siguran 409 RESOURCE_IN_USE bez neočekivanog cascade/detach ponašanja. Child create/update/delete i parent delete zaključavaju istog roditelja prije provjere/promjene ovisnosti. Više roditelja traži kanonski redoslijed lockova. Cascade je zasebna pregledana poslovna odluka.

Samo točno poznati contact unique constraint prevodi duplicate POST/PUT, uključujući concurrent insert, u 409 REQUEST_REJECTED. Prevođenje se odvija nakon povratka/pogreške service proxyja pa je rollback gotov; nepovezani integrity problemi ostaju 500. Pogledajte [ugovor pogrešaka](../foundation/validation-and-error-contracts.md). PostgreSQL dokaz pokriva fizički retained/removed redak, fresh/cached vidljivost, version/audit, rezervirane ključeve i child-create/parent-delete race.

## Točne reference izvora

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/build.gradle` — Podrijetlo polaznih JPA/build ovisnosti; poveznice ranije opisuju trenutačnu implementaciju u radnoj kopiji.
