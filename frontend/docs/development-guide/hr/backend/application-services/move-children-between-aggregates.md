# Premještanje djece jedna je autorizirana graph promjena

**Status podrške: LMS recept s authority/concurrency prazninama.** Postojeća djeca uklanjaju staru i dobivaju novu vezu unutar transakcijskih operacija. Predložak nema packing/transfer servis. Source-parent ovlasti, tenant kompatibilnost i lock redoslijed projekt dodaje namjerno.

Obrazac koristite za task/asset/rezervaciju između roditelja. Mijenja oba roditelja i child owning referencu; dva neovisna requesta ne čuvaju invarijantu.

## Prije promjene odredite sve vlasnike

`addConvoys` provjerava target operator scope, stanje i operational status, učitava djecu, helperom uklanja stare veze, dodaje target i provjerava placement. Neuspjeh baca iznimku u transakciji.

Remove helper odbija confirmed/ongoing source i popravlja ostatak. `addSmallCraft` također održava inverse vezu, ali ne dokazuje iste potpune old-parent ovlasti/stanje. Nema opće cross-tenant politike ili canonical lock ordera.

| Granica          | Pravilo projekta                              |
| ---------------- | --------------------------------------------- |
| Child            | Known/unique/permitted i očekivano dodijeljen |
| Source roditelji | Živa ovlast i transferable stanje             |
| Target           | Ovlast, stanje, kompatibilnost i kapacitet    |
| Svi roditelji    | Jedan concurrency/order protokol              |
| Izvedeni layout  | Provjera nakon premještanja                   |

Dopušten target ne daje pravo uzeti tuđe dijete. Svaki source je authority granica, ne samo nullable reference.

## Obje strane držite u jednoj naredbi

Add/remove održavaju parent pointer i position/waiting polja. Transfer nije samo foreign key: popravlja source ostatak i target prema domeni.

**Pseudokod recepta:** projekt implementira graph loader, obje ovlasti, lock order, očekivane veze/revizije, kompatibilnost/kvotu i layout rezultate.

```java
@Transactional
public TransferView move(MoveChildren command, Authentication auth) {
    var actor = actors.current(auth);
    var graph = transfers.lockAuthorizedGraph(command, actor);
    graph.requireExpectedAssignmentsAndRevisions(command);
    graph.requireCompatibleMutableParents();
    for (var child : graph.selectedChildren()) {
        child.parent().detach(child);
        graph.destination().attach(child);
    }
    graph.requireValidSourceAndDestinationLayouts();
    audit.transferred(graph, actor.id());
    return views.transfer(graph, actor);
}
```

Helper mora naći sve sourceove, zaključati canonical redom i ponovno provjeriti veze. Naziv nije implementacija. Koristite [lock/retry obrazac](../data/lock-order-and-fresh-transaction-retries.md) i [transakcijsku naredbu](./transactional-commands.md).

## Rollback vraća i staru dodjelu

Remove/flush starog nije zaseban commit kad vanjska transakcija još traje. Ako target odbije, cijela promjena vraća source. Frontend ne radi remove endpoint pa target endpoint.

`addConvoys` provjerava target placement; projekt provjerava i sve source-repair rezultate. Sam poziv layouta ne dokazuje obradu failure rezultata. Nevaljan zaštićeni layout prekida prije commita.

Entity helper nije access/tenant kontrola. Graph održava model, a politika i database scope ograničavaju veze.

## Kvar i oporavak

Missing/foreign/duplicate/concurrent-reassigned odbija batch bez djelomičnog movea. Ako trebate partial success, dizajnirajte zaseban per-item API, ne slučajan catch u petlji.

Same-parent i retry trebaju pravilo. Attach može resetirati izvedena polja pa source ne dokazuje no-op. Expected source/revision ili operation ID štiti meaningful retry.

UI evente šaljite odabranom commit-aware politikom za sve zahvaćene. Source view refresha nakon uspjeha; failed zadržava cilj bez lažnog detached prikaza.

## Implementacija i kriteriji

- Source/target trenutno ovlašteni i tenant-kompatibilni.
- Unique/known child ima očekivanu vezu pod lockom.
- Protected roditelj odbija premještanje.
- Inverse i izvedeno stanje dosljedni su.
- Kvar bilo kojeg layouta atomski vraća dodjele.
- Same-parent/retry eksplicitni su.
- Response/event opisuje samo prihvaćen graph.

## Točni izvori

- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/lockage/LockagePackingService.java` — transfer, source helper i target placement.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/lockage/LockageService.java` — mali child i praznine.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/lockage/Lockage.java` i `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/convoy/Convoy.java` — inverse/cleanup.
