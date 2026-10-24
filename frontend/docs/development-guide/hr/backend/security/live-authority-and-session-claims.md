# Provjerite žive ovlasti umjesto zastarjelih session tvrdnji

**Status podrške: ugrađena provjera identiteta uz domenske recepte iz izvora.** Session endpoint predloška ponovno dohvaća aktivan račun. Discovery i FRED idu dalje za svoje domene. Predložak ne učitava automatski sve ovlasti pri svakom zaštićenom zahtjevu niti ima peer tenant/operator model.

Obrazac koristite pri onemogućavanju računa, promjeni članstva, privilegiranim naredbama i dugim sesijama. Autentikacija identificira principal u određenom trenutku; trenutačni domenski zapisi određuju što smije sada.

## Točno navedite ugrađenu granicu

User-details adapter pri prijavi učitava username, hash i enabled te dodjeljuje `USER`. Session endpoint ponovno traži korisnika i odbija nepostojećeg/onemogućenog prije javnog DTO-a. To je živa provjera tog endpointa, ne dokaz trenutačne invalidacije svih sesija nakon promjene baze.

Budući kontroler zaštićen samo s „authenticated” može primiti ranije autentificirani principal. Za učinak disablementa, role promjene i opoziva sljedeće radnje treba eksplicitan current-actor/authority ugovor. Peer admin anotacija ne stvara nedostajući model uloga predloška.

## Odredite koje činjenice moraju biti trenutačne

Discovery dohvaća aktivan račun prije radnji i koristi trenutačni administrator ili članstvo. FRED dohvaća po principal identitetu, odbija zaključan račun i promijenjenu tvrtku/email prema principalu. Company politika provjerava i trenutačnu dopuštenu konfiguraciju.

| Činjenica        | Pitanje vlasništva                           |
| ---------------- | -------------------------------------------- |
| Identitet        | Kako sesija referencira stabilan račun?      |
| Enabled/locked   | Koje radnje ga ponovno čitaju i kada?        |
| Uloga/članstvo   | Koji trenutačni zapis dopušta operaciju?     |
| Tenant/company   | Traži li promjena ponovnu prijavu/vezivanje? |
| Resource binding | Vrijedi li sada za ovog aktera i resurs?     |

FRED metoda ne uspoređuje svako account polje. Nije opća password/role fingerprint provjera; remember servis ima zasebnu politiku. Fresh read pomaže samo kad radnja koristi aktualne ovlasti umjesto cacheiranih tvrdnji.

## Eksplicitno odredite granicu radnje

Slijedi **pseudokod recepta**, ne actor servis predloška. Projekt implementira lookup, članstvo, scoped upite, error mapping i transaction/lock protokol.

```java
@Transactional
public RecordView change(UUID workspaceId, UUID recordId,
                         ChangeRecord command, Authentication authentication) {
    var actor = actors.requireEnabledCurrentAccount(authentication);
    var record = records.lockInWorkspace(workspaceId, recordId);
    authority.requireCurrentMembership(actor, workspaceId, command.action());
    record.applyAllowed(command);
    return views.permitted(record, actor);
}
```

Redoslijed locka/ovlasti pripada domeni. Discovery može zaključati red prije članstva i sakriti resurs s 404. Recept nije univerzalna tvrdnja da autorizacija prethodi svakom locku. Opoziv i promjenu uskladite istim protokolom ako trebaju concurrency-safe opoziv; fresh check mnogo prije pisanja sam nije dovoljan.

FRED dodatno provjerava session controller prema zahtjevu i session operator prema trenutačnom korisniku. Remembered prijava vraća račun, ne operativni binding ili native vanjsku vezu. Ne smije tiho vratiti resurs drugog operatora.

## Kvar i oporavak

Promjena tenanta/tvrtke vodi definiranoj prijavi i binding toku, ne ulasku u novi scope starim principalom. Onemogućenom računu odbijte zaštićen rad sigurnim odgovorom te frontend identitet uskladite kroz auth vlasnika. Membership error ne treba objaviti postoji li skriven resurs.

Stream, queued rad i scheduler trebaju vlastite odluke ovlasti. Autorizacija pri enqueueu ili subscriptionu nije trajno pravo isporuke/izvršavanja. Odaberite zadržani reviewed authorization snapshot ili novu provjeru; ništa nije automatsko zbog prethodne autentikacije.

Izbjegnite role provjeru samo u Reactu, client tenant kao autoritet, display name kao ID i fresh account koji se zatim ignorira. Bez implementirane invalidacije/lock politike ne tvrdite trenutačan globalni opoziv.

## Implementacija i kriteriji

- Svaka radnja ima vlasnika živog računa i resource ovlasti.
- Novoonemogućeni račun ne izvršava sljedeću pokrivenu radnju.
- Promijenjeno članstvo/tenant ne koristi stare tvrdnje za drugi scope.
- Provjeravaju se akter i operativni resource binding.
- Read, command, download i subscription imaju opozivni ugovor.
- Konkurentni opoziv slijedi eksplicitnu transaction/lock politiku.
- Članak razlikuje izvorne provjere i jaču neimplementiranu invalidaciju.

## Točni izvori

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/AuthController.java` — enabled session lookup.
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/java/com/vireocode/backend/auth/SecurityConfiguration.java` — login user details i USER.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/DiscoveryService.java` — actor, role/članstvo i lock.
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/pilot/PilotUserAccess.java` — account/company i operator/controller.
