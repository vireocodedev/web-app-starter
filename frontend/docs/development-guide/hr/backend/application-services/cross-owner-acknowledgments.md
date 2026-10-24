# Potvrde prihvata između vlasnika

Zadržanu potvrdu prihvata koristite kada jedan vlasnik potvrdi izvornu činjenicu, a drugi mora neovisno prihvatiti njezinu posljedicu. Primjerice, dovršen radni zadatak može postati prihvatljiv za zapis potrošnje resursa. Proizvođač ne smije označiti posljedicu dovršenom samo zato što je pozvao primatelja, a primatelj ne smije vjerovati promjenjivom prikazu proizvođača kao svom izvoru.

Ovo je referentni obrazac iz `ServiceOperatorService.reconcile` i `ApplicationServiceBillingOwner` u Client Discoveryju. Ti consumer servisi nisu instalirani starter API-ji. Predaja u izvoru je poziv servisa u istom procesu preko transakcijskih granica, a ne dokaz postojanja message brokera ili univerzalnog exactly-once protokola.

## Razlikujte tri commita

Vlasnik perioda kod proizvođača zadržava nepromjenjivi dokaz obračuna i redak outboxa na čekanju. To je trajna namjera prelaska vlasničke granice. Metoda usklađivanja provjerava ID i digest dokaza u opsegu, zaključava outbox te ga preuzima nasumičnim vlasnikom leasea i rokom. Za nezavršeni lease vraća se čekanje umjesto novog poziva primatelju.

Primatelj se poziva nakon commita te transakcije proizvođača. `acceptServiceCharge` izričito odbija već aktivnu transakciju i pokreće vlastitu `REQUIRES_NEW` transakciju. Čita potvrđeni izvor, zahtijeva očekivani digest, provjerava činjenice svojeg vlasnika i pribavlja vlastite uređene brave. U fazi obračuna ne zaključava servisne retke.

U svojoj transakciji primatelj čita postojeću potvrdu za taj izvor i odbija nepodudarni digest. Inače zajedno stvara vlastitu posljedicu i potvrdu prihvata. Potvrda zadržava identitet i digest izvora te identitete rezultata i prihvaćene vrijednosti. Sadržaj se provjerava helperima zadržanih činjenica.

Proizvođač zatim otvara novu transakciju, čita zadržanu primateljevu potvrdu, zahtijeva njezinu kanonsku jednakost vraćenoj potvrdi i označava outbox potvrđenim. Sama povratna vrijednost bez zadržanog dokaza primatelja ne može dovršiti most.

Lokalnu atomarnost obrađuju [transakcijske naredbe](transactional-commands.md), a točno vezanje izvora [digesti i pregledane verzije artefakata](../data/digests-and-reviewed-artifact-versions.md).

## Neutralna predaja

Konceptualni pseudokod protokola; nazivi nisu starter metode:

```text
producer transaction:
  verify immutable source and expected digest
  claim pending bridge row
receiver call outside producer transaction:
  receiver transaction:
    verify source and receiver-owned prerequisites
    read matching acknowledgment or create consequence + acknowledgment
producer transaction:
  compare returned acknowledgment with retained receiver evidence
  mark bridge acknowledged
```

Ključ izvora mora uključivati vlasnički opseg. Zahtjev ne može pod istim ključem podmetnuti drugi digest. Primatelj posjeduje jedinstvenost posljedice; lease samo smanjuje preklapanje pokušaja. Ni stabilni ID zahtjeva ni lease ne zamjenjuju zadržani dokaz idempotentnosti primatelja. Širu granicu ponavljanja obrađuje [deduplikacija trajnog primitka](../integrations/durable-ingestion-deduplication.md).

## Pogreške i oporavak

| Prekid                                                                        | Trajno značenje i oporavak                                                                          |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Preuzimanje proizvođača nije dostupno                                         | Vratite čekanje; drugi lease možda je još aktivan.                                                  |
| Primatelj odbije domenski preduvjet obrađenim konfliktom                      | Zabilježite razlog blokade i oslobodite odgovarajući lease; izričito popravite preduvjet.           |
| Primatelj neočekivano zakaže                                                  | Ne zaključujte da nije izvršio rad; lease može ostati do isteka, a potvrdu treba uskladiti.         |
| Primatelj potvrdi transakciju, a proizvođač izgubi odgovor ili završni commit | Ponovno uđite s istim ID-jem i digestom izvora; pročitajte potvrdu umjesto dupliciranja posljedice. |
| Vraćena potvrda razlikuje se od zadržane                                      | Blokirajte usklađivanje; ne označavajte proizvođača dovršenim.                                      |

Pregledani izvor odvojeno obrađuje očekivane konflikte i neočekivane iznimke. Ne dokazuje replay nakon rupa u dostavi, distribuirani fencing za svaki zastarjeli worker ni atomarnu transakciju oba vlasnika. Završni uspješni update temelji se na potvrđenom dokazu primatelja; lease nemojte predstavljati kao univerzalni fencing. Postane li poziv udaljen, definirajte autentikaciju transporta, timeout i usklađivanje nepoznatog ishoda, ograničena ponavljanja, dohvat potvrde i oporavak napuštenih leaseova. Pratite [neizvjesne ishode providera](../integrations/uncertain-provider-outcomes.md).

## Scenariji prihvata i antiobrasci

Zahtijevajte jednu posljedicu primatelja za ponovljene podudarne pokušaje, odbijanje promijenjenog digesta, ispravno čekanje uz aktivan lease i oporavak nakon commita primatelja uz izgubljen odgovor. Dovršetak proizvođača mora pasti ako zadržani dokaz potvrde nedostaje ili odstupa. Blokirani preduvjet mora se razlikovati od nepoznatog izvršenja. To su scenariji prihvata dizajna, ne tvrdnja da su provjere izvršene.

Izbjegavajte poziv primatelja uz otvorenu transakciju proizvođača, dijeljenje promjenjivih ORM entiteta, tumačenje timeouta kao rollbacka i dovršavanje mosta samo nakon uspješnog povratka metode. „Potvrđeno” znači da je točan primatelj zadržao točan odnos izvora i rezultata; ne znači da su svi kasniji consumeri dovršili svoj rad.

## Izvori

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceOperatorService.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ApplicationServiceBillingOwner.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServicePeriodService.java`
