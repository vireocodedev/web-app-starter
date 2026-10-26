# Odvojite privatno preuzimanje i metadata projekcije

**Status podrške: potkrijepljen recept za projekt.** Discovery čita metapodatke bez sadržaja, a privatne bajtove daje zasebnim autoriziranim endpointom. Pohrana je bounded PostgreSQL BYTEA, ne object-storage apstrakcija. Predložak nema ovaj API ni S3/signed-download podršku.

Obrazac koristite za datoteke u listi, kvoti, kartici ili domain odgovoru. Većina ekrana treba ID, ime, veličinu i uploader, ne blob. Implicitno učitavanje sadržaja povećava memoriju, promet i rizik otkrivanja.

## Razdvojite upite metapodataka i sadržaja

List izričito bira ID, naziv, veličinu, vrijeme i uploader ID/naziv unutar autoriziranog roditelja. Za listu/kvotu ne bira `content`. Odgovor uključuje limite i ukupan zbroj spremljenih veličina.

Download dohvaća enabled aktera i parent ovlast pa name/content prema parent i file ID-u. Tuđi valjani UUID ne prolazi pod dopuštenim parentom. Kontroler posjeduje transport, servis ovlasti/pohranu.

| Operacija      | Potrebni podaci                | Ovlast                              |
| -------------- | ------------------------------ | ----------------------------------- |
| Metadata lista | Dopušteni metapodaci           | Aktualna parent/resource vidljivost |
| Quota          | Count i stored bytes           | Zajednički mutation protokol        |
| Download       | Bajtovi i sigurno prikazno ime | Trenutačni parent i child scope     |
| Preview/inline | Dodatna content politika       | Attachment endpoint je ne ugrađuje  |

Ne serijalizirajte entitet s byte arrayem uz očekivanje da frontend ignorira polje. Namjerna projekcija sprječava dohvat i objavu na izvornoj granici.

## Uski transportni ugovor bajtova

Uspjeh izvora koristi `application/octet-stream`, stvarnu duljinu niza, attachment, kodirano UTF-8 ime, `Cache-Control: no-store` i `X-Content-Type-Options: nosniff`. Fiksni fallback prati encoded ime, već normalizirano kao prikazni podatak.

**Pseudokod recepta:** projekt implementira aktera, scoped repozitorij, bounded content, filename/header encoder i response mapping. Suradnici nisu starter API.

```java
public Download download(UUID workspaceId, UUID fileId, Authentication auth) {
    var actor = actors.currentEnabled(auth);
    workspaces.requireVisible(workspaceId, actor);
    var stored = files.readContentByWorkspaceAndId(workspaceId, fileId)
        .orElseThrow(FileNotFound::new);
    return new Download(stored.safeDisplayName(), stored.bytes());
}
```

Kontroler odabire attachment zaglavlja; ime se ne spaja u filesystem path ili raw header. Koristite pregledani framework encoder umjesto ručnog escaping nagađanja.

Attachment/no-sniff smanjuje slučajnu browser interpretaciju, ne čini sadržaj bezazlenim niti štiti kasnije otvaranje. Peer ne pokazuje malware scan, content-type validaciju ni siguran preview. To dodajte kao zasebne mogućnosti.

## Bounded bajtovi nisu streaming

Download materijalizira cijelu ograničenu datoteku. To vrijedi samo pod size/memory ograničenjima. Velika datoteka/object storage treba adapter, stream lifecycle, timeout/cancellation i autorizaciju; preimenovanje metode to ne daje.

Signed object URL traži scope, istek, disposition/cache i granice opoziva. To je novi rad, ne ugrađeni API. Privatni bucket ne zamjenjuje ovlast pri izdavanju URL-a, a bearer link ima vlastiti vijek.

## Kvar i oporavak

Missing/cross-parent slijedi odabrani not-found nakon ovlasti. Error/redirect ne otkriva tuđe postojanje. Success ima no-store, ali projekt zasebno određuje cache pogrešaka; ne nasljeđuje ga svaki handler automatski.

Server ne može povući već preuzetu lokalnu kopiju. Ovlasti kontroliraju budući pristup, ne digital rights. I metapodaci mogu biti privatni: ime, uploader i veličina slijede permitted projection.

Izbjegnite blob u listi, client-only ovlasti, path guessing, inline iz upload MIME-a i quota rutu kao drugi download.

## Implementacija i kriteriji

- List/quota/DTO ne dohvaća ili serijalizira content.
- Download provjerava žive ovlasti i oba ID-a.
- Wrong-scope/missing imaju siguran ugovor.
- Uspjeh ima stvarni length, attachment encoding i cache/no-sniff politiku.
- Ime/header ne uvode putanju ili raw content.
- Memory/stream/object tvrdnje odgovaraju kodu.
- Preview/scan, error cache i revoked-link semantika imaju vlasnika.

## Točni izvori

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectFilesService.java` — metadata, parent/child i byte-array.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectFilesController.java` — attachment, encoding, length, cache i errors.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/resources/db/migration/V5__project_files.sql` — bounded BYTEA i dosljednost.
