# Isporuči cjelovit inkrement s istinitim review zapisom

Odaberi pregledan task boundary, sačuvaj nepovezani rad i objavi samo zatražene radnje. Mali inkrement omogućuje razumijevanje ponašanja, dokaza i source identiteta zajedno.

**Source-backed implementacijski recept.** V1 workflow i repozitorijske agentske upute traže ograničen ishod i dokaz dovršetka; objavljeni issues/PRs povezuju izvršni zapis. Commit/checkpoint slijed primjenjuje to pravilo; nije Git automatizacija ni trajna push/merge/deploy dozvola.

## Okidač, vlasnik i ugovor

Koristi za leaf, guide proširenje ili zadatak s commit/push/PR uputom. Implementator priprema kandidat; koordinator upravlja integracijom i publication opsegom. Nakon objave issues/PRs su izvršni zapis. Setup status nije coding progress.

Ugovor je isti inkrement u sourceu, ponašanju, reviewu i dokazu. Commit ne dokazuje checks. Push ne dokazuje uspješan CI. WIP PR nije produkcijski prihvat.

## Granica prema ishodu

Inkrement može dodati shared input sa svim callerima, route family s redirectima/jezicima ili fokusirani bilingual batch. Ne ostavljaj polumigrirano public sučelje samo radi malog commita.

Prije stagea pregledaj branch, diff i tuđi rad. Stageaj task putanje/hunkove, ne sve što postoji u zajedničkom worktreeu. Sačuvaj druge izmjene, a konflikt shared filea riješi s integration ownerom.

```text
Ishod: cjelovita kategorija i paired article navigacija.
Kandidat: pregledani source i relevantni dokazi.
Commit: opis ponašanja za task-owned izmjene.
Objava: postojeći task branch/PR kada je zatraženo.
Sljedeće: bounded ishod ili konkretan blocker.
```

To nije dozvola za novi branch, klijentsku objavu ili issue bez odgovarajućeg opsega.

## Review prije tvrdnje o isporuci

Pregledaj kompatibilnost, source vjernost, jezike i public seam. Materijalni popravci prethode završnim koordiniranim provjerama. Promjena kandidata traži ponovnu procjenu pogođenog dokaza.

Architecture checker ne potvrđuje semantiku, a screenshot ne dokazuje persistence/security. Granice navedi u opisu PR-a.

## Publication i operativna ovlast

| Radnja           | Ishod i granica                                  |
| ---------------- | ------------------------------------------------ |
| Implementacija   | Reviewable kandidat.                             |
| Commit           | Lokalni source checkpoint.                       |
| Push             | Remote branch; CI se provjerava zasebno.         |
| WIP/draft PR     | Površina za review, ne merge odobrenje.          |
| Merge            | Posebna integracija uz ovlast i required checks. |
| Deploy/promotion | Operativni release s artefakt dokazima.          |

Ako korisnik traži commit/push po tasku, primijeni to za taj run. Ako zada timezone/deadline, prati ga i stani na granici. To su privremeni task uvjeti, ne univerzalna Git politika niti provenance implementacije.

Local-only ostaje lokalno. Push ne daje dozvolu za zaštitu grane, deployment dispatch ili objavu privatne specifikacije.

## Opisuj konačni kandidat

Commit/PR vodi konkretnim problemom i novim ponašanjem. Navedi kompatibilnost i stvarne provjere. Ažuriraj naslov/opis kad opseg evoluira, bez napuštenog prvog pristupa kao glavne priče.

Poveži stable key i stvarni izvršni zapis. Predloženi zahtjevi koji čekaju review trebaju dogovor prije ovisne implementacije. Sačuvaj source/decision mapping kod djelomične implementacije capabilityja.

## Pogreške i odluke

| Opažanje                         | Odluka                                       |
| -------------------------------- | -------------------------------------------- |
| Tuđi file u stageu               | Unstage bez reverta tuđeg rada.              |
| Commit uspije, push ne           | Odvoji lokalni checkpoint i remote pad.      |
| CI čeka/pada                     | Ne tvrdi CI-green.                           |
| WIP otvoren                      | Nastavi u opsegu, ne zaključuj merge ovlast. |
| Novi task mijenja stari contract | Pregledaj callere i dokaz.                   |
| Deadline uz nedovršeno           | Sačuvaj napredak i jasno navedi ostatak.     |

## Prihvat i handoff

Navedi ponašanje, opseg, stvarni commit/branch/PR, provjere/izostanke, riješeni review i sljedeći task. Privatni klijentski podaci nisu javni artefakt bez zasebnog izbora.

Vlasnički postupci ostaju autoritet. Članak ne izvršava Git, issue, PR ni deployment.

## Izvori

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:docs/v1-workflow.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/docs/architecture/en/add-change-or-remove-a-feature.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/docs/architecture/en/tests-mocks-stories-and-architecture-checks.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:infrastructure/release/README.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:AGENTS.md`
