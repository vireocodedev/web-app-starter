# Jedna transakcija za jednu cjelovitu poslovnu naredbu

**Status podrške: referentni recept potkrijepljen izvorom.** Spring transakcije i JPA dostupni su u predlošku, ali prikazane command servise, audit writer i domenske ovlasti mora implementirati projekt. Client Discovery daje primjere transakcijskih radnji, a LMS korisnu usporedbu flusha i stvarnog završetka transakcije.

Koristite obrazac kad jedna korisnička radnja mijenja više redaka, kvota ovisi o konkurentnim zapisivačima ili audit događaj mora postojati točno kad postoji i poslovna promjena. Najprije definirajte invarijantu: baza ne smije zadržati samo prividno uspješan početak naredbe.

## Aplikacijskom naredbom obuhvatite cijelu radnju

Client Discovery `DiscoveryService` ima klasni `@Transactional`. Promjena metapodataka dohvaća aktivnog aktera, traži administratorsku ovlast, zaključava projekt, provjerava promjenjivost i reviziju, ažurira organizaciju i projekt, povećava reviziju i dodaje audit prije projekcije odgovora. To je jedna aplikacijska operacija, ne niz neovisnih repository commitova.

`ProjectFilesService` isti obrazac primjenjuje na upload. Autentificira aktera, zaključava roditelja, provjerava kvotu, čita ograničen sadržaj, ponovno provjerava stvarnu duljinu, umeće sadržaj i metapodatke te dodaje audit unutar servisne transakcije. Metode čitanja izričito koriste read-only transakcije. Granica servisa izražava radnju; anotacija na svakom pojedinom SQL pozivu ne bi uspostavila istu invarijantu.

| Rad                               | Odnos prema naredbi                                       |
| --------------------------------- | --------------------------------------------------------- |
| Živi akter i ovlasti resursa      | Razriješiti prije zaštićene promjene                      |
| Provjere kvote, stanja i revizije | Čitati zaštićeno stanje unutar granice promjene           |
| Poslovni redci i obvezni audit    | Zajedno potvrditi ili poništiti                           |
| Javni odgovor                     | Namjerno odabrati polja dopuštenog rezultata              |
| Nepovratni vanjski učinak         | Zasebna trajna operacija; PostgreSQL ga ne može poništiti |

## Praktičan recept naredbe

Zapis workspacea premješta se u kolekciju s ograničenim kapacitetom. Članstvo, kapacitet, revizija i audit moraju biti usklađeni. Slijedi **pseudokod**, ne API dostupan za import iz predloška. Prije uporabe implementirajte politiku aktera, repozitorij sa scoped zaključavanjem, DTO-e, audit pohranu, migracije i prevođenje pogrešaka.

```java
@Transactional
public RecordView move(UUID workspaceId, UUID recordId, MoveRecord command,
                       Authentication authentication) {
    var actor = actors.requireEnabled(authentication);
    var record = records.lockVisible(workspaceId, recordId, actor);
    var collection = collections.lockTarget(workspaceId, command.targetId(), actor);
    revisions.requireExpected(record.revision(), command.expectedRevision());
    collection.requireSpareCapacity();
    record.moveTo(collection.id());
    record.advanceRevision();
    audit.append(actor.id(), record.id(), "RECORD_MOVED");
    return views.record(record, actor);
}
```

Skraćeni recept ne određuje univerzalni redoslijed zaključavanja. Ako druga naredba zaključava kolekciju prije zapisa, prije primjene dogovorite zajednički redoslijed. Aplikacijski servis posjeduje protokol svih sudionika, uključujući brisanje i promjenu članstva. DTO validacija korisna je, ali sintaktički valjan ID ne dokazuje pripadnost cilja istom workspaceu.

## Proxy ulaz, flush i commit različite su granice

Stvarna Spring transakcijska granica poziv je presretnut transakcijskim proxyjem ili eksplicitno izvršavanje `TransactionTemplate`. Poziv helpera na istom objektu ne prolazi kroz novi proxy. U Discovery izvoru interno pozvani helper ima `noRollbackFor`; tu anotaciju nemojte predstavljati kao samostalnu promjenu rollback politike vanjske transakcije pri self-invocationu.

Namjerno odaberite vanjsku granicu i semantiku iznimki. Uobičajene Spring postavke poništavaju rad na unchecked pogreškama; checked iznimke i prilagođeni `rollbackFor` zahtijevaju pregled. Hvatanje pogreške i vraćanje uspješnog DTO-a može potkopati ugovor, a persistence kvar već može označiti transakciju rollback-only.

LMS `BaseService` koristi `saveAndFlush`. Flush šalje čekajuće promjene prema bazi i može ranije pokazati constraint kvar; ne čini ih commitanima ili završenom radnjom. Specifični servis verzioniranja registrira synchronization callbackove koji razlikuju committed, rolled-back i unknown završetak. Debug poruka nakon flusha nije dokaz commita. Vanjski pozivatelj i dalje može određivati konačan ishod.

## Odluke pri kvaru i oporavku

Ako audit insert zakaže nakon promjene poslovnog retka, obvezni audit traži rollback obaju dijelova. Ispravite uzrok, a kasniji autorizirani zahtjev neka ponovi rad iz potvrđenog stanja. Ako invarijanta zakaže prije promjene, vratite dokumentirani konflikt bez izmjene. Nakon nejasnog HTTP ishoda klijent treba idempotency/reconciliation ugovor naredbe; izgubljen odgovor ne opravdava slijepo ponavljanje nepovratne radnje.

Email ili payment adapter nemojte pozivati dok transakcija drži lockove resursa. Rollback baze ne može opozvati taj učinak. Trajna namjera, I/O izvan transakcije i usklađivanje zaseban su recept. Jednako tako, in-memory obavijest nakon commita nije trajni outbox samo zato što je trenutak slanja ispravan.

## Kriteriji za buduću implementaciju

- Kvar bilo kojeg obveznog povezanog pisanja ne ostavlja nijednu poslovnu promjenu naredbe potvrđenom.
- Neovlašten ili novoonemogućen akter ne doseže promjenu drugim servisnim ulazom.
- Konkurentne promjene kapaciteta sudjeluju u istom lock protokolu.
- Uspješan flush uz neuspješan commit prikazuje se kao kvar, nikad kao trajni uspjeh.
- Self-invoked helper ne služi kao pretpostavljena nova transakcija ili promjena rollback pravila.
- Vanjski učinci imaju eksplicitan trajni/idempotentni dizajn, ne tretiraju se kao poništivi database upisi.

Slučajevi određuju ponašanje; sam pregled izvora nije runtime dokaz.

## Točni izvori

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/DiscoveryService.java` — transakcijska promjena, revizija, audit i interno pozvani helper.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectFilesService.java` — zaključana kvota, ograničen sadržaj i audit iste naredbe.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/base/BaseService.java` — usporedba save-and-flush postupka.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/vessel/VesselService.java` — završetak kroz synchronization, odvojen od flusha.
