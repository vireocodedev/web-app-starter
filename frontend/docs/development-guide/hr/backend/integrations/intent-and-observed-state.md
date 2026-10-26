# Trajnu namjeru odvojite od opaženog vanjskog stanja

**Status podrške: potkrijepljen recept za projekt.** FRED prije vanjske aktivnosti priprema trajnu sesiju i napreduje je prihvaćenim opažanjima. Predložak nema session registar, uređajni transport ni external-control feature. Projekt daje vlastiti operation model, ovlasti i adapter dokaza.

Obrazac koristite za remote provisioning, import/export ili uređajne operacije gdje prihvat zahtjeva nije opažen uspjeh. Lokalni commit potvrđuje zapisanu namjeru, ne izvršenje rada u drugom sustavu.

## Traženim i opaženim činjenicama dajte zasebne vlasnike

FRED preparation servis razrješava registriran resurs, area/company i operator vezu te stvara PREPARED sesiju s request ID-om, vlasnikom, resource/controller identitetom, media identitetom, request vremenom, rokom i baseline opažanjem. Ponovljeni ID razrješava postojeću operaciju uz provjeru vlasnika/resursa umjesto nove namjere.

Store odvojeno prihvaća svjež dokaz resursa. Odgovarajuće active opažanje mijenja PREPARED u ACTIVE i stvara stream s media identitetom sesije. Kasnije inactive opažanje može završiti aktivnu sesiju. Command servis ne postavlja ACTIVE samo zato što je preparation uspješno vratio rezultat.

| Činjenica                      | Vlasnik                    | Sigurna UI tvrdnja                  |
| ------------------------------ | -------------------------- | ----------------------------------- |
| Zahtjev prihvaćen i zadržan    | Aplikacijska naredba       | Priprema/zahtjev postoji            |
| Vanjski poziv vratio rezultat  | Adapter transporta         | Ishod prema njegovu ugovoru         |
| Svjež prihvaćen active dokaz   | Observation politika       | Aktivnost je opažena                |
| Svjež prihvaćen inactive dokaz | Observation politika       | Aktivnost završena prema pravilima  |
| Nema novog dokaza              | Coverage/recovery politika | Nepoznato ili ranije opaženo stanje |

Završetak loading animacije gumba nije dodatni izvor dokaza. Zatraženo i zadnje opaženo stanje prikažite pošteno umjesto zaključivanja iz HTTP 2xx.

## Dokaz povežite s pravom operacijom

Store zahtijeva slaganje sesije, resursa i tvrtke te točan controller. Event vrijeme uspoređuje s ograničenom clock razlikom zahtjeva, baseline watermarkom i zadnjim prihvaćenim opažanjem. Peer protokol može poslati prazan video identitet; tada vrijedi jedina otvorena sesija i točan controller, ne izmišljena timestamp mapa. Stream zadržava odabrani media key sesije.

Ne tvrdite da izvor svako opažanje uspoređuje s nepraznim vanjskim media ID-om; pravilo povezivanja specifično je protokolu. Novi provider s autentificiranim operation correlation ID-om treba definirati i provjeriti jaču vezu umjesto njezina gubitka u normalizaciji.

**Pseudokod recepta:** operation repozitorij, verifier i transition politiku implementira projekt, zajedno s event autentikacijom, scope mapom, monotonom pozicijom/vremenom, DTO-ima i transakcijama.

```java
@Transactional
public void observe(ExternalObservation input) {
    var evidence = verifier.requireTrusted(input);
    var operation = operations.lockByCorrelation(evidence.correlation());
    evidence.requireSameResourceAndOwner(operation);
    ordering.requireAcceptedPosition(operation, evidence);
    transitions.applyObservedFact(operation, evidence);
}
```

Recept ne tvrdi da svi peer protokoli imaju correlation polje. Dvosmislenost odbijte ili izdvojite prema domeni; pogađanje najnovije operacije može stari event pripisati novom zahtjevu.

## Stopped snapshot ne troši pripremu

Tijekom konfiguriranja starta može doći periodični inactive snapshot. U izvoru on tijekom PREPARED osvježava zapamćeni dokaz resursa, ali ne postavlja sesiju na ENDED. Inače bi normalan pre-start snapshot uništio namjeru prije active opažanja.

Vrijedi i obrnuto: cacheirani active stare aktivnosti ne stvara uspjeh nove sesije. Baseline, request-time i strogo noviji dokazi razlikuju staru stvarnost i novu operaciju. Clock-lag dopuštenje peer je politika, ne prihvat proizvoljno starih događaja.

Za generički export analogija je REQUESTED i autoritativni artifact-ready receipt. „Artefakt još ne postoji” nije otkazivanje, a stari artefakt iste putanje nije dokaz novog exporta. Prema domeni zadržite operation identitet i točnu artifact/version vezu.

## Kvar i oporavak

Ako preparation commita, a vanjski poziv zakaže ili izgubi odgovor, sačuvajte namjeru i nerazriješenost. Koristite ograničenu reconciliation/read putanju ili pregledani oporavak. Brisanje i novi ID mogu duplicirati remote rad ili izgubiti dokaz izvornog ishoda.

Pogrešan controller/company ili star dokaz ne mijenja operaciju. Dijagnostika ostaje sigurna, a konflikt se zadržava kad politika traži. Nedostatak dokaza nije dokaz neaktivnosti; to traži eksplicitan lease/freshness protokol.

Izbjegnite jedan boolean `started`, observed stanje iz client tvrdnje, ovlasti iz ulaznog resource ID-a ili complete pri slanju. Sve spaja različite činjenice i otežava oporavak.

## Kriteriji projekta

- Priprema stvara trajnu namjeru bez tvrdnje aktivnosti.
- Ponovljeni ID daje samo istu autoriziranu operaciju ili konflikt.
- Pogrešan vlasnik/resurs/controller i star dokaz ne napreduju stanje.
- Pre-start inactive čuva pripremu, a stari active je ne aktivira.
- Prihvaćen active/inactive slijed daje samo dokumentirane prijelaze.
- Izgubljen odgovor čuva identitet i dokaz za usklađivanje.
- UI razlikuje zatražene, opažene i nepoznate činjenice.

## Točni izvori

- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/session/LivestreamSessionService.java` — priprema, request reuse, ovlasti i zadržani media identitet.
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/persistence/DroneObservationStore.java` — povezivanje dokaza, watermark i PREPARED/ACTIVE/ENDED.
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/mqtt/protocol/DroneMessageIngress.java` — normalizacija active i dvosmislenost.
