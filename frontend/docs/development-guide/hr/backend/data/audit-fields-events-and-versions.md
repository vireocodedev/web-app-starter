# Audit polja, događaji i nepromjenjive verzije odgovaraju na različita pitanja

**Status podrške: referentni recept potkrijepljen izvorom.** LMS pokazuje JPA audit polja i zamjenske verzijske retke; Client Discovery transakcijske audit događaje te verzije/prijelaze zaštićene bazom. Ti mehanizmi nisu opći ugrađeni history framework predloška. Birajte ih prema informacijama koje domena mora zadržati.

Koristite obrazac kad „tko je promijenio?” preraste u „što se dogodilo?”, „koji je točno sadržaj odobren?” ili „možemo li rekonstruirati ranije stanje?”. Četiri polja na trenutačnom retku ne odgovaraju na sva pitanja, a čuvanje svakog zahtjeva nije sigurna zamjena za dizajn povijesti.

## Najprije odaberite dokaz, zatim oblik pohrane

| Mehanizam              | Odgovara                                      | Sam ne dokazuje                                         |
| ---------------------- | --------------------------------------------- | ------------------------------------------------------- |
| Created/modified polja | Tko je stvorio ili zadnji mijenjao red i kada | Sve međuradnje ili točan raniji payload                 |
| Audit događaj          | Koja imenovana radnja, akter i cilj           | Potpuno rekonstruirano stanje ili nepromjenjive bajtove |
| Zadržana verzija       | Koji je točan version payload postojao        | Ovlast i značenje kasnijeg prijelaza                    |
| Zapis prijelaza        | Koja lifecycle odluka vrijedi za verziju      | Da je svaki vanjski učinak isporučen                    |

Mehanizmi mogu koegzistirati. Mala CRUD postavka možda treba samo zadnju promjenu. Pregledani artefakt može trebati payload i approval prijelaz. Nijedan zahtjev automatski ne traži event sourcing cijele aplikacije.

## Audit polja trebaju aktera i vlasnika životnog ciklusa

LMS `AuditableEntity` daje created/modified datume i principale preko `AuditingEntityListener`. Aplikacija uključuje JPA auditing s imenovanim date-time providerom, a `AuditorAwareImpl` razrješava principal iz Security konteksta. To je konkretno konfiguriran sustav, ne ponašanje dobiveno kopiranjem samih anotacija polja.

Projekt određuje prikaz aktera, izvor vremena, anonymous/system-job politiku i ovlasti čitanja. Ljudsko ime mijenja se i može biti nejedinstveno; odaberite treba li stabilan account identitet, zadržana prikazna labela ili oboje. LMS ima vlastite principal konvencije koje se prije prijenosa prilagođavaju računu predloška. Audit polja određuje poslužitelj i ne prihvaćaju se iz write DTO-a.

## Poslovni događaj dodajte uz promjenu

Discovery `audit` umeće cilj, aktera, radnju, vrijeme i JSON detalj. Pozivi transakcijskih servisa commitaju s poslovnom promjenom. Upload događaj zadržava ograničene metapodatke poput identiteta i duljine datoteke, ne duplicira privatni sadržaj. Čitanje događaja ima vlastitu projekciju; zadržani detalj nije automatski dostupan svakoj publici.

**Pseudokod recepta** traži current actor, transakcijske repozitorije, audit shemu, encoder dopuštenih metapodataka i HTTP ugovor projekta. Nijedan suradnik nije import predloška.

```java
@Transactional
public RecordView rename(UUID id, Rename command, Authentication auth) {
    var actor = actors.requireCurrent(auth);
    var record = records.lockAuthorized(id, actor);
    record.rename(command.name());
    audit.append(new AuditEvent(actor.id(), id, "RECORD_RENAMED",
        clock.instant(), Map.of("field", "displayName")));
    return views.record(record, actor);
}
```

Namjerno mali detalj ne sprema stari/novi tekst po zadanim postavkama. Ako točne vrijednosti trebaju ostati, dodajte eksplicitan allowlist, retention politiku i autoriziranu history projekciju; ne dumpajte request body. Odlučite stvara li nepromijenjena naredba događaj. Log red dijagnostika je, ne zamjena transakcijskog audita niti dokaz commita.

## Odvojite logički identitet od identiteta verzije

LMS version-update putanja kopira postojeći objekt, primjenjuje patch, čisti fizički row ID i stvara zamjenski red uz isti stabilni logički UUID. History lookup sortira verzije i računa odabrane field promjene, isključujući audit/convenience šum. To je aplikacijska konvencija verzioniranja. Pregledani kod ne dokazuje da baza zabranjuje svako ažuriranje stare verzije.

Discovery retained shema ide dalje: odvaja version payload i prijelaze, ograničava slijed/veze, sprema izdani payload i digest te instalira triggere zabrane UPDATE/DELETE na odabranim tablicama. Funkcija triggera nastaje ranijom migracijom i ponovno se koristi. Zaštite su specifične izvoru; projekt vlastitu retention, correction i deletion politiku implementira novim migracijama.

Nepromjenjiva verzija treba zadržati točan payload na koji se odobrenje/export poziva. Ponovno računanje starog dokumenta današnjim templateom ili promjenjivim labelama mijenja značenje. Digest identificira bajtove ili definirani kanonski payload; ne dokazuje aktera odobrenja i nije digitalni potpis. Ispravak dodaje novu verziju ili prijelaz prema domeni umjesto tihog prepisivanja povijesti.

## Kvar i oporavak

Ako obvezna audit pohrana zakaže, poništite promjenu. Ako immutable trigger odbije slučajno čišćenje ili cascade, popravite lifecycle operaciju umjesto gašenja zaštite. Administrativni retention ili erasure trebaju zasebno pregledanu politiku podataka; nepromjenjivost ovog dizajna nije univerzalna zakonska odluka zadržavanja.

Razlikujte „saved”, „flushed”, „committed” i „delivered”. Database povijest može dokazati potvrđenu namjeru dok vanjska obavijest ostaje neizvjesna. Zadržani payload može biti točan dok mu je trenutačna vidljivost opozvana. Projekcije i dokaze vanjske operacije dizajnirajte odvojeno od history pohrane.

## Kriteriji za buduću implementaciju

- Klijentski DTO ne prepisuje server-derived aktera i vrijeme.
- Poništena radnja ne ostavlja potvrđen success audit kada dijele ugovor.
- History endpointi primjenjuju trenutačne ovlasti i redakciju prema publici.
- Nova verzija ima zaseban fizički identitet i namjeravanu logičku vezu.
- Raniji payload ostaje isti nakon kasnijih promjena, template updatea i prijelaza.
- Database zaštita odbija rewrite/delete; ispravci koriste pregledanu append putanju.
- Detalj događaja isključuje tajne i neograničen dump; obvezni osjetljivi dokaz ima vlasništvo pristupa i zadržavanja.

## Točni izvori

- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/base/AuditableEntity.java` — JPA audit polja/listener.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/base/AuditorAwareImpl.java` i `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/LmsBackApplication.java` — akter i uključivanje auditinga.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/vessel/VesselService.java` — zamjenska verzija i kronološka field-diff usporedba.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/DiscoveryService.java` — transakcijski audit i history projekcija.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectFilesService.java` — ograničeni metapodaci upload događaja.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/resources/db/migration/V8__project_lifecycle.sql` i `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/resources/db/migration/V10__specification_development.sql` — immutable trigger funkcija, verzije i prijelazi.
