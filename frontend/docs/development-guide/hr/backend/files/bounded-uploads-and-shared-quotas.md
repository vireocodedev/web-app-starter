# Ograničite stvarne upload bajtove pod zajedničkim quota lockom

**Status podrške: potkrijepljen recept za projekt.** Discovery sprema male ograničene privatne datoteke u PostgreSQL uz multipart, domain i database granice. Predložak nema ovaj file servis, object storage, malware scan ni generički upload. Potrebne mogućnosti projekt eksplicitno dizajnira.

Obrazac koristite za per-file, ukupne byte i count kvote. Browser provjere pomažu UX-u, ali metadata i nezaključani precheck ne štite stvarne bajtove ili konkurentni kapacitet.

## Provedite različite slojeve

Peer transport ograničava file/request i ima multipart threshold. Kontroler prima točno jedan dio `file`. Servis provodi konfigurirani file/project/count, a konfiguracija je sama ograničena. Shema zasebno dopušta najviše 26.214.400 bajtova uz `octet_length(content) = size_bytes`.

| Sloj                        | Zaštita                         |
| --------------------------- | ------------------------------- |
| HTTP/multipart plafon       | Transport/parser resursi        |
| Točno jedan dio             | Višak i dvosmislenost           |
| Domain file limit           | Prihvaćena veličina             |
| Zajednička count/byte kvota | Kapacitet svih zapisivača       |
| Bounded read                | Stvarni sadržaj, ne tvrdnja     |
| Database constraint         | Duljina, sadržaj i tvrdi plafon |

25 MiB shema i peer defaulti nisu politika svakog predloška. Konfiguracija iznad sheme traži pregledanu promjenu. Izvor dopušta nula bajtova; nonempty zahtjev projekt dodaje zasebno.

## Serializirajte quota invarijantu

Servis dohvaća enabled aktera, zaključava projekt, provjerava ovlast/promjenjivost pa broji i zbraja spremljene datoteke. Upload, opoziv članstva i brisanje koriste roditeljski protokol. Bez njega dva zahtjeva potroše isti slobodni kapacitet.

Resource helper može zaključati prije članstva; to nije bypass niti tvrdnja svih ovlasti prije locka. Zaštićene promjene dijele vlasnika invarijante i provode autorizaciju.

**Pseudokod recepta:** projekt implementira aktera, scoped lock, kvotu, bounded reader, repozitorij, audit i error mapping. Nazivi nisu starter API.

```java
@Transactional
public FileView upload(UUID workspaceId, MultipartFile file, Authentication auth) {
    var actor = actors.currentEnabled(auth);
    workspaces.lockAndRequireUpload(workspaceId, actor);
    var usage = files.usage(workspaceId);
    quota.checkDeclared(usage, file.getSize());
    var bytes = content.readAtMost(file.getInputStream(), quota.fileLimit() + 1);
    quota.checkActual(usage, bytes.length);
    var saved = files.insert(workspaceId, safeName(file.getOriginalFilename()), bytes);
    audit.uploaded(actor.id(), saved.id(), bytes.length);
    return views.metadata(saved);
}
```

Stvarni kod koristi try-with-resources i nakon čitanja maximum-plus-one ponovno provjerava file i ukupnu kvotu. Povjerenje `getSize()` ili cijeli read prije granice poništava zaštitu. Metadata, content i audit dijele transakciju.

## Naziv je prikazni podatak

Peer uklanja path komponente oba slasha, control/format code pointove, ograničava 200 code pointova, trimma i daje fallback za prazno/dot. Naziv nije serverska putanja. To nije type validacija, virus scan ili dozvola inline rendera.

Bounded BYTEA materijalizira datoteku u memoriji i drži parent lock tijekom čitanja. To je kompromis malih datoteka. Veliki streaming/object upload treba reservation/storage/cleanup protokol; byte-array implementacija nije streaming.

## Kvar i oporavak

Izvor daje 413 za oversize, 409 za kvotu i 400 za read kvar. Insert/audit kvar poništava naredbu. Prihvatljiva deklarirana veličina uz prevelik stvarni stream ne ostavlja content ni rezervaciju.

Samo frontend/multipart promjena ne mijenja sigurno domain/shema limite. Izbjegnite lock po novom uploadu, client stored length, path iz imena i unlimited read. Scan/quarantine treba pravilo pending kvote i trenutka dostupnosti.

## Implementacija i kriteriji

- Transport/domain/database granice slažu se i zasebno vrijede.
- Extra part i malformed ugovor odbijaju se prije pohrane.
- Stvarni oversize pada i uz prihvatljiv metadata.
- Konkurentni uploadovi ne troše isti preostali count/byte.
- Revoke/delete dijele parent protokol.
- Normalizacija naziva služi prikazu; content trust je zaseban.
- Read/insert/audit kvar ne ostavlja djelomičnu datoteku ni lažnu kvotu.

## Točni izvori

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectFilesService.java` — lock, actual bytes, audit i ime.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectFilesController.java` — jedan part i HTTP.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectFileLimits.java` — konfiguracijske granice.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/resources/application.yaml` — multipart/domain postavke.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/resources/db/migration/V5__project_files.sql` — BYTEA i size constraint.
