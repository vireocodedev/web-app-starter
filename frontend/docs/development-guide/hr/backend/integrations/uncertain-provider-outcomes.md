# Modelirajte neizvjesnost providera i zatvorite nepostavljenu putanju

**Status podrške: potkrijepljen recept za projekt.** Client Discovery definira privatna provider sučelja s eksplicitnim capabilities i outcome tipovima. Uključeni notification/document adapteri nisu konfigurirani i ne tvrde uspješnu vanjsku isporuku. Predložak nema provider, pristupne podatke ili domenski API tih primjera.

Obrazac koristite za email, izdavanje dokumenta, provisioning ili zahtjev čiji odgovor može nestati nakon remote učinka. Transportna iznimka i autoritativno odbijanje različite su činjenice koje stanje i retry moraju sačuvati.

## Konfiguraciju i razinu dokaza učinite eksplicitnima

Document provider oglašava configured, source key, contract version, idempotent-submit i authoritative-lookup. Request servis odbija nekonfiguriran adapter i onaj bez obje sigurnosne mogućnosti: barem jedna je potrebna, ne nužno obje. Identitet i verzija moraju odgovarati pregledanoj proceduri.

Minimalni gate ne daje svaki oporavak. Dispatcher za kasnije usklađivanje traži authoritative lookup. Projekt određuje što radi kad adapter može idempotentno slati, ali ne utvrditi remote ishod. Jedna capability zastavica ne daje automatski siguran retry.

| Ishod                | Značenje dokaza                         | Ponašanje                                          |
| -------------------- | --------------------------------------- | -------------------------------------------------- |
| Unconfigured         | Nema odabranog operativnog adaptera     | Blokirati ili ponuditi pregledani manual put       |
| Confirmed/Observed   | Normaliziran source dokaz prema ugovoru | Provjeriti identitet, payload, stage i ovlast      |
| DefinitivelyRejected | Autoritativno negativan ishod s dokazom | Primijeniti ugovorenu failure/release politiku     |
| Unknown/Uncertain    | Učinak je možda nastao                  | Čuvati namjeru i uskladiti, bez izmišljanja ishoda |

Notification `Observed` nosi source/message/destination digest i stage. Opažena faza nije automatski konačna isporuka. U pregledanom notice reconcileru neposredni non-unconfigured rezultati ostaju uncertain umjesto automatskog delivered receipta; zasebna kvalifikacija dokaza posjeduje tu odluku.

## Koristite tipiziranu granicu adaptera

Slijedi **tip recepta**, ne točno peer sučelje ni API predloška. Implementirajte transport autentikaciju, normalizaciju, capabilities, trajnu operaciju/dokaze i sigurno mapiranje pogreške.

```java
sealed interface SubmissionResult permits Confirmed, Rejected, Uncertain {}
record Confirmed(String sourceObjectId, String sourceEventId)
    implements SubmissionResult {}
record Rejected(String reasonCode, SourceProof proof)
    implements SubmissionResult {}
record Uncertain(String reasonCode) implements SubmissionResult {}
```

`SourceProof` je dodatni tip projekta s ograničenim i autoriziranim sadržajem. Sučelje sprječava boolean da izbriše neizvjesnost, ali samo ne autentificira rezultat. Adapter posjeduje vanjsku autentikaciju/dekodiranje, a servis domensko stanje i prihvat dokaza.

Document normalizacija traži zadržani proof za definitive rejection i uspoređuje original/artefakte s nepromjenjivim zahtjevom. Ograničene rezultate zamrzava/kopira prije pohrane. HTTP 200 s tuđim objektom ili nevaljanim artefaktima ne daje pravo napredovanja stanja.

## Nekonfiguriranu putanju zadržite poštenom

Default notification implementacija vraća `Unconfigured` iz submit/lookup bez mreže, tajni i provider tvrdnje. Default document nema configured capabilities i vraća unknown/not-configured; trusted-event putanja odbija proizvoljne tvrdnje.

To je valjano razvojno/runtime stanje. UI može prikazati nedostupnost ili manual verification bez pretvaranja da je poruka poslana ili službeni artefakt izdan. Demo fixture ne zamjenjuje real adapter putanju. Novi adapter traži eksplicitne ovisnosti, secret/setup, ovlasti, operativni rad i provjeru projekta.

Default authenticated-envelope hook odbija s 403. To ne dokazuje ugrađen javni webhook. Buduća ruta autentificira potrebne transportne bajtove i povezuje operaciju prema ugovoru; naziv polja `sourceEventId` ne čini ulaz pouzdanim.

## Kvar i oporavak

Timeout nakon slanja ostaje neizvjestan jer je remote učinak možda završen. Sačuvajte izvorni operation ID i immutable payload digest. Lookup koristi isto značenje umjesto novog ključa ili promijenjenog payloada.

Definitivno odbijanje može dopustiti novu pregledanu verziju/operaciju prema domeni. Uncertain ne oslobađa rezervacije samo zato što caller želi ponoviti. Kasnija autoritativna potvrda može stići; zadržite dokaz i riješite konflikt namjerno umjesto prepisivanja prvog rezultata.

Javni reason kodovi trebaju biti stabilni i sigurni. Raw transport poruka, provider body, credential header i privatna adresa nisu opći UI error. Zaštićena dijagnostika razlikuje konfiguraciju, autentikaciju, contract mismatch i nejasan transport.

## Kriteriji projekta

- Unconfigured ne tvrdi mrežni uspjeh niti završava stanje.
- Capability/source-contract mismatch blokira nesigurno slanje/usklađivanje.
- Timeout i gubitak veze daju uncertainty, ne izmišljeno odbijanje.
- Confirmed odgovara resursu/zahtjevu, fazi, payloadu i dokazima.
- Definitive rejection ima ugovoreni source proof.
- Retry/reconciliation čuva operation identitet i značenje.
- Trusted-event ulaz zasebno je autentificiran i povezan; sučelje ne implicira webhook.

## Točni izvori

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BillingDocumentProvider.java` — capabilities, ishodi i rejecting default.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/UnconfiguredBillingDocumentProvider.java` — bez vanjskog uspjeha.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/NotificationDeliveryProvider.java` — ishodi i no-network default.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BillingDocumentService.java` — capability/contract gate.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BillingProviderOperations.java` — ograničen dokaz, lookup i neizvjesnost.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceNoticeService.java` — konzervativan ishod i kvalifikacija receipta.
