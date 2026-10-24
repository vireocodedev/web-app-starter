# Uskladite owned kolekciju stabilnim identitetom

**Status podrške: LMS recept s eksplicitnim input prazninama.** Completed aggregate update razlikuje postojeće, uklonjene i nove stavke. Entity helperi održavaju vezu. Predložak nema taj model, mapper ili replacement protokol; projekt prvo bira vlasništvo i brisanje.

Obrazac koristite za editor koji šalje cijeli namjeravani skup djece. Replacement nije PATCH omission: nedostajuće postojeće dijete briše se samo po izričitom complete-set ugovoru.

## Razdvojite slučajeve

Source mapira non-null ID-eve pa obilazi stvarnu djecu i uklanja pronađeni ID iz mape. Matching ažurira u mjestu, missing briše repozitorijem, null-ID stvara. Parent/scope/direction i izvedeni položaj određuje owner.

| Identitet unosa                    | Značenje projekta                  |
| ---------------------------------- | ---------------------------------- |
| Owned postojeći                    | Update dopuštenih polja uz isti ID |
| Bez ID-a                           | Novi owned child                   |
| Owned izostavljen iz cijelog skupa | Izričit remove/delete              |
| Unknown/foreign non-null           | Odbiti, ne pogađati create/move    |
| Dupli ID                           | Odbiti malformed naredbu           |

Zadnja dva su adaptation pravila, ne source jamstvo. Unmatched non-null ostaje u mapi bez eksplicitnog errora. `Collectors.toMap` može pasti na duplikatu, ali incidental exception nije siguran client ugovor.

## ID validirajte prije graph promjene

**Pseudokod recepta:** projekt daje parent ovlast, revision/lock, command validaciju, owned lookup, allowlist mapper, remove i audit.

```java
@Transactional
public ParentView replaceChildren(UUID id, ReplaceChildren command, Authentication auth) {
    var parent = parents.lockAuthorized(id, actors.current(auth));
    revisions.requireExpected(parent.revision(), command.expectedRevision());
    var existing = children.indexOwnedBy(parent.id());
    var incoming = commands.requireUniqueIds(command.children());
    commands.rejectUnknownOrForeignIds(incoming, existing.keySet());
    reconciliation.applyCompleteReplacement(parent, existing, incoming);
    invariants.requireValid(parent);
    return views.parent(parent);
}
```

Svaki ID provjerite prije destruktivnog rada. Premještanje je zasebna eksplicitna radnja, ne skriven replacement. Missing/null kolekcija treba ugovor; source očekivane kolekcije izravno streama.

Granice definiraju [transakcijske naredbe](./transactional-commands.md) i [revision konflikti](../data/revision-conflicts-and-shared-locks.md). Ovaj obrazac posjeduje matching i graph promjenu.

## Obje strane i delete politika namjerni su

Parent add/remove/clear ažurira child back-reference i neke position podatke. Replacement eksplicitno briše repo retke, uključujući nested jednog tipa. To nije isto što i unlink ili orphan-removal.

Odaberite detach, soft/hard delete ili povijest. Cascade REMOVE nije popravak mappera. Novi mapped objekt istog ID-a može izgubiti managed/audit/association stanje; ažurirajte postojeći instance dopuštenim poljima.

Helper ne autorizira cross-tenant vezu ni sve client ID-eve. Ostaju FK/scope constrainti. Legacy mapper/DTO nije automatska odluka uvođenja MapStructa/Lomboka.

## Kvar i oporavak

Foreign ID ruši cijelu naredbu bez brisanja legitimne izostavljene djece. Kasni validation/write kvar poništava delete/update/create zajedno. Flush nije commit; UI čuva nacrt do poznatog ishoda.

Stara parent revizija čuva predloženu kolekciju odvojeno od server djece. Blind retry briše tuđe nove stavke. Novi child dobiva stabilan server ID za sljedeći update.

Izbjegnite broad collection mapping, unknown-as-new, client parent ID i duplicate exception umjesto validacije.

## Implementacija i kriteriji

- Endpoint razlikuje complete i partial intent.
- ID-evi su unique/known/owned prije promjene.
- Postojeći identitet ostaje, novi dobiva server ID.
- Omission ima detach/delete/history pravilo.
- Back-reference i izvedena polja ostaju dosljedni.
- Kvar vraća cijeli izvorni graph.
- Stale replacement ne briše konkurentni dodatak.

## Točni izvori

- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/lockage/LockageService.java` — reconcile i unknown-ID praznina.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/lockage/Lockage.java` — inverse helperi/položaj.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/lockage/LockageMapper.java` — projekcija i mapper.
