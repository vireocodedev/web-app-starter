# Ograničite scheduled rad i jasno odredite vlasništvo

**Status podrške: potkrijepljen recept s opaženim ograničenjima.** FRED i LMS pokazuju vremensko održavanje i per-resource rad, a Client Discovery ograničeni claim-based poll. Nijedan nije univerzalni scheduler predloška niti dokaz da su svi peer jobovi ograničeni i sigurni kroz replike.

Koristite obrazac za istek, usklađivanje, polling ili cleanup. Timer određuje kada pitati za rad; domena određuje prihvatljivost, transakciju i zaštitu ponovljenog/konkurentnog učinka.

## Odvojite okidanje i poslovno vrijeme

FRED finalizer svake dvije sekunde uspoređuje zadnje telemetry vrijeme s konfiguriranim inactivity timeoutom. Pri završetku koristi zadnji event, ne kasniji poll. Inače bi scheduler kašnjenje povećalo zabilježeno trajanje aktivnosti.

LMS loop ima `fixedRate` pet sekundi iako komentar navodi deset. Konfigurirani interval dodatno ograničava tijelo. Poučite stvarni kod, ne stari komentar. Enabled postavka upravlja vanjskom status integracijom, ali dio lifecycle održavanja radi i kad je isključena; „disabled” ne znači prestanak svakog održavanja.

| Vrijeme           | Značenje                       |
| ----------------- | ------------------------------ |
| Trigger           | Scheduler se probudio          |
| Due/deadline      | Domena kaže da rad možda treba |
| Observed event    | Vanjska činjenica dogodila se  |
| Processing/commit | Aplikacija zabilježila odluku  |

Razlikujte ih u stanju i dijagnostici. Kasni tick ne dopušta izmišljanje novijeg event vremena.

## Ograničite odabir i izolirajte stavku

LMS održavanje izvodi transaction-template granicama po resursu i preskače planiranje u tijeku. To je domain-aware exclusion i mala transakcija. Ipak iterira `findAll`, a FRED učitava aktivnu kolekciju; petlje ne dokazuju database-bounded batch rastućeg projekta.

Provider worker Discoveryja kontrast je: pokušava jednu due operaciju, izmjenjuje owner klase i koristi trajni claim. Lokalni `AtomicBoolean` sprječava overlap iste instance, dok database claim ima drugu ulogu. Prvo provjerava configured capability pa default adapter ne šalje.

**Pseudokod recepta:** projekt implementira due-ID odabir stabilnim redom i plafonom, politiku, budget/cancellation, per-item servis, trajni claim/idempotency i sigurnu failure obradu. Helperi nisu API-ji predloška.

```java
public void poll() {
    if (!policy.enabled()) return;
    var due = repository.nextDueIds(policy.batchLimit());
    for (var id : due) {
        budget.checkCancellation();
        if (budget.exhausted()) break;
        items.processInOwnTransaction(id);
    }
}
```

`items` treba stvarni intercepted servis ili transaction template. Anotirani privatni helper istog objekta ne daje novu transakciju. Trenutačno stanje ponovno provjerite unutar nje jer odabir u međuvremenu zastarijeva.

## Scheduler nije distribuirano vlasništvo

Memory running flag, last-execution vrijeme i sent-notification mapa pripadaju procesu i resetiraju se. Druga replika pokreće vlastiti timer. Ako duplikat smeta, odaberite database claim/lease, lock, unique operation identitet ili pregledanu koordinaciju te idempotentnu radnju.

FRED/LMS loopovi ne pokazuju distribuiran leader election. Jedna lokalna aplikacija ne dokazuje jednog workera produkcije. Serijski loop također ne isključuje HTTP naredbu istog resursa; trebaju zajednički domenski lock/prijelaz.

## Kapacitet i shutdown dio su dizajna

LMS retry executor ima konačan queue, max pool i `CallerRunsPolicy`. Brojke su povijesna peer politika, ne preporuka predloška. Caller-runs opterećuje submitter thread pa može odgoditi scheduler ili HTTP; kompromis pregledajte eksplicitno.

Executor čeka konfigurirani shutdown interval. Komentar o prisilnom ubijanju threadova nije jamstvo same await-termination postavke. Kooperativni cancellation, interrupt i cleanup trebaju implementaciju. Bounded queue ne ograničava payload, trajanje mreže ili database locka.

## Kvar i oporavak

Neuspjela stavka ne označava cijeli batch dovršenim niti briše retry dokaz. Odredite nastavljaju li druge stavke, gdje ostaje failure/next-attempt i kako poison item ne blokira sve. Crash recovery ponovno bira trajno due stanje, ne ovisi o memory „already sent” mapi.

Za vanjski učinak koristite claim/call/reconcile izvan database I/O transakcije. Čisto održavanje drži invarijantu i audit u item transakciji. Izbjegnite golemu transakciju neograničenog scana, timer bez trenutačne politike i spin na trajno nevaljanoj stavci.

## Kriteriji projekta

- Selection, item i tick budžet imaju granice i stabilan red.
- Event i processing vrijeme ostaju odvojeni pri kašnjenju.
- Disabled integracija i potrebno održavanje imaju zasebno značenje.
- HTTP, tick overlap i replike dijele ownership protokol.
- Neuspjela stavka ima oporavak bez tihog dovršavanja ostalih.
- Restart koristi trajno due/claim stanje; memory flag je optimizacija.
- Queue, timeout, cancellation i shutdown tvrdnje odgovaraju kodu.

## Točni izvori

- `FRED/FRED-back@0fc326394fbc785cf50d23155506b444feb92725:src/main/java/hr/rgo/fred/app/flight/DroneFlightFinalizer.java` — timer, event end vrijeme i list ograničenje.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/doris/DorisChamberStateService.java` — cadence, enabled/interval, exclusion i transakcije.
- `LMS/lms-back@6daf0c4f8a02ef7d35a8a1f5129ac0b2d75782ee:src/main/java/hr/rgo/lms/core/AsyncRetryConfig.java` — queue/caller-runs/shutdown, ne forced termination.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BillingProviderWorker.java` — bounded poll, owner izmjena i overlap.
- `client-discovery-app@df1feaef58d52e7e07c12a736aed607e64d7918c:backend/src/main/java/com/vireocode/clientdiscovery/discovery/BillingProviderOperations.java` — trajni due odabir i claim.
