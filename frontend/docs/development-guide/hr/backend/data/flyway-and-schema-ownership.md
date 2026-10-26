# Flyway upravlja aplikacijskom i session shemom

**Status podrške: ugrađeno vlasništvo nad migracijama; referentni recept novih domenskih tablica ograničenih opsegom.** Predložak već koristi Flyway za korisničke i JDBC session tablice, a Hibernate za validaciju sheme. Primjer workspace sheme u nastavku i opći tenant okvir nisu ugrađeni.

Koristite ovaj obrazac kad funkcionalnost zahtijeva pohranjeno stanje, promjenu entiteta, novo ograničenje ili nadogradnju session persistencije. Migracija i kod koji je koristi čine jednu promjenu. Razvoj sheme mora objasniti i novu instalaciju i sljedeću podržanu nadogradnju postojeće baze.

## Jedan vlasnik izvršava DDL

Osnovna konfiguracija uključuje Flyway, postavlja Hibernate `ddl-auto: validate`, isključuje Open Session in View i postavlja JDBC session `initialize-schema: never`. Flyway izvršava DDL, Hibernate provjerava usklađenost, a Spring Session koristi tablice bez njihova ponovnog stvaranja. Samostalna promjena entiteta ili uključivanje automatskog DDL-a uvodi konkurentne vlasnike.

`V1__create_users.sql` stvara `app_user` s UUID primarnim ključem, jedinstvenim nepraznim korisničkim imenom, ograničenim stupcima hasha, naziva i emaila te zastavicom aktivnosti. Email u toj migraciji nije jedinstven. AI agent ne smije pretpostaviti email-login ili unique-email politiku koju shema ne provodi.

`V2__create_sessions.sql` jest aplikacijska infrastruktura, ali i dalje verzionirana shema. Definira `spring_session`, jedinstveni indeks session ID-a, indekse isteka i principala te `spring_session_attributes` sa složenim primarnim ključem i kaskadnim stranim ključem prema sesiji. Brisanje sesije zato kroz vezu baze može obrisati atribute. Nadogradnja ovisnosti koja mijenja potrebnu session shemu zahtijeva eksplicitan pregled kompatibilnosti, a ne pretpostavku da će Spring sve automatski inicijalizirati.

## Dodajte migraciju, ne prepisujte povijest

Kad se verzija primijeni izvan izolirane jednokratne baze, tretirajte njezin sadržaj kao nepromjenjiv. Dodajte sljedeću migraciju s jedinstvenim brojem. Prepisivanje stare datoteke mijenja očekivani checksum i skriva kako postojeće baze dolaze u željeno stanje. Broj iz kopiranog primjera zamijenite stvarnom sljedećom verzijom projekta.

Migraciju pregledajte zajedno s promjenom entiteta ili upita. Izričito definirajte nullability, jedinstvenost, strane ključeve i indekse. Servis može ranije provjeriti unos radi korisne poruke, ali baza je konačni zajednički arbitar pri konkurenciji. Provjera prije inserta ne zamjenjuje unique constraint.

Slijedi **SQL recept, ne ugrađena migracija**. Pretpostavlja da je projekt zasebno implementirao životni ciklus workspacea, članstvo računa, autorizirane repozitorije, DTO-e i pravila brisanja. PostgreSQL i Flyway već su ovisnosti; ti aplikacijski vlasnici nisu.

```sql
-- Samo primjer; odabrati stvarnu sljedeću verziju migracije projekta.
CREATE TABLE workspace_record (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspace(id),
    name VARCHAR(160) NOT NULL,
    revision BIGINT NOT NULL DEFAULT 0 CHECK (revision >= 0),
    UNIQUE (id, workspace_id)
);

CREATE TABLE record_note (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL,
    record_id UUID NOT NULL,
    body TEXT NOT NULL,
    FOREIGN KEY (record_id, workspace_id)
        REFERENCES workspace_record(id, workspace_id)
);
```

Složena veza sprječava bilješku koja tvrdi da je u jednom workspaceu, a referencira zapis iz drugog. Client Discovery koristi tu tehniku za verzije, ovlasti i dokaze ograničene projektom. Ona nadopunjuje autorizaciju; ne daje pravo čitanja retka i ne uklanja potrebu za upitima ograničenima workspaceom.

## Odluke indeksa i životnog ciklusa prate tablicu

Strani ključ izražava vezu, a indeks podržava uzorak upita; nisu zamjenjivi. Odredite bitan pristupni put prije spekulativnog dodavanja indeksa. Lista sortirana po vremenu treba stabilan identifikator za izjednačene vrijednosti i procjenu odgovarajućeg indeksa. Session shema pokazuje namjenske indekse identiteta, čišćenja isteka i pronalaska principala.

Namjerno odaberite ponašanje brisanja. Session atributi koriste cascade jer im je životni ciklus podređen sesiji. To ne uspostavlja opće pravilo kaskadnog brisanja poslovnih veza. Nepromjenjiva povijest, audit obveze, zadržani artefakti i aktivni rad mogu trebati drukčija pravila. Discovery referenca sadrži nepromjenjive zapise i prijelaze; to su domenske odluke, ne zadane postavke predloška.

Za popunjenu bazu obvezno polje može zahtijevati slijed proširenja, backfilla i ograničenja umjesto pretpostavke da svi stari redci već imaju valjanu vrijednost. Backend vlasnik određuje značenje i kompatibilnost; deployment vlasnik daje odobren termin, backup i oporavak. Velik backfill nemojte kopirati u startup bez razmatranja trajanja i zaključavanja.

## Kvar i oporavak

Ako validacija migracije prijavi checksum mismatch, najprije utvrdite promijenjenu datoteku i baze koje su je već primijenile. Ne brišite Flyway povijest, ne pokrećite repair naslijepo i ne mijenjajte produkcijske tablice prije razumijevanja verzija. Repair mijenja metapodatke; ne dokazuje podudaranje stvarne i namjeravane sheme.

Ako migracija zakaže jer postojeći redci krše novo ograničenje, sačuvajte dokaz pogreške bez objave podataka. Odredite domensku politiku ispravka ili backfilla pa pripremite pregledanu putanju nastavka. Ne slabite ograničenje samo da startup postane zelen. Destruktivni oporavak ili vraćanje backupa pripada operativnom runbooku i izričitoj ovlasti za okruženje.

## Kriteriji prihvata buduće implementacije

Ovi kriteriji tijekom autorskog rada ostaju dokumentacija.

- Nova podržana PostgreSQL baza primjenjuje cijeli lanac migracija i prolazi Hibernate validaciju.
- Postojeća baza nadograđuje se novim verzijama bez promjene već primijenjenih migracija.
- Dvostruko korisničko ime odbija baza; jedinstven email ne pretpostavlja se bez migracije.
- Session atributi ne mogu nadživjeti roditelja kroz definirani životni ciklus stranog ključa.
- Referenca djeteta preko workspace granice odbija se i kad oba ID-a postoje; upiti i dalje autoriziraju aktera.
- Novo obvezno polje ima pravilo za stare retke, uključujući backfill i deployment kompatibilnost gdje trebaju.
- Pogreška migracije ima pregledan oporavak koji čuva povijest i ne objavljuje stvarne zapise.

## Točni izvori

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/application.yaml` — vlasništvo Flywaya, Hibernatea i JDBC sesije.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/db/migration/V1__create_users.sql` — ugrađena korisnička ograničenja.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/db/migration/V2__create_sessions.sql` — session tablice, indeksi i cascade.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/user/AppUser.java` — slaganje entiteta i sheme.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/resources/db/migration/V10__specification_development.sql` — složeni strani ključevi ograničeni projektom i nepromjenjivi domenski zapisi.
