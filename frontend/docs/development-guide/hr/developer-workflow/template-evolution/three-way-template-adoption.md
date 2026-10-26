# Usporedi immutable baseline, lokalni kod i upstream cilj

Template promjenu pregledaj prema stvarno adoptiranom izvoru, ne samo današnjem upstreamu. Sačuvaj custom kod i ograniči automatiku više od cijelog ljudskog migration plana.

**Reference recept iz Vireo guarded upgradea/adopcije.** RGO starter nema instalirani `vireo upgrade`. Three-way je način pregleda, ne fuzzy merge ni dozvola za peer naredbu.

## Okidač, vlasnik i ugovor

Koristi za template poboljšanje postojeće aplikacije ili framework release. App posjeduje customizacije i applied migracije. Maintainer upravlja baseline/targetom i transformom. Live setup ima zasebnog operatora.

Tri identiteta su B baseline, L lokalno i U target. Samo deklarirani edge/ownership dopušta automatsku zamjenu. Authentic artefakt ne dokazuje sigurnu migraciju svakog appa.

```text
B: adoptirani immutable bajtovi
L: trenutačni app i izmjene
U: pregledani target/transform
             |
      ownership i drift odluka
             |
uska automatika ILI app-owned migration
```

Vireo `baselineState` koristi hashove, ne fuzzy merge. Kod updatea L=U je unchanged, L=B eligible update, odsutni L missing, ostalo conflict. Add/delete imaju vlastite uvjete.

| Managed update        | Odluka                       |
| --------------------- | ---------------------------- |
| Local = target        | Bez prepisivanja.            |
| Local = source        | Pregledani update/transform. |
| Local različit od oba | Refuse drift.                |
| Local nedostaje       | Refuse missing baseline.     |

To ne čuva automatski proizvoljni custom diff. App-owned prilagodbe ostaju review radnje; authentic upstream nije merge recept.

## Dvije adopcijske razine

Upstream Template workflow bira unique immutable successor uz manifest/artifact dokaz pa stvara marked draft i unresolved report. Plan ostaje `upgrade.ready: false` bez neovisnog upgrade dokaza.

Framework draft nije project apply. Objavljeni CLI kasnije dopušta samo deklarirani edge, profil baseline, managed scripts i validne generated ugovore. Candidate je odbijen, app-owned radnje ostaju vidljive u receiptu.

Integrity ne opisuje transform. Novi pin/draft ne opravdava guess overwrite ruta, businessa ili locka.

## Schema i prekidi

Applied migracije i adoptirani kod zadržavaju povijest uz forward promjene. Upgrade ne regenerira potajno entity ili staru production migraciju.

Reference journal prati filesystem writeove; read-only preview odbija neriješen prekid. Recovery nije live DB rollback. Starter ne preuzima taj journal/command bez alata i ugovora.

Manual RGO improvement zato čuva old/current/new source, vlasnike i reviewable diff. Nedostatak edgea znači eksplicitni rad, ne izmišljene metadata tvrdnje.

## Pogreške i odluke

| Opažanje                         | Odluka                                   |
| -------------------------------- | ---------------------------------------- |
| Local ne odgovara hashovima      | Sačuvaj konflikt i pregledaj custom.     |
| Immutable release bez transforma | Draft ostaje unready.                    |
| Lock/app radnje nagađane         | Stvarni owner plan i prihvat.            |
| Target prepisuje migraciju       | Forward schema, ne rewrite.              |
| Interrupted journal              | Točan owner recovery, bez drugog applya. |
| RGO bez Vireo alata              | Manual recept, ne lažni metadata.        |

## Prihvat

Zapiši B/L/U, path ownership, automatski scope, manual radnje i provjere. Sačuvaj custom, issue i migration povijest. Članak ne upgradea, mergea ni oporavlja journal.

Dokumentiraj i granicu između file promjene i ponašanja. Hash targeta potvrđuje bytes, ali ne poslovni prihvat lokalnih ruta ili integracija. Review mora povezati diff s relevantnim callerima, schema poviješću i dopuštenim provjerama. Sačuvani custom kod također nije dokaz da i dalje odgovara novom library ugovoru; kompatibilnost treba stvarni consumer dokaz.

## Izvori

- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:docs/TEMPLATE_RELEASE_ADOPTION.md`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:docs/architecture/generated-code-ownership.md`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:packages/create-vireo/src/project-upgrade.ts`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:scripts/plan-template-adoption.mjs`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:contracts/project-upgrade-policy.json`
