# JPA entiteti i relacije

**Status podrške: ugrađena osnova i izvršivi primjer samo za testove.**

Koristite ugrađenu metadata osnovu za nove poslovne entitete. Postojeći `AppUser` namjerno zadržava shemu i autentikacijsku ulogu; ne dobiva nove stupce ni nasljeđivanje.

## Definirajte kontrolirano stanje

Naslijedite [BaseEntity](../../../../../../backend/src/main/java/com/vireocode/backend/crud/BaseEntity.java): backend UUID, `Instant createdAt`, `Instant updatedAt` i nullable `@Version Long`. Početna null verzija omogućuje Spring Data prepoznavanje novog entiteta s unaprijed dodijeljenim UUID-om. Zadržite protected JPA konstruktor bez argumenata, privatna polja, bez javnih metadata settera i s imenovanim domenskim metodama promjene. Entity nije transportni DTO; equality ne izvodi se iz promjenjivih polja/relacija.

Bazni equality uspoređuje stvarnu persistent klasu i UUID, uključujući Hibernate proxy identitet bez inicijalizacije. Hash prema klasi ostaje stabilan kroz persist/update. [CrudConfiguration](../../../../../../backend/src/main/java/com/vireocode/backend/crud/CrudConfiguration.java) osigurava UTC Clock i isti Spring Data auditing DateTimeProvider. Test može dati kontrolirani Clock; soft brisanje koristi isti izvor vremena. To su vremena trenutačnog retka, ne actor audit ni potpuna povijest; pogledajte [audit vlasništvo](audit-fields-events-and-versions.md).

## Namjerno oblikujte relaciju

Izričito odaberite kardinalnost, nullability i lazy učitavanje. [Contact](../../../../../../backend/src/test/java/referencefixtures/contacts/Contact.java) ima obvezni LAZY many-to-one ContactGroup; odgovor sadrži group id/name, učitane namjernim repository fetch planom unutar service transakcije. Izbjegavajte spekulativne bidirectional kolekcije, široke cascade postavke i automatski orphan removal.

Flyway je vlasnik stvarnih tablica, indeksa, unique ključeva i foreign ključeva. Entity anotacije i Hibernate validacija ne dokazuju postojanje tih ograničenja. Scope konzistentnost i ovlasti zasebne su obveze; valjani foreign key ne autorizira aktera. Pisanje entiteta i brisanje roditelja prate isti [lock protokol](revision-conflicts-and-shared-locks.md).

Radite flush prije response mapiranja kako verzija/audit odgovaraju persistiranom stanju. No-op PUT traži eksplicitnu optimistic provjeru jer dirty checking možda ne šalje UPDATE; pogledajte [sukobe verzija](revision-conflicts-and-shared-locks.md). OSIV ostaje false. PostgreSQL testovima provjerite metadata lifecycle, lazy projekciju, proxy/hash ponašanje i rollback; unit reflection nije dokaz JPA ponašanja.

## Vlasnička i inverzna strana

Strana s `@JoinColumn` vlasnik je foreign keyja; promjena samo inverzne kolekcije ne sprema relaciju. Ako stvarni feature treba dvosmjernu vezu, `@OneToMany(mappedBy = "group")` na inverznoj kolekciji navodi vlasničko Java svojstvo djeteta. Featureova add/remove metoda mora uskladiti obje strane u memoriji. To je mapping recept, ne ugrađena ContactGroup kolekcija: primjer namjerno zadržava obveznu jednosmjernu vezu `Contact.group`.

Cascade operacije birajte pojedinačno. `PERSIST`/`MERGE` prenose odgovarajuću lifecycle operaciju; `REMOVE` prenosi fizičko brisanje. `orphanRemoval = true` briše dijete kada napusti managed relaciju i prikladan je samo kada roditelj isključivo posjeduje životni ciklus djeteta. To nije implementacija soft deletea. Ne koristite `ALL`, REMOVE ili orphan removal za dijeljenu djecu niti za zaobilaženje provjere zadržanih kontakata. Obveznu relaciju nije dopušteno odvojiti postavljanjem vlasničke strane na null; koristite odobrenu akciju brisanja djeteta ili zasebno specificiranu akciju premještanja. Kod uvođenja dvosmjernog modela testirajte graf u memoriji i stvarni FK nakon flusha.

## Managed promjene, bulk DML i callbackovi

Za obične versioned promjene koristite managed entitete. JPQL/native bulk DML zaobilazi dirty checking, lifecycle callbackove i Spring Data auditing te ne usklađuje već učitane objekte niti automatski provodi optimistic version provjeru. Native SQL zaobilazi i ORM uvjet aktivnog retka. Opravdana bulk operacija mora izričito definirati scope/active uvjete, usporedbu i povećanje verzije, audit vrijednosti te provjeru broja promijenjenih redaka. Prvo napravite flush pending promjena, zatim namjerno osvježite ili evictajte pogođeno managed stanje na odgovornoj granici; bez globalnog `EntityManager.clear()` prečaca koji odbacuje nepovezani rad. Testirajte rollback i daljnja čitanja u istom contextu. Hibernateova versioned bulk sintaksa nije prenosivi JPA.

Entity lifecycle callbackovi/listeneri mogu održavati lokalne metapodatke, kao ugrađeni auditing listener. U njima ne provodite upite, autorizaciju, vanjski I/O, obavijesti ili poslovni tijek više entiteta. Callback nije dokaz commita i bulk operacije mogu ga preskočiti. Javna service transakcija posjeduje poslovne invarijante; efekti nakon commita slijede [ugovor obavijesti nakon commita](../application-services/commit-aware-notifications.md).

## Točne reference izvora

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/build.gradle` — Podrijetlo polaznih JPA/build ovisnosti; poveznice ranije opisuju trenutačnu implementaciju u radnoj kopiji.
