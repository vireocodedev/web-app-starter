# Popravite zahvaćeni nastavak ovisnog slijeda

**Status podrške: LMS recept s planner ograničenjima.** LMS nakon ranije promjene preračunava kasnije izbore/vremena. Predložak nema sequence planner/graph. Projekt daje kompatibilnost, protected stanja, stabilan poredak i concurrency vlasnika.

Obrazac koristite za red, raspored ili workflow gdje nasljednik ovisi o prethodniku. Jedan edit nije izolirani CRUD: popravlja tentative nastavak ili se odbija radi zaštićene obveze.

## Compatibility repair nije isto što i maintenance

`updateUsage` dopušta planned/fixed, provjerava prethodnika, mijenja item u fixed pa obilazi kasnije confirmed/fixed/planned po vremenu. Kompatibilan postaje prethodnik sljedećeg. Nekompatibilan confirmed ruši radnju; ostali dobivaju default prethodnog stanja.

Putanja čuva confirmed direction/usage. Ne jamči nepromjenjivost svakog polja: zasebni maintenance renumerira pending i mijenja planned times. Ne generalizirajte „confirmed nikad ne mijenja ništa”.

| Područje                | Vlasnik                         |
| ----------------------- | ------------------------------- |
| Susjedna kompatibilnost | Čisto domensko pravilo          |
| Default repair          | Odabir za tentative nasljednika |
| Protected obveza        | State politika odbijanja        |
| Vrijeme/redni broj      | Zasebna derived politika        |
| Konkurencija            | Sequence revision/DB protokol   |

## Hodajte od promjene i čuvajte namjeru

**Pseudokod recepta:** projekt implementira authority/lock, reviziju, stabilnu poziciju, pravila, layout i audit.

```java
@Transactional
public SequenceView change(ChangeStep command, Authentication auth) {
    var sequence = sequences.lockAuthorized(command.sequenceId(), actors.current(auth));
    revisions.requireExpected(sequence.revision(), command.expectedRevision());
    var changed = sequence.requireEditable(command.stepId());
    changed.apply(command);
    var previous = changed;
    for (var next : sequence.orderedSuffixAfter(changed)) {
        if (!compatibility.allowed(previous, next)) {
            if (next.isProtected()) throw new ProtectedSuccessorConflict();
            next.apply(defaults.after(previous));
        }
        previous = next;
    }
    sequence.requireValidAffectedLayouts();
    sequence.advanceRevision();
    return views.sequence(sequence);
}
```

Provjerite i prethodnika edited itema; kratki loop to ne pokazuje, ali zahtjev ostaje. Čista funkcija poput `calculateNextDefault` čini izbor preglednim bez generičkog optimizatora. Split/direction pravila peer su domena.

Koristite [revision/shared-lock](../data/revision-conflicts-and-shared-locks.md) i [lock order](../data/lock-order-and-fresh-transaction-retries.md). Source suffix sortira planned time bez punog equal-time/row-lock protokola. Projekt treba stabilan position/ID i revalidaciju za determinističnu konkurenciju.

## Derived podatke obnovite bez brisanja obveza

Maintenance broji pending slotove, određuje vrijeme iz predecessor readiness i child arrival, dopunjuje minimum budućeg rada i provjerava završetak. Tolerance/default count nisu univerzalni scheduler.

Source široko hvata external-state kvar i koristi default opaženog stanja u daljnjem održavanju. Projekt bira dopušta li nedostatak dokaza planiranje ili traži unknown/blocked. Fallback nije trusted stvarnost.

Promijenjeni layout ide repositionu. Projekt provjerava svaki structured failure; sam poziv ne dokazuje propagaciju. Tentative repair nije pomicanje protected rada niti vanjska nepovratna naredba.

## Kvar i oporavak

Nekompatibilan protected successor vraća raniji edit i sve popravke. Safe konflikt objašnjava ovisnost bez tihog mijenjanja obveze. Editor zadržava prijedlog, ne forsira novu reviziju.

Follow-up planning ide u process-local kolekcije. To nije durable multi-replica planner ni atomic post-commit queue. Za crash survival trebaju trajna namjera/worker; inače dokumentirajte eventualnu obnovu.

Izbjegnite nepotrebno računanje svega, ignoriranje protected, samo display-time order i „queued = verified committed plan”.

## Implementacija i kriteriji

- Edited/predecessor kompatibilni pod ovlasti/revizijom.
- Determinističan nastavak čuva kompatibilne stavke.
- Protected konflikt poništava cijeli edit.
- Default i time/number imaju zasebnu politiku.
- Svaki layout rezultat provjeren je.
- Missing evidence i konkurencija imaju pravilo.
- Local/durable i replica granice planninga točno su navedene.

## Točni izvori

- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/lockage/LockageService.java` — prethodnik, suffix i protected konflikt.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/lockage/LockageLifecycleService.java` — default, maintenance i fallback.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/lockage/LockageRepository.java` — neighbor/suffix order.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/lockage/Lockage.java` — compatibility.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/app/planning/PlanningScheduler.java` — lokalni queue.
