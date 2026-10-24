# Tipove i runtime entrypoint provjeri iz consumera

Provjeri što TypeScript/Node stvarno resolveaju iz paketa, ne samo library source compile. Alias, nested peer i ambient deklaracija mogu sakriti problem artefakta.

**RGO gate uz Vireo declaration referencu.** Starter koristi RGO root API. Vireo ima svoje subpathove i strict emitted gate. Ta pravila nisu ista.

## Okidač, vlasnik i ugovor

Koristi kad library tip radi samo lokalno, runtime export nedostaje ili augmentation traži maintainer tsconfig. Library upravlja exportima, `.d.ts`, peerovima i environmentom; app compilerom i grafom.

Public runtime/type inventar mora odgovarati stvarno shipanim fileovima. Consumer check ne smije preko aliasa pobjeći u source.

## Export map

RGO je ESM s jednim `.` exportom: `dist/index.d.ts` i `dist/index.js`. Nema podržanog deep importa ni runtime defaulta. Verifier uspoređuje root namespace s source inventarom i traži ispravan razlog odbijanja deep importa.

```text
specifier -> exports -> emitted .d.ts / ESM -> javni ugovor
```

Postojeći dist file nije automatski public path. Vireo može namjerno izlagati subpath; RGO root-only pravilo tamo nije primjenjivo.

## Resolution bez varanja

RGO helper iz template sourcea resolvea ovisnosti prema root deklaracijama umjesto nested instalacije. To je maintainer dokaz, ne consumer path map.

Packed verifier prati reachable declarations, odbija `@/` curenje, provjerava inventar i kompajlira strict NodeNext consumer. Ali koristi `skipLibCheck: true`. Strict zato nije potpuna provjera svih emitted deklaracija uz uključen library check.

Runtime/SSR i browser fixturei zasebno provjeravaju ponašanje. Type program sam ne dokazuje Node import, lazy browser access ili export prisutnost.

## Jača deklaracijska provjera

Vireo referenca čita `types` target svakog exporta iz `dist` i stvara zaseban package TypeScript program s `strict: true`, `skipLibCheck: false`. Worker prijavljuje package-dist dijagnostiku i compiler-level pogreške, bez maskiranja ambient tipovima drugog paketa.

```json
{
  "strict": true,
  "skipLibCheck": false,
  "noEmit": true
}
```

To nije trenutačni RGO setting. Scope workera nije dokaz svih vanjskih dependency tipova ili svih compiler/resolution modova.

Primjeri grešaka su unshipped augmentation, private unique-symbol brand i source `@ts-expect-error` koji ne vrijedi u outputu. Permisivni app compile ih može sakriti.

## Peer i runtime zasebno

Jedna kompatibilna React/MUI instanca izbjegava duplication. Lower peer bound treba stvarni dokaz, ne najnoviju maintainer verziju. RGO ima peer contract i external shared runtime.

SSR-safe import ne dira browser global prerano. Browser poziv i dalje treba failure/cleanup ugovor. Node import ne dokazuje interakciju, story ne dokazuje vanjske tipove.

Koristi stvarni pack/public artefakt, navedi compiler mode i local-peer granice.

## Pogreške i odluke

| Opažanje                    | Odluka                                   |
| --------------------------- | ---------------------------------------- |
| Treba privatni alias        | Popravi artefakt.                        |
| Type postoji, runtime ne    | Uskladi export inventar.                 |
| Source prolazi, `.d.ts` ne  | Pregledaj output/augmentation/brand.     |
| Strict uz skipLibCheck true | Navedi granicu ili pregledani jači gate. |
| Deep path fizički postoji   | Samo admitted exports vrijede.           |
| Node import dira window     | Lazy environment granica.                |

## Prihvat

Zapiši artefakt, exporte, declaration resolution, compiler options, peer graf i stvarne runtime scenarije. Navedi diagnostic scope. Članak ne typechecka, builda ni upgradea peerove.

## Izvori

- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:package.json`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:docs/platform/PUBLIC_MODULE_CONTRACT.md`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:scripts/package/verify-package.mjs`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:scripts/package/verify-typecheck-resolution.mjs`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:scripts/package/declaration-graph.mjs`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:scripts/strict-consumer-types.mjs`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:scripts/strict-consumer-types-worker.mjs`
