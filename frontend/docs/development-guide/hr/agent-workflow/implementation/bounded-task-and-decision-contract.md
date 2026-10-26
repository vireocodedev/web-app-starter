# Preuzmi jedan ograničen ishod i sačuvaj decision gateove

Prije izmjene pretvori issue ili zahtjev u provjerljiv implementacijski opseg. Razlikuj činjenice, delegirane tehničke odluke i nedostajuće ljudske odgovore bez izmišljanja zahtjeva.

**Dokumentirani workflow s receptom.** V1 workflow i root agent guide definiraju ograničene zadatke, izvore, odluke i prihvat. Kratki radni zapis je preporučeno pomagalo, ne nova shema ni automatizirano odobrenje.

## Okidač, vlasnik i ugovor

Koristi pri claimu leafa, nejasnom zahtjevu ili promjeni više capabilityja. Implementator upravlja code boundaryjem, a product/client vlasnik poslovnim odlukama. Tehničku delegaciju možeš riješiti u razvojnoj ovlasti; pretpostavljeni odgovor ostaje prijedlog.

Ugovor je opažljiv ishod s vlasnikom, prihvatom, ovisnostima, decision gateom i ovlaštenom isporukom. Parent nije automatska izvršna ovisnost. Nacrt specifikacije ili dovršen intervju nije odobrenje za coding.

## Pročitaj izvršni ugovor

Pročitaj stvarni zahtjev ili issue, odobrenu reviziju specifikacije te povezane odluke i kriterije prihvata. Potvrdi vlasništvo, ovisnosti, otvorena produktna pitanja i ovlaštenu isporuku. Kad postoji issue/PR, koristi njegov aktualni zapis; status inicijalizacije i specifikacije ne opisuje napredak implementacije.

Specification creator (`.agents/skills/specification-creator/SKILL.md`) vodi funkcionalno otkrivanje i odobrenje specifikacije. Arhitekturno planiranje, generiranje paketa issuea, objava u tracker i implementacija zasebni su zadaci. Specifikacijski skill ne generira izvršne issuee.

Lokalni paket issuea vodi specification-to-issues (`.agents/skills/specification-to-issues/SKILL.md`), a naknadnu objavu github-issues-import (`.agents/skills/github-issues-import/SKILL.md`). Generiranje zahtijeva točnu odobrenu specifikaciju; lokalni paket čuva kopirani odobreni izvor i dokaz odobrenja, content hasheve, verzionirani manifest, Markdown tijela issuea, labele, ovisnosti i reference izvora. Nedostajuća poslovna pravila vraćaju se na reviziju specifikacije umjesto izmišljanja zahtjeva u issueu.

Čitaj stvarni paket i prihvat zadatka, reference izvora, vlasničku granicu i deklarirane blokere. Parent grupiranje samo ne određuje blokirajući redoslijed. Zadani `needs-triage` znači da je još potreban maintainer review: funkcionalno odobrenje i valjan paket ne dokazuju arhitekturu ili spremnost za agentsku implementaciju.

Za izravni zahtjev ili issue koristan je kratak radni zapis:

```text
Ishod: kategorija je dostupna i postojeći URL-ovi rade.
Vlasnik: presentation input i route kompozicija.
Prihvat: oba jezika, direct URL, breadcrumb, odredišta.
Ovisnosti: postojeći katalog i shared navigacija.
Odluke: nema nove poslovne politike; API migracija je izričita.
Dokaz: dopuštene provjere kandidata i navedeni izostanci.
Isporuka: samo stvarno zatražene publish radnje.
```

To su neutralni primjeri, ne dozvola za push, deploy, podatkovnu promjenu ili refaktor izvan opsega.

## Odluke bez brisanja neizvjesnosti

| Stanje               | Značenje                                   | Posljedica                                                  |
| -------------------- | ------------------------------------------ | ----------------------------------------------------------- |
| `RESOLVED_TECHNICAL` | Obrazloženo rješenje unutar ovlasti        | Zapiši rationale/source/tasks bez lažnog otvorenog blokera. |
| `PROPOSED`           | Pretpostavka za pregled                    | Prikaži učinak i blokiraj posljedični ovisni rad.           |
| `REQUIRES_INPUT`     | Nedostajuća politika, pristup ili konflikt | Zadrži ciljanu odluku, vlasnika i gate.                     |

Delegirani tehnički detalj riješi, ne ostavljaj sve otvoreno. Odobrena revizija specifikacije ne daje prešutan odgovor na naknadno otkriveno poslovno pravilo; pogođenu granu vrati na pregledanu reviziju.

Gornje oznake ilustriraju kategorije odluka, nisu obavezna polja ugrađene issue sheme. Mehaničke provjere ne pretvaraju analitičku pretpostavku u suglasnost klijenta. Potreban je semantički review.

## Najmanji cjeloviti zahvat

Prije odabira datoteka prati pozivatelje i registracije. Mali javni prop može tražiti više potrošača; naslov ne mora. Dovrši ishod s jezicima, linkovima i lifecycleom umjesto jednog izoliranog filea.

Ako otkriješ veću migraciju, izričito opiši boundary. Čuvaj public contract bez odobrene migracije i tuđe nepovezane izmjene.

Neovisan ready posao može nastaviti dok odluka blokira drugi leaf. Zapiši točan ovisni acceptance case. Ne blokiraj cijeli projekt bez potrebe i ne implementiraj nedostajući policy iz intuicije.

## Pogreške i odluke

| Opažanje                      | Odluka                                       |
| ----------------------------- | -------------------------------------------- |
| Parent postoji, blocker ne    | Ne zaključuj redoslijed samo iz hijerarhije. |
| Specifikacija je još nacrt    | Prvo produktni review i ovlast za zadatak.   |
| UI naziv implicira permission | Prijedlog/input gap, ne potvrđeni policy.    |
| Tehnička odluka delegirana    | Riješi uz izvor i rationale.                 |
| Pojavi se nepovezani cleanup  | Odvoji osim nužne koherentne promjene.       |
| Nova baseline tijekom rada    | Sačuvaj source; refresh je zaseban task.     |

## Prihvat i handoff

Dovršen task ima ponašanje, traceability, dopuštene provjere i delivery zapis. Blokiran task ima konkretan owner/question/boundary.

Povezane teme su **Capability vlasnici** i **Source-bound handoff**. Vodič ne claima issue, ne odobrava zahtjeve i ne objavljuje izmjene.

Aktualni vlasnici: V1 workflow (`docs/v1-workflow.md`), agent guide (`AGENTS.md`), specification creator (`.agents/skills/specification-creator/SKILL.md`), specification-to-issues (`.agents/skills/specification-to-issues/SKILL.md`) i github-issues-import (`.agents/skills/github-issues-import/SKILL.md`). Pinani izvori niže opisuju povijesno podrijetlo, uključujući uklonjeni paket vezan uz aplikaciju; nisu njegove aktualne izvršne upute.

## Izvori

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:docs/v1-workflow.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/references/specification-contract.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/SKILL.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/scripts/validate-package.mjs`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:AGENTS.md`
