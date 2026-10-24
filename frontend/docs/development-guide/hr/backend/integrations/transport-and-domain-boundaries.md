# Odvojite dekodiranje transporta od domenskih ovlasti

**Status podrške: potkrijepljen recept za projekt.** FRED odvaja MQTT dekodiranje, opažanje prisutnosti i transakcijsku persistenciju. MQTT, publisher, registar uređaja i observation klase nisu ugrađene ovisnosti predloška. Prenesite granicu, ne peer uređajni model i importe.

Obrazac koristite za webhookove, message consumere, uređaje ili partnerske feedove. Ispravno parsiran envelope potvrđuje samo podržanu sintaksu. Ne dokazuje pouzdan izvor, registriran resurs ni dopuštenu domensku promjenu.

## Svakoj granici dodijelite provjerljivu odgovornost

FRED `DroneMessageIngress` provjerava topic, reference, JSON objekt i podržane payloade. Wire varijante pretvara u telemetry/livestream opažanja i koristi zasebni publisher za odgovore. Store unutar transakcije razrješava odobrene resurse i trenutačnu pripadnost tvrtki.

| Granica               | Vlasništvo                             | Što ne dokazuje                        |
| --------------------- | -------------------------------------- | -------------------------------------- |
| Transportna veza      | Broker/channel autentikacija i dostava | Domensku ovlast samo iz topica         |
| Decoder               | Topic, JSON oblik, tipizirana polja    | Registraciju i poslovnu prihvatljivost |
| Presence registar     | Nedavno opažena topologija             | Trajno vlasništvo iz nepouzdanog ID-a  |
| Domenski servis/store | Resurs, lock, opseg i prijelaz         | Da protokolski odgovor znači commit    |
| Publisher             | Serijalizaciju i slanje odgovora       | Poslovni uspjeh nakon samog slanja     |

Envelope granica izvora Java je string-length provjera 1.048.576 znakova. Nije dokaz transportne granice jednog mebibajta UTF-8. Projekt treba vlastite byte/decoded-size granice na stvarnom HTTP/broker ulazu i nested collection plafone.

## Normalizirajte sintaksu bez izmišljanja značenja

Ingress prihvaća podržane snake/camel alternative, zahtijeva data objekt i provjerava active status kao boolean ili integer 0/1. Više camera stanja agregira tako da neaktivna kamera ne ugasi cijeli resurs dok druga radi. Dvosmislenu povezanost odbija umjesto proizvoljnog djeteta.

To su konkretna protokolska pravila, ne opća pogodnost. Webhook adapter treba razlikovati nedostatak, nevaljanost i nepodržanu vrijednost prije tipiziranog opažanja. Popustljiva pretvorba ne smije nepoznati događaj pretvoriti u valjano domensko stanje.

**Pseudokod recepta:** verifier kanala, bounded decoder, observation tip i domain store granice su projekta. Prije uporabe implementirajte vanjsku autentikaciju, replay politiku, sheme, resource mapping i persistenciju.

```java
public void receive(TransportEnvelope envelope) {
    var trustedChannel = channels.verify(envelope.transportMetadata());
    var message = decoder.readBoundedObject(envelope.bytes());
    var observation = protocol.toObservation(trustedChannel, message);
    observations.recordApproved(observation);
}
```

Za razliku od topic regexa, `channels.verify` predstavlja obvezan authentication dizajn. Nije helper navedenog ingressa ni predloška. Signed webhook adapter provjerava potrebne izvorne bajtove prije normaliziranih tvrdnji; ponovno sastavljen JSON može promijeniti potpisani materijal.

## Razriješite i osvježite zaštićeno stanje

Store mapira serial alias u konfigurirani kanonski resurs, zahtijeva registriran red i pessimistic lock. Nakon stjecanja locka osvježava managed entitet jer je prethodni approval lookup mogao učitati stanje prije čekanja. Zatim traži trenutačnu pripadnost tvrtki prije povezivanja s trajnim zapisima.

Telemetry normalizacija provjerava finite koordinate i raspon. Wire i domain validacija namjerno se preklapaju na različitim trust granicama. Cache hit nije trajna ovlast, a caller company ID ne zamjenjuje spremljenog vlasnika.

Za generički asset feed izričito odaberite kanonski ID i dopušten vanjski izvor. Source/event identitet i event vrijeme držite odvojeno od receipt vremena poslužitelja. Nedostajuću odobrenu mapu odbijte ili izdvojite prema operativnoj politici; automatska registracija zasebna je autorizirana naredba.

## Kvar i oporavak

Nevaljana sintaksa završava prije persistencije. Nepoznat ili opozvan resurs ne stvara placeholder samo da ingestion uspije. Dijagnostika treba biti ograničena, bez cijelih privatnih envelopeova. Transport retry ponavlja ulaz pa sljedeća granica treba trajnu deduplikaciju i poredak, ne pretpostavku jednokratnog decodera.

FRED šalje neke protokolske odgovore prije pohrane. To je opaženi redoslijed, ne dokaz prihvata u bazi. Definirajte znači li acknowledgment primitak, sintaktički prihvat ili trajni commit kako ih operater ne bi zamijenio.

## Kriteriji projekta

- Nepodržan topic, JSON/root oblik i nevaljano stanje ne dolaze do promjene.
- Byte, decoded-size i nested plafoni eksplicitni su; znakovi nisu bajtovi.
- Valjana referenca ne stvara niti preuzima neodobren resurs.
- Aliasi daju isti kanonski zaključani identitet uz potrebno osvježavanje.
- Dvosmislena veza odbija se umjesto odabira mogućeg djeteta.
- Protokolski odgovor ima značenje neovisno o uspjehu persistencije.
- Transport autentikacija, domenske ovlasti i redelivery imaju vlasnike.

## Točni izvori

- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/protocol/DroneMessageIngress.java` — envelope/shape, normalizacija, povezivanje i redoslijed odgovora.
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/persistence/DroneObservationStore.java` — odobrena mapa, lock/refresh, opseg i persistencija.
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/transport/DroneMessagePublisher.java` — zasebna transportna granica.
