# Čuvajte kapacitet kroz raspodjele i kompenzacijske događaje

**Podrška: referentni recept.** Ledger Client Discoveryja primjer je točnog računanja kapaciteta uz dodavanje trajnih zapisa. Nije instalirani ledger startera ni opći financijski proizvod. Struktura je korisna za neutralne izvore kapaciteta koji se dodjeljuju ciljevima, uz dokazano oslobađanje, storniranje i izvana dovršene povrate.

## Definirajte jednadžbu očuvanja prije endpointa

`BillingLedgerService` računa aktivnu raspodjelu kao originalnu raspodjelu umanjenu za zadržana oslobađanja. Iskoristivi izvorni iznos jest original umanjen za kvalificirana storniranja, potvrđene povrate, rezervirane povrate i aktivne raspodjele. Kapacitet cilja uzima u obzir primijenjeni nenovčani kredit, a restoracije vraćaju tu potrošnju. Traženi povrat, potvrđeni vanjski povrat i oslobođena raspodjela različite su kategorije.

Za neutralan izvor kapaciteta invariant zapišite ovako:

```text
usable = original - reversed - returned - returnReserved - activeAllocations
activeAllocation = allocated - sum(releases)
targetUsed = activeAllocationsToTarget + appliedCredit - restoredCredit
```

Consumer određuje značenje svake veličine. Ne zbrajajte nespojive jedinice i ne tretirajte ograničenje prikaza kao popravak invarianta. Izvorni prikaz primitka negativni nepridruženi iznos prikazuje kao nulu, ali odvojene recovery/pending provjere blokiraju normalnu uporabu. Dokazi se ne mijenjaju da bi prikaz izgledao uravnoteženo.

## Provjerite cijeli zahtjev, uključujući ponovljene ciljeve

Raspodjela provjerava kvalifikaciju izvora, aktualnu politiku, povezanu stranu, prodavatelja/kupca/valutu i odgovarajućeg vlasnika. Svaki redak ne provjerava zasebno prema istom početnom saldu. Cijeli zahtjev akumulira se po cilju, paru dokument/cilj i ukupnom izvoru. Dva pojedinačno prihvatljiva retka zajedno mogu prijeći zajednički cilj pa su `requested.merge` i `requestedDocuments.merge` dio provjere prije inserta.

Ograničenje para važno je kada se cilj pojavljuje u više artefakata: kapacitet cilja i kapacitet naplate određenog artefakta odvojene su granice. Izvor dopušta raspodjelu bez dokumenta samo uz pregledano pravilo. To je domenska politika, ne opća zadana vrijednost. [Točne decimale i zaokruživanje](./exact-decimals-and-rounding-policy.md) posjeduju numerički prikaz; `BigDecimal` ne zamjenjujte floating-point računom ili zaokruženim UI zbrojevima.

Oslobađanje dodaje kompenzacijski zapis i ne smije prijeći trenutačno aktivnu raspodjelu. Helper pretpostavlja da je pozivatelj već parsirao pozitivan iznos; sam provjerava samo gornju granicu. Svaki novi javni ulaz mora imati skalarnu validaciju. Interna metoda sa slabijim preduvjetima nije potpuni javni API.

## Storniranje atomski troši dokaz i popravlja ovisnu uporabu

Storniranje zahtijeva kvalificiranu storniranu izvornu stavku, zadržani pending dokaz i točan izvorni iznos. Već iskorištena transakcija može vratiti identičan zadržani učinak; drukčiji cilj, vrsta, iznos ili valuta sukob su. Oslobađanja moraju pripadati istom izvoru, biti jedinstvena i ne prijeći aktivni iznos. Nakon predloženih oslobađanja preostale raspodjele moraju stati u ostatak nakon storniranja, dovršenih povrata i rezervacija povrata.

Zatim se dodaju oslobađanja, reversed događaj i zapis potrošenog izvornog učinka. Tako ostaje razlog promjene kapaciteta umjesto prepisivanja originala. Kasno storniranje nakon vanjskih povrata može stvoriti obvezu recoveryja; model je čuva i prikazuje. Ne tvrdi da se sredstva ili kapacitet uvijek mogu lokalno vratiti.

## Pozivatelj posjeduje izolaciju i ovlasti

Helperi sami ne uspostavljaju transakciju ili lock. Javni `CustomerBillingService.command` daje transakciju, pristup sortiranim projektima, zajednički ledger mutex, policy lock, reviziju i potvrdu zahtjeva. Zaobilaženje može dopustiti da dvije naredbe vide isti slobodan kapacitet. Slijedite [transakcijske naredbe](../application-services/transactional-commands.md) i [redoslijed lockova i svježe retryje](./lock-order-and-fresh-transaction-retries.md).

Ovaj **pseudokod** zahtijeva consumerov scoped command servis, lockove, decimalni validator, čitanja agregata i trajne događaje:

```text
withinAuthorizedCommand(scope, requestIdentity, expectedRevision):
    lockCapacityOwnersInCanonicalOrder()
    current = reloadCapacityAndRetainedEffects()
    proposed = aggregateRequestBySourceTargetAndPair(command)
    requireAllConservationBounds(current, proposed)
    appendAllocationsOrCompensations(proposed)
    retainReceiptAndAdvanceRevision()
```

Sama transakcija ne serijalizira nezavisna čitanja kapaciteta na svakoj razini izolacije. Svi mutation putovi, uključujući workere i operatorske naredbe, trebaju isti lock protokol. Redizajn s manjim lockovima mora sačuvati invariante među izvorima i ciljevima, ne samo kopirati aritmetiku.

## Pogreška, oporavak i prihvat

Ako storniranje traži više oslobađanja nego što ih je dostavljeno, odbijte cijelu naredbu i ponovno učitajte ovisne raspodjele. Neriješen sukob izvora ili recovery blokira normalnu raspodjelu/povrat. Povrat rezervira kapacitet dok dokaz ne potvrdi izvršenje ili neizvršenje; timeout nije dokaz za oslobađanje.

Definirajte dva retka za isti cilj, dva za isti par artefakt/cilj, konkurentnu potrošnju istog izvora, preveliko oslobađanje, duplikate oslobađanja pri storniranju, identičan/promijenjen potrošeni dokaz, storniranje s otvorenim povratima i kasno storniranje koje otkriva recovery. Pad ne smije ostaviti djelomične kompenzacije, a committed korekcija zadržava original i kompenzaciju. Jedan idempotentan put učinka nije opće exactly-once jamstvo.

## Izvori

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BillingLedgerService.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/CustomerBillingService.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BillingData.java`
