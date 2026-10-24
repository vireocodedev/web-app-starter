# Generirajte wire ugovor bez skrivanja kompatibilnosti

**Status podrške: Vireo generator referenca, nije ugrađen u RGO/Spring predložak.** Generator iz entity sheme izvodi transportne artefakte i hash/manifeste. Članak ne instalira DTO-e i check. Primjena/migracija traži vlasnika, ovisnosti, podatke i delivery odluke.

Obrazac koristite za frontend/backend shape drift i pogrešnu pretpostavku da generation znači siguran rollout. Shema čini drift vidljivim; ne odlučuje kompatibilnost starih klijenata, retained podataka i miješanih verzija.

## Znajte vlasnike artefakata

Generator 0.4.0 daje wire-contract schema v2, uz zasebne entity/manifest verzije. Contract opisuje endpoint, tip/null, enum, constraint, create/patch/response i scalar/error značenje. Manifest bilježi schema/contract i file hash.

Full-stack daje backend DTO/controller/migration i frontend schema/adapter. Frontend-only namjerno nema backend/migration i priznaje external adapter precision/error odgovornost. Ne definira tuđi backend.

| Artefakt           | Odgovornost                      |
| ------------------ | -------------------------------- |
| Entity shema       | Canonical generation input       |
| Wire contract      | Transport odabranog targeta      |
| Managed code       | Izvršna granica                  |
| Manifest/check     | Drift recorded critical datoteka |
| Compatibility plan | Verzije, migracija, deployment   |

Checker računa digeste i provjerava critical datoteke, podržavajući odabrane exact stare verzije bez rewritea. Nije potpis zlonamjerno promijenjenog manifesta, health probe ni dokaz CI wiringa.

## Čuvajte scalar značenje

Date koristi `LocalDate` i ISO calendar; timestamp `Instant` i offset ISO. Nullability razlikuje required/optional. Veze pišu flat ID i stabilni relation-name display property, ne target interno display ime.

Decimal wire jest JSON broj uz server `BigDecimal`; long/integer frontend su JavaScript brojevi. To ne čuva proizvoljan exact money ili sav 64-bit raspon. Raniji decimal-string recept drugi je ugovor, ne automatska mogućnost generatora. Precision promjena traži obje strane.

Full-stack `ApiError` ima status/code/message/nullable field map/timestamp. Nije ProblemDetail niti instalirani opći error protokol ovog predloška. Frontend-only adapter normalizira backend pogreške.

## Promjenu pregledajte prije generationa

**Recipe review zapis**, ne input generatora:

```text
Change: add optional response field "note"
Old readers: continue after stripping unknown response fields
New readers: require the documented nullable/missing rollout contract
Writes: keep create/patch intent separate from response-only fields
Data: add the reviewed migration when this application owns the backend
Delivery: choose deployment order and evidence before promotion
```

Nullable response dodatak sigurniji je od required, ali stari backend možda ga izostavi. Novi reader koji traži present-with-null odbija takav odgovor. Odredite rollout redoslijed ili prijelazni reader.

Removal/rename, scalar, uži null, enum i endpoint promjene breaking su. I novi enum member može slomiti staru validaciju. Force/overwrite ne rješava rollout ili retained migraciju.

## Kvar i oporavak

Jednostrana DTO/schema promjena daje drift kad check radi. Ispravite schema/ownership ili namjerno migrirajte/ejectajte; hash ne mijenjajte radi skrivanja ugovora. Customized status nije dozvola uništenja app ponašanja regeneracijom.

Hash check ne dokazuje business ovlasti, konkurenciju, performanse ili vanjski compatibility. Acceptance ostaje vlasniku. Prethodne verzije ostaju razumljive; rewrite metapodataka briše objašnjenje deployed stanja.

## Prilagodba i kriteriji

- Potvrdite stvarnu Vireo/profile primjenu.
- Odvojite entity/wire/manifest/generator verzije.
- Pregledajte method/null/enum/precision/error, ne samo ime.
- Frontend-only ne izmišlja backend garancije.
- Autorizirani check povežite stvarnim workflowom.
- Data i mixed-version rollout imaju plan.
- Generated shape nije potpuna correctness potvrda.

## Točni izvori

- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:packages/create-vireo/src/entity-generator.ts` — target, manifest/hash i verzije.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:packages/create-vireo/src/entity-renderer.ts` — wire i scalar/relation.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-core/src/main/java/com/vireocode/vireo/web/ApiError.java` — reference error.
