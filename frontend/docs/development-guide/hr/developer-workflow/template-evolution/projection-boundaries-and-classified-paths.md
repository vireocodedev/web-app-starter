# Svaku template putanju klasificiraj prije projekcije

Generated app treba biti pregledana projekcija, ne kopija cijelog flagship repozitorija. Ownership, optional sadržaj i identitet traže izričito pravilo.

**Vireo reference profil, nije instalirani RGO alat.** Primjer dolazi iz projection ugovora, classifiera i creatora. Adopcija u starteru bila bi zasebna implementacija/migracija.

## Okidač i ugovor

Koristi pri generatoru, novoj upstream datoteci ili procurjelom maintainer dokazu. Template vlasnik klasificira; app dobiva dopušten sadržaj i vlastiti identitet.

Svaki path treba determinističku klasu. Novi upstream file ne postaje automatski app-owned zbog direktorija.

| Kategorija              | Značenje                                   |
| ----------------------- | ------------------------------------------ |
| `maintainer-only`       | Isključi governance/operacije.             |
| `historical`            | Isključi stari prihvat.                    |
| `managed`               | Copy s provenanceom i tooling ownershipom. |
| `application-owned`     | Jednokratni copy za app.                   |
| `optional`              | Samo odabrani profil/pravilo.              |
| `substitution-required` | Render app identiteta.                     |

To nisu generated-once/regenerated klase entity generatora. Sličan folder ne znači isti owner svih fileova.

## Precedence

Classifier validira relative path/profil, skuplja exact/prefix match i exactu daje najviši score. Među prefixima pobjeđuje najdulji. Različiti rule ID-evi iste najbolje specifičnosti su pogreška. Missing match daje unclassified, a create loop ga odbija.

```text
pinned path + profil
        |
 exact ili najdulji prefix
        |
jedinstvena klasa ili fail
        |
exclude / copy / optional / render
```

Validator odbija duplicate ID/selectore, nevaljanu kategoriju i identity definiciju. Policy traži jednake bajtove canonical i bundled ugovora.

Dated acceptance može biti historical, integration managed, branding substitution-required. To su primjeri dizajna, ne dodana starter pravila.

## Identitet bez tuđih koordinata

Referenca traži project/display name, bilježi owner/repository/support/security i koristi očite unresolved markere za nezavršene release fieldove. Release check ih odbija.

App ne nasljeđuje framework repo ili kontakte. Support i security su različite odgovornosti. Reusable primjer nema stvarne hostove/račune/UUID-eve.

Marker je nepotpunost, ne default. Zamjena stringa bez potvrđenog vlasništva nije readiness.

## Governance nije product output

Historical receipt vrijedi za upstream izvor i okruženje. Copy bi sugerirao consumer prihvat. Maintainer automatizacija može pretpostaviti pogrešne ovlasti.

Ipak, nemoj slijepo isključiti sve hidden/docs putanje: dio je obvezni app workflow. Pregledani classifier određuje output, ne blanket copy/filter.

## Pogreške i odluke

| Opažanje                        | Odluka                               |
| ------------------------------- | ------------------------------------ |
| Nema pravila                    | Fail i eksplicitna klasifikacija.    |
| Jednaka specifičnost konfliktna | Odbij, ne biraj redoslijed liste.    |
| Uska iznimka                    | Exact/duži prefix uz review.         |
| Bundled contract drift          | Uskladi canonical.                   |
| App ima upstream receipt        | Ispravi projekciju i false evidence. |
| Release marker neriješen        | Release ostaje blokiran.             |

## Prihvat

Pregledaj cijeli pinned inventar, unique klasu, optional izbor i identitet te stvarni output. Happy-path fixture ne dokazuje buduće putanje. Članak ne kopira, klasificira stvarne fileove ili migrira RGO.

Pregled pravila treba uključiti korupcijske slučajeve: novi nepoznati path, dva equally-specific pravila i pogrešan release identitet. Stvarni creator dodatno odbija dvije source datoteke koje bi se projicirale u isto odredište. Zato pojedinačno valjana klasifikacija nije dovoljna bez pregleda izlaznog stabla. Razvojni ignored build artefakti također nisu opravdanje da se neklasificirani sadržaj immutable arhive tiho preskoči.

## Izvori

- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:docs/APPLICATION_PROJECTION.md`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:contracts/application-projection-contract.json`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:packages/create-vireo/src/application-projection-contract.mjs`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:packages/create-vireo/src/index.ts`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:scripts/application-projection-policy.mjs`
