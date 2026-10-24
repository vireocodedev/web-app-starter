# Oporavak probaj iz preuzete kopije u izoliranoj bazi

Dokaži da provjereni backup preživi prijenos i obnovi se u jednokratnoj bazi bez dodira live stanja. TOC i checksum su nužni, ali ne dokazuju obnovljenu shemu i inicijalizirane podatke.

**Ugrađeni operaterski postupak.** Release README upravlja probom; `runtime.py` formatom backupa, metapodacima i pinned PostgreSQL slikom. To je readiness postupak, ne automatski restore ni dozvola za prepisivanje produkcije.

## Okidač, vlasnik i ugovor

Koristi prije aktivacije backup timera, nakon relevantne promjene sheme/backupa ili za ovlašten recovery dokaz. Operater upravlja zaštićenim kopijama, scratch resursima, očekivanim dokazom i cleanupom. Aplikacijski vlasnik definira smislen schema/data prihvat bez objave redaka.

Ugovor je restore točno preuzete checksum-matched konačne arhive u vlastitu task bazu bez live mreže, produkcijskih tajni ili trajnog odredišta. Stvarni data-loss recovery zahtijeva zasebnu odluku o backupu, okruženju, volumenu i posljedicama.

## Prvo odaberi dokaz

Zabilježi finalizirani dump i pripadajući `.dump.json`. Ne koristi `.partial` niti pretpostavljaj da je najnoviji naziv inicijaliziran. Potvrdi bytes/SHA-256, initialization i projektno očekivane podatke/brojeve.

Obje datoteke preuzmi verificiranim operator transportom u `0700` direktorij izvan Gita, uz `0600` datoteke. Provjeri preuzete bajtove. Restore druge originalne server kopije ne bi otkrio grešku prijenosa.

Neutralni zapis dokaza može izgledati ovako:

```yaml
archive: <tocan-konacni-naziv>
metadata: <pripadajuci-name.dump.json>
retrievedSha256: <provjereni-sha256>
initialized: true
expectedSchema: <pregledane-Flyway-verzije>
expectedCounts: <privatna-acceptance-referenca>
scratchOwner: <task-specific-label>
```

Primjer je evidencija, ne tajna konfiguracija. Brojevi i verzije dolaze iz ovlaštenog projektnog snapshota, ne iz povijesnog template prihvata.

## Namjerno izoliraj odredište

Postupak koristi task-unique container s pinned PostgreSQL slikom, `--network none`, bez portova, bind mountova i trajnih volumena. Korisnik je `999:999`, root read-only, capabilities uklonjene, uključen no-new-privileges, memory/PID limiti i bounded tmpfs.

PostgreSQL 18 koristi parent `/var/lib/postgresql` volume granicu. Database/socket/temp putanje moraju pisati samo kroz predviđeni tmpfs. Generiraj nove scratch tajne u zaštićenom privremenom envu; ne posuđuj produkcijske.

```text
konačni zaštićeni backup -> preuzeta provjerena kopija
                                      |
                           stdin u točan scratch container
                                      |
                          izolirani PostgreSQL + tmpfs
                                      |
                           schema + initialization dokaz
```

Bez mreže ne znači bez eksplicitnog operator `docker exec` streama. To sprječava slučajnu dostupnu zamjenu baze i komunikaciju s aplikacijama. Postupak i dalje zahtijeva ovlašten Docker pristup podržanog hosta.

## Restore i provjera bez objave podataka

Nakon ograničene readiness provjere postupak šalje preuzetu arhivu u točno scratch ime kroz `pg_restore --exit-on-error --no-owner --no-privileges`. Pogreške ostaju privatne. Nema live odredišta ni neodređenog “restore latest”.

Pregledaj uspješne Flyway verzije, shemu/session tablice i inicijalizirane identitete. Za predložak su korisni enabled korisnici s BCrypt zapisom i queryable session strukture. Buduće poslovne tablice trebaju vlastite kriterije. Ne prikazuj redove, hashove ili privatne vrijednosti u javnom dokazu.

Nulti exit kod bez očekivanih podataka nije potpun prihvat. TOC provjera također ne zamjenjuje restore i query dokaz.

## Cleanup samo vlastitog scratch resursa

Prije uklanjanja provjeri task-specific ownership label točnog kontejnera. Ukloni samo njega i jednokratne tajne/privremene kopije. Izvorni backup i zaštićena preuzeta operator kopija ostaju prema retenciji.

Ako lokalni Docker odbija ograničeni runtime, koristi podržani ovlašteni host. Ne slabi globalni Docker/AppArmor ili uklanjaj zaštitu radi zelenog rezultata. Platformsku prepreku odvoji od valjanosti arhive.

## Pogreške i odluke

| Opažanje                                   | Odluka                                                        |
| ------------------------------------------ | ------------------------------------------------------------- |
| Preuzeti bytes/checksum ne odgovaraju      | Stani prije restorea i provjeri transport/identitet.          |
| Backup je prije inicijalizacije            | Odaberi valjan dokaz ili zabilježi nedostatak.                |
| Scratch ima port ili trajni mount          | Ispravi izolaciju prije importa.                              |
| Restore prođe, shema/podaci nedostaju      | Prihvat pada; privatno istraži snapshot/verzije.              |
| Cleanup label nije očekivan                | Ne briši; razriješi identitet.                                |
| Predložen je restore produkcije radi probe | Odbij širenje opsega; potreban je zaseban recovery pristanak. |

## Prihvat i inspekcija

Sačuvaj netajni identitet arhive/checksuma, retrieval provjeru, scratch ownership, ograničenja, restore rezultat, očekivane query provjere i cleanup. Tajne i customer podaci ostaju privatni.

Proba dokazuje oporavak te preuzete kopije pod tim uvjetima. Ne dokazuje nulti gubitak, offsite pohranu ili automatski rollback. Vlasnik operacije ostaje runbook; članak ne izvršava restore ni stvaranje resursa.

## Izvori

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/README.md`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/release/runtime.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/db/migration/V1__create_users.sql`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:backend/src/main/resources/db/migration/V2__create_sessions.sql`
