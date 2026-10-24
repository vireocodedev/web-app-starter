# Tolerirajte dodatna response polja bez slabljenja namjere pisanja

**Status podrške: Vireo generated-contract referenca, nije ugrađeni API ovdje.** Renderer daje create/patch/response tipove, Zod i JsonNullable JVM patch. Primjena traži generator/module te mapping/validation; projekt može iste granice implementirati izravno.

Obrazac koristite za additive response i djelomično uređivanje. Reader ignorira nepoznat dodatak, dok write točno izražava namjeru. To ne dopušta nevaljano poznato polje.

## Toleranciju ograničite odabranom dimenzijom

Response `z.object` uklanja nepoznata svojstva, ali čuva tip, enum i null validaciju. Optional domain polje response je explicit nullable; `.nullable()` ne dopušta missing. Novi klijent zato može odbiti stariji odgovor bez novog očekivanog polja.

| Unos                         | Ugovor                    |
| ---------------------------- | ------------------------- |
| Extra response property      | Uklanja se                |
| Pogrešan tip poznatog        | Odbija se                 |
| Deklarirani null             | Prihvaća se               |
| Nedostaje očekivani nullable | Nije automatski dopušteno |
| Novi enum član               | Poznati enum ga odbija    |

Nemojte catchati parse kvar pa vjerovati objektu. Time nestaje trust boundary. Missing/invalid ne pretvarajte u create default.

## Čuvajte omission, null i vrijednost

CreateRequest, PatchRequest i Response odvojeni su. Patch polje može izostati; null čisti optional, a required odbija. JVM koristi `JsonNullable` s contained validacijom i presence mappingom. ID/display response-only polja nisu writable projekcija.

**Pseudokod recepta**, ne ugrađene sheme:

```ts
const PatchRecord = z.object({
  title: z.string().min(1).optional(),
  note: z.string().nullable().optional(),
});

const intent = editor.clearedNote ? { note: null } : editor.changedTitle ? { title: editor.title } : {};
const command = PatchRecord.parse(intent);
```

Projekt implementira dirty/touched, validaciju, adapter i server presence. Grane su ilustracija; stvarna forma šalje više promjena zajedno. Čišćenje je null, ne `undefined` koji JSON obično izostavi.

## Generator ne računa dirty diff

Pinned `ToPatchRequest` nabraja **sve** poznate writable vrijednosti modela, ne promijenjena polja. API prihvaća partial, ali default helper može poslati punu writable projekciju. Precizni dirty intent projekt implementira; PATCH method ga sam ne daje.

I create/patch koriste obični `z.object`, pa nepoznati key može biti stripped. To nije strict unknown-write rejection. Uski DTO/mapper čuvaju server polja, a raw backend treba vlastitu unknown-property politiku, validaciju i ovlasti. Frontend parse nije zaštita od caller bypassa.

Povezana labela response-only ostaje dok write nosi flat ID. Backend autorizira odnos unutar scopea; izostavljena labela ne validira ID.

## Kvar i oporavak

Known-field response kvar integration/compatibility je problem: sačuvajte nespremljen nacrt umjesto partial/default overwritea. Mixed-version treba transitional reader ili deployment red, ne ad-hoc slabljenje null ugovora.

Patch validation/revision konflikt čuva namjeravana polja odvojeno od osvježenog snapshota. Puni write iz novog responsea može prepisati untouched i poništiti zaštitu. Nepoznati response ne šaljite nazad object spreadom.

Izbjegnite jedan DTO za sve smjerove, client server-ID/audit, omission=null i scalar promjenu samo jedne strane. Decimal/time ostaju namjenski ugovori; tolerant reader ne čini ih kompatibilnima.

## Prilagodba i kriteriji

- Response parse uklanja samo odabrane additive podatke.
- Known tip/enum/null kvar ostaje vidljiv.
- Nova polja imaju missing/null rollout.
- Tri write/response tipa i tri patch stanja ostaju odvojena.
- Full projection ili dirty intent svjesna je odluka.
- Backend neovisno provodi writable/scope/validation.
- Recovery čuva nacrt i točnu namjeru.

## Točni izvori

- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:packages/create-vireo/src/entity-renderer.ts` — schemas, API parse, nullable i ToPatchRequest.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-core/src/main/java/com/vireocode/vireo/base/BaseRequestMapper.java` — modeli i ID exclusion.
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:jvm/vireo-core/src/main/java/com/vireocode/vireo/base/JsonNullableMapper.java` — presence i unwrap.
