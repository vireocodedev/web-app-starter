# Provedite opseg resursa kroz ovlasti, upite i ključeve

**Status podrške: referentni recept potkrijepljen izvorom.** Client Discovery i FRED pokazuju žive ovlasti i vezivanje resursa; Discovery migracije složenim stranim ključevima čuvaju projektni opseg. Predložak ima račun i sesiju, ali nema ugrađen tenant, članstvo, scoped repozitorij ili domenski composite-key modul.

Koristite obrazac kad URL sadrži ID vlasnika i djeteta, zahtjev povezuje resurse ili autentificirana sesija može nadživjeti promjenu ovlasti. Postojanje nije ovlast, a valjan strani ključ prema pogrešnom opsegu i dalje je sigurnosna greška.

## Trenutačne ovlasti razriješite odvojeno od identiteta sesije

Discovery session username provjerava u trenutačnom user repozitoriju i zahtijeva aktivan račun prije domenske radnje. Resource lookup provjerava članstvo ili izričitu administrator politiku te neovlašten projekt skriva s 404. Pri locking lookupu može zaključati projekt prije provjere članstva. Pri objašnjavanju sačuvajte stvarni redoslijed izvora; njegova potpuna provjera članstva ne prethodi nužno svakom locku.

FRED `PilotUserAccess` ponovno dohvaća korisnika po principal identitetu sesije. Odbija zaključan račun te razliku trenutačnog company/emaila i principala. Zasebno traži konfiguriranu dopuštenu tvrtku i veže traženi controller uz session controller i trenutačni operator atribut. Sam session identitet ne može odabrati proizvoljnu tvrtku ili obnoviti staro operativno vezivanje.

To su različiti modeli ovlasti. Prenesite dizajnerska pitanja, ne role nazive, prilagođene principal klase ili uređajne pretpostavke. Projekt mora definirati vlastiti live actor loader, workspace članstvo/uloge, opoziv i error ugovor. Enabled-user provjera session endpointa predloška ne ugrađuje ta pravila automatski na svaki novi endpoint.

## Ograničite svaki child lookup i povezivanje

Za hipotetski `/workspaces/{workspaceId}/assets/{assetId}` oba identifikatora ograničavaju dohvat. Nakon autorizacije workspacea dohvatite asset po `(workspaceId, assetId)`, ne samo po `assetId`. Isto vrijedi za download, revizije, export, audit povijest i ugniježđene veze. UI koji izostavi link predstavlja prikaz, ne backend autorizaciju.

**Pseudokod recepta:** `actors`, `memberships`, `assets` i `views` granice su projekta. Prije prilagodbe implementirajte žive ovlasti, scoped SQL/repository metode, DTO-e i odabrani odgovor za skriven resurs.

```java
public AssetView read(UUID workspaceId, UUID assetId, Authentication auth) {
    var actor = actors.requireCurrent(auth);
    memberships.requireVisible(workspaceId, actor);
    var asset = assets.findByWorkspaceAndId(workspaceId, assetId)
        .orElseThrow(ResourceNotFound::new);
    return views.permittedAsset(asset, actor);
}
```

Recept provjerava članstvo prije child upita; ne tvrdi da ponavlja Discovery locking redoslijed. Za promjene uskladite opoziv ovlasti i zaštićeno stanje resursa odabranim transaction/lock protokolom. Provjera članstva obavljena mnogo prije promjene inače može izgubiti utrku s opozivom.

| Unos pozivatelja         | Odluka poslužitelja                                |
| ------------------------ | -------------------------------------------------- |
| Workspace ID putanje     | Smije li trenutačni akter djelovati ondje          |
| Asset ili version ID     | Pripada li istom dopuštenom opsegu                 |
| ID ciljnog zapisa        | Je li povezivanje ovlašteno i strukturno dosljedno |
| Company/role iz klijenta | Nikad nije dokaz ovlasti                           |

## U bazi kodirajte dosljednost opsega

Discovery shema verzija specifikacije i razvoja koristi `UNIQUE(id, project_id)` te strane ključeve s referencom i project ID-om. Tako red ne može tvrditi da je u projektu A, a povezati verziju ili ovlast projekta B. Aplikacijska validacija može dati jasniju poruku, dok baza štiti od nevaljane veze kroz konkurentne i alternativne zapisivače.

Slijedi **fragment recepta sheme**, ne ugrađena migracija. Pretpostavlja zasebno definirane workspace, record i note tablice te pregledano pravilo brisanja. Projekt dodaje stvarnu sljedeću Flyway migraciju i usklađuje entitete i upite.

```sql
ALTER TABLE workspace_record
    ADD CONSTRAINT record_id_workspace UNIQUE (id, workspace_id);

ALTER TABLE record_note
    ADD CONSTRAINT note_record_scope
    FOREIGN KEY (record_id, workspace_id)
    REFERENCES workspace_record (id, workspace_id);
```

Globalno jedinstven ID ne čini drugi scope stupac suvišnim: složena veza dokazuje slaganje deklariranog roditeljskog opsega i referenciranog zapisa. Obrnuto, taj foreign key dokazuje samo strukturu. Ne autorizira pozivatelja, ne skriva retke, ne ograničava polja ni countove i search facete liste.

## Kvar i oporavak

Ako korisnik pošalje valjan asset ID drugog workspacea, dosljedno vratite odabrani hidden/not-found ili forbidden ugovor; pogreška ne treba objaviti naziv ili vlasništvo. Ako račun promijeni tvrtku, tražite predviđenu ponovnu autentikaciju/vezivanje umjesto tihog premještanja aktivne operativne sesije u novu tvrtku.

Kad složeni ključ odbije vezu, poništite naredbu i prevedite samo poznat siguran konflikt. Nemojte ponoviti s pravim workspaceom referenciranog objekta ili automatski „popraviti” scope zahtjeva. Time bi neuspjela zaštita postala neovlašteno prevezivanje. Pregledajte import i administrativne alate koji zaobilaze uobičajeni servis jer integritet baze sam nije potpuna politika ovlasti.

## Kriteriji za buduću implementaciju

- Onemogućen, opozvan ili tenant-promijenjen račun gubi potrebnu ovlast sljedeće zaštićene radnje.
- Child ID drugog workspacea ne može se pročitati, preuzeti, mijenjati ili povezati kroz dopuštenu putanju.
- Skrivanje je dosljedno i ne otkriva privatni opseg kroz pogreške ili metapodatke.
- Složeni ključevi odbijaju cross-scope veze i kroz drugog zapisivača.
- Redci, ukupni brojevi, facete i povijest koriste isti model vidljivosti.
- Operativna session veza provjerava trenutačnog aktera i resurs, umjesto obnove ovlasti iz zapamćenog identiteta.

## Točni izvori

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/DiscoveryService.java` — aktivni akter, skrivanje članstva i locking redoslijed.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ProjectFilesService.java` — privatni sadržaj ograničen projektom.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/resources/db/migration/V10__specification_development.sql` — složeni project-scoped strani ključevi.
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/pilot/PilotUserAccess.java` — živi račun/tvrtka i session operator/controller provjere.
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/session/LivestreamSessionService.java` — slaganje resursa, tvrtke, controllera i vlasnika.
