# Odabir provjera prema vlasniku uz obvezno izvješće završnog statusa

U monorepozitoriju provjeravaj vlasnike koje promjena zahvaća, ali za svaki pull request objavi pouzdan završni status. Klasifikacija promjena, izvršene provjere i zaštita grane zajedno čine ugovor.

**Ugrađeni obrazac predloška.** Izvor istine su glavni CI workflow i `infrastructure/ci/ci_scope.py`. Riječ je o monorepozitoriju s uparenim frontendom i backendom. Odvojeni repozitoriji i objedinjeni pomoćni poslovi potrošačkih projekata zasebne su varijante.

## Kada primijeniti i tko je vlasnik

Obrazac je koristan kada se frontend i backend mijenjaju neovisno, a infrastruktura utječe na oba. Frontend promjena ne treba trošiti backend kapacitet, ali preskakanje mora biti rezultat uspješne klasifikacije.

Održavatelj aplikacije upravlja odabirom provjera i njihovim naredbama. Infrastrukturni operater upravlja izoliranim kapacitetom izvršitelja. Administrator repozitorija upravlja stvarnom zaštitom glavne grane. Promjena YAML-a sama ne konfigurira poslužitelj ni pravila grane.

Uvjet uspjeha je strog: klasifikacija i prenosive provjere moraju uspjeti; svaki odabrani posao mora uspjeti; svaki nepovezani posao mora biti preskočen. Neuspjeh, otkazivanje i nedostajući rezultat nisu dopuštena zamjena za preskakanje.

## Workflow mora izvijestiti i kada se aplikacija ne mijenja

Ugrađeni workflow pokreće se za PR prema `main`, push na `main` i ručno pokretanje. Nema filtra putanja na razini cijelog workflowa. Takav bi filtar mogao spriječiti nastanak obveznog statusa i zauvijek blokirati dokumentacijski PR.

Lagani posao `changes` izračunava tri booleove vrijednosti bez instalacije aplikacijskih ovisnosti. Neovisni `portable` posao uvijek provjerava prenosive pakete inicijalizacije i dokumentacije. Aplikacijski i infrastrukturni poslovi koriste izlaze klasifikacije. Završni `CI gate` s uvjetom `if: always()` prima sve relevantne rezultate.

```text
PR / push na main / ručno pokretanje
             |
       +-----+------+
       |            |
    changes      portable
       |
 odabrani poslovi vlasnika
       |            |
       +-----+------+
             |
      CI gate uvijek izvijesti
```

Dijagram objašnjava ugovor; nije zamjenski workflow koji treba kopirati.

## Stvarni odabir provjera

| Promjena                                                               | Odabrani poslovi                                                      |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `backend/**`                                                           | Backend slika, smoke provjera i testni shardovi                       |
| `frontend/**`                                                          | Statičke provjere, Storybook, slika, smoke provjera i testni shardovi |
| Ostali `infrastructure/ci/**`                                          | Foundation provjere                                                   |
| `.github/**`, `.vscode/**`, `infrastructure/release/**`                | Svi vlasnici                                                          |
| Definirani CI routing/shard helperi, njihove težine i određeni testovi | Svi vlasnici                                                          |
| `.agents/skills/initialize-project/**`                                 | Svi vlasnici                                                          |
| Dokumentacija izvan aplikacijskih direktorija                          | Portable i završni status                                             |
| Ručno pokretanje ili početni push s nulama kao bazom                   | Svi vlasnici                                                          |

Portable je obvezan u svakom retku. Točan popis posebnih helper putanja nalazi se u funkciji `scope()`. Članak pod `frontend/` odabire frontend jer njegova aplikacijska pripadnost uključuje izgradnju i izvođenje.

Uobičajena usporedba koristi bazu događaja i checkout commit. `git diff --name-only --no-renames` prikazuje staru i novu putanju premještene datoteke, pa premještanje između vlasnika odabire oba. Nedostajući ili neispravan SHA baze jest pogreška. Samo izričito ručno force-all pokretanje ili početna baza od svih nula opravdava puni odabir bez usporedbe.

## Provjeri očekivano stanje svakog posla

```python
expected = "success" if owner_selected else "skipped"
if job_result != expected:
    reject_gate()
```

To je sažeti prikaz pravila. Ugrađeni helper dodatno zahtijeva uspješne `changes` i `portable` poslove te izlaze točno `true` ili `false`. Provjerava sve poslove pridružene vlasniku. Završni workflow zatim provjerava dokaz potpunog izvršavanja shardova; zeleni pojedinačni poslovi nisu dovoljan dokaz obuhvata testova.

CI koristi read-only repozitorijski token i checkout bez zadržanih Git vjerodajnica. Ne objavljuje slike i ne deploya aplikaciju. Novi CI run iste workflow/ref kombinacije može otkazati prethodni. Deployment namjerno ima drukčije pravilo konkurentnosti.

## Pogreške i odluke

| Opažanje                                | Značenje i postupak                                                      |
| --------------------------------------- | ------------------------------------------------------------------------ |
| Obvezni status nikad ne nastane         | Pregledaj triggere i Actions pravila prije promjene zaštite grane.       |
| Klasifikacija ne uspije                 | Ispravi bazu ili izvor; nedostajuće izlaze ne tumači kao false.          |
| Odabrani posao bude otkazan             | Završni status mora pasti; potreban je cjelovit uspješan run.            |
| Nepovezani posao se ipak izvrši         | Pregledaj nesklad selektora i politike, iako je rezultat zelen.          |
| Portable padne na dokumentacijskom PR-u | Obvezni ugovor nije zadovoljen; preskočene aplikacije to ne poništavaju. |
| Novi helper utječe na oba dijela        | Zajedno izmijeni odabir vlasnika i završno provjeravanje.                |

## Prihvat i inspekcija

Za izmjenu pravila pregledaj primjere samo za backend, samo za frontend, oba vlasnika, zajedničku infrastrukturu i dokumentaciju. Provjeri očekivane uspjehe/preskakanja te postojanje završnog statusa. Zasebno pregledaj premještanje datoteka, početni push i ručno puno pokretanje.

Zaštitu grane treba pročitati iz GitHuba: obvezni opaženi `CI gate` vezan uz GitHub Actions, ažuriran PR, pravila i za administratore te zabrana force pusha i brisanja. Predložak ima nula obveznih odobrenja; stroža kompatibilna organizacijska pravila ostaju valjana. Novi projekt ne nasljeđuje ta pravila stvaranjem iz predloška.

Dokaz veži uz konkretan izvor i run. Ovaj članak samo opisuje postupak; ne izvršava provjere, ne mijenja postavke i ne pokreće workflow.

## Izvori

- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:.github/workflows/ci.yml`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:infrastructure/ci/ci_scope.py`
- `vireocode-web-app-starter@785de22420b7ec42c15373522b324f4319b4dfd8:docs/github-ci.md`

Sljedeće teme: **Dokaz potpunog izvršavanja shardova** i **Granica jednokratnog CI izvršitelja**.
