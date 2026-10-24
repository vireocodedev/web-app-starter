# Promjenu smjesti iza capabilityja koji posjeduje ugovor

Sučelje biraj prema ponašanju i lifetimeu, ne praktičnoj datoteci. Kod promjene rutiranja, shared prezentacije i featurea pregledaj dependency smjer i public kompatibilnost.

**Dokumentirana starter arhitektura s receptom.** Frontend `AGENTS.md`, source-map/dependency vodiči i route/navigation skillovi definiraju ownership. Review tablica primjenjuje te ugovore; aktualne upute odlučuju o timu i delegaciji.

## Okidač, vlasnik i ugovor

Koristi pri novoj stranici, reuseu UI-ja, moveu featurea ili promjeni public propa/exporta. Koordinator mapira vlasnike. Paralelni urednici trebaju odvojenu koherentnu odgovornost; i zajednička datoteka mora imati jasno određenog vlasnika integracije.

Ugovor je ponašanje iza namjernog public seama. Page komponira, feature posjeduje proizvod, app daje stabilnu infrastrukturu. Reusable komponenta prima podatke umjesto traženja policyja kroz privatne importe.

## Dependency smjer

```text
main/startup -> app kompozicija
pages        -> public feature/app sučelja
router       -> route policy i adapteri
shell        -> dostavljeni presentation input
features     -> vlastiti modeli, portovi, UI i lifecycle
```

Preko vlasnika koristi `@/`, unutar vlasnika relative import. `index.ts` ima namjerne named exporte, ne `export *`. Predvidljiv naziv ne čini context ili `internal/` javnim.

Direct cross-feature hook iznimka je: named public export i known/unique/acyclic deklaracija u `appFeatures.ts`. UI kompozicija ili injected collaborator obično su jasniji.

## Mali primjer seama

Tri index stranice trebaju iste retke i proizvoljne grupe. Shared komponenta prima prevedeni label, icon, destination i grouping. Catalog/router ih dostavljaju. Prezentacija ne smije sama importati registry ili poslovni inventar da otkrije policy.

Router adapter može protumačiti matched metadata i predati plain data. Feature zadržava validaciju, persistence i state. Reuse vizuala ne prebacuje sve u shell.

Factory dodaj samo ako construction injecta suradnike. Signal registration samo za stvarni application lifetime. Ne stvaraj prazne role foldere ili generički utils vlasnik koji skriva nejasnu odgovornost.

## Review prema promijenjenom ugovoru

| Promjena            | Fokus                                                               |
| ------------------- | ------------------------------------------------------------------- |
| Route/page          | Access, URL, redirect, title, jezici, dev-only.                     |
| Shared public input | Svi pozivatelji i policy/prezentacija granica.                      |
| Move/removal        | Exporti, registracije, jezici, mockovi, testovi, persistence, docs. |
| Auth/CI/release     | Ovlasti, failure i pravila operativnog vlasnika.                    |
| Exemption           | Točan opravdani leaf/edge, ne cijeli direktorij.                    |

Neovisan review koristi kad ga traže aktualne upute ili opravdava public/security/cross-owner rizik uz dostupnu ovlaštenu delegaciju. Mali posao može ostati jednom implementatoru. Tim nije razlog za nekoordinirane provjere.

## Cjelovite izmjene i dokaz

Prije movea prati pozivatelje i runtime/Signal lifecycle. Čuvaj export bez izričite migracije. Optional example briše svoje rute/labele/testove/registracije, ne shared infrastrukturu drugih.

Architecture checker vidi mnoge mehaničke rubove i relative importe. Ne odlučuje je li sučelje minimalno ili vlasnik ispravan. Prolaz nije zamjena dizajn reviewu.

## Pogreške i odluke

| Opažanje                   | Odluka                                      |
| -------------------------- | ------------------------------------------- |
| Shared UI importa registry | Tumači u adapteru i predaj narrow data.     |
| Checker odbija edge        | Prvo razumij ugovor, tek onda uska iznimka. |
| Move ostavlja registraciju | Dovrši lifecycle migraciju.                 |
| Dva urednika isti manifest | Jedan integration owner.                    |
| Public prop kvari caller   | Namjerno migriraj sve pozivatelje.          |
| Factory nema collaborator  | Zadrži jednostavniju strukturu.             |

## Prihvat i inspekcija

Navedi vlasnike, public seam, caller migraciju, review odluke i dopuštene provjere. Ne vraćaj tuđe izmjene; dependency i ponašanje moraju se slagati.

Vlasnički vodiči ostaju autoritet. Članak ne odobrava exemption, infrastrukturu, skill promjenu ili objavu.

## Izvori

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/AGENTS.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/docs/architecture/en/source-map-and-ownership.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/docs/architecture/en/dependency-boundaries-and-imports.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/docs/architecture/en/add-change-or-remove-a-feature.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/docs/architecture/en/tests-mocks-stories-and-architecture-checks.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/.agents/skills/app-route-pages/SKILL.md`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/.agents/skills/app-shell-navigation/SKILL.md`
