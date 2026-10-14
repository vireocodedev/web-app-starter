# Anatomija značajke, nazivi datoteka i javna sučelja

Počnite kompaktno, zatim proširite kada neovisne skupine ili ponovljene uloge
postanu nepregledne.

## Rast iz kompaktnog vlasnika

```text
src/features/development-guide/contacts/
├── index.ts
├── contacts.feature.ts
├── api/
├── components/
├── hooks/
└── models/
```

To je oblik Contactsa, a ne obvezni kostur. Settings grupira imenovane
podsposobnosti u `sections/`; prezentacijska značajka ne treba `.feature.ts`;
značajka bez trajnih ili udaljenih podataka ne treba `api/`.

## Skupine naziva datoteka

| Uloga                     | Konvencija                                                          |
| ------------------------- | ------------------------------------------------------------------- |
| React komponenta/provider | `PascalCase.tsx`, provideri završavaju s `Provider.tsx`             |
| Potrošački hook           | `useName.ts` ili `useName.tsx`                                      |
| API port                  | `<domain>.api.ts`                                                   |
| Adapter                   | `<domain>.api.<adapter>.ts`                                         |
| Query/mutation/ključevi   | `<domain>.query.ts`, `.mutation.ts`, `.querykeys.ts`                |
| Runtime tvornica          | `<feature>.feature.ts`                                              |
| Signal grupa              | `signals/<group>/sig<Group>{,.actions,.effects,.model,.service}.ts` |

## Kada je runtime tvornica opravdana

Dodajte `<feature>.feature.ts` samo kada konstrukcija ubrizgava suradnike ili
bira adapter stabilnog runtimea. Tvornicu i tip izvezite iz `index.ts`, jednu
zamrznutu instancu stvorite u `appFeatures.ts` i dodajte vlasnički
`use<Feature>Feature` hook. Prezentacijske značajke to ne dobivaju radi
simetrije.

## Namjerno javno sučelje

`index.ts` namjerno je javno sučelje. Izvezite samo ono što trebaju stranice,
kompozicija, životni ciklus ili odobrena ovisnost. Konteksti i pomoćna
implementacija ostaju privatni. Granicu vlasnika prijeđite s
`@/features/<feature>`, a unutar značajke ostanite relativni.
