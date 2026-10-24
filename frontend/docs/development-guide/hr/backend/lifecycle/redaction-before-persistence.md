# Klasificirajte i redigirajte prije pohrane

**Status podrške: Vireo referentni recept, nije ugrađen u ovaj RGO/Spring predložak.** History/Offline izlažu policy granicu prije spremanja. Primjena API-ja traži odluku o paketima, konfiguraciji, migraciji i ovlastima. Projekt može isti protokol ostvariti u postojećem vlasniku bez Virea.

Obrazac koristite za privatne history snapshotove, replay naredbe i dijagnostiku. Kasnija response redakcija ne uklanja vrijednost već pohranjenu ili backupiranu. Dopuštenu reprezentaciju odredite pri pisanju.

## Stvarna provedba izvora

History recorder pretvara DTO-e u JSON, razrješava aktera pa poziva policy prije spremanja. Odluka mora postojati, imati partition/retention i ne isteći prije događaja. Čuva null/non-null prisutnost kako redakcija ne bi promijenila create/update/delete.

Default svaki prisutan snapshot pretvara u `{}`, odsutan ostaje null. Offline default ne čuva body/header, dok servis zasebno čuva idempotency fingerprint. To minimizira payload, ne pokušava univerzalno otkriti osjetljiva polja.

| Odnos                               | Redigirani oblik        |
| ----------------------------------- | ----------------------- |
| Create: nema prije, postoji poslije | `null`, dopušten objekt |
| Update: oba postoje                 | dopušteni prije/poslije |
| Delete: postoji prije, nema poslije | dopušten objekt, `null` |

Custom policy može zadržati polja, ali framework ne dokazuje njihovu sigurnost. Provjerava mehaniku, ne aplikacijsku klasifikaciju. Actor label, entity ID i command URL također mogu biti privatni; payload redakcija ne anonimizira red.

## Definirajte minimalnu reprezentaciju

**Pseudokod recepta:** projekt implementira klasifikaciju, allowlist projekciju, trusted tenant/actor i pohranu. Helperi nisu ugrađeni API.

```java
var classification = policy.forRecordKind(command.kind());
var retained = classification.projectAllowedFields(command.snapshot());
var decision = new RetentionDecision(
    partitions.fromTrustedScope(actor, workspace),
    retention.deadline(clock.instant()),
    holds.currentFor(command.recordId()),
    retained);
history.storeValidated(decision);
```

Polja odaberite prema svrsi. Uklanjanje samo `password` ne pokriva nested tajne, druga imena i free text. Pregledajte izvedena polja, error podatke i headere. Točan povijesni sadržaj prema potrebi ima zasebnu zaštićenu pohranu, ne široki activity feed.

Offline redakcija mijenja i mogućnost rekonstrukcije. Fingerprint nije replayable body ni dokaz tajnosti. Provjerite stvarni retry/request tok i potrebe; ne širite retention radi praktične dijagnostike.

## Legacy primjena je promjena podataka

Pinned migracije odmah prazne stare History snapshotove i brišu Offline body/header, označavaju expiry i partition jer stara klasifikacija nije obnovljiva. To je destruktivna redakcija, ne bezazlena nadogradnja niti migracija za automatsko pokretanje ovdje.

Projekt treba autoriziran plan, backup/oporavak i pravila potrebnih dokaza. Default ne utvrđuje zakonski retention/erasure. Čitanje recepta ne dopušta brisanje tuđe povijesti.

## Kvar i oporavak

Nevaljana/null odluka, prerani istek i promijenjena snapshot prisutnost zaustavljaju store. Kvar ne pretvarajte u fallback čuvanja originala. Classifier iznimka nije razlog spremanja svega radi nastavka.

Izvor serijalizira prije klasifikacije pa raw podaci postoje u memoriji. Obrazac ograničava pohranu, ne dokazuje odsutnost iz memorije/loga/telemetrije. Svaki sink pregledajte zasebno.

## Prilagodba i kriteriji

- Odredite sadašnjeg history/replay vlasnika i opseg Vireo primjene.
- Definirajte dopuštena polja i metadata, ne samo response redakciju.
- Sačuvajte prisutnost i odbijte nevaljanu odluku.
- Provjerite replay potrebe nakon uklanjanja body/headera.
- Prije autorizirane migracije pregledajte legacy gubitak sadržaja.
- Svrha, pristup i pravna pravila pripadaju aplikaciji.
- Ne tvrdite univerzalnu detekciju tajni ili anonimizaciju.

## Točni izvori

- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-history/src/main/java/com/vireocode/vireo/history/HistoryRecorder.java` — klasifikacija i guardovi.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-history/src/main/java/com/vireocode/vireo/history/SafeDefaultHistoryDataLifecyclePolicy.java` — prazni objekt.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-offline/src/main/java/com/vireocode/vireo/offline/OfflineSyncService.java` — fingerprint i retained payload.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-offline/src/main/java/com/vireocode/vireo/offline/SafeDefaultOfflineDataLifecyclePolicy.java` — bez body/headera.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-history/src/main/resources/db/vireo/history/V3__data_lifecycle.sql` i `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-offline/src/main/resources/db/vireo/offline/V4__data_lifecycle.sql` — legacy redakcija/istek.
