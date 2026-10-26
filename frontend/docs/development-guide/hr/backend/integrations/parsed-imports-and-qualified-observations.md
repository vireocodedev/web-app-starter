# Odvojite parsirani uvoz od kvalificiranog opažanja

**Podrška: referentni recept.** Client Discovery pokazuje parsiranje zadržanog izvora i zasebnu odluku o podrijetlu. Servisi i njihovi policy API-ji nisu instalirani u starteru. Primijenite obrazac kada uvezeni zapis kasnije može opravdati raspodjelu kapaciteta, pomak zalihe ili drugu važnu radnju. Uvjerljiv redak nije dokaz tko ga je proizveo.

## Sačuvajte četiri različita identiteta

Vlasnik izvora razlikuje bajtove originalnog artefakta, parsirani izvor, pojedine stavke i zapis verifikacije. `parse` zahtijeva artefakt očekivane klasifikacije i vlasništva source grupe. Prodavatelj i račun iz naredbe moraju odgovarati grupi. Prihvaća se samo jedan ključ i verzija parsera. Parsiraju se zadržani originalni bajtovi, a digest izvora obuhvaća SHA-256 originala, ključ računa, identitet parsera i kanonske stavke. Svaka stavka dobiva i digest vlastitog kanonskog payload-a.

Time se tumačenje veže uz zadržani ulaz. Ne dokazuje se da je datoteka preuzeta od navedene ustanove. Napadač može proizvesti sintaktički izvrstan CSV. Parsiranje stvara izvor i stavke; ne stvara odmah kvalificirane primitke. Normalizirani rezultat ne prepisuje original. [Ograničeni CSV ugovor](../files/bounded-csv-interchange-contracts.md) posjeduje gramatiku, a [digesti i pregledane verzije artefakata](../data/digests-and-reviewed-artifact-versions.md) granice identiteta.

Neutralni primjer jest opažanje dostupnog kapaciteta preuzeto od dobavljača: zadržite originalni paket mjerenja, verziju parsera, normalizirana opažanja i zaseban pregled načina pribavljanja. Checksum otkriva promijenjene bajtove, ne neistinitu tvrdnju o pribavljanju.

## Kvalifikacija veže aktualnu politiku uz točan dokaz

`verify` uspoređuje dostavljeni digest sa zadržanim izvorom i odbija već kvalificiran ili prazan izvor. `currentReview` provjerava aktualnu politiku za svaku valutu stavke i odabrani račun, uključujući autora izvora pri provjeri neovisnosti. Provjerava se i neovisnost originala te opcionalnog normalizacijskog artefakta. Pregledani postupak mora odgovarati ustanovi, verziji parsera i dopuštenom načinu pribavljanja. Svaki iznos mora stati u pregledani broj decimala valute.

Vrijeme pribavljanja ne smije biti u budućnosti. Normalizacija zahtijeva izričito dopuštenje, ispravnu klasifikaciju i source grupu. Verifikacijski dokaz ograničen je na tu grupu. Zadržano podrijetlo bilježi identitete i hash vrijednosti originala i normalizacije, tvrdnju o pribavljanju, pregled postupka, verifikatora, vremena i izjavu. To objašnjava ljudsku/policy kvalifikaciju. Nije kriptografski potpis ustanove ni neovisan dokaz istinitosti svake tvrdnje. Privatna pravila pregleda ne pretvarajte u bezuvjetnu politiku svih consumera.

Tek nakon kvalifikacije implementacija razmatra knjižene ulazne stavke za primitke ili stornirane stavke za dokaz da storniranje čeka odluku. Čekanje storniranja nije dovršeno storniranje. Identitet računa/transakcije provjerava se među kvalificiranim uvozima. Sukob iznosa, valute, smjera, statusa, originalne reference ili računa druge strane zadržava konflikt i blokira normalno korištenje umjesto tihog prepisivanja činjenica.

## Uvedite izričit consumer seam

Ovaj **pseudokod** zahtijeva vlasnike pohrane uvoza, kvalifikacije, autorizacije, rješavanja sukoba i transakcijske naredbe. Ne predlaže instaliranje bankovnog API-ja u generički starter.

```text
parseSource(actor, originalId, formatVersion):
    original = requireScopedOriginal(actor, originalId)
    observations = parseBounded(original.bytes, formatVersion)
    return retainParsed(original.digest, formatVersion, observations)

qualifySource(actor, sourceId, expectedDigest, evidence):
    source = reloadUnderCommandLocks(sourceId)
    requireCurrentAuthority(actor, source.scope)
    requireExactDigest(source, expectedDigest)
    review = requireCurrentProcedure(source, actor, evidence)
    retainQualification(source, review, evidence)
    reconcileQualifiedObservations(source)
```

Javni command owner Client Discoveryja daje transakciju, obuhvat projekata, zajednički mutex, policy lock, reviziju i zadržanu potvrdu zahtjeva. Package-level helperi sami ne uspostavljaju tu granicu. Koristite [transakcijske naredbe](../application-services/transactional-commands.md) i [redoslijed zaključavanja](../data/lock-order-and-fresh-transaction-retries.md); drugi controller ne treba izravno pozivati helper za parse/verify.

## Pogreška i oporavak

Digest mismatch zahtijeva ponovno učitavanje točnog izvora, ne prihvat novog digesta iz klijenta bez pregleda. Istekli ili neusklađeni postupak ostaje nekvalificiran dok se ne dostavi aktualni autorizirani dokaz. Izvor može biti parsabilan i prazan; kvalifikacija ga odbija. Ponovljeni identitet s drukčijim činjenicama zahtijeva usklađenje. Nemojte ga ukloniti deduplikacijom ili sukob prikazati zelenim statusom.

Za oporavak zadržite original i kontekst odluke, pribavite traženi dokaz i pošaljite novu ograničenu naredbu. Ne logirajte originalne financijske ili dobavljačke payloadove. Treba li aplikacija automatski autentificirano preuzimanje od providera, izričito uvedite adapter i ugovor dokaza; ručni pregled iz izvora to ne pruža.

Slučajevi prihvata trebaju razlikovati valjanu datoteku i kvalificirani izvor, promijenjeni original/parser digest, pogrešnu grupu računa, zastarjelu politiku, nedopuštenu normalizaciju, buduće pribavljanje, konflikt identiteta i storniranje koje čeka odluku. Pokažite da pad kvalifikacije poništava izvedene učinke i da novi source ID ne zaobilazi zadržani konflikt iste transakcije.

## Izvori

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BankReconciliationService.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BankStatementV1.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/CustomerBillingService.java`
