# Granice HTTP-a, aplikacijskog servisa i persistencije

**Status podrške: ugrađena osnova uz izričito označen referentni recept.** Predložak ima autentikacijske kontrolere, DTO recorde, korisnički entitet i JPA repozitorij. Opći okvir domenskih servisa, servis tenant ovlasti i poslovni CRUD modul nisu ugrađeni. Primjer transakcijske promjene u nastavku prilagođava granice iz Client Discoveryja; navedeni domenski tipovi su pseudokod.

Koristite ovaj obrazac pri dodavanju prve funkcionalnosti projekta ili razdvajanju endpointa koji miješa autentikaciju, SQL, poslovna pravila i izgradnju odgovora. Cilj je razumjeti jednu poslovnu radnju iz ulazne metode aplikacijskog servisa, uz jasan HTTP ugovor i granicu persistencije.

## Paketi funkcionalnosti i smještaj datoteka

Za Java datoteke jedne funkcionalnosti koristite `com.vireocode.backend.<feature>`. Ugrađene funkcionalnosti `auth` i `user` te zajednički transportni vlasnik `http` koriste ravne pakete: povezane klase male funkcionalnosti držite zajedno, a podpakete prema ulozi uvedite unutar te funkcionalnosti tek kada ih opravdaju njezina stvarna veličina ili odgovornosti. Stvarajte samo datoteke koje funkcionalnost koristi; nova funkcionalnost ne zahtijeva prazan servis, mapper ili mapu za svaku ulogu. Vlasništvo funkcionalnosti nemojte zamijeniti zajedničkim aplikacijskim paketima `controller`, `service`, `repository`, `entity` ili `dto`.

Pokretanje i kompoziciju aplikacije držite u osnovnom paketu. Konfiguracija, inicijalizacija i operatorske naredbe vezane uz funkcionalnost ostaju uz svojeg vlasnika. `SecurityConfiguration` pripada autentikaciji, a lokalno stvaranje korisnika i jednokratno provisioniranje pripadaju paketu `user`. Premještanje tih klasa u generičkog vlasnika konfiguracije ili pokretanja sakrilo bi ono što konfiguriraju.

Primjerice, buduća funkcionalnost računa počinje u `com.vireocode.backend.invoice`. Klase `InvoiceController`, `InvoiceService`, `InvoiceRepository` i entitet `Invoice` dodajte samo kada ih ponašanje zahtijeva. Koristite transportne nazive prema radnji, poput `CreateInvoiceRequest` i `InvoiceResponse`. To su primjeri smještaja, a ne ugrađeni tipovi.

### Trenutačno vlasništvo Java klasa

Putanje u nastavku vode na trenutačne izvore u radnoj kopiji. Popis obuhvaća svih 14 glavnih Java izvornih datoteka; ne tvrdi da opći poslovni servis ili mapper već postoji.

| Paket                        | Izvor                                                                                                                        | Odgovornost                                                                                                                                                 |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `com.vireocode.backend`      | [BackendApplication](../../../../../../backend/src/main/java/com/vireocode/backend/BackendApplication.java)                  | Pokretanje Spring Boota, eksplicitno parsiranje zastavice za provisioniranje i zatvaranje konteksta aplikacije za provisioniranje.                          |
| `com.vireocode.backend.auth` | [AuthController](../../../../../../backend/src/main/java/com/vireocode/backend/auth/AuthController.java)                     | Transport za CSRF/prijavu/sesiju i ugniježđeni recordi zahtjeva/odgovora; delegira ugrađenim Security suradnicima i eksplicitno projicira korisnika sesije. |
| `com.vireocode.backend.auth` | [AuthExceptionHandler](../../../../../../backend/src/main/java/com/vireocode/backend/auth/AuthExceptionHandler.java)         | Prevođenje autentikacijskih iznimki i mapiranje dopuštene login validacije ograničeno na `AuthController`.                                                  |
| `com.vireocode.backend.auth` | [SecurityConfiguration](../../../../../../backend/src/main/java/com/vireocode/backend/auth/SecurityConfiguration.java)       | Encoder lozinki, dohvat korisničkih podataka, authentication manager, suradnici za sesiju/CSRF i HTTP sigurnosni lanac filtara.                             |
| `com.vireocode.backend.auth` | [AuthOpenApiConfiguration](../../../../../../backend/src/main/java/com/vireocode/backend/auth/AuthOpenApiConfiguration.java) | OpenAPI session/CSRF sheme i dokumentacija odjave kroz filtar, bez novog runtime endpointa.                                                                 |
| `com.vireocode.backend.user` | [AppUser](../../../../../../backend/src/main/java/com/vireocode/backend/user/AppUser.java)                                   | Trajni identitet računa, stanje aktivnosti i hash lozinke.                                                                                                  |
| `com.vireocode.backend.user` | [AppUserRepository](../../../../../../backend/src/main/java/com/vireocode/backend/user/AppUserRepository.java)               | JPA pristup korisnicima i dohvat prema korisničkom imenu.                                                                                                   |
| `com.vireocode.backend.user` | [LocalUserProperties](../../../../../../backend/src/main/java/com/vireocode/backend/user/LocalUserProperties.java)           | Validirani record identiteta/postavki lokalne inicijalizacije, koji provisioniranje također eksplicitno validira.                                           |
| `com.vireocode.backend.user` | [LocalUserInitializer](../../../../../../backend/src/main/java/com/vireocode/backend/user/LocalUserInitializer.java)         | Transakcijska inicijalizacija računa samo u lokalnom profilu, bez resetiranja postojećeg korisnika.                                                         |
| `com.vireocode.backend.user` | [ProvisionUserRunner](../../../../../../backend/src/main/java/com/vireocode/backend/user/ProvisionUserRunner.java)           | Eksplicitna naredba jednokratnog provisioniranja, validacija zaštićenih ulaza i provjera podudarnosti postojećeg računa.                                    |
| `com.vireocode.backend.http` | [ApiErrors](../../../../../../backend/src/main/java/com/vireocode/backend/http/ApiErrors.java)                               | Zajednički fiksni kodovi pogrešaka, privatni recordi odgovora i eksplicitno objavljeni autentikacijski writeri/factoryji.                                   |
| `com.vireocode.backend.http` | [ApiExceptionHandler](../../../../../../backend/src/main/java/com/vireocode/backend/http/ApiExceptionHandler.java)           | Opće MVC prevođenje iznimki sa sigurnim tijelom i sačuvanim framework statusom/zaglavljima.                                                                 |
| `com.vireocode.backend.http` | [ApiErrorController](../../../../../../backend/src/main/java/com/vireocode/backend/http/ApiErrorController.java)             | Sigurna JSON servlet obrada pogrešaka pomoću atributa statusa pogreške.                                                                                     |
| `com.vireocode.backend.http` | [OpenApiConfiguration](../../../../../../backend/src/main/java/com/vireocode/backend/http/OpenApiConfiguration.java)         | Runtime OpenAPI metapodaci i zajednička shema pogreške izvedena iz stvarnog privatnog transportnog recorda.                                                 |

Ugrađeni autentikacijski kontroler i konfiguracija čitaju `AppUserRepository` i projiciraju `AppUser` iz paketa `user`. [Ugovor ovisnosti u nastavku](#smjerovi-ovisnosti-i-sucelja-paketa) definira tu točnu iznimku i pravila za buduće suradnje.

Nove testove usmjerene na funkcionalnost smjestite u odgovarajući paket pod `backend/src/test/java`. Postojeći testovi aplikacije/pokretanja, autentikacijski integracijski testovi više funkcionalnosti i zajednički `TestcontainersConfiguration` ostaju u osnovnom testnom paketu; ovo pravilo ne zahtijeva njihovo premještanje. Runtime postavke i profili ostaju pod `backend/src/main/resources`, a Flyway je vlasnik jednog uređenog niza migracija pod `db/migration`.

## Smjerovi ovisnosti i sučelja paketa

**Ugrađene provjere bytecodea uz izričite obveze pregleda.** Svaki paket funkcionalnosti i njegove moguće podpakete promatrajte kao jedan modul. Njegov **Interface** je namjerno objavljen ugovor na **seamu**, uključujući dopuštene operacije, DTO/vrijednosne tipove i relevantna pravila pogrešaka/ovlasti. Svi ostali tipovi su njegov **Implementation**. Java deklaracija `public` potrebna Springu ili JPA-u ne objavljuje Interface funkcionalnosti.

### Trenutačne ovisnosti tipova u vlasništvu aplikacije

Trenutačni graf sadrži četiri točna para autentikacijskog dohvata/projekcije prema `user` i dva para autentikacijskog Interfacea prema `http.ApiErrors`. Potonji objavljuju samo zajedničku izgradnju HTTP pogrešaka; vlasnik `http` nema politiku računa i ne ovisi o `auth` ili `user`. Nijedan ugovor ne objavljuje korisničku persistenciju ili cijelu HTTP implementaciju proizvoljnim pozivateljima.

| Pozivatelj                   | Dopušteni ciljni tip     | Operacija i razlog                                                                                                                                                                                                       |
| ---------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `auth.AuthController`        | `user.AppUserRepository` | `findByUsername` za dohvat autentificirane sesije.                                                                                                                                                                       |
| `auth.AuthController`        | `user.AppUser`           | Provjera aktivnosti i projekcija `id`, `displayName` i `email` u `SessionUser`.                                                                                                                                          |
| `auth.SecurityConfiguration` | `user.AppUserRepository` | `findByUsername` za ugrađeni dohvat korisničkih podataka.                                                                                                                                                                |
| `auth.SecurityConfiguration` | `user.AppUser`           | Čitanje korisničkog imena, hasha lozinke i aktivnosti za izgradnju Spring Security korisničkih podataka.                                                                                                                 |
| `auth.SecurityConfiguration` | `http.ApiErrors`         | Ubrizgana instanca: samo `writeAuthenticationRequired(HttpServletResponse)` i `writeAccessDenied(HttpServletResponse, boolean)` za odgovore Security filtara.                                                            |
| `auth.AuthExceptionHandler`  | `http.ApiErrors`         | Statički factoryji: samo `authenticationFailure()`, `authenticationUnavailable()` i `validationFailure(Map<String, String>)` za ograničenu odbijenu autentikaciju, pogreške autentikacijskog servisa i login validaciju. |

Ovisnosti o `AppUser` računaju se iako izvor koristi `var`, lambde i `Optional`, a ne eksplicitne importe tipa `AppUser`. Pregledajte aplikacijske tipove u poljima, parametrima konstruktora/metoda, povratnim tipovima, generičkim argumentima, anotacijama, nasljeđivanju i pozivima metoda, uključujući izvedene tipove; sami importi nisu graf ovisnosti.

`AuthExceptionHandler` ostaje autentikacijski detalj Implementationa. `LocalUserInitializer`, `LocalUserProperties` i `ProvisionUserRunner` ostaju detalji Implementationa paketa `user`. `AppUser` i `AppUserRepository` također su interni osim za točno navedene pozivatelje i operacije. Advice, fallback kontroler i privatni recordi odgovora vlasnika `http` detalji su Implementationa; samo navedene operacije `ApiErrors` objavljene su točnim pozivateljima. Java-public factoryji, konstruktori ili druge metode nisu dodatne odobrene operacije. Ovo nije dopuštenje za cijeli smjer paketa `auth → user` ni `auth → http`.

Ne postoji statička ovisnost `user → auth`: inicijalizacija i provisioniranje korisnika ovise o Springovu Interfaceu `PasswordEncoder`, a ne o `SecurityConfiguration`. Autentikacijska konfiguracija daje bean tijekom izvođenja. Razlikujte to runtime povezivanje od ovisnosti među tipovima u vlasništvu aplikacije.

### Pravila za nove ovisnosti

| Opseg                                   | Dopušteni smjer                                                                                                                        | Zabranjeni smjer                                                                                                                                                                      |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kompozicija aplikacije                  | `BackendApplication` pokreće Spring, koji otkriva/povezuje beanove funkcionalnosti.                                                    | Funkcionalnost ovisi o `BackendApplication` ili drugom detalju Implementationa pokretanja.                                                                                            |
| Unutar funkcionalnosti                  | Uobičajeni HTTP transport → aplikacijska radnja → vlastiti repozitorij/entitet; DTO-i i mapperi projiciraju namjerno odabrane podatke. | Repozitorij/entitet → HTTP kontroler, obrada servleta ili sigurnosna konfiguracija; DTO/mapper je vlasnik dohvata ili poslovnih radnji.                                               |
| Konfiguracija i runneri funkcionalnosti | Povezuju vlastitu funkcionalnost i potrebne framework Interfaceove; čuvaju ugrađeni autentikacijski tok.                               | Smještaj konfiguracije/runnera koristi se za zaobilaženje neobjavljenog Implementationa druge funkcionalnosti.                                                                        |
| Među funkcionalnostima                  | Samo eksplicitno odobren objavljeni aplikacijski Interface i njegovi odobreni DTO/vrijednosni tipovi ili točno navedena iznimka.       | Svaka neprijavljena ovisnost, obrnuti smjer `user → auth`, repozitorij/entitet/konfiguracija druge funkcionalnosti izvan prethodno navedene točne autentikacijske iznimke ili ciklus. |
| Testni izvor                            | Testovi mogu ovisiti o produkcijskom kodu i testnim fixtureima.                                                                        | Produkcijski kod ovisi o testovima, mockovima ili testnim fixtureima.                                                                                                                 |

Buduća funkcionalnost zadano je izolirana. Prije dodavanja suradnje među funkcionalnostima predstavite klasu pozivatelja, točno objavljene tipove, dopuštene operacije, smjer i obrazloženje radi odobrenja prema root postupku. Odobrenu suradnju zabilježite u ovom ugovoru prije implementacije. Prednost dajte malom aplikacijskom Interfaceu na seamu vlasničke funkcionalnosti umjesto objavljivanja njezina repozitorija ili entiteta. Framework dohvat beanova prema imenu ili refleksija moraju poštovati isti deklarirani Interface i ne mogu skrivati neprijavljenu suradnju. Ovo je ugovor za stvarnu suradnju, a ne zahtjev za dodavanje praznih portova, wrappera ili placeholder sučelja sada.

### Primjeri pregleda

| Promjena                                                                                                                         | Odluka                                                                                                                           |
| -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Četiri prethodno navedena autentikacijska dohvata/projekcije prema `user`                                                        | Dopušteni samo za dokumentiranu autentikacijsku svrhu.                                                                           |
| `SecurityConfiguration` koristi svoja dva objavljena `ApiErrors` writera ili `AuthExceptionHandler` svoja tri statička factoryja | Dopušteno samo za navedene odgovore pogrešaka; drugi pozivatelj, član, konstruktor ili ugniježđeni tip odgovora nisu objavljeni. |
| Budući `invoice.InvoiceService` prima `AppUserRepository` ili vraća `List<AppUser>`                                              | Zabranjeno: nijedan tip nije objavljen za `invoice`; generički i povratni tipovi također se računaju.                            |
| `LocalUserInitializer` prima Springov `PasswordEncoder`                                                                          | Dopušten framework Interface; ne stvara ovisnost tipova `user → auth`.                                                           |
| `user` importira `SecurityConfiguration` ili bilo koja funkcionalnost poziva `BackendApplication`                                | Zabranjena obrnuta ovisnost ili ovisnost funkcionalnosti o pokretanju.                                                           |
| Produkcijski kod importira `TestcontainersConfiguration` ili testni fixture                                                      | Zabranjena ovisnost produkcije o testovima.                                                                                      |
| Dvije funkcionalnosti ovise o tipovima jedna druge, uključujući izvedene vrijednosti                                             | Zabranjen ciklus; promijenite predloženu suradnju prije implementacije.                                                          |

Java vidljivost paketa uža je od ove konvencije funkcionalnosti. Package-private članovi dostupni su samo u točno istom paketu; ugniježđeni paket nema pristup roditeljskom paketu. Javna dostupnost među paketima ne dopušta uporabu neobjavljenih tipova Implementationa. Provjere u nastavku provode statičke dijelove ovog ugovora; ne mijenjaju Java vidljivost ni runtime povezivanje.

### Automatizirane provjere arhitekture

Cijela mapa ugrađenih frontend/backend pravila, provjera i dokaza nalazi se u
[Arhitekturnim invarijantama i provjerama](../../quality/test-design/architecture-invariants-and-checks.md).
Ovaj ugovor ostaje vlasnik backend Interfaceova paketa i operacija.

`backend/src/test/java/com/vireocode/backend/architecture/ArchitectureTests.java` učitava cijelu mapu prevedenog glavnog izlaza koja sadrži `BackendApplication`. Prije provjere pravila zahtijeva neprazan popis s tom klasom pokretanja, uspoređuje naziv svake učitane klase s `.class` datotekama izlaza i provjerava da nijedna klasa nije iz testnog izlaza. Učitavanje se izvodi u `BeforeAll`, pa Gradleov dry-run CI popis može otkriti testne metode bez njegova izvođenja.

Zajednički `BackendArchitectureRules` provjerava:

- Ovisnosti funkcionalnosti, uključujući generičke potpise i izvedene tipove, prema šest točnih prethodno navedenih parova pozivatelja/cilja, uključujući uski zajednički Interface pogrešaka. Osnovni paket trenutačno sadrži samo `BackendApplication`; dodatni tipovi u osnovnom paketu i izravne ovisnosti pokretanja o funkcionalnostima padaju. Springovo runtime otkrivanje beanova ostaje mehanizam kompozicije. Buduća klasa kompozicije ili statička suradnja zahtijeva izričit pregled ugovora/pravila umjesto zaobilaženja vlasništva funkcionalnosti kroz osnovni paket.
- Cikluse funkcionalnosti kroz `featureCycles`: paketi funkcionalnosti prve razine uključuju svoje podpakete i statičke generičke ovisnosti; pokretanje ostaje pod zasebnim zaštitama, a ciklusi klasa unutar jedne funkcionalnosti dopušteni su.
- Izravne autentikacijske pristupe obitelji API-ja `AppUserRepository` i navedenim članovima `AppUser` prema dokumentiranim operacijama dohvata i getterima, uključujući obične pozive, naslijeđene Spring Data operacije, pristupe poljima te reference metoda/konstruktora. Dopuštenje za korištenje `AppUserRepository` ne daje dopuštenje za pisanje kroz to sučelje repozitorija.
- Autentikacijske pristupe `http.ApiErrors` prema točnim objavljenim instancijskim writerima/statičkim factoryjima i prethodno navedenim potpisima parametara. Dodatni članovi, pozivi konstruktora, reference ili klase pozivatelja ne nasljeđuju dopuštenje iz odobrenog para tipova.
- Produkcijske ovisnosti prema stvarnom popisu prevedenih testnih klasa, uključujući fixture tipove izvan produkcijskog namespacea; konvencija imenovanja testnih klasa nije zaštita.
- Ovisnosti repozitorija/entiteta o HTTP/kontrolerskim, servlet i sigurnosnim konfiguracijskim tipovima. Prepoznavanje uloga koristi JPA anotacije, Spring Data nasljeđivanje i dokumentirane konvencije imenovanja repozitorija/kontrolera/konfiguracije; nepoznati dizajni uloga i dalje zahtijevaju pregled.

`ArchitectureRuleProofTests` primjenjuje ista pravila na izričite pozitivne i prekršajne grafove pod neutralnim testnim namespaceom `backend/src/test/java/architecturefixtures/`. Dokazuju curenje samo kroz generički potpis, obrnute ovisnosti, neprijavljene helpere, zaobilaženje kroz pokretanje, ovisnosti produkcije o testovima, ovisnosti persistencije o transportu, zabranjene autentikacijske upise/reference, zaobilaženje zajedničkog Interfacea pogrešaka, izravne/neizravne cikluse funkcionalnosti kroz podpakete i generičke potpise, prihvaćene acikličke/unutar-funkcionalne grafove i odbijanje praznog ulaza. Fixturei nikad nisu dio produkcijskog učitavanja.

Iz `backend/` pokrenite `./gradlew --no-daemon --console=plain test --tests '*.architecture.*'` za usmjerene promjene. Uobičajeni zadatak `test` također izvodi oba skupa, a postojeći `ciTestInventory`/shard runner automatski otkriva njihove obične JUnit metode. Arhitekturni testovi ne trebaju pokretanje aplikacije/baze; potpuni backend integracijski skup i dalje treba Docker prema uputama u workspace README-u.

Ljudski pregled i dalje je odgovoran za poslovnu svrhu, značenje vlasništva DTO-a/mappera, izravni framework I/O poput `EntityManager`/JDBC pristupa, tokove podataka kroz alias ili posrednike i suradnje skrivene iza refleksije ili dohvata beanova prema imenu. Ova pravila ograničavaju deklarirane ovisnosti tipova/članova; ne dokazuju globalno ponašanje samo za čitanje ni potpunu ovlast zahtjeva. Prolazna provjera bytecodea ne odobrava te dizajne. Pri odobrenoj promjeni ugovora zajedno ažurirajte ovaj članak na oba jezika, odgovarajuće pravilo i njegove pozitivne/prekršajne dokaze.

## Transportni ugovor odvojite od pohranjenog stanja

Ugrađeni `AuthController` mapira `/auth` ispod servlet konteksta `/api`. Prihvaća validirani `LoginRequest` i vraća namjenske recorde `CsrfResponse` ili `SessionUser`. Ne vraća persistence entitet `AppUser`. Razlika je bitna jer entitet sadrži hash lozinke i detalje persistencije, a odgovor sesije objavljuje samo `id`, `displayName` i `email`.

`AppUserRepository` proširuje `JpaRepository<AppUser, UUID>` i dodaje `findByUsername`. `AppUser` generira UUID u aplikacijskom konstruktoru te zadržava zaštićeni konstruktor bez argumenata za JPA. To su konkretni ugrađeni ugovori, a ne univerzalni bazni entitet ili hijerarhija generičkih kontrolera.

| Uloga               | Smještaj i vlasništvo                                                                                                                                                                                                                                                       | Granica odgovornosti                                                                                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HTTP kontroler      | Lokalni `<Capability>Controller` funkcionalnosti; vlasnik URL mapiranja, validacije zahtjeva, statusa i transportnih odgovora.                                                                                                                                              | Ponovno uporabljiva domenska pravila pripadaju aplikacijskoj radnji, ne granama endpointa.                                                                                   |
| Aplikacijski servis | Lokalni `<Capability>Service` ili imenovani servis radnje kada funkcionalnost ima takvo ponašanje; vlasnik trenutačnog aktera, ovlasti, poslovnih invarijanti i cijele transakcije.                                                                                         | Nije vlasnik obrade cookieja ili izravnih servlet odgovora. Predložak nema opći sloj poslovnih servisa koji bi trebalo proširiti.                                            |
| Repozitorij         | Lokalni `<Entity>Repository` funkcionalnosti; vlasnik upita, zaključavanja i pristupa pohrani.                                                                                                                                                                              | Pronalazak entiteta sam po sebi ne daje ovlast za njegovo korištenje.                                                                                                        |
| Entitet             | JPA tip u vlasništvu funkcionalnosti, poput `AppUser`; vlasnik trajnog identiteta, mapiranog stanja i ponašanja entiteta.                                                                                                                                                   | Nije javni ugovor zahtjeva/odgovora i ne smije kroz JSON objaviti pohranjene tajne.                                                                                          |
| DTO                 | Namjenski record zahtjeva/odgovora u vlasništvu funkcionalnosti; držite ga ugniježđenog u kontroleru ako ga koristi samo taj transport, kao u `AuthController`, ili u lokalnoj datoteci funkcionalnosti ako ga ona dijeli.                                                  | Namjerno definirajte zapisivi ulaz i javni izlaz; polja entiteta nisu automatska DTO shema.                                                                                  |
| Mapper              | Eksplicitna projekcija na granici odgovora funkcionalnosti; jednostavnu izgradnju recorda zadržite izravno na mjestu uporabe, kao u `AuthController.session`. Lokalni `<Capability>Mapper` izdvojite tek kada ga opravdaju stvarna složenost ili ponovna uporaba mapiranja. | Pretvara već odabrane podatke; mapiranje nije vlasnik dohvata iz baze, autorizacije ili poslovnih promjena. Framework za mapiranje ili generička baza mappera nisu ugrađeni. |

Autentikacija je poseban tok s ugrađenim Security suradnicima. Rotaciju sesije i spremanje konteksta nemojte seliti u generički poslovni servis samo da svi kontroleri izgledaju jednako.

## Praktičan recept promjene

Client Discovery pokazuje transakciju u vlasništvu servisa oko cijele radnje: dohvat aktivnog aktera, pronalazak resursa, provjera članstva i promjenjivosti, provjera očekivane revizije, spremanje promjene i audit zapisa. Servis učitavanja datoteka dodatno zaključava roditelja prije provjere zajedničke kvote kako konkurentni zahtjevi ne bi potrošili isti preostali kapacitet.

Slijedi **recept u pseudokodu, a ne ugrađeni API**. Projekt mora implementirati command/response recorde, politiku aktera, repozitorij ograničen opsegom, iznimku konflikta, audit writer, migracije i HTTP mapiranje pogrešaka. JPA i Spring transakcije već su ovisnosti; domenski suradnici nisu.

```java
@Transactional
public RecordView rename(UUID workspaceId, UUID recordId,
                         RenameRecord command, Authentication authentication) {
    var actor = actors.requireEnabled(authentication);
    var record = records.lockInWorkspace(workspaceId, recordId, actor);
    record.requireMutable();
    if (record.revision() != command.expectedRevision()) {
        throw new StaleRevision();
    }
    record.rename(command.name());
    record.advanceRevision();
    audit.append(actor.id(), record.id(), "RECORD_RENAMED");
    return views.record(record, actor);
}
```

Kontroler prevodi zahtjev i delegira jednom. Servis zajedno drži invarijantu i sva povezana pisanja u bazu. Pogreška pri spremanju audit retka ne smije ostaviti preimenovanje potvrđeno ako je audit dio poslovnog ugovora. Vraćeni DTO sam po sebi ne dokazuje uspješan commit: vanjska transakcija ili ograničenje pri potvrdi još mogu zakazati.

## Ovlasti i transakcijski detalji dio su granice

Session principal identificira račun, a trenutačni aplikacijski zapisi određuju što taj račun smije raditi. Endpoint sesije u predlošku ponovno dohvaća aktivnog korisnika, ali ne ugrađuje automatsku provjeru živog računa za svaku buduću domensku radnju. Novi servis mora tu politiku eksplicitno odabrati i implementirati. Ugrađena Security uloga je `USER`; ADMIN i članstva iz drugih projekata nisu prenosive pretpostavke.

U pregledanom Discovery kodu najprije se dohvaća aktivni akter. Zaključavajući dohvat resursa zatim može zaključati red prije nego provjera članstva vrati 404 za skriveni resurs. Taj izvor nemojte prepričati kao univerzalno pravilo da autorizacija uvijek prethodi svakom zaključavanju. Navedite stvarni redoslijed i razlog opsega zaključavanja.

Spring proxy transakcije također imaju granicu: poziv druge anotirane metode na istom objektu servisa ne stvara novu presretnutu transakciju. Dodavanje `@Transactional` privatnom helperu ne izolira njegov rad. Ponovne pokušaje, odvojene transakcije i vanjski I/O dizajnirajte kroz namjerne granice umjesto pretpostavke da se anotacije na helperima automatski slažu.

## Kvar i oporavak

Dva uređivača pročitaju reviziju 7. Prvi spremi reviziju 8, a drugi pošalje očekivanu reviziju 7. Ispravan servis vraća dokumentirani konflikt i frontend čuva nespremljeni nacrt drugog uređivača. Slijepi ponovni pokušaj s osvježenom revizijom prepisao bi namjeru i nije valjan oporavak.

Uz isključen Open Session in View, odgovor koji treba lazy podatke mora ih učitati i mapirati unutar predviđene servisne/upitne transakcije. Slučajan lazy-loading kvar riješite projekcijom ili upitom, ne uključivanjem web sesija. Mrežne pozive držite izvan dugih zaključavanja baze; trajna vanjska operacija zahtijeva zaseban dizajn preuzimanja rada, I/O-a i usklađivanja.

## Kriteriji prihvata buduće implementacije

Ovim slučajevima definirajte provjere implementacije u projektu; slijedite trenutačna ovlaštenja za provjeru.

- Nevaljan transportni unos odbija se prije promjene; persistence entitet ne pojavljuje se izravno u JSON-u.
- Identifikator iz drugog workspacea ne može dosegnuti promjenu ili privatnu projekciju.
- Zastarjela revizija uzrokuje konflikt, a korisnički nacrt ostaje sačuvan.
- Kvar povezanog pisanja poništava cijelu radnju, uključujući obvezni audit.
- Novoonemogućeni račun ne može izvršiti radnju koja zahtijeva trenutačno aktivne ovlasti.
- DTO nastaje unutar eksplicitne granice učitavanja podataka, bez skrivenih web upita.

## Točni izvori

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/AuthController.java` — transportni DTO-i i poseban tok autentikacije.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/user/AppUser.java` — pohranjeni identitet i hash lozinke.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/user/AppUserRepository.java` — ugrađena JPA granica.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/DiscoveryService.java` — akter, zaključavanje, članstvo i revizija.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectFilesService.java` — transakcijska kvota, pohrana i audit.
