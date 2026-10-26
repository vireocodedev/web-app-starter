# Retention i kvotu podijelite trusted tenant opsegom

**Status podrške: Vireo referenca, nije ugrađeno RGO ponašanje.** Policy dodaje opaque partition, istek i hold History/Offline retku. Predložak traži izričitu primjenu modula ili vlastitu implementaciju. Default je storage mehanika, ne univerzalna produktna/pravna politika.

Obrazac koristite kad isti owner postoji u više tenanta ili povijest jednog ne smije izbacivati tuđe podatke. Retention i quota trebaju istu jasnu granicu vlasništva kao ovlasti.

## Default owner nije tenant model

History bira actor partition ili `system`, Offline stabilni owner key. Default je 30 dana i 10.000 redaka/naredbi po partitionu. Tenant aplikacija mijenja policy; više korisnika deploymenta samo ne stvara tenant model.

Identitet gradite iz trusted current scopea, ne proizvoljnog client stringa. Opaque encoding kanonskog tuplea sprječava delimiter koliziju i nepotrebno otkrivanje, ali hash nije ovlast ni zajamčena anonimizacija. Verzija/mapa ostaje stabilna za kasniji pronalazak.

| Odluka        | Aplikacijski vlasnik određuje             |
| ------------- | ----------------------------------------- |
| Tuple         | Sve granice izolacije retentiona/brisanja |
| Istek         | Svrhu, trajanje i sat                     |
| Quota         | Count/byte i eviction/rejection           |
| Hold          | Ovlast i osnovu postavljanja/otpuštanja   |
| Promjena mape | Pronalazak starih scoped podataka         |

## Precizno čitajte admission

History prvo briše expired nonheld partition retke. Ako treba mjesta, bira najstarije nonheld po occurrence/ID i uklanja dovoljno za novi. Offline koristi creation/ID. Quota tako može obrisati običan red prije isteka; retention ne obećava čuvanje svega cijeli period.

Held su izuzeti. Kad nema dovoljno običnih redaka, servis objavljuje quota-rejected i baca iznimku. Ne namjerava brisati hold ili zaobilaziti opaženu kvotu radi novog pisanja.

**Pseudokod recepta:** projekt implementira trusted partition, policy/sheme, concurrency vlasnika i repozitorij. Helperi nisu starter API.

```java
@Transactional
public void admit(RetainedRecord record, CurrentScope scope) {
    var partition = partitions.requireForTrustedScope(scope);
    partitionLocks.acquire(partition);
    repository.purgeExpiredUnheld(partition, clock.instant());
    quota.makeRoomFromOldestUnheld(partition);
    repository.insert(record.withPartition(partition));
}
```

Partition lock je **predloženi hardening**, nije prikazan u pinned servisu. Source radi count/select/delete/store transakcijski, ali repozitoriji ovdje nemaju partition lock/serializable admission. Sekvencijalni count nije dokaz stroge konkurentne granice. Potrebnu invarijantu projekt koordinira svim writerima i hold/purge radnjama.

## Scope vežite u svaki upit

Repozitoriji bindaju partition u expiry delete, actor/owner erase i hold. Istek koristi ubrizgani sat. Indeksi uključuju partition s expiry/hold ili owner poljem prema pristupu. Globalni purge-all druga je ovlast i opseg, ne proizlazi iz partition API-ja.

Scheduler pripada aplikaciji. Oportunistički purge pri upisu ne jamči čišćenje neaktivnog partitiona. Count kvota također ne ograničava bajtove custom velikih payloadova; odredite size/storage budžet.

## Kvar i oporavak

Hold iscrpljenost daje kontroliran admission kvar i zaštićen operativni broj. Riješite politiku/kapacitet ovlaštenim ownerom, bez tihog pada holda ili neograničenog rasta. Event prije rollbacka nije dokaz potvrđene promjene.

Nova encoding mapa bez migracije može ostaviti podatke nedostupnima i erase nepotpunim. Zadržite stare mape dok redci postoje. Izbjegnite tenantless ključ, client partition i jamstvo trajanja kad quota ranije evicta.

## Prilagodba i kriteriji

- Tuple i encoding trusted su, stabilni i dokumentirani.
- Default trajanje/brojke prihvaćeni su svjesno ili zamijenjeni.
- Expiry i quota eviction razlikuju se; payload size ima granicu.
- Writer/purge/hold dijele potreban concurrency protokol.
- Held-capacity kvar ne mijenja politiku tiho.
- Purge ritam i stare mape imaju vlasnika.
- Default ne daje pravno/compliance jamstvo.

## Točni izvori

- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-history/src/main/java/com/vireocode/vireo/history/HistoryDataLifecycleService.java` — purge, eviction i quota.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-offline/src/main/java/com/vireocode/vireo/offline/OfflineDataLifecycleService.java` — command admission i scope.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-history/src/main/java/com/vireocode/vireo/history/HistoryRepository.java` — predikati bez eksplicitnog partition locka.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-history/src/main/java/com/vireocode/vireo/history/SafeDefaultHistoryDataLifecyclePolicy.java` i `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-offline/src/main/java/com/vireocode/vireo/offline/SafeDefaultOfflineDataLifecyclePolicy.java` — actor/owner default nije tenant.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-history/src/main/java/com/vireocode/vireo/history/StarterHistoryProperties.java` i `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-offline/src/main/java/com/vireocode/vireo/offline/StarterOfflineProperties.java` — reference defaulti.
