# Odvoji setup spremnost od prihvaćenog poslovnog V1

Vodi projekt kroz setup, dogovoreni scope, specifikaciju, implementaciju i release bez zamjene dokaza jedne faze drugom. Deployani skeleton važan je setup, ali nije poslovni proizvod.

**Dokumentirani starter workflow.** `docs/v1-workflow.md` koordinira faze. Initialization, export/specification i release zadržavaju vlastite ugovore. Mapa nije nova automatizacija ni ovlast za sve korake.

## Okidač, vlasnik i ugovor

Koristi pri novom consumeru, resumeu, odabiru baselinea ili procjeni V1 dovršetka. Developer/operator upravlja setupom unutar pisanog opsega. Administrator i designated client upravljaju poslovnim approvalom/lockom. Implementator radi bounded issue; release/acceptance imaju svoje vlasnike.

Priprema nije poslovno odobrenje. Lock ne daje infrastrukturu. Gotova specifikacija nije objavljen issue ili kod. Production health nije prihvaćen poslovni tok.

```text
capability + reviewed developer preparation
             -> ovlašten setup dokaz
                         |
poslovni review -> same-hash approvals -> LOCKED
                         |
             pinned spec + decision/issue graph
                         |
          ovlaštena objava -> implementacija
                         |
               staging poslovni prihvat
                         |
          exact-pair produkcija + handoff
```

Setup i discovery mogu paralelno. Specifikacija treba stvarni initialized context i namjeravani locked baseline; ne mora čekati svaki nepovezani korak.

## Prije mutacije potvrdi consumer

Pregledaj Git origin, identitet, postojeći rad i cjelovite kompatibilne pakete. Sačuvaj završeni setup, privatni resume i podatke. Jedna kopirana skripta bez referenci/metapodataka/alata nije potpuna adopcija.

Initialization koristi reviewed preparation zasebne revizije, signed bounded scope i live readiness. Bare status prikazuje stanja, ne pokreće setup ili export. Plan-only ne postaje execute popunjenim checkboxima.

Izričiti local-only task završava samo lokalni dio. Ne dokazuje CI/deploy/recovery. Pristup i dokazi koji nedostaju ne nadomještaju se template receiptom.

## Zaključaj namjeravani poslovni izvor

Administrator i designated client neovisno odobre isti saved hash pa administrator izričito locka. Dva approvala bez locka nisu gotova faza. Novi draft ne zamjenjuje stari locked source, a tentative odgovor ne postaje confirmed.

Capture bira najvišu verziju `LOCKED` baselinea. Potvrdi da je to namjeravani V1. Čuvaj export bajtove, project/baseline/version/content hash, approval identitet i zaseban file digest. Asset bytes nisu dio export hasha; trebaju vlastitu ovlaštenu dohvat/provenance.

## Specifikacija bez izmišljanja činjenica

Paket sadrži spec, acceptance, odluke, traceability, page map, manifest i implementation workflow. Tehničku delegaciju riješi s rationaleom. `PROPOSED`/`REQUIRES_INPUT` ostaju vidljivi i blokiraju pogođeni task, ne sav neovisan rad.

Strukturna validacija nije semantički review ni client approval. Generation ostavlja implementation unimplemented; ready-for-spec-review nije coding odobrenje.

Klijentski materijal ide u eksplicitni private/nested output, izvan public dashboarda. Generation ne dopušta commit/publish. Issue objava treba target i izričit zahtjev, stable keys/mappings i partial-failure dokaz.

## Ponašanje prije promocije

| Rezultat                 | Granica                                             |
| ------------------------ | --------------------------------------------------- |
| Lokalni startup          | Setup, ne poslovni prihvat.                         |
| CI/protection            | Delivery osnova, ne featurei.                       |
| Validirana specifikacija | Struktura uz zaseban semantic review.               |
| Objavljeni issue         | Execution zapis, ne kod.                            |
| Integrirani PR           | Bounded implementacija, ne nužno cijeli V1.         |
| Zdrav staging            | Runtime readiness; zasebni journeys/roles/failures. |
| Exact-pair produkcija    | Identitet uz smoke/operating/recovery dokaz.        |

`ACCEPTANCE.md` provjerava poslovanje na točnom staging kandidatu uz client prihvat i blokere. Scope approval govori što graditi, ne potvrđuje gotov kod.

Produkcija koristi isti prihvaćeni par bez rebuilda. Migracije, backup, računi i recovery pripadaju operator ugovoru uz očuvane source/run/pair receipte.

## Pogreške i odluke

| Opažanje                            | Odluka                                            |
| ----------------------------------- | ------------------------------------------------- |
| Setup gotov, featurei ne            | Nastavi implementaciju bez V1 completion tvrdnje. |
| Approvali bez locka                 | Dovrši lock prije export odabira.                 |
| Novi draft tijekom codinga          | Čuvaj pinned source; refresh je review.           |
| Alati prolaze, policy otvoren       | Zadrži ciljani decision gate.                     |
| Infrastruktura zelena, journey pada | Poslovni prihvat otvoren.                         |
| Produkcijski par drugi              | Promotion contract pada; uskladi identitet.       |

## Prihvat i handoff

Finalni dokaz uključuje zahtjeve/issues, source/pair, stvarni smoke, operating/access docs, recovery i granice. Consumer setup zapisuje se u njegov runbook.

Vlasnici izvršavaju samo ovlaštene postupke. Članak ne inicijalizira, capturira export, objavljuje issue niti deploya.

## Izvori

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:docs/v1-workflow.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:AGENTS.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/initialize-project/references/contract.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/initialize-project/references/project-status.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/references/export-contract.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/references/specification-contract.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:.agents/skills/discovery-specification/SKILL.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:infrastructure/release/README.md`
