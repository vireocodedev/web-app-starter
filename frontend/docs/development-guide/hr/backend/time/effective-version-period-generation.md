# Važeće verzije i nastavak stvaranja perioda

Važeće verzije koristite kada prihvaćena konfiguracija može mijenjati buduće periode, a već zadržani periodi moraju sačuvati izvorno značenje. Odabir najnovijeg retka nije dovoljan: relevantna je prihvaćena verzija primjenjiva na određeni indeks perioda. Generiranje zatim materijalizira ograničene dokaze tog odabira umjesto ponovnog računanja povijesti iz današnjih postavki.

Ovo je referentni obrazac iz Client Discoveryja, a ne instalirani API za raspoređivanje. Promatrane ugovore daju `ServiceAgreementService.effective` i `ServicePeriodService.generate`. Njihov kalendar, preduvjeti i brojčana ograničenja pripadaju tom consumeru; nove aplikacije trebaju definirati odgovarajuće inačice.

## Odaberite primjenjivu prihvaćenu verziju

`effective` ograničava upit na aplikaciju i redak, prima indekse od 0 do 9999, zahtijeva prihvaćeni prijelaz i razmatra samo verzije čiji je početni indeks najviše jednak traženom indeksu. Silazni redoslijed po početnom indeksu, zatim verziji, bira najodređeniju primjenjivu prihvaćenu verziju. Kasniji nacrt ne može tiho zamijeniti prihvaćene uvjete.

Odabrani redak provjerava se, kao i njegov zadržani paket prema verziji, digestu, kanonskim uvjetima i referencama artefakata. Primjenjiv redak bez pouzdanog pratećeg dokaza nije dopuštenje za korištenje trenutačnog nacrta iz editora. Tu granicu obrađuju [digesti i pregledane verzije artefakata](../data/digests-and-reviewed-artifact-versions.md).

Zadržani period bilježi identitet, indeks, verziju, digest paketa, lokalne datume, zonu, početni i završni instant te reference potvrda preduvjeta. Ta polja govore koji su uvjeti i granice kalendara korišteni. Promjena trenutačne konfiguracije ne smije prepisati taj odgovor. Ispravak traži izričitu poslovnu operaciju i dokaz s poznatim podrijetlom.

## Nastavite od prvog nedostajućeg uzastopnog indeksa

Izvor opaža prihvatljiv dokaz početka i pokušava aktivaciju. Redak bez aktivacije preskače se. Postojeći indeksi perioda pregledavaju se od nule radi pronalaska prve praznine. Generator ne nastavlja od `max(index) + 1`, jer bi time sakrio rupe.

Za svaki odabrani redak po pozivu ponovno razmatra i do 100 ranijih potvrda perioda bez dokaza obračuna kako bi zasebno nadoknadio rad vezan uz završene periode. Za nove periode bira važeću verziju za svaki indeks, dobiva kalendarski interval iz početka aktivacije i primjenjivih uvjeta, provjerava preduvjete početka i obavijesti, ponovno koristi identitet perioda te zadržava potvrdu prije izvođenja povezanog dokaza obračuna.

Pregledana granica umetanja je najviše 100 novoumetnutih potvrda za svaki odabrani redak po pozivu. Dodatni horizont lokalnog datuma računa se iz početnih uvjeta za indeks nula, evaluiranih na sljedećem indeksu, plus 366 dana; indeks je manji od 10000. Predani horizont ne može prijeći trenutačni UTC datum plus jedan dan; intervali čiji je početni instant još u budućnosti ne stvaraju se. Poziv s više redaka ukupno može prijeći 100 čitanja za nadoknadu i 100 umetanja, a upit postojećih indeksa nema izričitu granicu broja redaka. Izvor ne dokazuje proračun čitanja, vremena ili rada za cijeli poziv; dodajte ga gdje je potreban. To nije opća dozvola za raspoređivanje godine budućeg rada. Sat i semantika lokalnog kalendara moraju ostati izričiti.

Konceptualni pseudokod prilagodbe, ne starter metoda:

```text
next = firstMissingContiguousIndex(retainedPeriods)
for index from next within workBudget:
  version = requireApplicableAcceptedVersion(scope, line, index)
  interval = calendar(version, activationStart, index)
  if interval is beyond the requested or observed horizon: stop
  require prerequisites for this exact version and interval
  retainOrReadPeriod(identity(scope, line, index), version, interval)
recordProgress(nextUnprocessedIndex, requestedHorizon, pending)
```

Pozivatelj i dalje posjeduje granice transakcije, jedinstvenost u opsegu i serijalizaciju konkurentnih generatora. Oznaka napretka korisna je za nastavak, ali ne zamjenjuje provjeru zadržanih potvrda. Pogledajte [transakcijske naredbe](../application-services/transactional-commands.md) i [ograničeni raspoređeni rad](../integrations/bounded-scheduled-work.md).

## Pogreške i oporavak

| Stanje                                       | Ishod i sljedeći korak                                                      |
| -------------------------------------------- | --------------------------------------------------------------------------- |
| Kasnija verzija nije prihvaćena              | Nastavite birati primjenjivu prihvaćenu verziju.                            |
| Dokaz aktivacije nije dostupan               | Ostavite redak neaktivnim; ne izmišljajte vrijeme početka.                  |
| Indeks 2 nedostaje, a indeks 3 postoji       | Nastavite od 2 i ponovno koristite postojeće identitete kad do njih dođete. |
| Nedostaje preduvjet odabrane verzije         | Blokirajte rad; popravite dokaz umjesto posuđivanja potvrde druge verzije.  |
| Prolaz dosegne radnu ili datumsku granicu    | Zadržite napredak i nastavite s istim identitetima perioda.                 |
| Period postoji, ali izvedeni dokaz nedostaje | Uskladite nedostajuću fazu; ne stvarajte drugi identitet perioda.           |

Izvor hvata neke očekivane konflikte aktivacije i nastavlja bez aktivacije; druge pogreške propagira. Nemojte svaku pogrešku svesti na „nema što generirati”. Razlikujte čekanje, blokadu, iscrpljeni proračun i neuspjeh rada.

## Scenariji prihvata i antiobrasci

Zahtijevajte da izmjena važeća od indeksa 4 utječe na 4 i dalje, dok indeks 3 zadržava izvornu verziju. Obuhvatite neprihvaćene izmjene, nedostajući srednji indeks, prekinuti prolaz, nadoknadu završetka perioda i intervale oko kalendarskih granica konfigurirane zone. Provjerite da se potvrda budućeg početka ne stvara samo zato što je datumski horizont dopušta. To su scenariji prihvata prilagodbe, a ne dokaz izvršenja.

Izbjegavajte odabir samo po vremenu stvaranja, ponovno računanje zadržanih perioda iz promjenjivih postavki, UTC ponoć za svaku lokalnu granicu i zaključak da uspješan ograničeni prolaz dokazuje dovršetak cijelog horizonta. Trajna jedinica je potvrda perioda u opsegu; petlja i oznaka napretka mehanizmi su za njezin nastavak.

## Izvori

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceAgreementService.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServicePeriodService.java`
