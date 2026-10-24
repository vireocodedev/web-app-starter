# Poravnajte vremenske nizove po timestampu prije resamplinga

**Podrška: referentni recept.** FRED daje konkretan primjer vremenske integracije i korisna ograničenja koja treba popraviti pri prilagodbi. Provider adapter, DTO-i i resampling helperi nisu instalirani starter API-ji. Obrazac služi izvorima paralelnih vektora koji spajaju povijesna i novija opažanja ili proizvode pravilno razmaknut izvoz.

## Pozicija nije identitet vremena

`OpenMeteoService.mergeHourlyData` u navedenoj reviziji konkatenira svaki povijesni i forecast vektor. `mergeResponses` uzima vremensku zonu, UTC offset, elevaciju i jedinice iz forecast odgovora. Ne dokazuje podudaranje povijesnih jedinica i zone, ne deduplicira preklapanja, ne sortira opažanja niti provjerava duljinu svih vektora. Zahtjevi s nepoklapajućim datumima korisni su, ali nisu validacija stvarnog odgovora providera.

Consumer prvo normalizira payload u retke s timestamp ključem. Provjerite da svaki obavezni vektor ima zadanu duljinu, odlučite odbijate li nedostajuće vrijednosti ili ih čuvate kao missing te dodajte jedinicu i izvor. Duple timestampove riješite izričitom politikom: primjerice odbijanje konflikta ili prednost imenovanom izvoru uz zadržano podrijetlo. Ne režite nejednake vektore na najkraći bez prijave izgubljene pokrivenosti.

## Nazovite stvarnu resampling operaciju

Unatoč imenu, `interpolateToTimestep` provodi carry-forward, ne linearnu interpolaciju. Parsira prvi i zadnji lokalni timestamp, zadnji produžuje jedan sat, računa broj izlaza i koristi protekle cijele sate kao indeks niza. Pretpostavlja neprekinute satne pozicije. Nedostajući sat ili dupli timestamp mogu razdvojiti poziciju i stvarno vrijeme opažanja. `getValueOrNull` za null/kratak vektor vraća null, ali to ne popravlja poravnanje.

Zasebni `adjustValuesToFitExactDateRange` za svaku izlaznu točku traži lokalni sat koji je sadrži, inače emitira null. Za usporedbu pretvara `ZonedDateTime` u `LocalDateTime`, a izlaz zapisuje bez zone. Kod različitih zona ili DST dvosmislenosti gubi informaciju potrebnu za identifikaciju instanta. Inclusive count jest floor(duration/step)+1 uz dodatni not-after-end uvjet; endpoint izvan step mreže ne mora biti emitiran. Sam helper ne ponavlja provjeru pozitivnog koraka.

Carry-forward vrijedi samo ako ga značenje mjere dopušta. Ponavljanje akumulirane veličine poput satne oborine u više manjih intervala ne čuva ukupnu količinu kada se intervali zbroje. Temperatura, stopa, intervalni zbroj i kružni smjer mogu trebati različita pravila. Ni linearna interpolacija nije automatski ispravna.

## Consumer prilagodba

Ovaj **pseudokod** zahtijeva provider decoder, resolver vremena/zone, normalizaciju jedinica, politike missingness/overlapa i ograničen resampler. Ništa od toga nije instalirano.

```text
requirePositiveStepAndOrderedRange(request)
requireOutputCountWithinBudget(range, step, endpointPolicy)
rows = decodeEqualLengthVectors(response)
rows = resolveTimesAndNormalizeUnits(rows, declaredZone, unitPolicy)
timeline = mergeByTimestamp(rows, overlapPolicy)
return resample(timeline, grid, perMeasureRule, gapPolicy)
```

Odredite je li mreža temeljena na instantima ili lokalnom kalendaru i zadržite zonu potrebnu za reprodukciju. Prije materijalizacije ograničite ulazne/izlazne retke, vremenski raspon i rad. Linearno skeniranje izvora za svaku izlaznu točku može biti skupo i uz pozitivan korak. Pogledajte [kalendarske vrijednosti i instante](../time/canonical-calendar-values-and-instants.md) te [budžete čitanja i nepoznatu pokrivenost](../queries/read-budgets-and-unknown-coverage.md).

FRED daily CSV controller indeksira sve vektore po `dates.size()` bez cjelovite provjere duljina. Normalizirajte i validirajte prije izvoza umjesto oslanjanja na index exception. Jedinice unesite u izričitu shemu i koristite pravi ograničeni CSV writer; pogledajte [ograničeni CSV ugovor](../files/bounded-csv-interchange-contracts.md). Minimalni datum, granica od sedam budućih dana i tromjesečna granica odabira API-ja snapshot su aplikacijskih odluka, ne provjerena aktualna obećanja providera.

## Pogreška, oporavak i prihvat

Odbijte nespojive jedinice ili dvosmislena vremena ako ne postoji deklarirana pretvorba. Vratite izričitu missing pokrivenost umjesto izmišljanja nule ili prijenosa vrijednosti preko neograničene praznine. Sačuvajte podrijetlo da obnovljeni izvoz može objasniti promjenu nakon korekcije providera.

Obuhvatite jednaka/konfliktna preklapanja, kratke vektore, nesortiran ulaz, nedostajući sat, DST ponavljanje/preskok, različite jedinice, nulti/negativni korak, prevelik izlaz i endpoint izvan mreže. Za intervalni zbroj dokažite očuvanje količine odabranim pravilom. Za carry-forward dokažite dopuštenu prazninu i odsutnost tvrdnje da je izlaz linearna interpolacija.

## Izvori

- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/app/openmeteo/OpenMeteoService.java`
- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/app/export/ExportController.java`
