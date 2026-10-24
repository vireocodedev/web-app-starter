# Nastavljive skupine rada i potvrde stavki

Trajni prihvat skupine rada koristite kada rad obuhvaća više commitova, a prekinuti pozivatelj mora nastaviti istu uređenu namjeru. Identitet skupine posjeduje snimku ulaza; svaka zadržana pozicija stavke posjeduje opaženi ishod; završna potvrda posjeduje konačni uređeni izvještaj. Nijedna od tih činjenica sama ne znači da je svaka stavka ostvarila željeni poslovni učinak.

Ovaj referentni obrazac potječe iz `ServiceOperatorService.admit` i `batch` u Client Discoveryju. To je consumer implementacija, ne instalirani starter queue ni opći paralelni batch engine.

## Jednom prihvatite točnu namjeru

Ulazna točka odbija postojeću transakciju i stvara neovisne transakcijske faze. Prihvat razrješava trenutačno aktivnog privilegiranog aktera, pribavlja vlasničke brave, provjerava podržanu naredbu i stavke u opsegu te fingerprintira kanonsku omotnicu s namespaceom, ID-jem aplikacije i cijelim zahtjevom. To uključuje očekivanu reviziju zahtjeva.

Stari prihvat ponovno je uporabljiv samo ako se fingerprint i akter podudaraju. Isti ID zahtjeva uz promijenjeni sadržaj ili drugog aktera izaziva konflikt. Novi prihvat mora odgovarati trenutačnoj reviziji radnog prostora, sprema kanonski ulaz i potvrdu zahtjeva te povećava reviziju. Budući da se fingerprintira izvorni zahtjev, ponavljanje mora sačuvati i njegovu izvornu očekivanu reviziju; zamjena današnjom revizijom mijenja prihvaćenu namjeru.

Metoda provjerava neke trenutačne preduvjete izvora prije traženja starog prihvata. Replay zato nije neautenticirani bezuvjetni dohvat. Pri prilagodbi očuvajte politiku autorizacije i provjere izvora. [Deduplikacija trajnog primitka](../integrations/durable-ingestion-deduplication.md) razlikuje identitet idempotentnosti od fingerprinta sadržaja.

## Zadržite pozicije i završite na temelju dokaza

Runner čita zadržani ulaz, provjerava postoji li završna potvrda i prolazi ulazom po redoslijedu. Zabilježena pozicija stavke preskače se. Inače se podržana operacija izvodi u vlastitoj fazi, a njezin rezultat potom zadržava na toj poziciji. Ako pozicija već sadrži druge kanonske bajtove, writer odbija promijenjeni ishod.

Neka očekivana stanja postaju izričiti rezultati stavki: opažanje početka može čekati, biti dostupno ili blokirano; usklađivanje vlasnika može čekati, biti blokirano ili potvrđeno. Završna transakcija čita zadržane stavke po indeksu, zahtijeva da njihov broj odgovara broju ulaza i sprema nepromjenjivi završni izvještaj. Dovršen izvještaj smije sadržavati blokirane stavke ili stavke na čekanju.

U slijedu postoji važan razmak: operacija može potvrditi transakciju prije zadržavanja rezultata stavke. Pad procesa tada pri nastavku ponovno ulazi u operaciju. Njezin vlasnik zato treba zadržanu idempotentnost ili dokaz usklađivanja. Potvrda skupine sama ne daje proizvoljnim učincima exactly-once semantiku. [Protokol potvrda između vlasnika](cross-owner-acknowledgments.md) daje zasebnu granicu za jednu podržanu operaciju.

Konceptualni pseudokod, ne starter API:

```text
admission = admitOrRead(actor, requestId, exactFingerprint, frozenInput)
if retainedCompletion(admission): return it
for position, item in admission.inputOrder:
  if retainedItem(admission, position): continue
  result = executeIdempotentOrReconciledItem(item)
  retainExactOutcome(admission, position, result)
require retainedItemCount == admittedItemCount
retainCompletion(orderedRetainedOutcomes)
```

## Pogreške i oporavak

| Situacija                                             | Oporavak                                                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Prihvat je potvrđen, a pozivatelj izgubi odgovor      | Nastavite s istim akterom, ID-jem zahtjeva i nepromijenjenim zahtjevom.                     |
| Proces stane nakon nekoliko potvrda stavki            | Preskočite zadržane pozicije i nastavite nezabilježene.                                     |
| Učinak stavke je potvrđen, ali potvrda nedostaje      | Uskladite trajni dokaz vlasnika stavke prije zadržavanja ishoda.                            |
| Završna potvrda sadrži blokirani rezultat             | Ponovno prikažite taj izvještaj; popravljeni preduvjet rješava nova autorizirana operacija. |
| Ponavljanje mijenja redoslijed ili očekivanu reviziju | Odbijte fingerprint; ne mijenjajte prihvaćeni ulaz.                                         |
| Trenutačne ovlasti aktera su opozvane                 | Zaustavite autoriziranu obradu; stari prihvat nije trajna ovlast.                           |

Izvor obrađuje konačan zadržani popis, ali ne pokazuje podesiv opći proračun broja stavki i vremena ni vlasništvo proizvoljnih paralelnih pozicija. Provjera prije izvršenja i kasnije zadržavanje zasebne su faze. Konkurentni runneri mogu ući u istu stavku; unique constraint potvrde ne može poništiti već dupliciran vanjski učinak. Paralelna prilagodba treba izričite claimove i fencing pozicija, idempotentnost vlasnika i ograničen rad. Pratite [transakcijske naredbe](transactional-commands.md) i [neizvjesne ishode providera](../integrations/uncertain-provider-outcomes.md).

## Scenariji prihvata i antiobrasci

Obuhvatite replay nakon prihvata, nastavak nakon srednje pozicije, prekid nakon commita stavke prije potvrde i replay završetka s miješanim stanjima. Promijenjeni sadržaj, akter i redoslijed moraju izazvati konflikt. Nepotpuni skup zadržanih stavki mora spriječiti završetak. To su željeni scenariji provjere, ne dokaz izvršenih provjera.

Izbjegavajte novi ID pri transportnom ponavljanju, osvježavanje samo očekivane revizije zamrznutog zahtjeva, preuređivanje zadržanog ulaza, tumačenje završetka kao općeg uspjeha i obećavanje sigurnog paralelizma samo iz jedinstvenosti indeksa stavke. Skupina je trajni izvještaj točno prihvaćenog rada i zadržanih ishoda; vlasnik svake stavke i dalje posjeduje poslovni prijelaz.

## Izvor

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceOperatorService.java`
