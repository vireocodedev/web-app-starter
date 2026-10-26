# Svaku tvrdnju o dovršetku veži uz izvor i sloj dokaza

Handoff treba reći što je implementirano, opaženo i nepoznato. Source provenance, lokalna provjera, CI i live prihvat različite su tvrdnje s različitim identitetima.

**Dokumentirani workflow s receptom.** Aktualni vlasnici inicijalizacije/specifikacije i CI/release ugovori definiraju receipte i granice stanja. Predloženi handoff ne zamjenjuje njihove sheme.

## Okidač, vlasnik i ugovor

Koristi na kraju taska, pri nastavku tuđeg rada, pregledu specifikacije ili release izvješću. Implementator bilježi source/provjere, operater live/recovery opažanja, a klijent poslovni prihvat.

Dokaz mora opisivati točan kandidat i stvarni sloj. Template receipt nije consumer prihvat. Specifikacija nije implementirani kod. Build nije svaki test ili live deployment.

## Različiti identiteti

| Identitet                               | Svrha                                                   |
| --------------------------------------- | ------------------------------------------------------- |
| Commit/working-tree scope               | Implementirani/pregledani izvor.                        |
| Revizija specifikacije i veza odobrenja | Točan funkcionalni opseg koji je korisnik odobrio.      |
| Referenca izvora i content digest       | Izvorni materijal korišten u intervjuu.                 |
| Identitet paketa i source/body hashevi  | Koji odobreni snapshot i lokalni zadaci čine paket.     |
| Cilj importa, markeri i povezivanja     | Koje stavke paketa odgovaraju stvarnim GitHub issueima. |
| CI SHA/run/attempt                      | Izvršavanje provjere.                                   |
| Frontend/backend digesti                | Release par.                                            |
| Staging receipt/environment transaction | Opaženi host prihvat/mutacija.                          |

Checksum izvora identificira bajtove; ne dokazuje klijentovo odobrenje ni istinitost. Odobrenje specifikacije veže se uz točnu pregledanu reviziju i stvarni korisnikov odgovor prema specification creatoru (`.agents/skills/specification-creator/SKILL.md`). Sama validacija nacrta ne daje odobrenje.

Nastavak koristi spremljene odgovore, otvorene grane i reference izvora. Promjena izvornog materijala ne smije prešutno prepisati odobreni opseg. Revizija čuva prethodnu odobrenu baseline, identificira pogođene zahtjeve i ponovno otvara njihove grane; nepogođene odluke ostaju dostupne.

Vlasnik initialization executiona (`.agents/skills/initialization-execution/SKILL.md`) definira provjeru dovršenog punog setupa. Lokalna provjera validira spremljeni dokaz za ovaj consumer; ne dokazuje trenutačno zdravlje udaljenih servisa.

Lokalni paket issuea vodi specification-to-issues (`.agents/skills/specification-to-issues/SKILL.md`), a naknadnu objavu github-issues-import (`.agents/skills/github-issues-import/SKILL.md`). Hashevi paketa vežu kopirani odobreni izvor, dokaz odobrenja i tijela issuea; dokazuju integritet, ne novo produktno odobrenje ili spremnost za coding. Povezivanje importanog issuea identificira udaljeni zapis, ne napredak implementacije.

Nastavi lokalno generiranje iz odobrenog izvora, a import iz točnog paketa/cilja i usklađenih udaljenih markera. Čuvaj ljudske izmjene i zatvorene issuee. Promijenjena specifikacija traži pregledanu novu reviziju paketa; ne pripisuj stare import dokaze promijenjenom sadržaju. Točno navedi native odnose ili fallback s izričitim referencama.

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

| Opažanje                                         | Odluka                                           |
| ------------------------------------------------ | ------------------------------------------------ |
| Log drugog checkouta/attempta                    | Nije dokaz kandidata.                            |
| Novi source nakon builda                         | Procijeni pogođene provjere.                     |
| Specifikacija odobrena, implementacija nedostaje | Sačuvaj oba stanja bez tvrdnje o dovršenom kodu. |
| Template produkcija prihvaćena                   | Consumer treba vlastite dokaze.                  |
| Slika objavljena, host rezultat nepoznat         | Odvoji uspjeh objave i neizvjesnost deploymenta. |
| Tentative/unanswered source                      | Ne pretvaraj u confirmed.                        |

## Prihvat i inspekcija

Primatelj treba pronaći source, razumjeti odluke, ponoviti dopuštene provjere i nastaviti bez nepotrebnog rada. Odobrene revizije specifikacije, identiteti paketa, povezani kriteriji prihvata, stabilna import povezivanja i stvarni issue/PR linkovi čuvaju identitet zadatka. Privatno stanje intervjua i vjerodajnice ostaju izvan dijeljenih paketa i izvješća.

Vlasnički postupci upravljaju objavom, provjerama, deployem i restoreom. Handoff ne daje ovlast. Članak ne stvara receipt ni mijenja progress.

Aktualni vlasnici: V1 workflow (`docs/v1-workflow.md`), specification creator (`.agents/skills/specification-creator/SKILL.md`) i initialization execution (`.agents/skills/initialization-execution/SKILL.md`). Pinani izvori niže čuvaju povijesno podrijetlo, uključujući uklonjenu export/capture implementaciju. Njezini serverski hashevi i import mappings nisu aktualni preduvjeti specifikacije.

## Izvori

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:docs/v1-workflow.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/references/export-contract.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/references/specification-contract.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/scripts/prepare-output.mjs`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:infrastructure/ci/test_shards.py`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:infrastructure/release/README.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/docs/architecture/en/tests-mocks-stories-and-architecture-checks.md`
