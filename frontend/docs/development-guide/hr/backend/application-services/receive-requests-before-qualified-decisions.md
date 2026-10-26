# Zaprimite zahtjeve prije kvalificiranih odluka

Odvojite zaprimanje od odlučivanja kada valjan zahtjev mora ostati vidljiv iako dokazi, pregled ili budući datum učinka još nisu razriješeni. Korisnik koji traži završetak generičke upravljane usluge treba potvrdu zaprimanja bez pretvaranja da je tražena promjena već odobrena ili primijenjena.

Ovo je referentni životni ciklus iz `ServiceCancellationService` u Client Discoveryju, a ne instalirani starter API ni prenosiva pravna politika. Prenosiv je niz zasebno zadržanih činjenica: zaprimljeni zahtjev, verificirani izvorni dokaz, kvalificirana odluka i primjena učinka. Posebne klauzule, rokovi i komercijalna pravila consumera nisu zadana pravila drugog projekta.

## Zaprimanje ima vlastite preduvjete i rezultat

`receive` je neovisan o kasnijim provjerama duga, politike i providera pri odlučivanju, ali nije univerzalno bezuvjetan. Zaprimanje kroz račun traži trenutačnu ovlast u opsegu i podržani oblik zahtjeva. Vanjsko zaprimanje traži privilegiranu ovlast, prikladan izvorni artefakt i navedeno vrijeme primitka koje nije u budućnosti. Oba traže odgovarajući redak i prihvaćenu verziju. Nevaljan ili neautoriziran ulaz i dalje se odbija.

Zadržani zahtjev bilježi redak, verziju, točan digest paketa, traženi učinak, izjavu, kanal, ovlast aktera ili vanjski izvor, vrijeme zapisa i eventualno navedeno vrijeme primitka. Kanonski sadržaj dobiva digest. Zahtjevi kroz račun zaprimaju se autenticiranim kanalom; vanjski zapisani zahtjevi najprije čekaju verifikaciju izvora. Zaprimanje bilježi tvrdnju i njezino podrijetlo, a ne završenu poslovnu odluku.

To je važno nakon timeouta. Klijent treba uskladiti zadržanu potvrdu naredbe prije stvaranja drugog zahtjeva. Helper zahtjeva sam ne daje cijeli protokol idempotentnosti; pozivatelj posjeduje transakciju i ugovor potvrde. Pratite [transakcijske naredbe](transactional-commands.md) i [deduplikaciju trajnog primitka](../integrations/durable-ingestion-deduplication.md).

## Kvalificirajte dokaz pa odluku

Za vanjske zahtjeve `qualifyReceipt` veže točan zadržani izvorni artefakt i vlasnički redak, provjerava predloženo vrijeme primitka prema dopuštenim vremenskim granicama i zadržava neovisno kvalificirano opažanje izvora. Predani timestamp ne postaje verificiran samo zato što se uspješno parsira. Izvor razlikuje vrijeme zapisivanja zahtjeva, navedeno vrijeme primitka i kvalificirano verificirano vrijeme primitka.

`qualifyDecision` veže točnu verziju i digest paketa zahtjeva, pregledani dokaz politike i potkrepu, poznato vrijeme primitka, dopušteni ishod i podrijetlo izvora. Neutralna pouka je odlučivanje iz kvalificiranih dokaza za taj zahtjev i verziju, a ne iz trenutačno promjenjivog ekrana politike. Potreba dodatnog pregleda i autorizirani završetak različite su činjenice. Prilagodba mora definirati vlastite ovlasti, neovisnost pregleda, ishode, vremenska pravila i politiku ispravka odluke.

Konceptualni životni ciklus, ne starter enum ili skup metoda:

```text
receivedRequest = retainAuthorizedIntake(exactSourceVersion, request)
verifiedEvidence = qualifySource(receivedRequest, retainedObservation)
decision = qualifyDecision(receivedRequest, verifiedEvidence, reviewedPolicy)
if decision authorizes an effect:
  retainEffect(decision.id, decision.digest, effectiveAt)
when effectiveAt is observed as due:
  retainAppliedMarker(effect.id)
```

Izvorni `apply` traži točan ID odluke, očekivani digest i podudarni zahtjev te prihvaća samo ishod koji autorizira učinak. Zadržava zapis učinkovitog završetka uz izbjegavanje konflikta po identitetu odluke. `applyEnds` odbija budući horizont opažanja i idempotentno bilježi dospjele primjene po identitetu učinka. Zakazivanje učinka zato se razlikuje od zadržavanja činjenice da je učinak nastupio.

## Pogreške i oporavak

| Stanje                                                | Značenje i sljedeći korak                                                 |
| ----------------------------------------------------- | ------------------------------------------------------------------------- |
| Zaprimanje prihvaćeno; vanjski izvor nije verificiran | Zahtjev ostaje vidljiv i čeka kvalifikaciju dokaza.                       |
| Navedeno vrijeme primitka proturječi zadržanom dokazu | Odbijte kvalifikaciju; sačuvajte prvotni zahtjev i pregledajte izvor.     |
| Ishod traži dodatnu procjenu                          | Prikažite potrebu pregleda; ne primjenjujte traženu promjenu.             |
| Digest odluke ili identitet zahtjeva odstupaju        | Odbijte primjenu i razriješite točnu kvalificiranu odluku.                |
| Autorizirani učinak je u budućnosti                   | Zadržite raspored; ne tvrdite da je već primijenjen.                      |
| Ponavlja se primjena poznatog učinka                  | Koristite isti zadržani identitet i oznaku primjene umjesto dupliciranja. |

Helper sam nema anotiranu transakcijsku granicu. Pozivatelj mora osigurati usklađenu autorizaciju, brave, revizije i atomarnost svakog prijelaza. Pad između odvojenih prijelaza treba ostaviti objašnjivo zadržano stanje, a ne potaknuti izmišljanje nedostajućih dokaza. Vezanje digesta obrađuju [digesti i pregledane verzije artefakata](../data/digests-and-reviewed-artifact-versions.md).

## Scenariji prihvata i antiobrasci

Zahtijevajte da autorizirano zaprimanje ostane zadržano kada se kasnija kvalifikacija blokira. Obuhvatite vanjsku tvrdnju koja čeka provjeru, nevaljano vrijeme, odstupanje točne verzije, odluku s dodatnim pregledom, autorizirani budući učinak i ponovljenu dospjelu primjenu. Javni prikazi trebaju otkriti samo polja potrebna za objašnjenje napretka, ne privatne artefakte kvalifikacije. To su budući scenariji prihvata, ne dokaz izvršenja.

Izbjegavajte jedan boolean poput `cancelled`, brisanje odbijenih ili nerazriješenih zahtjeva, poistovjećivanje vremena zapisa s verificiranim primitkom i tiho prepisivanje prošle odluke današnjom politikom. Domenska pravila consumera ne kopirajte kao univerzalne pravne obveze. Prenosivo jamstvo je da svaka faza precizno govori što je zaprimljeno, dokazano, odlučeno i primijenjeno, uz odgovornog vlasnika svakog prijelaza.

## Izvor

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceCancellationService.java`
