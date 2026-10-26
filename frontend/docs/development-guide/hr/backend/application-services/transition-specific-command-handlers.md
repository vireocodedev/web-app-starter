# Svakom prijelazu stanja dajte namjenski command handler

**Status podrške: LMS referentni recept, nije state-machine API predloška.** LMS odvaja lifecycle ulaze od confirm/start/end/cancel handlera. Tipove, ovlasti, transport i mapping projekt implementira namjerno. Prenesite granice, ne operativne pretpostavke.

Obrazac koristite kad generički update dopušta proizvoljan status ili metoda skuplja nepovezane grane. Prijelaz ima preduvjete i učinke; enum assignment samo je dio radnje.

## Facade koordinira imenovane radnje

`LockageLifecycleService` daje transakcijske metode i delegira uskim suradnicima poput `LockageConfirmer`. Pozivatelj vidi operacije, a confirm pravila ostaju odvojena od start/cancel. Ne traži klasu za svaku trivijalnu dodjelu; razdvojite kad postoji politika ili suradnici.

Confirmer provjerava operator scope, already-confirmed, dostupni operational status, registraciju djece i prethodni rad. Unconfirm zasebno traži confirmed i vraća peer fixed stanje.

| Naredba         | Projekt određuje                     |
| --------------- | ------------------------------------ |
| Confirm         | Izvorna stanja, ovlast i readiness   |
| Withdraw        | Je li rad postao nepovratan/zaštićen |
| Start           | Resurs, vrijeme i prethodnike        |
| Complete/cancel | Dokaz, obračun i ovisne učinke       |

Izvor nije potpuna matrica: confirm odbija already-confirmed, ali ne nabraja sva dopuštena stanja. Kasni ongoing check unconfirma dolazi nakon confirmed-only preduvjeta. Projekt iscrpno definira allowed-from.

## Odluka naredbe ostaje vidljiva

**Pseudokod recepta:** projekt implementira aktera, scoped/locked repozitorij, transition pravila, children check, audit i error. Helperi nisu starter API.

```java
@Transactional
public OperationView confirm(UUID id, ConfirmOperation command, Authentication auth) {
    var actor = actors.requireCurrent(auth);
    var operation = operations.lockAuthorized(id, actor);
    revisions.requireExpected(operation.revision(), command.expectedRevision());
    transitions.requireCanConfirm(operation.state());
    prerequisites.requireReady(operation, actor);
    operation.confirm(clock.instant(), actor.id());
    audit.confirmed(operation.id(), actor.id());
    return views.operation(operation, actor);
}
```

Revision/lock predložena su implementacija, ne tvrdnja LMS-a. [Transakcijske naredbe](./transactional-commands.md) određuju granicu, a [revizije/lockovi](../data/revision-conflicts-and-shared-locks.md) konkurenciju. Prijelaz ostaje čitljiv bez dupliciranja infrastrukture.

Ponavljanje traži politiku: isti rezultat, already-applied kvar ili reconciliation. Peer odbija već potvrđeno; ne dokazuje univerzalnu idempotentnost.

## Lokalni uspjeh odvojite od isporuke

Izvor flush potvrdu i UI promjenu prati transportom unutar transakcije uz `catch Throwable`. To je legacy best-effort ograničenje: baza ne poništava remote učinak, swallowed failure nije receipt, a broad fatal catch nije preporuka. Transport je i selektivno ograničen, ne dokazuje opću produkcijsku isporuku.

Obvezni outbound traži trajnu namjeru i [claim/call/reconcile](../integrations/claim-call-reconcile.md). UI hint koristi [commit-aware obavijesti](./commit-aware-notifications.md) s granicama. Povrat DTO-a nije commit ni remote prihvat.

## Kvar i oporavak

Neispunjen preduvjet ne mijenja agregat. Commit confirm uz notification kvar razlikuje lokalno stanje i pending isporuku; ne traži slijepi re-confirm. Zabranjen withdraw nakon obveze treba korektivni tok, ne forsirani enum unatrag.

Command DTO ne prima server vrijeme, aktera ili proizvoljni status. Revision konflikt čuva kontekst, a unavailable action daje siguran reason. Generički set-status ne zaobilazi handler.

## Implementacija i kriteriji

- Eksplicitna stanja i žive ovlasti svake radnje.
- Djeca/prethodnici/resurs provjereni prije promjene.
- Confirm/withdraw imaju vlastite preduvjete i repeat politiku.
- Kvar ne ostavlja djelomičan lokalni prijelaz.
- Konkurencija slijedi revision/lock protokol.
- External uncertainty ima zasebno stanje/oporavak.
- Source best-effort nije durable delivery.

## Točni izvori

- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/lockage/LockageLifecycleService.java` — lifecycle delegacija.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/lockage/LockageConfirmer.java` — confirm/unconfirm i transport ograničenja.
