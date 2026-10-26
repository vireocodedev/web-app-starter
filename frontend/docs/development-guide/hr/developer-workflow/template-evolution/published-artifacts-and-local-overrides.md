# Razlikuj objavljenu ovisnost od lokalnog kandidata

Utvrdi koristi li app public release ili lokalni tarball. Alias, symlink i pack mogu izlagati različite datoteke uz isti naziv paketa.

**RGO maintainer referenca nad instaliranom granicom.** Starter normalno koristi točan objavljeni RGO. Zasebni RGO repo ima template preview/published provjere; ti skripti nisu instalirani u starteru.

## Okidač, vlasnik i ugovor

Koristi kad fix postoji samo u Storybooku, app vidi stari kod ili preview mijenja manifest. Library vlasnik builda/packa kandidat, app upravlja manifestom/lockom. Privremeni override nije nova release deklaracija.

Ugovor je izričit mode i artefakt: public dokaz koristi registry, candidate poznati pack, a source alias ostaje interni development detalj.

| Mode                   | Dokaz                                 | Granica                                    |
| ---------------------- | ------------------------------------- | ------------------------------------------ |
| Source/Storybook alias | Maintainer source ponašanje           | Može sakriti missing export/type/file.     |
| Packed kandidat        | Izgrađeni tarball u consumeru         | Ne dokazuje registry ni anonymous pristup. |
| Published app          | Public initializer i platform zajedno | Samo stvarni scenariji verifiera.          |

RGO helper builda, packa i instalira u `templates/application` bez spremanja dependency/lock promjene. Snima te datoteke, vraća promijenjene bajtove i prijavljuje neočekivanu mutaciju. Mock env šalje u proces umjesto prepisivanja enva.

Library source fix traži novi build/pack. Template hot reload ne osvježava instaliranu biblioteku.

## Vidljivi override

```text
mode: <published-ili-packed>
package: <naziv i tocna verzija>
artifact: <registry integrity ili tarball>
manifest/lock: <ocuvano ili pregledana promjena>
consumer: <izolirani path>
proof: <stvarni scenariji>
```

Jednak version string ne čini kandidat objavljenim. Bitni su bajtovi i resolution. Public app ne sadrži automatski nebuildani source fix.

Published verifier stvara app točnim initializerom, instalira lock, provjerava verziju platforme te radi type/build. Fresh cache/config i sanitized env daju jači dokaz od aliasa, ali ne puni browser/poslovni prihvat.

## Vlasništvo aplikacije

Manifest/lock su app source. Upgrade ih namjerno mijenja i pregledava. No-save candidate je privremeni maintainer tok, ne razlog za commit `file:`/`link:` ili apsolutne putanje računala.

RGO `@/` nije consumer API. Root export/declaration mora raditi bez library aliasa. Ne kopiraj maintainer tsconfig da sakriješ packaging problem.

Vireo anonymous gauntlet zasebno odbija workspace/file/link i Maven Local. To je reference release model, ne instalacija Vireo alata ovdje.

## Pogreške i odluke

| Opažanje                    | Odluka                                       |
| --------------------------- | -------------------------------------------- |
| Storybook vidi fix, app ne  | Pregledaj rebuild/repack/instalaciju.        |
| Preview mijenja lock        | Preservation error ili pregledana promjena.  |
| Consumer treba `@/`         | Popravi public artefakt.                     |
| Verzija ista, bajtovi drugi | Razlikuj candidate/public integrity.         |
| Lock s lokalnom putanjom    | Ukloni slučajni coupling pregledanim diffom. |
| Published provjera prođe    | Navedi install/type/build granicu.           |

## Prihvat

Zapiši mode, identity, resolution, stanje zaštićenih datoteka i dokaze. Čuvaj custom kod i ukloni override vlasničkim postupkom. Članak ne pokreće install, pack ili registry.

Za nastavak rada ostavi dovoljno dokaza da sljedeći developer može razlikovati stale instalaciju od neispravnog koda. Navedi koji je tarball bio instaliran i treba li novi pack nakon source promjene. Privremeni override ne smije ostati skriven u aplikacijskom locku niti rezultat candidate provjere zamijeniti dokaz stvarno objavljene verzije.

## Izvori

- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/package.json`
- `vireocode-web-app-starter@ffa585acff758020fc7e82e501e35e50876b5316:frontend/package-lock.json`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:README.md`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:scripts/application-template/run-application-template.mjs`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:scripts/package/pack-release-artifact.mjs`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:scripts/package/verify-package.mjs`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:scripts/application-template/verify-published-application-template.mjs`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:docs/ANONYMOUS_CONSUMER_GAUNTLET.md`
