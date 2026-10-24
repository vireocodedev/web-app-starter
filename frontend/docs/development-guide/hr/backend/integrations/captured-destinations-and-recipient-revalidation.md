# Sačuvaj odobreno odredište i ponovno provjeri primatelja

Odredište queued poruke dio je retained intenta, ne promjenjivi lookup pri slanju. Current authority provjerava se bez tihog preusmjeravanja sadržaja novom kontaktu/računu.

**Source-backed reference recept.** `ServiceNoticeService`, grant policy i private provider Client Discoveryja daju mehanizam. Launch provider je unconfigured i nema network slanje. Starter ne sadrži taj API.

## Okidač, vlasnik i ugovor

Koristi kad poruka ovisi o approved recipientu, verziji/templateu i delegaciji. Intent owner čuva route/message, identity owner aktualnu ovlast, provider samo transport.

Captured route mora odgovarati current permitted route na zaštićenoj granici. Novi email/account ne nasljeđuje stari approval.

## Captured route i message

Source sprema contact ID, principal ID i address kroz current grant. Canonical destination/binding ima digest uz message/template, locale, due i idempotency.

```text
reviewed binding + current grant
              |
intent: route + message/digest + version
              |
recipient/binding revalidation
              |
claim -> provider -> reconciliation
```

Row provjerava digest, resource/version, package/binding i artifact metadata. Current-recipient ponovo gradi dopušteno odredište i uspoređuje canonical vrijednosti. Promijenjeni address nije automatski normalizirana jednakost.

Poruka odobrena kontaktu A na X ne ide automatski na Y nakon rebind/address promjene. Novi reviewed intent je zasebna odluka.

## Granice provjere

| Granica       | Izvor                                                     |
| ------------- | --------------------------------------------------------- |
| Retrieval     | Visibility i current recipient, i nakon admin shortcut-a. |
| Binding       | Recipient i točno jedan matching current review.          |
| Claim         | Actor, owner lock, current binding, row lock.             |
| Reconcile     | Lease owner, receipt i current binding.                   |
| Qualification | Točan message/recipient dokaz i procedure/time.           |

Immutable poruka nije trajna disclosure ovlast. Admin visibility ne preskače naknadni current-recipient za bytes. Ne pretvaraj to u univerzalni historical admin read.

## Claim nije remote effect

Claim zadržava token/lease, submission iz captured routea/bytes i uncertainty prije I/O-a. Queued može submit, naknadni reconcile radi lookup stabilnog identiteta umjesto novog intenta.

I/O je izvan transakcije. Nova transakcija provjerava owning lease i binding. Unconfigured daje manual verification; ostala provider opažanja ostaju uncertain u izvoru. Observed nije automatski qualified receipt.

Default nema network poziv. Authenticated provider i vanjski evidence contract zaseban su posao.

## Preostali race

Revoke/rebind može nastati nakon DB provjere, prije remote izvršenja. Lokalni lock/lease ne može atomski zaustaviti vanjski provider. Naknadna provjera sprječava lažnu lokalnu qualification, ne može unsend.

Prilagodba mora definirati dispatch window, idempotency/lookup, moguće cancellation/version i uncertain recovery. Nema potpunog race-free ili exactly-once jamstva.

## Pogreške i odluke

| Opažanje                     | Odluka                                   |
| ---------------------------- | ---------------------------------------- |
| Route/principal odstupa      | Blokiraj bez tihog updatea.              |
| Digest odstupa               | Source reconciliation fail.              |
| Drugi lease owner            | Ne primjenjuj vlastiti rezultat.         |
| Timeout nakon mogućeg slanja | Uncertainty i stabilni lookup.           |
| Revoke tijekom poziva        | Revalidiraj i priznaj residual exposure. |
| Provider observed            | Samo procedure može kvalificirati dokaz. |

## Prilagodba i prihvat

Treba immutable intent/artifact, scoped grant/current identity, canonical compare, transaction/lease i stvarni provider/evidence. Pregledaj route promjenu, expiry, lease, timeout i duplikat.

Neovisan security/source review prethodi integraciji. Članak ništa ne šalje ni autorizira disclosure.

## Izvori

- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceNoticeService.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/ServiceGrantPolicy.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/CommercialGrantPolicy.java`
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/NotificationDeliveryProvider.java`
