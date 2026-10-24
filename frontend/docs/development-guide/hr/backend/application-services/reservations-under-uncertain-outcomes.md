# Zadržite rezervaciju dok je vanjski ishod neizvjestan

**Podrška: referentni recept.** Credit owner Client Discoveryja razlikuje rezerviranje kapaciteta, potrošnju u potvrđenom originalu i restoraciju uz kvalificirani dokaz korekcije. Ti API-ji nisu instalirani u starteru. Obrazac služi konačnom pravu na kapacitet koji se ne smije ponovno iskoristiti dok je vanjski sustav možda već djelovao.

## Rezervacija je trajno zadržan claim, ne dovršena potrošnja

`BillingCreditService` računa raspoloživo pravo kao originalni iznos umanjen za primjene, uvećan za restoracije i umanjen za trenutačne rezervacije. Rezervacija bez događaja jest `RESERVED`; kasniji zadržani događaji određuju stanje. Pri rezerviranju ponovno se provjeravaju izvor, pregledani digest tumačenja, prihvatljivost i kompatibilnost cilja. Cilj mora odgovarati dopuštenom vlasniku, drugoj strani, valuti, tretmanu i vrsti ponude.

Postoje dvije provjere kapaciteta. Iznos ne smije prijeći raspoloživo pravo, a zbroj zahtjeva, drugih rezervacija cilja, primijenjenog kredita i raspodijeljenog novca ne smije prijeći iznos cilja. To je zajednička odluka očuvanja kapaciteta, ne UI hint. Ovisi o transakciji i mutexu javne naredbe; sami helperi ne serijaliziraju konkurente. Koristite [očuvanje kroz raspodjele](../data/conservation-across-allocations-and-reversals.md) i [redoslijed lockova](../data/lock-order-and-fresh-transaction-retries.md).

Istek izvora sprječava novu rezervaciju i mijenja prikaz prava u expired uz prikazanu raspoloživost nula. Ne dokazuje da prethodno poslana provider operacija nije uspjela niti automatski oslobađa njezinu rezervaciju. Vrijeme poslovne prihvatljivosti i znanje o vanjskom izvršenju različite su osi.

## Pending i uncertain operacije zadržavaju claim

Oslobađanje traži stanje `RESERVED`, aktualnu politiku, scoped dokaz nepotrošnje i razlog. Pregledava i provider operacije ciljnog projekta u stanjima `QUEUED`, `DISPATCHING` ili `UNCERTAIN`. Ako zadržani ulaz referencira rezervaciju, oslobađanje se odbija. Timeout, istek leasea ili restart workera sami ne vraćaju kapacitet.

Validacija dokumenta odbija duplu referencu rezervacije, pogrešan cilj/valutu/tretman i uporabu u drugoj queued, dispatching ili uncertain operaciji. Pri potvrdi `applyDocument` ponovno provjerava mapiranje i dodaje `APPLIED` za rezervirani iznos, vezan uz potvrđeni original. Izvor ima posebna pravila tretmana: neke korekcije moraju odgovarati stvarnom iznosu retka, a allowance ne smije prijeći redak. Ta komercijalna značenja ne kopirajte u nepovezane domene kapaciteta.

Opće je načelo: nakon mogućeg dispatcha zadržite claim dok autoritativni dokaz ne razlikuje odbijanje i potvrdu. Pogledajte [neizvjesne provider ishode](../integrations/uncertain-provider-outcomes.md) i [claim, call, reconcile](../integrations/claim-call-reconcile.md). Ovaj članak ne tvrdi da postoji automatski provider cancel ili transakcijski opoziv između sustava.

## Restoracija ima zaseban ograničen dokaz

Restoracija nije oslobađanje s drugim nazivom. Odnosi se na već potrošen kapacitet. Izvor zahtijeva pregledano tumačenje restoracije i scoped dokaz. Traženi povrat kapaciteta ne smije prijeći primijenjenu potrošnju umanjenu za ranije restoracije. Mora stati i u zadržane kvalificirane korekcijske retke potvrđenog dokumenta, uz uračunavanje restoracija koje su dokumentu već pripisane.

Generički razlog zato ne stvara kapacitet. I potrošena rezervacija i korekcija koja je poništava ograničavaju iznos. Izvor čuva kompenzacijske događaje umjesto uređivanja originalne primjene. Consumer izričito određuje koji dokaz znači nepotrošnju, a koji poništenje stvarne potrošnje; to su domenske odluke i mogu zahtijevati različite pregledavatelje.

## Neutralan consumer scenarij

Ovaj **pseudokod** zahtijeva consumerovu pohranu prava, scoped ovlasti, zajedničke lockove, trajne operacije i kvalificirane provider/korekcijske dokaze. Navedeni helperi nisu instalirani.

```text
reserve(command):
    requireEligibleNowAndCompatibleTarget()
    requireSourceAndTargetCapacity()
    retainReservation()

release(command):
    requireState(RESERVED)
    requireQualifiedNonConsumptionEvidence()
    requireNoReferencedOperationIn(QUEUED, DISPATCHING, UNCERTAIN)
    appendRelease()

restore(command):
    requireQualifiedReversalOfConfirmedConsumption()
    requireAmountWithinConsumptionAndUnusedCorrection()
    appendRestoration()
```

Sve tri lokalne odluke ostaju u autoritativnom command owneru. Provider I/O i usklađenje imaju zasebne granice. Novi adapteri čuvaju stabilan identitet operacije i vezu dokaza uz točan claim; izgubljeni odgovor nije razlog za novu rezervaciju.

## Pogreška, oporavak i prihvat

Neizvjesna operacija treba dati vidljiv posao usklađenja. Ponovno učitajte operaciju i pribavite autoritativni dokaz kroz njezin postojeći identitet. Potvrđen rezultat troši postojeću rezervaciju, dokazano neizvršenje može dopustiti oslobađanje, a dokazana naknadna korekcija ograničenu restoraciju. Sam protek vremena ne bira nijedan ishod.

Obuhvatite konkurentne rezervacije izvora i cilja, isteklo pravo s postojećim claimom, queued/dispatching/uncertain reference koje blokiraju oslobađanje, drugi dokument koji pokušava ponovnu uporabu, duple reference u dokumentu, restoraciju veću od neto potrošnje i korekciju koju su ranije restoracije iscrpile. Odbijanje mora ostaviti rezervaciju. Opću idempotenciju, trajnu dostavu i leasing workera dokazuju njihovi vlasnici, ne nazivi stanja.

## Izvori

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BillingCreditService.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/CustomerBillingService.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BillingLedgerService.java`
