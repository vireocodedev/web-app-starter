# Prije retrya razriješi neizvjestan release

Kad zahtjev, kontroler ili završni status padne, najprije utvrdi što je host stvarno promijenio. Sačuvaj identitet izdanja i dokaze prije sljedeće mutacije okruženja.

**Ugrađeni obrazac predloška.** Controller upravlja request journalima i staging receiptima; runtime transakcijom, immutable snapshotom i active stanjem. `infrastructure/release/README.md` upravlja oporavkom. Ne postoji opći automatski replay ni naredba za “brisanje pada”.

## Okidač, vlasnik i ugovor

Primijeni nakon timeouta, restarta, nedovršene zamjene, izgubljenog odgovora ili nesklada statusa i stvarnosti. Operater pregledava pod odgovarajućim environment lockom. Aplikacijski vlasnik odgovara za migracijsku kompatibilnost i forward fix. GitHub status sam ne rješava host mutaciju.

Ugovor je usklađivanje prije retrya: sačuvaj source/run/attempt/pair i usporedi journal sa slikama, bazom i javnim routingom. Ne briši dokaze, pokazivače ili volumene radi novog pokušaja.

## Zasebni vlasnici stanja

| Dokaz                            | Značenje i ograničenje                                                 |
| -------------------------------- | ---------------------------------------------------------------------- |
| `requests/<run>-<attempt>.json`  | Obrada konkretnog zahtjeva; nije povijest baze.                        |
| `<environment>/transaction.json` | Granica zamjene, par, snapshot i prethodno stanje.                     |
| `<environment>/active.json`      | Posljednji prihvaćeni zapis; može zaostajati za djelomičnom zamjenom.  |
| Immutable snapshot               | Točna generirana app konfiguracija, ne proizvoljni repository Compose. |
| Staging receipt                  | Trajni uspješni host prihvat run/attempt/para.                         |
| Kontejneri i baza                | Stvarno izvršavanje i migracije neovisno o izgubljenom odgovoru.       |
| GitHub run/Deployment            | Udaljeno izvješće koje može pasti nakon host uspjeha.                  |

Zapisi su zaštićeni operator dokazi. Pregledaj potrebna polja bez objave tajni.

## Zašto je retry blokiran

Controller zapisuje zahtjev prije runtimea i nakon restarta ne ponavlja postojeći journal automatski. Started može značiti izvršenu mutaciju s izgubljenim odgovorom. Slijepi replay mogao bi primijeniti novu radnju na već promijenjeno stanje.

Runtime odbija prethodnu transakciju osim `success` ili `backup-failed`. Prije nove zamjene provjerava prihvaćene slike/rute i DB readiness. Nakon startupa kandidata Flyway je možda promijenio shemu iako health kasnije pada.

Produkcijski backup failure je uža granica: startup kandidata ostaje blokiran, a runtime pokušava stari backend start. Tek nakon uspješnog recoverya zapisuje `backup-failed`. Ako start ili zapis padne, stanje može ostati blokirajuće. Iz same backup pogreške ne zaključuj da je oporavak uspio.

## Sastavi vremensku crtu dokaza

```text
SHA / request run / attempt / environment
  -> request validiran
  -> digesti povučeni i pregledani
  -> prepared snapshot + transaction
  -> production backup granica
  -> replacing
  -> image/public provjere
  -> active/transaction success
  -> staging receipt i GitHub status
```

Svaki korak označi opaženim, odsutnim ili neizvjesnim. Nedostatak dokaza nije dozvola za optimističnu pretpostavku. Host-executor source i app image source mogu se razlikovati nakon pregledanog operator popravka; zabilježi oba bez promjene image podrijetla.

Usporedi stvarne image ID-eve s namjeravanim digest parom, ne tagom ili nazivom kontejnera. Pregledaj health i javni marker pa DB health/Flyway gdje je mutacija moguća. Stari frontend koji radi ne dokazuje nepromijenjeni backend ili shemu.

## Odluka prema granici

| Opažanje                                   | Odluka                                                          |
| ------------------------------------------ | --------------------------------------------------------------- |
| Zahtjev odbijen prije runtimea             | Ispravi source/ovlast/transport bez slabljenja zaštite.         |
| Pull padne prije zamjene                   | Potvrdi odsutnost app mutacije i čuvaj dokaz pada.              |
| Backup padne, stari backend provjeren radi | Kandidat nije prošao gate; opiši recovery i backup problem.     |
| Replacing ili miješano stanje              | Blokiraj novu mutaciju i pregledaj shemu/kod/runtime.           |
| Host success, GitHub odgovor izgubljen     | Uskladi izvješće bez slijepog ponovnog deploya.                 |
| Stari digest nakon migracije postoji       | To nije dokaz rollback kompatibilnosti; preferiraj forward fix. |
| Predložen restore                          | Potrebna je zasebna data-loss odluka.                           |

Članak namjerno ne nudi korake ručnog uređivanja ledgera. Recovery plan mora imenovati stvarno stanje i ovlaštenu radnju, čuvati audit i uvažavati shemu.

## Ograničena dijagnostika

Koristi netajne controller kategorije i ciljane privatne podatke. Ne objavljuj resolved Compose, env, CMS plaintext, registry login, redove baze ili raw logove. Pad jednog zahtjeva ne daje dozvolu za zaustavljanje drugih projekata ili brisanje shared infrastrukture.

Restore odbacuje promjene nakon recovery točke. Stara slika može biti nekompatibilna s migriranom bazom. To nisu iste odluke kao popravak završnog statusa.

## Prihvat i inspekcija

Oporavak traži slaganje para, DB sheme/healtha, javnog routinga i zaštićenih zapisa ili jasno dokumentiran preostali blocker. Zabilježi request identitet, granicu, odobrenu radnju i završne dokaze bez tajni.

Povezane teme su **Migracijske granice** i **Trajni backup artefakti**. Runbook ostaje autoritet; članak ne ponavlja deployment, mijenja pointer ili vraća bazu.

## Izvori

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/controller.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/runtime.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/client.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md`
