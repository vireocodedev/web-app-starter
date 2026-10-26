# Erasure i hold ograničite istim database predikatom

**Status podrške: Vireo referenca, nije ugrađena ovdje.** History/Offline servisi daju partition-scoped delete/hold mehaniku. Aplikacija posjeduje admin ovlast, svrhu retentiona i pravnu procjenu. Naziv „legal” ne utvrđuje pravnu obvezu ili compliance.

Obrazac koristite za isti actor/owner ID više tenanta ili retenciju koja mora preživjeti obični purge/erase. Globalni lookup pa slabo ograničen delete prelazi granicu i uz ispravan UI tenant.

## Sve granice bindajte jednom promjenom

History briše samo partition, actor ID i `legalHold=false`. Offline koristi partition, owner key i hold iznimku. Expiry delete traži partition i nonheld expired red. Repozitorij bindanjem parametara izbjegava caller SQL.

Hold update veže partition i audit-row ID, odnosno public command ID Offlinea. True znači jedan promijenjen matching red; tuđi partition daje false. Ulaz traži nonblank bounded ključ i non-null identifikator.

| Operacija       | Scope predikata                     |
| --------------- | ----------------------------------- |
| Expiry purge    | Partition + istek + nije held       |
| Subject erasure | Partition + actor/owner + nije held |
| Hold/release    | Partition + točan record/command    |

To je struktura, ne caller ovlast. Servis ne ugrađuje consumer admin model ni pravo nad predanim partitionom. Najprije ga razriješite iz trusted authorityja.

## Hold i završetak imaju zasebno značenje

Erase vraća obrisani broj, a matching held broji za neutralni event. Uspješan poziv zato može ostaviti podatke. „Obrađeno” nije „svi osobni podaci svugdje obrisani”. API pokriva module retke, ne entitete, export, cache, backup i providere.

**Pseudokod recepta:** projekt implementira admin politiku, trusted mapu, scoped repozitorij, zaštićen reporting i inventar cijelog sustava. Helperi nisu starter API.

```java
@Transactional
public ErasureSummary erase(ErasureCommand command, Authentication auth) {
    var scope = administration.requireErasureScope(auth, command.workspaceId());
    var subject = subjects.requireInScope(scope, command.subjectId());
    var removed = retained.deleteUnheld(scope.partition(), subject.stableId());
    var held = retained.countHeld(scope.partition(), subject.stableId());
    return new ErasureSummary(removed, held);
}
```

Odredite ostaje li račun, tko releasea hold i kako se tretira novi upis. Delete ne sprječava replay/import rekreaciju. Rezultat politike zabilježite bez nove neograničene kopije obrisanog sadržaja.

## Pregledajte konkurenciju i transakciju

Hold iznimka u samom delete predikatu jača je od ranijeg Java checka. Ipak source ne daje univerzalan lock/version protokol za novi hold, erase, quota eviction i admission. Potrebno strogo uređenje projekt definira svim writerima; ne obećavajte da simultani hold uvijek pobjeđuje.

Lifecycle događaji objavljuju se transakcijski bez operational listener-failure catcha. Sinkroni kvar može utjecati na operaciju; objava nije committed erase receipt. Audit i post-commit reporting odaberite namjerno.

## Kvar i oporavak

Wrong-partition hold daje uski false/not-found bez tuđeg otkrivanja. Erase jednog tenanta ne prelazi na globalni owner delete kad nema retka. Held ostatak treba zaštićeno objašnjenje i ovlaštenu odluku, ne tiho skidanje zastavice.

Prekinuti multi-system erase treba nastavak s per-owner dokazom, current ovlastima i pending/held/failed stanjima. To je novi rad; scoped delete nije puni data-subject workflow. Scheduler i backup retention zasebni su vlasnici.

## Prilagodba i kriteriji

- Mutation predikat veže partition i subject/record zajedno.
- Caller ovlast odvojena je od scope stringa.
- Hold/release i konkurentni redoslijed eksplicitni su.
- Report pošteno razlikuje removed, held i ostatak sustava.
- Reporting prati commit, ne samo event publikaciju.
- Ostale pohrane i rekreacijske putanje inventarizirane su.
- Flag/API ne stvara pravni zaključak ni globalni erase dokaz.

## Točni izvori

- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-history/src/main/java/com/vireocode/vireo/history/HistoryRepository.java` — scoped delete/update.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-offline/src/main/java/com/vireocode/vireo/offline/OfflineSyncCommandRepository.java` — owner/partition/hold.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-history/src/main/java/com/vireocode/vireo/history/HistoryDataLifecycleService.java` i `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-offline/src/main/java/com/vireocode/vireo/offline/OfflineDataLifecycleService.java` — input, counts i transakcijski eventi.
