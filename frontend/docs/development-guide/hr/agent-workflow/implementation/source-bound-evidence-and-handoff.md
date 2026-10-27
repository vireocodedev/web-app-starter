# Svaku tvrdnju o dovršetku veži uz izvor i sloj dokaza

Handoff treba reći što je implementirano, opaženo i nepoznato. Source provenance, lokalna provjera, CI i live prihvat različite su tvrdnje s različitim identitetima.

**Dokumentirani workflow s receptom.** V1 workflow, repozitorijske agentske upute i CI/release protokoli definiraju vlasništvo dokaza i granice stanja. Predloženi handoff ne zamjenjuje njihove sheme.

## Okidač, vlasnik i ugovor

Koristi na kraju taska, pri nastavku tuđeg rada, reviewu dogovorenih zahtjeva ili release izvješću. Implementator bilježi source/provjere, operater live/recovery opažanja, a klijent poslovni prihvat.

Dokaz mora opisivati točan kandidat i stvarni sloj. Template receipt nije consumer prihvat. Specifikacija nije implementirani kod. Build nije svaki test ili live deployment.

## Različiti identiteti

| Identitet                                  | Svrha                              |
| ------------------------------------------ | ---------------------------------- |
| Commit/working-tree scope                  | Implementirani/pregledani izvor.   |
| Dokument zahtjeva/verzija ili content hash | Odabrani dogovoreni scope.         |
| SHA-256 ulazne datoteke                    | Integritet točnih ulaznih bajtova. |
| CI SHA/run/attempt                         | Izvršavanje provjere.              |
| Frontend/backend digesti                   | Release par.                       |
| Staging receipt/environment transaction    | Opaženi host prihvat/mutacija.     |

Uz checksum navedi točnu datoteku ili canonical payload i način izračuna. Checksum cijele datoteke i servisni payload hash mogu opisivati različite bajtove; uspoređuj ih samo kada ugovor proizvođača potvrđuje ekvivalentnost.

Pri nastavku usporedi zabilježeni izvor sa stvarnim worktreeom i dogovorenim zahtjevima. Sačuvaj dokumente i execution povijest. Izričito zatražen refresh zahtjeva treba review promjene, ne prepisivanje značenja starog dokaza.

## Stanja umjesto jedne kvačice

Razlikuj implemented, locally checked, tests not run, CI pending, staging accepted i production observed. Pad/prekid ostaje vidljiv. Proposal ili rupa u dokazu ne popunjava se starim runom.

```text
Ishod: <opažljivo ponašanje>
Source: <branch/commit ili working-tree scope>
Odluke: <rješenja i pogođeni blokeri>
Dokaz: <naredbe/rezultati i run reference>
Granice: <izostalo/mock-only/poslovni prihvat>
Isporuka: <stvarni commit/push/PR>
Sljedeći owner/action: <bounded nastavak>
```

Ne stavljaj tokene, exporte klijenta, DB redove ili tajne logove. Referenca zaštićenom dokazu često je dovoljna.

## Precizan opseg dokaza

Frontend shard dokazuje konfigurirane non-browser datoteke i validira prijavljene assertione/zbrojeve. Ne prikuplja unaprijed neovisne testcase identitete. Backend dry-run omogućuje jaču provjeru slučajeva. Reci koji je dokaz dobiven.

Architecture checker je mehanički; review ocjenjuje semantiku/vlasništvo. Image smoke koristi jednokratne resurse, host provjerava stvarne slike/rute, a poslovni tok i initialized restore zaseban su prihvat.

Status zastarijeva nakon source promjene ili novog releasea. Veži izvješće uz reviziju/vrijeme i navedi neizvjesnost kod izgubljenog host odgovora.

## Pogreške i odluke

| Opažanje                                       | Odluka                                           |
| ---------------------------------------------- | ------------------------------------------------ |
| Log drugog checkouta/attempta                  | Nije dokaz kandidata.                            |
| Novi source nakon builda                       | Procijeni pogođene provjere.                     |
| Zahtjevi dogovoreni, implementacija nedovršena | Sačuvaj oba stanja.                              |
| Template produkcija prihvaćena                 | Consumer treba vlastite dokaze.                  |
| Slika objavljena, host rezultat nepoznat       | Odvoji uspjeh objave i neizvjesnost deploymenta. |
| Tentative/unanswered source                    | Ne pretvaraj u confirmed.                        |

## Prihvat i inspekcija

Primatelj treba pronaći source, razumjeti odluke, ponoviti dopuštene provjere i nastaviti bez nepotrebnog rada. Stable issue/PR keys i source reference čuvaju execution identitet.

Vlasnički postupci upravljaju objavom, provjerama, deployem i restoreom. Handoff ne daje ovlast. Članak ne stvara receipt ni mijenja progress.

## Izvori

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:docs/v1-workflow.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:infrastructure/ci/test_shards.py`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:infrastructure/release/README.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/docs/architecture/en/tests-mocks-stories-and-architecture-checks.md`
