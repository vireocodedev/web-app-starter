# Dokaži public potrošnju bez maintainer tajni ili workspace linka

Provjeravaj artefakt dostupan novom korisniku, ne samo source koji ga je proizveo. Odvoji lokalni pack od anonymous registry dokaza i privilegirani attestation reader od consumera.

**RGO publication provjere uz širu Vireo referencu.** App koristi public RGO. Maintainer repo ima packed i published verifiere. Vireo gauntlet nije instalirani starter CI ili upgrade.

## Okidač, vlasnik i ugovor

Koristi pri objavi library/initializera, maintainer-only install problemu ili clean-room gateu. Paket owner upravlja koordinatama, verifier izolacijom/dokazom, app poslovnim prihvatom.

Registry tvrdnja zahtijeva točne public koordinate bez tajni i workspace zamjene. Pack je koristan, ali nije public publication dokaz.

| RGO provjera   | Mehanizam                                          | Granica                                        |
| -------------- | -------------------------------------------------- | ---------------------------------------------- |
| Packed package | Offline tarball, files/export/type/runtime         | Linka lokalne peerove; nije potpuno anonymous. |
| Published app  | Fresh cache, prazni npm configi, točan initializer | Version/type/build, ne puni browser/business.  |

Packed verifier provjerava export map, license/peers i izostanak source/test/CSS/map curenja. Local peerovi ubrzavaju kontrolirani check, ali mogu sakriti registry/access problem.

Published verifier čita točnu stabilnu source verziju, stvara public app, radi locked install i provjerava instaliranu platformu. Ne koristi `@/` ili `file:` override.

## Kontrolirani consumer

```text
release -> registry koordinate
                 |
       fresh consumer/config/cache
                 |
        resolution i integrity
                 |
       type/runtime/build scenariji
                 |
         sanitized evidence
```

RGO helper čuva potreban executable/locale/TLS kontekst, ali postavlja blank user/global npm config i zaseban cache. Time uklanja tipične naslijeđene npm tajne/hookove. To nije hostile-code sandbox.

Vireo gauntlet čita npm/Maven/Template iz ecosystem ugovora, daje nove home/cacheove, filtrira PATH i odbija symlink/outside pakete, workspace/file/link lock i Maven Local. To su reference mehanizmi, ne ovdje instalirani default.

## Bez ovlasti u consumeru

Vireo potrošnja nema token i zapisuje sanitized atomic JSON. Zasebni minimalni attestation reader provjerava SBOM bez predaje GitHub tokena consumeru.

Release-tag, verifier i attester source različiti su identiteti. Historical attestation nije current verifier dokaz. Signature/certificate/checksum/ancestry politika pripada owneru; zeleni sažetak je ne prenosi.

Gauntlet pokriva mnogo generated/container/database/upgrade/package scenarija, ali fizički uređaj i product/adopter odluke ostaju ljudske. Warning ne postaje automatski pass.

## Pogreške i odluke

| Opažanje                      | Odluka                                                 |
| ----------------------------- | ------------------------------------------------------ |
| Radi samo maintaineru         | Pregledaj koordinate, access i skrivenu konfiguraciju. |
| Lock ima `file:`/workspace    | Nije public dokaz.                                     |
| Pack koristi local peer       | Navedi granicu; zaseban public gate kad je ovlašten.   |
| Attestation traži token       | Drži reader izvan consumera.                           |
| Device nije opažen            | Zadrži acceptance gap.                                 |
| Verzija ne odgovara artefaktu | Uskladi coordinate/integrity.                          |

## Prihvat

Zabilježi source/release, download resolution/integrity, environment, scenarije i ljudske izostanke. Sam badge/vrijeme nije dokaz. Članak ne instalira, pristupa registryju ili pokreće gauntlet.

Evidence plan treba razlikovati očekivani negativni rezultat od infrastrukturnog pada. Namjerno odbijen deep import ili generator collision nije isti signal kao nedostupni registry. Svaka naredba i structured finding trebaju svoju source/release vezu. Sanitized JSON smije opisati hash, trajanje, exit i ograničenje, ali ne tajne konfiguracije ili privatni output. Povijesni attestation zadržava vlastiti commit identitet i ne postaje dokaz novije implementacije verifiera.

## Izvori

- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:scripts/package/verify-package.mjs`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:scripts/application-template/verify-published-application-template.mjs`
- `rgo-frontend@88c3f4cb18462cad8a2845b773406f4a1008db69:README.md`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:docs/ANONYMOUS_CONSUMER_GAUNTLET.md`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:scripts/anonymous-consumer-gauntlet.mjs`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:scripts/lib/anonymous-consumer-environment.mjs`
- `vireo-starter@ab58e6a045894f1d3a855b41834e4b34c066d8c1:scripts/verify-anonymous-consumer-signed-sboms.mjs`
