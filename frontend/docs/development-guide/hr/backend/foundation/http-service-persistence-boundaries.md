# Granice HTTP-a, aplikacijskog servisa i persistencije

**Status podrške: ugrađena osnova uz izričito označen referentni recept.** Predložak ima autentikacijske kontrolere, DTO recorde, korisnički entitet i JPA repozitorij. Opći okvir domenskih servisa, servis tenant ovlasti i poslovni CRUD modul nisu ugrađeni. Primjer transakcijske promjene u nastavku prilagođava granice iz Client Discoveryja; navedeni domenski tipovi su pseudokod.

Koristite ovaj obrazac pri dodavanju prve funkcionalnosti projekta ili razdvajanju endpointa koji miješa autentikaciju, SQL, poslovna pravila i izgradnju odgovora. Cilj je razumjeti jednu poslovnu radnju iz ulazne metode aplikacijskog servisa, uz jasan HTTP ugovor i granicu persistencije.

## Transportni ugovor odvojite od pohranjenog stanja

Ugrađeni `AuthController` mapira `/auth` ispod servlet konteksta `/api`. Prihvaća validirani `LoginRequest` i vraća namjenske recorde `CsrfResponse` ili `SessionUser`. Ne vraća persistence entitet `AppUser`. Razlika je bitna jer entitet sadrži hash lozinke i detalje persistencije, a odgovor sesije objavljuje samo `id`, `displayName` i `email`.

`AppUserRepository` proširuje `JpaRepository<AppUser, UUID>` i dodaje `findByUsername`. `AppUser` generira UUID u aplikacijskom konstruktoru te zadržava zaštićeni konstruktor bez argumenata za JPA. To su konkretni ugrađeni ugovori, a ne univerzalni bazni entitet ili hijerarhija generičkih kontrolera.

| Sloj                | Odgovornost                                         | Što ne smije prešutno preuzeti                                    |
| ------------------- | --------------------------------------------------- | ----------------------------------------------------------------- |
| HTTP kontroler      | Mapiranje, validacija zahtjeva, status i odgovor    | Ponovno uporabljiva domenska pravila skrivena u granama endpointa |
| Aplikacijski servis | Trenutačni akter, ovlasti, invarijante, transakcija | Cookie obrada ili izravno pisanje servlet odgovora                |
| Persistencija       | Upiti, zaključavanja, ograničenja i pohrana         | Zaobilaženje opsega jer identifikator postoji                     |
| DTO projekcija      | Namjerno odabrana javna polja                       | Automatska serijalizacija entiteta i lazy obilazak                |

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
